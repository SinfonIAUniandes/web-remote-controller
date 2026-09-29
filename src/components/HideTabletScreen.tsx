import React from 'react';
import { useRos } from '../contexts/RosContext';
import { createTopic, createService } from '../services/RosManager';
import * as ROSLIB from 'roslib';

//Componente para esconder lo que se ve en la tablet del robot
const HideTabletScreen = () => {
    const { ros } = useRos(); //Acceder a la conexión ROS

    //Función para llamar al servicio y ocultar lo que este en la pantalla
    const hideScreen = () => {
        if (ros) {

            const hideScreenService  = createService(ros, '/pytoolkit/ALTabletService/hide_srv', 'robot_toolkit_msgs/battery_service_srv');

            const hideScreenRequest = {
            };


            //Llamar al servicio
            hideScreenService.callService(hideScreenRequest , (result) => {
                console.log('Pantalla de la tablet oculta. Respuesta del servicio:', result);
            });
        } 
    };

    return (
        <div>
            <h2>Control de la Tablet</h2>
            <button onClick={hideScreen}>Ocultar Pantalla</button>
        </div>
    );
};

export default HideTabletScreen;
