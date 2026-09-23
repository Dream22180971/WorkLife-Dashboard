export type Holiday = { name: string; start: string; end: string; days: number };

// 国务院办公厅《2026年部分节假日安排的通知》（国办发明电〔2025〕7号）
// https://www.gov.cn/zhengce/zhengceku/202511/content_7047091.htm
export const holidays2026: Holiday[] = [
  { name: "元旦", start: "2026-01-01", end: "2026-01-03", days: 3 },
  { name: "春节", start: "2026-02-15", end: "2026-02-23", days: 9 },
  { name: "清明节", start: "2026-04-04", end: "2026-04-06", days: 3 },
  { name: "劳动节", start: "2026-05-01", end: "2026-05-05", days: 5 },
  { name: "端午节", start: "2026-06-19", end: "2026-06-21", days: 3 },
  { name: "中秋节", start: "2026-09-25", end: "2026-09-27", days: 3 },
  { name: "国庆节", start: "2026-10-01", end: "2026-10-07", days: 7 },
];

const adjustedWorkdays = new Set(["2026-01-04", "2026-02-14", "2026-02-28", "2026-05-09", "2026-09-20", "2026-10-10"]);
export const dateKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
export type WorkSchedule = { workweek: "double" | "single" | "alternating" | "custom"; alternatingAnchor: string; customWorkdays: number[] };
const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
const fromKey = (key: string) => { const [year, month, day] = key.split("-").map(Number); return new Date(year, month - 1, day); };

export function nextHoliday(now: Date) {
  const today = dateKey(now);
  const holiday = holidays2026.find(item => item.end >= today);
  if (!holiday) return null;
  const days = Math.round((startOfDay(fromKey(holiday.start)).getTime() - startOfDay(now).getTime()) / 86400000);
  return { ...holiday, daysUntil: Math.max(0, days), ongoing: days < 0 || (days === 0 && today >= holiday.start) };
}

export function isRestDay(date: Date, schedule: WorkSchedule | "double" | "single") {
  const key = dateKey(date);
  if (adjustedWorkdays.has(key)) return false;
  if (holidays2026.some(item => key >= item.start && key <= item.end)) return true;
  const workweek = typeof schedule === "string" ? schedule : schedule.workweek;
  if (typeof schedule !== "string" && workweek === "custom") return !schedule.customWorkdays.includes(date.getDay());
  if (typeof schedule !== "string" && workweek === "alternating") {
    const anchor = fromKey(schedule.alternatingAnchor);
    const weekStart = (value: Date) => Date.UTC(value.getFullYear(), value.getMonth(), value.getDate() - ((value.getDay() + 6) % 7));
    const singleWeek = Math.abs(Math.round((weekStart(date) - weekStart(anchor)) / 604800000)) % 2 === 0;
    return date.getDay() === 0 || (date.getDay() === 6 && !singleWeek);
  }
  return workweek === "double" ? date.getDay() === 0 || date.getDay() === 6 : date.getDay() === 0;
}

export function nextRestDay(now: Date, schedule: WorkSchedule | "double" | "single") {
  for (let offset = 0; offset <= 7; offset++) {
    const date = startOfDay(now);
    date.setDate(date.getDate() + offset);
    if (isRestDay(date, schedule)) return { daysUntil: offset, date };
  }
  return null;
}

export function isLastWorkdayOfWeek(date: Date, schedule: WorkSchedule) {
  if (isRestDay(date, schedule)) return false;
  const next = startOfDay(date);
  const daysUntilSunday = 7 - (date.getDay() || 7);
  for (let offset = 1; offset <= daysUntilSunday; offset++) {
    next.setDate(next.getDate() + 1);
    if (!isRestDay(next, schedule)) return false;
  }
  return true;
}
