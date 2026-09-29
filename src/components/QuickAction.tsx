import React, { useRef, useState, useEffect } from 'react';
import { useRos } from '../contexts/RosContext';
import { executeScript } from '../services/scriptExecutor';
import { COLORS } from '../theme';

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

// Variables CSS alimentadas desde COLORS para usarlas en clases de Tailwind
const themeVars = {
    '--azul': COLORS.AZUL_PRINCIPAL,
    '--celeste': COLORS.CELESTE_PRINCIPAL,
    '--azul-sec': COLORS.AZUL_SECUNDARIO,
    '--rojo': COLORS.ROJO,
} as React.CSSProperties;

const QuickAction = () => {
    const { ros } = useRos();
    const [isExecuting, setIsExecuting] = useState(false);
    const [currentScript, setCurrentScript] = useState('');

    const abortRef = useRef<AbortController | null>(null);

    // Limpieza automática si el componente se desmonta durante la ejecución
    useEffect(() => {
        return () => {
            abortRef.current?.abort();
        };
    }, []);

    const handleRun = async (key: keyof typeof quickScripts) => {
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
            if (!(error instanceof Error) || error.name !== 'AbortError') {
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

    const buttons: { key: keyof typeof quickScripts; label: string }[] = [
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
            style={themeVars}
            className="relative min-h-[145px] w-full max-w-[1008px] overflow-hidden rounded-[20px] bg-[var(--azul)] pb-[33px]"
        >
            {/* Etiqueta título */}
            <div className="absolute left-0 top-[21px] flex h-[30px] w-[min(180px,90%)] items-center justify-center gap-2.5 overflow-hidden rounded-r-[25px] bg-[var(--celeste)] px-[19px]">
                <div className="flex flex-col justify-center break-words text-center font-['Nunito'] text-base font-bold text-[var(--azul)]">
                    Acciones rápidas
                </div>
            </div>

            {/* Contenedor de botones */}
            <div className="mt-[72px] box-border flex flex-wrap items-center justify-center gap-x-[17px] gap-y-2.5 px-5">
                {buttons.map(({ key, label }) => (
                    <div
                        key={key}
                        onClick={() => handleRun(key)}
                        className={`relative h-10 w-[180px] rounded-[10px] transition-all duration-200 ease-[ease] ${
                            currentScript === key ? 'bg-[var(--azul-sec)]' : 'bg-[var(--celeste)]'
                        } ${
                            isExecuting ? 'cursor-not-allowed' : 'cursor-pointer hover:bg-[var(--azul-sec)]'
                        } ${
                            isExecuting && currentScript !== key ? 'opacity-50' : 'opacity-100'
                        }`}
                    >
                        <div className="absolute -left-0.5 -top-2.5 flex h-[60px] w-[184px] flex-col justify-center break-words text-center font-['Nunito'] text-base font-bold text-[var(--azul)]">
                            {currentScript === key ? `▶ ${label}` : label.toUpperCase()}
                        </div>
                    </div>
                ))}
            </div>

            {/* Botón detener superpuesto o al final si hay ejecución */}
            {isExecuting && (
                <div
                    onClick={handleStop}
                    className="absolute right-5 top-[21px] z-[5] flex h-[30px] w-[120px] cursor-pointer items-center justify-center rounded-[10px] bg-[var(--rojo)] transition-all duration-200 ease-[ease] hover:bg-[#b3154d]"
                >
                    <div className="font-['Nunito'] text-sm font-bold text-white">
                        DETENER
                    </div>
                </div>
            )}
        </div>
    );
};

export default QuickAction;