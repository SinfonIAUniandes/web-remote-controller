import React, { useState, useEffect, useRef } from 'react';

// --- UTILIDADES MATEMÁTICAS PARA EL AZUL ---
// Convierte HSV a HEX. El Hue (Tono) siempre será 240 (Azul) para este modal.
const hsvToHex = (h, s, v) => {
    let r, g, b;
    let i = Math.floor(h * 6);
    let f = h * 6 - i;
    let p = v * (1 - s);
    let q = v * (1 - f * s);
    let t = v * (1 - (1 - f) * s);
    switch (i % 6) {
        case 0: r = v; g = t; b = p; break;
        case 1: r = q; g = v; b = p; break;
        case 2: r = p; g = v; b = t; break;
        case 3: r = p; g = q; b = v; break;
        case 4: r = t; g = p; b = v; break;
        case 5: r = v; g = p; b = q; break;
        default: r = 0; g = 0; b = 0; break;
    }
    const toHex = x => Math.round(x * 255).toString(16).padStart(2, '0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
};

const hexToHsv = (hex) => {
    let r = 0, g = 0, b = 0;
    if (hex && /^#[0-9A-F]{6}$/i.test(hex)) {
        r = parseInt(hex.substring(1, 3), 16) / 255;
        g = parseInt(hex.substring(3, 5), 16) / 255;
        b = parseInt(hex.substring(5, 7), 16) / 255;
    }
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let s = 0, v = max;
    const d = max - min;
    s = max === 0 ? 0 : d / max;
    return { s, v }; // Omitimos Hue porque asumimos que siempre es azul
};

// --- COMPONENTE INTERACTIVO RECTANGULAR ---
const InteractiveBluePicker = ({ width = 250, height = 150, left, top, color, onChange }) => {
    const pickerRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);
    const [knobPos, setKnobPos] = useState({ x: width, y: 0 }); // Azul puro por defecto

    useEffect(() => {
        if (!isDragging && color) {
            const { s, v } = hexToHsv(color);
            setKnobPos({ x: s * width, y: (1 - v) * height });
        }
    }, [color, isDragging, width, height]);

    const handlePointerEvent = (e) => {
        if (!pickerRef.current) return;
        const rect = pickerRef.current.getBoundingClientRect();

        // Calculamos la posición normalizada (0 a 1) respecto al tamaño actual en pantalla.
        // Esto elimina el error de desfase producido por el transform: scale() en el App.js.
        const nx = (e.clientX - rect.left) / rect.width;
        const ny = (e.clientY - rect.top) / rect.height;

        // Mapeamos de vuelta al sistema de coordenadas interno del componente.
        let x = nx * width;
        let y = ny * height;

        // Limitar el puntero dentro de la caja
        x = Math.max(0, Math.min(x, width));
        y = Math.max(0, Math.min(y, height));
        setKnobPos({ x, y });

        const s = x / width;
        const v = 1 - (y / height);
        // 240 grados / 360 = 0.666 (Azul puro en el círculo cromático)
        const hex = hsvToHex(240 / 360, s, v); 
        onChange(hex);
    };

    return (
        <div
            ref={pickerRef}
            onPointerDown={(e) => { setIsDragging(true); handlePointerEvent(e); e.target.setPointerCapture(e.pointerId); }}
            onPointerMove={(e) => { if (isDragging) handlePointerEvent(e); }}
            onPointerUp={(e) => { setIsDragging(false); e.target.releasePointerCapture(e.pointerId); }}
            style={{
                width, height, left, top, position: 'absolute', cursor: 'crosshair', touchAction: 'none',
                backgroundColor: '#0000FF',
                backgroundImage: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #FFF, transparent)`,
                borderRadius: 10, // Un pequeño borde redondeado para que se vea mejor
                overflow: 'hidden'
            }}
        >
            <div style={{
                width: 14, height: 14,
                left: knobPos.x - 7, top: knobPos.y - 7,
                position: 'absolute', background: 'transparent',
                border: '2px solid white', borderRadius: '50%',
                pointerEvents: 'none', boxShadow: '0 0 3px rgba(0,0,0,0.5)',
                transition: isDragging ? 'none' : 'all 0.2s ease-out'
            }} />
        </div>
    );
};

export default InteractiveBluePicker;