<div align="center">

<img src="https://readme-typing-svg.herokuapp.com?font=Space+Grotesk&weight=700&size=30&duration=2200&pause=900&color=F59E0B&center=true&vCenter=true&width=900&lines=TURN+YOUR+WORKDAY+INTO+A+PROGRESS+BAR;LOCAL-FIRST+%C2%B7+PRIVATE+%C2%B7+DESKTOP+WIDGETS" alt="Typing SVG" />

# WorkLife Dashboard

**Turn the workday into a private, local-first progress bar with reminders and desktop widgets.**

[English](./README.md) | [简体中文](./README.zh-CN.md)

[![Tauri](https://img.shields.io/badge/Tauri-2.x-24C8DB?style=for-the-badge&logo=tauri&logoColor=white)](https://tauri.app)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![Version](https://img.shields.io/badge/version-0.1.4-F59E0B?style=for-the-badge)](./package.json)
[![License](https://img.shields.io/badge/LICENSE-MIT-10B981?style=for-the-badge)](#license)

</div>

---

## What it is

WorkLife Dashboard is a desktop companion for people who want to see how much of the workday is left without turning work into another productivity competition.

> **It is a dashboard, not a supervisor.**

---

## Demo

<div align="center">

<img width="92%" alt="WorkLife Dashboard main view" src="https://github.com/user-attachments/assets/966a76ac-42fe-423e-b952-3dd41fe8bbc9" />

<img width="92%" alt="WorkLife Dashboard secondary view" src="https://github.com/user-attachments/assets/2f044bae-8fd7-4253-975d-6a7d156e537f" />

</div>

> Next visual asset: a 10–15 second GIF showing the desktop widget, tray behavior and reminders.

---

## Get it

Download the latest portable Windows build from **GitHub Releases**. No installer is required.

For development:

```bash
git clone https://github.com/Dream22180971/WorkLife-Dashboard.git
cd WorkLife-Dashboard

npm install
npm run tauri dev
```

Requirements:

- Node.js
- Rust
- Windows is the primary tested desktop target

---

## Highlights

| Feature | What it does |
|---|---|
| ⏱ Workday progress | shows work, lunch and off-work progress in real time |
| 🖥 Desktop Widget | small / medium / large desktop views |
| 🔔 Reminders | lunch, water, movement and off-work notifications |
| 🇨🇳 China work schedules | weekends, single-rest weeks, alternating weeks and holiday overrides |
| 💰 Salary countdown | salary-day countdown and daily earning estimate |
| 🪵 Electronic wooden fish | a tiny “merit +1” interaction |
| 📊 Weekly review | effective hours, overtime and average check-out time |
| 🔐 Local-first | personal settings and records stay on your device |

---

## Daily Flow

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

The app keeps **company off-work time** and **target work hours** as separate signals so the dashboard reflects the real workday instead of collapsing everything into one timer.

---

## Widget Modes

| Size | Shows |
|---|---|
| Small | countdown |
| Medium | time + progress + state |
| Large | work hours + next break + next holiday + merit |

The widget supports position memory, transparency and always-on-top behavior.

---

## Reminder System

Available reminders include:

- off-work in 30 minutes
- off-work now
- lunch
- lunch break end
- target work hours reached
- drink water
- move after sitting
- weekly wrap-up tasks

Recurring work reminders can be enabled or disabled independently.

---

## China Work Schedule Support

Supported modes include:

- two-day weekend
- single weekly rest day
- alternating weekends
- custom working weekdays
- official holiday and make-up workday overrides

Holiday data is configured explicitly rather than guessed.

---

## Privacy & Local-first

- No account system.
- No cloud sync.
- No hidden telemetry.
- Personal settings and records stay local.

---

## Testing

```bash
npm test
```

Current tests cover work-hour calculations, lunch deduction, reminders, holiday overrides, alternating-week schedules, temporary daily overrides, salary calculation and weekly statistics.

---

## Developer Commands

```bash
npm run dev
npm run tauri dev
npm test
npm run build
npm run tauri build
```

| Command | Purpose |
|---|---|
| `npm run dev` | browser preview |
| `npm run tauri dev` | full desktop app |
| `npm test` | unit tests |
| `npm run build` | production frontend build |
| `npm run tauri build` | desktop build |

---

## Roadmap

- [x] Workday progress
- [x] Desktop widgets
- [x] System tray
- [x] Local reminders
- [x] China work schedules
- [x] Weekly statistics
- [x] Salary-day countdown
- [ ] Edge auto-hide
- [ ] Mouse passthrough
- [ ] Multi-monitor position memory
- [ ] Global shortcuts
- [ ] Monthly / reimbursement templates

---

## Contributing

Bug reports, UX ideas and small feature PRs are welcome, especially around widgets, reminders and Windows desktop behavior.

---

## License

MIT © Dreamer

<div align="center">

**The company wants you to keep pushing. This app just tells you how long until you can go home.**

</div>
