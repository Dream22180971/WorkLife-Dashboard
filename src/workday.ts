import { dateKey, isRestDay } from "./holidays.ts";

export type Settings = {
  start: string; end: string; lunchStart: string; lunchEnd: string; targetHours: number;
  workweek: "double" | "single" | "alternating" | "custom"; alternatingAnchor: string; customWorkdays: number[]; waterMinutes: number; stretchMinutes: number;
  widgetOpacity: number; widgetSize: "small" | "medium" | "large"; widgetOnTop: boolean; widgetEnabled: boolean; autostart: boolean; woodfishSound: boolean;
  theme: "dark" | "light" | "system";
  cycleEnabled: boolean; weeklyReportEnabled: boolean; timesheetEnabled: boolean; cycleReminderTime: string; cycleAlwaysShow: boolean;
  payday: number; monthlySalary: number; salaryHidden: boolean; countdowns: { id: string; title: string; date: string }[];
};
export type RecordDay = {
  date: string; start: string; lunchStart: string | null; lunchEnd: string | null; clockOut: string | null;
  waterAt?: string | null; stretchAt?: string | null; waterCount?: number; stretchCount?: number;
  waterSnoozeUntil?: string | null; stretchSnoozeUntil?: string | null; remindersOff?: boolean; merit?: number;
  cycleCompleted?: string[];
  todayEnd?: string | null; todayLunchStart?: string | null; todayLunchEnd?: string | null;
  mode?: "normal" | "leave" | "travel" | "home"; remindersPausedUntil?: string | null;
};
export const defaults: Settings = {
  start: "09:00", end: "18:00", lunchStart: "12:00", lunchEnd: "13:30", targetHours: 8,
  workweek: "double", alternatingAnchor: "2026-09-21", customWorkdays: [1, 2, 3, 4, 5], waterMinutes: 0, stretchMinutes: 0,
  widgetOpacity: 85, widgetSize: "medium", widgetOnTop: true, widgetEnabled: false, autostart: false, woodfishSound: true, theme: "dark",
  cycleEnabled: false, weeklyReportEnabled: false, timesheetEnabled: false, cycleReminderTime: "17:00", cycleAlwaysShow: false,
  payday: 10, monthlySalary: 0, salaryHidden: false, countdowns: [],
};
export const emptyDay = (date: string): RecordDay => ({ date, start: "", lunchStart: null, lunchEnd: null, clockOut: null, waterAt: null, stretchAt: null, waterCount: 0, stretchCount: 0, merit: 0, cycleCompleted: [] });
export const formatDuration = (total: number) => { const value = Math.max(0, Math.floor(total)); return `${String(Math.floor(value / 3600)).padStart(2, "0")}:${String(Math.floor(value % 3600 / 60)).padStart(2, "0")}:${String(value % 60).padStart(2, "0")}`; };
const delta = (later: number, earlier: number) => Math.max(0, Math.floor((later - earlier) / 1000));
const dayFromKey = (key: string) => { const [year, month, day] = key.split("-").map(Number); return new Date(year, month - 1, day); };
const at = (day: Date, time: string) => { const [hour, minute] = time.split(":").map(Number); const result = new Date(day); result.setHours(hour, minute, 0, 0); return result.getTime(); };

export function validateSettings(settings: Settings) {
  if (!/^\d\d:\d\d$/.test(settings.start) || !/^\d\d:\d\d$/.test(settings.end) || !/^\d\d:\d\d$/.test(settings.lunchStart) || !/^\d\d:\d\d$/.test(settings.lunchEnd)) return "请填写完整的时间。";
  const day = new Date(2026, 0, 1);
  if (at(day, settings.end) <= at(day, settings.start)) return "下班时间须晚于上班时间。";
  if (at(day, settings.lunchStart) < at(day, settings.start) || at(day, settings.lunchEnd) > at(day, settings.end) || at(day, settings.lunchEnd) <= at(day, settings.lunchStart)) return "午休须位于上班与下班之间。";
  if (!Number.isFinite(settings.targetHours) || settings.targetHours < 1 || settings.targetHours > 16) return "目标工时须为 1 至 16 小时。";
  if (settings.workweek === "alternating" && !/^\d{4}-\d{2}-\d{2}$/.test(settings.alternatingAnchor)) return "请选择一个单休周日期。";
  if (settings.workweek === "custom" && (!Array.isArray(settings.customWorkdays) || settings.customWorkdays.length === 0)) return "自定义工作制至少选择一天工作日。";
  if (!Number.isInteger(settings.payday) || settings.payday < 1 || settings.payday > 31) return "发薪日须为每月 1 至 31 日。";
  if (!Number.isFinite(settings.monthlySalary) || settings.monthlySalary < 0) return "月薪不能小于 0。";
  if (settings.countdowns?.some(item => {
    if (!item.title.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(item.date)) return true;
    return dateKey(dayFromKey(item.date)) !== item.date;
  })) return "请填写有效的盼头名称和日期。";
  return null;
}

export function calculateDay(now: Date, settings: Settings, record: RecordDay) {
  const current = now.getTime(), day = dayFromKey(record.date), start = record.start ? at(day, record.start) : null;
  const end = at(day, record.todayEnd || settings.end), plannedLunchStart = at(day, record.todayLunchStart || settings.lunchStart), plannedLunchEnd = at(day, record.todayLunchEnd || settings.lunchEnd);
  const lunchStart = record.lunchStart ? new Date(record.lunchStart).getTime() : plannedLunchStart;
  const plannedManualEnd = lunchStart + plannedLunchEnd - plannedLunchStart;
  const manualLunchActive = Boolean(record.lunchStart && !record.lunchEnd && !record.clockOut);
  const lunchEnd = record.lunchEnd ? new Date(record.lunchEnd).getTime() : manualLunchActive ? current : plannedLunchEnd;
  const stop = record.clockOut ? Math.min(current, new Date(record.clockOut).getTime()) : current;
  const elapsed = start === null ? 0 : delta(stop, start);
  const lunchDeduction = start === null ? 0 : delta(Math.min(stop, lunchEnd), Math.max(start, lunchStart));
  const worked = Math.max(0, elapsed - lunchDeduction), target = settings.targetHours * 3600;
  const rawTargetAt = start === null ? null : start + target * 1000;
  const targetAt = rawTargetAt === null ? null : rawTargetAt <= lunchStart ? rawTargetAt : rawTargetAt + Math.max(0, lunchEnd - Math.max(start ?? lunchStart, lunchStart));
  const targetTime = targetAt === null ? "待开工" : new Date(targetAt).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", hour12: false });
  const progress = Math.min(100, worked / target * 100);
  const lunching = start !== null && !record.clockOut && (manualLunchActive || (!record.lunchStart && current >= lunchStart && current < lunchEnd));
  const rest = record.mode === "leave" || (record.date === dateKey(now) && isRestDay(now, settings));
  let status = record.mode === "leave" ? "请假中" : rest ? "休息日" : "等待开工", primaryLabel = rest ? "今日休息" : "距离下班", primarySeconds = rest ? 0 : delta(end, current), message = rest ? "今天可以慢一点" : "确认开工时间，开始今天", nextLabel = rest ? "休息日" : "距离上班", nextSeconds = rest ? 0 : delta(at(day, settings.start), current), nextDetail = rest ? "今天没有默认工作安排。" : "今天的节奏，由你决定。";
  if (record.clockOut) { status = "已打卡"; primaryLabel = "今日有效工作"; primarySeconds = worked; message = "今天辛苦了"; nextLabel = "今日已打卡"; nextSeconds = 0; nextDetail = "剩下的时间属于你。"; }
  else if (record.mode === "leave") { status = "请假中"; primaryLabel = "今日休息"; primarySeconds = 0; nextLabel = "请假中"; nextSeconds = 0; nextDetail = "工作提醒已暂停。"; }
  else if (lunching) { status = "午休中"; primaryLabel = "午休还剩"; primarySeconds = delta(manualLunchActive ? plannedManualEnd : lunchEnd, current); message = manualLunchActive && current >= plannedManualEnd ? "午休已超过计划，点继续工作" : "安心吃饭，稍后继续"; nextLabel = "距离午休结束"; nextSeconds = primarySeconds; nextDetail = manualLunchActive ? "点继续工作后恢复有效工时" : `预计 ${new Date(lunchEnd).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", hour12: false })} 继续工作`; }
  else if (start !== null) {
    status = current >= end ? "加班中" : worked >= target ? "已达标" : "工作中";
    primaryLabel = current >= end ? "已经加班" : worked >= target ? "今日工作已达标" : current < plannedLunchStart ? "距离午饭" : "距离下班";
    primarySeconds = current >= end ? delta(current, end) : worked >= target ? worked : current < plannedLunchStart ? delta(plannedLunchStart, current) : delta(end, current);
    message = worked >= target ? "该下班打卡了" : "慢慢来，也是在向前";
    if (current < plannedLunchStart && !record.lunchStart) { nextLabel = "距离午饭"; nextSeconds = delta(plannedLunchStart, current); nextDetail = `午休 ${settings.lunchStart} — ${settings.lunchEnd}`; }
    else if (worked < target) { nextLabel = "距离满目标工时"; nextSeconds = target - worked; nextDetail = `预计 ${targetTime} 达标`; }
    else { nextLabel = "目标已完成"; nextSeconds = 0; nextDetail = "今天已经工作达标。"; }
  }
  if (record.mode === "travel" && start !== null && !record.clockOut) status = "出差中";
  if (record.mode === "home" && start !== null && !record.clockOut) status = "居家工作";
  return { status, primaryLabel, primarySeconds, message, nextLabel, nextSeconds, nextDetail, worked, progress, targetTime, lunching, endAt: end, targetReached: worked >= target };
}

export function dueReminder(now: Date, settings: Settings, record: RecordDay, view: ReturnType<typeof calculateDay>) {
  if (!record.start || record.clockOut || view.lunching || record.remindersOff || record.mode === "leave" || (record.remindersPausedUntil && now.getTime() < new Date(record.remindersPausedUntil).getTime())) return null;
  const start = at(dayFromKey(record.date), record.start), current = now.getTime();
  if (current < start) return null;
  const waterBase = record.waterAt ? new Date(record.waterAt).getTime() : start;
  const stretchBase = record.stretchAt ? new Date(record.stretchAt).getTime() : start;
  if (settings.waterMinutes > 0 && current >= waterBase + settings.waterMinutes * 60000 && current >= (record.waterSnoozeUntil ? new Date(record.waterSnoozeUntil).getTime() : 0)) return "water";
  if (settings.stretchMinutes > 0 && current >= stretchBase + settings.stretchMinutes * 60000 && current >= (record.stretchSnoozeUntil ? new Date(record.stretchSnoozeUntil).getTime() : 0)) return "stretch";
  return null;
}

export function currentTimelineStage(now: Date, settings: Settings, record: RecordDay, view = calculateDay(now, settings, record)) {
  if (!record.start || record.clockOut || record.mode === "leave") return null;
  if (view.lunching) return "lunch";
  const targetAt = /^\d\d:\d\d$/.test(view.targetTime) ? at(dayFromKey(record.date), view.targetTime) : Infinity;
  if (view.targetReached && targetAt >= view.endAt) return "target";
  if (now.getTime() >= view.endAt) return "end";
  if (view.targetReached) return "target";
  if (!record.lunchEnd && now.getTime() < at(dayFromKey(record.date), record.todayLunchStart || settings.lunchStart)) return "start";
  return "continue";
}
