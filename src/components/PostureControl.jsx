import React from 'react';
import PropTypes from 'prop-types';
import { COLORS, TYPOGRAPHY } from '../theme';
import agacharse from '../assets/agacharse.svg';
import pararse from '../assets/pararse.svg';

const PostureControl = ({ onAgacharse, onPararse }) => {
    return (
        <div style={{
            width: '100%',
            height: '65px',
            background: COLORS.AZUL_OSCURO,
            borderRadius: '20px',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
        }}>
            {/* Etiqueta título */}
            <div style={{
                position: 'absolute',
                left: 0,
                top: '17px',
                height: '30px',
                paddingLeft: '19px',
                paddingRight: '19px',
                background: COLORS.CELESTE_PRINCIPAL,
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
                    Postura de control
                </span>
            </div>

            {/* Botón AGACHARSE */}
            <div style={{
                position: 'absolute',
                left: '244px',
                top: '16px',
                width: '120px',
                height: '32px',
            }}>
                <button
                    onClick={onAgacharse}
                    style={{
                        width: '120px',
                        height: '32px',
                        background: COLORS.CELESTE_PRINCIPAL,
                        borderRadius: '90px',
                        border: 'none',
                        cursor: 'pointer',
                        fontFamily: TYPOGRAPHY.FONT_FAMILY_PRINCIPAL,
                        fontWeight: TYPOGRAPHY.FONT_WEIGHT_BOLD,
                        fontSize: '12px',
                        color: COLORS.AZUL_OSCURO,
                        transition: 'opacity 0.2s',
                        position: 'relative',
                        zIndex: 1,
                    }}
                    onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                    onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                >
                    AGACHARSE
                </button>
                {/* Robot agacharse */}
                <img
                    src={agacharse}
                    alt="Agacharse"
                    style={{
                        position: 'absolute',
                        width: '57px',
                        height: '60px',
                        left: '-30px',
                        top: '-3px',
                        pointerEvents: 'none',
                        objectFit: 'contain',
                        zIndex: 0,
                    }}
                />
            </div>

            {/* Botón PARARSE */}
            <div style={{
                position: 'absolute',
                left: '406px',
                top: '16px',
                width: '120px',
                height: '32px',
            }}>
                <button
                    onClick={onPararse}
                    style={{
                        width: '120px',
                        height: '32px',
                        background: COLORS.CELESTE_PRINCIPAL,
                        borderRadius: '90px',
                        border: 'none',
                        cursor: 'pointer',
                        fontFamily: TYPOGRAPHY.FONT_FAMILY_PRINCIPAL,
                        fontWeight: TYPOGRAPHY.FONT_WEIGHT_BOLD,
                        fontSize: '12px',
                        color: COLORS.AZUL_OSCURO,
                        transition: 'opacity 0.2s',
                        position: 'relative',
                        zIndex: 1,
                    }}
                    onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                    onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                >
                    PARARSE
                </button>
                {/* Robot pararse */}
                <img
                    src={pararse}
                    alt="Pararse"
                    style={{
                        position: 'absolute',
                        width: '42px',
                        height: '79px',
                        left: '-21px',
                        top: '-20px',
                        pointerEvents: 'none',
                        objectFit: 'contain',
                        zIndex: 0,
                    }}
                />
            </div>
        </div>
    );
};

PostureControl.propTypes = {
    onAgacharse: PropTypes.func.isRequired,
    onPararse: PropTypes.func.isRequired,
};

export default PostureControl;