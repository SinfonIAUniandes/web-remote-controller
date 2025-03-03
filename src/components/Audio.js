//audio que sirve: http://audio-edge-es6pf.mia.g.radiomast.io/ref-128k-mp3-stereo

import React, { useState } from 'react';
import { useRos } from '../contexts/RosContext';
import { createService } from '../services/RosManager';
import * as ROSLIB from 'roslib';

const RobotAudioControl = () => {
    const { ros } = useRos();
    const [audioUrl, setAudioUrl] = useState("");

    // Servicios de ROS para reproducir y detener audio
    const audioService = ros 
        ? createService(ros, '/pytoolkit/ALAudioPlayer/play_audio_stream_srv','/robot_toolkit_msgs/set_stiffnesses_sev')
        : null;

    const stopAudioService = ros 
        ? createService(ros, '/pytoolkit/ALAudioPlayer/stop_audio_stream_srv', 'std_srvs/Empty') // SIN PARÁMETROS
        : null;

    // Enviar URL de audio al robot
    const handlePlayUrl = () => {
        if (!audioUrl.trim()) {
            alert("Ingrese una URL de audio válida.");
            return;
        }

        if (!audioService) {
            alert("Error: No hay conexión con ROS.");
            return;
        }

        // Crear mensaje ROS con la URL del audio
        const request = new ROSLIB.ServiceRequest({
            names: audioUrl,  
            stiffnesses: 1.0 
        });

        // Enviar mensaje ROS al servicio
        audioService.callService(request, (result) => {
            console.log('Reproduciendo audio en el robot desde URL:', result);
        }, (error) => {
            console.error('Error al reproducir el audio desde URL:', error);
        });
    };

    // Detener audio en el robot (SIN PARÁMETROS)
    const handleStopAudio = () => {
        if (!stopAudioService) {
            alert("Error: No hay conexión con ROS.");
            return;
        }

        const stopRequest = new ROSLIB.ServiceRequest({});
        stopAudioService.callService(stopRequest, (result) => {
            console.log('Deteniendo audio en el robot:', result);
        }, (error) => {
            console.error('Error al detener el audio:', error);
        });
    };

    return (
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <h2>Reproducir audio en el Robot</h2>

            {/* Campo para ingresar la URL */}
            <div style={{ marginBottom: '10px' }}>
                <label>URL del audio:</label>
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

            {/* Botones para reproducir y detener audio */}
            <div style={{ marginTop: '10px' }}>
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
                        marginRight: '10px',
                        opacity: !audioUrl.trim() || !audioService ? 0.5 : 1
                    }}
                >
                    Reproducir Audio
                </button>

                <button 
                    onClick={handleStopAudio} 
                    disabled={!stopAudioService}
                    style={{
                        padding: '10px 15px',
                        fontSize: '16px',
                        backgroundColor: '#DC3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: 'pointer',
                        opacity: !stopAudioService ? 0.5 : 1
                    }}
                >
                    Detener Audio
                </button>
            </div>
        </div>
    );
};

export default RobotAudioControl;