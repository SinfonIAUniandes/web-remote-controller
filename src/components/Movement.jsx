import React, { useState, useEffect, useCallback } from 'react';
import { useRos } from '../contexts/RosContext';
import { createService } from '../services/RosManager';
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
    const [activeKeys, setActiveKeys] = useState({});

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

    // Lógica cuando se PRESIONA una tecla (Mover e iluminar)
    const handleKeyDown = useCallback((event) => {
        const bannedHTMLElements = ["input", "textarea"];
        if (bannedHTMLElements.includes(event.target.localName)) return;

        const pressedKey = event.keyCode;
        
        // Si no es una tecla de movimiento, ignoramos
        if (!Object.values(KEYS).includes(pressedKey)) return;

        // Activamos visualmente la tecla
        setActiveKeys(prev => ({ ...prev, [pressedKey]: true }));

        const cmdVel = new ROSLIB.Topic({
            ros: ros,
            name: '/cmd_vel',
            messageType: 'geometry_msgs/Twist'
        });

        let message = {
            linear: { x: 0, y: 0, z: 0 },
            angular: { x: 0, y: 0, z: 0 }
        };

        if (pressedKey === KEYS.A) {
            message.linear.y = baseSpeed;
        } else if (pressedKey === KEYS.D) {
            message.linear.y = -baseSpeed;
        } else if (pressedKey === KEYS.W) {
            message.linear.x = baseSpeed;
        } else if (pressedKey === KEYS.S) {
            message.linear.x = -baseSpeed;
        }

        if (pressedKey === KEYS.E) {
            message.angular.z = -baseSpeed;
        } else if (pressedKey === KEYS.Q) {
            message.angular.z = baseSpeed;
        }

        const twist = new ROSLIB.Message(message);
        cmdVel.publish(twist);
    }, [ros, baseSpeed]);

    // Lógica cuando se SUELTA una tecla (Detener y apagar luz)
    const handleKeyUp = useCallback((event) => {
        const pressedKey = event.keyCode;
        
        if (!Object.values(KEYS).includes(pressedKey)) return;

        // Desactivamos visualmente la tecla
        setActiveKeys(prev => ({ ...prev, [pressedKey]: false }));

        // Publicamos Twist en 0 para detener el robot por seguridad
        const cmdVel = new ROSLIB.Topic({
            ros: ros,
            name: '/cmd_vel',
            messageType: 'geometry_msgs/Twist'
        });

        const stopMessage = new ROSLIB.Message({
            linear: { x: 0, y: 0, z: 0 },
            angular: { x: 0, y: 0, z: 0 }
        });
        
        cmdVel.publish(stopMessage);
    }, [ros]);

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
    const getKeyBackground = (keyCode) => {
        return activeKeys[keyCode] ? '#8F8AF9' : '#CFDDFC';
    };

    return (
        <div style={{width: '220px', height: '240px', position: 'relative', background: '#00214B', overflow: 'hidden', borderRadius: 20}}>
            <div style={{width: 180, height: 30, paddingLeft: 19, paddingRight: 19, left: 0, top: 25, position: 'absolute', background: '#CFDDFC', overflow: 'hidden', borderTopRightRadius: 25, borderBottomRightRadius: 25, justifyContent: 'center', alignItems: 'center', gap: 10, display: 'inline-flex'}}>
                <div style={{textAlign: 'center', justifyContent: 'center', display: 'flex', flexDirection: 'column', color: '#00214B', fontSize: 16, fontFamily: 'Nunito', fontWeight: '700', wordWrap: 'break-word'}}>Mover base</div>
            </div>
            
            <div style={{width: 160, left: 30, top: 88, position: 'absolute', justifyContent: 'space-between', alignItems: 'flex-end', display: 'inline-flex'}}>
                {/* Tecla Q */}
                <div style={{width: 45, height: 45, background: getKeyBackground(KEYS.Q), borderRadius: 15, flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 10, display: 'inline-flex', transition: 'background 0.1s ease'}}>
                    <div style={{alignSelf: 'stretch', textAlign: 'center', justifyContent: 'center', display: 'flex', flexDirection: 'column', color: '#00214B', fontSize: 20, fontFamily: 'Nunito', fontWeight: '900', wordWrap: 'break-word'}}>Q</div>
                </div>
                {/* Tecla W */}
                <div style={{width: 55, height: 55, background: getKeyBackground(KEYS.W), borderRadius: 15, flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 10, display: 'inline-flex', transition: 'background 0.1s ease'}}>
                    <div style={{alignSelf: 'stretch', textAlign: 'center', justifyContent: 'center', display: 'flex', flexDirection: 'column', color: '#00214B', fontSize: 24, fontFamily: 'Nunito', fontWeight: '900', wordWrap: 'break-word'}}>W</div>
                </div>
                {/* Tecla E */}
                <div style={{width: 45, height: 45, background: getKeyBackground(KEYS.E), borderRadius: 15, flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 10, display: 'inline-flex', transition: 'background 0.1s ease'}}>
                    <div style={{alignSelf: 'stretch', textAlign: 'center', justifyContent: 'center', display: 'flex', flexDirection: 'column', color: '#00214B', fontSize: 20, fontFamily: 'Nunito', fontWeight: '900', wordWrap: 'break-word'}}>E</div>
                </div>
            </div>

            <div style={{width: 180, left: 20, top: 149, position: 'absolute', justifyContent: 'space-between', alignItems: 'center', display: 'inline-flex'}}>
                {/* Tecla A */}
                <div style={{width: 55, height: 55, background: getKeyBackground(KEYS.A), borderRadius: 15, flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 10, display: 'inline-flex', transition: 'background 0.1s ease'}}>
                    <div style={{alignSelf: 'stretch', textAlign: 'center', justifyContent: 'center', display: 'flex', flexDirection: 'column', color: '#00214B', fontSize: 24, fontFamily: 'Nunito', fontWeight: '900', wordWrap: 'break-word'}}>A</div>
                </div>
                {/* Tecla S */}
                <div style={{width: 55, height: 55, background: getKeyBackground(KEYS.S), borderRadius: 15, flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 10, display: 'inline-flex', transition: 'background 0.1s ease'}}>
                    <div style={{alignSelf: 'stretch', textAlign: 'center', justifyContent: 'center', display: 'flex', flexDirection: 'column', color: '#00214B', fontSize: 24, fontFamily: 'Nunito', fontWeight: '900', wordWrap: 'break-word'}}>S</div>
                </div>
                {/* Tecla D */}
                <div style={{width: 55, height: 55, background: getKeyBackground(KEYS.D), borderRadius: 15, flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 10, display: 'inline-flex', transition: 'background 0.1s ease'}}>
                    <div style={{alignSelf: 'stretch', textAlign: 'center', justifyContent: 'center', display: 'flex', flexDirection: 'column', color: '#00214B', fontSize: 24, fontFamily: 'Nunito', fontWeight: '900', wordWrap: 'break-word'}}>D</div>
                </div>
            </div>
        </div>
    );
}

export default Movement;