import { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { motion } from "framer-motion";

export default function App() {
    const [tests, setTests] = useState([{ url: "", expectedProducts: "" }]);
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);

    const excludedH2s = [
        "Ingresá a tu cuenta",
        "Visitá nuestras categorías",
        "Nuestras marcas",
        "Categorías",
        "Nuevos productos",
        "Inicio",
    ];

    const handleInputChange = (index, field, value) => {
        const newTests = [...tests];
        newTests[index][field] = value;
        setTests(newTests);
    };

    const addTest = () => {
        setTests([...tests, { url: "", expectedProducts: "" }]);
    };

    const runTests = async () => {
        setLoading(true);
        setResults([]);

        const newResults = [];

        for (let i = 0; i < tests.length; i++) {
            const { url, expectedProducts } = tests[i];

            if (!url) continue;

            try {
                const response = await fetch("http://localhost:5000/run-test", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ url, expectedProducts, validateDiscount: true }),
                });

                const data = await response.json();
                const filteredH2 = data.h2Elements.filter(h2 => !excludedH2s.includes(h2));

                const mismatch = expectedProducts && filteredH2.length !== parseInt(expectedProducts);
                newResults.push({ 
                    ...data, 
                    h2Elements: filteredH2, 
                    index: i, 
                    mismatch, 
                    alertMessage: mismatch ? `⚠️ ¡Atención! Se esperaban ${expectedProducts} productos, pero se encontraron ${filteredH2.length}.` : ""
                });
            } catch (error) {
                console.error("Error en el test ejecutado:", error);
            }
        }

        setResults(newResults);
        setLoading(false);
    };

    const clearResults = () => {
        setResults([]);
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

            {tests.map((test, index) => (
                <motion.div 
                    key={index} 
                    className="card p-3 mb-3 shadow-sm" 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                    <div className="mb-2">
                        <input
                            type="text"
                            placeholder="Ingresar URL"
                            value={test.url}
                            onChange={(e) => handleInputChange(index, "url", e.target.value)}
                            className="form-control"
                        />
                    </div>
                    <div>
                        <input
                            type="number"
                            placeholder="Productos esperados"
                            value={test.expectedProducts}
                            onChange={(e) => handleInputChange(index, "expectedProducts", e.target.value)}
                            className="form-control"
                        />
                    </div>
                </motion.div>
            ))}

            <div className="d-flex gap-2 justify-content-center">
                <button onClick={addTest} className="btn btn-secondary">+ Añadir URL</button>
                <button onClick={runTests} className="btn btn-info" disabled={loading}>
                    {loading ? "Ejecutando..." : "Comenzar el test"}
                </button>
                <button onClick={clearResults} className="btn btn-dark">Borrar resultados</button>
            </div>

            {results.length > 0 && (
                <motion.div className="mt-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
                    {results.map((result, index) => (
                        <motion.div 
                            key={index} 
                            className={`card p-3 mb-3 shadow-sm ${result.mismatch ? "border-danger" : "border-success"}`}
                        >
                            <h5 className="card-title">Título de la página: {result.title}</h5>
                            {result.mismatch && (
                                <div className="alert alert-warning">
                                    {result.alertMessage}
                                </div>
                            )}
                            <h6>Productos encontrados:</h6>
                            <ul className="list-group">
                                {result.h2Elements.map((h2, i) => <li key={i} className="list-group-item">{h2}</li>)}
                            </ul>
                            {result.screenshot && <img src={`http://localhost:5000${result.screenshot}`} alt="Captura de pantalla" className="img-fluid mt-3" />}
                        </motion.div>
                    ))}
                </motion.div>
            )}
        </div>
    );
}