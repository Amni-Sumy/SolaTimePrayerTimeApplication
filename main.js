// main.js - Electron main process: it creates the app window.
const { app, BrowserWindow } = require("electron");

function createWindow() {
  const win = new BrowserWindow({
    width: 1000,
    height: 750,
    autoHideMenuBar: true
  });

  // Open the first page 
  win.loadFile("index.html");
}

app.whenReady().then(createWindow);

// Close the app when all windows are closed (except on Mac)
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
