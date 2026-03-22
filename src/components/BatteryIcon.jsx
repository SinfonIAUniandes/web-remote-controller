import React, { useState, useEffect } from 'react';
import { useRos } from '../contexts/RosContext';
import * as ROSLIB from 'roslib';
import { COLORS, TYPOGRAPHY } from '../theme';

//Componente que permite ver la bateria actual del robot
const BatteryIcon = () => {

    const { ros } = useRos(); //Acceder a la conexión ROS
    const [level, setLevel] = useState(100);

    useEffect(() => {
        if (ros) {
            // Crear el cliente (o suscriptor) del servicio para obtener el nivel de batería
            const batteryService = new ROSLIB.Service({
                ros: ros, // Conexión ROS 
                name: '/pytoolkit/ALBatteryService/get_porcentage', // Nombre del servicio
                serviceType: 'robot_toolkit_msgs/BatteryPercentageService' // Tipo de retorno del servicio ??
            });

            // Crear una solicitud vacía
            const request = new ROSLIB.ServiceRequest({});

            // Llamar al servicio y tener la rta
            batteryService.callService(request, (result) => {
                console.log('Respuesta del servicio de bateria:', result);
                setLevel(Number(result.porcentage)); // Actualizar el nivel de batería
            });
        }
    }, [ros]);
    
    // Validar que el nivel sea un número
    if (typeof level !== 'number' || isNaN(level)) {
        console.warn('BatteryIcon: level debe ser un número');
        return null;
    }
    
    const batteryLevel = Math.min(100, Math.max(0, level));
    
    const getBatteryColor = () => {
        if (batteryLevel <= 30) return COLORS.ROJO;
        if (batteryLevel <= 60) return COLORS.AMARILLO; 
        return COLORS.CELESTE_PRINCIPAL; 
    };

    const fillWidth = (batteryLevel / 100) * 44; // 44 es el ancho total del rectángulo de batería (48 - 4 de margen)

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            width: 'fit-content',
            height: '40px'
        }}>
            {/* Contenedor del SVG de 40x40 */}
            <div style={{
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                <svg
                    width="30"
                    height="30"
                    viewBox="0 0 60 30"
                    xmlns="http://www.w3.org/2000/svg"
                    role="img"
                    aria-label={`Nivel de batería: ${batteryLevel}%`}
                >
                    {/* Cuerpo de la batería */}
                    <rect
                        x="2" y="4" width="48" height="22" rx="4" ry="4"
                        stroke={getBatteryColor()}
                        strokeWidth="2"
                        fill="none"
                    />
                    
                    {/* Nivel de batería */}
                    <rect
                        x="4" y="6"
                        width={fillWidth}
                        height="18"
                        rx="2" ry="2"
                        fill={getBatteryColor()}
                    />
                    
                    {/* Punta positiva */}
                    <rect
                        x="52" y="10" width="4" height="10" rx="1" ry="1"
                        fill={getBatteryColor()}
                    />
                </svg>
            </div>
            
            {/* Porcentaje a la derecha */}
            <span style={{
                fontFamily: TYPOGRAPHY.FONT_FAMILY_PRINCIPAL,
                fontWeight: TYPOGRAPHY.FONT_WEIGHT_BOLD,
                fontSize: '16px',
                color: getBatteryColor(),
                lineHeight: '1',
                minWidth: '45px'
            }}>
                {batteryLevel}%
            </span>
        </div>
    );
};

export default BatteryIcon;