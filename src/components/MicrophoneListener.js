import React, { useEffect, useRef, useState } from 'react';
import { useRos } from '../contexts/RosContext';

// Las funciones para crear topics y servicios
import { createTopic, createService } from '../services/RosManager';

const AudioPlayer = () => {
    const { ros } = useRos();
    const [audioContext, setAudioContext] = useState(null);
    const [audioSource, setAudioSource] = useState(null); // Guardamos la fuente de audio
    const [isPlaying, setIsPlaying] = useState(false); // Estado para saber si el audio está sonando

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
                if (audioSource) {
                    audioSource.stop(); // Detenemos la reproducción si es que existe un source activo
                }
                if (audioContext) {
                    audioContext.close(); // Cerramos el contexto de audio si está abierto
                }
            };
        }
    }, [ros, audioSource, audioContext]);

    // Función para reproducir audio desde el mensaje de ROS
    function playAudioFromROSMessage(data, frequency) {
        // Crear el contexto de audio si no existe
        if (!audioContext) {
            const context = new (window.AudioContext || window.webkitAudioContext)();
            setAudioContext(context);
        }

        // Crear el buffer de audio
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
        setAudioSource(source); // Guardamos la fuente para poder detenerla más tarde
        setIsPlaying(true); // Marcamos que el audio está sonando
    }

    // Función para detener la reproducción del audio
    function stopAudio() {
        if (audioSource) {
            audioSource.stop(); // Detenemos la fuente de audio
            setIsPlaying(false); // Actualizamos el estado
            setAudioSource(null); // Limpiamos la referencia del source
        }
        if (audioContext) {
            audioContext.close(); // Cerramos el contexto de audio
            setAudioContext(null); // Limpiamos el contexto
        }
    }

    return (
        <div>
            <h1>Audio Player</h1>
            <div>
                <h2>Listening to Microphone Audio</h2>
                <button onClick={stopAudio} disabled={!isPlaying}>
                    Stop Audio
                </button>
            </div>
        </div>
    );
};

export default AudioPlayer;
