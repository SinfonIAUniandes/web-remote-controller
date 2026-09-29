import { useState } from 'react';
import { useRos } from '../contexts/RosContext';
import * as ROSLIB from 'roslib';

const TrackerControl = () => {
    const { ros } = useRos();
    const [trackerState, setTrackerState] = useState("Tracker apagado") //Para que se sepa si esta prendido o apagado

    const toggleTracker = (enable: boolean) => {
        if (ros) {
            const service = new ROSLIB.Service({
                ros: ros,
                name: enable ? '/pytoolkit/ALTracker/start_tracker_srv' : '/pytoolkit/ALTracker/stop_tracker_srv', //nombre servicio dependiendo de lo que se quiera hacer
                serviceType: 'robot_toolkit_msgs/battery_service_srv', //msg type
            });

            const request = {}; //sin argumentos

            service.callService(request, (result) => {
                console.log(`Tracker ${enable ? 'encendido' : 'apagado'}. Respuesta:`, result);
                setTrackerState(enable ? "Tracker encendido" : "Tracker apagado");
            });
        }
    };

    return (
        <div>
            <h2>Control del Tracker</h2>
            <p>Estado actual: {trackerState}</p>
            <button onClick={() => toggleTracker(true)}>Encender Tracker</button>
            <button onClick={() => toggleTracker(false)}>Apagar Tracker</button>
        </div>
    );
};

export default TrackerControl;
