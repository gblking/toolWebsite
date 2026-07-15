# Tool Website

一个基于 `Vue 3 + TypeScript + Vite + Element Plus` 的前端工具站，聚合了签名生成、加解密、图片压缩、JSON 整理和便签资源导航等常用能力，适合作为个人工具箱或静态站点部署到 GitHub Pages。

## 在线访问

- GitHub Pages: [https://gblking.github.io/toolWebsite/](https://gblking.github.io/toolWebsite/)

## 功能概览

### 1. 首页

路由：`/#/`

- 展示项目技术栈
- 演示 Pinia 状态管理
- 演示 CryptoJS 摘要计算
- 展示 Axios 基础配置

### 2. 个性签名生成

路由：`/#/tools`

- 输入签名文本并实时预览
- 切换多种本地字体
- 配置字号、文字颜色、背景色、边框、圆角、边距
- 支持透明背景
- 导出 `PNG` 图片

### 3. 加解密与编码工具

路由：`/#/encrypt`

- 对称加密：`AES`、`DES`、`Triple DES`、`Rabbit`、`RC4`
- 摘要算法：`MD5`、`SHA-1`、`SHA-256`、`SHA-512`
- `HMAC` 系列摘要
- 编码转换：`Base64`、`URL 编码/解码`
- 国密算法：`SM2`、`SM3`、`SM4`
- 非对称加密：`RSA`

### 4. 图片压缩与格式转换

路由：`/#/image-compression`

- 支持上传 `JPEG / PNG / WEBP / BMP`
- 调整压缩质量
- 转换输出格式
- 对比原图与压缩结果
- 查看压缩前后体积、尺寸和压缩比例
- 下载处理结果

### 5. JSON 校验与整理工具

路由：`/#/json-tools`

- JSON 校验
- JSON 格式化
- JSON 压缩
- 上传 `.json` 文件导入内容
- 复制结果
- 下载当前内容为 `.json` 文件

### 6. 便签资源导航

路由：`/#/pad`

- 基于 `src/assets/js/pad.json` 管理资源数据
- 按分类浏览常用站点与工具资源
- 支持关键字模糊搜索
- 支持 Tag 检索
- 支持分类锚点快速跳转
- 点击卡片新窗口打开目标链接

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

## 项目结构

```text
src/
├─ assets/                静态资源、字体、图片、配置数据
├─ components/            通用组件
├─ router/                路由配置
├─ stores/                Pinia 状态
├─ styles/                全局样式
├─ utils/                 工具方法
├─ views/
│  ├─ Home.vue            首页
│  ├─ Signature/          个性签名生成
│  ├─ Encrypt/            加解密与编码工具
│  ├─ ImageCompression/   图片压缩与格式转换
│  ├─ JsonTools/          JSON 校验与整理工具
│  └─ Pad/                便签资源导航
├─ App.vue                应用壳
└─ main.ts                应用入口
```

## 本地开发

### 环境要求

- `Node.js 22+`
- `Yarn 4`

### 安装依赖

```bash
yarn install
```

### 启动开发环境

```bash
yarn dev
```

### 构建生产版本

```bash
yarn build
```

### 本地预览构建结果

```bash
yarn preview
```

## GitHub Pages 部署

项目已配置 GitHub Actions 自动部署：

- 工作流文件：`.github/workflows/deploy-pages.yml`
- 推送到 `main` 分支后自动执行构建与发布
- `vite.config.ts` 已区分开发与构建场景：
  - 开发时 `base` 为 `/`
  - 构建时 `base` 为 `/toolWebsite/`

GitHub 仓库中需要确认：

1. 进入 `Settings`
2. 打开 `Pages`
3. 在 `Build and deployment` 中将 `Source` 设置为 `GitHub Actions`

## 路由说明

| 页面 | 路由 |
| --- | --- |
| 首页 | `/#/` |
| 个性签名生成 | `/#/tools` |
| 加解密与编码工具 | `/#/encrypt` |
| 图片压缩与格式转换 | `/#/image-compression` |
| JSON 校验与整理工具 | `/#/json-tools` |
| 便签资源导航 | `/#/pad` |

## 开发说明

- 当前项目使用 `hash` 路由，适合 GitHub Pages 这类静态托管场景
- 大部分处理逻辑都在前端本地完成，无需依赖后端服务
- 字体相关功能依赖本地字体资源，构建产物体积会相对较大
- 图片压缩和格式转换在浏览器内执行，超大文件时会受到浏览器内存限制

## 后续可扩展方向

- 增加二维码、时间戳转换、正则测试、JWT 解析等常用工具
- 为首页增加工具分类入口和快速导航
- 增加最近使用记录与本地缓存
- 继续优化移动端体验和资源体积
