import { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { motion } from "framer-motion";

// Lista de H2s a excluir
const EXCLUDED_H2S = [
    "Ingresá a tu cuenta",
    "Visitá nuestras categorías",
    "Nuestras marcas",
    "Categorías",
    "Nuevos productos",
    "Inicio",
];

// Mapeo de colores para los badges de descuento
const DISCOUNT_BADGE_COLORS = {
    "10% off": "info",
    "15% off": "info",
    "20% off": "primary",
    "25% off": "primary",
    "2x1": "warning",
    "30% off": "warning",
    "35% off": "danger",
    "40% off": "danger",
    "Hot Sale": "danger",
    "Hot Week": "danger",
    "Sin TACC": "success",
    "Label Aguila": "success",
    "Label Chocolinas": "success",
    "Label La Campagnola": "success",
    "Label Cofler": "success",
    "NUEVO": "success",
    "Sin descuento": "secondary",
    "Descuento especial": "dark"
};

export default function App() {
    const [tests, setTests] = useState([{ url: "", expectedProducts: "" }]);
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);

    const handleInputChange = (index, field, value) => {
        const newTests = tests.map((test, i) => 
            i === index ? { ...test, [field]: value } : test
        );
        setTests(newTests);
    };

    const addTest = () => {
        setTests([...tests, { url: "", expectedProducts: "" }]);
    };

    const removeTest = (index) => {
        if (tests.length > 1) {
            setTests(tests.filter((_, i) => i !== index));
        }
    };

    const runTests = async () => {
        setLoading(true);
        setResults([]);

        try {
            const testResults = await Promise.all(
                tests.filter(test => test.url).map(async (test, index) => {
                    try {
                        const response = await fetch("http://localhost:5000/run-test", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ 
                                url: test.url, 
                                expectedProducts: test.expectedProducts 
                            }),
                        });

                        const data = await response.json();
                        
                        const validProducts = data.h2Elements.filter(product => 
                            !EXCLUDED_H2S.includes(product.producto)
                        );
                        
                        const mismatch = test.expectedProducts && 
                                       validProducts.length !== parseInt(test.expectedProducts);
                        
                        return {
                            ...data,
                            h2Elements: validProducts,
                            index,
                            mismatch,
                            alertMessage: mismatch 
                                ? `⚠️ ¡Atención! Se esperaban ${test.expectedProducts} productos, pero se encontraron ${validProducts.length}.`
                                : ""
                        };
                    } catch (error) {
                        console.error(`Error en test ${index}:`, error);
                        return {
                            error: true,
                            message: `Error al procesar ${test.url}`,
                            index
                        };
                    }
                })
            );

            setResults(testResults.filter(result => !result.error));
        } catch (error) {
            console.error("Error general:", error);
        } finally {
            setLoading(false);
        }
    };

    const clearResults = () => {
        setResults([]);
    };

    const clearAll = () => {
        setTests([{ url: "", expectedProducts: "" }]);
        setResults([]);
    };

    // Función para formatear precios
const formatPrice = (price) => {
    if (typeof price === 'number') {
        return `$${price.toLocaleString('es-AR')}`;
    }
    return price;
};

    return (
        <div className="container py-4">
            <motion.h1
                className="text-center mb-4"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                Automatización AeC - Minimalart
            </motion.h1>

            <div className="row">
                {tests.map((test, index) => (
                    <motion.div 
                        key={index} 
                        className="col-md-6 mb-3"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                    >
                        <div className="card p-3 shadow-sm h-100">
                            <div className="mb-2">
                                <label className="form-label">URL #{index + 1}</label>
                                <input
                                    type="text"
                                    placeholder="Ingresar URL"
                                    value={test.url}
                                    onChange={(e) => handleInputChange(index, "url", e.target.value)}
                                    className="form-control"
                                />
                            </div>
                            <div className="mb-2">
                                <label className="form-label">Productos esperados</label>
                                <input
                                    type="number"
                                    placeholder="Cantidad esperada"
                                    value={test.expectedProducts}
                                    onChange={(e) => handleInputChange(index, "expectedProducts", e.target.value)}
                                    className="form-control"
                                />
                            </div>
                            {tests.length > 1 && (
                                <button 
                                    onClick={() => removeTest(index)} 
                                    className="btn btn-sm btn-outline-danger mt-2"
                                >
                                    Eliminar
                                </button>
                            )}
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="d-flex gap-2 justify-content-center my-4">
                <button onClick={addTest} className="btn btn-secondary">
                    + Añadir URL
                </button>
                <button 
                    onClick={runTests} 
                    className="btn btn-info" 
                    disabled={loading || !tests.some(test => test.url)}
                >
                    {loading ? (
                        <>
                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                            Ejecutando...
                        </>
                    ) : "Comenzar el test"}
                </button>
                <button onClick={clearResults} className="btn btn-dark">
                    Borrar resultados
                </button>
                <button onClick={clearAll} className="btn btn-outline-danger">
                    Reiniciar todo
                </button>
            </div>

            {results.length > 0 && (
                <motion.div 
                    className="mt-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                >
                    {results.map((result, index) => (
                        <motion.div 
                            key={index} 
                            className={`card p-3 mb-4 shadow-sm ${result.mismatch ? "border-danger" : "border-success"}`}
                            whileHover={{ scale: 1.005 }}
                        >
                            <h5 className="card-title d-flex justify-content-between">
                                <span>Test #{result.index + 1}: {result.title}</span>
                                <span className="badge bg-light text-dark">
                                    {result.h2Elements.length} productos
                                </span>
                            </h5>
                            
                            {result.mismatch && (
                                <div className="alert alert-warning d-flex align-items-center">
                                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                                    {result.alertMessage}
                                </div>
                            )}
                            
                            <h6 className="mb-3">Productos encontrados:</h6>
                            <div className="table-responsive">
                                <table className="table table-hover">
                                    <thead>
                                        <tr>
                                            <th>Producto</th>
                                            <th>Precio Original</th>
                                            <th>Precio Actual</th>
                                            <th>Descuento</th>
                                            <th>Validación</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {result.h2Elements.map((prod, i) => (
                                            <tr key={i}>
                                                <td>{prod.producto}</td>
                                                <td>{formatPrice(prod.precio_original)}</td>
                                                <td>{formatPrice(prod.precio_actual)}</td>
                                                <td>
                                                    <div className="d-flex gap-1">
                                                        {prod.descuentos.map((d, j) => (
                                                            <span 
                                                                key={j}
                                                                className={`badge bg-${DISCOUNT_BADGE_COLORS[d] || "secondary"}`}
                                                            >
                                                                {d}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td>
                                                    {prod.validacion_descuento.includes('✅') ? (
                                                        <span className="text-success">{prod.validacion_descuento}</span>
                                                    ) : prod.validacion_descuento.includes('⚠️') ? (
                                                        <span className="text-warning">{prod.validacion_descuento}</span>
                                                    ) : (
                                                        <span>{prod.validacion_descuento}</span>
                                                    )}
                                                    {prod.descuento_calculado !== "No disponible" && (
                                                        <div className="small text-muted">
                                                            Calculado: {prod.descuento_calculado}
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            
                            {result.screenshot && (
                                <div className="mt-3">
                                    <h6>Captura de pantalla:</h6>
                                    <img 
                                        src={`http://localhost:5000${result.screenshot}`} 
                                        alt="Captura de pantalla" 
                                        className="img-fluid rounded border"
                                    />
                                </div>
                            )}
                        </motion.div>
                    ))}
                </motion.div>
            )}
        </div>
    );
}