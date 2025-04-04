const express = require("express");
const cors = require("cors");
const playwright = require("playwright");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

// Crear carpeta de screenshots si no existe
const screenshotsDir = path.join(__dirname, "screenshots");
if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir);
}

// Ruta para servir archivos estáticos del frontend (Vite)
const frontendBuildPath = path.join(__dirname, "..", "frontend", "dist");
app.use(express.static(frontendBuildPath));

// Ruta para manejar la raíz y servir el index.html de Vite
app.get("/", (req, res) => {
    const indexPath = path.join(frontendBuildPath, "index.html");
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.status(500).send("Error: El archivo index.html no se encuentra.");
        console.error(`Error: No se encontró el archivo ${indexPath}`);
    }
});

// Ruta para ejecutar pruebas con Playwright
app.post("/run-test", async (req, res) => {
    const { url, expectedProducts } = req.body;
    if (!url) {
        return res.status(400).json({ success: false, message: "URL no proporcionada" });
    }

    let browser;
    try {
        browser = await playwright.chromium.launch({ headless: false, executablePath: playwright.chromium.executablePath() });
        const context = await browser.newContext();
        const page = await context.newPage();
        await page.goto(url, { timeout: 30000 });

        // Esperar 5 segundos para que la página cargue completamente
        await page.waitForTimeout(5000);

        // Ajustar el viewport al tamaño total del contenido de la página
        const bodyHeight = await page.evaluate(() => document.body.scrollHeight);
        await page.setViewportSize({ width: 1280, height: bodyHeight });

        // Hacer scroll hasta el final de la página para cargar todo el contenido
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await page.waitForTimeout(2000);

        const title = await page.title();
        const h2Elements = await page.$$eval("h2", elements => elements.map(el => el.textContent.trim()));

        // Sacar screenshot SIEMPRE
        const screenshotPath = path.join(screenshotsDir, `screenshot_${Date.now()}.png`);
        await page.screenshot({ path: screenshotPath, fullPage: true });

        await browser.close();

        // Evaluar si coincide con lo esperado (opcional)
        const success = !expectedProducts || h2Elements.length === parseInt(expectedProducts);

        res.json({
            success,
            title,
            h2Elements,
            screenshot: `/screenshots/${path.basename(screenshotPath)}`
        });
    } catch (error) {
        if (browser) await browser.close();
        res.status(500).json({ success: false, message: "Error en la automatización", error: error.message });
    }
});

// Servir capturas de pantalla correctamente
app.use("/screenshots", express.static(screenshotsDir));

// Iniciar el servidor
const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
