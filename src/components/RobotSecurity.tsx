import React from 'react';
import { useRos } from '../contexts/RosContext';
import { createTopic, createService } from '../services/RosManager';
import * as ROSLIB from 'roslib';

//Componente para habilitar o deshabilitar la seguridad del robot
const SecurityControl = () => {
    const {ros} = useRos(); //Conexión ROS

    //Función para llamar al servicio
    const toggleSecurity = (enable: boolean) => {
        if (ros) {
            const service = createService(ros,'/pytoolkit/ALMotion/enable_security_srv','robot_toolkit_msgs/battery_service_srv');

            //Crear la solicitud con el valor true/false para activar/desactivar -> NO PORQ NO PIDE NADA DE ARGUMENTO
            const request = {};

            //Llamar al servicio
            service.callService(request, (result) => {
                console.log(`Seguridad ${enable ? 'habilitada' : 'deshabilitada'}. Respuesta:`, result);
            });
        } 
    };

    return (
        <div>
            <h2>Control de Seguridad</h2>
            <button onClick={() => toggleSecurity(true)}>Habilitar Seguridad</button>
            <button onClick={() => toggleSecurity(false)}>Deshabilitar Seguridad</button>
        </div>
    );
};

export default SecurityControl;
