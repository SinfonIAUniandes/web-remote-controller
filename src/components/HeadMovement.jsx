import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRos } from '../contexts/RosContext';
import { createTopic, createService } from '../services/RosManager';
import * as ROSLIB from 'roslib';

// Extraemos los keycodes para el mapeo visual
const KEYS = {
    I: 73,
    J: 74,
    K: 75,
    L: 76
};

const HeadMovement = () => {
    const { ros } = useRos();
    
    // Estado para controlar qué teclas están siendo presionadas visualmente
    const [activeKeys, setActiveKeys] = useState({});

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
    

    const clamp = (value) => Math.max(-MAX, Math.min(MAX, value));
    
    const moveHead = useCallback((key) => {
        const char = key.toLowerCase();
        if (!['i', 'j', 'k', 'l'].includes(char)) return;

        // Activamos visualmente la tecla (usando el mapeo de KEYS para el estado)
        const code = KEYS[char.toUpperCase()];
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
            headTopic.publish(new ROSLIB.Message({
                names: ["HeadPitch", "HeadYaw"],
                angles: [newPitch, newYaw],
                fraction_max_speed: [speed, speed]
            }));
        }
    }, [ros]);

    const stopHead = useCallback((key) => {
        const code = KEYS[key.toUpperCase()];
        setActiveKeys(prev => ({ ...prev, [code]: false }));
    }, []);

    // Lógica cuando se PRESIONA una tecla (Mover cabeza e iluminar)
    const handleKeyDown = useCallback((event) => {
        if (["input", "textarea"].includes(event.target.localName)) return;
        moveHead(event.key);
    }, [moveHead]);

    // Lógica cuando se SUELTA una tecla (Apagar luz)
    const handleKeyUp = useCallback((event) => {
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
    const getKeyBackground = (keyCode) => {
        return activeKeys[keyCode] ? '#8F8AF9' : '#CFDDFC';
    };

    return (
        <div style={{width: '220px', height: '240px', position: 'relative', background: '#00214B', overflow: 'hidden', borderRadius: 20}}>
            {/* Título */}
            <div style={{width: 180, height: 30, paddingLeft: 19, paddingRight: 19, left: 0, top: 25, position: 'absolute', background: '#CFDDFC', overflow: 'hidden', borderTopRightRadius: 25, borderBottomRightRadius: 25, justifyContent: 'center', alignItems: 'center', gap: 10, display: 'inline-flex'}}>
                <div style={{textAlign: 'center', justifyContent: 'center', display: 'flex', flexDirection: 'column', color: '#00214B', fontSize: 16, fontFamily: 'Nunito', fontWeight: '700', wordWrap: 'break-word'}}>Mover cabeza</div>
            </div>
            
            {/* Fila superior (Solo la tecla I centrada) */}
            <div style={{width: 180, left: 20, top: 88, position: 'absolute', justifyContent: 'center', alignItems: 'center', display: 'inline-flex'}}>
                {/* Tecla I */}
                <div 
                    onPointerDown={() => moveHead('i')}
                    onPointerUp={() => stopHead('i')}
                    onPointerLeave={() => stopHead('i')}
                    style={{width: 55, height: 55, background: getKeyBackground(KEYS.I), borderRadius: 15, flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 10, display: 'inline-flex', transition: 'background 0.1s ease', cursor: 'pointer', touchAction: 'none'}}
                >
                    <div style={{alignSelf: 'stretch', textAlign: 'center', justifyContent: 'center', display: 'flex', flexDirection: 'column', color: '#00214B', fontSize: 24, fontFamily: 'Nunito', fontWeight: '900', wordWrap: 'break-word'}}>I</div>
                </div>
            </div>

            {/* Fila inferior (Teclas J, K, L) */}
            <div style={{width: 180, left: 20, top: 149, position: 'absolute', justifyContent: 'space-between', alignItems: 'center', display: 'inline-flex'}}>
                {/* Tecla J */}
                <div 
                    onPointerDown={() => moveHead('j')}
                    onPointerUp={() => stopHead('j')}
                    onPointerLeave={() => stopHead('j')}
                    style={{width: 55, height: 55, background: getKeyBackground(KEYS.J), borderRadius: 15, flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 10, display: 'inline-flex', transition: 'background 0.1s ease', cursor: 'pointer', touchAction: 'none'}}
                >
                    <div style={{alignSelf: 'stretch', textAlign: 'center', justifyContent: 'center', display: 'flex', flexDirection: 'column', color: '#00214B', fontSize: 24, fontFamily: 'Nunito', fontWeight: '900', wordWrap: 'break-word'}}>J</div>
                </div>
                {/* Tecla K */}
                <div 
                    onPointerDown={() => moveHead('k')}
                    onPointerUp={() => stopHead('k')}
                    onPointerLeave={() => stopHead('k')}
                    style={{width: 55, height: 55, background: getKeyBackground(KEYS.K), borderRadius: 15, flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 10, display: 'inline-flex', transition: 'background 0.1s ease', cursor: 'pointer', touchAction: 'none'}}
                >
                    <div style={{alignSelf: 'stretch', textAlign: 'center', justifyContent: 'center', display: 'flex', flexDirection: 'column', color: '#00214B', fontSize: 24, fontFamily: 'Nunito', fontWeight: '900', wordWrap: 'break-word'}}>K</div>
                </div>
                {/* Tecla L */}
                <div 
                    onPointerDown={() => moveHead('l')}
                    onPointerUp={() => stopHead('l')}
                    onPointerLeave={() => stopHead('l')}
                    style={{width: 55, height: 55, background: getKeyBackground(KEYS.L), borderRadius: 15, flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 10, display: 'inline-flex', transition: 'background 0.1s ease', cursor: 'pointer', touchAction: 'none'}}
                >
                    <div style={{alignSelf: 'stretch', textAlign: 'center', justifyContent: 'center', display: 'flex', flexDirection: 'column', color: '#00214B', fontSize: 24, fontFamily: 'Nunito', fontWeight: '900', wordWrap: 'break-word'}}>L</div>
                </div>
            </div>
        </div>
    );
}

export default HeadMovement;