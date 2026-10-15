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
import PanicButton from "./PanicButton";

type parameters = {
    activeTab: string
    setActiveTab: (tab: string) => void
}

const TABS = [
    { id: 'principal', label: 'Principal', icon: IconoHome },
    { id: 'servicios', label: 'Servicios', icon: IconoServicios },
    { id: 'scripts', label: 'Scripts', icon: IconoScripts },
];

// Alto de la barra compacta (h-14 = 56px). Se usa también para saber cuándo mostrarla.
const COMPACT_BAR_HEIGHT = 56;

type NavButtonsProps = {
    activeTab: string
    onSelect: (tab: string) => void
    variant: 'full' | 'dropdown'
}

function NavButtons({ activeTab, onSelect, variant }: NavButtonsProps) {
    const [hoveredTab, setHoveredTab] = useState<string | null>(null);

    const containerClass = variant === 'full'
        ? "grid h-auto w-full grid-cols-3 items-center justify-items-center gap-2 py-2 lg:flex lg:h-[450px] lg:w-[125px] lg:flex-col lg:justify-around lg:gap-0 lg:py-0"
        : "grid w-full grid-cols-3 gap-2";
    const buttonClass = variant === 'full'
        ? "inline-flex h-[28vw] w-[28vw] max-h-[125px] max-w-[125px] cursor-pointer flex-col items-center justify-center gap-[3px] rounded-[30px] border-none p-0 sm:h-[110px] sm:w-[110px] lg:h-[125px] lg:w-[125px]"
        : "inline-flex h-[88px] w-full cursor-pointer flex-col items-center justify-center gap-[3px] rounded-[24px] border-none p-0";

    return (
        <nav aria-label="Menú Navegación" className={containerClass}>
            {TABS.map((tab) => (
                <button
                    key={tab.id}
                    type="button"
                    onClick={() => onSelect(tab.id)}
                    onMouseEnter={() => setHoveredTab(tab.id)}
                    onMouseLeave={() => setHoveredTab(null)}
                    className={buttonClass}
                    style={{
                        // Si está activo o el mouse está encima, mostramos el color de realce
                        background: (activeTab === tab.id || hoveredTab === tab.id) ? COLORS.AZUL_SECUNDARIO : COLORS.CELESTE_PRINCIPAL,
                    }}
                >
                    <div
                        className="flex h-[25px] flex-col justify-center self-stretch text-center font-['Nunito'] text-base font-bold"
                        style={{ color: COLORS.AZUL_PRINCIPAL }}
                    >
                        {tab.label}
                    </div>
                    <div className="relative h-[35px] w-[35px] overflow-hidden">
                        <img src={tab.icon} alt={`Icono ${tab.label}`} className="h-full w-full object-cover" />
                    </div>
                </button>
            ))}
        </nav>
    );
}

type SliderRowProps = {
    icon: string
    alt: string
    value: number
    onChange: (value: number) => void
}

// Pointer events + touch-action: none para que arrastrar el slider no haga scroll de la página en móvil
function SliderRow({ icon, alt, value, onChange }: SliderRowProps) {
    const trackRef = useRef<HTMLDivElement>(null);

    const updateFromPointer = (event: React.PointerEvent<HTMLDivElement>) => {
        const rect = trackRef.current?.getBoundingClientRect();
        if (!rect) return;
        onChange(Math.round(((event.clientX - rect.left) / rect.width) * 100));
    };

    return (
        <div className="flex w-[180px] items-center justify-center gap-[5px]">
            <img src={icon} alt={alt} className="h-5 w-5" />

            <div
                ref={trackRef}
                onPointerDown={(event) => {
                    event.currentTarget.setPointerCapture(event.pointerId);
                    updateFromPointer(event);
                }}
                onPointerMove={(event) => {
                    if (event.currentTarget.hasPointerCapture(event.pointerId)) updateFromPointer(event);
                }}
                className="relative flex h-7 w-[120px] cursor-pointer touch-none items-center"
            >
                <div
                    className="h-[10px] w-full rounded-[90px] border-2"
                    style={{
                        background: COLORS.AZUL_PRINCIPAL,
                        borderColor: COLORS.CELESTE_PRINCIPAL,
                    }}
                />
                <div
                    className="absolute top-1/2 h-[14px] w-[14px] rounded-full shadow-[0_0_4px_rgba(0,0,0,0.70)]"
                    style={{
                        left: `${value}%`,
                        transform: `translate(-${value}%, -50%)`,
                        background: COLORS.CELESTE_PRINCIPAL,
                    }}
                />
            </div>

            <div
                className="w-10 text-left font-['Nunito'] text-xs font-black"
                style={{ color: COLORS.CELESTE_PRINCIPAL }}
            >
                {value}%
            </div>
        </div>
    );
}

// 1. AÑADIMOS activeTab y setActiveTab A LAS PROPS DEL COMPONENTE
export default function LateralMenu({ activeTab, setActiveTab } : parameters) {
    const { ros, ipAddress, setIpAddress, baseSpeed, setBaseSpeed, isConnected } = useRos();
    const [isIpModalOpen, setIsIpModalOpen] = useState(false);
    const [volume, setVolume] = useState(50);
    const [speed, setSpeed] = useState(Math.round(baseSpeed * 100));

    // Móvil: el menú completo queda en el flujo de la página; al salir de vista aparece una barra compacta fija
    const fullMenuRef = useRef<HTMLDivElement>(null);
    const [isCompact, setIsCompact] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

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

    // --- Detecta cuándo el menú completo salió de la vista (scroll hacia abajo) ---
    useEffect(() => {
        const el = fullMenuRef.current;
        if (!el) return;
        const observer = new IntersectionObserver(
            ([entry]) => {
                const scrolledPast = !entry.isIntersecting && entry.boundingClientRect.top < 0;
                setIsCompact(scrolledPast);
                if (!scrolledPast) setIsDropdownOpen(false);
            },
            // Se considera "fuera de vista" cuando ya solo asoman ~56px, justo donde empieza la barra
            { rootMargin: `-${COMPACT_BAR_HEIGHT}px 0px 0px 0px` },
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

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

    const handleIpSave = (newIp: string) => {
        setIpAddress(newIp);
        setIsIpModalOpen(false);
    };

    const handleSelectTabFromDropdown = (tab: string) => {
        setActiveTab(tab);
        setIsDropdownOpen(false);
    };

    const openIpModal = () => {
        setIsDropdownOpen(false);
        setIsIpModalOpen(true);
    };

    // Rojo: IP válida pero sin conexión; amarillo: IP aún incompleta; celeste: conectado
    const isIpValid = isValidIpv4(ipAddress);
    const ipColor = !isIpValid ? COLORS.AMARILLO : isConnected ? COLORS.CELESTE_PRINCIPAL : COLORS.ROJO;

    const activeTabInfo = TABS.find((tab) => tab.id === activeTab) ?? TABS[0];

    const slidersAndIp = (containerClass: string) => (
        <div className={containerClass}>
            <SliderRow icon={IconoVolumen} alt="Icono Volumen" value={volume} onChange={updateVolume} />
            <SliderRow icon={IconoSpeed} alt="Icono Velocidad" value={speed} onChange={updateSpeed} />
            <button
                type="button"
                onClick={openIpModal}
                className="flex cursor-pointer flex-col items-center border-none bg-transparent p-0 font-['Nunito']"
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
            </button>
        </div>
    );

    return (
        <>
            {/* ── MENÚ COMPLETO (en el flujo de la página) ── */}
            <div
                ref={fullMenuRef}
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

                <NavButtons activeTab={activeTab} onSelect={setActiveTab} variant="full" />

                {/*Sliders and IP container*/}
                {slidersAndIp("flex w-full flex-row flex-wrap items-center justify-center gap-3 lg:w-[180px] lg:flex-col lg:gap-[15px]")}
            </div>

            {/* ── BARRA COMPACTA + DROPDOWN (solo móvil / tablet) ── */}
            {/* El fondo va fuera de la barra: un ancestro con translate cambiaría el "fixed" de sus hijos */}
            {isDropdownOpen && (
                <button
                    type="button"
                    aria-label="Cerrar menú"
                    onClick={() => setIsDropdownOpen(false)}
                    className="fixed inset-0 z-30 cursor-default border-none bg-black/40 p-0 lg:hidden"
                />
            )}
            <div
                className={`fixed inset-x-0 top-0 z-40 transition-[transform,visibility] duration-200 lg:hidden ${
                    isCompact ? 'translate-y-0' : '-translate-y-full invisible'
                }`}
            >
                <div
                    className="flex items-center gap-2 px-3 shadow-[0_4px_12px_rgba(0,0,0,0.35)]"
                    style={{ height: COMPACT_BAR_HEIGHT, backgroundColor: COLORS.AZUL_PRINCIPAL }}
                >
                    <div className="hidden min-[420px]:block">
                        <BatteryIcon />
                    </div>

                    <button
                        type="button"
                        onClick={() => setIsDropdownOpen((open) => !open)}
                        aria-expanded={isDropdownOpen}
                        aria-controls="menu-dropdown"
                        className="flex h-11 min-w-0 flex-1 cursor-pointer items-center gap-2 rounded-[16px] border-none px-3"
                        style={{ background: COLORS.CELESTE_PRINCIPAL }}
                    >
                        <img src={activeTabInfo.icon} alt="" className="h-6 w-6 shrink-0" />
                        <span
                            className="truncate font-['Nunito'] text-sm font-bold"
                            style={{ color: COLORS.AZUL_PRINCIPAL }}
                        >
                            {activeTabInfo.label}
                        </span>
                        <span
                            aria-hidden="true"
                            className={`h-2.5 w-2.5 shrink-0 rounded-full ${isIpValid ? '' : 'animate-pulse'}`}
                            style={{ background: !isIpValid ? COLORS.AMARILLO : isConnected ? COLORS.VERDE : COLORS.ROJO }}
                        />
                        <svg
                            aria-hidden="true"
                            viewBox="0 0 24 24"
                            className={`ml-auto h-5 w-5 shrink-0 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`}
                            fill="none"
                            stroke={COLORS.AZUL_PRINCIPAL}
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="M6 9l6 6 6-6" />
                        </svg>
                    </button>

                    {/* Esc ya lo escucha el botón de pánico principal; aquí no se duplica */}
                    <PanicButton compact enableHotkey={false} />
                </div>

                {isDropdownOpen && (
                    <div
                        id="menu-dropdown"
                        className="flex max-h-[calc(100dvh-4.5rem)] flex-col items-center gap-4 overflow-y-auto overscroll-contain rounded-b-[25px] p-4 shadow-[0_8px_16px_rgba(0,0,0,0.4)]"
                        style={{ backgroundColor: COLORS.AZUL_PRINCIPAL }}
                    >
                        <div className="flex shrink-0 items-center justify-center gap-3">
                            <BatteryIcon />
                            <img src={logoSinfonia} alt="Logo Sinfonia" className="h-[39px] w-[120px]" />
                        </div>

                        <NavButtons activeTab={activeTab} onSelect={handleSelectTabFromDropdown} variant="dropdown" />

                        {slidersAndIp("flex w-full flex-col items-center gap-3")}
                    </div>
                )}
            </div>

            <IpModal
                isOpen={isIpModalOpen}
                currentIp={ipAddress}
                onClose={() => setIsIpModalOpen(false)}
                onSave={handleIpSave}
            />
        </>
    );
}
