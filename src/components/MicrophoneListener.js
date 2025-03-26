import React, { useEffect, useRef } from 'react';
import { useRos } from '../contexts/RosContext';

// Las funciones para crear topics y servicios
import { createTopic, createService } from '../services/RosManager';

const AudioPlayer = () => {
    const { ros } = useRos();
    const audioRef = useRef(null); // Referencia para el elemento de audio

    useEffect(() => {
        if (ros) {
            // Crear el topic para escuchar el audio del micrófono
            const microphoneListener = createTopic(ros, '/mic', 'naoqi_bridge_msgs/AudioBuffer');
            
            // Suscribirse al topic de micrófono
            microphoneListener.subscribe((message) => {
                playAudioFromROSMessage(message.data, message.frequency);
            });

            // Crear el servicio para habilitar herramientas de audio
            const enableAudioService = createService(ros, '/robot_toolkit/audio_tools_srv', 'robot_toolkit_msgs/audio_tools_msg');
            
            // Petición para habilitar TTS (Texto a voz)
            const enableTTSRequest = {
                data: {
                    command: "enable_tts"
                }
            };
            
            enableAudioService.callService(enableTTSRequest, (result) => {
                console.log('Service called for TTS:', result);
            });

            // Petición para habilitar audio personalizado
            const customAudioRequest = {
                data: {
                    command: "custom",
                    frequency: 48000,
                    channels: 3
                }
            };
            
            enableAudioService.callService(customAudioRequest, (result) => {
                console.log('Service called for custom audio configuration:', result);
            });

            // Cleanup al desmontar el componente
            return () => {
                microphoneListener.unsubscribe();
            };
        }
    }, [ros]);

    // Función para reproducir audio desde el mensaje de ROS
    function playAudioFromROSMessage(data, frequency) {
        // Crear el buffer de audio
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const audioBuffer = audioContext.createBuffer(1, data.length, frequency);
        const channel = audioBuffer.getChannelData(0);

        // Normalizar los datos
        for (let i = 0; i < data.length; i++) {
            channel[i] = data[i] / 32768.0; // Normalización de valores int16 a flotante (-1.0 a 1.0)
        }

        // Crear y reproducir el source
        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContext.destination);
        source.start();
    }

    return (
        <div>
            <h1>Audio Player</h1>
            <div>
                <h2>Listening to Microphone Audio</h2>
            </div>
        </div>
    );
};

export default AudioPlayer;
