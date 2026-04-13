# 用户模块 API 文档

本文档描述基于 Koa 的 **Users（用户）** 相关 HTTP 接口，与数据库表 `Users` 字段一致。

## 通用约定

| 项 | 说明 |
|----|------|
| **Base URL** | 部署后根地址，例如 `http://127.0.0.1:3000` |
| **前缀** | 所有用户接口路径均以 `/api/users` 开头 |
| **请求体格式** | `Content-Type: application/json` |
| **字符编码** | UTF-8 |
| **时间字段** | 响应中的 `register_time`、`last_login_time` 一般为 ISO 8601 字符串（取决于 MySQL 与驱动配置） |

### 统一响应结构

**成功（含 201 创建成功）**

```json
{
  "ok": true,
  "data": { }
}
```

**失败**

```json
{
  "ok": false,
  "message": "错误说明（中文）"
}
```

部分 5xx 错误在非生产环境可能额外包含 `detail` 字段（调试用途）。

---

## 数据模型：User（响应中的 `data`）

对应表 `Users`，**响应中从不返回 `password` 明文或哈希**。

| 字段 | 类型 | 说明 |
|------|------|------|
| `user_id` | number | 主键，自增 |
| `username` | string | 登录名，唯一，最长 50 |
| `email` | string | 邮箱，唯一，最长 100 |
| `register_time` | string \| null | 注册时间 |
| `last_login_time` | string \| null | 最近登录时间（未登录过可为 null） |
| `client_auth` | number | 客户权限：`0` 普通用户，`1` 认证用户，`2` 管理员 |

### `client_auth` 枚举

| 值 | 含义 |
|----|------|
| `0` | 普通用户（默认值） |
| `1` | 认证用户 |
| `2` | 管理员 |

> **安全说明**：当前接口未内置 JWT/Session；生产环境应对「修改用户」「高权限 `client_auth`」等操作增加鉴权与授权策略。

---

## 1. 创建用户

向 `Users` 表插入一条记录：`password` 经 **bcrypt**（cost 10）哈希后存储；`username`、`email` 需唯一。

### 1.1 `POST /api/users`

REST 风格创建资源。

### 1.2 `POST /api/users/register`

与 `POST /api/users` **行为完全一致**，任选其一即可。

### 请求

**Headers**

```
Content-Type: application/json
```

**Body（JSON）**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `username` | string | 是 | 会自动 `trim`；长度 1～50（与库表 `VARCHAR(50)` 一致） |
| `password` | string | 是 | 会自动 `trim`；长度 6～128 |
| `email` | string | 是 | 会自动 `trim`；需通过简单邮箱格式校验；最长 100 |
| `client_auth` | number | 否 | 仅允许 `0`、`1`、`2`；省略时默认为 `0` |

**请求示例**

```http
POST /api/users HTTP/1.1
Host: example.com
Content-Type: application/json

{
  "username": "zhangsan",
  "password": "secret12",
  "email": "zhangsan@example.com",
  "client_auth": 0
}
```

```bash
curl -s -X POST "http://127.0.0.1:3000/api/users" \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"zhangsan\",\"password\":\"secret12\",\"email\":\"zhangsan@example.com\"}"
```

### 响应

#### `201 Created` — 创建成功

```json
{
  "ok": true,
  "data": {
    "user_id": 1,
    "username": "zhangsan",
    "email": "zhangsan@example.com",
    "register_time": "2026-04-11T12:00:00.000Z",
    "last_login_time": null,
    "client_auth": 0
  }
}
```

#### `400 Bad Request` — 参数校验失败

| 典型 `message` |
|----------------|
| 缺少 username、password 或 email |
| username 长度不能超过 50 |
| email 长度不能超过 100 |
| email 格式不正确 |
| password 长度需在 6～128 之间 |
| client_auth 必须为 0、1 或 2 |

示例：

```json
{
  "ok": false,
  "message": "password 长度需在 6～128 之间"
}
```

#### `409 Conflict` — 唯一约束冲突

用户名或邮箱已被占用：

```json
{
  "ok": false,
  "message": "用户名或邮箱已存在"
}
```

---

## 2. 用户登录

校验用户名与密码；成功时更新该用户的 `last_login_time`，响应中**不包含** `password` 字段。

### `POST /api/users/login`

### 请求

**Body（JSON）**

| 字段 | 类型 | 必填 |
|------|------|------|
| `username` | string | 是 |
| `password` | string | 是 |

### 响应

#### `200 OK`

```json
{
  "ok": true,
  "data": {
    "user_id": 1,
    "username": "zhangsan",
    "email": "zhangsan@example.com",
    "register_time": "...",
    "last_login_time": "...",
    "client_auth": 0
  }
}
```

#### `400 Bad Request`

缺少 `username` 或 `password`。

#### `401 Unauthorized`

用户名不存在或密码错误（统一文案，避免枚举用户名）：

```json
{
  "ok": false,
  "message": "用户名或密码错误"
}
```

---

## 3. 查询单个用户

### `GET /api/users/:userId`

### 路径参数

| 参数 | 类型 | 说明 |
|------|------|------|
| `userId` | 整数 | 用户主键 |

### 响应

#### `200 OK`

```json
{
  "ok": true,
  "data": {
    "user_id": 1,
    "username": "zhangsan",
    "email": "zhangsan@example.com",
    "register_time": "...",
    "last_login_time": "...",
    "client_auth": 0
  }
}
```

#### `400 Bad Request`

`userId` 不是合法整数。

#### `404 Not Found`

用户不存在。

---

## 4. 部分更新用户

### `PATCH /api/users/:userId`

至少提供下列字段之一；未出现的字段保持不变。`username` 创建后**不可**通过本接口修改（与当前实现一致）。

### 路径参数

| 参数 | 类型 | 说明 |
|------|------|------|
| `userId` | 整数 | 用户主键 |

### 请求 Body（JSON，字段均为可选）

| 字段 | 类型 | 说明 |
|------|------|------|
| `email` | string | 新邮箱；trim 后校验格式与长度 |
| `client_auth` | number | `0` / `1` / `2` |
| `password` | string | 新密码；非空时要求长度 6～128，将重新 bcrypt 存储 |

### 响应

#### `200 OK`

返回更新后的用户对象（同 GET，无 `password`）。

#### `400 Bad Request`

无有效更新字段，或字段校验失败。

#### `404 Not Found`

`userId` 不存在。

#### `409 Conflict`

更新 `email` 时与其他用户邮箱冲突：

```json
{
  "ok": false,
  "message": "邮箱已被使用"
}
```

---

## 路由与顺序说明

- `POST /api/users` 与 `POST /api/users/register` 注册在 **`GET /api/users/:userId` 之前**，因此不会把 `register` 误解析为 `userId`。
- 若需「用户列表」等接口，建议新增例如 `GET /api/users` 并在路由器中**写在** `/:userId` **之前**，避免被动态段吞掉。

---

## 快速对照表

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/users` | 创建用户 |
| POST | `/api/users/register` | 创建用户（同上） |
| POST | `/api/users/login` | 登录 |
| GET | `/api/users/:userId` | 查询用户 |
| PATCH | `/api/users/:userId` | 更新邮箱 / 权限 / 密码 |
