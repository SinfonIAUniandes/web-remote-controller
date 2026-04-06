import React, { useState } from 'react';
import { useRos } from '../contexts/RosContext';
import { createService } from '../services/RosManager';
import { COLORS, TYPOGRAPHY } from '../theme';
import * as ROSLIB from 'roslib';

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

    const handleStopAudio = () => {
        if (!stopAudioService) {
            console.error("Error: No hay conexión con ROS.");
            return;
        }

        const stopRequest = new ROSLIB.ServiceRequest({});
        stopAudioService.callService(stopRequest, (result) => {
            console.log('Deteniendo audio en el robot:', result);
        }, (error) => {
            console.error('Error al detener el audio:', error);
        });
    };

    // --- RENDERIZADO VISUAL ---
    return (
        <div style={{ width: '1008px', height: '190px', background: COLORS.AZUL_PRINCIPAL, borderRadius: '20px', position: 'relative', overflow: 'visible' }}>
            
            {/* Etiqueta título */}
            <div style={{ position: 'absolute', left: 0, top: '21px', width: '180px', height: '30px', paddingLeft: '19px', paddingRight: '19px', background: COLORS.CELESTE_PRINCIPAL, borderTopRightRadius: '25px', borderBottomRightRadius: '25px', display: 'flex', alignItems: 'center', zIndex: 2 }}>
                <span style={{ width: '100%', textAlign: 'center', fontFamily: TYPOGRAPHY.FONT_FAMILY_PRINCIPAL, fontWeight: TYPOGRAPHY.FONT_WEIGHT_BOLD, fontSize: '16px', color: COLORS.AZUL_PRINCIPAL }}>
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
                style={{ 
                    position: 'absolute', 
                    left: '30px', 
                    top: '76px', 
                    width: 'calc(100% - 60px)', 
                    height: '38px', 
                    background: COLORS.CELESTE_PRINCIPAL, 
                    borderRadius: '5px', 
                    border: 'none', 
                    outline: 'none', 
                    paddingLeft: '12px', 
                    paddingRight: '12px', 
                    fontFamily: TYPOGRAPHY.FONT_FAMILY_PRINCIPAL, 
                    fontSize: '14px', 
                    color: COLORS.AZUL_PRINCIPAL, 
                    boxSizing: 'border-box' 
                }} 
            />

            {/* Botón REPRODUCIR (Ocupa la mitad izquierda) */}
            <button
                onClick={handlePlayUrl}
                disabled={!audioUrl.trim() || !audioService}
                onMouseEnter={() => { if (audioUrl.trim() && audioService) setIsHoveredPlay(true); }}
                onMouseLeave={() => setIsHoveredPlay(false)}
                style={{
                    position: 'absolute',
                    left: '30px',
                    top: '139px',
                    width: 'calc(50% - 40px)', // Mitad del ancho menos un margen central
                    height: '32px',
                    background: (isHoveredPlay && audioUrl.trim() && audioService) ? COLORS.AZUL_SECUNDARIO : COLORS.CELESTE_PRINCIPAL,
                    borderRadius: '90px',
                    border: 'none',
                    cursor: (audioUrl.trim() && audioService) ? 'pointer' : 'not-allowed',
                    opacity: (audioUrl.trim() && audioService) ? 1 : 0.6,
                    transition: 'background 0.2s',
                    fontFamily: TYPOGRAPHY.FONT_FAMILY_PRINCIPAL,
                    fontWeight: TYPOGRAPHY.FONT_WEIGHT_BOLD,
                    fontSize: '12px',
                    color: COLORS.AZUL_PRINCIPAL,
                }}
            >
                REPRODUCIR
            </button>

            {/* Botón DETENER (Ocupa la mitad derecha) */}
            <button
                onClick={handleStopAudio}
                disabled={!stopAudioService}
                onMouseEnter={() => { if (stopAudioService) setIsHoveredStop(true); }}
                onMouseLeave={() => setIsHoveredStop(false)}
                style={{
                    position: 'absolute',
                    right: '30px',
                    top: '139px',
                    width: 'calc(50% - 40px)', // Mitad del ancho menos un margen central
                    height: '32px',
                    background: (isHoveredStop && stopAudioService) ? '#DC3545' : '#E88B93', // Tonos rojizos para indicar "Detener"
                    borderRadius: '90px',
                    border: 'none',
                    cursor: stopAudioService ? 'pointer' : 'not-allowed',
                    opacity: stopAudioService ? 1 : 0.6,
                    transition: 'background 0.2s',
                    fontFamily: TYPOGRAPHY.FONT_FAMILY_PRINCIPAL,
                    fontWeight: TYPOGRAPHY.FONT_WEIGHT_BOLD,
                    fontSize: '12px',
                    color: (isHoveredStop && stopAudioService) ? '#FFFFFF' : COLORS.AZUL_PRINCIPAL,
                }}
            >
                DETENER
            </button>

        </div>
    );
};

export default AudioService;