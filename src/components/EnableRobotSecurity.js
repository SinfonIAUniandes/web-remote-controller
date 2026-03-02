import React from 'react';
import { useRos } from '../contexts/RosContext';
import { createService } from '../services/RosManager';

const ENABLED_SECURITY_DISTANCE = 0.4;

// Activa la distancia de seguridad del robot enviando un valor mayor a 0.
const EnableRobotSecurity = () => {
    const { ros } = useRos();

    const enableSecurity = () => {
        if (!ros) {
            console.log('No hay conexión ROS disponible.');
            return;
        }

        const enableSecurityService = createService(
            ros,
            '/pytoolkit/ALMotion/enable_security_srv',
            'robot_toolkit_msgs/battery_service_srv'
        );

        enableSecurityService.callService({}, (result) => {
            console.log('Seguridad habilitada. Respuesta:', result);
        }, (error) => {
            console.log('Fallo enable_security_srv, probando set_security_distance_srv:', error);

            const distanceService = createService(
                ros,
                '/pytoolkit/ALMotion/set_security_distance_srv',
                'robot_toolkit_msgs/set_security_distance_srv'
            );

            const request = { distance: ENABLED_SECURITY_DISTANCE };

            distanceService.callService(request, (distanceResult) => {
                console.log('Distancia de seguridad habilitada. Respuesta:', distanceResult);
            }, (distanceError) => {
                console.error('No fue posible habilitar la seguridad del robot:', distanceError);
            });
        });
    };

    return (
        <div>
            <h2>Activar Distancia de Seguridad</h2>
            <button onClick={enableSecurity}>Habilitar Seguridad</button>
        </div>
    );
};

export default EnableRobotSecurity;
