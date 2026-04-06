import React, { useState } from 'react';
import { useRos } from '../contexts/RosContext';
import { createService } from '../services/RosManager';

const AutonomousLife = () => {
    const { ros } = useRos();
    const [enabled, setEnabled] = useState(false);
    const [isHovered, setIsHovered] = useState(false);

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
        <div style={{width: '480px', height: '130px', position: 'relative', background: '#00214B', overflow: 'hidden', borderRadius: 20}}>
            
            {/* Título de la tarjeta */}
            <div style={{width: 180, height: 30, paddingLeft: 19, paddingRight: 19, left: 0, top: 21, position: 'absolute', background: '#CFDDFC', overflow: 'hidden', borderTopRightRadius: 25, borderBottomRightRadius: 25, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10}}>
                <div style={{color: '#00214B', fontSize: 16, fontFamily: 'Nunito', fontWeight: '700', textAlign: 'center', wordWrap: 'break-word'}}>
                    Modo autónomo
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
                    flexDirection: enabled ? 'row-reverse' : 'row', // Invierte la posición de la bolita
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
                    background: enabled ? '#28DE64' : '#00214B', // Verde si está activo, Azul oscuro si no
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
                    {enabled ? 'DESACTIVAR VIDA AUTÓNOMA' : 'ACTIVAR VIDA AUTÓNOMA'}
                </div>
            </button>

        </div>
    );
};

export default AutonomousLife;