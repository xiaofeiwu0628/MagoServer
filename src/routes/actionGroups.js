import Router from "@koa/router";
import { query } from "../db/pool.js";

export const actionGroupsRouter = new Router({ prefix: "/api/groups" });

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

actionGroupsRouter.get("/", async (ctx) => {
  const userId = ctx.query.user_id != null ? Number(ctx.query.user_id) : NaN;
  if (!Number.isInteger(userId)) {
    ctx.status = 400;
    ctx.body = { ok: false, message: "需要查询参数 user_id（整数）" };
    return;
  }
  const rows = await query(
    `SELECT group_id, group_name, user_id, action_ids, sequence_orders, created_time
     FROM ActionGroups WHERE user_id = ? ORDER BY created_time DESC`,
    [userId]
  );
  ctx.body = { ok: true, data: rows };
});

actionGroupsRouter.get("/:groupId", async (ctx) => {
  const groupId = Number(ctx.params.groupId);
  if (!Number.isInteger(groupId)) {
    ctx.status = 400;
    ctx.body = { ok: false, message: "无效的 group_id" };
    return;
  }
  const rows = await query(
    `SELECT group_id, group_name, user_id, action_ids, sequence_orders, created_time
     FROM ActionGroups WHERE group_id = ?`,
    [groupId]
  );
  if (!rows[0]) {
    ctx.status = 404;
    ctx.body = { ok: false, message: "动作组不存在" };
    return;
  }
  ctx.body = { ok: true, data: rows[0] };
});

actionGroupsRouter.post("/", async (ctx) => {
  const { group_name, user_id, action_ids, sequence_orders } = ctx.request.body || {};
  const uid = Number(user_id);
  if (!group_name || typeof group_name !== "string") {
    ctx.status = 400;
    ctx.body = { ok: false, message: "需要 group_name" };
    return;
  }
  if (!Number.isInteger(uid)) {
    ctx.status = 400;
    ctx.body = { ok: false, message: "需要有效的 user_id" };
    return;
  }
  const ids = normalizeJsonField(action_ids, "action_ids");
  if (!Array.isArray(ids)) {
    ctx.status = 400;
    ctx.body = { ok: false, message: "action_ids 必须为数组" };
    return;
  }
  let seqJson = null;
  if (sequence_orders !== undefined && sequence_orders !== null) {
    const seq = normalizeJsonField(sequence_orders, "sequence_orders");
    if (!Array.isArray(seq)) {
      ctx.status = 400;
      ctx.body = { ok: false, message: "sequence_orders 必须为数组" };
      return;
    }
    seqJson = JSON.stringify(seq);
  }
  const actionIdsJson = JSON.stringify(ids);
  try {
    let result;
    if (seqJson === null) {
      result = await query(
        `INSERT INTO ActionGroups (group_name, user_id, action_ids, sequence_orders)
         VALUES (?, ?, CAST(? AS JSON), NULL)`,
        [group_name, uid, actionIdsJson]
      );
    } else {
      result = await query(
        `INSERT INTO ActionGroups (group_name, user_id, action_ids, sequence_orders)
         VALUES (?, ?, CAST(? AS JSON), CAST(? AS JSON))`,
        [group_name, uid, actionIdsJson, seqJson]
      );
    }
    const rows = await query(
      `SELECT group_id, group_name, user_id, action_ids, sequence_orders, created_time
       FROM ActionGroups WHERE group_id = ?`,
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
});

actionGroupsRouter.patch("/:groupId", async (ctx) => {
  const groupId = Number(ctx.params.groupId);
  if (!Number.isInteger(groupId)) {
    ctx.status = 400;
    ctx.body = { ok: false, message: "无效的 group_id" };
    return;
  }
  const { group_name, action_ids, sequence_orders } = ctx.request.body || {};
  const updates = [];
  const params = [];
  if (group_name !== undefined) {
    updates.push("group_name = ?");
    params.push(group_name);
  }
  if (action_ids !== undefined) {
    const ids = normalizeJsonField(action_ids, "action_ids");
    if (!Array.isArray(ids)) {
      ctx.status = 400;
      ctx.body = { ok: false, message: "action_ids 必须为数组" };
      return;
    }
    updates.push("action_ids = CAST(? AS JSON)");
    params.push(JSON.stringify(ids));
  }
  if (sequence_orders !== undefined) {
    if (sequence_orders === null) {
      updates.push("sequence_orders = NULL");
    } else {
      const seq = normalizeJsonField(sequence_orders, "sequence_orders");
      if (!Array.isArray(seq)) {
        ctx.status = 400;
        ctx.body = { ok: false, message: "sequence_orders 必须为数组" };
        return;
      }
      updates.push("sequence_orders = CAST(? AS JSON)");
      params.push(JSON.stringify(seq));
    }
  }
  if (updates.length === 0) {
    ctx.status = 400;
    ctx.body = { ok: false, message: "无有效更新字段" };
    return;
  }
  params.push(groupId);
  const result = await query(
    `UPDATE ActionGroups SET ${updates.join(", ")} WHERE group_id = ?`,
    params
  );
  if (result.affectedRows === 0) {
    ctx.status = 404;
    ctx.body = { ok: false, message: "动作组不存在" };
    return;
  }
  const rows = await query(
    `SELECT group_id, group_name, user_id, action_ids, sequence_orders, created_time
     FROM ActionGroups WHERE group_id = ?`,
    [groupId]
  );
  ctx.body = { ok: true, data: rows[0] };
});

actionGroupsRouter.delete("/:groupId", async (ctx) => {
  const groupId = Number(ctx.params.groupId);
  if (!Number.isInteger(groupId)) {
    ctx.status = 400;
    ctx.body = { ok: false, message: "无效的 group_id" };
    return;
  }
  const result = await query(`DELETE FROM ActionGroups WHERE group_id = ?`, [groupId]);
  if (result.affectedRows === 0) {
    ctx.status = 404;
    ctx.body = { ok: false, message: "动作组不存在" };
    return;
  }
  ctx.body = { ok: true, message: "已删除" };
});
