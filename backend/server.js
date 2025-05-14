const express = require("express");
const cors = require("cors");
const playwright = require("playwright");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

// Configuración de directorios
const screenshotsDir = path.join(__dirname, "screenshots");
if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir);
}

const frontendBuildPath = path.join(__dirname, "..", "frontend", "dist");
app.use(express.static(frontendBuildPath));

// Mapeo de descuentos mejorado
const DISCOUNT_MAP = {
    "10off.png": "10% off",
    "15off.png": "15% off",
    "20off.png": "20% off",
    "25off.png": "25% off",
    "30off.png": "30% off",
    "35off.png": "35% off",
    "40off.png": "40% off",
    "label-hotsale-may.webp": "Hot Sale",
    "label-sintacc-abril.webp": "Sin TACC",
};

// H2s a excluir
const EXCLUDED_H2S = [
    "Ingresá a tu cuenta",
    "Visitá nuestras categorías",
    "Nuestras marcas",
    "Categorías",
    "Nuevos productos",
    "Inicio"
];

// Ruta principal
app.get("/", (req, res) => {
    const indexPath = path.join(frontendBuildPath, "index.html");
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.status(500).send("Error: El archivo index.html no se encuentra.");
        console.error(`Error: No se encontró el archivo ${indexPath}`);
    }
});

// Endpoint para ejecutar tests
app.post("/run-test", async (req, res) => {
    const { url, expectedProducts } = req.body;
    if (!url) return res.status(400).json({ success: false, message: "URL no proporcionada" });

    let browser;
    try {
        browser = await playwright.chromium.launch({ 
            headless: false, 
            executablePath: playwright.chromium.executablePath() 
        });
        const context = await browser.newContext();
        const page = await context.newPage();

        // Configuración de la página
        await page.goto(url, { timeout: 30000, waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(3000);
        await autoScroll(page);

        // Obtener datos de la página
        const title = await page.title();
        const products = await extractProductsWithDiscounts(page);

        // Validar cantidad esperada de productos
        const success = !expectedProducts || products.length === parseInt(expectedProducts);
        const mismatchMessage = !success 
            ? `⚠️ Se esperaban ${expectedProducts} productos, pero se encontraron ${products.length}`
            : null;

        // Tomar screenshot
        const screenshotFilename = `screenshot_${Date.now()}.png`;
        const screenshotPath = path.join(screenshotsDir, screenshotFilename);
        await page.screenshot({ path: screenshotPath, fullPage: true });

        res.json({
            success,
            title,
            h2Elements: products,
            screenshot: `/screenshots/${screenshotFilename}`,
            mismatch: !success,
            alertMessage: mismatchMessage
        });

    } catch (error) {
        console.error("Error en run-test:", error);
        res.status(500).json({ 
            success: false, 
            message: "Error en la automatización", 
            error: error.message 
        });
    } finally {
        if (browser) await browser.close();
    }
});

// Función para extraer productos con descuentos

async function extractProductsWithDiscounts(page) {
    return await page.evaluate(({ EXCLUDED_H2S, DISCOUNT_MAP }) => {
        const products = [];
        
        // 1. Selección PRECISA de H2s de productos
        const productTitles = document.querySelectorAll('h2.woocommerce-loop-product__title');
        
        // 2. Mapeo de IDs a descuentos (basado en tu DISCOUNT_MAP original)
        const DISCOUNT_ID_MAP = {
            '848024': '10% off',
            '137300': '15% off',
            '842124': '20% off',
            '137355': '25% off', 
            '823748': '30% off',
            '834292': '35% off',
            '823750': '40% off',
             '910391': '2x1',
            '842109': 'Hot Sale',
            '84955': 'Sin TACC'
        };

        productTitles.forEach(h2 => {
            const productName = h2.textContent.trim();
            if (EXCLUDED_H2S.includes(productName)) return;

            // 3. Buscar el contenedor de producto más cercano
            const productContainer = h2.closest('.product, .product-card, li.product, article.product') || h2.parentElement;

            // 4. Buscar TODOS los descuentos en este contenedor
            const discountDivs = productContainer.querySelectorAll('div[class*="br_alabel"]');
            const discounts = new Set(); // Usamos Set para evitar duplicados

            discountDivs.forEach(div => {
                // Extraer ID del descuento
                const idMatch = div.className.match(/berocket_alabel_id_(\d+)/);
                if (!idMatch) return;

                const id = idMatch[1];
                let discount = DISCOUNT_ID_MAP[id] || "Descuento especial";


                discounts.add(discount);
            });

            products.push({
                producto: productName,
                descuentos: discounts.size > 0 ? Array.from(discounts) : ['Sin descuento']
            });
        });

        return products;

    }, { EXCLUDED_H2S, DISCOUNT_MAP });
}

// Función para hacer scroll automático
async function autoScroll(page) {
    await page.evaluate(async () => {
        await new Promise((resolve) => {
            let totalHeight = 0;
            const distance = 100;
            const timer = setInterval(() => {
                const scrollHeight = document.body.scrollHeight;
                window.scrollBy(0, distance);
                totalHeight += distance;

                if (totalHeight >= scrollHeight - window.innerHeight) {
                    clearInterval(timer);
                    resolve();
                }
            }, 100);
        });
    });
}

// Servir screenshots
app.use("/screenshots", express.static(screenshotsDir));

const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});