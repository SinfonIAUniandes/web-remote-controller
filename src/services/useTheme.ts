import { useSyncExternalStore } from 'react';
import { THEMES, type ThemeName } from '../components/SinfoniaLogo';
import { applyTheme, defaultPaletteId, isPaletteOf } from '../theme';

// El tema y la paleta elegidos se recuerdan entre sesiones (la clave del tema se llama así desde que solo cambiaba el logo)
const THEME_KEY = 'logo_theme';
const PALETTE_KEY = 'theme_palette';

// Tema + paleta de colores de ese tema (undefined si el tema no cambia los colores)
export type ThemeSelection = { theme: ThemeName; palette?: string };

// Selección guardada, o el tema 'default' (Original). Se usa también en main.tsx para aplicarla antes del primer render.
export const loadTheme = (): ThemeSelection => {
    try {
        const savedTheme = localStorage.getItem(THEME_KEY);
        if (savedTheme && Object.prototype.hasOwnProperty.call(THEMES, savedTheme)) {
            const theme = savedTheme as ThemeName;
            const savedPalette = localStorage.getItem(PALETTE_KEY);
            // Si la paleta guardada ya no existe para ese tema, se usa la de por defecto
            const palette = savedPalette && isPaletteOf(theme, savedPalette) ? savedPalette : defaultPaletteId(theme);
            return { theme, palette };
        }
    } catch { /* localStorage puede no estar disponible */ }
    return { theme: 'default' };
};

// La selección vive fuera de React para que la compartan todos los componentes que la usan (el menú que la cambia y
// las tarjetas que reparten los tonos de la paleta) sin tener que pasarla por props.
let selection: ThemeSelection = loadTheme();
const listeners = new Set<() => void>();

const subscribe = (listener: () => void) => {
    listeners.add(listener);
    return () => { listeners.delete(listener); };
};

const getSelection = () => selection;

// Cambia el tema: aplica sus colores, lo guarda y avisa a quienes lo usan
const changeTheme = (newSelection: ThemeSelection) => {
    selection = newSelection;
    applyTheme(newSelection.theme, newSelection.palette);
    try {
        localStorage.setItem(THEME_KEY, newSelection.theme);
        if (newSelection.palette) localStorage.setItem(PALETTE_KEY, newSelection.palette);
        else localStorage.removeItem(PALETTE_KEY);
    } catch { /* sin almacenamiento: el tema sigue aplicado en esta sesión */ }
    listeners.forEach((listener) => listener());
};

// Tema y paleta actuales de la app (logo y colores) y una función para cambiarlos
export const useTheme = () => {
    const { theme, palette } = useSyncExternalStore(subscribe, getSelection);
    return { theme, palette, changeTheme };
};
