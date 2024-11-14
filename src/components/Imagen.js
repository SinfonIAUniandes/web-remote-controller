import React, { useState } from 'react';
import { useRos } from '../contexts/RosContext';
import { createService } from '../services/RosManager';

const ServicioImagen = () => {
    const { ros } = useRos();
    const [url, setUrl] = useState('');
    const [file, setFile] = useState(null);

    // Maneja cambios en el campo de texto para la URL
    const handleUrlChange = (event) => {
        setUrl(event.target.value);
        setFile(null); // Limpia el archivo si se usa URL
    };

    // Maneja la carga de un archivo
    const handleFileChange = (event) => {
        const selectedFile = event.target.files[0];
        setFile(selectedFile);
        setUrl(''); // Limpia la URL si se usa archivo
    };

    // Convierte el archivo de imagen a base64 para enviar
    const convertFileToBase64 = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result.split(',')[1]); // Solo la base64 sin el prefijo
            reader.onerror = (error) => reject(error);
        });
    };

    // Llama al servicio para mostrar la imagen en la tablet
    const sendImageToTablet = async () => {
        if (!ros) {
            console.error('ROS is not connected');
            return;
        }

        const showImageService = createService(ros, '/pytoolkit/ALTabletService/show_web_view_srv', 'robot_toolkit_msgs/tablet_service_srv');

        let imageData = url;

        if (file) {
            try {
                imageData = await convertFileToBase64(file);
            } catch (error) {
                console.error('Error converting file to base64:', error);
                return;
            }
        }

        const request = { url: imageData };

        showImageService.callService(request, (result) => {
            console.log('Image sent to tablet successfully:', result);
        }, (error) => {
            console.error('Error calling service:', error);
        });
    };

    return (
        <div style={{ textAlign: 'center', margin: '20px' }}>
            <h2>Servicio para Enviar Imagen a la Tablet del Robot</h2>
            <input
                type="text"
                value={url}
                onChange={handleUrlChange}
                placeholder="Ingresa la URL de la imagen"
                style={{ width: '60%', padding: '8px', fontSize: '16px', marginBottom: '10px' }}
            />
            <p>O</p>
            <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                style={{ marginBottom: '10px' }}
            />
            <button onClick={sendImageToTablet} style={{ padding: '10px 20px', fontSize: '16px', marginLeft: '10px' }}>
                Enviar Imagen a la Tablet
            </button>
        </div>
    );
};

export default ServicioImagen;