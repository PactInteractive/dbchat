const isNativeApp = (window as any)?.__TAURI__ != null;

export async function confirm(prompt: string) {
  const { confirm } = isNativeApp ? await import('@tauri-apps/plugin-dialog') : window;
  return confirm(prompt);
}

export async function fetch(path: string, options: RequestInit = {}) {
  const { fetch } = isNativeApp ? await import('@tauri-apps/plugin-http') : window;
  const url = await getServerUrl(path);
  return fetch(url, options);
}

async function getServerUrl(path: string) {
  const port = isNativeApp ? await getServerPort() : null;
  return (port ? `http://localhost:${port}${path.startsWith('/') ? '' : '/'}` : '') + path;
}

async function getServerPort(): Promise<number | undefined> {
  try {
    const { invoke } = await import('@tauri-apps/api/core');
    const port = await invoke('get_server_port');
    if (typeof port === 'number') {
      return port;
    }
  } catch (error) {
    throw new Error(`Failed to get server port: ${error instanceof Error ? error.message : error}`);
  }
}
