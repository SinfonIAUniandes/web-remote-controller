import React, { useState } from 'react';
import { useRos } from '../contexts/RosContext';
import { COLORS, TYPOGRAPHY } from '../theme';
import { createService, callService } from '../services/RosManager';
import agacharse from '../assets/agacharse.svg';
import pararse from '../assets/pararse.svg';

const PostureControl = () => {
    const { ros } = useRos();
    const [isHoveredAgacharse, setIsHoveredAgacharse] = useState(false);
    const [isHoveredPararse, setIsHoveredPararse] = useState(false);

    const handleAgacharse = () => {
        try {
            const service = createService(
                ros,
                '/pytoolkit/ALRobotPosture/go_to_posture_srv',
                'robot_toolkit_msgs/go_to_posture_srv'
            );
            callService(service, { posture: 'Crouch', speed: 0.5 }, (result) => {
                console.log('Agacharse result:', result);
            });
        } catch (e) {
            console.error('Error al agacharse:', e);
        }
    };

    const handlePararse = () => {
        try {
            const service = createService(
                ros,
                '/pytoolkit/ALRobotPosture/go_to_posture_srv',
                'robot_toolkit_msgs/go_to_posture_srv'
            );
            callService(service, { posture: 'Stand', speed: 0.5 }, (result) => {
                console.log('Pararse result:', result);
            });
        } catch (e) {
            console.error('Error al pararse:', e);
        }
    };

    return (
        <div style={{
            width: '560px',
            height: '65px',
            background: COLORS.AZUL_PRINCIPAL,   // ← corregido
            borderRadius: '20px',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            overflow: 'visible',
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
                zIndex: 1,
            }}>
                <span style={{
                    fontFamily: TYPOGRAPHY.FONT_FAMILY_PRINCIPAL,
                    fontWeight: TYPOGRAPHY.FONT_WEIGHT_BOLD,
                    fontSize: '16px',
                    color: COLORS.AZUL_PRINCIPAL,  // ← corregido
                    whiteSpace: 'nowrap',
                }}>
                    Postura de control
                </span>
            </div>

            {/* ── AGACHARSE ── */}
            <div style={{
                position: 'absolute',
                left: '244px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '120px',
                height: '32px',
                overflow: 'visible',
            }}>
                {/* Robot encima del botón */}
                <img
                    src={agacharse}
                    alt="Agacharse"
                    style={{
                        position: 'absolute',
                        width: '57px',
                        height: '60px',
                        left: '-28px',
                        top: '-10px',
                        pointerEvents: 'none',
                        objectFit: 'contain',
                        zIndex: 2,
                    }}
                />
                <button
                    onClick={handleAgacharse}
                    onMouseEnter={() => setIsHoveredAgacharse(true)}
                    onMouseLeave={() => setIsHoveredAgacharse(false)}
                    style={{
                        position: 'relative',
                        zIndex: 1,
                        width: '120px',
                        height: '32px',
                        background: isHoveredAgacharse ? COLORS.AZUL_SECUNDARIO : COLORS.CELESTE_PRINCIPAL,
                        borderRadius: '90px',
                        cursor: 'pointer',
                        fontFamily: TYPOGRAPHY.FONT_FAMILY_PRINCIPAL,
                        fontWeight: TYPOGRAPHY.FONT_WEIGHT_BOLD,
                        fontSize: '12px',
                        color: isHoveredAgacharse ? COLORS.AZUL_PRINCIPAL : COLORS.AZUL_PRINCIPAL,
                        transition: 'background 0.2s, color 0.2s',
                    }}
                >
                    AGACHARSE
                </button>
            </div>

            {/* ── PARARSE ── */}
            <div style={{
                position: 'absolute',
                left: '406px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '120px',
                height: '32px',
                overflow: 'visible',
            }}>
                {/* Robot encima del botón */}
                <img
                    src={pararse}
                    alt="Pararse"
                    style={{
                        position: 'absolute',
                        width: '42px',
                        height: '79px',
                        left: '-20px',
                        top: '-15px',
                        pointerEvents: 'none',
                        objectFit: 'contain',
                        zIndex: 2,
                    }}
                />
                <button
                    onClick={handlePararse}
                    onMouseEnter={() => setIsHoveredPararse(true)}
                    onMouseLeave={() => setIsHoveredPararse(false)}
                    style={{
                        position: 'relative',
                        zIndex: 1,
                        width: '120px',
                        height: '32px',
                        background: isHoveredPararse ? COLORS.AZUL_SECUNDARIO : COLORS.CELESTE_PRINCIPAL,
                        borderRadius: '90px',
                        cursor: 'pointer',
                        fontFamily: TYPOGRAPHY.FONT_FAMILY_PRINCIPAL,
                        fontWeight: TYPOGRAPHY.FONT_WEIGHT_BOLD,
                        fontSize: '12px',
                        color: isHoveredPararse ? COLORS.AZUL_PRINCIPAL : COLORS.AZUL_PRINCIPAL,
                        transition: 'background 0.2s, color 0.2s',
                    }}
                >
                    PARARSE
                </button>
            </div>
        </div>
    );
};

export default PostureControl;