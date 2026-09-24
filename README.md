<div align="center">

<img src="https://readme-typing-svg.herokuapp.com?font=Space+Grotesk&weight=700&size=30&duration=2200&pause=900&color=F59E0B&center=true&vCenter=true&width=900&lines=TURN+YOUR+WORKDAY+INTO+A+PROGRESS+BAR;LOCAL-FIRST+%C2%B7+PRIVATE+%C2%B7+DESKTOP+WIDGETS" alt="Typing SVG" />

# 摸鱼助手 · WorkLife Dashboard

**Turn the workday into a private, local-first progress bar with reminders and desktop widgets.**  
**把上班变成一条本地、私密、带提醒和桌面 Widget 的进度条。**

[![Tauri](https://img.shields.io/badge/Tauri-2.x-24C8DB?style=for-the-badge&logo=tauri&logoColor=white)](https://tauri.app)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![Local First](https://img.shields.io/badge/LOCAL--FIRST-111827?style=for-the-badge&logo=databricks&logoColor=22c55e)](#-privacy--local-first)
[![License](https://img.shields.io/badge/LICENSE-MIT-10B981?style=for-the-badge)](#-license)

</div>

---

## 🎯 What it is / 它是什么

**EN**  
A desktop companion for people who want to see how much of the workday is left without turning work into another productivity competition.

**中文**  
它不是考勤系统，也不是“卷王”工具。它只做一件事：**告诉你今天工作到哪了、还剩多久、什么时候该休息、什么时候可以收工。**

> **It is a dashboard, not a supervisor.**  
> **它是仪表盘，不是电子监工。**

---

## 🎬 Demo / 演示

<div align="center">

<img width="92%" alt="WorkLife Dashboard main view" src="https://github.com/user-attachments/assets/966a76ac-42fe-423e-b952-3dd41fe8bbc9" />

<img width="92%" alt="WorkLife Dashboard secondary view" src="https://github.com/user-attachments/assets/2f044bae-8fd7-4253-975d-6a7d156e537f" />

</div>

> Recommended next asset: a 10–15 second GIF showing the desktop widget, tray and reminders.  
> 下一步最值得补的是 10–15 秒 GIF：展示 Widget、托盘、提醒和主界面的切换。

---

## ⚡ Quick Start / 5 分钟快速开始

### Download / 直接使用

Download the latest portable EXE from **Releases**. No installer required.

从 **Releases** 下载最新便携版 EXE，双击即可运行，无需安装。

### Developer mode / 开发模式

```bash
git clone https://github.com/Dream22180971/WorkLife-Dashboard.git
cd WorkLife-Dashboard

npm install
npm run tauri dev
```

Requirements / 环境要求：

- Node.js
- Rust
- Windows is the primary tested desktop target / 当前主要测试平台为 Windows

---

## ✨ Highlights / 核心功能

| Feature | EN | 中文 |
|---|---|---|
| ⏱ Workday progress | real-time work / lunch / off-work progress | 工作、午休、下班进度实时展示 |
| 🖥 Desktop Widget | small / medium / large views | 小 / 中 / 大三档桌面 Widget |
| 🔔 Reminders | lunch, water, movement, off-work | 午饭、喝水、久坐、下班提醒 |
| 🇨🇳 China work schedules | weekends, single rest, alternating weeks, holidays | 双休、单休、大小周、法定调休 |
| 💰 Salary countdown | salary day and daily earning estimate | 发薪日倒计时与当日收入估算 |
| 🪵 Electronic wooden fish | merit +1 for surviving the workday | 上班功德 +1 |
| 📊 Weekly review | effective hours, overtime, check-out time | 有效工时、加班、平均打卡时间 |
| 🔐 Local-first | all personal data stays on device | 所有个人数据留在本机 |

---

## 🧭 Daily flow / 一天怎么走

```text
Start
  ↓
Work
  ↓
Lunch
  ↓
Resume
  ↓
Company off-work time
  ↓
Target hours reached
  ↓
Check out
```

The app keeps **company off-work time** and **target work hours** as two separate signals.

系统会把“公司制度下班时间”和“实际完成目标工时”分开计算，不会把两者混成一个数字。

---

## 🖥 Widget modes / Widget 模式

| Size | Shows / 展示 |
|---|---|
| Small | countdown only / 倒计时 |
| Medium | time + progress + state / 时间 + 进度 + 状态 |
| Large | work hours + next break + next holiday + merit / 工时 + 盼头 + 节假日 + 功德 |

The widget supports position memory, transparency and always-on-top behavior.

Widget 支持位置记忆、透明度调节和置顶。

---

## 🔔 Reminder system / 提醒系统

Available reminders include:

- off-work in 30 minutes / 下班前 30 分钟
- off-work now / 到点下班
- lunch / 午饭
- lunch break end / 午休结束
- target work hours reached / 目标工时达标
- drink water / 喝水
- move after sitting / 久坐活动
- weekly wrap-up / 周报、工时填报提醒

Recurring work reminders can be disabled independently.

周期性工作提醒可以单独关闭。

---

## 🇨🇳 China work schedule support / 中国工作制支持

Supported modes:

- two-day weekend / 双休
- single weekly rest day / 单休
- alternating weekends / 大小周
- custom working weekdays / 自定义工作日
- official holiday & make-up workday overrides / 法定节假日与补班覆盖

Holiday data is explicit rather than guessed.

节假日数据明确配置，不提前“猜”下一年的调休。

---

## 🔐 Privacy & Local-first

**EN**

- No account system
- No cloud sync
- No hidden telemetry
- Personal settings and records stay local

**中文**

- 不需要注册
- 不做云同步
- 不做隐藏遥测
- 设置和记录默认都保存在本机

---

## 🧪 Testing / 测试

```bash
npm test
```

Current coverage includes work-hour calculations, lunch deduction, reminders, holiday overrides, alternating-week schedules, temporary day overrides, salary calculation and weekly statistics.

当前覆盖工时计算、午休扣减、提醒间隔、调休、大小周、临时作息、工资估算和周统计等核心逻辑。

---

## 🛠 Developer commands / 开发命令

```bash
npm run dev
npm run tauri dev
npm test
npm run build
npm run tauri build
```

| Command | Purpose / 用途 |
|---|---|
| `npm run dev` | browser preview / 浏览器预览 |
| `npm run tauri dev` | desktop app / 完整桌面版 |
| `npm test` | unit tests / 单元测试 |
| `npm run build` | production frontend build / 前端构建 |
| `npm run tauri build` | desktop build / 桌面产物 |

---

## 🗺 Roadmap / 路线图

- [x] Workday progress / 工时进度
- [x] Desktop widgets / 桌面 Widget
- [x] System tray / 系统托盘
- [x] Local reminders / 本地提醒
- [x] China work schedules / 中国工作制
- [x] Weekly statistics / 周统计
- [x] Salary-day countdown / 发薪日倒计时
- [ ] Edge auto-hide / 贴边隐藏
- [ ] Mouse passthrough / 鼠标穿透
- [ ] Multi-monitor memory / 多屏位置记忆
- [ ] Global shortcuts / 全局快捷键
- [ ] Monthly templates / 月报与报销模板

---

## 🤝 Contributing / 参与贡献

Bug reports, UX ideas and small feature PRs are welcome.

欢迎提交 Bug、交互建议和小功能 PR，尤其是 Widget、提醒、Windows 桌面行为相关问题。

---

## 📄 License

MIT © Dreamer

<div align="center">

**The company wants you to “keep pushing”. This app just tells you how long until you can go home.**  
**公司要你继续加油，它只负责告诉你：还剩多久下班。**

</div>
