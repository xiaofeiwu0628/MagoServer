# Uploads API 文档

Base URL 示例：`http://127.0.0.1:3000`  
前缀：`/api/uploads`  
说明：除「成功返回二进制图片」的 GET 外，JSON 响应会由中间件统一补上 `StatusCode` 字段（与 `ok`、`data` / `message` 等并列）。

## 1）上传图片（`POST /api/uploads/image`）

### （一）接口概述
- 接口名称：UploadImage
- 接口功能：上传 base64 图片（data URL），保存到服务器 `public/uploads/actions/`，返回可访问路径
- 请求方法：POST
- 请求 URL：`/api/uploads/image`

### （二）请求参数
| 参数名称 | 参数类型 | 是否必填 | 参数描述 |
|---|---|---|---|
| image_data_url | string | 是 | `data:image/...;base64,...` 格式字符串 |
| user_id | integer | 否 | 预留字段，当前接口不使用 |

### （三）返回值
- 返回格式：JSON
- 返回字段：
  - `StatusCode`：HTTP 状态码
  - `ok`：布尔状态
  - `data.path`：图片访问相对路径（如 `/uploads/actions/xxx.jpg`），可与下文「静态访问」或「API 读取」两种方式配合使用
- 示例数据：
```json
{
  "StatusCode": 201,
  "ok": true,
  "data": {
    "path": "/uploads/actions/1713000000000_ab12cd34.jpg"
  }
}
```

### （四）文件名规则（上传成功后）
- 形如：`{时间戳}_{随机串}.{扩展名}`
- 扩展名与 data URL 一致，支持：`jpg`、`jpeg`、`png`、`gif`、`webp`（保存时 jpeg 统一为 `jpg`）

### （五）错误码
| 错误码 | 错误描述 | 解决方法 |
|---|---|---|
| 400 | 缺少 `image_data_url`、格式不是 data URL、不是 base64、解码后为空 | 检查前端上传数据格式 |
| 413 | 图片超过 8MB | 上传前压缩图片 |
| 500 | 写入磁盘失败（目录无权限等） | 检查 `public/uploads` 目录可写权限 |

---

## 2）获取已上传图片（任选一种方式）

上传接口返回的 `data.path` 一般为 `/uploads/actions/{filename}`，其中 `{filename}` 即磁盘上的文件名（不含子路径）。

### 2.1 静态资源访问（`GET /uploads/actions/{filename}`）

### （一）接口概述
- 接口名称：GetUploadedFile（静态）
- 接口功能：由 `koa-static` 从 `public` 目录直接提供文件
- 请求方法：GET
- 请求 URL：`/uploads/actions/{filename}`（注意：**无** `/api` 前缀）

### （二）请求参数
| 参数名称 | 参数类型 | 是否必填 | 参数描述 |
|---|---|---|---|
| filename | string（路径段） | 是 | 上传成功后返回路径中的文件名 |

### （三）返回值
- 成功：二进制图片流，`Content-Type` 由静态服务根据扩展名推断
- 成功时响应体**不是** JSON，也不会被包一层 `StatusCode`（与流/二进制响应一致）
- 示例：浏览器或 `<img src="http://主机:端口/uploads/actions/xxx.jpg">` 可直接展示

### （四）错误码
| 错误码 | 错误描述 | 解决方法 |
|---|---|---|
| 404 | 文件不存在 | 确认已上传且文件名与路径一致 |

---

### 2.2 API 读取图片（`GET /api/uploads/actions/:filename`）

### （一）接口概述
- 接口名称：GetUploadedFile（API）
- 接口功能：从 `public/uploads/actions/` 读取文件并返回，**显式设置** `Content-Type`（`image/jpeg`、`image/png` 等）与缓存头
- 请求方法：GET
- 请求 URL：`/api/uploads/actions/{filename}`

### （二）请求参数
| 参数名称 | 参数类型 | 是否必填 | 参数描述 |
|---|---|---|---|
| filename | string | 是 | 须符合服务端安全校验：与上传接口生成规则一致（时间戳 `_` 随机串 `.` 合法扩展名），仅允许 `jpg`、`jpeg`、`png`、`gif`、`webp` |

### （三）返回值
- **成功（200）**：二进制图片数据；`Content-Type` 为对应图片 MIME；响应头含 `Cache-Control: public, max-age=86400`（约 1 天）
- 成功时响应体**不是** JSON，无 `StatusCode` 包装
- **失败**：JSON，含 `StatusCode`、`ok`、`message` 等（与其它 API 一致）

### （四）错误码
| 错误码 | 错误描述 | 解决方法 |
|---|---|---|
| 400 | 文件名不符合规则或路径校验失败 | 使用上传接口返回的 `path` 中的文件名，勿手工拼接非法名称 |
| 404 | 文件不存在 | 检查是否已上传或文件名是否拼写错误 |
| 500 | 读取磁盘失败 | 查看服务端日志与目录权限 |

---

## 3）与其它接口的关联

动作、动作组等接口中的 `image_path` 字段若填写为上传返回的相对路径（如 `/uploads/actions/xxx.png`），前端展示时请将 Base URL 与路径拼接后，使用 **2.1** 或 **2.2** 任一方式访问即可。
