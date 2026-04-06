import React, { useState } from 'react';
import { useRos } from '../contexts/RosContext';
import { createService } from '../services/RosManager';

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
        <div style={{width: '480px', height: '130px', position: 'relative', background: '#00214B', overflow: 'hidden', borderRadius: 20}}>
            
            {/* Título de la tarjeta */}
            <div style={{width: 180, height: 30, paddingLeft: 19, paddingRight: 19, left: 0, top: 21, position: 'absolute', background: '#CFDDFC', overflow: 'hidden', borderTopRightRadius: 25, borderBottomRightRadius: 25, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10}}>
                <div style={{color: '#00214B', fontSize: 16, fontFamily: 'Nunito', fontWeight: '700', textAlign: 'center', wordWrap: 'break-word'}}>
                    Visibilidad tablet
                </div>
            </div>

            {/* Botón tipo Switch */}
            <button 
                onClick={handleToggle}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                style={{
                    width: 230, 
                    height: 30, 
                    padding: '5px 10px', 
                    left: 29, 
                    top: 74, 
                    position: 'absolute', 
                    background: isHovered ? '#8F8AF9' : '#CFDDFC', 
                    borderRadius: 25, 
                    display: 'flex', 
                    flexDirection: isVisible ? 'row-reverse' : 'row', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    border: 'none', 
                    cursor: 'pointer', 
                    transition: 'background 0.2s', 
                    outline: 'none'
                }}
            >
                {/* Círculo indicador */}
                <div style={{ 
                    width: 20, 
                    height: 20, 
                    background: isVisible ? '#28DE64' : '#00214B', 
                    borderRadius: '50%', 
                    flexShrink: 0, 
                    transition: 'background 0.2s' 
                }} />
                
                {/* Texto dinámico */}
                <div style={{ 
                    flex: 1, 
                    textAlign: 'center', 
                    color: '#00214B', 
                    fontSize: 12, 
                    fontFamily: 'Nunito', 
                    fontWeight: '700', 
                    wordWrap: 'break-word' 
                }}>
                    {isVisible ? 'OCULTAR PANTALLA' : 'ENCENDER VISIBILIDAD'}
                </div>
            </button>

        </div>
    );
};

export default TabletVisibility;