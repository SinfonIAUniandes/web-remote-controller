//Componente para habilitar o deshabilitar la seguridad del robot
import React from 'react';
import { useRos } from '../contexts/RosContext';
import { createService } from '../services/RosManager';

// Componente para habilitar la seguridad del robot
const SecurityControl = () => {
    const { ros } = useRos(); // Conexión ROS

    //Función para llamar al servicio
    const enableSecurity = () => {
        if (ros) {
            const service = createService(
                ros,
                '/pytoolkit/ALMotion/enable_security_srv',
                'robot_toolkit_msgs/battery_service_srv'
            );

            const request = {}; //No tiene argumentos

            service.callService(request, (result) => {
                console.log('Seguridad habilitada. Respuesta:', result);
            });
        }
    };

    return (
        <div>
            <h2>Control de Seguridad</h2>
            <button onClick={enableSecurity}>Habilitar Seguridad</button>
        </div>
    );
};

export default SecurityControl;