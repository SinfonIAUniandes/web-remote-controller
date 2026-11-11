import { useState, useEffect, useRef } from "react";
import { Bot, ChevronDown, House, Megaphone, type LucideIcon } from "lucide-react";
import { COLORS, themeLogoColors, themeLogoOutlines, themeLogoPlate } from "../theme";
import { useIpStatus } from "../services/useIpStatus";
import { useTheme, type ThemeSelection } from "../services/useTheme";
import BatteryIcon from "./BatteryIcon";
import RobotSliders from "./RobotSliders";
import SinfoniaLogo from "./SinfoniaLogo";
import ThemeModal from "./ThemeModal";
import PanicButton from "./PanicButton";

type LateralMenuProps = {
    activeTab: string
    setActiveTab: (tab: string) => void
}

const TABS: { id: string; label: string; icon: LucideIcon }[] = [
    { id: 'principal', label: 'Principal', icon: House },
    { id: 'servicios', label: 'Servicios', icon: Bot },
    { id: 'scripts', label: 'Scripts', icon: Megaphone },
];

// Alto de la barra compacta (h-14 = 56px). Se usa también para saber cuándo mostrarla.
const COMPACT_BAR_HEIGHT = 56;

type NavButtonsProps = {
    activeTab: string
    onSelect: (tab: string) => void
    // 'full': el menú completo (columna en escritorio, fila en móvil); 'dropdown': el desplegable de la barra compacta
    variant: 'full' | 'dropdown'
}

function NavButtons({ activeTab, onSelect, variant }: NavButtonsProps) {
    const [hoveredTab, setHoveredTab] = useState<string | null>(null);

    const containerClass = variant === 'full'
        ? "grid h-auto w-full grid-cols-3 items-center justify-items-center gap-2 py-2 md:w-auto md:gap-4 md:py-0 desk:flex desk:py-4 desk:w-[125px] desk:flex-col desk:justify-center desk:gap-2"
        : "grid w-full grid-cols-3 gap-2";
    const buttonClass = variant === 'full'
        ? "inline-flex h-[28vw] w-[28vw] max-h-[105px] max-w-[125px] cursor-pointer flex-col items-center justify-center gap-[3px] rounded-[30px] border-none p-0 sm:h-[110px] sm:w-[110px] desk:h-[125px] desk:w-[125px]"
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
                    {/* El nombre ya está en el texto del botón: el icono es decorativo */}
                    <tab.icon aria-hidden="true" size={35} strokeWidth={2} style={{ color: COLORS.AZUL_PRINCIPAL }} />
                </button>
            ))}
        </nav>
    );
}

// Menú lateral: logo (abre el selector de tema), pestañas y, solo en móvil / tablet, volumen y velocidad.
// En móvil / tablet, al hacer scroll aparece una barra compacta fija con un desplegable con todo el menú.
export default function LateralMenu({ activeTab, setActiveTab }: LateralMenuProps) {
    const { connected } = useIpStatus();
    const { theme, palette, changeTheme } = useTheme();
    const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);

    // Móvil: el menú completo queda en el flujo de la página; al salir de vista aparece la barra compacta fija
    const fullMenuRef = useRef<HTMLDivElement>(null);
    const [isCompact, setIsCompact] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

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

    const handleSelectTabFromDropdown = (tab: string) => {
        setActiveTab(tab);
        setIsDropdownOpen(false);
    };

    const openThemeModal = () => {
        setIsDropdownOpen(false);
        setIsThemeModalOpen(true);
    };

    const handleSelectTheme = (selection: ThemeSelection) => {
        changeTheme(selection);
        setIsThemeModalOpen(false);
    };

    const activeTabInfo = TABS.find((tab) => tab.id === activeTab) ?? TABS[0];
    const ActiveTabIcon = activeTabInfo.icon;

    // El logo es un botón: al hacer clic abre el selector de tema (logo y colores de toda la app)
    const logoButton = (
        <button
            type="button"
            onClick={openThemeModal}
            aria-label="Cambiar tema"
            title="Cambiar tema"
            className="mb-3 cursor-pointer border-none bg-transparent p-0 transition-transform duration-200 hover:scale-105"
        >
            <SinfoniaLogo theme={theme} colors={themeLogoColors(theme, palette)} outlines={themeLogoOutlines(theme, palette)} className="block h-auto w-[370px] desk:w-[200px]" />
        </button>
    );

    return (
        <>
            {/* ── MENÚ COMPLETO (en el flujo de la página) ── */}
            <div
                ref={fullMenuRef}
                className="flex min-h-[220px] w-full flex-col items-center justify-between rounded-[25px] p-3 sm:min-h-[250px] md:min-h-0 md:flex-row md:gap-6 md:px-6 desk:h-full desk:flex-1 desk:flex-col desk:justify-center desk:gap-10 desk:p-5 desk:w-[220px]"
                style={{ backgroundColor: COLORS.LOGO_FONDO, ...themeLogoPlate(theme, palette) }}
            >
                {logoButton}

                <NavButtons activeTab={activeTab} onSelect={setActiveTab} variant="full" />

                {/* Volumen y velocidad: en escritorio van sobre el borde del tablero (BoardBorderPills); aquí solo en móvil / tablet */}
                <RobotSliders className="flex w-full flex-row flex-wrap items-center justify-center gap-3 md:w-auto md:flex-col md:flex-nowrap desk:hidden" />
            </div>

            {/* ── BARRA COMPACTA + DESPLEGABLE (solo móvil / tablet) ── */}
            {/* El fondo va fuera de la barra: un ancestro con translate cambiaría el "fixed" de sus hijos */}
            {isDropdownOpen && (
                <button
                    type="button"
                    aria-label="Cerrar menú"
                    onClick={() => setIsDropdownOpen(false)}
                    className="fixed inset-0 z-30 cursor-default border-none bg-black/40 p-0 desk:hidden"
                />
            )}
            <div
                className={`fixed inset-x-0 top-0 z-40 transition-[transform,visibility] duration-200 desk:hidden ${
                    isCompact ? 'translate-y-0' : '-translate-y-full invisible'
                }`}
            >
                <div
                    className="flex items-center gap-2 px-3 shadow-[0_4px_12px_rgba(0,0,0,0.35)]"
                    style={{ height: COMPACT_BAR_HEIGHT, backgroundColor: COLORS.LOGO_FONDO, ...themeLogoPlate(theme, palette, 90) }}
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
                        style={{ background: COLORS.CELESTE_PRINCIPAL, color: COLORS.AZUL_PRINCIPAL }}
                    >
                        <ActiveTabIcon aria-hidden="true" size={24} strokeWidth={2} className="shrink-0" />
                        <span
                            className="truncate font-['Nunito'] text-sm font-bold"
                            style={{ color: COLORS.AZUL_PRINCIPAL }}
                        >
                            {activeTabInfo.label}
                        </span>
                        {/* Estado de la conexión: verde si hay conexión; rojo si no la hay o falta la IP (la IP se edita en IpPill) */}
                        <span
                            aria-hidden="true"
                            className="h-2.5 w-2.5 shrink-0 rounded-full"
                            style={{ background: connected ? COLORS.VERDE : COLORS.ROJO }}
                        />
                        <ChevronDown
                            aria-hidden="true"
                            size={20}
                            strokeWidth={3}
                            className={`ml-auto shrink-0 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`}
                        />
                    </button>

                    {/* Esc ya lo escucha el botón de pánico principal; aquí no se duplica */}
                    <PanicButton compact enableHotkey={false} />
                </div>

                {isDropdownOpen && (
                    <div
                        id="menu-dropdown"
                        className="flex max-h-[calc(100dvh-4.5rem)] flex-col items-center gap-4 overflow-y-auto overscroll-contain rounded-b-[25px] p-4 shadow-[0_8px_16px_rgba(0,0,0,0.4)]"
                        style={{ backgroundColor: COLORS.LOGO_FONDO, ...themeLogoPlate(theme, palette) }}
                    >
                        <div className="flex shrink-0 items-center justify-center gap-3">
                            <BatteryIcon />
                            {logoButton}
                        </div>

                        <NavButtons activeTab={activeTab} onSelect={handleSelectTabFromDropdown} variant="dropdown" />

                        <RobotSliders className="flex w-full flex-col items-center gap-3" />
                    </div>
                )}
            </div>

            <ThemeModal
                isOpen={isThemeModalOpen}
                currentTheme={theme}
                currentPalette={palette}
                onClose={() => setIsThemeModalOpen(false)}
                onSelect={handleSelectTheme}
            />
        </>
    );
}
