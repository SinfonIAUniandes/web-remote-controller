import React, { useState } from 'react';
import { useRos } from '../contexts/RosContext';
import { createTopic } from '../services/RosManager';
import * as ROSLIB from 'roslib';

const QuickActions = () => {
    const { ros } = useRos();
    const [isExecuting, setIsExecuting] = useState(false);

    const speechTopic = createTopic(ros, '/speech', 'robot_toolkit_msgs/speech_msg');
    const animationTopic = createTopic(ros, "/animations", "robot_toolkit_msgs/animation_msg");

    const executeSequence = async (actions) => {
        if (!ros || isExecuting) return;
        
        setIsExecuting(true);
        console.log("Iniciando secuencia con", actions.length, "acciones");
        
        for (let i = 0; i < actions.length; i++) {
            const action = actions[i];
            console.log(`Ejecutando acción ${i + 1}/${actions.length}:`, action);
            
            try {
                if (action.tipo === "text") {
                    await executeSpeech(action.info, 'Spanish');
                } else if (action.tipo === "movimiento") {
                    await executeAnimation(action.info);
                } else if (action.tipo === "delay") {
                    await delay(parseInt(action.info));
                }
                
                // Pausa entre acciones
                await delay(500);
            } catch (error) {
                console.error(`Error en acción ${i + 1}:`, error);
            }
        }
        
        console.log("Secuencia completada");
        setIsExecuting(false);
    };

    // Funciones de ejecución individual
    const executeSpeech = (text, language) => {
        return new Promise((resolve) => {
            if (speechTopic) {
                const message = new ROSLIB.Message({
                    language: language,
                    text: text,
                    animated: true
                });
                speechTopic.publish(message);
                console.log(`Diciendo: "${text}"`);
                const estimatedTime = Math.max(2000, text.length * 100);
                setTimeout(resolve, estimatedTime);
            } else {
                resolve();
            }
        });
    };

    const executeAnimation = (animationPath) => {
        return new Promise((resolve) => {
            if (animationTopic) {
                const message = new ROSLIB.Message({
                    family: "animations",
                    animation_name: animationPath
                });
                animationTopic.publish(message);
                console.log(`Animación: ${animationPath}`);
                setTimeout(resolve, 3000);
            } else {
                resolve();
            }
        });
    };

    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    // ACCIONES RÁPIDAS PREDEFINIDAS (compatibles con ScriptsCreator)
    const quickActions = {
        saludo: [
            { tipo: "text", info: "¡Hola! Soy Pepper, es un placer conocerte" },
            { tipo: "movimiento", info: "Gestures/Hey_1" }
        ],
        
        presentacion: [
            { tipo: "text", info: "Bienvenidos al laboratorio de robótica. Estoy aquí para ayudarlos" },
            { tipo: "movimiento", info: "Gestures/Explain_1" }
        ],
        
        despedida: [
            { tipo: "text", info: "¡Ha sido un gusto! Hasta la próxima" },
            { tipo: "movimiento", info: "Gestures/Bye_1" }
        ],
        
        celebracion: [
            { tipo: "text", info: "¡Lo logramos! Excelente trabajo" },
            { tipo: "movimiento", info: "Gestures/Bravo_1" },
            { tipo: "delay", info: "1000" }
        ],
        
        baile: [
            { tipo: "text", info: "¡Es hora de bailar!" },
            { tipo: "movimiento", info: "Dances/Disco" },
            { tipo: "delay", info: "5000" }
        ],
        
        pensar: [
            { tipo: "movimiento", info: "Gestures/Think_1" },
            { tipo: "text", info: "Déjenme pensar en la solución..." },
            { tipo: "delay", info: "2000" },
            { tipo: "text", info: "Creo que ya tengo una idea" }
        ]
    };

    return (
        <div style={{ 
            textAlign: 'center', 
            padding: '20px',
            border: '2px solid #007BFF',
            borderRadius: '10px',
            margin: '20px 0',
            backgroundColor: '#f8f9fa'
        }}>
            <h2>Acciones Rápidas</h2>
            <p style={{ color: '#666', marginBottom: '20px' }}>
                Ejecuta scripts predefinidos con un solo clic
            </p>
            
            {/* BOTONES SIMPLES */}
            <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                gap: '10px',
                marginBottom: '20px'
            }}>
                <button 
                    onClick={() => executeSequence(quickActions.saludo)} 
                    disabled={isExecuting} 
                    style={buttonStyle}
                >
                    Saludo
                </button>
                
                <button 
                    onClick={() => executeSequence(quickActions.presentacion)} 
                    disabled={isExecuting} 
                    style={buttonStyle}
                >
                    Presentación
                </button>
                
                <button 
                    onClick={() => executeSequence(quickActions.despedida)} 
                    disabled={isExecuting} 
                    style={buttonStyle}
                >
                    Despedida
                </button>
                
                <button 
                    onClick={() => executeSequence(quickActions.celebracion)} 
                    disabled={isExecuting} 
                    style={buttonStyle}
                >
                    Celebración
                </button>
                
                <button 
                    onClick={() => executeSequence(quickActions.baile)} 
                    disabled={isExecuting} 
                    style={buttonStyle}
                >
                    Baile
                </button>
                
                <button 
                    onClick={() => executeSequence(quickActions.pensar)} 
                    disabled={isExecuting} 
                    style={buttonStyle}
                >
                    Pensar
                </button>
            </div>
            
            {/* ESTADO DE EJECUCIÓN */}
            {isExecuting && (
                <div style={{ 
                    color: '#007BFF', 
                    fontWeight: 'bold',
                    padding: '10px',
                    backgroundColor: '#e7f3ff',
                    borderRadius: '5px'
                }}>
                    Ejecutando secuencia...
                </div>
            )}

            {/* INFORMACIÓN COMPATIBILIDAD */}
            <div style={{ 
                fontSize: '12px', 
                color: '#666', 
                marginTop: '15px',
                padding: '10px',
                backgroundColor: '#fff',
                borderRadius: '5px',
                border: '1px solid #ddd'
            }}>
                Compatible con: <strong>ScriptsCreator.js</strong> - Usa la misma estructura de datos
            </div>
        </div>
    );
};

// Estilos simples
const buttonStyle = {
    padding: '12px 15px',
    fontSize: '16px',
    backgroundColor: '#007BFF',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    minHeight: '60px',
    opacity: 1
};

export default QuickActions;