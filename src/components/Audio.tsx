//audio que sirve: http://audio-edge-es6pf.mia.g.radiomast.io/ref-128k-mp3-stereo

import { useState } from 'react';
import { useRos } from '../contexts/RosContext';
import { createService } from '../services/RosManager';

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
        const request = {
            names: audioUrl,  
            stiffnesses: 1.0 
        };

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

        const stopRequest = {};
        stopAudioService.callService(stopRequest, (result) => {
            console.log('Deteniendo audio en el robot:', result);
        }, (error) => {
            console.error('Error al detener el audio:', error);
        });
    };

    return (
        <div className="mx-auto mt-5 flex w-full max-w-2xl flex-col items-center px-4 text-center sm:px-6">
            <h2 className="text-xl font-semibold sm:text-2xl">
                Reproducir audio en el Robot
            </h2>

            {/* Campo para ingresar la URL */}
            <div className="mb-2.5 w-full">
                <label htmlFor="audio-url" className="inline-block">
                    URL del audio:
                </label>
                <input
                    id="audio-url"
                    type="text"
                    value={audioUrl}
                    onChange={(e) => setAudioUrl(e.target.value)}
                    placeholder="Ingrese la URL del audio"
                    className="mt-1.5 block w-full rounded-[5px] border border-[#ccc] p-2 outline-none focus:border-[#007BFF]"
                />
            </div>

            {/* Botones para reproducir y detener audio */}
            <div className="mt-2.5 flex w-full flex-col justify-center gap-2.5 sm:flex-row sm:gap-0">
                <button 
                    onClick={handlePlayUrl} 
                    disabled={!audioUrl.trim() || !audioService}
                    className="cursor-pointer rounded-[5px] border-0 bg-[#007BFF] px-[15px] py-2.5 text-base text-white opacity-100 disabled:cursor-not-allowed disabled:opacity-50 sm:mr-2.5"
                >
                    Reproducir Audio
                </button>

                <button 
                    onClick={handleStopAudio} 
                    disabled={!stopAudioService}
                    className="cursor-pointer rounded-[5px] border-0 bg-[#DC3545] px-[15px] py-2.5 text-base text-white opacity-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    Detener Audio
                </button>
            </div>
        </div>
    );
};

export default RobotAudioControl;