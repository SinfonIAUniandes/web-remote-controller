import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRos } from '../contexts/RosContext';
import { createTopic, createService } from '../services/RosManager';
import { usePanicListener } from '../services/panic';
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

// Límites reales de las articulaciones (share/urdf/pepper.urdf, ver context/ROBOT_TOOLKIT_API.md §6)
const PITCH_LIMITS = { min: -0.7069, max: 0.6370 };
const YAW_LIMITS = { min: -2.0857, max: 2.0857 };

const SPEED = 0.1;
const STEP = 0.05;
// Mismo ritmo que Movement: reenvío mientras la tecla siga presionada
const HOLD_INTERVAL_MS = 100;

const clamp = (value: number, { min, max }: { min: number; max: number }) => Math.max(min, Math.min(max, value));

const HEAD_KEYS = ['i', 'j', 'k', 'l'];

const HeadMovement = () => {
    const { ros } = useRos();

    // Estado para controlar qué teclas están siendo presionadas visualmente
    const [activeKeys, setActiveKeys] = useState<Record<number, boolean>>({});

    // Usamos refs para mantener los valores actualizados sin causar re-renders excesivos en el eventListener
    const pitchRef = useRef(0);
    const yawRef = useRef(0);
    const panickedRef = useRef(false);
    const pressedRef = useRef<Set<string>>(new Set());
    const holdTimerRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

    const headTopic = useMemo(
        () => ros ? createTopic(ros, '/set_angles', 'robot_toolkit_msgs/set_angles_msg') : null,
        [ros]
    );

    const stopHold = useCallback(() => {
        clearInterval(holdTimerRef.current);
        holdTimerRef.current = undefined;
    }, []);

    // El botón de pánico centra la cabeza: reiniciamos el estado interno para que el siguiente movimiento parta de 0
    usePanicListener(() => {
        panickedRef.current = true;
        pitchRef.current = 0;
        yawRef.current = 0;
        pressedRef.current.clear();
        stopHold();
        setActiveKeys({});
    });

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

    // Aplica un paso por cada tecla presionada y publica el nuevo objetivo
    const applyStep = useCallback(() => {
        if (!headTopic) return;

        let dPitch = 0;
        let dYaw = 0;
        pressedRef.current.forEach(char => {
            if (char === 'i') dPitch -= STEP;
            else if (char === 'k') dPitch += STEP;
            else if (char === 'j') dYaw += STEP;
            else if (char === 'l') dYaw -= STEP;
        });

        const newPitch = clamp(pitchRef.current + dPitch, PITCH_LIMITS);
        const newYaw = clamp(yawRef.current + dYaw, YAW_LIMITS);

        // Ya estamos en el límite: no hay nada nuevo que enviar
        if (newPitch === pitchRef.current && newYaw === yawRef.current) return;

        pitchRef.current = newPitch;
        yawRef.current = newYaw;

        headTopic.publish({
            names: ["HeadPitch", "HeadYaw"],
            angles: [newPitch, newYaw],
            fraction_max_speed: [SPEED, SPEED]
        });
    }, [headTopic]);

    const moveHead = useCallback((key: string) => {
        const char = key.toLowerCase();
        // Ignora teclas ajenas y las repeticiones del navegador: el reenvío lo hace el timer
        if (!HEAD_KEYS.includes(char) || pressedRef.current.has(char)) return;

        // Activamos visualmente la tecla (usando el mapeo de KEYS para el estado)
        const code = KEYS[char.toUpperCase() as keyof keys];
        setActiveKeys(prev => ({ ...prev, [code]: true }));

        pressedRef.current.add(char);
        applyStep();
        if (holdTimerRef.current === undefined) {
            holdTimerRef.current = setInterval(applyStep, HOLD_INTERVAL_MS);
        }
    }, [applyStep]);

    const stopHead = useCallback((key: string) => {
        const char = key.toLowerCase();
        // pointerleave se dispara aunque la tecla no estuviera presionada
        if (!pressedRef.current.delete(char)) return;

        const code = KEYS[char.toUpperCase() as keyof keys];
        setActiveKeys(prev => ({ ...prev, [code]: false }));
        if (pressedRef.current.size === 0) stopHold();
    }, [stopHold]);

    const releaseAll = useCallback(() => {
        if (pressedRef.current.size === 0) return;
        pressedRef.current.clear();
        stopHold();
        setActiveKeys({});
    }, [stopHold]);

    // Lógica cuando se PRESIONA una tecla (Mover cabeza e iluminar)
    const handleKeyDown = useCallback((event: KeyboardEvent) => {
        const target = event.target as HTMLElement;
        const isInput = ["input", "textarea", "select"].includes(target.localName) ||
            target.isContentEditable;
        if (isInput || event.ctrlKey || event.altKey || event.metaKey) return;

        // Tras un pánico, las repeticiones de una tecla que seguía presionada no deben mover la cabeza
        if (event.repeat) {
            if (panickedRef.current) return;
        } else {
            panickedRef.current = false;
        }

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
        const onHidden = () => { if (document.hidden) releaseAll(); };

        window.addEventListener('keydown', handleKeyDown, false);
        window.addEventListener('keyup', handleKeyUp, false);
        // Si la ventana pierde el foco no llegará el keyup: soltamos todo para que la cabeza no siga moviéndose
        window.addEventListener('blur', releaseAll);
        document.addEventListener('visibilitychange', onHidden);

        return () => {
            window.removeEventListener('keydown', handleKeyDown, false);
            window.removeEventListener('keyup', handleKeyUp, false);
            window.removeEventListener('blur', releaseAll);
            document.removeEventListener('visibilitychange', onHidden);
        };
    }, [handleKeyDown, handleKeyUp, releaseAll]);

    // Si cambia la conexión o se desmonta el componente, el timer no debe seguir publicando sobre un tópico viejo
    useEffect(() => () => {
        stopHold();
        pressedRef.current.clear();
    }, [headTopic, stopHold]);

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
                            onPointerCancel={() => stopHead('i')}
                            className="inline-flex h-[clamp(30px,25vw,55px)] w-[clamp(30px,25vw,55px)] cursor-pointer touch-none select-none flex-col items-center justify-center gap-2.5 rounded-[15px] transition-colors duration-100"
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
                            onPointerCancel={() => stopHead('j')}
                            className="inline-flex h-[clamp(30px,25vw,55px)] w-[clamp(30px,25vw,55px)] cursor-pointer touch-none select-none flex-col items-center justify-center gap-2.5 rounded-[15px] transition-colors duration-100"
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
                            onPointerCancel={() => stopHead('k')}
                            className="inline-flex h-[clamp(30px,25vw,55px)] w-[clamp(30px,25vw,55px)] cursor-pointer touch-none select-none flex-col items-center justify-center gap-2.5 rounded-[15px] transition-colors duration-100"
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
                            onPointerCancel={() => stopHead('l')}
                            className="inline-flex h-[clamp(30px,25vw,55px)] w-[clamp(30px,25vw,55px)] cursor-pointer touch-none select-none flex-col items-center justify-center gap-2.5 rounded-[15px] transition-colors duration-100"
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
