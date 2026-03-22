import React, { useState } from 'react';
import { useRos } from '../contexts/RosContext';
import { COLORS, TYPOGRAPHY } from '../theme';
import { createService } from '../services/RosManager';
import grandecito from '../assets/grandecito.svg';

const ControlSeguridad = () => {
    const { ros } = useRos();
    const [enabled, setEnabled] = useState(false);
    const [isHovered, setIsHovered] = useState(false);

    const handleToggle = () => {
        if (!ros) return;

        if (!enabled) {
            // HABILITAR: enable_security_srv con request vacío {}
            const service = createService(
                ros,
                '/pytoolkit/ALMotion/enable_security_srv',
                'robot_toolkit_msgs/battery_service_srv'
            );
            service.callService({}, (result) => {
                console.log('Seguridad habilitada:', result);
                setEnabled(true);
            }, (error) => console.error('Error habilitando seguridad:', error));
        } else {
            // DESHABILITAR: set_security_distance_srv con { distance: 0.0 }
            const service = createService(
                ros,
                '/pytoolkit/ALMotion/set_security_distance_srv',
                'robot_toolkit_msgs/set_security_distance_srv'
            );
            service.callService({ distance: 0.0 }, (result) => {
                console.log('Seguridad deshabilitada:', result);
                setEnabled(false);
            }, (error) => console.error('Error deshabilitando seguridad:', error));
        }
    };

    return (
        <div style={{ width: '400px', height: '125px', position: 'relative', background: COLORS.AZUL_PRINCIPAL, borderRadius: '25px', overflow: 'hidden' }}>
            <div style={{ width: '180px', height: '30px', paddingLeft: '19px', paddingRight: '19px', left: 0, top: '24px', position: 'absolute', background: COLORS.CELESTE_PRINCIPAL, borderTopRightRadius: '25px', borderBottomRightRadius: '25px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', zIndex: 2 }}>
                <div style={{ color: COLORS.AZUL_PRINCIPAL, fontSize: '16px', fontFamily: TYPOGRAPHY.FONT_FAMILY_PRINCIPAL, fontWeight: '700', textAlign: 'center', wordWrap: 'break-word' }}>Control seguridad</div>
            </div>
            <img src={grandecito} alt="Robot" style={{ width: '222px', height: '156px', left: '193px', top: '-31px', position: 'absolute', pointerEvents: 'none', zIndex: 1 }} />
            <button onClick={handleToggle} onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)} style={{ width: '135px', height: '30px', padding: '5px 10px', left: '23px', top: '73px', position: 'absolute', background: isHovered ? '#8F8AF9' : COLORS.CELESTE_PRINCIPAL, borderRadius: '25px', display: 'flex', flexDirection: enabled ? 'row-reverse' : 'row', justifyContent: 'center', alignItems: 'center', gap: '4px', border: 'none', cursor: 'pointer', transition: 'background 0.2s', zIndex: 2, outline: 'none' }}>
                <div style={{ width: '20px', height: '20px', background: enabled ? '#28DE64' : COLORS.AZUL_PRINCIPAL, borderRadius: '50%', flexShrink: 0, transition: 'background 0.2s' }} />
                <div style={{ width: '88px', height: '13px', color: COLORS.AZUL_PRINCIPAL, fontSize: '12px', fontFamily: TYPOGRAPHY.FONT_FAMILY_PRINCIPAL, fontWeight: '700', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center', wordWrap: 'break-word' }}>
                    {enabled ? 'DESHABILITAR' : 'HABILITAR'}
                </div>
            </button>
        </div>
    );
};

export default ControlSeguridad;