import { themeImage, type ThemeImageSlot } from '../themeImages';
import { useTheme } from './useTheme';

// Imagen de `slot` para el tema actual (ver themeImages.ts). Si el tema no define ninguna, devuelve `fallback`:
// la imagen por defecto del componente.
export const useThemeImage = (slot: ThemeImageSlot, fallback: string): string => {
    const { theme } = useTheme();
    return themeImage(theme, slot) ?? fallback;
};
