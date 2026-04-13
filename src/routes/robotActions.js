import Router from "@koa/router";
import { query } from "../db/pool.js";

export const robotActionsRouter = new Router({ prefix: "/api/actions" });

function normalizeJsonField(value, name) {
  if (value === undefined || value === null) return null;
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      throw Object.assign(new Error(`${name} 必须是合法 JSON`), { status: 400, expose: true });
    }
  }
  return value;
}

robotActionsRouter.get("/", async (ctx) => {
  const userId = ctx.query.user_id != null ? Number(ctx.query.user_id) : NaN;
  if (!Number.isInteger(userId)) {
    ctx.status = 400;
    ctx.body = { ok: false, message: "需要查询参数 user_id（整数）" };
    return;
  }
  const rows = await query(
    `SELECT action_id, user_id, duration, servo_angles, status, image_path, description_text, created_time
     FROM RobotActions WHERE user_id = ? ORDER BY created_time DESC`,
    [userId]
  );
  ctx.body = { ok: true, data: rows };
});

robotActionsRouter.get("/:actionId", async (ctx) => {
  const actionId = Number(ctx.params.actionId);
  if (!Number.isInteger(actionId)) {
    ctx.status = 400;
    ctx.body = { ok: false, message: "无效的 action_id" };
    return;
  }
  const rows = await query(
    `SELECT action_id, user_id, duration, servo_angles, status, image_path, description_text, created_time
     FROM RobotActions WHERE action_id = ?`,
    [actionId]
  );
  if (!rows[0]) {
    ctx.status = 404;
    ctx.body = { ok: false, message: "动作不存在" };
    return;
  }
  ctx.body = { ok: true, data: rows[0] };
});

async function createRobotAction(ctx) {
  const { user_id, duration, servo_angles, status, image_path, description_text } =
    ctx.request.body || {};
  const uid = Number(user_id);
  if (!Number.isInteger(uid)) {
    ctx.status = 400;
    ctx.body = { ok: false, message: "需要有效的 user_id" };
    return;
  }
  if (duration === undefined || duration === null) {
    ctx.status = 400;
    ctx.body = { ok: false, message: "需要 duration" };
    return;
  }
  const angles = normalizeJsonField(servo_angles, "servo_angles");
  if (!Array.isArray(angles)) {
    ctx.status = 400;
    ctx.body = { ok: false, message: "servo_angles 必须为数组" };
    return;
  }
  const servoJson = JSON.stringify(angles);
  try {
    const result = await query(
      `INSERT INTO RobotActions (user_id, duration, servo_angles, status, image_path, description_text)
       VALUES (?, ?, CAST(? AS JSON), ?, ?, ?)`,
      [uid, duration, servoJson, status !== false, image_path ?? null, description_text ?? null]
    );
    const rows = await query(
      `SELECT action_id, user_id, duration, servo_angles, status, image_path, description_text, created_time
       FROM RobotActions WHERE action_id = ?`,
      [result.insertId]
    );
    ctx.status = 201;
    ctx.body = { ok: true, data: rows[0] };
  } catch (e) {
    if (e.code === "ER_NO_REFERENCED_ROW_2") {
      ctx.status = 400;
      ctx.body = { ok: false, message: "user_id 不存在" };
      return;
    }
    throw e;
  }
}

robotActionsRouter.post("/", createRobotAction);
/** 与 POST 等价，便于前端统一使用 PutJson 新建动作 */
robotActionsRouter.put("/", createRobotAction);

robotActionsRouter.patch("/:actionId", async (ctx) => {
  const actionId = Number(ctx.params.actionId);
  if (!Number.isInteger(actionId)) {
    ctx.status = 400;
    ctx.body = { ok: false, message: "无效的 action_id" };
    return;
  }
  const { duration, servo_angles, status, image_path, description_text } = ctx.request.body || {};
  const updates = [];
  const params = [];
  if (duration !== undefined) {
    updates.push("duration = ?");
    params.push(duration);
  }
  if (servo_angles !== undefined) {
    const angles = normalizeJsonField(servo_angles, "servo_angles");
    if (!Array.isArray(angles)) {
      ctx.status = 400;
      ctx.body = { ok: false, message: "servo_angles 必须为数组" };
      return;
    }
    updates.push("servo_angles = CAST(? AS JSON)");
    params.push(JSON.stringify(angles));
  }
  if (status !== undefined) {
    updates.push("status = ?");
    params.push(Boolean(status));
  }
  if (image_path !== undefined) {
    updates.push("image_path = ?");
    params.push(image_path);
  }
  if (description_text !== undefined) {
    updates.push("description_text = ?");
    params.push(description_text);
  }
  if (updates.length === 0) {
    ctx.status = 400;
    ctx.body = { ok: false, message: "无有效更新字段" };
    return;
  }
  params.push(actionId);
  const result = await query(
    `UPDATE RobotActions SET ${updates.join(", ")} WHERE action_id = ?`,
    params
  );
  if (result.affectedRows === 0) {
    ctx.status = 404;
    ctx.body = { ok: false, message: "动作不存在" };
    return;
  }
  const rows = await query(
    `SELECT action_id, user_id, duration, servo_angles, status, image_path, description_text, created_time
     FROM RobotActions WHERE action_id = ?`,
    [actionId]
  );
  ctx.body = { ok: true, data: rows[0] };
});

robotActionsRouter.delete("/:actionId", async (ctx) => {
  const actionId = Number(ctx.params.actionId);
  if (!Number.isInteger(actionId)) {
    ctx.status = 400;
    ctx.body = { ok: false, message: "无效的 action_id" };
    return;
  }
  const result = await query(`DELETE FROM RobotActions WHERE action_id = ?`, [actionId]);
  if (result.affectedRows === 0) {
    ctx.status = 404;
    ctx.body = { ok: false, message: "动作不存在" };
    return;
  }
  ctx.body = { ok: true, message: "已删除" };
});
