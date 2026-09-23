import test from "node:test";
import assert from "node:assert/strict";
import { calculateDay, defaults, dueReminder, emptyDay, validateSettings } from "./workday.ts";
import { isLastWorkdayOfWeek, isRestDay, nextHoliday, nextRestDay } from "./holidays.ts";
import { collectAlerts } from "./notifications.ts";

const day = "2026-09-23";
const local = (hour, minute = 0) => new Date(2026, 8, 23, hour, minute, 0);
const record = (start = "09:00") => ({ ...emptyDay(day), start });

test("9:00–18:00 with 90 minute lunch reaches eight hours at 18:30", () => {
  const atSix = calculateDay(local(18), defaults, record());
  assert.equal(atSix.worked, 27000);
  assert.equal(atSix.targetTime, "18:30");
  assert.equal(atSix.status, "加班中");
  assert.equal(calculateDay(local(18, 30), defaults, record()).worked, 28800);
});

test("late start, lunch and early checkout use actual time", () => {
  const late = record("09:30");
  assert.equal(calculateDay(local(11), defaults, late).worked, 5400);
  assert.equal(calculateDay(local(12, 45), defaults, late).status, "午休中");
  const checkout = { ...late, clockOut: local(17).toISOString() };
  assert.equal(calculateDay(local(19), defaults, checkout).worked, 21600);
  assert.equal(calculateDay(local(19), defaults, checkout).status, "已打卡");
});

test("manual lunch end overrides planned lunch", () => {
  const manual = { ...record(), lunchStart: local(12).toISOString(), lunchEnd: local(14).toISOString() };
  assert.equal(calculateDay(local(14, 30), defaults, manual).worked, 12600);
  assert.equal(calculateDay(local(14, 30), defaults, manual).status, "工作中");
  assert.equal(calculateDay(local(14, 30), defaults, manual).targetTime, "19:00");
});

test("manual lunch stays paused until the user resumes", () => {
  const paused = { ...record(), lunchStart: local(12).toISOString() };
  const view = calculateDay(local(15), defaults, paused);
  assert.equal(view.status, "午休中");
  assert.equal(view.worked, 10800);
  assert.equal(view.message, "午休已超过计划，点继续工作");
});

test("reminders respect intervals and acknowledgement", () => {
  const settings = { ...defaults, waterMinutes: 60 };
  const current = local(10, 5);
  const active = record();
  assert.equal(dueReminder(current, settings, active, calculateDay(current, settings, active)), "water");
  const acknowledged = { ...active, waterAt: local(10).toISOString() };
  assert.equal(dueReminder(current, settings, acknowledged, calculateDay(current, settings, acknowledged)), null);
});

test("2026 holidays and adjusted workdays take precedence", () => {
  assert.equal(nextHoliday(local(9))?.name, "中秋节");
  assert.equal(nextHoliday(local(9))?.daysUntil, 2);
  assert.equal(isRestDay(new Date(2026, 8, 20), "double"), false);
  assert.equal(isRestDay(new Date(2026, 8, 25), "double"), true);
  assert.equal(nextRestDay(local(9), "double")?.daysUntil, 2);
});

test("alternating and custom schedules follow selected workdays", () => {
  const alternating = { ...defaults, workweek: "alternating", alternatingAnchor: "2026-11-02" };
  assert.equal(isRestDay(new Date(2026, 10, 7), alternating), false);
  assert.equal(isRestDay(new Date(2026, 10, 14), alternating), true);
  assert.equal(isRestDay(new Date(2026, 10, 21), alternating), false);
  const custom = { ...defaults, workweek: "custom", customWorkdays: [1, 2, 3, 4] };
  assert.equal(isRestDay(new Date(2026, 8, 24), custom), false);
  assert.equal(isRestDay(new Date(2026, 8, 28), custom), false);
  assert.equal(isRestDay(new Date(2026, 9, 9), custom), true);
  assert.equal(isRestDay(new Date(2026, 8, 20), custom), false);
});

test("weekly close follows the actual last workday", () => {
  assert.equal(isLastWorkdayOfWeek(new Date(2026, 10, 6), defaults), true);
  assert.equal(isLastWorkdayOfWeek(new Date(2026, 10, 7), { ...defaults, workweek: "single" }), true);
  assert.equal(isLastWorkdayOfWeek(new Date(2026, 8, 20), defaults), true);
  assert.equal(isLastWorkdayOfWeek(new Date(2026, 8, 18), defaults), false);
});

test("native alert plan includes enabled weekly tasks and work milestones", () => {
  const friday = new Date(2026, 10, 6, 17, 5);
  const active = { ...emptyDay("2026-11-06"), start: "09:00" };
  const settings = { ...defaults, cycleEnabled: true, weeklyReportEnabled: true, timesheetEnabled: true };
  const alerts = collectAlerts(friday, settings, active);
  assert.ok(alerts.some(item => item.id === "weekly-close" && item.body.includes("填报工时") && item.body.includes("提交周报")));
  assert.ok(!collectAlerts(friday, { ...settings, cycleEnabled: false }, active).some(item => item.id === "weekly-close"));
  assert.ok(collectAlerts(new Date(2026, 10, 6, 18, 5), settings, active).some(item => item.id === "company-end"));
  assert.ok(collectAlerts(new Date(2026, 10, 6, 18, 35), settings, active).some(item => item.id === "target-reached"));
  assert.deepEqual(collectAlerts(friday, settings, { ...active, clockOut: friday.toISOString() }), []);
});

test("invalid work and lunch hours are rejected", () => {
  assert.ok(validateSettings({ ...defaults, end: "08:00" }));
  assert.ok(validateSettings({ ...defaults, lunchEnd: "19:00" }));
  assert.equal(validateSettings(defaults), null);
});
