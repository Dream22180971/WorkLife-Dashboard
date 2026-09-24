use std::{collections::HashSet, sync::Mutex, time::{Duration, SystemTime, UNIX_EPOCH}};
use serde::Deserialize;
use tauri::{AppHandle, Manager};
use tauri_plugin_notification::NotificationExt;

#[derive(Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
struct ScheduledAlert {
    id: String,
    title: String,
    body: String,
    due_ms: u64,
    expires_ms: u64,
}

#[derive(Default)]
struct ReminderPlan {
    date: String,
    alerts: Vec<ScheduledAlert>,
    sent: HashSet<String>,
}

impl ReminderPlan {
    fn take_due(&mut self, now: u64) -> Vec<ScheduledAlert> {
        let due: Vec<_> = self.alerts.iter()
            .filter(|alert| alert.due_ms <= now && now < alert.expires_ms && !self.sent.contains(&alert.id))
            .cloned()
            .collect();
        for alert in &due { self.sent.insert(alert.id.clone()); }
        due
    }
}

#[tauri::command]
fn set_scheduled_alerts(state: tauri::State<'_, Mutex<ReminderPlan>>, date: String, alerts: Vec<ScheduledAlert>) -> Result<(), String> {
    let mut plan = state.lock().map_err(|error| error.to_string())?;
    if plan.date != date {
        plan.date = date;
        plan.sent.clear();
    }
    plan.alerts = alerts;
    Ok(())
}

fn run_reminder_clock(app: AppHandle) {
    std::thread::spawn(move || loop {
        std::thread::sleep(Duration::from_secs(1));
        let now = SystemTime::now().duration_since(UNIX_EPOCH).unwrap_or_default().as_millis() as u64;
        let state = app.state::<Mutex<ReminderPlan>>();
        let due = {
            let mut plan = match state.lock() {
                Ok(plan) => plan,
                Err(_) => continue,
            };
            plan.take_due(now)
        };
        for alert in due {
            if let Err(error) = app.notification().builder().title(&alert.title).body(&alert.body).show() {
                eprintln!("Unable to send reminder {}: {error}", alert.id);
                if let Ok(mut plan) = state.lock() { plan.sent.remove(&alert.id); }
            }
        }
    });
}

#[cfg(test)]
mod tests {
    use super::{ReminderPlan, ScheduledAlert};

    #[test]
    fn background_clock_sends_once_when_due() {
        let alert = ScheduledAlert { id: "water".into(), title: "Water".into(), body: "Drink".into(), due_ms: 1000, expires_ms: 2000 };
        let mut plan = ReminderPlan { alerts: vec![alert], ..ReminderPlan::default() };
        assert!(plan.take_due(999).is_empty());
        assert_eq!(plan.take_due(1000).len(), 1);
        assert!(plan.take_due(1001).is_empty());
        assert!(plan.take_due(2000).is_empty());
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    use tauri::{menu::{Menu, MenuItem}, tray::TrayIconBuilder, WindowEvent};

    tauri::Builder::default()
        .manage(Mutex::new(ReminderPlan::default()))
        .invoke_handler(tauri::generate_handler![set_scheduled_alerts])
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            None,
        ))
        .setup(|app| {
            run_reminder_clock(app.handle().clone());
            let open = MenuItem::with_id(app, "open", "打开摸鱼助手", true, None::<&str>)?;
            let quit = MenuItem::with_id(app, "quit", "退出", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&open, &quit])?;
            TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&menu)
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "open" => {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                    "quit" => app.exit(0),
                    _ => {}
                })
                .build(app)?;
            Ok(())
        })
        .on_window_event(|window, event| {
            if window.label() == "main" {
                if let WindowEvent::CloseRequested { api, .. } = event {
                    api.prevent_close();
                    let _ = window.hide();
                }
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
