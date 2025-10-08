import { useEffect, useState } from 'react';
import { useRos } from '../contexts/RosContext';
import { createTopic } from '../services/RosManager';
import * as ROSLIB from 'roslib';
import animationsTxt from "../animations/animations.txt";
import ServicioImagen from './Imagen';
import ShowWordsTablet from './ShowWordsTablet';

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

        allActions.sort((a, b) => allActions.indexOf(a) - allActions.indexOf(b));

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
                        console.log(`Diciendo: "${action.info}"`);

                        const speechTime = Math.max(2000, action.info.length * 100);
                        await new Promise(resolve => setTimeout(resolve, speechTime));

                    } else if (action.tipo === "delay") {
                        console.log(`Delay speech: ${action.info}ms`);
                        await new Promise(resolve => setTimeout(resolve, parseInt(action.info)));
                    }

                } else if (action.category === 'animation') {
                    if (action.tipo === "movimiento") {
                        const animationMessage = new ROSLIB.Message({
                            family: "animations",
                            animation_name: action.info
                        });
                        animationTopic.publish(animationMessage);
                        console.log(`Animación: ${action.info}`);

                        await new Promise(resolve => setTimeout(resolve, 3000));

                    } else if (action.tipo === "delay") {
                        console.log(`Delay animation: ${action.info}ms`);
                        await new Promise(resolve => setTimeout(resolve, parseInt(action.info)));
                    }

                } else if (action.category === 'pantalla') {
                    console.log(`Acción de pantalla: ${action.info}`);
                    await new Promise(resolve => setTimeout(resolve, 2000));
                }

                await new Promise(resolve => setTimeout(resolve, 500));

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
        element.download = "script.json";
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

            <div style={{ marginBottom: '20px', padding: '15px', border: '2px solid #28a745', borderRadius: '8px', backgroundColor: '#f8fff9', textAlign: 'center' }}>
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

            <div style={{ marginBottom: '20px', padding: '15px', border: '2px dashed #007BFF', borderRadius: '8px', backgroundColor: '#f8f9fa' }}>
                <h3>Gestionar Scripts</h3>

                <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
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

                    <button 
                        onClick={handleDownload}
                        disabled={script.speech.length === 0 && script.animation.length === 0}
                        style={downloadButtonStyle}
                    >
                        Descargar Script
                    </button>
                </div>
            </div>

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

                {script.img && (
                    <div style={{ marginTop: '20px' }}>
                        <ServicioImagen />
                    </div>
                )}

                {script.subtitulos && (
                    <div style={{ marginTop: '20px' }}>
                        <ShowWordsTablet />
                    </div>
                )}
            </div>
        </div>
    );
};

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

export default ScriptsCreator;