# ActionGroups API 文档

Base URL 示例：`http://127.0.0.1:3000`  
前缀：`/api/groups`  
响应统一包含：`StatusCode`、`ok`、`data/message`

## 1）查询动作组列表（`GET /api/groups`）

### （一）接口概述
- 接口名称：GetActionGroupList
- 接口功能：按用户 ID 查询动作组列表（创建时间倒序）
- 请求方法：GET
- 请求 URL：`/api/groups?user_id={id}`

### （二）请求参数
| 参数名称 | 参数类型 | 是否必填 | 参数描述 |
|---|---|---|---|
| user_id | integer | 是 | 查询参数，用户 ID |

### （三）返回值
- 返回格式：JSON
- 返回字段：`StatusCode`、`ok`、`data[]`
- 示例数据：
```json
{
  "StatusCode": 200,
  "ok": true,
  "data": [
    {
      "group_id": 2,
      "group_name": "早操动作组",
      "user_id": 1,
      "action_ids": [10, 11],
      "sequence_orders": [1, 2],
      "created_time": "2026-04-13T10:20:00.000Z"
    }
  ]
}
```

### （四）错误码
| 错误码 | 错误描述 | 解决方法 |
|---|---|---|
| 400 | 缺少或非法 user_id | 传入整数 user_id |
| 500 | 服务器内部错误 | 查看日志重试 |

## 2）查询动作组详情（`GET /api/groups/:groupId`）

### （一）接口概述
- 接口名称：GetActionGroupById
- 接口功能：按动作组 ID 查询单条动作组
- 请求方法：GET
- 请求 URL：`/api/groups/:groupId`

### （二）请求参数
| 参数名称 | 参数类型 | 是否必填 | 参数描述 |
|---|---|---|---|
| groupId | integer | 是 | 路径参数，动作组 ID |

### （三）返回值
- 返回格式：JSON
- 返回字段：`StatusCode`、`ok`、`data`

### （四）错误码
| 错误码 | 错误描述 | 解决方法 |
|---|---|---|
| 400 | groupId 非法 | 传入整数 ID |
| 404 | 动作组不存在 | 检查 groupId |
| 500 | 服务器内部错误 | 查看日志重试 |

## 3）创建动作组（`POST /api/groups`）

### （一）接口概述
- 接口名称：CreateActionGroup
- 接口功能：创建动作组并保存动作 ID 列表
- 请求方法：POST
- 请求 URL：`/api/groups`

### （二）请求参数
| 参数名称 | 参数类型 | 是否必填 | 参数描述 |
|---|---|---|---|
| group_name | string | 是 | 动作组名称 |
| user_id | integer | 是 | 用户 ID |
| action_ids | array | 是 | 动作 ID 数组（或合法 JSON 字符串） |
| sequence_orders | array | 否 | 顺序数组（或合法 JSON 字符串），可传 null |

### （三）返回值
- 返回格式：JSON
- 返回字段：`StatusCode`、`ok`、`data`
- 示例数据：
```json
{
  "StatusCode": 201,
  "ok": true,
  "data": {
    "group_id": 3,
    "group_name": "晚安动作组",
    "user_id": 1,
    "action_ids": [10, 11],
    "sequence_orders": [1, 2],
    "created_time": "2026-04-13T10:30:00.000Z"
  }
}
```

### （四）错误码
| 错误码 | 错误描述 | 解决方法 |
|---|---|---|
| 400 | 参数非法、action_ids/sequence_orders 非数组、user_id 不存在 | 检查参数 |
| 500 | 服务器内部错误 | 查看日志重试 |

## 4）更新动作组（`PATCH /api/groups/:groupId`）

### （一）接口概述
- 接口名称：PatchActionGroup
- 接口功能：部分更新动作组
- 请求方法：PATCH
- 请求 URL：`/api/groups/:groupId`

### （二）请求参数
| 参数名称 | 参数类型 | 是否必填 | 参数描述 |
|---|---|---|---|
| groupId | integer | 是 | 路径参数，动作组 ID |
| group_name | string | 否 | 新名称 |
| action_ids | array | 否 | 新动作 ID 数组（或合法 JSON 字符串） |
| sequence_orders | array/null | 否 | 新顺序数组；传 null 可清空 |

### （三）返回值
- 返回格式：JSON
- 返回字段：`StatusCode`、`ok`、`data`

### （四）错误码
| 错误码 | 错误描述 | 解决方法 |
|---|---|---|
| 400 | groupId 非法、无有效更新字段、数组字段非法 | 检查参数 |
| 404 | 动作组不存在 | 检查 groupId |
| 500 | 服务器内部错误 | 查看日志重试 |

## 5）删除动作组（`DELETE /api/groups/:groupId`）

### （一）接口概述
- 接口名称：DeleteActionGroup
- 接口功能：删除动作组
- 请求方法：DELETE
- 请求 URL：`/api/groups/:groupId`

### （二）请求参数
| 参数名称 | 参数类型 | 是否必填 | 参数描述 |
|---|---|---|---|
| groupId | integer | 是 | 路径参数，动作组 ID |

### （三）返回值
- 返回格式：JSON
- 返回字段：`StatusCode`、`ok`、`message`

### （四）错误码
| 错误码 | 错误描述 | 解决方法 |
|---|---|---|
| 400 | groupId 非法 | 传入整数 ID |
| 404 | 动作组不存在 | 检查 groupId |
| 500 | 服务器内部错误 | 查看日志重试 |
