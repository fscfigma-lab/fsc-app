const { app, BrowserWindow, shell } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    title: 'FSC App',
    icon: path.join(__dirname, 'icon-192.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      // Allow Anthropic/Supabase API calls from file:// context
      webSecurity: true,
    },
  });

  // Load the single-file PWA directly
  win.loadFile('index.html');

  // Open external links in the system browser, not Electron
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Remove menu bar on production
  if (app.isPackaged) win.removeMenu();
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
