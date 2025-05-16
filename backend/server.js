const express = require("express");
const cors = require("cors");
const playwright = require("playwright");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

const screenshotsDir = path.join(__dirname, "screenshots");
if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir);
}

const frontendBuildPath = path.join(__dirname, "..", "frontend", "dist");
app.use(express.static(frontendBuildPath));


const EXCLUDED_H2S = [
    "Ingresá a tu cuenta",
    "Visitá nuestras categorías",
    "Nuestras marcas",
    "Categorías",
    "Nuevos productos",
    "Inicio"
];

app.get("/", (req, res) => {
    const indexPath = path.join(frontendBuildPath, "index.html");
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.status(500).send("Error: El archivo index.html no se encuentra.");
        console.error(`Error: No se encontró el archivo ${indexPath}`);
    }
});

app.post("/run-test", async (req, res) => {
    const { url, expectedProducts } = req.body;
    if (!url) return res.status(400).json({ success: false, message: "URL no proporcionada" });

    let browser;
    try {
        browser = await playwright.chromium.launch({
            headless: false,
            executablePath: playwright.chromium.executablePath()
        });
const context = await browser.newContext({
    viewport: { width: 1920, height: 1080},
});
        const page = await context.newPage();


        
        await page.goto(url, { timeout: 30000, waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(5000);

        const title = await page.title();
        const products = await extractProductsWithDiscounts(page);

        const success = !expectedProducts || products.length === parseInt(expectedProducts);
        const mismatchMessage = !success
            ? `⚠️ Se esperaban ${expectedProducts} productos, pero se encontraron ${products.length}`
            : null;

        const screenshotFilename = `screenshot_${Date.now()}.png`;
        const screenshotPath = path.join(screenshotsDir, screenshotFilename);
        const bodyHeight = await page.evaluate(() => document.body.scrollHeight);
await page.setViewportSize({ width: 1920, height: bodyHeight });

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



async function extractProductsWithDiscounts(page) {
    return await page.evaluate(({ EXCLUDED_H2S }) => {
        const products = [];

        const productTitles = document.querySelectorAll('h2.woocommerce-loop-product__title');

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
            '845805': 'Hot Week',
            '1133533': 'Label Aguila',
            '1011324': 'Label Chocolinas',
            '948465': 'Label La Campagnola',
            '94476': 'NUEVO',
            '84955': 'Sin TACC'
            
        };

        function calcularDescuento(original, conDescuento) {
            if (!original || !conDescuento) return null;
            const porcentaje = ((original - conDescuento) / original) * 100;
            return Math.round(porcentaje);
        }

        productTitles.forEach(h2 => {
            const productName = h2.textContent.trim();
            if (EXCLUDED_H2S.includes(productName)) return;

            const productContainer = h2.closest('.product, .product-card, li.product, article.product') || h2.parentElement;

            const discountDivs = productContainer.querySelectorAll('div[class*="br_alabel"]');
            const discounts = new Set();

            discountDivs.forEach(div => {
                const idMatch = div.className.match(/berocket_alabel_id_(\d+)/);
                if (!idMatch) return;
                const id = idMatch[1];
                const discount = DISCOUNT_ID_MAP[id] || "Descuento especial";
                discounts.add(discount);
            });


            
            // Extraer precios
            const priceElements = productContainer.querySelectorAll('.price del, .price ins, .price bdi');
            let originalPrice = null;
            let finalPrice = null;

            priceElements.forEach(el => {
                const priceText = el.textContent.replace(/[^\d.,]/g, "").replace(",", ".");
                const price = parseFloat(priceText);
                if (!isNaN(price)) {
                    if (el.tagName.toLowerCase() === "del") {
                        originalPrice = price;
                    } else if (el.tagName.toLowerCase() === "ins" || el.closest("ins")) {
                        finalPrice = price;
                    } else if (!originalPrice && !finalPrice) {
                        finalPrice = price;
                    }
                }
            });

            const calculatedDiscount = (originalPrice && finalPrice) ? calcularDescuento(originalPrice, finalPrice) : null;
            let discountMatch = null;

            // Validar si algún descuento coincide
            if (calculatedDiscount) {
                discounts.forEach(d => {
                    const match = d.match(/(\d+)%/);
                    if (match && parseInt(match[1]) === calculatedDiscount) {
                        discountMatch = `${calculatedDiscount}% OK`;
                    }
                });
                if (!discountMatch) {
                    discountMatch = `⚠️ ${calculatedDiscount}% calculado, no coincide con etiqueta`;
                }
            }

            products.push({
                producto: productName,
                descuentos: discounts.size > 0 ? Array.from(discounts) : ['Sin descuento'],
                precio_original: originalPrice ?? "No disponible",
                precio_descuento: finalPrice ?? "No disponible",
                descuento_calculado: calculatedDiscount ? `${calculatedDiscount}%` : "No disponible",
                validación_descuento: discountMatch ?? "No aplica o sin coincidencia"
            });
        });

        return products;
    }, { EXCLUDED_H2S });
}



app.use("/screenshots", express.static(screenshotsDir));

const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
