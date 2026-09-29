import React, { useState } from 'react';
import { useRos } from '../contexts/RosContext';
import { COLORS, TYPOGRAPHY } from '../theme';
import { createService } from '../services/RosManager';
import grandecito from '../assets/grandecito.svg';

// Variables CSS alimentadas desde COLORS/TYPOGRAPHY para usarlas en clases de Tailwind
const themeVars = {
    '--azul': COLORS.AZUL_PRINCIPAL,
    '--celeste': COLORS.CELESTE_PRINCIPAL,
    '--azul-sec': COLORS.AZUL_SECUNDARIO,
    '--verde': COLORS.VERDE,
    '--font': TYPOGRAPHY.FONT_FAMILY_PRINCIPAL,
} as React.CSSProperties;

const ControlSeguridad = () => {
    const { ros } = useRos();
    const [enabled, setEnabled] = useState(false);

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
        <div style={themeVars} className="relative h-[125px] w-[400px] max-w-full overflow-hidden rounded-[25px] bg-[var(--azul)]">
            <div className="absolute left-0 top-6 z-[2] flex h-[30px] w-[min(180px,90%)] items-center justify-center gap-2.5 bg-[var(--celeste)] px-[19px] rounded-r-[25px]">
                <div className="break-words text-center text-base font-bold text-[var(--azul)] font-[family-name:var(--font)]">Control seguridad</div>
            </div>
            <img src={grandecito} alt="Robot" className="pointer-events-none absolute -right-[15px] -top-[31px] z-[1] h-[156px] w-[222px] max-w-none" />
            <button
                onClick={handleToggle}
                className={`absolute left-[23px] top-[73px] z-[2] flex h-[30px] w-[135px] cursor-pointer items-center justify-center gap-1 rounded-[25px] border-none bg-[var(--celeste)] px-2.5 py-[5px] outline-none transition-colors duration-200 ease-[ease] hover:bg-[var(--azul-sec)] ${enabled ? 'flex-row-reverse' : 'flex-row'}`}
            >
                <div className={`h-5 w-5 shrink-0 rounded-full transition-colors duration-200 ease-[ease] ${enabled ? 'bg-[var(--verde)]' : 'bg-[var(--azul)]'}`} />
                <div className="flex h-[13px] w-[88px] flex-col justify-center break-words text-center text-xs font-bold text-[var(--azul)] font-[family-name:var(--font)]">
                    {enabled ? 'DESHABILITAR' : 'HABILITAR'}
                </div>
            </button>
        </div>
    );
};

export default ControlSeguridad;