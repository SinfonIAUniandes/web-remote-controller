import React, { useState } from 'react';
import { useRos } from '../contexts/RosContext';
import { COLORS, TYPOGRAPHY } from '../theme';
import * as ROSLIB from 'roslib';

const BODY_PARTS = [
    { label: 'Cuerpo', value: 'Body' },
    { label: 'Brazos', value: 'Arms' },
    { label: 'Brazo Izquierdo', value: 'LArm' },
    { label: 'Brazo Derecho', value: 'RArm' },
    { label: 'Cabeza', value: 'Head' }
];

const BreathingBodyControl = () => {
    const { ros } = useRos();
    
    // Estados de lógica
    const [selectedPart, setSelectedPart] = useState("Body");
    const [breathingState, setBreathingState] = useState(null); // null = Ninguno, 'True' = Activar, 'False' = Desactivar
    
    // Estados visuales e interactivos
    const [showDropdown, setShowDropdown] = useState(false);
    const [hoveredOption, setHoveredOption] = useState(null);
    const [isHoveredActivar, setIsHoveredActivar] = useState(false);
    const [isHoveredDesactivar, setIsHoveredDesactivar] = useState(false);

    // Color activo especial según tu diseño
    const COLOR_ACTIVO = '#D91A5D';

    // --- LÓGICA DE ROS ---
    const toggleBreathing = (enable) => {
        if (!ros) {
            console.error("No hay conexión con ROS.");
            return;
        }

        const service = new ROSLIB.Service({
            ros: ros,
            name: '/pytoolkit/ALMotion/toggle_breathing_srv',
            serviceType: 'robot_toolkit_msgs/set_open_close_hand_srv'
        });

        const request = new ROSLIB.ServiceRequest({
            hand: selectedPart,
            state: enable ? "True" : "False",
        });

        service.callService(
            request, 
            (result) => {
                console.log(`Respiración de ${selectedPart} cambiada a ${enable ? 'True' : 'False'}. Respuesta:`, result);
                setBreathingState(enable ? "True" : "False");
            }, 
            (error) => {
                console.error("Error al cambiar respiración:", error);
            }
        );
    };

    // Obtener etiqueta amigable para mostrar en el Dropdown
    const selectedLabel = BODY_PARTS.find(p => p.value === selectedPart)?.label || 'Cuerpo';

    return (
        <div style={{ width: '480px', height: '190px', background: COLORS.AZUL_PRINCIPAL, borderRadius: '20px', position: 'relative', overflow: 'visible' }}>
            
            {/* Capa invisible para cerrar el dropdown al hacer clic fuera */}
            {showDropdown && (
                <div 
                    style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9 }} 
                    onClick={() => setShowDropdown(false)}
                />
            )}

            {/* Etiqueta título */}
            <div style={{ position: 'absolute', left: 0, top: '21px', width: '180px', height: '30px', paddingLeft: '19px', paddingRight: '19px', background: COLORS.CELESTE_PRINCIPAL, borderTopRightRadius: '25px', borderBottomRightRadius: '25px', display: 'flex', alignItems: 'center', zIndex: 2 }}>
                <span style={{ width: '100%', textAlign: 'center',fontFamily: TYPOGRAPHY.FONT_FAMILY_PRINCIPAL, fontWeight: TYPOGRAPHY.FONT_WEIGHT_BOLD, fontSize: '16px', color: COLORS.AZUL_PRINCIPAL }}>
                    Control respiración
                </span>
            </div>

            {/* Label superior del selector */}
            <div style={{ position: 'absolute', left: '30px', top: '65px', fontFamily: TYPOGRAPHY.FONT_FAMILY_PRINCIPAL, fontWeight: TYPOGRAPHY.FONT_WEIGHT_BOLD, fontSize: '13px', color: COLORS.CELESTE_PRINCIPAL }}>
                Parte del cuerpo
            </div>

            {/* Contenedor relativo del Selector Desplegable Mejorado */}
            <div style={{ position: 'absolute', left: '30px', top: '90px', width: 'calc(100% - 60px)', zIndex: 10 }}>
                {/* Caja del input/trigger */}
                <div 
                    onClick={() => setShowDropdown(!showDropdown)}
                    style={{ 
                        width: '100%', 
                        height: '32px', 
                        background: COLORS.CELESTE_PRINCIPAL, 
                        borderRadius: '6px', 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        padding: '0 10px', 
                        boxSizing: 'border-box', 
                        cursor: 'pointer' 
                    }}
                >
                    <span style={{ color: COLORS.AZUL_PRINCIPAL, fontSize: '13px', fontFamily: TYPOGRAPHY.FONT_FAMILY_PRINCIPAL, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {selectedLabel}
                    </span>
                    <svg viewBox="0 0 24 24" width="16" height="16" fill={COLORS.AZUL_PRINCIPAL} style={{ transform: showDropdown ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                        <path d="M7 10l5 5 5-5z"/>
                    </svg>
                </div>

                {/* Opciones del Menú Desplegable */}
                {showDropdown && (
                    <div style={{ position: 'absolute', top: '100%', left: 0, width: '100%', background: COLORS.CELESTE_PRINCIPAL, borderRadius: '6px', marginTop: '4px', zIndex: 11, maxHeight: '120px', overflowY: 'auto', padding: '4px 0', boxShadow: '0 4px 6px rgba(0,0,0,0.3)' }}>
                        {BODY_PARTS.map((part) => (
                            <div 
                                key={part.value} 
                                onClick={() => {
                                    setSelectedPart(part.value);
                                    setBreathingState(null); // Resetea visualmente los botones al cambiar de parte
                                    setShowDropdown(false);
                                }} 
                                onMouseEnter={() => setHoveredOption(part.value)}
                                onMouseLeave={() => setHoveredOption(null)}
                                style={{ 
                                    padding: '6px 10px', 
                                    cursor: 'pointer', 
                                    background: hoveredOption === part.value || part.value === selectedPart ? COLORS.AZUL_SECUNDARIO : 'transparent', 
                                    color: COLORS.AZUL_PRINCIPAL, 
                                    fontFamily: TYPOGRAPHY.FONT_FAMILY_PRINCIPAL, 
                                    fontSize: '13px', 
                                    transition: 'background 0.2s ease-in-out' 
                                }}
                            >
                                {part.label}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Botón ACTIVAR (Mitad izquierda) */}
            <button
                onClick={() => toggleBreathing(true)}
                disabled={!ros}
                onMouseEnter={() => setIsHoveredActivar(true)}
                onMouseLeave={() => setIsHoveredActivar(false)}
                style={{
                    position: 'absolute',
                    left: '30px',
                    top: '139px',
                    width: 'calc(50% - 40px)',
                    height: '32px',
                    background: breathingState === "True" ? COLOR_ACTIVO : (isHoveredActivar && ros ? COLORS.AZUL_SECUNDARIO : COLORS.CELESTE_PRINCIPAL),
                    borderRadius: '90px',
                    border: 'none',
                    cursor: ros ? 'pointer' : 'not-allowed',
                    opacity: ros ? 1 : 0.6,
                    transition: 'background 0.2s',
                    fontFamily: TYPOGRAPHY.FONT_FAMILY_PRINCIPAL,
                    fontWeight: TYPOGRAPHY.FONT_WEIGHT_BOLD,
                    fontSize: '12px',
                    color: breathingState === "True" ? '#FFFFFF' : COLORS.AZUL_PRINCIPAL,
                }}
            >
                ACTIVAR
            </button>

            {/* Botón DESACTIVAR (Mitad derecha) */}
            <button
                onClick={() => toggleBreathing(false)}
                disabled={!ros}
                onMouseEnter={() => setIsHoveredDesactivar(true)}
                onMouseLeave={() => setIsHoveredDesactivar(false)}
                style={{
                    position: 'absolute',
                    right: '30px',
                    top: '139px',
                    width: 'calc(50% - 40px)',
                    height: '32px',
                    background: breathingState === "False" ? COLOR_ACTIVO : (isHoveredDesactivar && ros ? COLORS.AZUL_SECUNDARIO : COLORS.CELESTE_PRINCIPAL),
                    borderRadius: '90px',
                    border: 'none',
                    cursor: ros ? 'pointer' : 'not-allowed',
                    opacity: ros ? 1 : 0.6,
                    transition: 'background 0.2s',
                    fontFamily: TYPOGRAPHY.FONT_FAMILY_PRINCIPAL,
                    fontWeight: TYPOGRAPHY.FONT_WEIGHT_BOLD,
                    fontSize: '12px',
                    color: breathingState === "False" ? '#FFFFFF' : COLORS.AZUL_PRINCIPAL,
                }}
            >
                DESACTIVAR
            </button>
        </div>
    );
};

export default BreathingBodyControl;