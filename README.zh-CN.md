<div align="center">

# 摸鱼助手 · WorkLife Dashboard

**把上班变成一条本地、私密、带提醒和桌面 Widget 的进度条。**

[English](./README.md) | [简体中文](./README.zh-CN.md)

[![Tauri](https://img.shields.io/badge/Tauri-2.x-24C8DB?style=for-the-badge&logo=tauri&logoColor=white)](https://tauri.app)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![Version](https://img.shields.io/badge/version-0.1.4-F59E0B?style=for-the-badge)](./package.json)
[![License](https://img.shields.io/badge/LICENSE-MIT-10B981?style=for-the-badge)](#许可证)

</div>

---

## 🎯 它是什么

摸鱼助手是一个桌面端工作进度工具。它不把工作变成新的“效率竞赛”，只负责告诉你今天工作到哪了、还剩多久、什么时候该休息、什么时候可以收工。

> **它是仪表盘，不是电子监工。**

---

## 🎬 演示

<div align="center">

<img width="92%" alt="摸鱼助手主界面" src="https://github.com/user-attachments/assets/966a76ac-42fe-423e-b952-3dd41fe8bbc9" />

<img width="92%" alt="摸鱼助手其他界面" src="https://github.com/user-attachments/assets/2f044bae-8fd7-4253-975d-6a7d156e537f" />

</div>

> 下一步最值得补的是 10–15 秒 GIF：展示桌面 Widget、系统托盘和提醒的完整交互。

---

## 📦 直接使用

从 **GitHub Releases** 下载最新 Windows 便携版，双击即可运行，不需要安装程序。

开发模式：

```bash
git clone https://github.com/Dream22180971/WorkLife-Dashboard.git
cd WorkLife-Dashboard

npm install
npm run tauri dev
```

环境要求：

- Node.js
- Rust
- 当前主要测试平台为 Windows

---

## ✨ 核心功能

| 功能 | 说明 |
|---|---|
| ⏱ 工作进度 | 实时展示工作、午休和下班进度 |
| 🖥 桌面 Widget | 小 / 中 / 大三档桌面视图 |
| 🔔 提醒 | 午饭、喝水、久坐、下班等系统提醒 |
| 🇨🇳 中国工作制 | 双休、单休、大小周、法定节假日与补班 |
| 💰 发薪日倒计时 | 发薪日和当日收入估算 |
| 🪵 电子木鱼 | 上班功德 +1 的小互动 |
| 📊 每周回顾 | 有效工时、加班、平均打卡时间 |
| 🔐 本地优先 | 设置与记录默认保存在本机 |

---

## ⏱ 一天怎么走

```text
开始工作
  ↓
工作
  ↓
午饭
  ↓
继续工作
  ↓
公司制度下班时间
  ↓
目标工时达标
  ↓
打卡收工
```

系统会把 **公司制度下班时间** 和 **实际目标工时** 分开计算，让进度条更接近真实工作日，而不是把所有时间压成一个倒计时。

---

## 🖥 Widget 模式

| 尺寸 | 展示 |
|---|---|
| 小 | 倒计时 |
| 中 | 时间 + 进度 + 状态 |
| 大 | 工时 + 下个休息日 + 下个节假日 + 功德 |

Widget 支持位置记忆、透明度和置顶。

---

## 🔔 提醒系统

当前可用提醒包括：

- 下班前 30 分钟
- 到点下班
- 午饭
- 午休结束
- 目标工时达标
- 喝水
- 久坐活动
- 每周收尾事项

周期性工作提醒可以独立开启或关闭。

---

## 🇨🇳 中国工作制支持

支持：

- 双休
- 单休
- 大小周
- 自定义每周工作日
- 法定节假日与补班覆盖

节假日数据采用明确配置，不提前猜测下一年的调休。

---

## 🔐 隐私与本地优先

- 不需要注册账号。
- 不做云同步。
- 不做隐藏遥测。
- 个人设置和记录留在本机。

---

## 🧪 测试

```bash
npm test
```

当前测试覆盖工时计算、午休扣减、提醒、节假日覆盖、大小周、临时作息、工资估算和周统计等核心逻辑。

---

## 🛠 开发命令

```bash
npm run dev
npm run tauri dev
npm test
npm run build
npm run tauri build
```

| 命令 | 用途 |
|---|---|
| `npm run dev` | 浏览器预览 |
| `npm run tauri dev` | 完整桌面版 |
| `npm test` | 单元测试 |
| `npm run build` | 前端生产构建 |
| `npm run tauri build` | 桌面产物 |

---

## 🗺 路线图

- [x] 工作日进度
- [x] 桌面 Widget
- [x] 系统托盘
- [x] 本地提醒
- [x] 中国工作制
- [x] 每周统计
- [x] 发薪日倒计时
- [ ] 贴边隐藏
- [ ] 鼠标穿透
- [ ] 多屏位置记忆
- [ ] 全局快捷键
- [ ] 月报 / 报销模板

---

## 🤝 参与贡献

欢迎提交 Bug、交互建议和小功能 PR，尤其是 Widget、提醒和 Windows 桌面行为相关问题。

---

## 📄 许可证

MIT © Dreamer

<div align="center">

**公司要你继续加油，它只负责告诉你：还剩多久下班。**

</div>
