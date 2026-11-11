import { useRef, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { COLORS, withAlpha } from "../theme";

type SliderPillProps = {
    icon: LucideIcon;
    label: string;
    value: number;
    onChange: (value: number) => void;
    // Valor máximo (por defecto 100)
    max?: number;
    // Zona de riesgo: por encima de este valor la píldora se pone roja y el tramo final del riel ya se ve rojo de antemano
    dangerAbove?: number;
    // Aviso mostrado mientras el valor está en la zona de riesgo (tooltip, lectores de pantalla y, con showHint, un cartel bajo la píldora)
    dangerHint?: string;
    // Cartel flotante bajo la píldora; solo tiene sitio sobre el borde del tablero
    showHint?: boolean;
    // Icono alternativo (p. ej. una alerta) mientras el valor está en la zona de riesgo
    dangerIcon?: LucideIcon;
};

const THUMB = 16;
const KEY_STEP = 5;

// Slider en una píldora (misma familia que BatteryPill / IpPill): icono, barra con progreso, tirador y porcentaje.
// Se arrastra con puntero (ratón o dedo) y también funciona con el teclado (flechas, Inicio, Fin).
const SliderPill = ({
    icon,
    label,
    value,
    onChange,
    max = 100,
    dangerAbove,
    dangerHint,
    showHint = false,
    dangerIcon,
}: SliderPillProps) => {
    const trackRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);

    const clamp = (v: number) => Math.min(max, Math.max(0, v));
    const isDanger = dangerAbove !== undefined && value > dangerAbove;
    const Icon = isDanger && dangerIcon ? dangerIcon : icon;

    // El tirador (16px) se mueve dentro de la barra: su centro recorre [8px, ancho - 8px]
    const updateFromPointer = (event: React.PointerEvent<HTMLDivElement>) => {
        const rect = trackRef.current?.getBoundingClientRect();
        if (!rect || rect.width <= THUMB) return;
        onChange(Math.round(clamp(((event.clientX - rect.left - THUMB / 2) / (rect.width - THUMB)) * max)));
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
        const step = event.shiftKey ? KEY_STEP * 2 : KEY_STEP;
        const next =
            event.key === "ArrowRight" || event.key === "ArrowUp" ? value + step
            : event.key === "ArrowLeft" || event.key === "ArrowDown" ? value - step
            : event.key === "Home" ? 0
            : event.key === "End" ? max
            : null;
        if (next === null) return;
        event.preventDefault();
        onChange(clamp(next));
    };

    const usable = (ratio: number) => `calc((100% - ${THUMB}px) * ${ratio})`;
    const position = usable(value / max);

    // Colores: celeste con contorno azul (como los botones del menú) y tirador morado; rojo con texto blanco en la zona de riesgo.
    // El contorno azul se funde con la línea del borde cuando la píldora va montada sobre él.
    const colors = isDanger
        ? { pill: COLORS.ROJO, outline: COLORS.ROJO_OSCURO, text: COLORS.TEXTO_SOBRE_ROJO, rail: withAlpha(COLORS.TEXTO_SOBRE_ROJO, 30), fill: COLORS.TEXTO_SOBRE_ROJO, zone: "rgba(0,0,0,0.3)", thumb: COLORS.TEXTO_SOBRE_ROJO, thumbBorder: COLORS.ROJO }
        : { pill: COLORS.CELESTE_PRINCIPAL, outline: COLORS.BORDE_TABLERO, text: COLORS.AZUL_PRINCIPAL, rail: withAlpha(COLORS.AZUL_PRINCIPAL, 20), fill: COLORS.AZUL_PRINCIPAL, zone: COLORS.ROJO, thumb: COLORS.AZUL_SECUNDARIO, thumbBorder: COLORS.AZUL_PRINCIPAL };

    const hint = isDanger && dangerHint ? dangerHint : "";

    return (
        <div
            title={`${label}: ${value}%${hint ? ` · ${hint}` : ""}`}
            className="relative inline-flex h-8 items-center gap-2 rounded-full border-2 border-solid px-2.5 font-['Nunito'] shadow-[0_2px_6px_rgba(0,0,0,0.25)] transition-colors duration-200"
            style={{ backgroundColor: colors.pill, color: colors.text, borderColor: colors.outline }}
        >
            <Icon aria-hidden="true" size={18} strokeWidth={2.5} className="shrink-0" />

            <div
                ref={trackRef}
                role="slider"
                tabIndex={0}
                aria-label={label}
                aria-valuemin={0}
                aria-valuemax={max}
                aria-valuenow={value}
                aria-valuetext={`${value}%${hint ? `. ${hint}` : ""}`}
                onKeyDown={handleKeyDown}
                onPointerDown={(event) => {
                    event.currentTarget.setPointerCapture(event.pointerId);
                    setIsDragging(true);
                    updateFromPointer(event);
                }}
                onPointerMove={(event) => {
                    if (event.currentTarget.hasPointerCapture(event.pointerId)) updateFromPointer(event);
                }}
                onPointerUp={() => setIsDragging(false)}
                onPointerCancel={() => setIsDragging(false)}
                className="group relative flex h-8 w-[104px] cursor-pointer touch-none items-center outline-none"
            >
                {/* Riel */}
                <div className="h-1.5 w-full rounded-full transition-colors duration-200" style={{ backgroundColor: colors.rail }} />
                {/* Zona de riesgo del riel: siempre visible para saber de antemano dónde empieza */}
                {dangerAbove !== undefined && (
                    <div
                        className="absolute right-0 h-1.5 rounded-r-full transition-colors duration-200"
                        style={{ left: `calc(${usable(dangerAbove / max)} + ${THUMB / 2}px)`, backgroundColor: colors.zone }}
                    />
                )}
                {/* Progreso: llega hasta el centro del tirador */}
                <div
                    className="absolute left-0 h-1.5 rounded-full transition-colors duration-200"
                    style={{ width: `calc(${position} + ${THUMB / 2}px)`, backgroundColor: colors.fill }}
                />
                {/* Tirador */}
                <div
                    className={`absolute top-1/2 -translate-y-1/2 rounded-full border-2 border-solid shadow-[0_1px_4px_rgba(0,0,0,0.45)] transition-[transform,background-color,border-color] duration-150 group-hover:scale-125 group-focus-visible:scale-125 group-focus-visible:ring-4 group-focus-visible:ring-azul/30 ${
                        isDragging ? "scale-125" : ""
                    }`}
                    style={{
                        left: position,
                        width: THUMB,
                        height: THUMB,
                        backgroundColor: colors.thumb,
                        borderColor: colors.thumbBorder,
                    }}
                />
            </div>

            <span aria-hidden="true" className="w-9 text-right text-xs font-black tabular-nums leading-none">
                {value}%
            </span>

            {showHint && hint && (
                <div
                    role="status"
                    className="pointer-events-none absolute left-1/2 top-full z-10 mt-2 -translate-x-1/2 whitespace-nowrap rounded-full px-3 py-1 text-[11px] font-bold leading-none text-[var(--c-texto-sobre-rojo)] shadow-[0_2px_6px_rgba(0,0,0,0.3)]"
                    style={{ backgroundColor: COLORS.ROJO }}
                >
                    {hint}
                </div>
            )}
        </div>
    );
};

export default SliderPill;
