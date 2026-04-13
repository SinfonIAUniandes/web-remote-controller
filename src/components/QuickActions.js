import React, { useRef, useState } from 'react';
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

const QuickActions = () => {
    const { ros } = useRos();
    const [isExecuting, setIsExecuting] = useState(false);
    const [currentScript, setCurrentScript] = useState('');
    const abortRef = useRef(null);

    const handleRun = async (key) => {
        if (!ros || isExecuting) return;
        const script = quickScripts[key];
        if (!script) return;

        const ctrl = new AbortController();
        abortRef.current = ctrl;
        setIsExecuting(true);
        setCurrentScript(key);

        try {
            await executeScript(ros, script.steps, script.config.language, { signal: ctrl.signal, stepDelay: 500 });
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
        <div style={{
            padding: '16px',
            border: `2px solid ${COLORS.AZUL_SECUNDARIO}`,
            borderRadius: '12px',
            backgroundColor: COLORS.CELESTE_PRINCIPAL,
            fontFamily: TYPOGRAPHY.FONT_FAMILY_PRINCIPAL
        }}>
            <h3 style={{ margin: '0 0 4px', color: COLORS.AZUL_PRINCIPAL, fontWeight: TYPOGRAPHY.FONT_WEIGHT_BOLD }}>
                Acciones Rápidas
            </h3>
            <p style={{ margin: '0 0 12px', color: COLORS.AZUL_PRINCIPAL, fontSize: '13px', opacity: 0.7 }}>
                Un clic ejecuta el script completo
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {buttons.map(({ key, label }) => (
                    <button
                        key={key}
                        onClick={() => handleRun(key)}
                        disabled={isExecuting}
                        style={{
                            padding: '10px 16px',
                            fontSize: '14px',
                            fontFamily: TYPOGRAPHY.FONT_FAMILY_PRINCIPAL,
                            fontWeight: TYPOGRAPHY.FONT_WEIGHT_SEMI_BOLD,
                            backgroundColor: currentScript === key ? COLORS.AZUL_PRINCIPAL : COLORS.AZUL_SECUNDARIO,
                            color: '#fff',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: isExecuting ? 'not-allowed' : 'pointer',
                            opacity: isExecuting && currentScript !== key ? 0.5 : 1,
                            transition: 'background-color 0.2s'
                        }}
                    >
                        {currentScript === key ? `▶ ${label}...` : label}
                    </button>
                ))}

                {isExecuting && (
                    <button
                        onClick={handleStop}
                        style={{
                            padding: '10px 16px',
                            fontSize: '14px',
                            fontFamily: TYPOGRAPHY.FONT_FAMILY_PRINCIPAL,
                            fontWeight: TYPOGRAPHY.FONT_WEIGHT_SEMI_BOLD,
                            backgroundColor: COLORS.ROJO,
                            color: '#fff',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer'
                        }}
                    >
                        Detener
                    </button>
                )}
            </div>
        </div>
    );
};

export default QuickActions;
