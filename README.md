# Tool Website

一个基于 `Vue 3 + TypeScript + Vite + Element Plus` 搭建的前端工具网站，当前主要提供常用文本处理、图片处理和签名生成能力，适合内部工具集合、轻量在线工具站点或继续扩展为多功能工作台。

## 项目定位

当前项目以“工具网站”为核心目标，页面风格保持统一卡片化布局，强调：

- 常用工具集中展示
- 输入、处理、结果分区清晰
- 支持本地文件导入导出
- 尽量在前端完成处理，减少后端依赖

## 当前功能

### 1. 个性签名

路由：`/#/tools`

支持能力：

- 自定义签名文本
- 多字体切换
- 字号、字体颜色、背景颜色、边框、圆角、边距配置
- 预览签名效果
- 导出 PNG 图片

### 2. 加解密工具

路由：`/#/encrypt`

支持能力：

- 对称加解密：`AES`、`DES`、`Triple DES`、`Rabbit`、`RC4`
- 摘要算法：`MD5`、`SHA-1`、`SHA-256`、`SHA-512`
- HMAC：`HMAC-SHA1`、`HMAC-SHA256`、`HMAC-SHA512`
- 编码转换：`Base64`、`URL 编码/解码`
- 国密算法：`SM2`、`SM3`、`SM4`
- 非对称加密：`RSA`
- 结果复制、回填、清空

### 3. 图片压缩

路由：`/#/image-compression`

支持能力：

- 上传 `jpeg / png / webp / bmp`
- 压缩质量调节
- 输出格式转换
- 原图与压缩后图片预览
- 显示压缩前后体积、尺寸、压缩比例
- 支持重新压缩、下载结果、清空状态

### 4. JSON 工具

路由：`/#/json-tools`

支持能力：

- JSON 校验
- JSON 格式化
- JSON 压缩
- 上传 `.json` 文件并回填输入框
- 复制结果
- 下载当前内容为 `.json` 文件
- 清空输入与结果

## 技术栈

- `Vue 3`
- `TypeScript`
- `Vite`
- `Vue Router`
- `Pinia`
- `Element Plus`
- `Less`
- `Axios`
- `CryptoJS`
- `sm-crypto`
- `JSEncrypt`
- `browser-image-compression`

## 目录结构

```text
src/
├─ assets/                静态资源、字体、图片、常量
├─ components/            通用组件
├─ router/                路由配置
├─ styles/                全局样式
├─ views/
│  ├─ Home.vue            首页
│  ├─ Signature/          个性签名
│  ├─ Encrypt/            加解密工具
│  ├─ ImageCompression/   图片压缩
│  └─ JsonTools/          JSON 工具
└─ main.ts                应用入口
```

## 本地开发

### 环境版本

- `Node.js`: `v22.13.0`
- `Yarn`: `4.5.1`

### 安装依赖

```bash
yarn install
```

### 启动开发环境

```bash
yarn dev
```

### 打包构建

```bash
yarn build
```

### 本地预览构建结果

```bash
yarn preview
```

## 路由说明

| 页面 | 路由 |
| --- | --- |
| 首页 | `/#/` |
| 个性签名 | `/#/tools` |
| 加解密 | `/#/encrypt` |
| 图片压缩 | `/#/image-compression` |
| JSON工具 | `/#/json-tools` |

## 开发说明

- 当前项目使用 `hash` 路由，适合静态部署场景。
- 大部分工具逻辑在前端本地执行，注意浏览器兼容性和大文件性能。
- 字体类功能依赖本地字体资源，若更换字体文件，需关注浏览器对字体格式的解析兼容性。
- 图片压缩与格式转换为纯前端处理，超大图片时可能受到浏览器内存限制。

## 后续可扩展方向

- 新增二维码、时间戳转换、正则测试、JWT 解析等常用工具
- 支持工具分类页或首页工具导航卡片
- 增加历史记录、本地缓存和最近使用
- 增加暗色模式与移动端交互优化
