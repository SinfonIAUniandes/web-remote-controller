import React, { useState } from 'react';
import { useRos } from '../contexts/RosContext';
import * as ROSLIB from 'roslib';

const ShowWordsTablet = () => {
    const { ros } = useRos();

    const fetchTabletText = () => {
        if (ros) {
            const service = new ROSLIB.Service({
                ros: ros,
                name: '/pytoolkit/ALTabletService/show_words_srv',
                serviceType: 'robot_toolkit_msgs/battery_service_srv', 
            });

            const request = {}; //no args

            service.callService(request, (result) => {

            });
        }
    };

    return (
        <div>
            <h2>Texto en la Tablet</h2>
            <button onClick={fetchTabletText}>Mostrar texto en pantalla</button>
        </div>
    );
};

export default ShowWordsTablet;
