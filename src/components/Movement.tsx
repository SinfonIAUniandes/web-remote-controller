import { useState, useEffect, useCallback } from 'react';
import { useRos } from '../contexts/RosContext';
import { createService } from '../services/RosManager';
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

const Movement = () => {
    const { ros, baseSpeed } = useRos();
    
    // Estado para controlar qué teclas están siendo presionadas visualmente
    const [activeKeys, setActiveKeys] = useState<Record<number, boolean>>({});

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

    const startMove = useCallback((keyCode: number) => {
        if (!ros) return;
        setActiveKeys(prev => ({ ...prev, [keyCode]: true }));

        const cmdVel = new ROSLIB.Topic({
            ros,
            name: '/cmd_vel',
            messageType: 'geometry_msgs/Twist'
        });

        const message = {
            linear: { x: 0, y: 0, z: 0 },
            angular: { x: 0, y: 0, z: 0 }
        };

        if (keyCode === KEYS.A) {
            message.linear.y = baseSpeed;
        } else if (keyCode === KEYS.D) {
            message.linear.y = -baseSpeed;
        } else if (keyCode === KEYS.W) {
            message.linear.x = baseSpeed;
        } else if (keyCode === KEYS.S) {
            message.linear.x = -baseSpeed;
        }

        if (keyCode === KEYS.E) {
            message.angular.z = -baseSpeed;
        } else if (keyCode === KEYS.Q) {
            message.angular.z = baseSpeed;
        }

        // const twist = new ROSLIB.Message(message);
        cmdVel.publish(message);
    }, [ros, baseSpeed]);

    const stopMove = useCallback((keyCode: number) => {
        if (!ros) return;
        // Desactivamos visualmente la tecla
        setActiveKeys(prev => ({ ...prev, [keyCode]: false }));

        // Publicamos Twist en 0 para detener el robot por seguridad
        const cmdVel = new ROSLIB.Topic({
            ros: ros,
            name: '/cmd_vel',
            messageType: 'geometry_msgs/Twist'
        });

        const stopMessage = {
            linear: { x: 0, y: 0, z: 0 },
            angular: { x: 0, y: 0, z: 0 }
        };
        cmdVel.publish(stopMessage);
    }, [ros]);

    const handleKeyDown = useCallback((event: KeyboardEvent) => {
        const target = event.target as HTMLElement | null;
        const isInput = ["input", "textarea", "select"].includes(target?.localName ?? '') || 
                        target?.isContentEditable === true;
        if (isInput || event.ctrlKey || event.altKey || event.metaKey) return;

        if (Object.values(KEYS).includes(event.keyCode)) {
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