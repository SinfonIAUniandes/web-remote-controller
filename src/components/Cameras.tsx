import React, { useEffect, useRef, useState } from 'react';
import { useRos } from '../contexts/RosContext';
import { createTopic, createService } from '../services/RosManager';
import { COLORS, TYPOGRAPHY } from '../theme';

const CAMERA_RESOLUTION = 2;
const CAMERA_FRAME_RATE = 20;
const CAMERA_COLOR_SPACE = 11;

type CompressedImageMessage = {
    data: string;
};

const isCompressedImageMessage = (message: unknown): message is CompressedImageMessage => (
    typeof message === 'object' &&
    message !== null &&
    'data' in message &&
    typeof message.data === 'string'
);

// Variables CSS alimentadas desde COLORS/TYPOGRAPHY para usarlas en clases de Tailwind
const themeVars = {
    '--azul': COLORS.AZUL_PRINCIPAL,
    '--celeste': COLORS.CELESTE_PRINCIPAL,
    '--font-main': TYPOGRAPHY.FONT_FAMILY_PRINCIPAL || 'Nunito',
} as React.CSSProperties;

// Icono de pantalla completa reutilizable
const FullScreenIcon = ({ onClick }: { onClick: React.MouseEventHandler<SVGSVGElement> }) => (
    <svg
        onClick={onClick}
        className="cursor-pointer"
        width="20" height="20" viewBox="0 0 24 24"
        fill="none" stroke={COLORS.CELESTE_PRINCIPAL}
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    >
        <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
    </svg>
);

// Encabezado de cada cámara (etiqueta + botón de pantalla completa)
const CameraHeader = ({ label, onFullScreen }: { label: string; onFullScreen: () => void }) => (
    <div className="flex items-center justify-between self-stretch h-[4.41%]">
        <div className="flex items-center justify-center overflow-hidden w-[40%] -ml-[12.889%] h-full bg-[var(--celeste)] rounded-r-[25px]">
            <div className="text-center text-[16px] font-bold whitespace-nowrap text-[var(--azul)] font-[family-name:var(--font-main)]">{label}</div>
        </div>
        <div className="flex items-center p-[3px]">
            <FullScreenIcon onClick={onFullScreen} />
        </div>
    </div>
);

const Cameras = () => {
    const { ros } = useRos();

    // Estado para el modal de pantalla completa ('front', 'bottom' o null)
    const [fullScreenCamera, setFullScreenCamera] = useState<String | null>(null);

    // Referencias para las cámaras en la vista normal
    const frontCameraRef = useRef<HTMLImageElement | null>(null);
    const bottomCameraRef = useRef<HTMLImageElement | null>(null);

    // Referencias para las cámaras dentro del modal
    const modalFrontCameraRef = useRef<HTMLImageElement | null>(null);
    const modalBottomCameraRef = useRef<HTMLImageElement | null>(null);

    useEffect(() => {
        if (ros) {
            const frontCameraListener = createTopic(ros, '/robot_toolkit_node/camera/front/image_raw/compressed', 'sensor_msgs/CompressedImage');
            const bottomCameraListener = createTopic(ros, '/robot_toolkit_node/camera/bottom/image_raw/compressed', 'sensor_msgs/CompressedImage');

            // Suscripción de la cámara frontal (actualiza ambas refs)
            frontCameraListener.subscribe((message: unknown) => {
                if (!isCompressedImageMessage(message)) return;
                const imgSrc = "data:image/jpeg;base64," + message.data;
                if (frontCameraRef.current) frontCameraRef.current.src = imgSrc;
                if (modalFrontCameraRef.current) modalFrontCameraRef.current.src = imgSrc;
            });

            // Suscripción de la cámara inferior (actualiza ambas refs)
            bottomCameraListener.subscribe((message: unknown) => {
                if (!isCompressedImageMessage(message)) return;
                const imgSrc = "data:image/jpeg;base64," + message.data;
                if (bottomCameraRef.current) bottomCameraRef.current.src = imgSrc;
                if (modalBottomCameraRef.current) modalBottomCameraRef.current.src = imgSrc;
            });

            const enableVisionService = createService(ros, '/robot_toolkit/vision_tools_srv', 'robot_toolkit_msgs/vision_tools_msg');

            const frontRequest = {
                data: {
                    camera_name: "front_camera",
                    command: "custom",
                    resolution: CAMERA_RESOLUTION,
                    frame_rate: CAMERA_FRAME_RATE,
                    color_space: CAMERA_COLOR_SPACE
                }
            };
            enableVisionService.callService(frontRequest, (result : unknown) => {
                console.log('Front camera vision service called:', result);
            }, (error: unknown) => {
                console.error('Error enabling front camera vision service:', error);
            });

            const bottomRequest = {
                data: {
                    camera_name: "bottom_camera",
                    command: "custom",
                    resolution: CAMERA_RESOLUTION,
                    frame_rate: CAMERA_FRAME_RATE,
                    color_space: CAMERA_COLOR_SPACE
                }
            };
            enableVisionService.callService(bottomRequest, (result: unknown) => {
                console.log('Bottom camera vision service called:', result);
            }, (error: unknown) => {
                console.error('Error enabling bottom camera vision service:', error);
            });

            return () => {
                frontCameraListener.unsubscribe();
                bottomCameraListener.unsubscribe();
            };
        }
    }, [ros]);

    return (
        <>
            {/* Tamaño base 560x770; escala proporcionalmente en pantallas pequeñas */}
            <div style={themeVars} className="relative w-full max-w-[560px] aspect-[560/770]">
                {/* Fondos decorativos */}
                <div className="absolute left-[1.071%] top-0 w-[98.929%] h-full bg-[var(--azul)] rounded-[20px]" />
                <div className="absolute left-[5.536%] top-[4.026%] w-[89.107%] h-[91.948%] bg-[var(--azul)] rounded-[20px]" />

                {/* Contenedor Principal */}
                <div className="absolute left-[10.357%] top-[5.974%] w-[80.357%] h-[88.312%] flex flex-col items-center justify-between">

                    {/* --- CÁMARA FRONTAL --- */}
                    <CameraHeader label="Cámara frontal" onFullScreen={() => setFullScreenCamera('front')} />

                    <img
                        id="front_camera"
                        ref={frontCameraRef}
                        alt="Cámara Frontal"
                        className="self-stretch h-[41.765%] object-contain [image-rendering:auto]"
                    />

                    {/* --- CÁMARA INFERIOR --- */}
                    <CameraHeader label="Cámara inferior" onFullScreen={() => setFullScreenCamera('bottom')} />

                    <img
                        id="bottom_camera"
                        ref={bottomCameraRef}
                        alt="Cámara Inferior"
                        className="self-stretch h-[41.765%] object-contain [image-rendering:auto]"
                    />
                </div>
            </div>

            {/* --- MODAL DE PANTALLA COMPLETA --- */}
            {fullScreenCamera && (
                <div
                    onClick={() => setFullScreenCamera(null)}
                    style={themeVars}
                    className="fixed inset-0 z-[10000] flex items-center justify-center bg-[rgba(0,21,56,0.9)] backdrop-blur-[5px]"
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className="relative flex items-center justify-center w-[90vw] h-[80vh] bg-black rounded-[20px] overflow-hidden border-2 border-solid border-[var(--celeste)]"
                    >
                        {/* Botón de cerrar */}
                        <button
                            onClick={() => setFullScreenCamera(null)}
                            className="absolute top-5 right-5 z-10 w-10 h-10 rounded-full border-none bg-[var(--celeste)] text-[var(--azul)] text-[20px] font-bold cursor-pointer"
                        >
                            ✕
                        </button>

                        {/* Imágenes del modal */}
                        <img
                            ref={modalFrontCameraRef}
                            className={`${fullScreenCamera === 'front' ? 'block' : 'hidden'} w-full h-full object-contain [image-rendering:auto]`}
                            alt="Cámara Frontal Fullscreen"
                        />
                        <img
                            ref={modalBottomCameraRef}
                            className={`${fullScreenCamera === 'bottom' ? 'block' : 'hidden'} w-full h-full object-contain [image-rendering:auto]`}
                            alt="Cámara Inferior Fullscreen"
                        />
                    </div>
                </div>
            )}
        </>
    );
};

export default Cameras
