import { useEffect, useRef, useState } from 'react';
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

// Icono de encendido/apagado de cámara
const PowerIcon = ({ onClick, enabled }: { onClick: React.MouseEventHandler<SVGSVGElement>; enabled: boolean }) => (
    <svg
        onClick={onClick}
        className="cursor-pointer"
        width="20" height="20" viewBox="0 0 24 24"
        fill="none" stroke={enabled ? COLORS.CELESTE_PRINCIPAL : '#ff5c5c'}
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    >
        <title>{enabled ? 'Apagar cámara' : 'Encender cámara'}</title>
        <path d="M18.36 6.64a9 9 0 1 1-12.73 0" />
        <line x1="12" y1="2" x2="12" y2="12" />
    </svg>
);

// Encabezado de cada cámara (etiqueta + botón de encendido + botón de pantalla completa)
const CameraHeader = ({ label, enabled, onToggle, onFullScreen }: {
    label: string;
    enabled: boolean;
    onToggle: () => void;
    onFullScreen: () => void;
}) => (
    <div className="flex items-center justify-between self-stretch h-[4.41%]">
        <div className="flex items-center justify-center overflow-hidden w-[40%] -ml-[12.889%] h-full bg-[var(--celeste)] rounded-r-[25px]">
            <div className="text-center text-[16px] font-bold whitespace-nowrap text-[var(--azul)] font-[family-name:var(--font-main)]">{label}</div>
        </div>
        <div className="flex items-center gap-2 p-[3px]">
            <PowerIcon enabled={enabled} onClick={onToggle} />
            <FullScreenIcon onClick={onFullScreen} />
        </div>
    </div>
);

// Suscribe una cámara y activa su stream en el robot mientras esté habilitada.
// Al deshabilitarla (o desmontar) se cancela la suscripción y se apaga la cámara en el robot.
const useCameraStream = (
    ros: ReturnType<typeof useRos>['ros'],
    enabled: boolean,
    cameraName: 'front_camera' | 'bottom_camera',
    topicName: string,
    imgRefs: React.RefObject<HTMLImageElement | null>[],
) => {
    useEffect(() => {
        if (!ros || !enabled) return;

        const listener = createTopic(ros, topicName, 'sensor_msgs/CompressedImage');
        listener.subscribe((message: unknown) => {
            if (!isCompressedImageMessage(message)) return;
            const imgSrc = "data:image/jpeg;base64," + message.data;
            imgRefs.forEach((ref) => {
                if (ref.current) ref.current.src = imgSrc;
            });
        });

        const visionService = createService(ros, '/robot_toolkit/vision_tools_srv', 'robot_toolkit_msgs/vision_tools_msg');
        const buildRequest = (command: 'custom' | 'disable') => ({
            data: {
                camera_name: cameraName,
                command,
                resolution: CAMERA_RESOLUTION,
                frame_rate: CAMERA_FRAME_RATE,
                color_space: CAMERA_COLOR_SPACE
            }
        });

        visionService.callService(buildRequest('custom'), (result: unknown) => {
            console.log(`${cameraName} vision service enabled:`, result);
        }, (error: unknown) => {
            console.error(`Error enabling ${cameraName} vision service:`, error);
        });

        return () => {
            listener.unsubscribe();
            imgRefs.forEach((ref) => ref.current?.removeAttribute('src'));
            visionService.callService(buildRequest('disable'), (result: unknown) => {
                console.log(`${cameraName} vision service disabled:`, result);
            }, (error: unknown) => {
                console.error(`Error disabling ${cameraName} vision service:`, error);
            });
        };
        // imgRefs son refs estables; no hace falta como dependencia
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ros, enabled, cameraName, topicName]);
};

// Placeholder mostrado cuando la cámara está apagada
const CameraOff = () => (
    <div className="flex items-center justify-center self-stretch h-[41.765%] rounded-[10px] bg-black/40 text-[var(--celeste)] font-bold font-[family-name:var(--font-main)]">
        Cámara apagada
    </div>
);

// Indica si la pestaña del navegador está visible (Page Visibility API)
const usePageVisible = () => {
    const [pageVisible, setPageVisible] = useState(() => document.visibilityState === 'visible');

    useEffect(() => {
        const onChange = () => setPageVisible(document.visibilityState === 'visible');
        document.addEventListener('visibilitychange', onChange);
        return () => document.removeEventListener('visibilitychange', onChange);
    }, []);

    return pageVisible;
};

// `visible`: false cuando el usuario está en otra pestaña de la app (las cámaras se apagan)
const Cameras = ({ visible = true }: { visible?: boolean }) => {
    const { ros } = useRos();

    // Estado para el modal de pantalla completa ('front', 'bottom' o null)
    const [fullScreenCamera, setFullScreenCamera] = useState<String | null>(null);

    // Referencias para las cámaras en la vista normal
    const frontCameraRef = useRef<HTMLImageElement | null>(null);
    const bottomCameraRef = useRef<HTMLImageElement | null>(null);

    // Referencias para las cámaras dentro del modal
    const modalFrontCameraRef = useRef<HTMLImageElement | null>(null);
    const modalBottomCameraRef = useRef<HTMLImageElement | null>(null);

    const [frontEnabled, setFrontEnabled] = useState(true);
    const [bottomEnabled, setBottomEnabled] = useState(true);

    // Solo se transmite si nadie apagó la cámara a mano y el usuario realmente la está viendo
    const pageVisible = usePageVisible();
    const streaming = visible && pageVisible;

    useCameraStream(ros, frontEnabled && streaming, 'front_camera', '/robot_toolkit_node/camera/front/image_raw/compressed', [frontCameraRef, modalFrontCameraRef]);
    useCameraStream(ros, bottomEnabled && streaming, 'bottom_camera', '/robot_toolkit_node/camera/bottom/image_raw/compressed', [bottomCameraRef, modalBottomCameraRef]);

    return (
        <>
            {/* Tamaño base 560x770; escala proporcionalmente en pantallas pequeñas */}
            {/* <div style={themeVars} className="relative w-full max-w-[560px] aspect-[560/770]"> */}
            <div style={themeVars} className="relative w-full aspect-[560/770]">
                {/* Fondos decorativos */}
                <div className="absolute left-[1.071%] top-0 w-[98.929%] h-full bg-[var(--azul)] rounded-[20px]" />
                <div className="absolute left-[5.536%] top-[4.026%] w-[89.107%] h-[91.948%] bg-[var(--azul)] rounded-[20px]" />

                {/* Contenedor Principal */}
                <div className="absolute left-[10.357%] top-[5.974%] w-[80.357%] h-[88.312%] flex flex-col items-center justify-between">

                    {/* --- CÁMARA FRONTAL --- */}
                    <CameraHeader label="Cámara frontal" enabled={frontEnabled} onToggle={() => setFrontEnabled((v) => !v)} onFullScreen={() => setFullScreenCamera('front')} />

                    {frontEnabled ? (
                        <img
                        id="front_camera"
                        ref={frontCameraRef}
                        alt="Cámara Frontal"
                        className="self-stretch h-[41.765%] object-contain [image-rendering:auto]"
                    />
                    ) : <CameraOff />}

                    {/* --- CÁMARA INFERIOR --- */}
                    <CameraHeader label="Cámara inferior" enabled={bottomEnabled} onToggle={() => setBottomEnabled((v) => !v)} onFullScreen={() => setFullScreenCamera('bottom')} />

                    {bottomEnabled ? (
                        <img
                        id="bottom_camera"
                        ref={bottomCameraRef}
                        alt="Cámara Inferior"
                        className="self-stretch h-[41.765%] object-contain [image-rendering:auto]"
                    />
                    ) : <CameraOff />}
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
