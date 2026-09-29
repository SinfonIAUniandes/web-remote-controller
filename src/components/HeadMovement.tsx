import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRos } from '../contexts/RosContext';
import { createTopic, createService } from '../services/RosManager';
import * as ROSLIB from 'roslib';
import { COLORS } from '../theme';

type keys = {
    I: number,
    J: number,
    K: number,
    L: number
}

// Extraemos los keycodes para el mapeo visual
const KEYS: keys = {
    I: 73,
    J: 74,
    K: 75,
    L: 76
};

const HeadMovement = () => {
    const { ros } = useRos();

    // Estado para controlar qué teclas están siendo presionadas visualmente
    const [activeKeys, setActiveKeys] = useState<Record<number, boolean>>({});

    // Usamos refs para mantener los valores actualizados sin causar re-renders excesivos en el eventListener
    const pitchRef = useRef(0);
    const yawRef = useRef(0);

    const speed = 0.1;
    const STEP = 0.05;
    const MAX = 1.57;  // 90 grados en radianes

    // Inicialización del servicio de motion tools
    useEffect(() => {
        if (ros) {
            const motionService = createService(
                ros,
                '/robot_toolkit/motion_tools_srv',
                'robot_toolkit_msgs/motion_tools_srv'
            );

            const request = { data: { command: "enable_all" } };

            motionService.callService(request,
                (result) => console.log('Motion tools service ready:', result),
                (error) => console.error('Error al activar motion tools:', error)
            );
        }
    }, [ros]);


    const clamp = (value: number) => Math.max(-MAX, Math.min(MAX, value));

    const moveHead = useCallback((key: string) => {
        const char = key.toLowerCase();
        if (!['i', 'j', 'k', 'l'].includes(char)) return;

        // Activamos visualmente la tecla (usando el mapeo de KEYS para el estado)
        const code = KEYS[char.toUpperCase() as keyof keys];
        setActiveKeys(prev => ({ ...prev, [code]: true }));

        let newPitch = pitchRef.current;
        let newYaw = yawRef.current;

        switch (char) {
            case 'i': newPitch = clamp(pitchRef.current - STEP); break;
            case 'k': newPitch = clamp(pitchRef.current + STEP); break;
            case 'j': newYaw = clamp(yawRef.current + STEP); break;
            case 'l': newYaw = clamp(yawRef.current - STEP); break;
            default: return;
        }

        pitchRef.current = newPitch;
        yawRef.current = newYaw;

        if (ros) {
            const headTopic = createTopic(ros, '/set_angles', 'robot_toolkit_msgs/set_angles_msg');
            headTopic.publish({
                names: ["HeadPitch", "HeadYaw"],
                angles: [newPitch, newYaw],
                fraction_max_speed: [speed, speed]
            });
        }
    }, [ros]);

    const stopHead = useCallback((key: string) => {
        const code = KEYS[key.toUpperCase() as keyof keys];
        setActiveKeys(prev => ({ ...prev, [code]: false }));
    }, []);

    // Lógica cuando se PRESIONA una tecla (Mover cabeza e iluminar)
    const handleKeyDown = useCallback((event: KeyboardEvent) => {
        const target = event.target as HTMLElement;
        const isInput = ["input", "textarea", "select"].includes(target.localName) ||
            target.isContentEditable;
        if (isInput || event.ctrlKey || event.altKey || event.metaKey) return;

        moveHead(event.key);
    }, [moveHead]);

    // Lógica cuando se SUELTA una tecla (Apagar luz)
    const handleKeyUp = useCallback((event: KeyboardEvent) => {
        const target = event.target as HTMLElement;
        const isInput = ["input", "textarea", "select"].includes(target.localName) ||
            target.isContentEditable;
        if (isInput) return;

        stopHead(event.key);
    }, [stopHead]);

    // Registro de los event listeners
    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown, false);
        window.addEventListener('keyup', handleKeyUp, false);

        return () => {
            window.removeEventListener('keydown', handleKeyDown, false);
            window.removeEventListener('keyup', handleKeyUp, false);
        };
    }, [handleKeyDown, handleKeyUp]);

    // Función auxiliar para obtener el color dinámico dependiendo del estado de la tecla
    const getKeyBackground = (keyCode: number) => {
        return activeKeys[keyCode] ? COLORS.AZUL_SECUNDARIO : COLORS.CELESTE_PRINCIPAL;
    };

    return (
        <div
            // className="relative h-[240px] w-full max-w-[220px] overflow-hidden rounded-[20px]"
            className="relative h-[240px]  w-full overflow-hidden rounded-[20px]"
            style={{ background: COLORS.AZUL_PRINCIPAL }}
        >
            {/* Título */}
            <div
                className="mt-[25px] inline-flex h-[30px] w-[min(180px,90%)] items-center justify-center gap-2.5 overflow-hidden rounded-r-[25px] px-[19px]"
                style={{ background: COLORS.CELESTE_PRINCIPAL }}
            >
                <div
                    className="flex flex-col justify-center text-center font-['Nunito'] text-base font-bold"
                    style={{ color: COLORS.AZUL_PRINCIPAL }}
                >
                    Mover cabeza
                </div>
            </div>


            <div className='flex justify-center w-full'>

                <div className='flex flex-col w-full max-w-[220px]'>

                    {/* Fila superior (Solo la tecla I centrada) */}
                    {/* <div className="absolute left-1/2 top-[88px] inline-flex w-[calc(100%_-_40px)] -translate-x-1/2 items-center justify-center"> */}
                    <div className="relative left-1/2 mt-[33px] inline-flex w-[calc(100%_-_40px)] -translate-x-1/2 items-center justify-center">
                        {/* Tecla I */}
                        <div
                            onPointerDown={() => moveHead('i')}
                            onPointerUp={() => stopHead('i')}
                            onPointerLeave={() => stopHead('i')}
                            className="inline-flex h-[clamp(30px,25vw,55px)] w-[clamp(30px,25vw,55px)] cursor-pointer touch-none flex-col items-center justify-center gap-2.5 rounded-[15px] transition-colors duration-100"
                            style={{ background: getKeyBackground(KEYS.I) }}
                        >
                            <div
                                className="flex flex-col justify-center self-stretch text-center font-['Nunito'] text-2xl font-black"
                                style={{ color: COLORS.AZUL_PRINCIPAL }}
                            >
                                I
                            </div>
                        </div>
                    </div>

                    {/* Fila inferior (Teclas J, K, L) */}
                    <div className="relative left-1/2 mt-[6px] inline-flex w-[calc(100%_-_40px)] -translate-x-1/2 items-center justify-between">
                        {/* Tecla J */}
                        <div
                            onPointerDown={() => moveHead('j')}
                            onPointerUp={() => stopHead('j')}
                            onPointerLeave={() => stopHead('j')}
                            className="inline-flex h-[clamp(30px,25vw,55px)] w-[clamp(30px,25vw,55px)] cursor-pointer touch-none flex-col items-center justify-center gap-2.5 rounded-[15px] transition-colors duration-100"
                            style={{ background: getKeyBackground(KEYS.J) }}
                        >
                            <div
                                className="flex flex-col justify-center self-stretch text-center font-['Nunito'] text-2xl font-black"
                                style={{ color: COLORS.AZUL_PRINCIPAL }}
                            >
                                J
                            </div>
                        </div>
                        {/* Tecla K */}
                        <div
                            onPointerDown={() => moveHead('k')}
                            onPointerUp={() => stopHead('k')}
                            onPointerLeave={() => stopHead('k')}
                            className="inline-flex h-[clamp(30px,25vw,55px)] w-[clamp(30px,25vw,55px)] cursor-pointer touch-none flex-col items-center justify-center gap-2.5 rounded-[15px] transition-colors duration-100"
                            style={{ background: getKeyBackground(KEYS.K) }}
                        >
                            <div
                                className="flex flex-col justify-center self-stretch text-center font-['Nunito'] text-2xl font-black"
                                style={{ color: COLORS.AZUL_PRINCIPAL }}
                            >
                                K
                            </div>
                        </div>
                        {/* Tecla L */}
                        <div
                            onPointerDown={() => moveHead('l')}
                            onPointerUp={() => stopHead('l')}
                            onPointerLeave={() => stopHead('l')}
                            className="inline-flex h-[clamp(30px,25vw,55px)] w-[clamp(30px,25vw,55px)] cursor-pointer touch-none flex-col items-center justify-center gap-2.5 rounded-[15px] transition-colors duration-100"
                            style={{ background: getKeyBackground(KEYS.L) }}
                        >
                            <div
                                className="flex flex-col justify-center self-stretch text-center font-['Nunito'] text-2xl font-black"
                                style={{ color: COLORS.AZUL_PRINCIPAL }}
                            >
                                L
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default HeadMovement;