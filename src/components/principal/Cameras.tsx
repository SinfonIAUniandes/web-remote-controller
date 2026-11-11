import { useEffect, useRef, useState } from 'react';
import { Power, VideoOff } from 'lucide-react';
import { useRos } from '../../contexts/RosContext';
import { createTopic, createService } from '../../services/RosManager';
import { COLORS, TYPOGRAPHY, withAlpha } from '../../theme';

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

// Hueco de cada cámara en la tarjeta: ocupa el ancho disponible (menos el margen lateral) con proporción 16:10, que es
// lo que da la imagen de la cámara. El alto sale de la proporción, no de un porcentaje.
const MEDIA_BOX = 'mx-8 aspect-[16/10] self-stretch sm:mx-12';

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
        fill="none" stroke={enabled ? COLORS.CELESTE_PRINCIPAL : COLORS.ROJO_CLARO}
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
    <div className="flex h-9 items-center justify-between pr-8 sm:pr-12">
        {/* Etiqueta pegada al borde izquierdo de la tarjeta; mide al menos lo de una etiqueta normal y crece si el texto no cabe */}
        <div className="flex w-fit min-w-44 shrink-0 items-center self-stretch justify-center overflow-hidden rounded-r-[25px] bg-[var(--celeste)] px-4">
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

// Placeholder mostrado cuando la cámara está apagada. Pareja visual de NoSignal, pero "apagado":
// insignia hueca con anillos tenues en vez del círculo relleno, y un botón para volver a encenderla.
const CameraOff = ({ label, onTurnOn }: { label: string; onTurnOn: () => void }) => (
    <div className={`${MEDIA_BOX} flex flex-col items-center justify-center gap-2 overflow-hidden rounded-[20px] bg-black/30 font-[family-name:var(--font-main)] sm:gap-3`}>
        <div className="relative flex h-12 w-12 shrink-0 items-center justify-center sm:h-16 sm:w-16">
            {/* Anillos concéntricos muy tenues, como el eco de algo que se apagó */}
            <span aria-hidden="true" className="absolute -inset-2 rounded-full border border-solid border-[var(--celeste)]/15" />
            <span aria-hidden="true" className="absolute -inset-4 rounded-full border border-solid border-[var(--celeste)]/[0.07]" />
            <span className="relative flex flex-1 items-center justify-center self-stretch rounded-full border-2 border-solid border-[var(--celeste)]/40 text-[var(--celeste)]/60">
                <Power aria-hidden="true" size={26} strokeWidth={2.25} />
            </span>
        </div>

        <div className="rounded-full border-2 border-solid border-[var(--celeste)]/40 px-4 py-0.5 text-sm font-extrabold text-[var(--celeste)]/80">
            CÁMARA APAGADA
        </div>

        <button
            type="button"
            onClick={onTurnOn}
            aria-label={`Encender cámara ${label}`}
            className="inline-flex h-7 cursor-pointer items-center gap-1.5 rounded-full border-none px-4 font-[family-name:var(--font-main)] text-xs font-extrabold text-[var(--azul)] transition-transform duration-150 hover:scale-105 active:scale-95"
            style={{ backgroundColor: COLORS.AZUL_SECUNDARIO }}
        >
            <Power aria-hidden="true" size={14} strokeWidth={3} />
            ENCENDER
        </button>
    </div>
);

// Pantalla de "sin señal" cuando no hay conexión con el robot.
// `className` define el tamaño; por defecto ocupa el mismo hueco que la imagen de la cámara.
// Usa los mismos elementos que el resto de la app: círculo celeste con icono azul, etiqueta en píldora y acento morado.
const NoSignal = ({ className = `${MEDIA_BOX} rounded-[20px]` }: { className?: string }) => (
    <div
        role="status"
        aria-label="Sin señal: sin conexión con el robot"
        className={`flex flex-col items-center justify-center gap-3 bg-black/30 font-[family-name:var(--font-main)] ${className}`}
    >
        <div className="relative flex h-16 w-16 shrink-0 items-center justify-center">
            {/* Pulso suave en el morado de acento */}
            <span
                aria-hidden="true"
                className="absolute inset-0 animate-ping rounded-full motion-reduce:animate-none"
                style={{ backgroundColor: withAlpha(COLORS.AZUL_SECUNDARIO, 40) }}
            />
            <span className="relative flex flex-1 items-center justify-center self-stretch rounded-full bg-[var(--celeste)] text-[var(--azul)]">
                <VideoOff aria-hidden="true" size={30} strokeWidth={2.25} />
            </span>
        </div>

        <div className="rounded-full bg-[var(--celeste)] px-5 py-1 text-base font-extrabold text-[var(--azul)]">SIN SEÑAL</div>

        <div className="flex items-center gap-1.5 px-4 text-center text-xs font-bold text-[var(--celeste)]/70">
            <span aria-hidden="true" className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: COLORS.ROJO }} />
            Sin conexión con el robot
        </div>
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
    const { ros, isConnected } = useRos();

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
            {/* La tarjeta es una columna: cada cámara con su encabezado y su hueco; el alto sale del contenido */}
            <div style={themeVars} className="flex w-full flex-col gap-6 rounded-[20px] bg-[var(--azul)] py-10">
                {/* --- CÁMARA FRONTAL --- */}
                <div className="flex flex-col gap-3">
                    <CameraHeader label="Cámara frontal" enabled={frontEnabled} onToggle={() => setFrontEnabled((v) => !v)} onFullScreen={() => setFullScreenCamera('front')} />

                    {!frontEnabled ? <CameraOff label="frontal" onTurnOn={() => setFrontEnabled(true)} /> : !isConnected ? <NoSignal /> : (
                        <img
                            id="front_camera"
                            ref={frontCameraRef}
                            alt="Cámara Frontal"
                            className={`${MEDIA_BOX} object-contain [image-rendering:auto]`}
                        />
                    )}
                </div>

                {/* --- CÁMARA INFERIOR --- */}
                <div className="flex flex-col gap-3">
                    <CameraHeader label="Cámara inferior" enabled={bottomEnabled} onToggle={() => setBottomEnabled((v) => !v)} onFullScreen={() => setFullScreenCamera('bottom')} />

                    {!bottomEnabled ? <CameraOff label="inferior" onTurnOn={() => setBottomEnabled(true)} /> : !isConnected ? <NoSignal /> : (
                        <img
                            id="bottom_camera"
                            ref={bottomCameraRef}
                            alt="Cámara Inferior"
                            className={`${MEDIA_BOX} object-contain [image-rendering:auto]`}
                        />
                    )}
                </div>
            </div>

            {/* --- MODAL DE PANTALLA COMPLETA --- */}
            {fullScreenCamera && (
                <div
                    onClick={() => setFullScreenCamera(null)}
                    style={themeVars}
                    data-card-passthrough=""
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

                        {/* Sin conexión (también si se pierde con el modal abierto): "sin señal" en lugar de las imágenes */}
                        {!isConnected ? <NoSignal className="flex-1 self-stretch" /> : (
                            <>
                                {/* Imágenes del modal */}
                                <img
                                    ref={modalFrontCameraRef}
                                    className={`${fullScreenCamera === 'front' ? 'block' : 'hidden'} min-w-0 flex-1 self-stretch object-contain [image-rendering:auto]`}
                                    alt="Cámara Frontal Fullscreen"
                                />
                                <img
                                    ref={modalBottomCameraRef}
                                    className={`${fullScreenCamera === 'bottom' ? 'block' : 'hidden'} min-w-0 flex-1 self-stretch object-contain [image-rendering:auto]`}
                                    alt="Cámara Inferior Fullscreen"
                                />
                            </>
                        )}
                    </div>
                </div>
            )}
        </>
    );
};

export default Cameras
