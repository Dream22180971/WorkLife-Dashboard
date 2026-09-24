import test from "node:test";
import assert from "node:assert/strict";
import { calculateDay, currentTimelineStage, defaults, dueReminder, emptyDay, validateSettings } from "./workday.ts";
import { isLastWorkdayOfWeek, isRestDay, nextHoliday, nextRestDay } from "./holidays.ts";
import { collectAlerts } from "./notifications.ts";
import { nextPayday, salaryEstimate, upcomingCountdowns, weeklySummary } from "./insights.ts";

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

test("scheduled start prompts for a clock-in before the day begins", () => {
  const waiting = emptyDay("2026-09-23");
  assert.ok(collectAlerts(local(9, 5), defaults, waiting).some(item => item.id === "start-work"));
  assert.ok(!collectAlerts(local(8, 59), defaults, waiting).some(item => item.id === "start-work"));
  assert.ok(!collectAlerts(local(9, 5), defaults, record()).some(item => item.id === "start-work"));
});

test("invalid work and lunch hours are rejected", () => {
  assert.ok(validateSettings({ ...defaults, end: "08:00" }));
  assert.ok(validateSettings({ ...defaults, lunchEnd: "19:00" }));
  assert.ok(validateSettings({ ...defaults, countdowns: [{ id: "x", title: "旅行", date: "2026-02-30" }] }));
  assert.equal(validateSettings(defaults), null);
});

test("today-only schedule changes countdown and native alert time", () => {
  const changed = { ...record(), todayEnd: "17:00", todayLunchStart: "11:30", todayLunchEnd: "12:30" };
  const view = calculateDay(local(16, 35), defaults, changed);
  assert.equal(view.endAt, local(17).getTime());
  assert.equal(view.targetTime, "18:00");
  assert.ok(collectAlerts(local(16, 35), defaults, changed).some(alert => alert.id === "before-end"));
  assert.ok(!collectAlerts(local(16, 35), defaults, record()).some(alert => alert.id === "before-end"));
});

test("leave and paused reminders suppress notifications", () => {
  const onLeave = { ...record(), mode: "leave" };
  assert.equal(calculateDay(local(10), defaults, onLeave).status, "请假中");
  assert.deepEqual(collectAlerts(local(17, 35), defaults, onLeave), []);
  const paused = { ...record(), remindersPausedUntil: local(19).toISOString() };
  assert.deepEqual(collectAlerts(local(17, 35), defaults, paused), []);
});

test("payday and personal countdowns include today and month-end", () => {
  assert.equal(nextPayday(new Date(2026, 1, 28), 31).daysUntil, 0);
  assert.equal(nextPayday(new Date(2026, 2, 1), 31).daysUntil, 30);
  assert.deepEqual(upcomingCountdowns(local(9), [{ id: "old", title: "过去", date: "2026-09-22" }, { id: "trip", title: "旅行", date: "2026-09-26" }]).map(item => item.daysUntil), [3]);
});

test("salary and weekly summary use recorded work and checkout", () => {
  const salary = salaryEstimate(local(18), { ...defaults, monthlySalary: 22000 }, 3600);
  assert.ok(salary.hourly > 0);
  assert.equal(salary.today, salary.hourly);
  const finished = { ...record(), clockOut: local(19).toISOString(), merit: 3, waterCount: 2 };
  const summary = weeklySummary(local(20), defaults, [finished]);
  assert.equal(summary.worked, 30600);
  assert.equal(summary.overtime, 3600);
  assert.equal(summary.averageClockOut, "19:00");
  assert.equal(summary.merit, 3);
  assert.equal(summary.water, 2);
  const lateStart = weeklySummary(local(23), defaults, [{ ...record("22:00"), clockOut: local(23).toISOString() }]);
  assert.equal(lateStart.overtime, 3600);
});

test("timeline highlights the current stage and clears after checkout", () => {
  const active = record();
  assert.equal(currentTimelineStage(local(10), defaults, active), "start");
  assert.equal(currentTimelineStage(local(12, 30), defaults, active), "lunch");
  assert.equal(currentTimelineStage(local(14), defaults, active), "continue");
  assert.equal(currentTimelineStage(local(18, 5), defaults, active), "end");
  assert.equal(currentTimelineStage(local(18, 30), defaults, active), "target");
  assert.equal(currentTimelineStage(local(19), defaults, { ...active, clockOut: local(19).toISOString() }), null);
});
