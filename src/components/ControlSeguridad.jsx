import React from 'react';
import PropTypes from 'prop-types';
import { COLORS, TYPOGRAPHY } from '../theme';
import grandecito from '../assets/grandecito.svg';

const ControlSeguridad = ({ enabled, onToggle }) => {
    return (
        <div style={{
            width: '100%',
            height: '125px',
            background: COLORS.AZUL_OSCURO,       // #00214B
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
                background: COLORS.CELESTE_PRINCIPAL,  // #CFDDFC
                borderTopRightRadius: '25px',
                borderBottomRightRadius: '25px',
                display: 'flex',
                alignItems: 'center',
            }}>
                <span style={{
                    fontFamily: TYPOGRAPHY.FONT_FAMILY_PRINCIPAL,
                    fontWeight: TYPOGRAPHY.FONT_WEIGHT_BOLD,
                    fontSize: '16px',
                    color: COLORS.AZUL_OSCURO,
                    whiteSpace: 'nowrap',
                }}>
                    Control seguridad
                </span>
            </div>

            {/* Botón HABILITAR */}
            <button
                onClick={onToggle}
                style={{
                    position: 'absolute',
                    left: '23px',
                    top: '73px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    height: '30px',
                    paddingLeft: '10px',
                    paddingRight: '10px',
                    background: COLORS.CELESTE_PRINCIPAL,
                    borderRadius: '25px',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'opacity 0.2s',
                }}
            >
                {/* Indicador de estado (círculo) */}
                <div style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    background: enabled ? '#2ECC71' : COLORS.AZUL_OSCURO,
                    transition: 'background 0.3s',
                    flexShrink: 0,
                }} />
                <span style={{
                    fontFamily: TYPOGRAPHY.FONT_FAMILY_PRINCIPAL,
                    fontWeight: TYPOGRAPHY.FONT_WEIGHT_BOLD,
                    fontSize: '12px',
                    color: COLORS.AZUL_OSCURO,
                }}>
                    {enabled ? 'DESHABILITAR' : 'HABILITAR'}
                </span>
            </button>

            {/* Robot grandecito */}
            <img
                src={grandecito}
                alt="Robot Pepper"
                style={{
                    width: '222px',
                    height: '156px',
                    position: 'absolute',
                    right: '-10px',
                    top: '-31px',
                    pointerEvents: 'none',
                    objectFit: 'contain',
                }}
            />
        </div>
    );
};

ControlSeguridad.propTypes = {
    enabled: PropTypes.bool.isRequired,
    onToggle: PropTypes.func.isRequired,
};

export default ControlSeguridad;