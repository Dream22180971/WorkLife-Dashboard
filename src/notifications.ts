import { isPermissionGranted, requestPermission, sendNotification } from "@tauri-apps/plugin-notification";
import { isLastWorkdayOfWeek } from "./holidays.ts";
import { calculateDay, dueReminder, type RecordDay, type Settings } from "./workday.ts";

export type WorkAlert = { id: string; title: string; body: string };
const sentKey = "worklife.notifications.sent";
let permission: Promise<boolean> | null = null;
let sending = false;

const at = (day: Date, time: string) => {
  const [hour, minute] = time.split(":").map(Number);
  return new Date(day.getFullYear(), day.getMonth(), day.getDate(), hour, minute).getTime();
};

export function collectAlerts(now: Date, settings: Settings, record: RecordDay): WorkAlert[] {
  if (!record.start || record.clockOut || record.remindersOff) return [];
  if (record.date !== `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`) return [];
  const view = calculateDay(now, settings, record);
  const alerts: WorkAlert[] = [];
  const current = now.getTime();
  const event = (id: string, when: number, title: string, body: string) => {
    if (current >= when && current < when + 30 * 60000) alerts.push({ id, title, body });
  };

  if (!view.lunching) {
    event("before-end", at(now, settings.end) - 30 * 60000, "还有 30 分钟下班", "今天的工作快到公司下班时间了。");
    event("company-end", at(now, settings.end), "到公司下班时间了", "需要打卡了吗？应用不会自动替你打卡。");
  }
  if (view.targetReached) alerts.push({ id: "target-reached", title: "今日目标工时已达标", body: `有效工作已满 ${settings.targetHours} 小时，可以打卡了。` });
  if (view.lunching) {
    const lunchEnd = at(now, settings.lunchEnd);
    event("lunch-10", lunchEnd - 10 * 60000, "午休还有 10 分钟", "稍后准备继续工作。" );
    event("lunch-end", lunchEnd, "午休时间到了", "准备继续工作了吗？" );
  } else if (!record.lunchStart) event("lunch-start", at(now, settings.lunchStart), "午饭时间到了", "记得让自己休息一下。" );

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
  permission ||= (async () => (await isPermissionGranted()) || (await requestPermission()) === "granted")();
  if (!await permission) return;
  for (const alert of unsent) {
    sendNotification({ title: alert.title, body: alert.body });
    ids.add(alert.id);
  }
  localStorage.setItem(sentKey, JSON.stringify({ date, ids: [...ids] }));
  } finally { sending = false; }
}
