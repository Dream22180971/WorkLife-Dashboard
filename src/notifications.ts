import { isPermissionGranted, requestPermission, sendNotification } from "@tauri-apps/plugin-notification";
import { invoke, isTauri } from "@tauri-apps/api/core";
import { dateKey, isLastWorkdayOfWeek, isRestDay } from "./holidays.ts";
import { calculateDay, dueReminder, type RecordDay, type Settings } from "./workday.ts";

export type WorkAlert = { id: string; title: string; body: string };
export type ScheduledAlert = WorkAlert & { dueMs: number; expiresMs: number };
const sentKey = "worklife.notifications.sent";
export const clearNotificationHistory = () => localStorage.removeItem(sentKey);
let sending = false;

const at = (day: Date, time: string) => {
  const [hour, minute] = time.split(":").map(Number);
  return new Date(day.getFullYear(), day.getMonth(), day.getDate(), hour, minute).getTime();
};

export function scheduleAlerts(now: Date, settings: Settings, record: RecordDay): ScheduledAlert[] {
  if (record.date !== dateKey(now) || record.clockOut || record.remindersOff || record.mode === "leave") return [];
  const day = new Date(`${record.date}T00:00:00`);
  const pauseUntil = record.remindersPausedUntil ? new Date(record.remindersPausedUntil).getTime() : 0;
  const alerts: ScheduledAlert[] = [];
  const add = (id: string, due: number, title: string, body: string, windowMs = 30 * 60000) => {
    const dueMs = Math.max(due, pauseUntil);
    const expiresMs = Math.min(due + windowMs, at(day, "23:59") + 60000);
    if (Number.isFinite(dueMs) && dueMs < expiresMs) alerts.push({ id, title, body, dueMs, expiresMs });
  };

  if (!record.start) {
    if (!isRestDay(day, settings)) add("start-work", at(day, settings.start), "该开始今天了", "确认实际开工时间，开始记录今天的工作。");
    return alerts;
  }

  const lunchStart = at(day, record.todayLunchStart || settings.lunchStart);
  const lunchEnd = at(day, record.todayLunchEnd || settings.lunchEnd);
  const actualLunchStart = record.lunchStart ? new Date(record.lunchStart).getTime() : lunchStart;
  const actualLunchEnd = record.lunchEnd ? new Date(record.lunchEnd).getTime() : record.lunchStart ? actualLunchStart + lunchEnd - lunchStart : lunchEnd;
  const manualLunchActive = Boolean(record.lunchStart && !record.lunchEnd);
  const outsideLunch = (time: number) => time < actualLunchStart || time >= actualLunchEnd;
  const companyEnd = at(day, record.todayEnd || settings.end);
  if (!manualLunchActive && outsideLunch(companyEnd - 30 * 60000)) add("before-end", companyEnd - 30 * 60000, "还有 30 分钟下班", "今天的工作快到公司下班时间了。");
  if (!manualLunchActive && outsideLunch(companyEnd)) add("company-end", companyEnd, "到公司下班时间了", "需要打卡了吗？应用不会自动替你打卡。");

  if (!record.lunchStart) add("lunch-start", lunchStart, "午饭时间到了", "记得让自己休息一下。");
  if (!record.lunchEnd) {
    add("lunch-10", actualLunchEnd - 10 * 60000, "午休还有 10 分钟", "稍后准备继续工作。");
    add("lunch-end", actualLunchEnd, "午休时间到了", "准备继续工作了吗？");
  }

  if (!manualLunchActive) {
    const targetTime = calculateDay(now, settings, record).targetTime;
    if (/^\d\d:\d\d$/.test(targetTime)) add("target-reached", at(day, targetTime), "今日目标工时已达标", `有效工作已满 ${settings.targetHours} 小时，可以打卡了。`);
  }

  const body = (kind: "water" | "stretch", minutes: number, lastAt: string | null | undefined, snoozeUntil: string | null | undefined, title: string, message: string) => {
    if (minutes <= 0 || manualLunchActive) return;
    const base = lastAt ? new Date(lastAt).getTime() : at(day, record.start);
    const snooze = snoozeUntil ? new Date(snoozeUntil).getTime() : 0;
    let due = Math.max(base + minutes * 60000, snooze);
    if (due >= actualLunchStart && due < actualLunchEnd) due = actualLunchEnd;
    add(`${kind}:${lastAt || record.start}:${snoozeUntil || ""}`, due, title, message, 24 * 3600000);
  };
  body("water", settings.waterMinutes, record.waterAt, record.waterSnoozeUntil, "该喝水了", "喝口水，休息一下。");
  body("stretch", settings.stretchMinutes, record.stretchAt, record.stretchSnoozeUntil, "起来活动一下", "站起来，看看远处，放松肩颈。");

  if (settings.cycleEnabled && isLastWorkdayOfWeek(day, settings)) {
    const pending = [settings.timesheetEnabled && !record.cycleCompleted?.includes("timesheet") ? "填报工时" : null, settings.weeklyReportEnabled && !record.cycleCompleted?.includes("report") ? "提交周报" : null].filter(Boolean);
    if (pending.length) add("weekly-close", at(day, settings.cycleReminderTime), "本周收尾", `下班前还有 ${pending.length} 件事：${pending.join("、")}。`, 6 * 3600000);
  }
  return alerts;
}

export async function syncBackgroundAlerts(now: Date, settings: Settings, record: RecordDay, configured: boolean) {
  if (!isTauri()) return;
  await invoke("set_scheduled_alerts", { date: record.date, alerts: configured ? scheduleAlerts(now, settings, record) : [] });
}

export function collectAlerts(now: Date, settings: Settings, record: RecordDay): WorkAlert[] {
  if (record.clockOut || record.remindersOff || record.mode === "leave" || (record.remindersPausedUntil && now.getTime() < new Date(record.remindersPausedUntil).getTime())) return [];
  if (record.date !== `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`) return [];
  const view = calculateDay(now, settings, record);
  const alerts: WorkAlert[] = [];
  const current = now.getTime();
  const event = (id: string, when: number, title: string, body: string) => {
    if (current >= when && current < when + 30 * 60000) alerts.push({ id, title, body });
  };

  if (!record.start) {
    event("start-work", at(now, settings.start), "该开始今天了", "确认实际开工时间，开始记录今天的工作。");
    return alerts;
  }

  if (!view.lunching) {
    event("before-end", at(now, record.todayEnd || settings.end) - 30 * 60000, "还有 30 分钟下班", "今天的工作快到公司下班时间了。");
    event("company-end", at(now, record.todayEnd || settings.end), "到公司下班时间了", "需要打卡了吗？应用不会自动替你打卡。");
  }
  if (view.targetReached) alerts.push({ id: "target-reached", title: "今日目标工时已达标", body: `有效工作已满 ${settings.targetHours} 小时，可以打卡了。` });
  if (view.lunching) {
    const lunchEnd = at(now, record.todayLunchEnd || settings.lunchEnd);
    event("lunch-10", lunchEnd - 10 * 60000, "午休还有 10 分钟", "稍后准备继续工作。" );
    event("lunch-end", lunchEnd, "午休时间到了", "准备继续工作了吗？" );
  } else if (!record.lunchStart) event("lunch-start", at(now, record.todayLunchStart || settings.lunchStart), "午饭时间到了", "记得让自己休息一下。" );

  const bodyReminder = dueReminder(now, settings, record, view);
  if (bodyReminder === "water") alerts.push({ id: `water:${record.waterAt || record.start}:${record.waterSnoozeUntil || ""}`, title: "该喝水了", body: "喝口水，休息一下。" });
  if (bodyReminder === "stretch") alerts.push({ id: `stretch:${record.stretchAt || record.start}:${record.stretchSnoozeUntil || ""}`, title: "起来活动一下", body: "站起来，看看远处，放松肩颈。" });

  if (settings.cycleEnabled && isLastWorkdayOfWeek(now, settings) && current >= at(now, settings.cycleReminderTime)) {
    const pending = [settings.timesheetEnabled && !record.cycleCompleted?.includes("timesheet") ? "填报工时" : null, settings.weeklyReportEnabled && !record.cycleCompleted?.includes("report") ? "提交周报" : null].filter(Boolean);
    if (pending.length) alerts.push({ id: "weekly-close", title: "本周收尾", body: `下班前还有 ${pending.length} 件事：${pending.join("、")}。` });
  }
  return alerts;
}

export async function notifyDueAlerts(now: Date, settings: Settings, record: RecordDay) {
  if (sending) return;
  const alerts = collectAlerts(now, settings, record);
  if (!alerts.length) return;
  sending = true;
  try {
  const date = record.date;
  const saved = JSON.parse(localStorage.getItem(sentKey) || "{}") as { date?: string; ids?: string[] };
  const ids = new Set(saved.date === date ? saved.ids : []);
  const unsent = alerts.filter(alert => !ids.has(alert.id));
  if (!unsent.length) return;
  if (!await notificationPermission()) return;
  for (const alert of unsent) {
    if (typeof window !== "undefined" && "__TAURI_INTERNALS__" in window) sendNotification({ title: alert.title, body: alert.body });
    else new Notification(alert.title, { body: alert.body });
    ids.add(alert.id);
  }
  localStorage.setItem(sentKey, JSON.stringify({ date, ids: [...ids] }));
  } finally { sending = false; }
}

async function notificationPermission() {
  if (typeof window !== "undefined" && "__TAURI_INTERNALS__" in window) return (await isPermissionGranted()) || (await requestPermission()) === "granted";
  if (typeof Notification === "undefined") return false;
  return Notification.permission === "granted" || (Notification.permission === "default" && await Notification.requestPermission() === "granted");
}

export async function sendTestNotification() {
  if (!await notificationPermission()) return false;
  if (typeof window !== "undefined" && "__TAURI_INTERNALS__" in window) sendNotification({ title: "摸鱼助手通知测试", body: "提醒已开启，到时间会通知你。" });
  else new Notification("摸鱼助手通知测试", { body: "提醒已开启，到时间会通知你。" });
  return true;
}
