import React, { useState, useEffect } from 'react';
import { COLORS, TYPOGRAPHY } from '../theme';
import InteractiveColorWheel, { hexToRgba } from './InteractiveColorWheel';
import robotPNG from '../assets/robot.png';

const AllModal = ({ isOpen, onClose, onSave, initialState }) => {
    // Un solo color y un solo estado de encendido/apagado para todo
    const [color, setColor] = useState(initialState?.color || '#00FFC8');
    const [isOn, setIsOn] = useState(initialState?.isOn ?? true);

    useEffect(() => {
        if (isOpen && initialState) {
            setColor(initialState.color);
            setIsOn(initialState.isOn);
        }
    }, [isOpen, initialState]);

    if (!isOpen) return null;

    const handleSaveClick = () => {
        onSave({ color, isOn });
    };

    // Función para apagar/prender todo al tocar CUALQUIER elemento
    const toggleOn = () => setIsOn(!isOn);

    // Colores dinámicos dependiendo de si está "encendido" o "apagado"
    const activeColor = isOn ? color : '#000000';
    const eyeBgColor = isOn ? hexToRgba(color, 0.5) : 'rgba(0, 0, 0, 0.8)';

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div style={{ width: 600, height: 300, position: 'relative', background: COLORS.AZUL_PRINCIPAL, overflow: 'hidden', borderRadius: 20 }}>
                
                {/* Rueda de Color */}
                <InteractiveColorWheel left={39} top={30} color={color} onChange={setColor} />

                {/* Textos y Inputs HEX */}
                <div style={{ left: 39, top: 253, position: 'absolute', color: COLORS.CELESTE_PRINCIPAL, fontSize: 16, fontFamily: TYPOGRAPHY.FONT_FAMILY_PRINCIPAL, fontWeight: TYPOGRAPHY.FONT_WEIGHT_EXTRA_BOLD }}>HEX</div>
                <input type="text" value={color} onChange={(e) => setColor(e.target.value)} style={{ width: 155, height: 30, left: 84, top: 249, position: 'absolute', background: COLORS.CELESTE_PRINCIPAL, borderRadius: 10, color: COLORS.AZUL_PRINCIPAL, fontFamily: TYPOGRAPHY.FONT_FAMILY_PRINCIPAL, fontWeight: TYPOGRAPHY.FONT_WEIGHT_BOLD, border: 'none', textAlign: 'center', outline: 'none' }} />

                {/* Imagen del Robot */}
                <img style={{ width: 205, height: 183, left: 333, top: 44, position: 'absolute' }} src={robotPNG} alt="Robot" />
                
                {/* Oreja Izquierda */}
                <div onClick={toggleOn} style={{ width: 7.26, height: 60.77, left: 341.26, top: 174.77, position: 'absolute', transform: 'rotate(180deg)', transformOrigin: 'top left', borderRadius: 180, outline: `15px ${activeColor} solid`, outlineOffset: '-7.50px', cursor: 'pointer', transition: 'all 0.2s' }} />
                
                {/* Oreja Derecha */}
                <div onClick={toggleOn} style={{ width: 7.26, height: 60.77, left: 528.12, top: 114, position: 'absolute', borderRadius: 180, outline: `15px ${activeColor} solid`, outlineOffset: '-7.50px', cursor: 'pointer', transition: 'all 0.2s' }} />
                
                {/* Ojo Izquierdo */}
                <div onClick={toggleOn} style={{ width: 51.40, height: 49.41, left: 369, top: 121.59, position: 'absolute', transform: 'rotate(-4deg)', transformOrigin: 'top left', background: eyeBgColor, outline: `2.50px ${activeColor} solid`, outlineOffset: '-1.25px', cursor: 'pointer', transition: 'all 0.2s' }} />
                
                {/* Ojo Derecho */}
                <div onClick={toggleOn} style={{ width: 51, height: 50, left: 451, top: 118, position: 'absolute', background: eyeBgColor, outline: `2.50px ${activeColor} solid`, outlineOffset: '-1.25px', cursor: 'pointer', transition: 'all 0.2s' }} />

                {/* BOTÓN GUARDAR CON HOVER */}
                <div 
                    onClick={handleSaveClick} 
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = COLORS.AZUL_SECUNDARIO}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = COLORS.CELESTE_PRINCIPAL}
                    style={{ width: 150, height: 30, left: 360, top: 245, position: 'absolute', background: COLORS.CELESTE_PRINCIPAL, borderRadius: 10, display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', transition: 'background-color 0.2s' }}
                >
                    <div style={{ color: COLORS.AZUL_PRINCIPAL, fontSize: 13, fontFamily: TYPOGRAPHY.FONT_FAMILY_PRINCIPAL, fontWeight: TYPOGRAPHY.FONT_WEIGHT_BOLD }}>GUARDAR</div>
                </div>

                {/* Título TODO */}
                <div style={{ width: 245, height: 30, left: 178, top: 0, position: 'absolute', background: COLORS.CELESTE_PRINCIPAL, borderBottomRightRadius: 20, borderBottomLeftRadius: 20, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <div style={{ color: COLORS.AZUL_PRINCIPAL, fontSize: 16, fontFamily: TYPOGRAPHY.FONT_FAMILY_PRINCIPAL, fontWeight: TYPOGRAPHY.FONT_WEIGHT_EXTRA_BOLD }}>TODO</div>
                </div>

                {/* Botón Cerrar */}
                <button onClick={onClose} style={{ position: 'absolute', top: 5, right: 15, background: 'none', border: 'none', color: COLORS.CELESTE_PRINCIPAL, fontSize: 24, cursor: 'pointer', zIndex: 10 }}>×</button>
            </div>
        </div>
    );
};

export default AllModal;