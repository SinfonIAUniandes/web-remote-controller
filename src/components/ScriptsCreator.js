import { useEffect, useState } from 'react';
import { useRos } from '../contexts/RosContext';
import { createTopic } from '../services/RosManager';
import * as ROSLIB from 'roslib';
import animationsTxt from "../animations/animations.txt";

const ScriptsCreator = () => {
    const { ros } = useRos();
    const [animations, setAnimations] = useState({});
    const [isExecuting, setIsExecuting] = useState(false);
    const [script, setScript] = useState({
        subtitulos: false,
        img: false,
        speech: [],
        animation: [],
        pantalla: []
    });
    const [filename, setFilename] = useState("script");

    const executeCompleteScript = async () => {
        if (!ros || isExecuting) return;
        setIsExecuting(true);
        console.log("Iniciando ejecución del script...");

        const speechTopic = createTopic(ros, '/speech', 'robot_toolkit_msgs/speech_msg');
        const animationTopic = createTopic(ros, "/animations", "robot_toolkit_msgs/animation_msg");
        const subtituloTopic = createTopic(ros, "/tablet_say", "std_msgs/String");

        const allActions = [
            ...script.speech.map(action => ({ ...action, category: 'speech' })),
            ...script.animation.map(action => ({ ...action, category: 'animation' })),
            ...script.pantalla.map(action => ({ ...action, category: 'pantalla' }))
        ];

        for (let i = 0; i < allActions.length; i++) {
            const action = allActions[i];
            try {
                if (action.category === 'speech') {
                    if (action.tipo === "text") {
                        const msg = new ROSLIB.Message({
                            language: 'Spanish',
                            text: action.info,
                            animated: true
                        });
                        speechTopic.publish(msg);
                        if (script.subtitulos) {
                            subtituloTopic.publish(new ROSLIB.Message({ data: action.info }));
                        }
                        await new Promise(r => setTimeout(r, Math.max(2000, action.info.length * 100)));
                    } else if (action.tipo === "delay") {
                        await new Promise(r => setTimeout(r, parseInt(action.info)));
                    }
                } else if (action.category === 'animation') {
                    if (action.tipo === "movimiento") {
                        const msg = new ROSLIB.Message({
                            family: "animations",
                            animation_name: action.info
                        });
                        animationTopic.publish(msg);
                        await new Promise(r => setTimeout(r, 3000));
                    } else if (action.tipo === "delay") {
                        await new Promise(r => setTimeout(r, parseInt(action.info)));
                    }
                } else if (action.category === 'pantalla') {
                    console.log("Pantalla:", action.info);
                    await new Promise(r => setTimeout(r, 2000));
                }
                await new Promise(r => setTimeout(r, 500));
            } catch (e) {
                console.error("Error en acción", i, e);
            }
        }

        console.log("✅ Script ejecutado completamente");
        setIsExecuting(false);
    };

    const handleDownload = () => {
        const blob = new Blob([JSON.stringify(script, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${filename || "script"}.json`;
        link.click();
    };

    const handleUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const newScript = JSON.parse(event.target.result);
                if (Array.isArray(newScript.speech) || Array.isArray(newScript.animation)) {
                    setScript(newScript);
                } else {
                    alert("Estructura inválida");
                }
            } catch {
                alert("Archivo no válido");
            }
        };
        reader.readAsText(file);
    };

    useEffect(() => {
        fetch(animationsTxt)
            .then(res => res.text())
            .then(text => {
                const anims = {};
                text.split("\n").forEach(line => {
                    const parts = line.trim().split("/");
                    if (parts.length === 3) {
                        const [cat, sub, name] = parts;
                        if (!anims[cat]) anims[cat] = {};
                        if (!anims[cat][sub]) anims[cat][sub] = [];
                        anims[cat][sub].push(name);
                    } else if (parts.length === 2) {
                        const [cat, name] = parts;
                        if (!anims[cat]) anims[cat] = {};
                        if (!anims[cat]["_no_sub"]) anims[cat]["_no_sub"] = [];
                        anims[cat]["_no_sub"].push(name);
                    }
                });
                setAnimations(anims);
            });
    }, []);

    return (
        <div style={{ padding: "20px" }}>
            <h2>🎭 Creador de Scripts</h2>

            <div>
                <button onClick={executeCompleteScript} disabled={isExecuting}>
                    {isExecuting ? "Ejecutando..." : "▶ Ejecutar script completo"}
                </button>
            </div>

            <div style={{ marginTop: "20px" }}>
                <label>Nombre de archivo: </label>
                <input value={filename} onChange={(e) => setFilename(e.target.value)} />
                <button onClick={handleDownload}>💾 Descargar script</button>
                <input type="file" accept=".json" onChange={handleUpload} />
            </div>

            <div>
                <input type="checkbox" id="sub" checked={script.subtitulos} disabled={script.img}
                    onChange={() => setScript({ ...script, subtitulos: !script.subtitulos })} />
                <label htmlFor="sub">Subtítulos</label>

                <input type="checkbox" id="img" checked={script.img} disabled={script.subtitulos}
                    onChange={() => setScript({ ...script, img: !script.img })} />
                <label htmlFor="img">Imagen</label>
            </div>

            {script.img && (
                <div>
                    <label>URL Imagen: </label>
                    <input
                        type="text"
                        value={script.pantalla[0]?.info || ""}
                        onChange={(e) => setScript({
                            ...script,
                            pantalla: [{ tipo: "imagen", info: e.target.value }]
                        })}
                    />
                </div>
            )}

            <div>
                <h3>🎙️ Speech</h3>
                {script.speech.map((item, i) => (
                    <div key={i}>
                        <select value={item.tipo} onChange={(e) => {
                            const s = [...script.speech];
                            s[i].tipo = e.target.value;
                            setScript({ ...script, speech: s });
                        }}>
                            <option value="text">Texto</option>
                            <option value="delay">Delay</option>
                        </select>
                        <input value={item.info} onChange={(e) => {
                            const s = [...script.speech];
                            s[i].info = e.target.value;
                            setScript({ ...script, speech: s });
                        }} />
                        <button onClick={() => {
                            const s = script.speech.filter((_, idx) => idx !== i);
                            setScript({ ...script, speech: s });
                        }}>🗑</button>
                    </div>
                ))}
                <button onClick={() => setScript({
                    ...script,
                    speech: [...script.speech, { tipo: "text", info: "Hola, soy Pepper" }]
                })}>➕ Añadir speech</button>
            </div>

            <div>
                <h3>🕺 Animaciones</h3>
                {script.animation.map((item, i) => (
                    <div key={i}>
                        <select value={item.tipo} onChange={(e) => {
                            const a = [...script.animation];
                            a[i].tipo = e.target.value;
                            setScript({ ...script, animation: a });
                        }}>
                            <option value="movimiento">Movimiento</option>
                            <option value="delay">Delay</option>
                        </select>
                        {item.tipo === "movimiento" ? (
                            <select value={item.info} onChange={(e) => {
                                const a = [...script.animation];
                                a[i].info = e.target.value;
                                setScript({ ...script, animation: a });
                            }}>
                                <option value="">Seleccionar animación</option>
                                {Object.entries(animations).flatMap(([cat, subs]) =>
                                    Object.entries(subs).flatMap(([sub, names]) =>
                                        names.map(name => {
                                            const path = sub === "_no_sub"
                                                ? `${cat}/${name}`
                                                : `${cat}/${sub}/${name}`;
                                            return <option key={path} value={path}>{path}</option>;
                                        })
                                    )
                                )}
                            </select>
                        ) : (
                            <input type="number" value={item.info} onChange={(e) => {
                                const a = [...script.animation];
                                a[i].info = e.target.value;
                                setScript({ ...script, animation: a });
                            }} />
                        )}
                        <button onClick={() => {
                            const a = script.animation.filter((_, idx) => idx !== i);
                            setScript({ ...script, animation: a });
                        }}>🗑</button>
                    </div>
                ))}
                <button onClick={() => setScript({
                    ...script,
                    animation: [...script.animation, { tipo: "movimiento", info: "Gestures/Hey_1" }]
                })}>➕ Añadir animación</button>
            </div>
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