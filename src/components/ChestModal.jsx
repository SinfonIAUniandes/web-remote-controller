import React, { useState, useEffect } from 'react';
import { COLORS, TYPOGRAPHY } from '../theme';
import InteractiveColorWheel, { hexToRgba } from './InteractiveColorWheel';

const ChestModal = ({ isOpen, onClose, onSave, initialState }) => {
    // 1. Mantenemos los estados independientes (la "arquitectura" original)
    const [leftChestColor, setLeftChestColor] = useState(initialState?.left || '#FFFFFF');
    const [rightChestColor, setRightChestColor] = useState(initialState?.right || '#FFFFFF');
    const [isLeftChestOn, setIsLeftChestOn] = useState(initialState?.isLeftOn ?? true);
    const [isRightChestOn, setIsRightChestOn] = useState(initialState?.isRightOn ?? true);

    useEffect(() => {
        if (isOpen && initialState) {
            setLeftChestColor(initialState.left);
            setRightChestColor(initialState.right);
            setIsLeftChestOn(initialState.isLeftOn);
            setIsRightChestOn(initialState.isRightOn);
        }
    }, [isOpen, initialState]);

    if (!isOpen) return null;

    // 2. Sincronización de colores
    const handleColorChange = (newColor) => {
        setLeftChestColor(newColor);
        setRightChestColor(newColor);
    };

    // 3. NUEVO: Sincronización de encendido/apagado
    const handlePowerToggle = () => {
        const newState = !isLeftChestOn; // Invertimos el estado actual
        setIsLeftChestOn(newState);      // Se lo aplicamos al izquierdo
        setIsRightChestOn(newState);     // Se lo aplicamos al derecho
    };

    const handleSaveClick = () => {
        onSave({
            left: leftChestColor,
            right: rightChestColor,
            isLeftOn: isLeftChestOn,
            isRightOn: isRightChestOn
        });
    };

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div style={{ width: '700px', height: '300px', position: 'relative', background: COLORS.AZUL_PRINCIPAL, overflow: 'hidden', borderRadius: 20 }}>
                
                <InteractiveColorWheel left={27} top={20} color={leftChestColor} onChange={handleColorChange} />
                <InteractiveColorWheel left={472} top={20} color={rightChestColor} onChange={handleColorChange} />

                <div style={{ left: 27, top: 246, position: 'absolute', color: COLORS.CELESTE_PRINCIPAL, fontSize: 16, fontFamily: TYPOGRAPHY.FONT_FAMILY_PRINCIPAL, fontWeight: TYPOGRAPHY.FONT_WEIGHT_EXTRA_BOLD }}>HEX</div>
                <div style={{ left: 472, top: 246, position: 'absolute', color: COLORS.CELESTE_PRINCIPAL, fontSize: 16, fontFamily: TYPOGRAPHY.FONT_FAMILY_PRINCIPAL, fontWeight: TYPOGRAPHY.FONT_WEIGHT_EXTRA_BOLD }}>HEX</div>

                <input type="text" value={leftChestColor} onChange={(e) => handleColorChange(e.target.value)} style={{ width: 155, height: 30, left: 72, top: 242, position: 'absolute', background: COLORS.CELESTE_PRINCIPAL, borderRadius: 10, color: COLORS.AZUL_PRINCIPAL, fontFamily: TYPOGRAPHY.FONT_FAMILY_PRINCIPAL, fontWeight: TYPOGRAPHY.FONT_WEIGHT_BOLD, border: 'none', textAlign: 'center', outline: 'none' }} />
                <input type="text" value={rightChestColor} onChange={(e) => handleColorChange(e.target.value)} style={{ width: 155, height: 30, left: 517, top: 242, position: 'absolute', background: COLORS.CELESTE_PRINCIPAL, borderRadius: 10, color: COLORS.AZUL_PRINCIPAL, fontFamily: TYPOGRAPHY.FONT_FAMILY_PRINCIPAL, fontWeight: TYPOGRAPHY.FONT_WEIGHT_BOLD, border: 'none', textAlign: 'center', outline: 'none' }} />

                {/* NUEVO: Ambos LEDs ahora ejecutan handlePowerToggle al hacer clic */}
                <div onClick={handlePowerToggle} style={{ width: '35px', height: '110px', left: '290px', top: '75px', position: 'absolute', transform: 'rotate(20deg)', borderRadius: '20px', background: isLeftChestOn ? hexToRgba(leftChestColor, 0.4) : 'rgba(0, 0, 0, 0.8)', outline: `3px ${isLeftChestOn ? leftChestColor : '#000'} solid`, outlineOffset: '2px', cursor: 'pointer', transition: 'all 0.2s', boxShadow: isLeftChestOn ? `0 0 15px ${hexToRgba(leftChestColor, 0.6)}` : 'none' }} />
                <div onClick={handlePowerToggle} style={{ width: '35px', height: '110px', left: '375px', top: '75px', position: 'absolute', transform: 'rotate(-20deg)', borderRadius: '20px', background: isRightChestOn ? hexToRgba(rightChestColor, 0.4) : 'rgba(0, 0, 0, 0.8)', outline: `3px ${isRightChestOn ? rightChestColor : '#000'} solid`, outlineOffset: '2px', cursor: 'pointer', transition: 'all 0.2s', boxShadow: isRightChestOn ? `0 0 15px ${hexToRgba(rightChestColor, 0.6)}` : 'none' }} />

                <div 
                    onClick={handleSaveClick} 
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = COLORS.AZUL_SECUNDARIO}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = COLORS.CELESTE_PRINCIPAL}
                    style={{ width: 150, height: 30, left: 275, top: 242, position: 'absolute', background: COLORS.CELESTE_PRINCIPAL, borderRadius: 10, display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', transition: 'background-color 0.2s' }}
                >
                    <div style={{ color: COLORS.AZUL_PRINCIPAL, fontSize: 13, fontFamily: TYPOGRAPHY.FONT_FAMILY_PRINCIPAL, fontWeight: TYPOGRAPHY.FONT_WEIGHT_BOLD }}>GUARDAR</div>
                </div>

                <div style={{ width: 245, height: 30, left: 227, top: 0, position: 'absolute', background: COLORS.CELESTE_PRINCIPAL, borderBottomRightRadius: 20, borderBottomLeftRadius: 20, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <div style={{ color: COLORS.AZUL_PRINCIPAL, fontSize: 16, fontFamily: TYPOGRAPHY.FONT_FAMILY_PRINCIPAL, fontWeight: TYPOGRAPHY.FONT_WEIGHT_EXTRA_BOLD }}>PECHO</div>
                </div>

                <button onClick={onClose} style={{ position: 'absolute', top: 5, right: 15, background: 'none', border: 'none', color: COLORS.CELESTE_PRINCIPAL, fontSize: 24, cursor: 'pointer', zIndex: 10 }}>×</button>
            </div>
        </div>
    );
};

export default ChestModal;