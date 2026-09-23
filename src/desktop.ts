import { isTauri } from "@tauri-apps/api/core";
import { LogicalSize, PhysicalPosition } from "@tauri-apps/api/window";
import { WebviewWindow } from "@tauri-apps/api/webviewWindow";
import { disable, enable, isEnabled } from "@tauri-apps/plugin-autostart";
import type { Settings } from "./workday";

const positionKey = "worklife.widget.position";
export const desktopAvailable = isTauri();

export async function applyDesktopSettings(settings: Settings) {
  if (!desktopAvailable) return;
  const widget = await WebviewWindow.getByLabel("widget");
  if (widget) {
    const size = { small: [250, 98], medium: [260, 176], large: [350, 274] }[settings.widgetSize || "medium"];
    await widget.setSize(new LogicalSize(size[0], size[1]));
    if (settings.widgetEnabled) {
      const saved = localStorage.getItem(positionKey);
      if (saved) {
        try {
          const position = JSON.parse(saved) as { x: number; y: number };
          if (Number.isFinite(position.x) && Number.isFinite(position.y)) await widget.setPosition(new PhysicalPosition(position.x, position.y));
        } catch { /* Ignore an invalid saved position. */ }
      }
      await widget.setAlwaysOnTop(settings.widgetOnTop);
      await widget.show();
    } else await widget.hide();
  }
  if (settings.autostart !== await isEnabled()) {
    if (settings.autostart) await enable();
    else await disable();
  }
}

export async function initializeWidget() {
  if (!desktopAvailable) return;
  const widget = await WebviewWindow.getByLabel("widget");
  if (!widget) return;
  await widget.onMoved(({ payload }) => localStorage.setItem(positionKey, JSON.stringify({ x: payload.x, y: payload.y })));
}

export async function openDashboard() {
  if (!desktopAvailable) return;
  const main = await WebviewWindow.getByLabel("main");
  await main?.show();
  await main?.setFocus();
}
