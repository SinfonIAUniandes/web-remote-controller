import React, { useState, useEffect } from 'react';
import { COLORS, TYPOGRAPHY } from '../theme';
import InteractiveBluePicker from './InteractiveBluePicker';
import robotPNG from '../assets/robot.png';

const EarModal = ({ isOpen, onClose, onSave, initialState }) => {
    const [color, setColor] = useState(initialState?.color || '#0000FF');
    const [isLeftOn, setIsLeftOn] = useState(initialState?.isLeftOn ?? true);
    const [isRightOn, setIsRightOn] = useState(initialState?.isRightOn ?? true);

    useEffect(() => {
        if (isOpen && initialState) {
            setColor(initialState.color);
            setIsLeftOn(initialState.isLeftOn);
            setIsRightOn(initialState.isRightOn);
        }
    }, [isOpen, initialState]);

    if (!isOpen) return null;

    const activeLeftColor = isLeftOn ? color : '#000000';
    const activeRightColor = isRightOn ? color : '#000000';

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div style={{ width: 600, height: 300, position: 'relative', background: COLORS.AZUL_PRINCIPAL, overflow: 'hidden', borderRadius: 20 }}>
                
                {/* Selector de Azul Independiente */}
                <InteractiveBluePicker left={40} top={55} height={160} color={color} onChange={setColor} />

                {/* IMAGEN DEL ROBOT Y OREJAS INTERACTIVAS */}
                <img style={{ width: 205, height: 183, left: 333, top: 44, position: 'absolute' }} src={robotPNG} alt="Robot" />
                
                {/* Oreja Izquierda */}
                <div onClick={() => setIsRightOn(!isRightOn)} style={{ width: 7.26, height: 60.77, left: 341.26, top: 174.77, position: 'absolute', transform: 'rotate(180deg)', transformOrigin: 'top left', borderRadius: 180, outline: `15px ${activeRightColor} solid`, outlineOffset: '-7.50px', cursor: 'pointer', transition: 'all 0.2s' }} />
                
                {/* Oreja Derecha */}
                <div onClick={() => setIsLeftOn(!isLeftOn)} style={{ width: 7.26, height: 60.77, left: 528.12, top: 114, position: 'absolute', borderRadius: 180, outline: `15px ${activeLeftColor} solid`, outlineOffset: '-7.50px', cursor: 'pointer', transition: 'all 0.2s' }} />

                {/* ALINEACIÓN PERFECTA (EJE Y EN TOP = 245) */}
                <div style={{ position: 'absolute', left: 40, top: 245, height: 30, display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{ color: COLORS.CELESTE_PRINCIPAL, fontSize: 16, fontFamily: TYPOGRAPHY.FONT_FAMILY_PRINCIPAL, fontWeight: TYPOGRAPHY.FONT_WEIGHT_EXTRA_BOLD }}>HEX</div>
                    <input type="text" value={color} onChange={(e) => setColor(e.target.value)} style={{ width: 140, height: 30, background: COLORS.CELESTE_PRINCIPAL, borderRadius: 10, color: COLORS.AZUL_PRINCIPAL, fontFamily: TYPOGRAPHY.FONT_FAMILY_PRINCIPAL, fontWeight: TYPOGRAPHY.FONT_WEIGHT_BOLD, border: 'none', textAlign: 'center', outline: 'none' }} />
                </div>

                {/* Botón Guardar */}
                <div 
                    onClick={() => onSave({ color, isLeftOn, isRightOn })} 
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = COLORS.AZUL_SECUNDARIO}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = COLORS.CELESTE_PRINCIPAL}
                    style={{ width: 150, height: 30, left: 360, top: 245, position: 'absolute', background: COLORS.CELESTE_PRINCIPAL, borderRadius: 10, display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', transition: 'background-color 0.2s' }}
                >
                    <div style={{ color: COLORS.AZUL_PRINCIPAL, fontSize: 13, fontFamily: TYPOGRAPHY.FONT_FAMILY_PRINCIPAL, fontWeight: TYPOGRAPHY.FONT_WEIGHT_BOLD }}>GUARDAR</div>
                </div>

                {/* Título OREJAS */}
                <div style={{ width: 245, height: 30, left: 178, top: 0, position: 'absolute', background: COLORS.CELESTE_PRINCIPAL, borderBottomRightRadius: 20, borderBottomLeftRadius: 20, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <div style={{ color: COLORS.AZUL_PRINCIPAL, fontSize: 16, fontFamily: TYPOGRAPHY.FONT_FAMILY_PRINCIPAL, fontWeight: TYPOGRAPHY.FONT_WEIGHT_EXTRA_BOLD }}>OREJAS</div>
                </div>

                {/* Botón Cerrar */}
                <button onClick={onClose} style={{ position: 'absolute', top: 5, right: 15, background: 'none', border: 'none', color: COLORS.CELESTE_PRINCIPAL, fontSize: 24, cursor: 'pointer', zIndex: 10 }}>×</button>
            </div>
        </div>
    );
};

export default EarModal;