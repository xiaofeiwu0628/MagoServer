# RobotActions API 文档

Base URL 示例：`http://127.0.0.1:3000`  
前缀：`/api/actions`  
响应统一包含：`StatusCode`、`ok`、`data/message`

## 1）查询动作列表（`GET /api/actions`）

### （一）接口概述
- 接口名称：GetRobotActionList
- 接口功能：按用户 ID 查询动作列表，按创建时间倒序返回
- 请求方法：GET
- 请求 URL：`/api/actions?user_id={id}`

### （二）请求参数
| 参数名称 | 参数类型 | 是否必填 | 参数描述 |
|---|---|---|---|
| user_id | integer | 是 | 查询参数，用户 ID |

### （三）返回值
- 返回格式：JSON
- 返回字段：
  - `StatusCode`：HTTP 状态码
  - `ok`：布尔状态
  - `data`：动作数组
- 示例数据：
```json
{
  "StatusCode": 200,
  "ok": true,
  "data": [
    {
      "action_id": 10,
      "user_id": 1,
      "duration": 1.2,
      "servo_angles": [90, 45, 120],
      "status": 1,
      "image_path": "/uploads/actions/a.png",
      "description_text": "{\"action_name\":\"动作1\"}",
      "created_time": "2026-04-13T10:00:00.000Z"
    }
  ]
}
```

### （四）错误码
| 错误码 | 错误描述 | 解决方法 |
|---|---|---|
| 400 | 缺少或非法 `user_id` | 传入整数 user_id |
| 500 | 服务器内部错误 | 查看日志重试 |

## 2）查询动作详情（`GET /api/actions/:actionId`）

### （一）接口概述
- 接口名称：GetRobotActionById
- 接口功能：按动作 ID 查询单条动作
- 请求方法：GET
- 请求 URL：`/api/actions/:actionId`

### （二）请求参数
| 参数名称 | 参数类型 | 是否必填 | 参数描述 |
|---|---|---|---|
| actionId | integer | 是 | 路径参数，动作 ID |

### （三）返回值
- 返回格式：JSON
- 返回字段：`StatusCode`、`ok`、`data`
- 示例数据：同上单条对象

### （四）错误码
| 错误码 | 错误描述 | 解决方法 |
|---|---|---|
| 400 | actionId 非法 | 传入整数 ID |
| 404 | 动作不存在 | 检查 actionId |
| 500 | 服务器内部错误 | 查看日志重试 |

## 3）创建动作（`POST /api/actions` 与 `PUT /api/actions`）

### （一）接口概述
- 接口名称：CreateRobotAction
- 接口功能：创建动作记录（POST 与 PUT 行为一致）
- 请求方法：POST / PUT
- 请求 URL：`/api/actions`

### （二）请求参数
| 参数名称 | 参数类型 | 是否必填 | 参数描述 |
|---|---|---|---|
| user_id | integer | 是 | 用户 ID |
| duration | number | 是 | 动作时长 |
| servo_angles | array | 是 | 舵机角度数组（或合法 JSON 字符串） |
| status | boolean | 否 | 是否启用，默认 true |
| image_path | string | 否 | 图片路径 |
| description_text | string | 否 | 描述文本（可存 JSON 字符串） |

### （三）返回值
- 返回格式：JSON
- 返回字段：`StatusCode`、`ok`、`data`
- 示例数据：
```json
{
  "StatusCode": 201,
  "ok": true,
  "data": {
    "action_id": 11,
    "user_id": 1,
    "duration": 1.2,
    "servo_angles": [90, 45, 120],
    "status": 1,
    "image_path": "/uploads/actions/new.jpg",
    "description_text": "{\"action_name\":\"新动作\"}",
    "created_time": "2026-04-13T10:10:00.000Z"
  }
}
```

### （四）错误码
| 错误码 | 错误描述 | 解决方法 |
|---|---|---|
| 400 | 字段非法、缺少 user_id/duration、servo_angles 不是数组、user_id 不存在 | 检查参数类型和用户 ID |
| 500 | 服务器内部错误 | 查看日志重试 |

## 4）更新动作（`PATCH /api/actions/:actionId`）

### （一）接口概述
- 接口名称：PatchRobotAction
- 接口功能：部分更新动作信息
- 请求方法：PATCH
- 请求 URL：`/api/actions/:actionId`

### （二）请求参数
| 参数名称 | 参数类型 | 是否必填 | 参数描述 |
|---|---|---|---|
| actionId | integer | 是 | 路径参数，动作 ID |
| duration | number | 否 | 新时长 |
| servo_angles | array | 否 | 新舵机角度数组（或合法 JSON 字符串） |
| status | boolean | 否 | 启用状态 |
| image_path | string | 否 | 图片路径 |
| description_text | string | 否 | 描述文本 |

### （三）返回值
- 返回格式：JSON
- 返回字段：`StatusCode`、`ok`、`data`

### （四）错误码
| 错误码 | 错误描述 | 解决方法 |
|---|---|---|
| 400 | actionId 非法、无有效更新字段、servo_angles 非数组 | 检查参数 |
| 404 | 动作不存在 | 检查 actionId |
| 500 | 服务器内部错误 | 查看日志重试 |

## 5）删除动作（`DELETE /api/actions/:actionId`）

### （一）接口概述
- 接口名称：DeleteRobotAction
- 接口功能：删除指定动作
- 请求方法：DELETE
- 请求 URL：`/api/actions/:actionId`

### （二）请求参数
| 参数名称 | 参数类型 | 是否必填 | 参数描述 |
|---|---|---|---|
| actionId | integer | 是 | 路径参数，动作 ID |

### （三）返回值
- 返回格式：JSON
- 返回字段：`StatusCode`、`ok`、`message`
- 示例数据：
```json
{
  "StatusCode": 200,
  "ok": true,
  "message": "已删除"
}
```

### （四）错误码
| 错误码 | 错误描述 | 解决方法 |
|---|---|---|
| 400 | actionId 非法 | 传入整数 ID |
| 404 | 动作不存在 | 检查 actionId |
| 500 | 服务器内部错误 | 查看日志重试 |
