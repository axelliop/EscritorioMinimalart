# PLAYWRIGHT-WEB-APP

Aplicación de escritorio que permite automatizar pruebas visuales sobre sitios web utilizando Playwright. Cuenta con una interfaz desarrollada en React (mediante Vite.js), un backend con Node.js y Express, y está empaquetada en Electron para ejecutarse como aplicación de escritorio.

---

## 📁 Estructura del proyecto

```
PLAYWRIGHT-WEB-APP/
├── backend/                # Servidor backend con Express y Playwright
│   ├── node_modules/
│   ├── package.json
│   ├── package-lock.json
│   ├── server.js           # Lógica del backend (ejecución de tests, capturas, análisis)
│   ├── build/              # (opcional) carpeta de compilación
│   └── dist/               # Carpeta donde se guardan los screenshots generados

├── frontend/               # Aplicación React + Vite
│   ├── src/
│   │   ├── App.jsx         # Componente principal
│   │   ├── main.jsx        # Entrada del proyecto React
│   │   ├── App.css / index.css
│   │   └── assets/         # Imágenes o recursos
│   ├── public/             # Archivos públicos
│   ├── dist/               # Build generado por Vite (`npm run build`)
│   ├── vite.config.js      # Configuración Vite
│   ├── package.json        # Dependencias y scripts
│   └── README.md

├── src/
│   └── main.js             # Entrada principal de Electron (lanza la app de escritorio)

├── userData/               # Carpeta opcional para datos persistentes de usuario
├── .gitignore
├── package.json            # Dependencias raíz (Electron)
├── package-lock.json
└── README.md               # Este archivo
```

---

## 🚀 Cómo ejecutar la app

### 1. Instalar dependencias

- Backend:

```bash
cd backend
npm install
```

- Frontend:

```bash
cd ../frontend
npm install
```

- Dependencias raíz (Electron):

```bash
cd ..
npm install
```

---

### 2. Ejecutar el frontend (opcional, modo dev)

```bash
cd frontend
npm run dev
```

---

### 3. Ejecutar la app de escritorio (Electron)

Desde la raíz del proyecto:

```bash
npm start
```

Esto abrirá una ventana con la interfaz de usuario, permitiendo ingresar una URL y ejecutar pruebas automatizadas.

---

## 🧪 ¿Qué hace la app?

- Recibe una URL.
- Visita la página usando Playwright.
- Extrae productos (títulos, precios, descuentos).
- Valida los descuentos aplicados vs. los reales.
- Saca una captura de pantalla de toda la página.
- Muestra los resultados en pantalla.

---

## 📸 Screenshots

Las capturas generadas se guardan en:

```
backend/screenshots/
```

---

## 🛠️ Scripts útiles

En `frontend/`:

- `npm run dev` → Modo desarrollo con Vite.
- `npm run build` → Compila el frontend para producción.

En raíz:

- `npm start` → Lanza la aplicación en Electron.

---

## 🧩 Tecnologías utilizadas

- **Playwright** – Automatización de navegador.
- **React** + **Vite.js** – Interfaz moderna y rápida.
- **Node.js** + **Express** – Backend para ejecutar las pruebas.
- **Electron** – Empaquetado como aplicación de escritorio.

---

## 📄 Licencia

MIT
