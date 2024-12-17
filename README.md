# AI 智能图片重命名工具

一个简单易用的网页版图片批量重命名工具，支持 OCR 识别和 AI 智能命名。本工具在本地完成图片 OCR 识别，仅发送识别后的文本到 AI 服务进行文件名生成，确保用户隐私安全。

## 功能特点
- 拖拽上传多张图片
- OCR 识别图片内容（本地处理）
- AI 智能生成文件名
- 实时预览重命名结果
- 一键批量下载
- 支持离线使用（除 AI 命名外）
- 支持中英文识别
- 支持水平和垂直文字识别

## 支持的图片格式
- JPG/JPEG (.jpg, .jpeg, .jpe, .jfif)
- PNG (.png)
- GIF (.gif, 仅识别第一帧)
- BMP (.bmp)
- WebP (.webp)
- TIFF (.tif, .tiff) - 计划支持中

## 图片要求
- 文件大小：不超过 5MB
- 图片分辨率：建议不低于 300x300 像素
- 文字清晰度：建议使用清晰的文字图片
- 支持方向：水平文字和垂直文字均可识别
- 文字语言：支持中文（简体、繁体）和英文
- JPEG 格式：支持标准 JPEG/JFIF 格式

## 隐私说明
- 图片 OCR 识别完全在本地完成
- 仅发送识别出的文本到 AI 服务
- 不会上传原始图片到任何服务器
- 不保存任何用户数据
- 支持离线使用基础功能

## 使用方法
1. 打开网页后，将图片拖入上传区域或点击选择文件
2. 等待 OCR 识别完成
3. AI 自动生成新文件名
4. 点击"批量下载"获取重命名后的图片

## 配置说明
1. 复制 `config.example.js` 为 `config.js`
2. 在 `config.js` 中填入你的 DeepSeek API key
3. 如果不配置 API key，将使用本地简单命名规则

## 技术栈
- HTML5
- CSS3
- JavaScript
- Tesseract.js (OCR，本地运行)
- DeepSeek API (AI 文件名生成)

## 浏览器支持
- Chrome (推荐)
- Firefox
- Safari
- Edge

## 注意事项
- 请确保图片清晰可读以获得最佳识别效果
- 建议图片大小不超过 5MB
- 离线模式下仅支持基础文件名生成
- API 调用可能产生相关费用，请注意使用频率
- TIFF 格式支持将在后续版本添加

## 开发计划
- [x] 支持水平和垂直文字识别
- [ ] 添加文件名手动编辑功能
- [ ] 支持自定义文件名模板
- [ ] 添加批量处理进度条
- [ ] 支持更多图片格式（包括 TIFF）
- [ ] 添加暗色模式