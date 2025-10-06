import React, { useState } from 'react';
import { useRos } from '../contexts/RosContext';
import { createTopic } from '../services/RosManager';
import * as ROSLIB from 'roslib';

const QuickActions = () => {
    const { ros } = useRos();
    const [isExecuting, setIsExecuting] = useState(false);

    // FUNCIÓN ÚNICA QUE EJECUTA TODO EL SCRIPT
    const executeCompleteScript = async (scriptActions) => {
        if (!ros || isExecuting) return;
        
        setIsExecuting(true);
        console.log("Iniciando script completo con", scriptActions.length, "acciones");

        // Crear TODOS los topics UNA sola vez
        const speechTopic = createTopic(ros, '/speech', 'robot_toolkit_msgs/speech_msg');
        const animationTopic = createTopic(ros, "/animations", "robot_toolkit_msgs/animation_msg");

        // Ejecutar cada acción en secuencia
        for (let i = 0; i < scriptActions.length; i++) {
            const action = scriptActions[i];
            console.log(`Ejecutando acción ${i + 1}/${scriptActions.length}:`, action);
            
            try {
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
                    
                } else if (action.tipo === "movimiento") {
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
                    console.log(`Delay: ${action.info}ms`);
                    await new Promise(resolve => setTimeout(resolve, parseInt(action.info)));
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

    // SCRIPTS PREDEFINIDOS
    const quickScripts = {
        saludo: [
            { tipo: "text", info: "¡Hola! Soy Pepper, es un placer conocerte" },
            { tipo: "movimiento", info: "Gestures/Hey_1" }
        ],
        
        presentacion: [
            { tipo: "text", info: "Bienvenidos al laboratorio de robótica" },
            { tipo: "movimiento", info: "Gestures/Explain_1" },
            { tipo: "text", info: "Estoy aquí para ayudarlos en sus investigaciones" }
        ],
        
        despedida: [
            { tipo: "text", info: "¡Ha sido un gusto interactuar con ustedes!" },
            { tipo: "movimiento", info: "Gestures/Bye_1" },
            { tipo: "text", info: "¡Hasta la próxima!" }
        ],
        
        celebracion: [
            { tipo: "text", info: "¡Lo logramos! Excelente trabajo equipo" },
            { tipo: "movimiento", info: "Gestures/Bravo_1" },
            { tipo: "delay", info: "1000" },
            { tipo: "movimiento", info: "Gestures/Happy_1" }
        ],
        
        baile: [
            { tipo: "text", info: "¡Es hora de bailar! Pongan música" },
            { tipo: "movimiento", info: "Dances/Disco" },
            { tipo: "delay", info: "5000" },
            { tipo: "text", info: "¡Qué divertido!" }
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
            <h2>Scripts Automáticos</h2>
            <p style={{ color: '#666', marginBottom: '20px' }}>
                Un solo clic = Script completo ejecutado
            </p>
            
            {/* BOTONES - CADA UNO LLAMA A LA FUNCIÓN ÚNICA */}
            <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                gap: '10px',
                marginBottom: '20px'
            }}>
                <button 
                    onClick={() => executeCompleteScript(quickScripts.saludo)} 
                    disabled={isExecuting} 
                    style={buttonStyle}
                >
                    Saludo Completo
                </button>
                
                <button 
                    onClick={() => executeCompleteScript(quickScripts.presentacion)} 
                    disabled={isExecuting} 
                    style={buttonStyle}
                >
                    Presentación Completa
                </button>
                
                <button 
                    onClick={() => executeCompleteScript(quickScripts.despedida)} 
                    disabled={isExecuting} 
                    style={buttonStyle}
                >
                    Despedida Completa
                </button>
                
                <button 
                    onClick={() => executeCompleteScript(quickScripts.celebracion)} 
                    disabled={isExecuting} 
                    style={buttonStyle}
                >
                    Celebración Completa
                </button>
                
                <button 
                    onClick={() => executeCompleteScript(quickScripts.baile)} 
                    disabled={isExecuting} 
                    style={buttonStyle}
                >
                    Baile Completo
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
                    Ejecutando script completo...
                </div>
            )}
        </div>
    );
};

// Estilos
const buttonStyle = {
    padding: '12px 15px',
    fontSize: '16px',
    backgroundColor: '#007BFF',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    minHeight: '60px'
};

export default QuickActions;