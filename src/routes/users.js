import Router from "@koa/router";
import bcrypt from "bcryptjs";
import { query } from "../db/pool.js";

export const usersRouter = new Router({ prefix: "/api/users" });

const USERNAME_MAX = 50;
const EMAIL_MAX = 100;
const PASSWORD_MIN = 6;
const PASSWORD_MAX = 128;

function stripPassword(row) {
  if (!row) return null;
  const { password: _, ...rest } = row;
  return rest;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * 创建用户：校验通过后写入 Users 表（密码 bcrypt 哈希）
 */
export async function createUserHandler(ctx) {
  const body = ctx.request.body || {};
  let { username, password, email } = body;

  if (typeof username === "string") username = username.trim();
  if (typeof email === "string") email = email.trim();
  if (typeof password === "string") password = password.trim();

  if (!username || !password || !email) {
    ctx.status = 400;
    ctx.body = { ok: false, message: "缺少 username、password 或 email" };
    return;
  }
  if (username.length > USERNAME_MAX) {
    ctx.status = 400;
    ctx.body = { ok: false, message: `username 长度不能超过 ${USERNAME_MAX}` };
    return;
  }
  if (email.length > EMAIL_MAX) {
    ctx.status = 400;
    ctx.body = { ok: false, message: `email 长度不能超过 ${EMAIL_MAX}` };
    return;
  }
  if (!EMAIL_RE.test(email)) {
    ctx.status = 400;
    ctx.body = { ok: false, message: "email 格式不正确" };
    return;
  }
  if (password.length < PASSWORD_MIN || password.length > PASSWORD_MAX) {
    ctx.status = 400;
    ctx.body = {
      ok: false,
      message: `password 长度需在 ${PASSWORD_MIN}～${PASSWORD_MAX} 之间`,
    };
    return;
  }

  const client_auth = 0;
  const hash = await bcrypt.hash(password, 10);
  try {
    const result = await query(
      `INSERT INTO Users (username, password, email, client_auth)
       VALUES (?, ?, ?, ?)`,
      [username, hash, email, client_auth]
    );
    const insertId = result.insertId;
    const rows = await query(
      `SELECT user_id, username, email, register_time, last_login_time, client_auth
       FROM Users WHERE user_id = ?`,
      [insertId]
    );
    ctx.status = 201;
    ctx.body = { ok: true, data: rows[0] };
  } catch (e) {
    if (e.code === "ER_DUP_ENTRY") {
      ctx.status = 409;
      ctx.body = { ok: false, message: "用户名或邮箱已存在" };
      return;
    }
    throw e;
  }
}

/** REST 风格：创建用户 */
usersRouter.post("/", createUserHandler);
/** 与 POST / 等价，便于语义化调用 */
usersRouter.post("/register", createUserHandler);

usersRouter.post("/login", async (ctx) => {
  const { username, password } = ctx.request.body || {};
  if (!username || !password) {
    ctx.status = 400;
    ctx.body = { ok: false, message: "缺少 username 或 password" };
    return;
  }
  const rows = await query(
    `SELECT user_id, username, password, email, register_time, last_login_time, client_auth
     FROM Users WHERE username = ?`,
    [String(username).trim()]
  );
  const user = rows[0];
  if (!user || !(await bcrypt.compare(password, user.password))) {
    ctx.status = 401;
    ctx.body = { ok: false, message: "用户名或密码错误" };
    return;
  }
  await query(`UPDATE Users SET last_login_time = CURRENT_TIMESTAMP WHERE user_id = ?`, [
    user.user_id,
  ]);
  ctx.body = { ok: true, data: stripPassword(user) };
});

usersRouter.get("/:userId", async (ctx) => {
  const userId = Number(ctx.params.userId);
  if (!Number.isInteger(userId)) {
    ctx.status = 400;
    ctx.body = { ok: false, message: "无效的用户 ID" };
    return;
  }
  const rows = await query(
    `SELECT user_id, username, email, register_time, last_login_time, client_auth
     FROM Users WHERE user_id = ?`,
    [userId]
  );
  if (!rows[0]) {
    ctx.status = 404;
    ctx.body = { ok: false, message: "用户不存在" };
    return;
  }
  ctx.body = { ok: true, data: rows[0] };
});

usersRouter.patch("/:userId", async (ctx) => {
  const userId = Number(ctx.params.userId);
  if (!Number.isInteger(userId)) {
    ctx.status = 400;
    ctx.body = { ok: false, message: "无效的用户 ID" };
    return;
  }
  const { email, password } = ctx.request.body || {};
  const updates = [];
  const params = [];
  if (email !== undefined) {
    const e = String(email).trim();
    if (!e || e.length > EMAIL_MAX) {
      ctx.status = 400;
      ctx.body = { ok: false, message: `email 无效或长度超过 ${EMAIL_MAX}` };
      return;
    }
    if (!EMAIL_RE.test(e)) {
      ctx.status = 400;
      ctx.body = { ok: false, message: "email 格式不正确" };
      return;
    }
    updates.push("email = ?");
    params.push(e);
  }
  if (password !== undefined && password !== "") {
    const p = String(password).trim();
    if (p.length < PASSWORD_MIN || p.length > PASSWORD_MAX) {
      ctx.status = 400;
      ctx.body = {
        ok: false,
        message: `password 长度需在 ${PASSWORD_MIN}～${PASSWORD_MAX} 之间`,
      };
      return;
    }
    updates.push("password = ?");
    params.push(await bcrypt.hash(p, 10));
  }
  if (updates.length === 0) {
    ctx.status = 400;
    ctx.body = { ok: false, message: "无有效更新字段" };
    return;
  }
  params.push(userId);
  try {
    const result = await query(`UPDATE Users SET ${updates.join(", ")} WHERE user_id = ?`, params);
    if (result.affectedRows === 0) {
      ctx.status = 404;
      ctx.body = { ok: false, message: "用户不存在" };
      return;
    }
  } catch (e) {
    if (e.code === "ER_DUP_ENTRY") {
      ctx.status = 409;
      ctx.body = { ok: false, message: "邮箱已被使用" };
      return;
    }
    throw e;
  }
  const rows = await query(
    `SELECT user_id, username, email, register_time, last_login_time, client_auth
     FROM Users WHERE user_id = ?`,
    [userId]
  );
  ctx.body = { ok: true, data: rows[0] };
});
