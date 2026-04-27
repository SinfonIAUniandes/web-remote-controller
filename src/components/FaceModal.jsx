import React, { useState, useEffect } from 'react';
import { COLORS, TYPOGRAPHY } from '../theme';
import InteractiveColorWheel, { hexToRgba } from './InteractiveColorWheel';
import robotPNG from '../assets/robot.png';

const FaceModal = ({ isOpen, onClose, onSave, initialState }) => {
    const [leftFaceColor, setLeftFaceColor] = useState(initialState?.left || '#FFFFFF');
    const [rightFaceColor, setRightFaceColor] = useState(initialState?.right || '#FFFFFF');
    const [isLeftFaceOn, setIsLeftFaceOn] = useState(initialState?.isLeftOn ?? true);
    const [isRightFaceOn, setIsRightFaceOn] = useState(initialState?.isRightOn ?? true);

    // Cargar la memoria cada vez que se abre el modal
    useEffect(() => {
        if (isOpen && initialState) {
            setLeftFaceColor(initialState.left);
            setRightFaceColor(initialState.right);
            setIsLeftFaceOn(initialState.isLeftOn);
            setIsRightFaceOn(initialState.isRightOn);
        }
    }, [isOpen, initialState]);

    if (!isOpen) return null;

    const handleSaveClick = () => {
        onSave({
            left: leftFaceColor,
            right: rightFaceColor,
            isLeftOn: isLeftFaceOn,
            isRightOn: isRightFaceOn
        });
    };

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div style={{ width: '700px', height: '300px', position: 'relative', background: COLORS.AZUL_PRINCIPAL, overflow: 'hidden', borderRadius: 20 }}>
                
                <img style={{ width: 205, height: 183, left: 248, top: 44, position: 'absolute' }} src={robotPNG} alt="Robot" />
                
                <InteractiveColorWheel left={27} top={20} color={rightFaceColor} onChange={setRightFaceColor} />
                <InteractiveColorWheel left={472} top={20} color={leftFaceColor} onChange={setLeftFaceColor} />

                <div style={{ left: 27, top: 246, position: 'absolute', color: COLORS.CELESTE_PRINCIPAL, fontSize: 16, fontFamily: TYPOGRAPHY.FONT_FAMILY_PRINCIPAL, fontWeight: TYPOGRAPHY.FONT_WEIGHT_EXTRA_BOLD }}>HEX</div>
                <div style={{ left: 472, top: 246, position: 'absolute', color: COLORS.CELESTE_PRINCIPAL, fontSize: 16, fontFamily: TYPOGRAPHY.FONT_FAMILY_PRINCIPAL, fontWeight: TYPOGRAPHY.FONT_WEIGHT_EXTRA_BOLD }}>HEX</div>

                <input type="text" value={rightFaceColor} onChange={(e) => setRightFaceColor(e.target.value)} style={{ width: 155, height: 30, left: 72, top: 242, position: 'absolute', background: COLORS.CELESTE_PRINCIPAL, borderRadius: 10, color: COLORS.AZUL_PRINCIPAL, fontFamily: TYPOGRAPHY.FONT_FAMILY_PRINCIPAL, fontWeight: TYPOGRAPHY.FONT_WEIGHT_BOLD, border: 'none', textAlign: 'center', outline: 'none' }} />
                <input type="text" value={leftFaceColor} onChange={(e) => setLeftFaceColor(e.target.value)} style={{ width: 155, height: 30, left: 517, top: 242, position: 'absolute', background: COLORS.CELESTE_PRINCIPAL, borderRadius: 10, color: COLORS.AZUL_PRINCIPAL, fontFamily: TYPOGRAPHY.FONT_FAMILY_PRINCIPAL, fontWeight: TYPOGRAPHY.FONT_WEIGHT_BOLD, border: 'none', textAlign: 'center', outline: 'none' }} />

                {/* Ojo Derecho del Robot (Izquierda de la pantalla) */}
                <div 
                    onClick={() => setIsRightFaceOn(!isRightFaceOn)} 
                    style={{ 
                        width: 51.40, height: 49.41, left: 284, top: 121.59, position: 'absolute', 
                        transform: 'rotate(-4deg)', transformOrigin: 'top left', 
                        background: isRightFaceOn ? hexToRgba(rightFaceColor, 0.5) : 'rgba(0, 0, 0, 0.8)', 
                        outline: `2.50px ${isRightFaceOn ? rightFaceColor : '#000'} solid`, 
                        outlineOffset: '-1.25px', cursor: 'pointer', transition: 'all 0.2s' 
                    }} 
                />
                
                {/* Ojo Izquierdo del Robot (Derecha de la pantalla) */}
                <div 
                    onClick={() => setIsLeftFaceOn(!isLeftFaceOn)} 
                    style={{ 
                        width: 51, height: 50, left: 366, top: 118, position: 'absolute', 
                        background: isLeftFaceOn ? hexToRgba(leftFaceColor, 0.5) : 'rgba(0, 0, 0, 0.8)', 
                        outline: `2.50px ${isLeftFaceOn ? leftFaceColor : '#000'} solid`, 
                        outlineOffset: '-1.25px', cursor: 'pointer', transition: 'all 0.2s' 
                    }} 
                />

                {/* BOTÓN GUARDAR CON HOVER */}
                <div 
                    onClick={handleSaveClick} 
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = COLORS.AZUL_SECUNDARIO}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = COLORS.CELESTE_PRINCIPAL}
                    style={{ width: 150, height: 30, left: 275, top: 242, position: 'absolute', background: COLORS.CELESTE_PRINCIPAL, borderRadius: 10, display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', transition: 'background-color 0.2s' }}
                >
                    <div style={{ color: COLORS.AZUL_PRINCIPAL, fontSize: 13, fontFamily: TYPOGRAPHY.FONT_FAMILY_PRINCIPAL, fontWeight: TYPOGRAPHY.FONT_WEIGHT_BOLD }}>GUARDAR</div>
                </div>

                <div style={{ width: 245, height: 30, left: 227, top: 0, position: 'absolute', background: COLORS.CELESTE_PRINCIPAL, borderBottomRightRadius: 20, borderBottomLeftRadius: 20, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <div style={{ color: COLORS.AZUL_PRINCIPAL, fontSize: 16, fontFamily: TYPOGRAPHY.FONT_FAMILY_PRINCIPAL, fontWeight: TYPOGRAPHY.FONT_WEIGHT_EXTRA_BOLD }}>OJOS</div>
                </div>

                <button onClick={onClose} style={{ position: 'absolute', top: 5, right: 15, background: 'none', border: 'none', color: COLORS.CELESTE_PRINCIPAL, fontSize: 24, cursor: 'pointer', zIndex: 10 }}>×</button>
            </div>
        </div>
    );
};

export default FaceModal;