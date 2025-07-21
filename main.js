// ==================================================================================
// الملف الأول: main.js (النسخة الكاملة والنهائية)
// ==================================================================================
const { app, BrowserWindow, ipcMain, shell, dialog, session } = require('electron');
const path = require('path');
const fs = require('fs');
const db = require('./database');
const { initializeAllHandlers } = require('./src/main-process');

let mainWindow = null;
let loginWindow = null;
let loggedInUser = null;

// تطبيق سياسة الأمان فوراً عند تحميل التطبيق
app.on('session-created', (session) => {
    session.webRequest.onHeadersReceived((details, callback) => {
        callback({
            responseHeaders: {
                ...details.responseHeaders,
                'Content-Security-Policy': [
                    "default-src 'self';",
                    "script-src 'self' 'unsafe-inline';",
                    "style-src 'self' 'unsafe-inline';",
                    "img-src 'self' data: file: https://placehold.co;",
                    "font-src 'self' data:;",
                    "worker-src blob:;" // أضف هذا السطر
                ].join(' ')
            }
        });
    });
});


function createMainWindow() {
    if (mainWindow) {
        mainWindow.focus();
        return;
    }
    mainWindow = new BrowserWindow({
        width: 1366, height: 768, minWidth: 1100, minHeight: 750,
        webPreferences: { preload: path.join(__dirname, 'preload.js') },
        icon: path.join(__dirname, 'src/assets/icons/icon.png'),
        show: false, backgroundColor: '#0f172a'
    });
    mainWindow.once('ready-to-show', () => mainWindow.show());
    mainWindow.loadFile(path.join(__dirname, 'src', 'views', 'index.html'));
    mainWindow.on('closed', () => mainWindow = null);
}

function createLoginWindow() {
    if (loginWindow) {
        loginWindow.focus();
        return;
    }
    loginWindow = new BrowserWindow({
        width: 500, height: 650, resizable: false, frame: true,
        webPreferences: { preload: path.join(__dirname, 'preload.js') },
        show: false,
    });
    loginWindow.loadFile(path.join(__dirname, 'src', 'views', 'login.html'));
    loginWindow.once('ready-to-show', () => loginWindow.show());
    loginWindow.on('closed', () => loginWindow = null);
}

function createLicenseWindow() {
    const licenseWindow = new BrowserWindow({
        width: 500, height: 450, resizable: false, frame: true,
        webPreferences: { preload: path.join(__dirname, 'preload.js') }
    });
    licenseWindow.loadFile(path.join(__dirname, 'src', 'views', 'license.html'));
}

app.whenReady().then(() => {
    initializeAllHandlers(ipcMain, () => mainWindow);
    try {
        const row = db.prepare("SELECT value FROM settings WHERE key = 'licenseStatus'").get();
        if (row && row.value === 'LICENSED') {
            createLoginWindow();
        } else {
            createLicenseWindow();
        }
    } catch (error) {
        console.error("Critical startup error:", error);
        createLicenseWindow();
    }
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

// --- تم تعديل هذا الجزء ---
ipcMain.on('license-validated', () => {
    BrowserWindow.getAllWindows().forEach(win => {
        if (win.webContents.getURL().includes('license.html')) {
            win.close();
        }
    });
    createLoginWindow();
});

ipcMain.on('login-successful', (event, user) => {
    loggedInUser = user;
    const senderWindow = BrowserWindow.fromWebContents(event.sender);
    createMainWindow();
    mainWindow.webContents.on('did-finish-load', () => {
        mainWindow.webContents.send('user-data', user);
    });
    if (senderWindow) senderWindow.close();
});

ipcMain.on('app:logout', () => {
    loggedInUser = null;
    if (mainWindow) mainWindow.close();
    createLoginWindow();
});

ipcMain.handle('get-current-user', () => loggedInUser);

ipcMain.handle('get-page-html', (event, pageName) => {
    try {
        const filePath = path.join(__dirname, 'src', 'views', `${pageName}.html`);
        return fs.readFileSync(filePath, 'utf8');
    } catch (error) {
        return `<h1>Error 404: Page Not Found</h1><p>${error.message}</p>`;
    }
});

ipcMain.on('open-external-link', (event, url) => shell.openExternal(url));