import { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { COLORS, defaultPaletteId, themeCardGradient, themeCardTones, themeLogoColors, themeLogoOutlines, themeLogoPlate, themePalette, themePaletteOptions } from '.';
import type { ThemeSelection } from './useTheme';
import CustomScrollbar from '../components/layout/CustomScrollbar';
import SinfoniaLogo, { THEMES, THEME_LABELS, type ThemeName } from './SinfoniaLogo';

type ThemeModalProps = {
    isOpen: boolean;
    currentTheme: ThemeName;
    currentPalette?: string;
    onClose: () => void;
    // Se llama solo al pulsar ACEPTAR, con el tema (y la paleta) elegidos
    onSelect: (selection: ThemeSelection) => void;
};

const THEME_NAMES = Object.keys(THEMES) as ThemeName[];

type ThemeDialogProps = Omit<ThemeModalProps, 'isOpen'>;

// Muestras de una paleta: el color de la página, los colores de las tarjetas (los del degradado si lo tiene, si no sus
// tonos, o el azul principal si no tiene tonos) y el acento
const PaletteSwatches = ({ theme, palette }: { theme: ThemeName; palette: string }) => {
    const { FONDO_PAGINA, AZUL_PRINCIPAL, AZUL_SECUNDARIO } = themePalette(theme, palette);
    const gradient = themeCardGradient(theme, palette);
    const cards = gradient.length ? gradient : themeCardTones(theme, palette).map((tone) => tone.fondo);
    const colors = [FONDO_PAGINA, ...(cards.length ? cards : [AZUL_PRINCIPAL]), AZUL_SECUNDARIO];
    return (
        <span className="flex items-center gap-1" aria-hidden="true">
            {colors.map((color, i) => (
                <span key={`${color}-${i}`} className="h-3 w-3 shrink-0 rounded-full border border-solid border-white/60" style={{ backgroundColor: color }} />
            ))}
        </span>
    );
};

// Se monta solo mientras el modal está abierto, así la selección pendiente arranca siempre en el tema actual
const ThemeDialog = ({ currentTheme, currentPalette, onClose, onSelect }: ThemeDialogProps) => {
    const [pending, setPending] = useState<ThemeSelection>({ theme: currentTheme, palette: currentPalette });
    const scrollRef = useRef<HTMLDivElement>(null);

    // Portal a <body>, igual que IpModal: el menú crea su propio stacking context
    return createPortal(
        <div
            onClick={onClose}
            className="fixed inset-0 z-[1000] flex items-center justify-center bg-[rgba(0,0,0,0.7)] p-4"
            style={{ '--azul': COLORS.AZUL_PRINCIPAL, '--celeste': COLORS.CELESTE_PRINCIPAL, '--lila': COLORS.AZUL_SECUNDARIO } as React.CSSProperties}
        >
            <div
                role="dialog"
                aria-label="Tema"
                onClick={e => e.stopPropagation()}
                className="flex max-h-full w-full max-w-[850px] flex-col items-center gap-4 overflow-hidden rounded-[20px] bg-[var(--azul)] px-6 pb-6"
            >
                <div className="flex h-[30px] w-[245px] max-w-full shrink-0 items-center justify-center rounded-b-[20px] bg-[var(--celeste)] text-base font-extrabold text-[var(--azul)] font-[Nunito]">
                    TEMA
                </div>

                {/* Solo los temas scrollean: el título y los botones se quedan fijos arriba y abajo. La barra es la propia de la app,
                    en un hueco a la derecha para no tapar las tarjetas */}
                <div className="relative flex min-h-0 w-full flex-1 flex-col">
                <div ref={scrollRef} className="no-native-scrollbar min-h-0 flex-1 overflow-y-auto pr-5">
                <div className="grid w-full grid-cols-1 gap-2.5 min-[640px]:grid-cols-2">
                    {THEME_NAMES.map(name => {
                        const selected = name === pending.theme;
                        const palettes = themePaletteOptions(name);
                        // El logo se ve sobre el color de menú (LOGO_FONDO) de la paleta que tendría ese tema (la elegida, o la de por defecto)
                        const logoPalette = selected ? pending.palette : defaultPaletteId(name);
                        const logoBackground = themePalette(name, logoPalette).LOGO_FONDO;
                        return (
                            <div
                                key={name}
                                className={`flex flex-col overflow-hidden rounded-[14px] border-2 border-solid font-[Nunito] transition-colors ${
                                    selected
                                        ? 'border-[var(--lila)] bg-[var(--lila)]/20'
                                        : 'border-[var(--celeste)]/30 bg-transparent hover:border-[var(--celeste)]'
                                }`}
                            >
                                {/* Elegir el tema: si ya era el elegido se conserva su paleta; si no, la de por defecto */}
                                <button
                                    type="button"
                                    aria-pressed={selected}
                                    onClick={() => setPending(selected ? pending : { theme: name, palette: defaultPaletteId(name) })}
                                    className="flex w-full cursor-pointer flex-col items-center border-none bg-transparent p-0 font-[Nunito]"
                                >
                                    {/* Cabecera con el color del menú lateral de ese tema: así se verá el logo */}
                                    <span className="flex w-full justify-center px-3 py-4" style={{ backgroundColor: logoBackground, ...themeLogoPlate(name, logoPalette, 90) }}>
                                        <SinfoniaLogo theme={name} colors={themeLogoColors(name, logoPalette)} outlines={themeLogoOutlines(name, logoPalette)} className="block h-auto w-full max-w-[240px]" />
                                    </span>
                                    <span className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 px-3 py-2">
                                        <span className="text-sm font-extrabold text-[var(--celeste)]">{THEME_LABELS[name]}</span>
                                        {/* Un tema con una sola paleta: solo se muestran sus colores */}
                                        {palettes.length === 1 && <PaletteSwatches theme={name} palette={palettes[0].id} />}
                                    </span>
                                </button>

                                {/* Varias paletas: se elige entre ellas */}
                                {palettes.length > 1 && (
                                    <div className="flex w-full flex-wrap justify-center gap-1.5 px-3 pb-3" role="group" aria-label={`Paletas de ${THEME_LABELS[name]}`}>
                                        {palettes.map(option => {
                                            const on = selected && pending.palette === option.id;
                                            return (
                                                <button
                                                    key={option.id}
                                                    type="button"
                                                    aria-pressed={on}
                                                    title={`Paleta ${option.label}`}
                                                    onClick={() => setPending({ theme: name, palette: option.id })}
                                                    className={`inline-flex cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-full border-2 border-solid bg-transparent px-2 py-0.5 text-[11px] font-bold font-[Nunito] transition-colors ${
                                                        on
                                                            ? 'border-[var(--lila)] bg-[var(--lila)]/25 text-[var(--celeste)]'
                                                            : 'border-[var(--celeste)]/30 text-[var(--celeste)]/80 hover:border-[var(--celeste)]'
                                                    }`}
                                                >
                                                    <PaletteSwatches theme={name} palette={option.id} />
                                                    {option.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
                </div>
                <CustomScrollbar
                    scrollRef={scrollRef}
                    className="bottom-0 right-0 top-0 flex"
                    color={COLORS.CELESTE_PRINCIPAL}
                    accent={COLORS.AZUL_SECUNDARIO}
                    grip={COLORS.AZUL_PRINCIPAL}
                />
                </div>

                <div className="flex w-full shrink-0 gap-2.5">
                    <button
                        type="button"
                        onClick={onClose}
                        className="h-8 flex-1 cursor-pointer rounded-[90px] border-2 border-solid border-[var(--celeste)]/50 bg-transparent text-xs font-bold text-[var(--celeste)] font-[Nunito] transition-colors hover:border-[var(--celeste)]"
                    >
                        CANCELAR
                    </button>
                    <button
                        type="button"
                        onClick={() => onSelect(pending)}
                        className="h-8 flex-1 cursor-pointer rounded-[90px] border-none bg-[var(--celeste)] text-xs font-bold text-[var(--azul)] font-[Nunito]"
                    >
                        ACEPTAR
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

const ThemeModal = ({ isOpen, ...props }: ThemeModalProps) => (isOpen ? <ThemeDialog {...props} /> : null);

export default ThemeModal;
