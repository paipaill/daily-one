# 每日一句 · Daily Quote

> 每天五句话，与文字相遇。时光只向前，无法回头。

一个极简风格的每日文学语录 Web App。每天由 AI 从加缪、尼采、卡夫卡、萨特等存在主义与现代文学作家中精选 5 句话，配以暗调风景背景图，支持下载为 1080×1080 图片。

---

## ✨ 功能特性

- **每日 5 句** — 由智谱 GLM 每天生成，日期作为随机种子，每天内容不同
- **用户系统** — 自定义用户名登录，记录各自的阅读进度与下载次数，多用户互不干扰
- **单向阅读** — 只能向前翻阅，到达第 5 句后触发结束页，无法返回，寓意时光不可逆
- **下载图片** — 每张卡片可导出为 1080×1080 高清 PNG，每人每天最多下载 5 次
- **倒计时** — 结束页精确显示距次日零时的剩余时间（精确到秒）
- **离线降级** — API 不可用时自动切换内置备用语录，保证页面可用
- **纯静态** — 无服务器、无数据库，所有状态存储于浏览器 `localStorage`

---

## 🖼️ 界面预览

| 登录页 | 阅读页 | 结束页 |
|--------|--------|--------|
| 用户名输入，记住名字 | 1:1 卡片 + 背景图 + 底部导航 | 倒计时 + 文学结语 |

---

## 🚀 部署到 Render

### 1. 准备仓库

```
your-repo/
├── index.html      ← daily-quote.html 重命名为此
└── render.yaml     ← 部署配置文件
```

### 2. 获取智谱 API Key

前往 [open.bigmodel.cn](https://open.bigmodel.cn) 注册并创建 API Key。

### 3. 在 Render 配置

1. 登录 [render.com](https://render.com)，点击 **New → Static Site**
2. 连接 GitHub 仓库
3. Render 会自动读取 `render.yaml`，无需手动填写构建参数
4. 进入 Service → **Environment** → **Add Environment Variable**

   | Key | Value |
   |-----|-------|
   | `ZHIPU_API_KEY` | 你的智谱 API Key |

5. 点击 **Save Changes**，触发重新部署

部署完成后访问 `https://your-app.onrender.com` 即可使用。

---

## ⚙️ 配置说明

### 修改 AI 模型

打开 `index.html`，找到顶部 CONFIG 块（约第 15 行）：

```javascript
const CONFIG = {
  ZHIPU_API_KEY: '__ZHIPU_API_KEY__',
  MODEL: 'glm-5'   // ← 在这里修改模型
};
```

可选模型：

| 模型 | 说明 |
|------|------|
| `glm-5` | 当前使用，效果最佳 |
| `glm-4` | 稳定版本 |
| `glm-4-flash` | 更快，适合降低成本 |

### 修改每日语录数量

找到 JS 中的常量（约第 570 行）：

```javascript
const DAILY_COUNT = 5;   // 每天展示几句
const MAX_DL      = 5;   // 每人每天最多下载几次
```

---

## 🗂️ 技术栈

- **纯 HTML/CSS/JS** — 零依赖，无框架，单文件
- **AI** — 智谱 GLM（`/v4/chat/completions`）生成每日语录
- **图片** — Unsplash 精选暗调风景图，与语句情绪匹配
- **存储** — 浏览器 `localStorage`，按用户名隔离
- **导出** — 原生 Canvas API 绘制 1080×1080 PNG，无第三方截图库
- **字体** — Playfair Display + Space Mono + Noto Serif SC
- **部署** — Render Static Site，`sed` 命令在构建时注入 API Key

---

## 📦 本地运行

直接用浏览器打开 `index.html` 即可，无需安装任何依赖。

如需测试 AI 语句功能，在文件顶部临时替换 key：

```javascript
ZHIPU_API_KEY: '__ZHIPU_API_KEY__',
// 改为：
ZHIPU_API_KEY: 'your_real_key_here',
```

测试完毕后**务必改回占位符**再提交到 Git，避免 key 泄露。

如需重置本地缓存，在浏览器控制台执行：

```javascript
localStorage.removeItem('dq_lastUser');
// 或清除所有数据：
Object.keys(localStorage).filter(k => k.startsWith('dq_')).forEach(k => localStorage.removeItem(k));
location.reload();
```

---

## 📁 数据结构（localStorage）

```
dq_lastUser                         → 上次登录的用户名
dq_user_{name}_first                → 首次登录时间戳（ms）
dq_user_{name}_state                → { date, pos, done, dlCount }
dq_user_{name}_quotes_{YYYY-M-D}    → 今日 5 条语录（JSON 数组，当天有效）
```

---

## 📄 License

MIT
