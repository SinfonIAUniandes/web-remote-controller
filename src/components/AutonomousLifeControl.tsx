import React from 'react';
import { useRos } from '../contexts/RosContext';
import * as ROSLIB from 'roslib';

//Componente para encender/apagar la vida autónoma del robot
const AutonomousLifeControl = () => {
    const { ros } = useRos(); //Acceder a la conexión ROS

    //Función para llamar al servicio y cambiar el estado de la vida autónoma
    const toggleAutonomousLife = (enable: boolean) => {
        if (ros) {
            const service = new ROSLIB.Service({
                ros: ros,
                name: '/pytoolkit/ALAutonomousLife/set_state_srv', // Nombre del servicio
                serviceType: 'std_srvs/SetBool', // Tipo de mensaje (verificar si aplica)
            });

            //Crear la solicitud con el valor true/false para activar/desactivar
            const request = {
                data: enable, //true para activar, false para desactivar
            };

            // Llamar al servicio
            service.callService(request, (result) => {
                console.log(`Vida autónoma ${enable ? 'activada' : 'desactivada'}. Respuesta:`, result);
            });
        }
    };

    return (
        <div>
            <h2>Control de Vida Autónoma</h2>
            <button onClick={() => toggleAutonomousLife(true)}>Activar Vida Autónoma</button>
            <button onClick={() => toggleAutonomousLife(false)}>Desactivar Vida Autónoma</button>
        </div>
    );
};

export default AutonomousLifeControl;
