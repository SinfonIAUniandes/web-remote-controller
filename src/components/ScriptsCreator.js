import { useEffect, useState } from 'react';
import { useRos } from '../contexts/RosContext';
import { createTopic } from '../services/RosManager';
import * as ROSLIB from 'roslib';
import animationsTxt from "../animations/animations.txt";

const ScriptsCreator = () => {
    const { ros } = useRos();
    const [animations, setAnimations] = useState({});
    const [scriptName, setScriptName] = useState("");
    const [isExecuting, setIsExecuting] = useState(false);
    const [script, setScript] = useState({
        subtitulos: false,
        img: false,
        speech: [],
        animation: [],
        pantalla: []
    });

    // FUNCIÓN ÚNICA QUE EJECUTA TODO EL SCRIPT
    const executeCompleteScript = async () => {
        if (!ros || isExecuting) return;
        
        setIsExecuting(true);
        console.log("Iniciando ejecución de script completo");

        // Crear TODOS los topics UNA sola vez
        const speechTopic = createTopic(ros, '/speech', 'robot_toolkit_msgs/speech_msg');
        const animationTopic = createTopic(ros, "/animations", "robot_toolkit_msgs/animation_msg");

        // Combinar todas las acciones en una sola secuencia
        const allActions = [
            ...script.speech.map(action => ({ ...action, category: 'speech' })),
            ...script.animation.map(action => ({ ...action, category: 'animation' })),
            ...script.pantalla.map(action => ({ ...action, category: 'pantalla' }))
        ];

        // Ordenar por índice para mantener el orden de creación
        allActions.sort((a, b) => allActions.indexOf(a) - allActions.indexOf(b));

        // Ejecutar cada acción en secuencia
        for (let i = 0; i < allActions.length; i++) {
            const action = allActions[i];
            console.log(`▶ Ejecutando acción ${i + 1}/${allActions.length}:`, action);
            
            try {
                 if (action.category === 'speech') {
                    if (action.tipo === "text") {
                        // Ejecutar speech
                        const speechMessage = new ROSLIB.Message({
                            language: 'Spanish',
                            text: action.info,
                            animated: true
                        });
                        speechTopic.publish(speechMessage);
                        console.log(`Diciendo: "${action.info}"`);
                        
                        // Esperar según longitud del texto
                        const speechTime = Math.max(2000, action.info.length * 100);
                        await new Promise(resolve => setTimeout(resolve, speechTime));
                        
                    } else if (action.tipo === "delay") {
                        // Esperar tiempo específico
                        console.log(`Delay speech: ${action.info}ms`);
                        await new Promise(resolve => setTimeout(resolve, parseInt(action.info)));
                    }
                    
                } else if (action.category === 'animation') {
                    if (action.tipo === "movimiento") {
                        // Ejecutar animación
                        const animationMessage = new ROSLIB.Message({
                            family: "animations",
                            animation_name: action.info
                        });
                        animationTopic.publish(animationMessage);
                        console.log(`Animación: ${action.info}`);
                        
                        // Tiempo fijo para animaciones
                        await new Promise(resolve => setTimeout(resolve, 3000));
                        
                    } else if (action.tipo === "delay") {
                        // Esperar tiempo específico
                        console.log(`Delay animation: ${action.info}ms`);
                        await new Promise(resolve => setTimeout(resolve, parseInt(action.info)));
                    }
                    
                } else if (action.category === 'pantalla') {
                    // Acciones de pantalla (placeholder para futura implementación)
                    console.log(`Acción de pantalla: ${action.info}`);
                    await new Promise(resolve => setTimeout(resolve, 2000));
                }
                
                // Pequeña pausa entre acciones
                await new Promise(resolve => setTimeout(resolve, 500));
                
            } catch (error) {
                console.error(`Error en acción ${i + 1}:`, error);
            }
        }
        
        console.log("Script completado");
        setIsExecuting(false);
    };

    // FUNCIÓN PARA DESCARGAR SCRIPT
    const handleDownload = () => {
        const element = document.createElement("a");
        const file = new Blob([JSON.stringify(script, null, 2)], { type: 'application/json' });
        element.href = URL.createObjectURL(file);
        element.download = `${scriptName || 'script'}.json`;
        document.body.appendChild(element);
        element.click();
    };

    // FUNCIÓN PARA CARGAR/SUBIR SCRIPT
    const handleUpload = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        
        reader.onload = (e) => {
            try {
                const uploadedScript = JSON.parse(e.target.result);
                
                if (uploadedScript && 
                    (Array.isArray(uploadedScript.speech) || 
                     Array.isArray(uploadedScript.animation) || 
                     Array.isArray(uploadedScript.pantalla))) {
                    
                    setScript(uploadedScript);
                    console.log("Script cargado correctamente");
                    alert("Script cargado exitosamente!");
                } else {
                    throw new Error("Estructura de script inválida");
                }
            } catch (error) {
                console.error("Error al cargar el script:", error);
                alert("Error: El archivo no es un script válido");
            }
        };

        reader.readAsText(file);
    };

    // Cargar animaciones disponibles
    useEffect(() => {
        fetch(animationsTxt)
            .then(response => response.text())
            .then(text => {
                const parsedAnimations = {};

                text.split("\n").forEach(animation => {
                    const parts = animation.trim().split("/");

                    if (parts.length === 3) {
                        const [category, subcategory, anim] = parts;
                        if (!parsedAnimations[category]) parsedAnimations[category] = {};
                        if (!parsedAnimations[category][subcategory]) parsedAnimations[category][subcategory] = [];
                        parsedAnimations[category][subcategory].push(anim);
                    } else if (parts.length === 2) {
                        const [category, anim] = parts;
                        if (!parsedAnimations[category]) parsedAnimations[category] = {};
                        if (!parsedAnimations[category]["_no_subcategory"]) parsedAnimations[category]["_no_subcategory"] = [];
                        parsedAnimations[category]["_no_subcategory"].push(anim);
                    }
                });

                setAnimations(parsedAnimations);
            })
            .catch(error => console.error("Error al cargar las animaciones:", error));
    }, []);


    return (
        <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
            <h2>🎭 Creador de Scripts para Pepper</h2>
            
            {/* BOTÓN DE EJECUCIÓN ÚNICA */}
            <div style={{ 
                marginBottom: '20px', 
                padding: '15px', 
                border: '2px solid #28a745', 
                borderRadius: '8px',
                backgroundColor: '#f8fff9',
                textAlign: 'center'
            }}>
                <button 
                    onClick={executeCompleteScript}
                    disabled={isExecuting || (script.speech.length === 0 && script.animation.length === 0)}
                    style={executeButtonStyle}
                >
                    {isExecuting ? 'Ejecutando Script...' : 'Ejecutar Script Completo'}
                </button>
                <p style={{ fontSize: '14px', color: '#666', marginTop: '10px' }}>
                    Un solo botón ejecuta TODAS las acciones del script en secuencia
                </p>
            </div>

            {/* SECCIÓN DE CARGA/SUBIDA DE SCRIPTS */}
            <div style={{ 
                marginBottom: '20px', 
                padding: '15px', 
                border: '2px dashed #007BFF', 
                borderRadius: '8px',
                backgroundColor: '#f8f9fa'
            }}>
                <h3>Gestionar Scripts</h3>
                
                <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
                    {/* Subir archivo */}
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                            Subir script:
                        </label>
                        <input 
                            type="file" 
                            accept=".json" 
                            onChange={handleUpload}
                            style={{ padding: '8px' }}
                        />
                    </div>

                    {/* Descargar archivo */}
                    <button 
                        onClick={handleDownload}
                        disabled={script.speech.length === 0 && script.animation.length === 0}
                        style={downloadButtonStyle}
                    >
                        Descargar Script
                    </button>
                </div>
            </div>

            {/* EDITOR DE SCRIPTS */}
            <div style={{ marginBottom: '20px' }}>
                <h3>Configuración</h3>
                <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                    <div>
                        <input 
                            disabled={script.img} 
                            id='subtitulos' 
                            type="checkbox" 
                            checked={script.subtitulos} 
                            onChange={() => setScript({ ...script, subtitulos: !script.subtitulos })} 
                        />
                        <label htmlFor='subtitulos'>Subtítulos</label>
                    </div>
                    <div>
                        <input 
                            disabled={script.subtitulos} 
                            id='img' 
                            type="checkbox" 
                            checked={script.img} 
                            onChange={() => setScript({ ...script, img: !script.img })} 
                        />
                        <label htmlFor='img'>Imagen</label>
                    </div>
                </div>
            </div>

            {/* SECCIONES DE EDICIÓN (se mantienen igual) */}
            <div style={{ display: 'grid', gap: '20px', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
                
                {/* SECCIÓN SPEECH */}
                <div style={sectionStyle}>
                    <h4>🎙️ Speech ({script.speech.length})</h4>
                    {script.speech.map((item, index) => (
                        <div key={index} style={actionItemStyle}>
                            <select 
                                value={item.tipo} 
                                onChange={(e) => {
                                    const newSpeech = [...script.speech];
                                    newSpeech[index].tipo = e.target.value;
                                    setScript({ ...script, speech: newSpeech });
                                }}
                                style={selectStyle}
                            >
                                <option value="text">Texto</option>
                                <option value="delay">Delay</option>
                            </select>
                            {item.tipo === "text" ? (
                                <input 
                                    type="text" 
                                    value={item.info} 
                                    onChange={(e) => {
                                        const newSpeech = [...script.speech];
                                        newSpeech[index].info = e.target.value;
                                        setScript({ ...script, speech: newSpeech });
                                    }}
                                    placeholder="Texto para hablar"
                                    style={inputStyle}
                                />
                            ) : (
                                <input 
                                    type="number" 
                                    min="0" 
                                    value={item.info} 
                                    onChange={(e) => {
                                        const newSpeech = [...script.speech];
                                        newSpeech[index].info = e.target.value;
                                        setScript({ ...script, speech: newSpeech });
                                    }}
                                    placeholder="ms"
                                    style={inputStyle}
                                />
                            )}
                            <button 
                                onClick={() => {
                                    const newSpeech = script.speech.filter((item, i) => i !== index);
                                    setScript({ ...script, speech: newSpeech });
                                }}
                                style={deleteButtonStyle}
                            >
                                ❌
                            </button>
                        </div>
                    ))}
                    <button 
                        onClick={() => setScript({
                            ...script, speech: [...script.speech, {
                                tipo: "text",
                                info: "Hola, soy Pepper",
                            }]
                        })}
                        style={addButtonStyle}
                    >
                        ➕ Añadir Speech
                    </button>
                </div>

                {/* SECCIÓN ANIMACIÓN */}
                <div style={sectionStyle}>
                    <h4>Animaciones ({script.animation.length})</h4>
                    {script.animation.map((item, index) => (
                        <div key={index} style={actionItemStyle}>
                            <select 
                                value={item.tipo} 
                                onChange={(e) => {
                                    const newAnimation = [...script.animation];
                                    newAnimation[index].tipo = e.target.value;
                                    setScript({ ...script, animation: newAnimation });
                                }}
                                style={selectStyle}
                            >
                                <option value="movimiento">Animación</option>
                                <option value="delay">Delay</option>
                            </select>
                            {item.tipo === "movimiento" ? (
                                <input 
                                    type="text" 
                                    value={item.info} 
                                    onChange={(e) => {
                                        const newAnimation = [...script.animation];
                                        newAnimation[index].info = e.target.value;
                                        setScript({ ...script, animation: newAnimation });
                                    }}
                                    placeholder="Ruta de animación"
                                    style={inputStyle}
                                />
                            ) : (
                                <input 
                                    type="number" 
                                    min="0" 
                                    value={item.info} 
                                    onChange={(e) => {
                                        const newAnimation = [...script.animation];
                                        newAnimation[index].info = e.target.value;
                                        setScript({ ...script, animation: newAnimation });
                                    }}
                                    placeholder="ms"
                                    style={inputStyle}
                                />
                            )}
                            <button 
                                onClick={() => {
                                    const newAnimation = script.animation.filter((item, i) => i !== index);
                                    setScript({ ...script, animation: newAnimation });
                                }}
                                style={deleteButtonStyle}
                            >
                                ❌
                            </button>
                        </div>
                    ))}
                    <button 
                        onClick={() => setScript({
                            ...script, animation: [...script.animation, {
                                tipo: "movimiento",
                                info: "Gestures/Hey_1",
                            }]
                        })}
                        style={addButtonStyle}
                    >
                        ➕ Añadir Animación
                    </button>
                </div>
            </div>

            {/* ESTADO DE EJECUCIÓN */}
            {isExecuting && (
                <div style={{ 
                    color: '#007BFF', 
                    fontWeight: 'bold',
                    padding: '10px',
                    backgroundColor: '#e7f3ff',
                    borderRadius: '5px',
                    marginTop: '20px',
                    textAlign: 'center'
                }}>
                Ejecutando script completo... ({script.speech.length + script.animation.length} acciones)
                </div>
            )}
        </div>
    );
};

// Estilos
const executeButtonStyle = {
    padding: '15px 30px',
    fontSize: '18px',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 'bold',
    minWidth: '250px'
};

const downloadButtonStyle = {
    padding: '10px 15px',
    backgroundColor: '#007BFF',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer'
};

const sectionStyle = {
    border: '1px solid #ddd',
    padding: '15px',
    borderRadius: '8px',
    backgroundColor: '#fafafa'
};

const actionItemStyle = {
    display: 'flex',
    gap: '10px',
    alignItems: 'center',
    marginBottom: '10px'
};

const selectStyle = {
    padding: '5px',
    borderRadius: '4px',
    border: '1px solid #ccc',
    minWidth: '100px'
};

const inputStyle = {
    padding: '5px',
    borderRadius: '4px',
    border: '1px solid #ccc',
    flex: '1'
};

const deleteButtonStyle = {
    padding: '5px 10px',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
};

const addButtonStyle = {
    padding: '8px 15px',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    marginTop: '10px'
};

export default ScriptsCreator;