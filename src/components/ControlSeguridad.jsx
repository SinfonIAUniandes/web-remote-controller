import React, { useState } from 'react';
import { useRos } from '../contexts/RosContext';
import { COLORS, TYPOGRAPHY } from '../theme';
import { createService, callService } from '../services/RosManager';
import grandecito from '../assets/grandecito.svg';

const ControlSeguridad = () => {
    const { ros } = useRos();
    const [enabled, setEnabled] = useState(false);
    const [isHovered, setIsHovered] = useState(false);

    const handleToggle = () => {
        try {
            const service = createService(
                ros,
                '/pytoolkit/ALMotion/set_security_distance_srv',
                'robot_toolkit_msgs/set_security_distance_srv'
            );
            callService(service, { security_distance: enabled ? 0.0 : 0.4 }, () => {
                setEnabled(v => !v);
            });
        } catch (e) {
            console.error('Error al cambiar seguridad:', e);
            setEnabled(v => !v);
        }
    };

    return (
        <div style={{
            width: '100%',
            height: '125px',
            background: COLORS.AZUL_PRINCIPAL,   // ← corregido
            borderRadius: '25px',
            position: 'relative',
            overflow: 'hidden',
        }}>
            {/* Etiqueta título */}
            <div style={{
                position: 'absolute',
                left: 0,
                top: '24px',
                height: '30px',
                paddingLeft: '19px',
                paddingRight: '19px',
                background: COLORS.CELESTE_PRINCIPAL,
                borderTopRightRadius: '25px',
                borderBottomRightRadius: '25px',
                display: 'flex',
                alignItems: 'center',
                zIndex: 2,
            }}>
                <span style={{
                    fontFamily: TYPOGRAPHY.FONT_FAMILY_PRINCIPAL,
                    fontWeight: TYPOGRAPHY.FONT_WEIGHT_BOLD,
                    fontSize: '16px',
                    color: COLORS.AZUL_PRINCIPAL,  // ← corregido
                    whiteSpace: 'nowrap',
                }}>
                    Control seguridad
                </span>
            </div>

            {/* Robot — pegado a la derecha dentro del panel */}
            <img
                src={grandecito}
                alt="Robot Pepper"
                style={{
                    height: '155px',
                    width: 'auto',
                    position: 'absolute',
                    right: '0px',
                    top: '-30px',
                    pointerEvents: 'none',
                    objectFit: 'contain',
                    zIndex: 1,
                }}
            />

            {/* Botón toggle — z-index 2 para quedar encima del robot */}
            <button
                onClick={handleToggle}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                style={{
                    position: 'absolute',
                    left: '23px',
                    top: '73px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    height: '30px',
                    paddingLeft: '10px',
                    paddingRight: '14px',
                    background: isHovered ? COLORS.AZUL_PRINCIPAL : COLORS.CELESTE_PRINCIPAL,
                    borderRadius: '25px',
                    border: `2px solid ${COLORS.CELESTE_PRINCIPAL}`,
                    cursor: 'pointer',
                    transition: 'background 0.2s',
                    zIndex: 2,
                }}
            >
                <div style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    background: enabled
                        ? COLORS.VERDE
                        : isHovered ? COLORS.CELESTE_PRINCIPAL : COLORS.AZUL_PRINCIPAL,
                    transition: 'background 0.3s',
                    flexShrink: 0,
                }} />
                <span style={{
                    fontFamily: TYPOGRAPHY.FONT_FAMILY_PRINCIPAL,
                    fontWeight: TYPOGRAPHY.FONT_WEIGHT_BOLD,
                    fontSize: '12px',
                    color: isHovered ? COLORS.CELESTE_PRINCIPAL : COLORS.AZUL_PRINCIPAL,
                    whiteSpace: 'nowrap',
                }}>
                    {enabled ? 'DESHABILITAR' : 'HABILITAR'}
                </span>
            </button>
        </div>
    );
};

export default ControlSeguridad;