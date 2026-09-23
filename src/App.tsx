import { useEffect, useMemo, useState } from "react";
import { dateKey, isLastWorkdayOfWeek, nextHoliday, nextRestDay } from "./holidays";
import { applyDesktopSettings, desktopAvailable, initializeWidget, openDashboard } from "./desktop";
import { notifyDueAlerts } from "./notifications";
import { calculateDay, defaults, dueReminder, emptyDay, formatDuration, validateSettings, type RecordDay, type Settings } from "./workday";
import "./App.css";

const settingsKey = "worklife.settings";
const recordKey = "worklife.day";
const historyKey = "worklife.history";
const opacityPreviewKey = "worklife.widget.opacityPreview";
const themeChoices: { value: Settings["theme"]; label: string }[] = [{ value: "dark", label: "深色" }, { value: "light", label: "浅色" }, { value: "system", label: "跟随系统" }];
const dailyPhrases = ["今天也在好好生活。", "慢慢来，今天也算数。", "做完今天的事，去过自己的生活。", "留一点时间给自己。", "下班以后，才是你的时间。", "忙里也记得喝口水。", "把今天过成自己的节奏。"];
function stored<T>(key: string, fallback: T): T { try { return JSON.parse(localStorage.getItem(key) || "null") || fallback; } catch { return fallback; } }
const clockTime = (date: Date) => date.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", hour12: false });
function archiveRecord(record: RecordDay) { if (!record.start) return; const history = stored<Record<string, RecordDay>>(historyKey, {}); history[record.date] = record; localStorage.setItem(historyKey, JSON.stringify(history)); }
function playWoodfish() {
  const context = new AudioContext();
  const tone = context.createOscillator();
  const volume = context.createGain();
  tone.type = "sine";
  tone.frequency.setValueAtTime(520, context.currentTime);
  tone.frequency.exponentialRampToValueAtTime(230, context.currentTime + 0.13);
  volume.gain.setValueAtTime(0.12, context.currentTime);
  volume.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.16);
  tone.connect(volume).connect(context.destination);
  tone.start();
  tone.stop(context.currentTime + 0.17);
  tone.onended = () => void context.close();
}

function useWorklife() {
  const [now, setNow] = useState(new Date());
  const [settings, setSettings] = useState<Settings>(() => ({ ...defaults, ...stored<Partial<Settings>>(settingsKey, {}) }));
  const [record, setRecord] = useState<RecordDay>(() => { const saved = stored<RecordDay>(recordKey, emptyDay(dateKey(new Date()))); return saved.date === dateKey(new Date()) || (saved.start && !saved.clockOut) ? saved : emptyDay(dateKey(new Date())); });
  useEffect(() => { const id = window.setInterval(() => {
    setNow(new Date());
    if (new URLSearchParams(window.location.search).has("widget")) {
      const latestSettings = { ...defaults, ...stored<Partial<Settings>>(settingsKey, {}) };
      const latestRecord = stored<RecordDay>(recordKey, emptyDay(dateKey(new Date())));
      setSettings(previous => JSON.stringify(previous) === JSON.stringify(latestSettings) ? previous : latestSettings);
      setRecord(previous => JSON.stringify(previous) === JSON.stringify(latestRecord) ? previous : latestRecord);
    }
  }, 1000); return () => window.clearInterval(id); }, []);
  useEffect(() => { if (record.date !== dateKey(now) && (!record.start || record.clockOut)) { archiveRecord(record); setRecord(emptyDay(dateKey(now))); } }, [now, record]);
  useEffect(() => { localStorage.setItem(recordKey, JSON.stringify(record)); }, [record]);
  const updateRecord = (change: Partial<RecordDay>) => setRecord(previous => ({ ...previous, ...change }));
  const startNewDay = () => { archiveRecord(record); setRecord(emptyDay(dateKey(new Date()))); };
  return { now, settings, setSettings, record, updateRecord, startNewDay };
}

function Widget({ now, settings, record }: { now: Date; settings: Settings; record: RecordDay }) {
  const view = calculateDay(now, settings, record);
  const holiday = nextHoliday(now);
  const rest = nextRestDay(now, settings);
  const [opacity, setOpacity] = useState(() => Number(localStorage.getItem(opacityPreviewKey)) || settings.widgetOpacity);
  useEffect(() => { void initializeWidget(); }, []);
  useEffect(() => { const sync = () => setOpacity(Number(localStorage.getItem(opacityPreviewKey)) || settings.widgetOpacity); sync(); window.addEventListener("storage", sync); const id = window.setInterval(sync, 180); return () => { window.removeEventListener("storage", sync); window.clearInterval(id); }; }, [settings.widgetOpacity]);
  return <div className={`widget-page widget-${settings.widgetSize || "medium"}`} style={{ "--widget-opacity": opacity / 100 } as React.CSSProperties}>
    <div className="widget-card"><div className="widget-drag" data-tauri-drag-region><span data-tauri-drag-region>◌ 摸鱼助手</span><span data-tauri-drag-region>{clockTime(now)}</span></div>
      {settings.widgetSize !== "small" && <div className="widget-label">{view.primaryLabel}</div>}<strong>{formatDuration(view.primarySeconds)}</strong>
      {settings.widgetSize === "large" && <div className="widget-extra"><span>今日工作 <b>{formatDuration(view.worked)}</b></span><span>下个休息日 <b>{rest?.daysUntil ?? "—"} 天</b></span><span>下个节假日 <b>{holiday?.name || "待公布"}</b></span><span>今日功德 <b>+{record.merit || 0}</b></span></div>}
      {settings.widgetSize !== "small" && <div className="widget-progress"><i style={{ width: `${view.progress}%` }} /></div>}
      <div className="widget-footer"><span>{view.status} · {Math.round(view.progress)}%</span><button onClick={() => void openDashboard()}>打开主页</button></div></div>
  </div>;
}

function WidgetPreview({ size, opacity, now, view, record, rest, holiday }: { size: Settings["widgetSize"]; opacity: number; now: Date; view: ReturnType<typeof calculateDay>; record: RecordDay; rest: ReturnType<typeof nextRestDay>; holiday: ReturnType<typeof nextHoliday> }) {
  return <div className={`widget-preview-card preview-${size}`} style={{ "--widget-opacity": opacity / 100 } as React.CSSProperties}>
    <div>◌ 摸鱼助手 <span>{clockTime(now)}</span></div>
    {size !== "small" && <small>{view.primaryLabel}</small>}
    <strong>{formatDuration(view.primarySeconds)}</strong>
    {size === "large" && <div className="preview-extra"><span>今日工作<br /><b>{formatDuration(view.worked)}</b></span><span>下个休息日<br /><b>{rest?.daysUntil ?? "—"} 天</b></span><span>{holiday?.name || "下个节假日"}<br /><b>{holiday?.daysUntil ?? "—"} 天</b></span><span>今日功德<br /><b>+{record.merit || 0}</b></span></div>}
    {size !== "small" && <i />}
    <div className="preview-footer">{view.status} · {Math.round(view.progress)}% <span>打开主页</span></div>
  </div>;
}

function App() {
  const { now, settings, setSettings, record, updateRecord, startNewDay } = useWorklife();
  const [configured, setConfigured] = useState(() => Boolean(localStorage.getItem(settingsKey)));
  const [editing, setEditing] = useState(() => !localStorage.getItem(settingsKey));
  const [draft, setDraft] = useState(settings);
  const [error, setError] = useState<string | null>(null);
  const [desktopError, setDesktopError] = useState<string | null>(null);
  const [startInput, setStartInput] = useState(settings.start);
  const [systemDark, setSystemDark] = useState(() => window.matchMedia("(prefers-color-scheme: dark)").matches);
  const view = calculateDay(now, settings, record);
  const reminder = dueReminder(now, settings, record, view);
  const holiday = nextHoliday(now);
  const rest = nextRestDay(now, settings);
  const staleDay = record.date !== dateKey(now);
  const dailyPhrase = dailyPhrases[Math.floor(new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() / 86400000) % dailyPhrases.length];
  const cycleTasks = [{ id: "report", label: "提交周报", enabled: settings.weeklyReportEnabled }, { id: "timesheet", label: "填报工时系统", enabled: settings.timesheetEnabled }].filter(task => task.enabled);
  const cycleToday = !staleDay && settings.cycleEnabled && cycleTasks.length > 0 && isLastWorkdayOfWeek(now, settings);
  const cycleVisible = cycleToday && (settings.cycleAlwaysShow || clockTime(now) >= settings.cycleReminderTime);
  const isWidget = useMemo(() => new URLSearchParams(window.location.search).has("widget"), []);
  useEffect(() => { const media = window.matchMedia("(prefers-color-scheme: dark)"); const update = () => setSystemDark(media.matches); media.addEventListener("change", update); return () => media.removeEventListener("change", update); }, []);
  useEffect(() => { const choice = isWidget ? settings.theme : editing ? draft.theme : settings.theme; document.documentElement.dataset.theme = choice === "system" ? systemDark ? "dark" : "light" : choice; }, [settings.theme, draft.theme, editing, isWidget, systemDark]);
  useEffect(() => () => localStorage.removeItem(opacityPreviewKey), []);
  useEffect(() => { if (isWidget || !configured) return; void applyDesktopSettings(settings).catch(cause => setDesktopError(String(cause))); }, [settings, configured, isWidget]);
  useEffect(() => { if (isWidget || !configured || !desktopAvailable) return; void notifyDueAlerts(now, settings, record).catch(cause => setDesktopError(`通知未能发送：${String(cause)}`)); }, [now, settings, record, configured, isWidget]);
  if (isWidget) return <Widget now={now} settings={settings} record={record} />;

  const save = () => {
    const problem = validateSettings(draft);
    if (problem) { setError(problem); return; }
    localStorage.setItem(settingsKey, JSON.stringify(draft));
    localStorage.removeItem(opacityPreviewKey);
    setSettings(draft);
    setStartInput(draft.start);
    setConfigured(true);
    setEditing(false);
    setError(null);
  };
  const setting = (label: string, key: keyof Settings, type = "time") => <label>{label}<input type={type} value={String(draft[key])} min={type === "number" ? 1 : undefined} max={type === "number" ? 16 : undefined} step={type === "number" ? 0.5 : undefined} onChange={event => setDraft({ ...draft, [key]: type === "number" ? Number(event.target.value) : event.target.value })} /></label>;
  const acknowledge = (kind: "water" | "stretch") => updateRecord(kind === "water" ? { waterAt: now.toISOString(), waterCount: (record.waterCount || 0) + 1, waterSnoozeUntil: null } : { stretchAt: now.toISOString(), stretchCount: (record.stretchCount || 0) + 1, stretchSnoozeUntil: null });
  const snooze = (kind: "water" | "stretch") => updateRecord(kind === "water" ? { waterSnoozeUntil: new Date(now.getTime() + 600000).toISOString() } : { stretchSnoozeUntil: new Date(now.getTime() + 600000).toISOString() });
  const strikeWoodfish = () => { updateRecord({ merit: (record.merit || 0) + 1 }); if (settings.woodfishSound) playWoodfish(); };
  return <main className="shell"><header className="topbar"><div className="identity"><span className="logo">摸</span><div>摸鱼助手<small>WORKLIFE DASHBOARD</small></div></div>{configured && <button className="quiet" onClick={() => { localStorage.removeItem(opacityPreviewKey); setDraft(settings); setEditing(!editing); setError(null); }}>{editing ? "返回今日" : "工作设置"}</button>}</header>
    {editing ? <section className="panel settings"><p className="eyebrow">PREFERENCES</p><h1>{configured ? "按你的节奏来" : "先设置你的工作节奏"}</h1><p className="muted">所有记录只保存在本机。公司下班时间与目标工时分开计算。</p><div className="fields">{setting("默认上班", "start")}{setting("公司下班", "end")}{setting("午休开始", "lunchStart")}{setting("午休结束", "lunchEnd")}{setting("每日目标工时", "targetHours", "number")}
      <label>工作制<select value={draft.workweek} onChange={event => setDraft({ ...draft, workweek: event.target.value as Settings["workweek"] })}><option value="double">双休</option><option value="single">单休（周日休息）</option><option value="alternating">大小周</option><option value="custom">自定义</option></select></label><label>喝水提醒<select value={draft.waterMinutes} onChange={event => setDraft({ ...draft, waterMinutes: Number(event.target.value) })}><option value="0">关闭</option><option value="30">每 30 分钟</option><option value="45">每 45 分钟</option><option value="60">每 60 分钟</option><option value="90">每 90 分钟</option></select></label><label>久坐提醒<select value={draft.stretchMinutes} onChange={event => setDraft({ ...draft, stretchMinutes: Number(event.target.value) })}><option value="0">关闭</option><option value="60">每 60 分钟</option><option value="90">每 90 分钟</option><option value="120">每 120 分钟</option></select></label></div>
      {draft.workweek === "alternating" && <div className="schedule-detail"><label>选一个单休周的日期<input type="date" value={draft.alternatingAnchor} onChange={event => setDraft({ ...draft, alternatingAnchor: event.target.value })} /></label><p>该周周六上班；下一周周六休息，之后交替。法定节假日和调休补班优先。</p></div>}
      {draft.workweek === "custom" && <div className="schedule-detail"><strong>每周工作日</strong><div className="weekday-options">{[1, 2, 3, 4, 5, 6, 0].map((day, index) => <label key={day}><input type="checkbox" checked={draft.customWorkdays.includes(day)} onChange={event => setDraft({ ...draft, customWorkdays: event.target.checked ? [...draft.customWorkdays, day] : draft.customWorkdays.filter(value => value !== day) })} />{["一", "二", "三", "四", "五", "六", "日"][index]}</label>)}</div><p>已公布的法定假日和调休补班优先于每周设置。</p></div>}
      <div className="setting-note">按当前作息，到公司下班时间可工作 {Math.max(0, ((new Date(`2000-01-01T${draft.end}:00`).getTime() - new Date(`2000-01-01T${draft.start}:00`).getTime()) - (new Date(`2000-01-01T${draft.lunchEnd}:00`).getTime() - new Date(`2000-01-01T${draft.lunchStart}:00`).getTime())) / 3600000).toFixed(1)} 小时。</div><label className="check-field"><input type="checkbox" checked={draft.woodfishSound} onChange={event => setDraft({ ...draft, woodfishSound: event.target.checked })} />木鱼音效</label>
      <h2 className="settings-heading">外观主题</h2><p className="muted">选择你喜欢的显示方式，系统模式会自动跟随 Windows 外观。</p><div className="theme-options" role="group" aria-label="外观主题">{themeChoices.map(choice => <button key={choice.value} className={draft.theme === choice.value ? "selected" : ""} aria-pressed={draft.theme === choice.value} onClick={() => setDraft({ ...draft, theme: choice.value })}>{choice.label}</button>)}</div>
      <h2 className="settings-heading">工作周期提醒</h2><label className="check-field"><input type="checkbox" checked={draft.cycleEnabled} onChange={event => setDraft({ ...draft, cycleEnabled: event.target.checked })} />开启工作周期提醒</label>{draft.cycleEnabled && <div className="cycle-settings"><p className="muted small">默认不选事项，仅在本周最后一个实际工作日提醒。</p><label className="check-field"><input type="checkbox" checked={draft.weeklyReportEnabled} onChange={event => setDraft({ ...draft, weeklyReportEnabled: event.target.checked })} />提交周报</label><label className="check-field"><input type="checkbox" checked={draft.timesheetEnabled} onChange={event => setDraft({ ...draft, timesheetEnabled: event.target.checked })} />填报工时系统</label><label>提醒时间 <input type="time" value={draft.cycleReminderTime} onChange={event => setDraft({ ...draft, cycleReminderTime: event.target.value })} /></label><label className="check-field"><input type="checkbox" checked={draft.cycleAlwaysShow} onChange={event => setDraft({ ...draft, cycleAlwaysShow: event.target.checked })} />当天始终显示事项</label></div>}
      <h2 className="settings-heading">Windows 桌面组件</h2><p className="muted">拖动组件顶部可移动位置；重启后继续使用上次位置。</p><div className="widget-setting-layout"><div className="fields widget-fields"><label className="check-field"><input type="checkbox" disabled={!desktopAvailable} checked={draft.widgetEnabled} onChange={event => setDraft({ ...draft, widgetEnabled: event.target.checked })} />显示 Widget</label><label className="check-field"><input type="checkbox" disabled={!desktopAvailable} checked={draft.widgetOnTop} onChange={event => setDraft({ ...draft, widgetOnTop: event.target.checked })} />始终置顶</label><label>组件尺寸<select value={draft.widgetSize} onChange={event => setDraft({ ...draft, widgetSize: event.target.value as Settings["widgetSize"] })}><option value="small">小 · 倒计时</option><option value="medium">中 · 时间与进度</option><option value="large">大 · 今日与盼头</option></select></label><label>组件不透明度 {draft.widgetOpacity}%<input type="range" min="20" max="100" value={draft.widgetOpacity} onChange={event => { const value = Number(event.target.value); setDraft({ ...draft, widgetOpacity: value }); localStorage.setItem(opacityPreviewKey, String(value)); }} /></label><label className="check-field"><input type="checkbox" disabled={!desktopAvailable} checked={draft.autostart} onChange={event => setDraft({ ...draft, autostart: event.target.checked })} />开机启动</label></div><div className="widget-preview-scene"><span>实时预览 · {draft.widgetOpacity}%</span><WidgetPreview size={draft.widgetSize} opacity={draft.widgetOpacity} now={now} view={view} record={record} rest={rest} holiday={holiday} /><p>拖动滑块即可看到变化；打开的桌面组件也会同步更新。</p></div></div>{!desktopAvailable && <p className="muted small">桌面开关需要在 Tauri 应用内使用；浏览器可预览其余功能。</p>}{error && <p className="error" role="alert">{error}</p>}<button className="primary" onClick={save}>保存并返回</button></section> : <><section className="intro"><div><p className="eyebrow">WORKLIFE DASHBOARD · TODAY</p><div className="intro-title"><h1>{now.toLocaleDateString("zh-CN", { month: "long", day: "numeric", weekday: "long" })} <span>· {clockTime(now)}</span></h1><span className="day-quote">{dailyPhrase}</span></div></div><span className="status">{view.status}</span></section>
      {desktopError && <div className="inline-alert" role="alert">桌面设置未能应用：{desktopError}</div>}
      {staleDay && <section className="start-prompt"><div><strong>{record.date} 的工作尚未打卡</strong><p>可先补记打卡，或开始新的一天。</p></div><div><button onClick={() => updateRecord({ clockOut: now.toISOString() })}>补记打卡</button><button className="primary" onClick={startNewDay}>开始新的一天</button></div></section>}
      {!staleDay && !record.start && <section className="start-prompt"><div><strong>今天几点开始工作？</strong><p>确认实际开工时间，计时才会准确。</p></div><div><input aria-label="今天实际开工时间" type="time" value={startInput} onChange={event => setStartInput(event.target.value)} /><button onClick={() => updateRecord({ start: clockTime(now) })}>按当前时间</button><button className="primary" onClick={() => updateRecord({ start: startInput || settings.start })}>开始今天</button></div></section>}
      {reminder && <section className="reminder-banner" role="status"><div><strong>{reminder === "water" ? "该喝口水了" : "起来活动一下吧"}</strong><p>{reminder === "water" ? "给自己一点补水时间。" : "看远处 20 秒，活动一下肩颈。"}</p></div><div><button onClick={() => acknowledge(reminder)}>{reminder === "water" ? "喝了" : "活动了"}</button><button onClick={() => snooze(reminder)}>10 分钟后</button><button onClick={() => updateRecord({ remindersOff: true })}>今天关闭</button></div></section>}
      {cycleVisible && <section className="cycle-card" role="status"><div><p className="eyebrow">本周收尾</p><strong>今天是本周最后一个工作日</strong><p className="muted small">下班前还有 {cycleTasks.filter(task => !record.cycleCompleted?.includes(task.id)).length} 件事。勾选后会保存在今天的记录里。</p></div><div>{cycleTasks.map(task => <label key={task.id}><input type="checkbox" checked={record.cycleCompleted?.includes(task.id) || false} onChange={event => updateRecord({ cycleCompleted: event.target.checked ? [...(record.cycleCompleted || []), task.id] : (record.cycleCompleted || []).filter(id => id !== task.id) })} />{task.label}</label>)}</div></section>}
      {view.targetReached && !record.clockOut && <div className="inline-alert">今天已经工作满 {settings.targetHours} 小时，该下班打卡了。</div>}
      <div className="grid"><section className="panel hero"><p className="eyebrow">今天的工作进度</p><div className="ring" style={{ "--progress": `${view.progress}%` } as React.CSSProperties}><div className="ring-content"><span>{view.primaryLabel}</span><strong>{formatDuration(view.primarySeconds)}</strong><small>今天已完成 {Math.round(view.progress)}%</small></div></div></section><div className="side"><section className="panel next"><p className="eyebrow">接下来值得期待</p><div className="expectation"><span>下个休息日</span><strong>{rest ? rest.daysUntil === 0 ? "今天" : `${rest.daysUntil} 天` : "待确认"}</strong><small>{{ double: "双休", single: "单休", alternating: "大小周", custom: "自定义" }[settings.workweek]}</small></div><div className="expectation"><span>{holiday?.name || "下个节假日"}</span><strong>{holiday ? holiday.ongoing ? "假期中" : `${holiday.daysUntil} 天` : "待公布"}</strong><small>法定节假日</small></div></section><section className="panel milestones"><p className="eyebrow">今日节奏</p><div><span>现在</span><b>{view.status}</b></div><div><span>午休安排</span><b>{settings.lunchStart} — {settings.lunchEnd}</b></div><div><span>今日计划</span><b>{view.message}</b></div></section></div></div>
      <section className="panel daily-summary"><p className="eyebrow">今日关键时间</p><div className="summary-items"><div><span>公司制度下班</span><strong>{settings.end}</strong></div><div><span>工作满 {settings.targetHours} 小时</span><strong>{view.targetTime}</strong></div><div><span>今日开始</span><strong>{record.start || "待开工"}</strong></div><div><span>有效工作</span><strong>{formatDuration(view.worked)}</strong></div></div></section>
      <div className="outlook"><section className="panel timeline-panel"><p className="eyebrow">今天的状态时间轴</p><div className="timeline"><span><small>{record.start || settings.start}</small><b>开始工作</b></span><span><small>{settings.lunchStart}</small><b>午饭</b></span><span><small>{settings.lunchEnd}</small><b>继续工作</b></span><span><small>{settings.end}</small><b>制度下班</b></span><span><small>{view.targetTime}</small><b>目标达标</b></span></div></section><section className="panel merit-panel"><p className="eyebrow">今日功德</p><strong>+{record.merit || 0}</strong><p className="muted">轻点木鱼，给今天一点回应。</p><button className="woodfish-button" onClick={strikeWoodfish} aria-label="敲木鱼，功德加一"><svg viewBox="0 0 64 64" aria-hidden="true"><path d="M9 42c0-12 10-22 23-22s23 10 23 22c0 8-10 14-23 14S9 50 9 42Z" fill="currentColor"/><path d="M20 39c6 5 18 5 24 0M18 48c7 5 21 5 28 0" fill="none" stroke="#753d16" strokeWidth="3" strokeLinecap="round"/><circle cx="32" cy="33" r="3" fill="#753d16"/><path d="m45 8 10 19" stroke="#8e4b1b" strokeWidth="5" strokeLinecap="round"/><circle cx="56" cy="28" r="5" fill="#d5873e"/></svg><span>敲一下 +1</span></button></section></div>
      {record.start && !record.clockOut && <section className="actions"><div><p className="eyebrow">今日快捷操作</p><h2>按真实节奏记录今天</h2><p className="muted small">喝水 {record.waterCount || 0} 次 · 活动 {record.stretchCount || 0} 次</p></div><div>{!record.lunchStart && <button onClick={() => updateRecord({ lunchStart: now.toISOString() })}>我去吃饭了</button>}{record.lunchStart && !record.lunchEnd && <button onClick={() => updateRecord({ lunchEnd: now.toISOString() })}>继续工作</button>}<button className="primary" onClick={() => updateRecord({ clockOut: now.toISOString(), lunchEnd: record.lunchStart && !record.lunchEnd ? now.toISOString() : record.lunchEnd })}>我打卡了</button></div></section>}</>}
  </main>;
}

export default App;
