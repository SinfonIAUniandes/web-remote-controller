import { useState, useEffect, useRef } from "react";
import { useRos } from "../contexts/RosContext";
import { createService } from "../services/RosManager";
import { COLORS, TYPOGRAPHY } from "../theme";
import BatteryIcon from "./BatteryIcon";
import IpModal from "./IpModal";
import { isValidIpv4 } from "../utils/ip";
import logoSinfonia from "../assets/SinfonIA-Logo.png";
import IconoHome from "../assets/Home.svg";
import IconoServicios from "../assets/robot_icon.svg";
import IconoScripts from "../assets/megaphone_icon.svg";
import IconoVolumen from "../assets/sound_icon.svg";
import IconoSpeed from "../assets/movement_icon.svg";

type parameters = {
    activeTab: string
    setActiveTab: (tab: string) => void
}

// 1. AÑADIMOS activeTab y setActiveTab A LAS PROPS DEL COMPONENTE
export default function LateralMenu({ activeTab, setActiveTab } : parameters) {
    const { ros, ipAddress, setIpAddress, baseSpeed, setBaseSpeed, isConnected } = useRos();
    const [isIpModalOpen, setIsIpModalOpen] = useState(false);
    const [volume, setVolume] = useState(50);
    const [speed, setSpeed] = useState(Math.round(baseSpeed * 100));
    const [isHoveredPrincipal, setIsHoveredPrincipal] = useState(false);
    const [isHoveredServicios, setIsHoveredServicios] = useState(false);
    const [isHoveredScripts, setIsHoveredScripts] = useState(false); 
    
    const volumeSliderRef = useRef(null);
    const speedSliderRef = useRef(null);

    const [isVolumeDragging, setIsVolumeDragging] = useState(false);
    const [isSpeedDragging, setIsSpeedDragging] = useState(false);

    // --- Efecto para inicializar el volumen en 50 ---
    useEffect(() => {
        if (ros) {
            const volumeService = createService(ros, '/pytoolkit/ALAudioDevice/set_output_volume_srv', 'robot_toolkit_msgs/set_output_volume_srv');
            const request = { volume: 50 };
            volumeService.callService(
                request, 
                (result: unknown) => { console.log('Volumen inicial establecido en 50:', result); }, 
                (error: unknown) => { console.error('Error al establecer el volumen inicial:', error); }
            );
        }
    }, [ros]);

    // --- Update volume state & ROS Service ---
    const updateVolume = (newVolume: number) => {
        const clampedVolume = Math.max(0, Math.min(150, newVolume));
        setVolume(clampedVolume);
        
        if (ros) {
            const volumeService = createService(
                ros,
                "/pytoolkit/ALAudioDevice/set_output_volume_srv",
                "robot_toolkit_msgs/set_output_volume_srv",
            );
            const request = { volume: clampedVolume };
            volumeService.callService(
                request,
                () => { /* console.log('Volumen actualizado:', result); */ }, 
                (error : unknown) => { console.error('Error al actualizar volumen:', error); }
            );
        }
    };

    // --- Update speed state for Base movement ---
    const updateSpeed = (newSpeed : number) => {
        const clampedSpeed = Math.max(0, Math.min(100, newSpeed));
        setSpeed(clampedSpeed);

        setBaseSpeed(clampedSpeed / 100.0);
    };

    useEffect(() => {
        setSpeed(Math.round(baseSpeed * 100));
    }, [baseSpeed]);

    // Generic slider interaction handler
    const handleSliderInteraction = (
        event: MouseEvent | TouchEvent,
        sliderRef: React.RefObject<HTMLElement | null>,
        updateFunction: (value: number) => void
    ) => {
        if (sliderRef.current) {
            const slider = sliderRef.current;
            const rect = slider.getBoundingClientRect();
            const clientX = event instanceof TouchEvent
                ? event.touches[0].clientX
                : event.clientX;
            const x = clientX - rect.left;
            const width = rect.width;
            const newValue = Math.round((x / width) * 100);
            updateFunction(newValue);
        }
    };

    // Mouse down handlers
    const handleVolumeMouseDown = (event: MouseEvent | TouchEvent) => {
        setIsVolumeDragging(true);
        handleSliderInteraction(event, volumeSliderRef, updateVolume);
    };

    const handleSpeedMouseDown = (event: MouseEvent | TouchEvent) => {
        setIsSpeedDragging(true);
        handleSliderInteraction(event, speedSliderRef, updateSpeed);
    };

    // Mouse move handler
    const handleMouseMove = (event: MouseEvent | TouchEvent) => {
        if (isVolumeDragging) {
            handleSliderInteraction(event, volumeSliderRef, updateVolume);
        }
        if (isSpeedDragging) {
            handleSliderInteraction(event, speedSliderRef, updateSpeed);
        }
    };

    // Mouse up handler
    const handleMouseUp = () => {
        setIsVolumeDragging(false);
        setIsSpeedDragging(false);
    };

    // Effect for slider drag event listeners
    useEffect(() => {
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        document.addEventListener('touchmove', handleMouseMove);
        document.addEventListener('touchend', handleMouseUp);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            document.removeEventListener('touchmove', handleMouseMove);
            document.removeEventListener('touchend', handleMouseUp);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isVolumeDragging, isSpeedDragging]); 

    const handleIpSave = (newIp: string) => {
        setIpAddress(newIp);
        setIsIpModalOpen(false);
    };

    // Rojo: IP válida pero sin conexión; amarillo: IP aún incompleta; celeste: conectado
    const isIpValid = isValidIpv4(ipAddress);
    const ipColor = !isIpValid ? COLORS.AMARILLO : isConnected ? COLORS.CELESTE_PRINCIPAL : COLORS.ROJO;

    return (
        <div
            className="flex min-h-[220px] w-full flex-col items-center justify-between rounded-[25px] p-3 sm:min-h-[250px] lg:h-full lg:flex-1 lg:min-h-0 lg:w-[220px] lg:p-5"
            style={{ backgroundColor: COLORS.AZUL_PRINCIPAL }}
        >
            <div
                className="flex h-20 w-[120px] shrink-0 flex-col items-center justify-center"
            >
                <BatteryIcon />
                <img
                    src={logoSinfonia}
                    alt="Logo Sinfonia"
                    className="h-[39px] w-[120px]"
                />
            </div>
            
            <div
                aria-label="Menú Navegación"
                className="grid h-auto w-full grid-cols-3 items-center justify-items-center gap-2 py-2 lg:flex lg:h-[450px] lg:w-[125px] lg:flex-col lg:justify-around lg:gap-0 lg:py-0"
            >
                
                {/* 2. ACTUALIZAMOS ONCLICK Y ESTILO DEL BOTÓN PRINCIPAL */}
                <div
                    onClick={() => setActiveTab('principal')}
                    onMouseEnter={() => setIsHoveredPrincipal(true)}
                    onMouseLeave={() => setIsHoveredPrincipal(false)}
                    className="inline-flex h-[28vw] w-[28vw] max-h-[125px] max-w-[125px] cursor-pointer flex-col items-center justify-center gap-[3px] rounded-[30px] sm:h-[110px] sm:w-[110px] lg:h-[125px] lg:w-[125px]"
                    style={{
                        // Si está activo o el mouse está encima, mostramos el color de realce
                        background: (activeTab === 'principal' || isHoveredPrincipal) ? COLORS.AZUL_SECUNDARIO : COLORS.CELESTE_PRINCIPAL,
                    }}
                >
                    <div
                        className="flex h-[25px] flex-col justify-center self-stretch text-center font-['Nunito'] text-base font-bold"
                        style={{ color: COLORS.AZUL_PRINCIPAL }}
                    >
                        Principal
                    </div>
                    <div className="relative h-[35px] w-[35px] overflow-hidden">
                        <img src={IconoHome} alt="Icono Principal" className="h-full w-full object-cover" />
                    </div>
                </div>

                {/* 3. ACTUALIZAMOS ONCLICK Y ESTILO DEL BOTÓN SERVICIOS */}
                <div
                    onClick={() => setActiveTab('servicios')}
                    onMouseEnter={() => setIsHoveredServicios(true)}
                    onMouseLeave={() => setIsHoveredServicios(false)}
                    className="inline-flex h-[28vw] w-[28vw] max-h-[125px] max-w-[125px] cursor-pointer flex-col items-center justify-center gap-[3px] rounded-[30px] sm:h-[110px] sm:w-[110px] lg:h-[125px] lg:w-[125px]"
                    style={{
                        // Si está activo o el mouse está encima, mostramos el color de realce
                        background: (activeTab === 'servicios' || isHoveredServicios) ? COLORS.AZUL_SECUNDARIO : COLORS.CELESTE_PRINCIPAL,
                    }}
                >
                    <div
                        className="flex h-[25px] flex-col justify-center self-stretch text-center font-['Nunito'] text-base font-bold"
                        style={{ color: COLORS.AZUL_PRINCIPAL }}
                    >
                        Servicios
                    </div>
                    <div className="relative h-[35px] w-[35px] overflow-hidden">
                        <img src={IconoServicios} alt="Icono Servicios" className="h-full w-full object-cover" />
                    </div>
                </div>

                {/* 4. BOTÓN SCRIPTS (Opcional por si tienes una tercera pestaña) */}
                <div
                    onClick={() => setActiveTab('scripts')}
                    onMouseEnter={() => setIsHoveredScripts(true)}
                    onMouseLeave={() => setIsHoveredScripts(false)}
                    className="inline-flex h-[28vw] w-[28vw] max-h-[125px] max-w-[125px] cursor-pointer flex-col items-center justify-center gap-[3px] rounded-[30px] sm:h-[110px] sm:w-[110px] lg:h-[125px] lg:w-[125px]"
                    style={{
                        // Si está activo o el mouse está encima, mostramos el color de realce
                        background: (activeTab === 'scripts' || isHoveredScripts) ? COLORS.AZUL_SECUNDARIO : COLORS.CELESTE_PRINCIPAL,
                    }}
                >
                    <div
                        className="flex h-[25px] flex-col justify-center self-stretch text-center font-['Nunito'] text-base font-bold"
                        style={{ color: COLORS.AZUL_PRINCIPAL }}
                    >
                        Scripts
                    </div>
                    <div className="relative h-[35px] w-[35px] overflow-hidden">
                        <img src={IconoScripts} alt="Icono Scripts" className="h-full w-full object-cover" />
                    </div>
                </div>

            </div>

            {/*Sliders and IP container*/}
            <div className="flex w-full flex-row flex-wrap items-center justify-center gap-3 lg:w-[180px] lg:flex-col lg:gap-[15px]">
            {/* Volume Slider */}
            <div className="flex w-[180px] items-center justify-center gap-[5px]">
                <img src={IconoVolumen} alt="Icono Volumen" className="h-5 w-5" />

                <div
                    ref={volumeSliderRef}
                    onMouseDown={(event) => handleVolumeMouseDown(event.nativeEvent)}
                    onTouchStart={(event) => handleVolumeMouseDown(event.nativeEvent)}
                    className="relative flex h-[18px] w-[120px] cursor-pointer items-center"
                >
                    <div
                        className="h-[10px] w-full rounded-[90px] border-2"
                        style={{
                            background: COLORS.AZUL_PRINCIPAL,
                            borderColor: COLORS.CELESTE_PRINCIPAL,
                        }}
                    >
                    </div>
                    <div
                        className="absolute top-1/2 h-[14px] w-[14px] rounded-full shadow-[0_0_4px_rgba(0,0,0,0.70)]"
                        style={{
                            left: `${volume}%`,
                            transform: `translate(-${volume}%, -50%)`,
                            background: COLORS.CELESTE_PRINCIPAL,
                        }}
                    />
                </div>

                <div
                    className="w-10 text-left font-['Nunito'] text-xs font-black"
                    style={{ color: COLORS.CELESTE_PRINCIPAL }}
                >
                    {volume}%
                </div>
            </div>
            
            {/* Speed Slider */}
            <div className="flex w-[180px] items-center justify-center gap-[5px]">
                <img src={IconoSpeed} alt="Icono Velocidad" className="h-5 w-5" />

                <div
                    ref={speedSliderRef}
                    onMouseDown={(event) => handleSpeedMouseDown(event.nativeEvent)}
                    onTouchStart={(event) => handleSpeedMouseDown(event.nativeEvent)}
                    className="relative flex h-[18px] w-[120px] cursor-pointer items-center"
                >
                    <div
                        className="h-[10px] w-full rounded-[90px] border-2"
                        style={{
                            background: COLORS.AZUL_PRINCIPAL,
                            borderColor: COLORS.CELESTE_PRINCIPAL,
                        }}
                    >
                    </div>
                    <div
                        className="absolute top-1/2 h-[14px] w-[14px] rounded-full shadow-[0_0_4px_rgba(0,0,0,0.70)]"
                        style={{
                            left: `${speed}%`,
                            transform: `translate(-${speed}%, -50%)`,
                            background: COLORS.CELESTE_PRINCIPAL,
                        }}
                    />
                </div>

                <div
                    className="w-10 text-left font-['Nunito'] text-xs font-black"
                    style={{ color: COLORS.CELESTE_PRINCIPAL }}
                >
                    {speed}%
                </div>
            </div>
            <div
                onClick={() => setIsIpModalOpen(true)}
                className="flex cursor-pointer flex-col items-center font-['Nunito']"
                style={{ fontWeight: TYPOGRAPHY.FONT_WEIGHT_BLACK }}
            >
                <span
                    className={`text-base ${isIpValid ? '' : 'animate-pulse'}`}
                    style={{ color: ipColor }}
                >
                    {ipAddress}
                </span>
                {!isIpValid && (
                    <span className="text-[11px]" style={{ color: COLORS.AMARILLO }}>
                        Toca para ingresar la IP del robot
                    </span>
                )}
                {isIpValid && !isConnected && (
                    <span className="text-[11px]" style={{ color: COLORS.ROJO }}>
                        Sin conexión
                    </span>
                )}
            </div>
            </div>

            <IpModal
                isOpen={isIpModalOpen}
                currentIp={ipAddress}
                onClose={() => setIsIpModalOpen(false)}
                onSave={handleIpSave}
            />
        </div>
    );
}