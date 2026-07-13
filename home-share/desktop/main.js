const { app, BrowserWindow, Tray, Menu, nativeImage, shell } = require('electron');
const path = require('path');
const { execSync } = require('child_process');

const PORT = 3847;
const isDev = !app.isPackaged;

function getResourcesPath() {
  return isDev ? path.join(__dirname, '..') : process.resourcesPath;
}

function setupPaths() {
  const resources = getResourcesPath();
  process.env.WEB_DIST = path.join(resources, 'web', 'dist');
  process.env.HOME_SHARE_DATA = path.join(app.getPath('userData'));
  process.env.PORT = String(PORT);
}

function addFirewallRule() {
  if (process.platform !== 'win32') return;
  try {
    execSync(
      `netsh advfirewall firewall add rule name="Home Share" dir=in action=allow protocol=TCP localport=${PORT}`,
      { stdio: 'ignore' },
    );
  } catch {
    /* rule may already exist */
  }
}

let mainWindow = null;
let tray = null;
let serverStarted = false;

async function startBackend() {
  if (serverStarted) return PORT;
  setupPaths();
  const resources = getResourcesPath();
  const serverPath = path.join(resources, 'server', 'dist', 'app.js');
  const { startServer } = require(serverPath);
  await startServer(PORT);
  serverStarted = true;
  return PORT;
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 900,
    minHeight: 600,
    title: 'Home Share',
    autoHideMenuBar: true,
    icon: path.join(__dirname, 'icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  mainWindow.loadURL(`http://localhost:${PORT}`);

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('close', (e) => {
    if (!app.isQuitting) {
      e.preventDefault();
      mainWindow.hide();
    }
  });
}

function createTray() {
  const iconPath = path.join(__dirname, 'icon.png');
  tray = new Tray(nativeImage.createFromPath(iconPath));
  tray.setToolTip('Home Share');
  tray.setContextMenu(
    Menu.buildFromTemplate([
      {
        label: 'فتح Home Share',
        click: () => {
          mainWindow?.show();
          mainWindow?.focus();
        },
      },
      { type: 'separator' },
      {
        label: 'خروج',
        click: () => {
          app.isQuitting = true;
          app.quit();
        },
      },
    ]),
  );
  tray.on('double-click', () => {
    mainWindow?.show();
    mainWindow?.focus();
  });
}

app.whenReady().then(async () => {
  addFirewallRule();
  await startBackend();
  createWindow();
  createTray();
});

app.on('before-quit', () => {
  app.isQuitting = true;
});

app.on('window-all-closed', (e) => {
  e.preventDefault();
});
