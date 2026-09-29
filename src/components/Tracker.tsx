import { useState } from 'react';
import { useRos } from '../contexts/RosContext';
import { createService } from '../services/RosManager';
import { COLORS } from '../theme';

const Tracker = () => {
    const { ros } = useRos();
    const [enabled, setEnabled] = useState(false);
    const [isHovered, setIsHovered] = useState(false);

    const handleToggle = () => {
        if (!ros) return;

        // Determinamos qué servicio llamar dependiendo de si está encendido o apagado
        const serviceName = enabled 
            ? '/pytoolkit/ALTracker/stop_tracker_srv' 
            : '/pytoolkit/ALTracker/start_tracker_srv';

        const service = createService(
            ros,
            serviceName,
            'robot_toolkit_msgs/battery_service_srv'
        );

        // Ambos servicios reciben un objeto vacío como request
        service.callService({}, (result) => {
            console.log(`Tracker ${enabled ? 'apagado' : 'encendido'}. Respuesta:`, result);
            setEnabled(!enabled); // Invertimos el estado de la interfaz si la llamada fue exitosa
        }, (error) => {
            console.error('Error al cambiar el estado del tracker:', error);
        });
    };

    return (
        <div
            // className="relative h-[130px] w-full max-w-[480px] overflow-hidden rounded-[20px]"
            className="relative h-[130px] w-full overflow-hidden rounded-[20px]"
            style={{ background: COLORS.AZUL_PRINCIPAL }}
        >
            
            {/* Título de la tarjeta */}
            <div
                className="absolute left-0 top-[21px] flex h-[30px] w-[min(180px,90%)] items-center justify-center gap-2.5 overflow-hidden rounded-r-[25px] px-[19px]"
                style={{ background: COLORS.CELESTE_PRINCIPAL }}
            >
                <div
                    className="text-center font-['Nunito'] text-base font-bold"
                    style={{ color: COLORS.AZUL_PRINCIPAL }}
                >
                    Control tracker
                </div>
            </div>

            {/* Botón tipo Switch */}
            <button 
                onClick={handleToggle}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                className={`absolute left-[6%] top-[74px] flex h-[30px] w-[min(230px,calc(100%_-_36px))] items-center justify-between rounded-[25px] border-0 px-2.5 py-[5px] outline-none transition-colors duration-200 ${enabled ? 'flex-row-reverse' : 'flex-row'}`}
                style={{
                    background: isHovered ? COLORS.AZUL_SECUNDARIO : COLORS.CELESTE_PRINCIPAL,
                    cursor: 'pointer',
                }}
            >
                {/* Círculo indicador */}
                <div
                    className="h-5 w-5 shrink-0 rounded-full transition-colors duration-200"
                    style={{
                        background: enabled ? COLORS.VERDE : COLORS.AZUL_PRINCIPAL,
                    }}
                />
                
                {/* Texto dinámico */}
                <div
                    className="min-w-0 flex-1 text-center font-['Nunito'] text-xs font-bold"
                    style={{ color: COLORS.AZUL_PRINCIPAL }}
                >
                    {enabled ? 'APAGAR TRACKER' : 'ENCENDER TRACKER'}
                </div>
            </button>

        </div>
    );
};

export default Tracker;