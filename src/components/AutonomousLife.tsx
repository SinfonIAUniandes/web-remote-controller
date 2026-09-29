import React, { useState } from 'react';
import { useRos } from '../contexts/RosContext';
import { createService } from '../services/RosManager';
import { COLORS } from '../theme';

// Variables CSS alimentadas desde COLORS para usarlas en clases de Tailwind
const themeVars = {
    '--azul': COLORS.AZUL_PRINCIPAL,
    '--celeste': COLORS.CELESTE_PRINCIPAL,
    '--azul-sec': COLORS.AZUL_SECUNDARIO,
    '--verde': COLORS.VERDE,
} as React.CSSProperties;

const AutonomousLife = () => {
    const { ros } = useRos();
    const [enabled, setEnabled] = useState(false);

    const handleToggle = () => {
        if (!ros) return;

        const service = createService(
            ros,
            '/pytoolkit/ALAutonomousLife/set_state_srv', // Nombre del servicio
            'std_srvs/SetBool' // Tipo de mensaje
        );

        // Invertimos el estado actual para la solicitud
        const newState = !enabled;

        // Crear la solicitud con el valor true/false
        service.callService({ data: newState }, (result) => {
            console.log(`Vida autónoma ${newState ? 'activada' : 'desactivada'}. Respuesta:`, result);
            setEnabled(newState); // Actualizamos la interfaz solo si tuvo éxito (o asincrónicamente al llamar)
        }, (error) => {
            console.error('Error al cambiar el estado de vida autónoma:', error);
        });
    };

    return (
        <div
            className="relative h-[130px] w-full overflow-hidden rounded-[20px] bg-[var(--azul)]"
            style={themeVars}
        >
            
            {/* Título de la tarjeta */}
            <div
                className="absolute left-0 top-[21px] flex h-[30px] w-[min(180px,90%)] items-center justify-center gap-2.5 overflow-hidden rounded-r-[25px] bg-[var(--celeste)] px-[19px]"
            >
                <div
                    className="text-center font-['Nunito'] text-base font-bold text-[var(--azul)]"
                >
                    Modo autónomo
                </div>
            </div>

            {/* Botón tipo Switch */}
            <button 
                onClick={handleToggle}
                className={`absolute left-[6%] top-[74px] flex h-[30px] w-[min(230px,calc(100%_-_36px))] cursor-pointer items-center justify-between rounded-[25px] border-0 bg-[var(--celeste)] px-2.5 py-[5px] outline-none transition-colors duration-200 hover:bg-[var(--azul-sec)] ${enabled ? 'flex-row-reverse' : 'flex-row'}`}
            >
                {/* Círculo indicador */}
                <div
                    className={`h-5 w-5 shrink-0 rounded-full transition-colors duration-200 ${enabled ? 'bg-[var(--verde)]' : 'bg-[var(--azul)]'}`}
                />
                
                {/* Texto dinámico */}
                <div
                    className="min-w-0 flex-1 text-center font-['Nunito'] text-xs font-bold text-[var(--azul)]"
                >
                    {enabled ? 'DESACTIVAR VIDA AUTÓNOMA' : 'ACTIVAR VIDA AUTÓNOMA'}
                </div>
            </button>

        </div>
    );
};

export default AutonomousLife;