// Modules to control application life and create native browser window
const { app, BrowserWindow, Menu, ipcMain, dialog, session } = require("electron");
const path = require("path");
let mainWindow;
// Menu.setApplicationMenu(null);
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    resizable: false,
    maximizable: false,
    title: "百度地图工具",
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false
    }
  });

  // vite 构建后使用静态文件地址，否则使用启动的服务器地址
  const URL = app.isPackaged ? path.join(__dirname, "src/dist/index.html") : "http://localhost:3000";
  console.log(URL);
  app.isPackaged ? mainWindow.loadFile(URL) : mainWindow.loadURL(URL);
}
app.whenReady().then(() => {
  createWindow();

  app.on("activate", function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });

  var cookie = { name: "dummy_name", value: "dummy", secure: true, sameSite: none };
  session.defaultSession.cookies.set(cookie, function (error) {
    if (error) console.error(error);
  });
});
app.on("window-all-closed", function () {
  if (process.platform !== "darwin") app.quit();
});
app.on("before-quit", function () {
  mainWindow.webContents.send("saveTask", __dirname);
});
/**
 * 监听消息
 */
ipcMain.on("synchronous-message", (event, arg) => {
  const path = dialog.showOpenDialogSync(mainWindow, {
    properties: ["openDirectory"]
  });
  event.returnValue = path;
});

/**
 *获取__dirname
 */
