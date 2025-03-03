import React, { useState } from 'react';
import { useRos } from '../contexts/RosContext';
import { createService } from '../services/RosManager';
import * as ROSLIB from 'roslib';

const RobotAudioControl = () => {
    const { ros } = useRos();
    const [audioUrl, setAudioUrl] = useState("");

    // Verificamos que ROS esté disponible antes de crear el servicio
    const audioService = ros ? createService(ros, '/pytoolkit/ALAudio', 'robot_toolkit_msgs/audio_tools_srv') : null;

    // Enviar URL de audio al robot
    const handlePlayUrl = () => {
        if (!audioUrl.trim()) {
            alert("Ingrese una URL de audio.");
            return;
        }

        if (!audioService) {
            alert("Error: No hay conexión con ROS.");
            return;
        }

        // Crear mensaje ROS con la URL
        const message = new ROSLIB.Message({
            command: "player/play_audio",
            url: audioUrl
        });

        // Enviar mensaje ROS al servicio
        audioService.callService(message, (result) => {
            console.log('Reproduciendo audio en el robot desde URL:', result);
        }, (error) => {
            console.error('Error al reproducir el audio desde URL:', error);
        });
    };

    return (
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <h2>🎵 Reproducir Audio en el Robot</h2>

            {/* Campo para ingresar la URL */}
            <div style={{ marginBottom: '10px' }}>
                <label>🔗 URL del audio:</label>
                <br />
                <input
                    type="text"
                    value={audioUrl}
                    onChange={(e) => setAudioUrl(e.target.value)}
                    placeholder="Ingrese la URL del audio"
                    style={{
                        width: '60%',
                        padding: '8px',
                        marginTop: '5px',
                        borderRadius: '5px',
                        border: '1px solid #ccc',
                    }}
                />
            </div>

            {/* Botón para reproducir el audio */}
            <button 
                onClick={handlePlayUrl} 
                disabled={!audioUrl.trim() || !audioService}
                style={{
                    padding: '10px 15px',
                    fontSize: '16px',
                    backgroundColor: '#007BFF',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    marginTop: '10px',
                    opacity: !audioUrl.trim() || !audioService ? 0.5 : 1
                }}
            >
                ▶ Reproducir Audio
            </button>
        </div>
    );
};

export default RobotAudioControl;