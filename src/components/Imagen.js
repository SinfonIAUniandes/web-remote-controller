// src/components/ServicioImagen.js
import React, { useState } from 'react';
import { useRos } from '../contexts/RosContext';
import { createService } from '../services/RosManager';

const ServicioImagen = () => {
    const { ros } = useRos();
    const [url, setUrl] = useState('');
    const handleUrlChange = (event) => {
        setUrl(event.target.value);
    };

    const sendUrlToTablet = async () => {
        if (!ros) {
            console.error('ROS is not connected');
            return;
        }

        // Usamos show_image para enviar imágenes desde URLs
        const showImageService = createService(ros, '/pytoolkit/ALTabletService/show_image_srv', 'robot_toolkit_msgs/tablet_service_srv');

        const request = { url };

        showImageService.callService(request, (result) => {
            console.log('URL sent to tablet successfully:', result);
        }, (error) => {
            console.error('Error calling service:', error);
        });
    };

    return (
        <div style={{ textAlign: 'center' }}>
            <h2>Servicio para Enviar Imagen a la Tablet del Robot</h2>
            <input
                type="text"
                value={url}
                onChange={handleUrlChange}
                placeholder="Ingresa la URL de la imagen"
                style={{ width: '60%', padding: '8px', fontSize: '16px', marginBottom: '10px' }}
            />
            <button onClick={sendUrlToTablet} style={{ padding: '10px 20px', fontSize: '16px', marginLeft: '10px' }}>
                Enviar URL a la Tablet
            </button>
        </div>
    );
};

export default ServicioImagen;