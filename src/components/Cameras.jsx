import React, { useEffect, useRef, useState } from 'react';
import { useRos } from '../contexts/RosContext';
import { createTopic, createService } from '../services/RosManager';
import { COLORS, TYPOGRAPHY } from '../theme';

// Icono de pantalla completa reutilizable
const FullScreenIcon = ({ onClick }) => (
    <svg 
        onClick={onClick}
        style={{ cursor: 'pointer' }}
        width="20" height="20" viewBox="0 0 24 24" 
        fill="none" stroke={COLORS.CELESTE_PRINCIPAL} 
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    >
        <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
    </svg>
);

const Cameras = () => {
    const { ros } = useRos();
    
    // Estado para el modal de pantalla completa ('front', 'bottom' o null)
    const [fullScreenCamera, setFullScreenCamera] = useState(null);

    // Referencias para las cámaras en la vista normal
    const frontCameraRef = useRef(null);
    const bottomCameraRef = useRef(null);
    
    // Referencias para las cámaras dentro del modal
    const modalFrontCameraRef = useRef(null);
    const modalBottomCameraRef = useRef(null);

    useEffect(() => {
        if (ros) {
            const frontCameraListener = createTopic(ros, '/robot_toolkit_node/camera/front/image_raw/compressed', 'sensor_msgs/CompressedImage');
            const bottomCameraListener = createTopic(ros, '/robot_toolkit_node/camera/bottom/image_raw/compressed', 'sensor_msgs/CompressedImage');

            // Suscripción de la cámara frontal (actualiza ambas refs)
            frontCameraListener.subscribe((message) => {
                const imgSrc = "data:image/jpeg;base64," + message.data;
                if (frontCameraRef.current) frontCameraRef.current.src = imgSrc;
                if (modalFrontCameraRef.current) modalFrontCameraRef.current.src = imgSrc;
            });

            // Suscripción de la cámara inferior (actualiza ambas refs)
            bottomCameraListener.subscribe((message) => {
                const imgSrc = "data:image/jpeg;base64," + message.data;
                if (bottomCameraRef.current) bottomCameraRef.current.src = imgSrc;
                if (modalBottomCameraRef.current) modalBottomCameraRef.current.src = imgSrc;
            });

            const enableVisionService = createService(ros, '/robot_toolkit/vision_tools_srv', 'robot_toolkit_msgs/vision_tools_msg');

            const frontRequest = { data: { camera_name: "front_camera", command: "custom", resolution: 0, frame_rate: 30, color_space: 11 } };
            enableVisionService.callService(frontRequest, (result) => {
                console.log('Front camera vision service called:', result);
            });

            const bottomRequest = { data: { camera_name: "bottom_camera", command: "custom", resolution: 0, frame_rate: 30, color_space: 11 } };
            enableVisionService.callService(bottomRequest, (result) => {
                console.log('Bottom camera vision service called:', result);
            });

            return () => {
                frontCameraListener.unsubscribe();
                bottomCameraListener.unsubscribe();
            };
        }
    }, [ros]);

    return (
        <>
            <div style={{ width: 560, height: 770, position: 'relative' }}>
                {/* Fondos decorativos */}
                <div style={{ width: 554, height: 770, left: 6, top: 0, position: 'absolute', background: COLORS.AZUL_PRINCIPAL, borderRadius: 20 }} />
                <div style={{ width: 499, height: 708, left: 31, top: 31, position: 'absolute', background: COLORS.AZUL_PRINCIPAL, borderRadius: 20 }} />
                
                {/* Contenedor Principal */}
                <div style={{ width: 450, height: 680, left: 58, top: 46, position: 'absolute', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'center', display: 'flex' }}>
                    
                    {/* --- CÁMARA FRONTAL --- */}
                    <div style={{ alignSelf: 'stretch', height: 30, justifyContent: 'space-between', alignItems: 'center', display: 'flex' }}>
                        <div style={{ 
                            width: 180, 
                            marginLeft: -58, 
                            // Se eliminó el paddingLeft para que quede totalmente centrado en la barra
                            height: 30, 
                            background: COLORS.CELESTE_PRINCIPAL, 
                            overflow: 'hidden', 
                            borderTopRightRadius: 25, 
                            borderBottomRightRadius: 25, 
                            justifyContent: 'center', 
                            alignItems: 'center', 
                            display: 'flex', 
                        }}>
                            <div style={{ textAlign: 'center', color: COLORS.AZUL_PRINCIPAL, fontSize: 16, fontFamily: TYPOGRAPHY.FONT_FAMILY_PRINCIPAL || 'Nunito', fontWeight: '700' }}>Cámara frontal</div>
                        </div>
                        <div style={{ padding: 3, display: 'flex', alignItems: 'center' }}>
                            <FullScreenIcon onClick={() => setFullScreenCamera('front')} />
                        </div>
                    </div>
                    
                    <img 
                        id="front_camera" 
                        ref={frontCameraRef} 
                        alt="Cámara Frontal"
                        style={{ alignSelf: 'stretch', height: 284, backgroundColor: '#000', objectFit: 'contain' }} 
                    />

                    {/* --- CÁMARA INFERIOR --- */}
                    <div style={{ alignSelf: 'stretch', height: 30, justifyContent: 'space-between', alignItems: 'center', display: 'flex' }}>
                        <div style={{ 
                            width: 180, 
                            marginLeft: -58, 
                            // Se eliminó el paddingLeft aquí también
                            height: 30, 
                            background: COLORS.CELESTE_PRINCIPAL, 
                            overflow: 'hidden', 
                            borderTopRightRadius: 25, 
                            borderBottomRightRadius: 25, 
                            justifyContent: 'center', 
                            alignItems: 'center', 
                            display: 'flex' 
                        }}>
                            <div style={{ textAlign: 'center', color: COLORS.AZUL_PRINCIPAL, fontSize: 16, fontFamily: TYPOGRAPHY.FONT_FAMILY_PRINCIPAL || 'Nunito', fontWeight: '700' }}>Cámara inferior</div>
                        </div>
                        <div style={{ padding: 3, display: 'flex', alignItems: 'center' }}>
                            <FullScreenIcon onClick={() => setFullScreenCamera('bottom')} />
                        </div>
                    </div>
                    
                    <img 
                        id="bottom_camera" 
                        ref={bottomCameraRef} 
                        alt="Cámara Inferior"
                        style={{ alignSelf: 'stretch', height: 284, backgroundColor: '#000', objectFit: 'contain' }} 
                    />
                </div>
            </div>

            {/* --- MODAL DE PANTALLA COMPLETA --- */}
            {fullScreenCamera && (
                <div 
                    onClick={() => setFullScreenCamera(null)} 
                    style={{
                        position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
                        backgroundColor: 'rgba(0, 21, 56, 0.9)', 
                        zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center',
                        backdropFilter: 'blur(5px)' 
                    }}
                >
                    <div 
                        onClick={(e) => e.stopPropagation()} 
                        style={{ position: 'relative', width: '80%', height: '80%', background: '#000', borderRadius: 20, overflow: 'hidden', border: `2px solid ${COLORS.CELESTE_PRINCIPAL}` }}
                    >
                        {/* Botón de cerrar */}
                        <button 
                            onClick={() => setFullScreenCamera(null)}
                            style={{ 
                                position: 'absolute', top: 20, right: 20, background: COLORS.CELESTE_PRINCIPAL, color: COLORS.AZUL_PRINCIPAL, 
                                border: 'none', borderRadius: '50%', width: 40, height: 40, fontSize: 20, fontWeight: 'bold', cursor: 'pointer', zIndex: 10
                            }}
                        >
                            ✕
                        </button>

                        {/* Imágenes del modal */}
                        <img 
                            ref={modalFrontCameraRef} 
                            style={{ display: fullScreenCamera === 'front' ? 'block' : 'none', width: '100%', height: '100%', objectFit: 'contain' }} 
                            alt="Cámara Frontal Fullscreen" 
                        />
                        <img 
                            ref={modalBottomCameraRef} 
                            style={{ display: fullScreenCamera === 'bottom' ? 'block' : 'none', width: '100%', height: '100%', objectFit: 'contain' }} 
                            alt="Cámara Inferior Fullscreen" 
                        />
                    </div>
                </div>
            )}
        </>
    );
};

export default Cameras;