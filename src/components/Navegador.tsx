// src/components/Servicio.js
import React, { useState } from 'react';
import { useRos } from '../contexts/RosContext';
import { createService } from '../services/RosManager';

const Servicio = () => {
    const { ros } = useRos(); // Obtener la instancia de ROS del contexto
    const [url, setUrl] = useState(""); // URL predeterminada para el servicio

    // Función para manejar cambios en el campo de entrada de la URL
    const handleUrlChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setUrl(event.target.value);
    };

    // Función para llamar al servicio ROS para mostrar la URL en la tablet del robot
    const showWebViewOnRobot = () => {
        if (ros) {
            // Crear el servicio de ROS
            const showWebViewService = createService(ros, '/pytoolkit/ALTabletService/show_web_view_srv', 'robot_toolkit_msgs/tablet_service_srv');

            // Crear la solicitud con la URL actual
            const request = { url };

            // Llamar al servicio en el robot
            showWebViewService.callService(request, (result) => {
                console.log('Service called successfully:', result);
            }, (error) => {
                console.error('Error calling service:', error);
            });
        } else {
            console.error('ROS is not connected');
        }
    };

    return (
        <div style={{ textAlign: 'center', margin: '20px' }}>
            <h2>Enviar URL a la Tablet del Robot</h2>
            <input 
                type="text"
                value={url}
                onChange={handleUrlChange}
                placeholder="Ingresa la URL del servicio"
                style={{ width: '60%', padding: '8px', fontSize: '16px', marginBottom: '10px' }}
            />
            <button onClick={showWebViewOnRobot} style={{ padding: '10px 20px', fontSize: '16px', marginLeft: '10px' }}>
                Enviar a la Tablet
            </button>
        </div>
    );
};

export default Servicio;