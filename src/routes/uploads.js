import Router from "@koa/router";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicRoot = path.join(__dirname, "..", "..", "public");
const uploadsRoot = path.join(publicRoot, "uploads");

export const uploadsRouter = new Router({ prefix: "/api/uploads" });

function extFromDataUrl(dataUrl) {
  const m = String(dataUrl).match(/^data:image\/(\w+);base64,/i);
  if (!m) return "png";
  const t = m[1].toLowerCase();
  if (t === "jpeg") return "jpg";
  return t === "png" || t === "webp" || t === "gif" ? t : "png";
}

function dataUrlToBuffer(dataUrl) {
  const s = String(dataUrl);
  const idx = s.indexOf("base64,");
  if (idx === -1) throw Object.assign(new Error("需要 data:image/...;base64,... 格式"), { status: 400, expose: true });
  const b64 = s.slice(idx + "base64,".length);
  return Buffer.from(b64, "base64");
}

/** 接收画布截图等：{ image_data_url, user_id? }，保存到 public/uploads 并返回可访问路径 */
uploadsRouter.post("/image", async (ctx) => {
  const { image_data_url } = ctx.request.body || {};
  if (!image_data_url || typeof image_data_url !== "string") {
    ctx.status = 400;
    ctx.body = { ok: false, message: "需要 image_data_url（data URL）" };
    return;
  }
  let buf;
  try {
    buf = dataUrlToBuffer(image_data_url);
  } catch (e) {
    ctx.status = e.status || 400;
    ctx.body = { ok: false, message: e.message || "图片解析失败" };
    return;
  }
  if (buf.length > 8 * 1024 * 1024) {
    ctx.status = 413;
    ctx.body = { ok: false, message: "图片过大（最大 8MB）" };
    return;
  }
  const ext = extFromDataUrl(image_data_url);
  const dir = path.join(uploadsRoot, "actions");
  await fs.mkdir(dir, { recursive: true });
  const name = `${Date.now()}_${Math.random().toString(36).slice(2, 10)}.${ext}`;
  const abs = path.join(dir, name);
  await fs.writeFile(abs, buf);
  const webPath = `/uploads/actions/${name}`;
  ctx.status = 201;
  ctx.body = { ok: true, data: { path: webPath } };
});
