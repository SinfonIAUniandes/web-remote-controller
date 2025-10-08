import { useEffect, useState } from 'react';
import { useRos } from '../contexts/RosContext';
import { createTopic } from '../services/RosManager';
import * as ROSLIB from 'roslib';
import animationsTxt from "../animations/animations.txt";

const ScriptsCreator = () => {
    const { ros } = useRos();
    const [animations, setAnimations] = useState({});
    const [isExecuting, setIsExecuting] = useState(false);
    const [filename, setFilename] = useState("script");
    const [script, setScript] = useState({
        subtitulos: false,
        img: false,
        speech: [],
        animation: [],
        pantalla: []
    });

    const executeCompleteScript = async () => {
        if (!ros || isExecuting) return;
        setIsExecuting(true);
        console.log("Iniciando ejecución de script completo");

        const speechTopic = createTopic(ros, '/speech', 'robot_toolkit_msgs/speech_msg');
        const animationTopic = createTopic(ros, "/animations", "robot_toolkit_msgs/animation_msg");

        const allActions = [
            ...script.speech.map(action => ({ ...action, category: 'speech' })),
            ...script.animation.map(action => ({ ...action, category: 'animation' })),
            ...script.pantalla.map(action => ({ ...action, category: 'pantalla' }))
        ];

        for (let i = 0; i < allActions.length; i++) {
            const action = allActions[i];
            console.log(`▶ Ejecutando acción ${i + 1}/${allActions.length}:`, action);

            try {
                if (action.category === 'speech') {
                    if (action.tipo === "text") {
                        const speechMessage = new ROSLIB.Message({
                            language: 'Spanish',
                            text: action.info,
                            animated: true
                        });
                        speechTopic.publish(speechMessage);
                        const speechTime = Math.max(2000, action.info.length * 100);
                        await new Promise(r => setTimeout(r, speechTime));
                    } else if (action.tipo === "delay") {
                        await new Promise(r => setTimeout(r, parseInt(action.info)));
                    }
                } else if (action.category === 'animation') {
                    if (action.tipo === "movimiento") {
                        const animationMessage = new ROSLIB.Message({
                            family: "animations",
                            animation_name: action.info
                        });
                        animationTopic.publish(animationMessage);
                        await new Promise(r => setTimeout(r, 3000));
                    } else if (action.tipo === "delay") {
                        await new Promise(r => setTimeout(r, parseInt(action.info)));
                    }
                } else if (action.category === 'pantalla') {
                    await new Promise(r => setTimeout(r, 2000));
                }
                await new Promise(r => setTimeout(r, 500));
            } catch (error) {
                console.error(`Error en acción ${i + 1}:`, error);
            }
        }
        console.log("Script completado");
        setIsExecuting(false);
    };

    const handleDownload = () => {
        const element = document.createElement("a");
        const file = new Blob([JSON.stringify(script, null, 2)], { type: 'application/json' });
        element.href = URL.createObjectURL(file);
        element.download = `${filename}.json`;
        document.body.appendChild(element);
        element.click();
    };

    const handleUpload = (event) => {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const uploadedScript = JSON.parse(e.target.result);
                if (
                    uploadedScript &&
                    (Array.isArray(uploadedScript.speech) ||
                        Array.isArray(uploadedScript.animation) ||
                        Array.isArray(uploadedScript.pantalla))
                ) {
                    setScript(uploadedScript);
                    alert("Script cargado exitosamente!");
                } else throw new Error("Estructura inválida");
            } catch (error) {
                alert("Error: El archivo no es válido");
            }
        };
        reader.readAsText(file);
    };

    useEffect(() => {
        fetch(animationsTxt)
            .then(res => res.text())
            .then(text => {
                const parsed = {};
                text.split("\n").forEach(line => {
                    const parts = line.trim().split("/");
                    if (parts.length === 3) {
                        const [cat, sub, anim] = parts;
                        if (!parsed[cat]) parsed[cat] = {};
                        if (!parsed[cat][sub]) parsed[cat][sub] = [];
                        parsed[cat][sub].push(anim);
                    } else if (parts.length === 2) {
                        const [cat, anim] = parts;
                        if (!parsed[cat]) parsed[cat] = {};
                        if (!parsed[cat]["_no_subcategory"]) parsed[cat]["_no_subcategory"] = [];
                        parsed[cat]["_no_subcategory"].push(anim);
                    }
                });
                setAnimations(parsed);
            });
    }, []);

    return (
        <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
            <h2>🎭 Creador de Scripts para Pepper</h2>

            {/* Botón de ejecución */}
            <div style={{
                marginBottom: '20px', padding: '15px', border: '2px solid #28a745',
                borderRadius: '8px', backgroundColor: '#f8fff9', textAlign: 'center'
            }}>
                <button
                    onClick={executeCompleteScript}
                    disabled={isExecuting || (script.speech.length === 0 && script.animation.length === 0)}
                    style={executeButtonStyle}
                >
                    {isExecuting ? 'Ejecutando Script...' : 'Ejecutar Script Completo'}
                </button>
            </div>

            {/* Subir / Descargar */}
            <div style={{
                marginBottom: '20px', padding: '15px', border: '2px dashed #007BFF',
                borderRadius: '8px', backgroundColor: '#f8f9fa'
            }}>
                <h3>Gestionar Scripts</h3>
                <label>Nombre del archivo JSON: </label>
                <input
                    type="text"
                    value={filename}
                    onChange={(e) => setFilename(e.target.value)}
                    style={{ marginRight: '10px' }}
                />
                <input type="file" accept=".json" onChange={handleUpload} />
                <button onClick={handleDownload} style={downloadButtonStyle}>
                    Descargar Script
                </button>
            </div>

            {/* Configuración */}
            <div style={{ marginBottom: '20px' }}>
                <h3>Configuración</h3>
                <div style={{ display: 'flex', gap: '20px' }}>
                    <label>
                        <input
                            type="checkbox"
                            checked={script.subtitulos}
                            disabled={script.img}
                            onChange={() => setScript({ ...script, subtitulos: !script.subtitulos })}
                        /> Subtítulos
                    </label>
                    <label>
                        <input
                            type="checkbox"
                            checked={script.img}
                            disabled={script.subtitulos}
                            onChange={() => setScript({ ...script, img: !script.img })}
                        /> Imagen
                    </label>
                </div>
            </div>

            {/* Speech y Animaciones */}
            <div style={{ display: 'grid', gap: '20px', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
                {/* SPEECH */}
                <div style={sectionStyle}>
                    <h4>🎙️ Speech ({script.speech.length})</h4>
                    {script.speech.map((item, index) => (
                        <div key={index} style={actionItemStyle}>
                            <select
                                value={item.tipo}
                                onChange={(e) => {
                                    const updated = [...script.speech];
                                    updated[index].tipo = e.target.value;
                                    setScript({ ...script, speech: updated });
                                }}
                                style={selectStyle}
                            >
                                <option value="text">Texto</option>
                                <option value="delay">Delay</option>
                            </select>
                            <input
                                type={item.tipo === "delay" ? "number" : "text"}
                                value={item.info}
                                onChange={(e) => {
                                    const updated = [...script.speech];
                                    updated[index].info = e.target.value;
                                    setScript({ ...script, speech: updated });
                                }}
                                placeholder={item.tipo === "delay" ? "ms" : "Texto para hablar"}
                                style={inputStyle}
                            />
                            <button
                                onClick={() => {
                                    const newSpeech = script.speech.filter((_, i) => i !== index);
                                    setScript({ ...script, speech: newSpeech });
                                }}
                                style={deleteButtonStyle}
                            >❌</button>
                        </div>
                    ))}
                    <button
                        onClick={() => setScript({
                            ...script, speech: [...script.speech, { tipo: "text", info: "Hola, soy Pepper" }]
                        })}
                        style={addButtonStyle}
                    >
                        ➕ Añadir Speech
                    </button>
                </div>

                {/* ANIMACIÓN */}
                <div style={sectionStyle}>
                    <h4>🕺 Animaciones ({script.animation.length})</h4>
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
                                <>
                                    <select
                                        value={item.info}
                                        onChange={(e) => {
                                            const newAnimation = [...script.animation];
                                            newAnimation[index].info = e.target.value;
                                            setScript({ ...script, animation: newAnimation });
                                        }}
                                        style={inputStyle}
                                    >
                                        <option value="">Seleccionar animación</option>
                                        {Object.entries(animations).map(([cat, subs]) => (
                                            <optgroup key={cat} label={cat}>
                                                {Object.entries(subs).map(([sub, anims]) => (
                                                    <optgroup key={sub} label={`- ${sub}`}>
                                                        {anims.map(anim => (
                                                            <option
                                                                key={`${cat}/${sub}/${anim}`}
                                                                value={`${cat}/${sub}/${anim}`}
                                                            >
                                                                {anim}
                                                            </option>
                                                        ))}
                                                    </optgroup>
                                                ))}
                                            </optgroup>
                                        ))}
                                    </select>
                                </>
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
                                    const newAnimation = script.animation.filter((_, i) => i !== index);
                                    setScript({ ...script, animation: newAnimation });
                                }}
                                style={deleteButtonStyle}
                            >❌</button>
                        </div>
                    ))}
                    <button
                        onClick={() => setScript({
                            ...script,
                            animation: [...script.animation, { tipo: "movimiento", info: "Gestures/Hey_1" }]
                        })}
                        style={addButtonStyle}
                    >
                        ➕ Añadir Animación
                    </button>
                </div>
            </div>

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
                    Ejecutando script completo...
                </div>
            )}
        </div>
    );
};

// --- estilos
const executeButtonStyle = {
    padding: '15px 30px',
    fontSize: '18px',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 'bold'
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
const selectStyle = { padding: '5px', borderRadius: '4px', border: '1px solid #ccc' };
const inputStyle = { padding: '5px', borderRadius: '4px', border: '1px solid #ccc', flex: '1' };
const deleteButtonStyle = {
    padding: '5px 10px', backgroundColor: '#dc3545', color: 'white',
    border: 'none', borderRadius: '4px', cursor: 'pointer'
};
const addButtonStyle = {
    padding: '8px 15px', backgroundColor: '#28a745', color: 'white',
    border: 'none', borderRadius: '5px', cursor: 'pointer', marginTop: '10px'
};

export default ScriptsCreator;