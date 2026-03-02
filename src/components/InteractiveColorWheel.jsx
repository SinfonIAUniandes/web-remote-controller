import React, { useState, useRef, useEffect } from 'react';
import { COLORS } from '../theme';

const hslToHex = (h, s, l) => {
    l /= 100;
    const a = s * Math.min(l, 1 - l) / 100;
    const f = n => {
        const k = (n + h / 30) % 12;
        const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
        return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`.toUpperCase();
};

export const hexToRgba = (hex, alpha) => {
    if (!hex || !/^#[0-9A-F]{6}$/i.test(hex)) return `rgba(0,0,0,${alpha})`;
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export const hexToRgb = (hex) => {
    if (!hex || !/^#[0-9A-F]{6}$/i.test(hex)) return { red: 0, green: 0, blue: 0 };
    return {
        red: parseInt(hex.substring(1, 3), 16),
        green: parseInt(hex.substring(3, 5), 16),
        blue: parseInt(hex.substring(5, 7), 16)
    };
};

// NUEVA FUNCIÓN: Convierte HEX a HSL para reposicionar el puntero
const hexToHsl = (hex) => {
    let r = 0, g = 0, b = 0;
    if (hex && /^#[0-9A-F]{6}$/i.test(hex)) {
        r = parseInt(hex.substring(1, 3), 16) / 255;
        g = parseInt(hex.substring(3, 5), 16) / 255;
        b = parseInt(hex.substring(5, 7), 16) / 255;
    }
    
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;

    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
            default: break;
        }
        h /= 6;
    }
    return { h: h * 360, s: s * 100, l: l * 100 };
};


// --- COMPONENTE INTERACTIVO DE RUEDA DE COLOR ---
const InteractiveColorWheel = ({ left, top, color, onChange }) => {
    const wheelRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);
    const [knobPos, setKnobPos] = useState({ x: 100, y: 100 });

    // NUEVO: Efecto para actualizar el puntero si el color cambia desde afuera (ej. al abrir el modal o escribir en el input)
    useEffect(() => {
        if (!isDragging && color) {
            const { h, s } = hexToHsl(color);
            // Convertimos el ángulo y la saturación de vuelta a coordenadas X, Y
            const angleRad = h * (Math.PI / 180);
            const distance = s; // La distancia máxima es 100, igual que la saturación
            
            const cx = 100;
            const cy = 100;
            const dx = distance * Math.cos(angleRad);
            const dy = distance * Math.sin(angleRad);
            
            setKnobPos({ x: cx + dx, y: cy + dy });
        }
    }, [color, isDragging]);

    const handlePointerEvent = (e) => {
        if (!wheelRef.current) return;
        const rect = wheelRef.current.getBoundingClientRect();
        
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const cx = 100;
        const cy = 100;
        let dx = x - cx;
        let dy = y - cy;
        let distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 100) {
            dx = (dx / distance) * 100;
            dy = (dy / distance) * 100;
            distance = 100;
        }

        setKnobPos({ x: cx + dx, y: cy + dy });

        let angle = Math.atan2(dy, dx) * (180 / Math.PI);
        if (angle < 0) angle += 360;

        const saturation = (distance / 100) * 100;
        const hex = hslToHex(angle, saturation, 50);
        onChange(hex);
    };

    return (
        <div
            ref={wheelRef}
            onPointerDown={(e) => { setIsDragging(true); handlePointerEvent(e); e.target.setPointerCapture(e.pointerId); }}
            onPointerMove={(e) => { if (isDragging) handlePointerEvent(e); }}
            onPointerUp={(e) => { setIsDragging(false); e.target.releasePointerCapture(e.pointerId); }}
            style={{
                width: 200, height: 200, left: left, top: top, position: 'absolute',
                backgroundImage: `
                    radial-gradient(circle closest-side, white 0%, transparent 100%), 
                    conic-gradient(from 90deg, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)
                `,
                borderRadius: 9999,
                cursor: 'crosshair',
                touchAction: 'none'
            }}
        >
            <div style={{
                width: 20, height: 20, 
                left: knobPos.x - 10, top: knobPos.y - 10,
                position: 'absolute', background: COLORS.AZUL_PRINCIPAL, 
                border: '2px solid white', borderRadius: 9999, 
                pointerEvents: 'none',
                transition: isDragging ? 'none' : 'all 0.2s ease-out' // Transición suave si se tipea el HEX
            }} />
        </div>
    );
};

export default InteractiveColorWheel;