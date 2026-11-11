// src/themeImages.ts
import type { ThemeName } from './components/SinfoniaLogo';

/*
 * Imágenes que cambian con el tema.
 *
 * Cada tema tiene una entrada por cada sitio donde hay una imagen que puede cambiar. Escribe la ruta de la imagen
 * entre las comillas; si se deja vacía ('') se usa la imagen que ya trae el componente (la de siempre).
 *
 * Rutas válidas:
 *   - Un archivo de `src/assets`: 'pepper_navidad.png' (también 'navidad/robot.png' si hay subcarpeta, o
 *     'src/assets/pepper_navidad.png'). Es lo recomendable: Vite lo empaqueta y le pone su hash.
 *   - Un archivo de la carpeta `public`: '/temas/navidad.png'.
 *   - Una URL completa: 'https://...'.
 *
 * Sitios (ThemeImageSlot):
 *   robotControlSeguridad → el robot de la tarjeta "Control seguridad" (pestaña Principal)
 *   pepperServicios       → el Pepper grande de la pestaña Servicios
 */
export type ThemeImageSlot = 'robotControlSeguridad' | 'pepperServicios';

export const THEME_IMAGES: Record<ThemeName, Record<ThemeImageSlot, string>> = {
    default: {
        robotControlSeguridad: '',
        pepperServicios: '',
    },
    pride: {
        robotControlSeguridad: 'src/assets/pepper_pride.png',
        pepperServicios: 'src/assets/complete_pepper_pride.png',
    },
    christmas: {
        robotControlSeguridad: 'src/assets/pepper_navidad.png',
        pepperServicios: 'src/assets/complete_pepper_navidad.png',
    },
    halloween: {
        robotControlSeguridad: 'src/assets/pepper_halloween.png',
        pepperServicios: 'src/assets/complete_pepper_halloween_2.png',
    },
    valentines: {
        robotControlSeguridad: 'src/assets/pepper_sanValentin_2.png',
        pepperServicios: 'src/assets/complete_pepper_sanValentin.png',
    },
};

// Todas las imágenes de src/assets, para poder usar rutas relativas a esa carpeta (Vite necesita conocerlas al compilar)
const ASSETS = import.meta.glob('./assets/**/*.{png,jpg,jpeg,webp,gif,avif,svg}', {
    eager: true,
    query: '?url',
    import: 'default',
}) as Record<string, string>;

// Convierte la ruta escrita en THEME_IMAGES en una URL que el navegador pueda cargar.
// Devuelve undefined si está vacía o si apunta a un archivo de src/assets que no existe.
const resolveImagePath = (path: string): string | undefined => {
    const trimmed = path.trim();
    if (!trimmed) return undefined;
    // URL completa
    if (/^(https?:|data:)/i.test(trimmed)) return trimmed;
    // Ruta absoluta que no es de src/assets: carpeta `public`
    if (trimmed.startsWith('/') && !/^\/(src\/)?assets\//.test(trimmed)) return trimmed;
    // Ruta de src/assets: 'x.png', './assets/x.png', 'src/assets/x.png' o '/src/assets/x.png'
    const relative = trimmed.replace(/^(\.?\/)?(src\/)?(assets\/)?/, '');
    return ASSETS['./assets/' + relative];
};

// Imagen configurada para un tema y un sitio, o undefined si está vacía (o no se encuentra): usar la de por defecto
export const themeImage = (theme: ThemeName, slot: ThemeImageSlot): string | undefined =>
    resolveImagePath(THEME_IMAGES[theme]?.[slot] ?? '');

// En desarrollo, avisa de rutas escritas que no corresponden a ningún archivo de src/assets (typos)
if (import.meta.env.DEV) {
    (Object.keys(THEME_IMAGES) as ThemeName[]).forEach((theme) => {
        (Object.keys(THEME_IMAGES[theme]) as ThemeImageSlot[]).forEach((slot) => {
            const path = THEME_IMAGES[theme][slot].trim();
            if (path && !resolveImagePath(path)) {
                console.warn(`[tema] Imagen no encontrada para "${theme}" / ${slot}: "${path}". Se usa la de por defecto.`);
            }
        });
    });
}
