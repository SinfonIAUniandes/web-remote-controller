import React, { useState, useEffect } from 'react';
import { COLORS, TYPOGRAPHY } from '../theme';
import InteractiveColorWheel, { hexToRgba } from './InteractiveColorWheel';
import robotPNG from '../assets/robot.png';

const ChestModal = ({ isOpen, onClose, onSave, initialState }) => {
    // 1. Unificamos a un solo color como en las orejas
    const [color, setColor] = useState(initialState?.color || '#FFFFFF');
    const [isOn, setIsOn] = useState(initialState?.isOn ?? true);

    useEffect(() => {
        if (isOpen && initialState) {
            setColor(initialState.color || initialState.left || '#FFFFFF');
            setIsOn(initialState.isOn ?? (initialState.isLeftOn || initialState.isRightOn) ?? true);
        }
    }, [isOpen, initialState]);

    if (!isOpen) return null;

    const handleSaveClick = () => {
        onSave({
            color,
            isOn
        });
    };

    const toggleOn = () => setIsOn(!isOn);

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div style={{ width: '500px', height: '300px', position: 'relative', background: COLORS.AZUL_PRINCIPAL, overflow: 'hidden', borderRadius: 20 }}>
                
                {/* Selector de Color único (izquierda) */}
                <InteractiveColorWheel left={20} top={30} color={color} onChange={setColor} />

                {/* LEDs del Pecho Interactivos (Perspectiva Espejo) */}
                {/* LED Derecho del Robot (Izquierda en pantalla) */}
                <div onClick={toggleOn} style={{ width: '35px', height: '110px', left: '310px', top: '75px', position: 'absolute', transform: 'rotate(20deg)', borderRadius: '20px', background: isOn ? hexToRgba(color, 0.4) : 'rgba(0, 0, 0, 0.8)', outline: `3px ${isOn ? color : '#000'} solid`, outlineOffset: '2px', cursor: 'pointer', transition: 'all 0.2s', boxShadow: isOn ? `0 0 15px ${hexToRgba(color, 0.6)}` : 'none' }} />
                {/* LED Izquierdo del Robot (Derecha en pantalla) */}
                <div onClick={toggleOn} style={{ width: '35px', height: '110px', left: '395px', top: '75px', position: 'absolute', transform: 'rotate(-20deg)', borderRadius: '20px', background: isOn ? hexToRgba(color, 0.4) : 'rgba(0, 0, 0, 0.8)', outline: `3px ${isOn ? color : '#000'} solid`, outlineOffset: '2px', cursor: 'pointer', transition: 'all 0.2s', boxShadow: isOn ? `0 0 15px ${hexToRgba(color, 0.6)}` : 'none' }} />

                {/* Input HEX y Botón Guardar */}
                <div style={{ position: 'absolute', left: 20, top: 245, height: 30, display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{ color: COLORS.CELESTE_PRINCIPAL, fontSize: 16, fontFamily: TYPOGRAPHY.FONT_FAMILY_PRINCIPAL, fontWeight: TYPOGRAPHY.FONT_WEIGHT_EXTRA_BOLD }}>HEX</div>
                    <input type="text" value={color} onChange={(e) => setColor(e.target.value)} style={{ width: 120, height: 30, background: COLORS.CELESTE_PRINCIPAL, borderRadius: 10, color: COLORS.AZUL_PRINCIPAL, fontFamily: TYPOGRAPHY.FONT_FAMILY_PRINCIPAL, fontWeight: TYPOGRAPHY.FONT_WEIGHT_BOLD, border: 'none', textAlign: 'center', outline: 'none' }} />
                </div>

                <div 
                    onClick={handleSaveClick} 
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = COLORS.AZUL_SECUNDARIO}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = COLORS.CELESTE_PRINCIPAL}
                    style={{ width: 150, height: 30, left: 300, top: 245, position: 'absolute', background: COLORS.CELESTE_PRINCIPAL, borderRadius: 10, display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', transition: 'background-color 0.2s' }}
                >
                    <div style={{ color: COLORS.AZUL_PRINCIPAL, fontSize: 13, fontFamily: TYPOGRAPHY.FONT_FAMILY_PRINCIPAL, fontWeight: TYPOGRAPHY.FONT_WEIGHT_BOLD }}>GUARDAR</div>
                </div>

                <div style={{ width: 245, height: 30, left: 128, top: 0, position: 'absolute', background: COLORS.CELESTE_PRINCIPAL, borderBottomRightRadius: 20, borderBottomLeftRadius: 20, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <div style={{ color: COLORS.AZUL_PRINCIPAL, fontSize: 16, fontFamily: TYPOGRAPHY.FONT_FAMILY_PRINCIPAL, fontWeight: TYPOGRAPHY.FONT_WEIGHT_EXTRA_BOLD }}>PECHO</div>
                </div>

                <button onClick={onClose} style={{ position: 'absolute', top: 5, right: 15, background: 'none', border: 'none', color: COLORS.CELESTE_PRINCIPAL, fontSize: 24, cursor: 'pointer', zIndex: 10 }}>×</button>
            </div>
        </div>
    );
};

export default ChestModal;