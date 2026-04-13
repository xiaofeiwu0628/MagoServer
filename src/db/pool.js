import mysql from "mysql2/promise";
import { db } from "../config.js";

export const pool = mysql.createPool(db);

export async function query(sql, params = []) {
  const [rows] = await pool.execute(sql, params);
  return rows;
}
