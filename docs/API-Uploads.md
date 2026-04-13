# Uploads API 文档

Base URL 示例：`http://127.0.0.1:3000`  
前缀：`/api/uploads`  
响应统一包含：`StatusCode`、`ok`、`data/message`

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
  - `data.path`：图片访问相对路径（如 `/uploads/actions/xxx.jpg`）
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

### （四）错误码
| 错误码 | 错误描述 | 解决方法 |
|---|---|---|
| 400 | 缺少 `image_data_url`、格式不是 data URL、不是 base64、解码后为空 | 检查前端上传数据格式 |
| 413 | 图片超过 8MB | 上传前压缩图片 |
| 500 | 写入磁盘失败（目录无权限等） | 检查 `public/uploads` 目录可写权限 |

## 2）静态访问路径说明

### （一）接口概述
- 接口名称：GetUploadedFile
- 接口功能：通过静态资源路径访问已上传图片
- 请求方法：GET
- 请求 URL：`/uploads/actions/{filename}`

### （二）请求参数
| 参数名称 | 参数类型 | 是否必填 | 参数描述 |
|---|---|---|---|
| filename | string | 是 | 上传成功后返回的文件名 |

### （三）返回值
- 返回格式：二进制图片流（`image/png`、`image/jpeg` 等）
- 返回字段：无 JSON 包装（由静态文件服务直接返回）
- 示例数据：浏览器直接打开 `/uploads/actions/xxx.jpg` 可查看图片

### （四）错误码
| 错误码 | 错误描述 | 解决方法 |
|---|---|---|
| 404 | 文件不存在 | 检查路径或先确认上传成功 |
| 500 | 静态资源服务异常 | 检查服务端日志与目录配置 |
