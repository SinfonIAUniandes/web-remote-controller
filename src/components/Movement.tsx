import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRos } from '../contexts/RosContext';
import { createService } from '../services/RosManager';
import { usePanicListener } from '../services/panic';
import { COLORS } from '../theme';
import * as ROSLIB from 'roslib';

// Extraemos los keycodes fuera del componente para mejor rendimiento
const KEYS = {
    A: 65,
    D: 68,
    W: 87,
    S: 83,
    E: 69,
    Q: 81
};

// El toolkit detiene el robot si pasan 0.5 s sin /cmd_vel; 10 Hz es el ritmo que recomienda su documentación
const HOLD_INTERVAL_MS = 100;

// Combina todas las teclas presionadas en un solo Twist (p. ej. W + Q avanza girando)
const buildTwist = (keys: Set<number>, speed: number) => {
    const axis = (positive: number, negative: number) =>
        (keys.has(positive) ? speed : 0) - (keys.has(negative) ? speed : 0);
    return {
        linear: { x: axis(KEYS.W, KEYS.S), y: axis(KEYS.A, KEYS.D), z: 0 },
        angular: { x: 0, y: 0, z: axis(KEYS.Q, KEYS.E) },
    };
};

const Movement = () => {
    const { ros, baseSpeed } = useRos();
    
    // Estado para controlar qué teclas están siendo presionadas visualmente
    const [activeKeys, setActiveKeys] = useState<Record<number, boolean>>({});
    const panickedRef = useRef(false);
    const pressedRef = useRef<Set<number>>(new Set());
    const holdTimerRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
    // El timer lee la velocidad más reciente sin tener que reiniciarse cuando cambia el slider
    const baseSpeedRef = useRef(baseSpeed);
    baseSpeedRef.current = baseSpeed;

    // Un solo tópico por conexión, en vez de crear (y re-anunciar) uno por cada mensaje
    const cmdVel = useMemo(() => ros
        ? new ROSLIB.Topic({ ros, name: '/cmd_vel', messageType: 'geometry_msgs/Twist' })
        : null, [ros]);

    const stopHold = useCallback(() => {
        clearInterval(holdTimerRef.current);
        holdTimerRef.current = undefined;
    }, []);

    // El botón de pánico ya publica el Twist en 0: aquí solo cancelamos el reenvío y soltamos las teclas
    usePanicListener(() => {
        panickedRef.current = true;
        pressedRef.current.clear();
        stopHold();
        setActiveKeys({});
    });

    // Inicialización del servicio de navegación
    useEffect(() => {
        if (ros) {
            const enableNavigationService = createService(ros, '/robot_toolkit/navigation_tools_srv', 'robot_toolkit_msgs/navigation_tools_srv');
            const navRequest = {
                data: {
                    "command": "enable_all",
                    "depth_to_laser_parameters": {
                        "resolution": 0,
                        "scan_time": 0.0,
                        "range_min": 0.0,
                        "range_max": 0.0,
                        "scan_height": 0.0
                    },
                    "tf_enable": false,
                    "tf_frequency": 0.0,
                    "odom_enable": false,
                    "odom_frequency": 0.0,
                    "laser_enable": false,
                    "laser_frequency": 0.0,
                    "cmd_vel_enable": false,
                    "security_timer": 0.0,
                    "move_base_enable": false,
                    "goal_enable": false,
                    "robot_pose_suscriber_enable": false,
                    "path_enable": false,
                    "path_frequency": 0.0,
                    "robot_pose_publisher_enable": false,
                    "robot_pose_publisher_frequency": 0.0,
                    "result_enable": false,
                    "depth_to_laser_enable": false,
                    "free_zone_enable": false
                }
            };
            
            enableNavigationService.callService(navRequest, (result) => {
                console.log('Navigation tools service initialized:', result);
            }, (error) => {
                console.error('Error initializing navigation service:', error);
            });
        }
    }, [ros]);

    const publishTwist = useCallback(() => {
        cmdVel?.publish(buildTwist(pressedRef.current, baseSpeedRef.current));
    }, [cmdVel]);

    // Suelta todas las teclas y manda un Twist en 0
    const releaseAll = useCallback(() => {
        if (pressedRef.current.size === 0) return;
        pressedRef.current.clear();
        stopHold();
        setActiveKeys({});
        publishTwist();
    }, [publishTwist, stopHold]);

    const startMove = useCallback((keyCode: number) => {
        // Ignora las repeticiones del navegador: el reenvío lo hace el timer mientras la tecla siga presionada
        if (!cmdVel || pressedRef.current.has(keyCode)) return;
        pressedRef.current.add(keyCode);
        setActiveKeys(prev => ({ ...prev, [keyCode]: true }));

        publishTwist();
        // El toolkit detiene el robot si pasan 0.5 s sin /cmd_vel: reenviamos a 10 Hz mientras se mantenga presionado
        if (holdTimerRef.current === undefined) {
            holdTimerRef.current = setInterval(publishTwist, HOLD_INTERVAL_MS);
        }
    }, [cmdVel, publishTwist]);

    const stopMove = useCallback((keyCode: number) => {
        // pointerleave se dispara aunque la tecla no estuviera presionada
        if (!pressedRef.current.delete(keyCode)) return;
        setActiveKeys(prev => ({ ...prev, [keyCode]: false }));

        // Si quedan otras teclas presionadas se publica su combinación; si no, un Twist en 0
        publishTwist();
        if (pressedRef.current.size === 0) stopHold();
    }, [publishTwist, stopHold]);

    const handleKeyDown = useCallback((event: KeyboardEvent) => {
        const target = event.target as HTMLElement | null;
        const isInput = ["input", "textarea", "select"].includes(target?.localName ?? '') || 
                        target?.isContentEditable === true;
        if (isInput || event.ctrlKey || event.altKey || event.metaKey) return;

        if (Object.values(KEYS).includes(event.keyCode)) {
            // Tras un pánico, las repeticiones de una tecla que seguía presionada no deben reactivar el movimiento
            if (event.repeat) {
                if (panickedRef.current) return;
            } else {
                panickedRef.current = false;
            }
            startMove(event.keyCode);
        }
    }, [startMove]);

    const handleKeyUp = useCallback((event: KeyboardEvent) => {
        const target = event.target as HTMLElement | null;
        const isInput = ["input", "textarea", "select"].includes(target?.localName ?? '') || 
                        target?.isContentEditable === true;
        if (isInput) return;

        if (Object.values(KEYS).includes(event.keyCode)) {
            stopMove(event.keyCode);
        }
    }, [stopMove]);

    // Registro de los event listeners
    useEffect(() => {
        window.addEventListener("keydown", handleKeyDown, false);
        window.addEventListener("keyup", handleKeyUp, false);

        return () => {
            window.removeEventListener("keydown", handleKeyDown, false);
            window.removeEventListener("keyup", handleKeyUp, false);
        };
    }, [handleKeyDown, handleKeyUp]);

    // Si la ventana pierde el foco o se oculta no llegará el keyup/pointerup: soltamos todo para que el robot no siga avanzando
    useEffect(() => {
        const onHidden = () => { if (document.hidden) releaseAll(); };
        window.addEventListener("blur", releaseAll);
        document.addEventListener("visibilitychange", onHidden);
        return () => {
            window.removeEventListener("blur", releaseAll);
            document.removeEventListener("visibilitychange", onHidden);
        };
    }, [releaseAll]);

    // Si cambia la conexión o se desmonta el componente, el timer no debe seguir publicando sobre un tópico viejo
    useEffect(() => () => {
        stopHold();
        pressedRef.current.clear();
    }, [cmdVel, stopHold]);

    // Función auxiliar para obtener el color dinámico dependiendo del estado de la tecla
    const getKeyBackground = (keyCode: number) => {
        return activeKeys[keyCode] ? COLORS.AZUL_SECUNDARIO : COLORS.CELESTE_PRINCIPAL;
    };

    // return (
    //     <div
    //         className="relative h-[240px] w-full overflow-hidden rounded-[20px]"
    //         style={{ background: COLORS.AZUL_PRINCIPAL }}
    //     >
    //         <div
    //             className="absolute left-0 top-[25px] flex h-[30px] w-[180px] items-center justify-center overflow-hidden rounded-br-[25px] rounded-tr-[25px] px-[19px]"
    //             style={{ background: COLORS.CELESTE_PRINCIPAL }}
    //         >
    //             <div
    //                 className="flex flex-col justify-center text-center font-['Nunito'] text-base font-bold"
    //                 style={{ color: COLORS.AZUL_PRINCIPAL }}
    //             >
    //                 Mover base
    //             </div>
    //         </div>
            
    //         <div className="absolute left-[30px] top-[88px] flex w-[160px] items-end justify-between">
    //             {/* Tecla Q */}
    //             <div 
    //                 onPointerDown={() => startMove(KEYS.Q)}
    //                 onPointerUp={() => stopMove(KEYS.Q)}
    //                 onPointerLeave={() => stopMove(KEYS.Q)}
    //                 className="flex h-[45px] w-[45px] cursor-pointer touch-none flex-col items-center justify-center gap-2.5 rounded-[15px] transition-colors duration-100"
    //                 style={{ background: getKeyBackground(KEYS.Q) }}
    //             >
    //                 <div className="flex flex-col justify-center self-stretch text-center font-['Nunito'] text-xl font-black text-[#00214B]">Q</div>
    //             </div>
    //             {/* Tecla W */}
    //             <div 
    //                 onPointerDown={() => startMove(KEYS.W)}
    //                 onPointerUp={() => stopMove(KEYS.W)}
    //                 onPointerLeave={() => stopMove(KEYS.W)}
    //                 className="flex h-[55px] w-[55px] cursor-pointer touch-none flex-col items-center justify-center gap-2.5 rounded-[15px] transition-colors duration-100"
    //                 style={{ background: getKeyBackground(KEYS.W) }}
    //             >
    //                 <div className="flex flex-col justify-center self-stretch text-center font-['Nunito'] text-2xl font-black text-[#00214B]">W</div>
    //             </div>
    //             {/* Tecla E */}
    //             <div 
    //                 onPointerDown={() => startMove(KEYS.E)}
    //                 onPointerUp={() => stopMove(KEYS.E)}
    //                 onPointerLeave={() => stopMove(KEYS.E)}
    //                 className="flex h-[45px] w-[45px] cursor-pointer touch-none flex-col items-center justify-center gap-2.5 rounded-[15px] transition-colors duration-100"
    //                 style={{ background: getKeyBackground(KEYS.E) }}
    //             >
    //                 <div className="flex flex-col justify-center self-stretch text-center font-['Nunito'] text-xl font-black text-[#00214B]">E</div>
    //             </div>
    //         </div>

    //         <div className="absolute left-[20px] top-[149px] flex w-[180px] items-center justify-between">
    //             {/* Tecla A */}
    //             <div 
    //                 onPointerDown={() => startMove(KEYS.A)}
    //                 onPointerUp={() => stopMove(KEYS.A)}
    //                 onPointerLeave={() => stopMove(KEYS.A)}
    //                 className="flex h-[55px] w-[55px] cursor-pointer touch-none flex-col items-center justify-center gap-2.5 rounded-[15px] transition-colors duration-100"
    //                 style={{ background: getKeyBackground(KEYS.A) }}
    //             >
    //                 <div className="flex flex-col justify-center self-stretch text-center font-['Nunito'] text-2xl font-black text-[#00214B]">A</div>
    //             </div>
    //             {/* Tecla S */}
    //             <div 
    //                 onPointerDown={() => startMove(KEYS.S)}
    //                 onPointerUp={() => stopMove(KEYS.S)}
    //                 onPointerLeave={() => stopMove(KEYS.S)}
    //                 className="flex h-[55px] w-[55px] cursor-pointer touch-none flex-col items-center justify-center gap-2.5 rounded-[15px] transition-colors duration-100"
    //                 style={{ background: getKeyBackground(KEYS.S) }}
    //             >
    //                 <div className="flex flex-col justify-center self-stretch text-center font-['Nunito'] text-2xl font-black text-[#00214B]">S</div>
    //             </div>
    //             {/* Tecla D */}
    //             <div 
    //                 onPointerDown={() => startMove(KEYS.D)}
    //                 onPointerUp={() => stopMove(KEYS.D)}
    //                 onPointerLeave={() => stopMove(KEYS.D)}
    //                 className="flex h-[55px] w-[55px] cursor-pointer touch-none flex-col items-center justify-center gap-2.5 rounded-[15px] transition-colors duration-100"
    //                 style={{ background: getKeyBackground(KEYS.D) }}
    //             >
    //                 <div className="flex flex-col justify-center self-stretch text-center font-['Nunito'] text-2xl font-black text-[#00214B]">D</div>
    //             </div>
    //         </div>
    //     </div>
    // );

    return (
        <div
            className="relative h-[240px] w-full overflow-hidden rounded-[20px]"
            style={{ background: COLORS.AZUL_PRINCIPAL }}
        >
            <div
                className="mt-[25px] flex h-[30px] w-[180px] items-center justify-center overflow-hidden rounded-br-[25px] rounded-tr-[25px] px-[19px]"
                style={{ background: COLORS.CELESTE_PRINCIPAL }}
            >
                <div
                    className="flex flex-col justify-center text-center font-['Nunito'] text-base font-bold"
                    style={{ color: COLORS.AZUL_PRINCIPAL }}
                >
                    Mover base
                </div>
            </div>

            <div className='flex flex-col w-full items-center justify-center'>

            <div className="ml-[10px] mt-[33px] flex w-[160px] items-end justify-between">
                {/* Tecla Q */}
                <div 
                    onPointerDown={() => startMove(KEYS.Q)}
                    onPointerUp={() => stopMove(KEYS.Q)}
                    onPointerLeave={() => stopMove(KEYS.Q)}
                    onPointerCancel={() => stopMove(KEYS.Q)}
                    className="flex h-[45px] w-[45px] cursor-pointer touch-none select-none flex-col items-center justify-center gap-2.5 rounded-[15px] transition-colors duration-100"
                    style={{ background: getKeyBackground(KEYS.Q) }}
                >
                    <div className="flex flex-col justify-center self-stretch text-center font-['Nunito'] text-xl font-black text-[#00214B]">Q</div>
                </div>
                {/* Tecla W */}
                <div 
                    onPointerDown={() => startMove(KEYS.W)}
                    onPointerUp={() => stopMove(KEYS.W)}
                    onPointerLeave={() => stopMove(KEYS.W)}
                    onPointerCancel={() => stopMove(KEYS.W)}
                    className="flex h-[55px] w-[55px] cursor-pointer touch-none select-none flex-col items-center justify-center gap-2.5 rounded-[15px] transition-colors duration-100"
                    style={{ background: getKeyBackground(KEYS.W) }}
                >
                    <div className="flex flex-col justify-center self-stretch text-center font-['Nunito'] text-2xl font-black text-[#00214B]">W</div>
                </div>
                {/* Tecla E */}
                <div 
                    onPointerDown={() => startMove(KEYS.E)}
                    onPointerUp={() => stopMove(KEYS.E)}
                    onPointerLeave={() => stopMove(KEYS.E)}
                    onPointerCancel={() => stopMove(KEYS.E)}
                    className="flex h-[45px] w-[45px] cursor-pointer touch-none select-none flex-col items-center justify-center gap-2.5 rounded-[15px] transition-colors duration-100"
                    style={{ background: getKeyBackground(KEYS.E) }}
                >
                    <div className="flex flex-col justify-center self-stretch text-center font-['Nunito'] text-xl font-black text-[#00214B]">E</div>
                </div>
            </div>

            <div className="ml-[0px] mt-[6px] flex w-[180px] items-center justify-between">
                {/* Tecla A */}
                <div 
                    onPointerDown={() => startMove(KEYS.A)}
                    onPointerUp={() => stopMove(KEYS.A)}
                    onPointerLeave={() => stopMove(KEYS.A)}
                    onPointerCancel={() => stopMove(KEYS.A)}
                    className="flex h-[55px] w-[55px] cursor-pointer touch-none select-none flex-col items-center justify-center gap-2.5 rounded-[15px] transition-colors duration-100"
                    style={{ background: getKeyBackground(KEYS.A) }}
                >
                    <div className="flex flex-col justify-center self-stretch text-center font-['Nunito'] text-2xl font-black text-[#00214B]">A</div>
                </div>
                {/* Tecla S */}
                <div 
                    onPointerDown={() => startMove(KEYS.S)}
                    onPointerUp={() => stopMove(KEYS.S)}
                    onPointerLeave={() => stopMove(KEYS.S)}
                    onPointerCancel={() => stopMove(KEYS.S)}
                    className="flex h-[55px] w-[55px] cursor-pointer touch-none select-none flex-col items-center justify-center gap-2.5 rounded-[15px] transition-colors duration-100"
                    style={{ background: getKeyBackground(KEYS.S) }}
                >
                    <div className="flex flex-col justify-center self-stretch text-center font-['Nunito'] text-2xl font-black text-[#00214B]">S</div>
                </div>
                {/* Tecla D */}
                <div 
                    onPointerDown={() => startMove(KEYS.D)}
                    onPointerUp={() => stopMove(KEYS.D)}
                    onPointerLeave={() => stopMove(KEYS.D)}
                    onPointerCancel={() => stopMove(KEYS.D)}
                    className="flex h-[55px] w-[55px] cursor-pointer touch-none select-none flex-col items-center justify-center gap-2.5 rounded-[15px] transition-colors duration-100"
                    style={{ background: getKeyBackground(KEYS.D) }}
                >
                    <div className="flex flex-col justify-center self-stretch text-center font-['Nunito'] text-2xl font-black text-[#00214B]">D</div>
                </div>
            </div>
            </div>
            
        </div>
    );
}

export default Movement;