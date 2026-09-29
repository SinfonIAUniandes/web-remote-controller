import React, { useState } from 'react';
import { useRos } from '../contexts/RosContext';
import { createService } from '../services/RosManager';
import { COLORS } from '../theme';

const TabletVisibility = () => {
    const { ros } = useRos();
    const [isVisible, setIsVisible] = useState(false); // Asumimos que arranca oculta (False)
    const [isHovered, setIsHovered] = useState(false);

    const handleToggle = () => {
        if (!ros) return;

        if (isVisible) {
            // Lógica para OCULTAR (cuando estaba encendida y la apagan)
            const service = createService(
                ros,
                '/pytoolkit/ALTabletService/hide_srv',
                'robot_toolkit_msgs/battery_service_srv'
            );

            service.callService({}, (result) => {
                console.log('Pantalla de la tablet oculta. Respuesta:', result);
                setIsVisible(false); // Actualizamos la interfaz
            }, (error) => {
                console.error('Error al ocultar la tablet:', error);
            });
        } else {
            // Lógica para ENCENDER / MOSTRAR (cuando estaba oculta y la encienden)
            // TODO: Reemplazar con tu servicio de ROS para mostrar contenido
            console.log('Ejecutando acción para encender visibilidad...');
            setIsVisible(true); 
        }
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
                    Visibilidad tablet
                </div>
            </div>

            {/* Botón tipo Switch */}
            <button 
                onClick={handleToggle}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                className={`absolute left-[6%] top-[74px] flex h-[30px] w-[min(230px,calc(100%_-_36px))] items-center justify-between rounded-[25px] border-0 px-2.5 py-[5px] outline-none transition-colors duration-200 ${isVisible ? 'flex-row-reverse' : 'flex-row'}`}
                style={{
                    background: isHovered ? COLORS.AZUL_SECUNDARIO : COLORS.CELESTE_PRINCIPAL,
                    cursor: 'pointer',
                }}
            >
                {/* Círculo indicador */}
                <div
                    className="h-5 w-5 shrink-0 rounded-full transition-colors duration-200"
                    style={{
                        background: isVisible ? COLORS.VERDE : COLORS.AZUL_PRINCIPAL,
                    }}
                />
                
                {/* Texto dinámico */}
                <div
                    className="min-w-0 flex-1 text-center font-['Nunito'] text-xs font-bold"
                    style={{ color: COLORS.AZUL_PRINCIPAL }}
                >
                    {isVisible ? 'OCULTAR PANTALLA' : 'ENCENDER VISIBILIDAD'}
                </div>
            </button>

        </div>
    );
};

export default TabletVisibility;