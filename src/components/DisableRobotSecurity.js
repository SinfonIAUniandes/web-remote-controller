import React from 'react';
import { useRos } from '../contexts/RosContext';
import { createService } from '../services/RosManager';

// Componente para desactivar la distancia de seguridad
const DisableSecurityDistance = () => {
    const { ros } = useRos(); // Conexión ROS

     //Función para llamar al servicio
    const disableDistance = () => {
        if (ros) {
            const service = createService(
                ros,
                '/pytoolkit/ALMotion/set_security_distance_srv',
                'robot_toolkit_msgs/set_security_distance_srv'
            );

            const request = { distance: 0.0 }; //0 para desactivar porq David dice

            service.callService(request, (result) => {
                console.log('Distancia de seguridad desactivada. Respuesta:', result);
            });
        }
    };

    return (
        <div>
            <h2>Desactivar Distancia de Seguridad</h2>
            <button onClick={disableDistance}>Desactivar</button>
        </div>
    );
};

export default DisableSecurityDistance;