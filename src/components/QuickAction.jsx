import React, { useRef, useState, useEffect } from 'react';
import { useRos } from '../contexts/RosContext';
import { executeScript } from '../services/scriptExecutor';
import { COLORS, TYPOGRAPHY } from '../theme';

// Scripts rápidos predefinidos en el nuevo formato step-based
const quickScripts = {
    saludo: {
        config: { name: 'saludo', language: 'Spanish' },
        steps: [
            { id: 's1', speech: '¡Hola! Soy Pepper, es un placer conocerte', animation: 'Gestures/Hey_1', screen: null }
        ]
    },
    presentacion: {
        config: { name: 'presentacion', language: 'Spanish' },
        steps: [
            { id: 'p1', speech: 'Bienvenidos al laboratorio de robótica', animation: 'Gestures/Explain_1', screen: null },
            { id: 'p2', speech: 'Estoy aquí para ayudarlos en sus investigaciones', animation: '', screen: null }
        ]
    },
    despedida: {
        config: { name: 'despedida', language: 'Spanish' },
        steps: [
            { id: 'd1', speech: '¡Ha sido un gusto interactuar con ustedes!', animation: 'Gestures/Bye_1', screen: null },
            { id: 'd2', speech: '¡Hasta la próxima!', animation: '', screen: null }
        ]
    },
    celebracion: {
        config: { name: 'celebracion', language: 'Spanish' },
        steps: [
            { id: 'c1', speech: '¡Lo logramos! Excelente trabajo equipo', animation: 'Gestures/Bravo_1', screen: null },
            { id: 'c2', speech: '', animation: 'Emotions/Positive/Winner_2', screen: null }
        ]
    },
    baile: {
        config: { name: 'baile', language: 'Spanish' },
        steps: [
            { id: 'b1', speech: '¡Es hora de bailar! Pongan música', animation: 'Dances/Disco', screen: null },
            { id: 'b2', speech: '¡Qué divertido!', animation: '', screen: null }
        ]
    }
};

const QuickAction = () => {
    const { ros } = useRos();
    const [isExecuting, setIsExecuting] = useState(false);
    const [currentScript, setCurrentScript] = useState('');
    const [hoveredKey, setHoveredKey] = useState(null);
    const [isHoveredStop, setIsHoveredStop] = useState(false);

    const abortRef = useRef(null);

    // Limpieza automática si el componente se desmonta durante la ejecución
    useEffect(() => {
        return () => {
            abortRef.current?.abort();
        };
    }, []);

    const handleRun = async (key) => {
        if (!ros || isExecuting) return;
        const script = quickScripts[key];
        if (!script) return;

        const ctrl = new AbortController();
        abortRef.current = ctrl;
        setIsExecuting(true);
        setCurrentScript(key);

        try {
            await executeScript(ros, script.steps, script.config.language, { 
                signal: ctrl.signal, 
                stepDelay: 500 
            });
        } catch (error) {
            if (error.name !== 'AbortError') {
                console.error("Error ejecutando acción rápida:", error);
            }
        } finally {
            setIsExecuting(false);
            setCurrentScript('');
            abortRef.current = null;
        }
    };

    const handleStop = () => {
        abortRef.current?.abort();
    };

    const buttons = [
        { key: 'saludo',       label: 'Saludo' },
        { key: 'presentacion', label: 'Presentación' },
        { key: 'despedida',    label: 'Despedida' },
        { key: 'celebracion',  label: 'Celebración' },
        { key: 'baile',        label: 'Baile' }
    ];

    return (
        <div 
            data-estado={isExecuting ? "True" : "False"} 
            data-seleccionado={currentScript || "Ninguno"} 
            style={{ width: '1008px', height: '145px', position: 'relative', background: '#00214B', overflow: 'hidden', borderRadius: 20 }}
        >
            {/* Etiqueta título */}
            <div style={{ width: 180, height: 30, paddingLeft: 19, paddingRight: 19, left: 0, top: 21, position: 'absolute', background: '#CFDDFC', overflow: 'hidden', borderTopRightRadius: 25, borderBottomRightRadius: 25, justifyContent: 'center', alignItems: 'center', gap: 10, display: 'inline-flex' }}>
                <div style={{ textAlign: 'center', justifyContent: 'center', display: 'flex', flexDirection: 'column', color: '#00214B', fontSize: 16, fontFamily: 'Nunito', fontWeight: '700', wordWrap: 'break-word' }}>
                    Acciones rápidas
                </div>
            </div>

            {/* Contenedor de botones */}
            <div style={{ width: 1008, paddingLeft: 20, paddingRight: 20, left: 0, top: 72, position: 'absolute', justifyContent: 'space-between', alignItems: 'center', display: 'inline-flex', boxSizing: 'border-box' }}>
                {buttons.map(({ key, label }) => (
                    <div
                        key={key}
                        onClick={() => handleRun(key)}
                        onMouseEnter={() => !isExecuting && setHoveredKey(key)}
                        onMouseLeave={() => setHoveredKey(null)}
                        style={{
                            width: 180, 
                            height: 40, 
                            position: 'relative', 
                            background: (currentScript === key || hoveredKey === key) ? '#8F8AF9' : '#CFDDFC', 
                            borderRadius: 10,
                            cursor: isExecuting ? 'not-allowed' : 'pointer',
                            opacity: isExecuting && currentScript !== key ? 0.5 : 1,
                            transition: 'all 0.2s ease'
                        }}
                    >
                        <div style={{ width: 184, height: 60, left: -2, top: -10, position: 'absolute', textAlign: 'center', justifyContent: 'center', display: 'flex', flexDirection: 'column', color: '#00214B', fontSize: 16, fontFamily: 'Nunito', fontWeight: '700', wordWrap: 'break-word' }}>
                            {currentScript === key ? `▶ ${label}` : label.toUpperCase()}
                        </div>
                    </div>
                ))}
            </div>

            {/* Botón detener superpuesto o al final si hay ejecución */}
            {isExecuting && (
                <div
                    onClick={handleStop}
                    onMouseEnter={() => setIsHoveredStop(true)}
                    onMouseLeave={() => setIsHoveredStop(false)}
                    style={{
                        position: 'absolute',
                        right: '20px',
                        top: '21px',
                        width: '120px', 
                        height: '30px', 
                        background: isHoveredStop ? '#b3154d' : COLORS.ROJO, 
                        borderRadius: 10,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s ease',
                        zIndex: 5
                    }}
                >
                    <div style={{ color: '#fff', fontSize: 14, fontFamily: 'Nunito', fontWeight: '700' }}>
                        DETENER
                    </div>
                </div>
            )}
        </div>
    );
};

export default QuickAction;