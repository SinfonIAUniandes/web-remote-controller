import { useCallback, useEffect, useRef, useState } from "react";
import { COLORS, withAlpha } from "../../theme";

type CustomScrollbarProps = {
    // Contenedor que scrollea; esta barra solo lo refleja y lo controla
    scrollRef: React.RefObject<HTMLDivElement | null>;
    // Posición y visibilidad (la barra va con `absolute`, sobre un contenedor `relative`). Por defecto es la del tablero:
    // en el marco redondeado, solo en escritorio
    className?: string;
    // Colores: pista y flechas, pieza al moverla / pasar el ratón, y marcas de agarre. Por defecto los del tablero
    color?: string;
    accent?: string;
    grip?: string;
};

const MIN_THUMB_HEIGHT = 36;
const THIN_WIDTH = 6;
const WIDE_WIDTH = 12;
const SCROLLING_FEEDBACK_MS = 700;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const Chevron = ({ direction }: { direction: "up" | "down" }) => (
    <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="h-3 w-3"
        fill="none"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path d={direction === "up" ? "M6 15l6-6 6 6" : "M6 9l6 6 6-6"} />
    </svg>
);

const BOARD_POSITION = "bottom-[22px] right-[3px] top-[22px] hidden desk:flex";

// Scrollbar propia: deja oculto el scroll nativo del contenedor (clase `no-native-scrollbar`) y dibuja su pista, flechas y
// pieza arrastrable. Se usa en el tablero (encima del marco de borde redondeado) y en el modal de temas.
const CustomScrollbar = ({
    scrollRef,
    className = BOARD_POSITION,
    color = COLORS.BORDE_TABLERO,
    accent = COLORS.AZUL_SECUNDARIO,
    grip = COLORS.FONDO_PAGINA,
}: CustomScrollbarProps) => {
    const trackRef = useRef<HTMLDivElement>(null);
    const dragRef = useRef<{ startY: number; startScroll: number } | null>(null);
    const scrollingTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

    const [metrics, setMetrics] = useState({
        top: 0,
        height: MIN_THUMB_HEIGHT,
        canUp: false,
        canDown: false,
        scrollable: false,
    });
    const [isHovered, setIsHovered] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [isScrolling, setIsScrolling] = useState(false);

    const update = useCallback(() => {
        const el = scrollRef.current;
        const track = trackRef.current;
        if (!el || !track) return;
        const maxScroll = el.scrollHeight - el.clientHeight;
        const trackHeight = track.clientHeight;
        const height = Math.min(trackHeight, Math.max(MIN_THUMB_HEIGHT, (trackHeight * el.clientHeight) / el.scrollHeight));
        const top = maxScroll > 0 ? (el.scrollTop / maxScroll) * (trackHeight - height) : 0;
        setMetrics({
            top,
            height,
            canUp: el.scrollTop > 1,
            canDown: el.scrollTop < maxScroll - 1,
            scrollable: maxScroll > 1,
        });
    }, [scrollRef]);

    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;

        const onScroll = () => {
            update();
            setIsScrolling(true);
            clearTimeout(scrollingTimerRef.current);
            scrollingTimerRef.current = setTimeout(() => setIsScrolling(false), SCROLLING_FEEDBACK_MS);
        };

        update();
        el.addEventListener("scroll", onScroll, { passive: true });
        // Recalcula al cambiar el alto de la ventana, del contenido o de la pista
        const observer = new ResizeObserver(update);
        observer.observe(el);
        if (el.firstElementChild) observer.observe(el.firstElementChild);
        if (trackRef.current) observer.observe(trackRef.current);

        return () => {
            el.removeEventListener("scroll", onScroll);
            observer.disconnect();
            clearTimeout(scrollingTimerRef.current);
        };
    }, [scrollRef, update]);

    const scrollToTop = () => scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    const scrollToBottom = () => {
        const el = scrollRef.current;
        el?.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    };

    // Clic en la pista: lleva el thumb hasta ese punto
    const handleTrackPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
        const el = scrollRef.current;
        const track = trackRef.current;
        if (!el || !track) return;
        const rect = track.getBoundingClientRect();
        const range = rect.height - metrics.height;
        if (range <= 0) return;
        const ratio = clamp((event.clientY - rect.top - metrics.height / 2) / range, 0, 1);
        el.scrollTo({ top: ratio * (el.scrollHeight - el.clientHeight), behavior: "smooth" });
    };

    const handleThumbPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
        const el = scrollRef.current;
        if (!el) return;
        event.stopPropagation();
        event.currentTarget.setPointerCapture(event.pointerId);
        dragRef.current = { startY: event.clientY, startScroll: el.scrollTop };
        setIsDragging(true);
    };

    const handleThumbPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
        const drag = dragRef.current;
        const el = scrollRef.current;
        const track = trackRef.current;
        if (!drag || !el || !track) return;
        const range = track.clientHeight - metrics.height;
        if (range <= 0) return;
        el.scrollTop = drag.startScroll + ((event.clientY - drag.startY) * (el.scrollHeight - el.clientHeight)) / range;
    };

    const handleThumbPointerEnd = () => {
        dragRef.current = null;
        setIsDragging(false);
    };

    const expanded = isHovered || isDragging;
    const active = expanded || isScrolling;
    const barWidth = expanded ? WIDE_WIDTH : THIN_WIDTH;

    const arrowClass = (enabled: boolean) =>
        `flex h-3.5 w-3.5 shrink-0 cursor-pointer items-center justify-center rounded-full border-none bg-transparent p-0 text-[var(--sb-color)] transition-[opacity,color] duration-200 hover:text-[var(--sb-accent)] ${
            enabled ? "opacity-100" : "pointer-events-none opacity-0"
        }`;

    return (
        <div
            onPointerEnter={() => setIsHovered(true)}
            onPointerLeave={() => setIsHovered(false)}
            // La barra queda encima del contenido: reenvía la rueda al contenedor que scrollea
            onWheel={(event) => scrollRef.current?.scrollBy({ top: event.deltaY })}
            // Por defecto, top/bottom ≈ radio de la esquina del marco, para no chocar con la curva del borde
            className={`absolute z-20 w-3.5 flex-col items-center gap-1 transition-opacity duration-200 ${className} ${
                metrics.scrollable ? "opacity-100" : "pointer-events-none opacity-0"
            }`}
            style={{ "--sb-color": color, "--sb-accent": accent } as React.CSSProperties}
        >
            <button type="button" aria-label="Ir al inicio" disabled={!metrics.canUp} onClick={scrollToTop} className={arrowClass(metrics.canUp)}>
                <Chevron direction="up" />
            </button>

            <div
                ref={trackRef}
                aria-hidden="true"
                onPointerDown={handleTrackPointerDown}
                className="relative min-h-0 w-full flex-1 cursor-pointer"
            >
                <div
                    className="absolute inset-y-0 left-1/2 -translate-x-1/2 rounded-full transition-[width] duration-200"
                    style={{ width: barWidth, backgroundColor: withAlpha(color, 12) }}
                />
                <div
                    onPointerDown={handleThumbPointerDown}
                    onPointerMove={handleThumbPointerMove}
                    onPointerUp={handleThumbPointerEnd}
                    onPointerCancel={handleThumbPointerEnd}
                    className="absolute left-1/2 flex -translate-x-1/2 touch-none items-center justify-center rounded-full transition-[width,background-color] duration-200"
                    style={{
                        top: metrics.top,
                        height: metrics.height,
                        width: barWidth,
                        backgroundColor: active ? accent : color,
                        cursor: isDragging ? "grabbing" : "grab",
                    }}
                >
                    {/* Marcas de agarre: solo caben (y se ven) cuando la barra se ensancha */}
                    <div className={`flex flex-col gap-[3px] transition-opacity duration-200 ${expanded ? "opacity-100" : "opacity-0"}`}>
                        {[0, 1, 2].map((i) => (
                            <span key={i} className="block h-[2px] w-1.5 rounded-full" style={{ backgroundColor: grip }} />
                        ))}
                    </div>
                </div>
            </div>

            <button type="button" aria-label="Ir al final" disabled={!metrics.canDown} onClick={scrollToBottom} className={arrowClass(metrics.canDown)}>
                <Chevron direction="down" />
            </button>
        </div>
    );
};

export default CustomScrollbar;
