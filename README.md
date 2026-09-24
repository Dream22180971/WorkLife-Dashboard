<div align="center">

# ◌ 摸鱼助手

### *把上班，变成一场有进度条的游戏*

[![Tauri](https://img.shields.io/badge/Tauri-2.x-24C8DB?style=flat-square&logo=tauri&logoColor=white)](https://tauri.app)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vite.dev)
[![Tests](https://img.shields.io/badge/tests-15%20passing-brightgreen?style=flat-square)](#-测试)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](#-许可证)

**公司要你「加油」，它只负责告诉你：还剩多久下班。**

**[设计哲学](#-设计哲学)** · **[获取](#-获取仅便携版)** · **[开发者](#-开发者)** · **[功能一览](#-功能一览)** · **[路线图](#️-路线图)** · **[许可证](#-许可证)**

</div>

---

## 💡 设计哲学

> **打工已经够累了，工具不该再制造焦虑。**

大多数工时 App 是监工：记录你、催促你、统计你。摸鱼助手站在打工人这边：

| 它做什么 ✅ | 它绝不做什么 ❌ |
|:---|:---|
| 告诉你真实进度——午饭、下班、目标工时 | 不替你打卡（打卡永远由你亲手确认） |
| 按你的作息算：双休/单休/大小周/自定义 | 不上传任何数据（全部存在本机 `localStorage`） |
| 到点提醒你喝水、活动、周报收尾 | 不在你没授权时发一条通知 |
| 桌面 Widget 陪跑，关主窗口也还在 | 不考核你、不打分、不和同事比 |

**它是仪表盘，不是电子镣铐。**
<img width="2524" height="1256" alt="image" src="https://github.com/user-attachments/assets/966a76ac-42fe-423e-b952-3dd41fe8bbc9" />

<img width="2538" height="1099" alt="image" src="https://github.com/user-attachments/assets/2f044bae-8fd7-4253-975d-6a7d156e537f" />


---

## 📦 获取（仅便携版）

**只提供单文件便携版**：下载 `WorkLife-Dashboard-v0.1.0.exe`，双击即用——无需安装、无需 Node/Rust、数据全在本机。应用显示名称是「摸鱼助手」。

| 方式 | 说明 |
|:---|:---|
| Releases | 从 [GitHub Releases](https://github.com/Dream22180971/WorkLife-Dashboard/releases) 下载最新便携版 exe |
| 自行构建 | 见下方开发者命令，产物在 `src-tauri/target/release/摸鱼助手.exe` |

> 首次运行若被 SmartScreen 拦截：点「更多信息」→「仍要运行」（个人分发未签名常见提示）。

首次进入会问你一句：**「今天几点开始工作？」** 答完，进度条就开始转了。

---

## 🛠 开发者

```bash
git clone https://github.com/Dream22180971/WorkLife-Dashboard.git
cd WorkLife-Dashboard
npm install
npm run tauri dev
```

> 需要 [Node.js](https://nodejs.org) 与 [Rust](https://rustup.rs)（Tauri 桌面壳的底座）。

| 命令 | 用途 |
|:---|:---|
| `npm run dev` | 纯浏览器预览（Widget 等桌面功能不可用） |
| `npm run tauri dev` | 完整桌面版 ⭐ |
| `npm test` | 跑工时/假日/提醒的单元测试 |
| `npm run build` | 类型检查 + 生产构建 |
| `npm run tauri build` | 出便携版 `摸鱼助手.exe`（已配置为不打安装包） |

---

## ✨ 功能一览

### ⏱ 今日节奏

圆形进度环实时显示「距离下班 / 距离午饭 / 午休还剩 / 今日已达标」，午休自动扣除，手动打卡（午饭、继续工作、我打卡了）随时校正真实节奏。

```text
开始工作 ──► 午饭 ──► 继续工作 ──► 制度下班 ──► 目标达标 ──► 打卡收工
              │                              │
              └──── 有效工时自动扣掉这段 ─────┘
```

- **双线倒计时**：公司制度下班时间 与 「工作满 8 小时」分开计算，谁先到听谁的
- **加班如实记录**：没打卡就继续走表，绝不假装准点下班
- **跨天归档**：昨天没打卡？今天开机可以补记，不会算错今天的进度

### 🇨🇳 中国工作制

双休 · 单休 · 大小周（选一个锚定周交替）· 自定义每周工作日；内置 **2026 年法定节假日与调休**（数据来源：国务院办公厅通知），法定假与补班优先于你的每周设置。下一年公布前，不瞎猜假期。

### 🖥 桌面 Widget

三档尺寸（小·倒计时 / 中·进度 / 大·盼头），透明度滑杆实时预览，拖到哪记到哪（重启还在），可置顶、可开机启动。关掉主窗口？缩进系统托盘，随时右键回来。

| 尺寸 | 你会看到 |
|:---|:---|
| 小 | 大字倒计时 |
| 中 | 时间 + 进度条 + 状态 |
| 大 | 今日工时 · 下个休息日 · 下个节假日 · 功德 +N |

### 🔔 提醒（Windows 系统通知）

下班前 30 分钟 · 到点下班 · 午饭/午休 · 目标工时达标 · 喝水 · 久坐 · 本周收尾（周报、工时填报，默认关闭）。主窗口缩进托盘后，应用仍会检查并发送系统通知；喝水和活动的页内提示可稍后 10 分钟或今天关闭。

### 🪵 电子木鱼

轻点一下，`功德 +1`，可选音效。上班的福报，自己积。

### 🎨 外观

深色 / 浅色 / 跟随系统（默认深色），主题随手切，Widget 透明度同步变。

### 💰 盼头与回顾

设置发薪日、旅行或生日，首页会告诉你还要等几天。可填月薪估算今日收入，也能一键隐藏金额；估算按当月计划工作日和目标工时计算，不包含税费与加班费。每周小结展示有效工时、日均工时、加班、平均打卡时间、功德和喝水次数。

### 🗓 今天例外

今天提前下班、午休改时间、出差或居家？在首页点「今天特殊安排」，只改今天。请假会暂停工作提醒；喝水、活动和下班提醒也可暂停 30 分钟、1 小时或今天剩余时间。

### 🧯 兜底按钮

设置页底部可以「恢复默认设置」（保留打卡记录），也可以「清空全部本地数据」（连历史、工资、盼头一起清空）。清空前会二次确认；手滑一次，不至于把打工回忆送走。

---

## 🗺️ 路线图

按产品需求 v1.2 迭代，当前 v0.1 已覆盖核心闭环：

- [x] 圆形进度 · 打卡 · 午休扣除 · 双线倒计时 · 加班状态
- [x] 中国工作制 · 2026 节假日/调休 · 喝水久坐提醒 · 木鱼
- [x] Widget 三尺寸 · 透明度/置顶/位置记忆 · 开机启动 · 系统托盘
- [x] Windows 系统通知 · 周期事项（周报/工时）· 三主题 · 本地归档
- [x] 发薪日 · 今日工资估算 · 自定义盼头 · 今日临时作息
- [x] 请假/出差/居家状态 · 周统计 · 一键暂停提醒
- [x] 正在进行的时间轴节点高亮 · 恢复默认设置 · 清空本地数据
- [ ] 月报/报销模板 · 周期事项的独立提醒时间
- [ ] 贴边隐藏 · 鼠标穿透 · 锁定位置 · 多屏记忆 · 全局快捷键

---

## 🧪 测试

```bash
npm test
```

覆盖工时计算、午休扣减、提醒间隔、2026 假日/调休、大小周与自定义工作制、周期收尾日、今日临时作息、请假暂停、工资、周统计和时间轴高亮等 **15 个用例**。

---

## 📄 许可证

MIT © Dreamer

<div align="center">

**上班是场马拉松，它只负责告诉你：下一个补给站还有多远。** 🏃

</div>
