const { app, BrowserWindow, dialog } = require("electron");
const path = require("path");
const { spawn } = require("child_process");

let mainWindow;
let backendProcess;
const isDev = !app.isPackaged;
let backendRetries = 0;
const maxRetries = 1;

// Rutas del backend
const backendPath = isDev
    ? path.join(__dirname, "..", "backend", "server.js")
    : path.join(process.resourcesPath, "backend", "server.js");

// Inicia el backend
function startBackend() {
    try {
        backendProcess = spawn("node", [backendPath], {
            cwd: path.dirname(backendPath),
            detached: false,
            stdio: "ignore",
        });

        backendProcess.unref();

        backendProcess.on("error", (err) => {
            console.error("Error al iniciar el backend:", err);

            if (backendRetries < maxRetries) {
                backendRetries++;
                console.log(`Reintentando iniciar el backend... (Intento ${backendRetries})`);
                startBackend();
            } else {
                dialog.showErrorBox("Error crítico", "No se pudo iniciar el backend.");
                app.quit();
            }
        });
    } catch (error) {
        console.error("No se pudo iniciar el backend:", error);
        dialog.showErrorBox("Error crítico", "No se pudo iniciar el backend.");
        app.quit();
    }
}

// Crea la ventana principal
function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1024,
        height: 768,
        icon: path.join(__dirname, "..", "build", "icon.ico"), // ← Agregado
        webPreferences: {
            contextIsolation: true,
            nodeIntegration: false,
            enableRemoteModule: false,
        },
    });

    const appURL = isDev
        ? "http://localhost:5000"
        : `file://${path.join(__dirname, "..", "frontend", "dist", "index.html")}`;

    mainWindow.loadURL(appURL);

    mainWindow.on("closed", () => (mainWindow = null));
}


// Cierra el backend al salir
app.on("window-all-closed", () => {
    if (backendProcess) backendProcess.kill();
    if (process.platform !== "darwin") app.quit();
});

// Inicia la app
app.whenReady().then(() => {
    startBackend();
    setTimeout(createWindow, 2000);
});