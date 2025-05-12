use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![get_server_port])
        .setup(|app| {
            // Start the Bun server and capture the port
            start_bun_server(app)?;
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

// Move the Bun server logic from main.rs
use std::io::{BufRead, BufReader};
use std::process::{Child, Command, Stdio};

static mut BUN_PROCESS: Option<Child> = None;
static mut SERVER_PORT: Option<u16> = None;

#[tauri::command]
fn get_server_port() -> Option<u16> {
    unsafe { SERVER_PORT }
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
        .stderr(Stdio::piped());

    let mut child = command.spawn()?;
    println!("[TAURI] Bun server started at {:?}", server_path);

    if let Some(stdout) = child.stdout.take() {
        let reader = BufReader::new(stdout);
        for line in reader.lines() {
            let line = line?;
            println!("[TAURI] Bun server stdout: {}", line);
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
