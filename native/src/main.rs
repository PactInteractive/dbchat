// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::io::{BufRead, BufReader};
use std::process::{Child, Command, Stdio};
use tauri::Manager;

static mut BUN_PROCESS: Option<Child> = None;
static mut SERVER_PORT: Option<u16> = None;

#[tauri::command]
fn get_server_port() -> Option<u16> {
    unsafe { SERVER_PORT }
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_http::init())
        .invoke_handler(tauri::generate_handler![get_server_port])
        .setup(|app| {
            // Start the Bun server and capture the port
            start_bun_server(app)?;
            Ok(())
        })
        .on_window_event(|_window, event| {
            // Clean up the Bun process when the main window closes
            if let tauri::WindowEvent::CloseRequested { .. } = event {
                cleanup_bun_server();
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running Tauri application");
}

fn start_bun_server(app: &tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    let resource_dir = app.path().resource_dir()?;
    let server_exe = if cfg!(windows) {
        "server.exe"
    } else {
        "server"
    };
    let server_path = resource_dir.join(server_exe);

    if !server_path.exists() {
        return Err(format!("Server executable not found at {:?}", server_path).into());
    }

    #[cfg(not(windows))]
    {
        use std::os::unix::fs::PermissionsExt;
        std::fs::set_permissions(&server_path, std::fs::Permissions::from_mode(0o755))?;
    }

    let mut command = Command::new(&server_path);
    command
        .current_dir(&resource_dir)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped()); // Capture stderr as well

    let mut child = command.spawn()?;
    println!("[TAURI] Bun server started at {:?}", server_path);

    // Read stdout and stderr
    if let Some(stdout) = child.stdout.take() {
        let reader = BufReader::new(stdout);
        for line in reader.lines() {
            let line = line?;
            println!("[TAURI] Bun server stdout: {}", line); // Log all stdout
            if let Some(port_str) = line.strip_prefix("SERVER_PORT:") {
                if let Ok(port) = port_str.parse::<u16>() {
                    unsafe {
                        SERVER_PORT = Some(port);
                    }
                    println!("[TAURI] Bun server running on port {}", port);
                    break;
                }
            }
        }
    }

    // Log stderr in a separate thread
    if let Some(stderr) = child.stderr.take() {
        std::thread::spawn(move || {
            let reader = BufReader::new(stderr);
            for line in reader.lines() {
                if let Ok(line) = line {
                    eprintln!("[TAURI] Bun server stderr: {}", line);
                }
            }
        });
    }

    unsafe {
        BUN_PROCESS = Some(child);
    }

    Ok(())
}

fn cleanup_bun_server() {
    unsafe {
        if let Some(mut child) = BUN_PROCESS.take() {
            if let Err(e) = child.kill() {
                eprintln!("[TAURI] Failed to kill Bun server process: {}", e);
            }
            if let Err(e) = child.wait() {
                eprintln!("[TAURI] Error while waiting for Bun server to exit: {}", e);
            }
            println!("[TAURI] Bun server stopped.");
        }
        SERVER_PORT = None;
    }
}
