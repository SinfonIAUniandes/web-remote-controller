import { useState } from 'react';
import { useRos } from '../contexts/RosContext';
import { createService } from '../services/RosManager';
import { COLORS } from '../theme';

const AudioService = () => {
    const { ros } = useRos();
    const [audioUrl, setAudioUrl] = useState("");
    const [isHoveredPlay, setIsHoveredPlay] = useState(false);
    const [isHoveredStop, setIsHoveredStop] = useState(false);

    // Servicios de ROS para reproducir y detener audio
    const audioService = ros 
        ? createService(ros, '/pytoolkit/ALAudioPlayer/play_audio_stream_srv','/robot_toolkit_msgs/set_stiffnesses_sev')
        : null;

    const stopAudioService = ros 
        ? createService(ros, '/pytoolkit/ALAudioPlayer/stop_audio_stream_srv', 'std_srvs/Empty')
        : null;

    // --- LÓGICA DE ROS ---
    const handlePlayUrl = () => {
        if (!audioUrl.trim()) {
            console.warn("Ingrese una URL de audio válida.");
            return;
        }

        if (!audioService) {
            console.error("Error: No hay conexión con ROS.");
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

    const handleStopAudio = () => {
        if (!stopAudioService) {
            console.error("Error: No hay conexión con ROS.");
            return;
        }

        const stopRequest = {};
        stopAudioService.callService(stopRequest, (result) => {
            console.log('Deteniendo audio en el robot:', result);
        }, (error) => {
            console.error('Error al detener el audio:', error);
        });
    };

    // --- RENDERIZADO VISUAL ---
    return (
        <div
            className="relative h-[220px] w-full max-w-[1008px] overflow-visible rounded-[20px] sm:h-[190px]"
            style={{ background: COLORS.AZUL_PRINCIPAL }}
        >
            
            {/* Etiqueta título */}
            <div
                className="absolute left-0 top-[21px] z-[2] flex h-[30px] w-[180px] items-center rounded-br-[25px] rounded-tr-[25px] px-[19px]"
                style={{ background: COLORS.CELESTE_PRINCIPAL }}
            >
                <span
                    className="w-full text-center font-['Nunito'] text-base font-bold"
                    style={{ color: COLORS.AZUL_PRINCIPAL }}
                >
                    Audio
                </span>
            </div>

            {/* Input de URL */}
            <input 
                type="text" 
                value={audioUrl} 
                onChange={(e) => setAudioUrl(e.target.value)} 
                onKeyDown={e => e.key === 'Enter' && handlePlayUrl()} 
                placeholder="Ingresa URL del audio..." 
                className="absolute left-[30px] top-[76px] h-[38px] w-[calc(100%-60px)] rounded-[5px] border-0 px-3 font-['Nunito'] text-sm outline-none"
                style={{
                    background: COLORS.CELESTE_PRINCIPAL,
                    color: COLORS.AZUL_PRINCIPAL,
                }}
            />

            <div className="absolute left-[30px] right-[30px] top-[139px] flex flex-col gap-2 sm:flex-row sm:gap-0">
                {/* Botón REPRODUCIR */}
                <button
                    onClick={handlePlayUrl}
                    disabled={!audioUrl.trim() || !audioService}
                    onMouseEnter={() => { if (audioUrl.trim() && audioService) setIsHoveredPlay(true); }}
                    onMouseLeave={() => setIsHoveredPlay(false)}
                    className="h-[32px] w-full rounded-[90px] border-0 font-['Nunito'] text-xs font-bold transition-colors sm:w-[calc(50%-10px)]"
                    style={{
                        background: (isHoveredPlay && audioUrl.trim() && audioService) ? COLORS.AZUL_SECUNDARIO : COLORS.CELESTE_PRINCIPAL,
                        cursor: (audioUrl.trim() && audioService) ? 'pointer' : 'not-allowed',
                        opacity: (audioUrl.trim() && audioService) ? 1 : 0.6,
                        color: COLORS.AZUL_PRINCIPAL,
                    }}
                >
                    REPRODUCIR
                </button>

                {/* Botón DETENER */}
                <button
                    onClick={handleStopAudio}
                    disabled={!stopAudioService}
                    onMouseEnter={() => { if (stopAudioService) setIsHoveredStop(true); }}
                    onMouseLeave={() => setIsHoveredStop(false)}
                    className="h-[32px] w-full rounded-[90px] border-0 font-['Nunito'] text-xs font-bold transition-colors sm:ml-auto sm:w-[calc(50%-10px)]"
                    style={{
                        background: (isHoveredStop && stopAudioService) ? '#DC3545' : '#E88B93',
                        cursor: stopAudioService ? 'pointer' : 'not-allowed',
                        opacity: stopAudioService ? 1 : 0.6,
                        color: (isHoveredStop && stopAudioService) ? '#FFFFFF' : COLORS.AZUL_PRINCIPAL,
                    }}
                >
                    DETENER
                </button>
            </div>

        </div>
    );
};

export default AudioService;