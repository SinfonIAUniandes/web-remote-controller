import { useEffect } from 'react';
import type { CSSProperties } from 'react';
import { useRos } from '../contexts/RosContext';
import { COLORS, TYPOGRAPHY } from '../theme';
import { createService, callService } from '../services/RosManager';
import agacharse from '../assets/agacharse.svg';
import pararse from '../assets/pararse.svg';

// Variables CSS alimentadas desde COLORS/TYPOGRAPHY para usarlas en clases de Tailwind
const themeVars = {
    '--azul': COLORS.AZUL_PRINCIPAL,
    '--celeste': COLORS.CELESTE_PRINCIPAL,
    '--azul-sec': COLORS.AZUL_SECUNDARIO,
    '--font': TYPOGRAPHY.FONT_FAMILY_PRINCIPAL,
} as CSSProperties;

const PostureControl = () => {
    const { ros } = useRos();
    const postureService = ros
        ? createService(
            ros,
            '/pytoolkit/ALRobotPosture/go_to_posture_srv',
            'robot_toolkit_msgs/go_to_posture_srv'
        )
        : null;

    useEffect(() => {
        if (ros) {
            console.log('Servicio de postura disponible.');
        }
    }, [ros]);

    const handleAgacharse = () => {
        if (!postureService) {
            console.error('No hay conexión con ROS.');
            return;
        }

        try {
            callService(postureService, { posture: 'rest' }, (result) => {
                console.log('Agacharse result:', result);
            });
        } catch (e) {
            console.error('Error al agacharse:', e);
        }
    };

    const handlePararse = () => {
        if (!postureService) {
            console.error('No hay conexión con ROS.');
            return;
        }

        try {
            callService(postureService, { posture: 'stand' }, (result) => {
                console.log('Pararse result:', result);
            });
        } catch (e) {
            console.error('Error al pararse:', e);
        }
    };

    return (
        // <div style={themeVars} className="relative w-[560px] max-w-full overflow-visible rounded-[20px] bg-[var(--azul)]">
        <div style={themeVars} className="relative max-w-full overflow-visible rounded-[20px] bg-[var(--azul)]">
            {/* Etiqueta título */}
            <div className="absolute left-0 top-[17px] z-[1] flex h-[30px] items-center rounded-r-[25px] bg-[var(--celeste)] px-[19px]">
                <span className="whitespace-nowrap text-base font-bold text-[var(--azul)] font-[family-name:var(--font)]">
                    Postura de control
                </span>
            </div>

            {/* Botones: en fila desde 560px (posiciones originales), apilados/envueltos en pantallas pequeñas */}
            <div className="flex min-h-[65px] flex-wrap items-center justify-center gap-x-[42px] gap-y-[22px] px-7 pb-4 pt-[62px] min-[560px]:justify-start min-[560px]:py-[16.5px] min-[560px]:pl-[244px] min-[560px]:pr-0">
                {/* ── AGACHARSE ── */}
                <div className="relative h-8 w-[120px] overflow-visible">
                    {/* Robot encima del botón */}
                    <img
                        src={agacharse}
                        alt="Agacharse"
                        className="pointer-events-none absolute -left-7 -top-2.5 z-[2] h-[60px] w-[57px] max-w-none object-contain"
                    />
                    <button onClick={handleAgacharse} className="h-8 w-[120px] relative z-[1] cursor-pointer rounded-[90px] bg-[var(--celeste)] text-xs font-bold text-[var(--azul)] transition-colors duration-200 ease-[ease] font-[family-name:var(--font)] hover:bg-[var(--azul-sec)]">
                        AGACHARSE
                    </button>
                </div>

                {/* ── PARARSE ── */}
                <div className="relative h-8 w-[120px] overflow-visible">
                    {/* Robot encima del botón */}
                    <img
                        src={pararse}
                        alt="Pararse"
                        className="pointer-events-none absolute -left-5 -top-[15px] z-[2] h-[79px] w-[42px] max-w-none object-contain"
                    />
                    <button onClick={handlePararse} className="h-8 w-[120px] relative z-[1] cursor-pointer rounded-[90px] bg-[var(--celeste)] text-xs font-bold text-[var(--azul)] transition-colors duration-200 ease-[ease] font-[family-name:var(--font)] hover:bg-[var(--azul-sec)]">
                        PARARSE
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PostureControl;
