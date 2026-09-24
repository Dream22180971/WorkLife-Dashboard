import { dateKey, isRestDay } from "./holidays.ts";
import { calculateDay, type RecordDay, type Settings } from "./workday.ts";

const fromKey = (key: string) => { const [year, month, day] = key.split("-").map(Number); return new Date(year, month - 1, day); };
const daysBetween = (from: Date, to: Date) => Math.round((Date.UTC(to.getFullYear(), to.getMonth(), to.getDate()) - Date.UTC(from.getFullYear(), from.getMonth(), from.getDate())) / 86400000);

export function nextPayday(now: Date, day: number) {
  const target = (year: number, month: number) => new Date(year, month, Math.min(day, new Date(year, month + 1, 0).getDate()));
  let date = target(now.getFullYear(), now.getMonth());
  if (daysBetween(now, date) < 0) date = target(now.getFullYear(), now.getMonth() + 1);
  return { date, daysUntil: daysBetween(now, date) };
}

export function upcomingCountdowns(now: Date, items: Settings["countdowns"]) {
  return (items || []).map(item => ({ ...item, daysUntil: daysBetween(now, fromKey(item.date)) })).filter(item => item.daysUntil >= 0).sort((a, b) => a.daysUntil - b.daysUntil).slice(0, 2);
}

export function plannedWorkdays(now: Date, settings: Settings) {
  const count = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  let days = 0;
  for (let day = 1; day <= count; day++) if (!isRestDay(new Date(now.getFullYear(), now.getMonth(), day), settings)) days++;
  return days;
}

export function salaryEstimate(now: Date, settings: Settings, workedSeconds: number) {
  const workdays = plannedWorkdays(now, settings);
  const hourly = settings.monthlySalary > 0 && workdays > 0 ? settings.monthlySalary / workdays / settings.targetHours : 0;
  return { hourly, today: hourly * workedSeconds / 3600, workdays };
}

export function weeklySummary(now: Date, settings: Settings, records: RecordDay[]) {
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - ((now.getDay() + 6) % 7));
  const first = dateKey(monday), last = dateKey(now);
  let worked = 0, overtime = 0, merit = 0, water = 0, clockOutMinutes = 0, clockOutCount = 0, days = 0;
  let cycleDone = 0, cycleTotal = 0;
  for (const record of records) {
    if (!record.start || record.date < first || record.date > last) continue;
    const stop = record.clockOut ? new Date(record.clockOut) : record.date === last ? now : null;
    if (!stop) continue;
    const view = calculateDay(stop, settings, record);
    worked += view.worked;
    days++;
    merit += record.merit || 0;
    water += record.waterCount || 0;
    if (record.clockOut) {
      const end = fromKey(record.date);
      const [hour, minute] = (record.todayEnd || settings.end).split(":").map(Number);
      end.setHours(hour, minute, 0, 0);
      const workedAtEnd = calculateDay(end, settings, record).worked;
      overtime += Math.max(0, view.worked - workedAtEnd);
      clockOutMinutes += stop.getHours() * 60 + stop.getMinutes();
      clockOutCount++;
    }
    if (settings.cycleEnabled && isRestDay(fromKey(record.date), settings) === false) {
      for (const id of [settings.weeklyReportEnabled && "report", settings.timesheetEnabled && "timesheet"].filter(Boolean)) {
        if (record.cycleCompleted?.includes(id as string)) cycleDone++;
      }
    }
  }
  // A weekly cycle has at most two configured items; completion is counted once per item.
  if (settings.cycleEnabled) cycleTotal = Number(settings.weeklyReportEnabled) + Number(settings.timesheetEnabled);
  cycleDone = Math.min(cycleDone, cycleTotal);
  const meanMinutes = Math.round(clockOutMinutes / (clockOutCount || 1));
  const averageClockOut = clockOutCount ? `${String(Math.floor(meanMinutes / 60)).padStart(2, "0")}:${String(meanMinutes % 60).padStart(2, "0")}` : "—";
  return { worked, average: days ? worked / days : 0, overtime, averageClockOut, merit, water, days, cycleDone, cycleTotal };
}
