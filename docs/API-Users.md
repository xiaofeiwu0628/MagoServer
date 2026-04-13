# 用户模块 API 文档

Base URL 示例：`http://127.0.0.1:3000`  
前缀：`/api/users`  
响应统一包含：`StatusCode`、`ok`、`data/message`

## 1）创建用户（`POST /api/users`、`POST /api/users/register`）

### （一）接口概述
- 接口名称：CreateUser
- 接口功能：创建新用户并保存到 `Users` 表，密码以 bcrypt 哈希存储
- 请求方法：POST
- 请求 URL：`/api/users` 或 `/api/users/register`

### （二）请求参数
| 参数名称 | 参数类型 | 是否必填 | 参数描述 |
|---|---|---|---|
| username | string | 是 | 用户名，最长 50 |
| password | string | 是 | 密码，长度 6~128 |
| email | string | 是 | 邮箱，最长 100，需合法格式 |
| client_auth | number | 否 | 当前创建接口会忽略该参数并固定写入 0 |

### （三）返回值
- 返回格式：JSON
- 返回字段：
  - `StatusCode`：HTTP 状态码
  - `ok`：布尔状态
  - `data`：创建后的用户信息（不含 password）
- 示例数据：
```json
{
  "StatusCode": 201,
  "ok": true,
  "data": {
    "user_id": 1,
    "username": "zhangsan",
    "email": "zhangsan@example.com",
    "register_time": "2026-04-13T09:30:00.000Z",
    "last_login_time": null,
    "client_auth": 0
  }
}
```

### （四）错误码
| 错误码 | 错误描述 | 解决方法 |
|---|---|---|
| 400 | 参数缺失或格式不合法 | 检查用户名、密码、邮箱格式 |
| 409 | 用户名或邮箱重复 | 更换用户名或邮箱 |
| 500 | 服务器内部错误 | 查看日志重试 |

## 2）用户登录（`POST /api/users/login`）

### （一）接口概述
- 接口名称：LoginUser
- 接口功能：用户名+密码登录，成功后更新 `last_login_time`
- 请求方法：POST
- 请求 URL：`/api/users/login`

### （二）请求参数
| 参数名称 | 参数类型 | 是否必填 | 参数描述 |
|---|---|---|---|
| username | string | 是 | 用户名 |
| password | string | 是 | 密码 |

### （三）返回值
- 返回格式：JSON
- 返回字段：`StatusCode`、`ok`、`data`
- 示例数据：
```json
{
  "StatusCode": 200,
  "ok": true,
  "data": {
    "user_id": 1,
    "username": "zhangsan",
    "email": "zhangsan@example.com",
    "register_time": "2026-04-13T09:30:00.000Z",
    "last_login_time": "2026-04-13T10:12:10.000Z",
    "client_auth": 0
  }
}
```

### （四）错误码
| 错误码 | 错误描述 | 解决方法 |
|---|---|---|
| 400 | 缺少 username 或 password | 补齐参数 |
| 401 | 用户名或密码错误 | 核对账号密码 |
| 500 | 服务器内部错误 | 查看日志重试 |

## 3）查询用户（`GET /api/users/:userId`）

### （一）接口概述
- 接口名称：GetUserById
- 接口功能：按用户 ID 查询用户详情
- 请求方法：GET
- 请求 URL：`/api/users/:userId`

### （二）请求参数
| 参数名称 | 参数类型 | 是否必填 | 参数描述 |
|---|---|---|---|
| userId | integer | 是 | 路径参数，用户 ID |

### （三）返回值
- 返回格式：JSON
- 返回字段：`StatusCode`、`ok`、`data`
- 示例数据：
```json
{
  "StatusCode": 200,
  "ok": true,
  "data": {
    "user_id": 1,
    "username": "zhangsan",
    "email": "zhangsan@example.com",
    "register_time": "2026-04-13T09:30:00.000Z",
    "last_login_time": "2026-04-13T10:12:10.000Z",
    "client_auth": 0
  }
}
```

### （四）错误码
| 错误码 | 错误描述 | 解决方法 |
|---|---|---|
| 400 | userId 非法 | 传入整数 ID |
| 404 | 用户不存在 | 检查 userId |
| 500 | 服务器内部错误 | 查看日志重试 |

## 4）更新用户（`PATCH /api/users/:userId`）

### （一）接口概述
- 接口名称：PatchUser
- 接口功能：部分更新用户信息（支持 email、password）
- 请求方法：PATCH
- 请求 URL：`/api/users/:userId`

### （二）请求参数
| 参数名称 | 参数类型 | 是否必填 | 参数描述 |
|---|---|---|---|
| userId | integer | 是 | 路径参数，用户 ID |
| email | string | 否 | 新邮箱，需合法格式 |
| password | string | 否 | 新密码，长度 6~128 |
| client_auth | number | 否 | 当前更新接口未处理该字段（传入不会生效） |

### （三）返回值
- 返回格式：JSON
- 返回字段：`StatusCode`、`ok`、`data`
- 示例数据：
```json
{
  "StatusCode": 200,
  "ok": true,
  "data": {
    "user_id": 1,
    "username": "zhangsan",
    "email": "new@example.com",
    "register_time": "2026-04-13T09:30:00.000Z",
    "last_login_time": "2026-04-13T10:12:10.000Z",
    "client_auth": 0
  }
}
```

### （四）错误码
| 错误码 | 错误描述 | 解决方法 |
|---|---|---|
| 400 | 无有效更新字段或字段非法 | 至少传 email/password 且符合格式 |
| 404 | 用户不存在 | 检查 userId |
| 409 | 邮箱冲突 | 更换邮箱后重试 |
| 500 | 服务器内部错误 | 查看日志重试 |
