// src/theme/index.ts
import { OUTLINES, THEMES, type Outlines, type Palette as LogoPalette, type ThemeName } from './SinfoniaLogo';

/*
 * Paleta global.
 *
 * `COLORS` no contiene colores sino referencias a variables CSS (`var(--c-...)`): así se usa igual que antes
 * (`style={{ color: COLORS.AZUL_PRINCIPAL }}`, atributos de SVG, Tailwind con `var(...)`), pero el color real
 * lo pone el tema activo en <html> con `applyTheme`, sin volver a renderizar nada.
 *
 * Limitación: al ser una variable CSS, el valor NO se puede usar como texto en cálculos de color (hex → rgb,
 * canvas...) ni concatenarle un alfa (`${color}33`): para eso está `withAlpha`.
 *
 * Un tema puede cambiar CUALQUIERA de estos colores: los tres de marca (celeste / azul principal / azul secundario)
 * y también rojo, amarillo y verde. Solo el tema "Original" tiene que respetar su significado (rojo = error o
 * desconectado, verde = conectado, amarillo = aviso); en los demás cada color puede ser lo que el tema quiera.
 */
export const COLORS = {
    // Colores principales
    CELESTE_PRINCIPAL: 'var(--c-celeste-principal)',
    AZUL_PRINCIPAL: 'var(--c-azul-principal)',
    AZUL_SECUNDARIO: 'var(--c-azul-secundario)',
    ROJO: 'var(--c-rojo)',
    AMARILLO: 'var(--c-amarillo)',
    VERDE: 'var(--c-verde)',

    // Variantes de rojo y amarillo. Si el tema cambia el color principal, estas se derivan solas de él
    // (a menos que el tema las defina); si no, conservan los valores originales.
    ROJO_CLARO: 'var(--c-rojo-claro)',       // rojo sobre fondos oscuros (icono de cámara apagada)
    ROJO_SUAVE: 'var(--c-rojo-suave)',       // botones destructivos y mensajes de error
    ROJO_FUERTE: 'var(--c-rojo-fuerte)',     // el rojo suave al pasar el ratón
    ROJO_BRILLO: 'var(--c-rojo-brillo)',     // parte alta de la cara del botón de pánico
    ROJO_SOMBRA: 'var(--c-rojo-sombra)',     // parte baja de la cara del botón de pánico
    ROJO_OSCURO: 'var(--c-rojo-oscuro)',     // borde del botón de pánico y contorno de las alertas
    AMARILLO_SUAVE: 'var(--c-amarillo-suave)', // fondo de los avisos

    // Color del texto (e iconos) sobre superficies rojas: píldoras de alerta, botón de pánico, botones de detener...
    TEXTO_SOBRE_ROJO: 'var(--c-texto-sobre-rojo)',

    // Fondo del menú lateral (y de su barra y desplegable en móvil), que es donde se dibuja el logo. Por defecto es el
    // de las tarjetas (AZUL_PRINCIPAL), así que no se nota; si una paleta usa en las tarjetas un color que coincide con
    // una letra del logo, define aquí uno que contraste con las letras.
    LOGO_FONDO: 'var(--c-logo-fondo)',

    // Fondo de la página (detrás de las tarjetas) y color del borde del tablero y de su barra de scroll. Por defecto siguen
    // a CELESTE_PRINCIPAL y AZUL_PRINCIPAL; una paleta puede darles colores propios (p. ej. página oscura con borde claro).
    FONDO_PAGINA: 'var(--c-fondo-pagina)',
    BORDE_TABLERO: 'var(--c-borde-tablero)',
};

type ColorName = keyof typeof COLORS;
type Palette = Record<ColorName, string>;

// Nombre de la variable CSS de cada color
const CSS_VARS: Record<ColorName, string> = {
    CELESTE_PRINCIPAL: '--c-celeste-principal',
    AZUL_PRINCIPAL: '--c-azul-principal',
    AZUL_SECUNDARIO: '--c-azul-secundario',
    ROJO: '--c-rojo',
    AMARILLO: '--c-amarillo',
    VERDE: '--c-verde',
    ROJO_CLARO: '--c-rojo-claro',
    ROJO_SUAVE: '--c-rojo-suave',
    ROJO_FUERTE: '--c-rojo-fuerte',
    ROJO_BRILLO: '--c-rojo-brillo',
    ROJO_SOMBRA: '--c-rojo-sombra',
    ROJO_OSCURO: '--c-rojo-oscuro',
    AMARILLO_SUAVE: '--c-amarillo-suave',
    TEXTO_SOBRE_ROJO: '--c-texto-sobre-rojo',
    LOGO_FONDO: '--c-logo-fondo',
    FONDO_PAGINA: '--c-fondo-pagina',
    BORDE_TABLERO: '--c-borde-tablero',
};

// Valores del tema "Original" (el que se ve si el tema no define su propia paleta)
const BASE_PALETTE: Palette = {
    CELESTE_PRINCIPAL: '#CFDDFC',
    AZUL_PRINCIPAL: '#00214B',
    AZUL_SECUNDARIO: '#8F8AF9',
    ROJO: '#D91A5D',
    AMARILLO: '#FFDC4F',
    VERDE: '#28DE64',
    ROJO_CLARO: '#FF5C5C',
    ROJO_SUAVE: '#E88B93',
    ROJO_FUERTE: '#DC3545',
    ROJO_BRILLO: '#F0407D',
    ROJO_SOMBRA: '#C4144F',
    ROJO_OSCURO: '#8E0F3A',
    AMARILLO_SUAVE: '#FFF8E1',
    TEXTO_SOBRE_ROJO: '#FFFFFF',
    LOGO_FONDO: '#00214B',
    FONDO_PAGINA: '#CFDDFC',
    BORDE_TABLERO: '#00214B',
};

// Variantes derivadas: de qué color principal salen y cómo se calculan cuando un tema cambia ese color principal
const mix = (color: string, percent: number, other: 'white' | 'black') => `color-mix(in srgb, ${color} ${percent}%, ${other})`;
const DERIVED: Partial<Record<ColorName, { from: ColorName; derive: (color: string) => string }>> = {
    ROJO_CLARO: { from: 'ROJO', derive: (c) => mix(c, 60, 'white') },
    ROJO_SUAVE: { from: 'ROJO', derive: (c) => mix(c, 55, 'white') },
    ROJO_FUERTE: { from: 'ROJO', derive: (c) => mix(c, 92, 'black') },
    ROJO_BRILLO: { from: 'ROJO', derive: (c) => mix(c, 82, 'white') },
    ROJO_SOMBRA: { from: 'ROJO', derive: (c) => mix(c, 90, 'black') },
    ROJO_OSCURO: { from: 'ROJO', derive: (c) => mix(c, 60, 'black') },
    AMARILLO_SUAVE: { from: 'AMARILLO', derive: (c) => mix(c, 12, 'white') },
    // El fondo del menú sigue al de las tarjetas mientras la paleta no defina el suyo
    LOGO_FONDO: { from: 'AZUL_PRINCIPAL', derive: (c) => c },
    // La página y el borde del tablero siguen a los colores claro y oscuro de la paleta mientras no definan los suyos
    FONDO_PAGINA: { from: 'CELESTE_PRINCIPAL', derive: (c) => c },
    BORDE_TABLERO: { from: 'AZUL_PRINCIPAL', derive: (c) => c },
};

/*
 * Paletas por tema. Un tema puede tener varias paletas (variantes) entre las que se elige en el modal de temas;
 * la primera de cada tema es la que se usa por defecto. Un tema que no aparece aquí usa los colores originales
 * (solo cambia el logo).
 *
 * Una paleta puede definir cualquier subconjunto de colores: los que no define quedan como en el Original, y las
 * variantes (rojo suave, oscuro...) se derivan del color principal que sí haya cambiado. Además puede definir `cards`:
 * los tonos que se reparten, en orden y dando la vuelta al llegar al final, entre las tarjetas de cada pestaña.
 *
 * LOGO: las letras del logo de cada tema (THEMES en SinfoniaLogo.tsx) no cambian con la paleta. El logo se dibuja
 * sobre el fondo del menú lateral, LOGO_FONDO, que por defecto es el color de las tarjetas (AZUL_PRINCIPAL). Si una
 * paleta usa en las tarjetas un color que coincide con una letra, esa letra desaparecería: en ese caso la paleta
 * define su propio LOGO_FONDO (un color que contraste con las letras) y el menú lateral usa ese color. Nada se
 * elige solo; en desarrollo, `warnLogoContrast` avisa por consola si alguna letra casi no se ve.
 */
// Color de una tarjeta: `fondo` es el color de la tarjeta y `tinta` el de lo que va encima (textos, botones claros...)
export type CardTone = { fondo: string; tinta: string };

// `cards`: tonos que se reparten entre las tarjetas de cada pestaña (ver CardTone.tsx); si una paleta no los define,
// todas las tarjetas usan AZUL_PRINCIPAL y CELESTE_PRINCIPAL
// `cardGradient`: colores (de arriba abajo) de un degradado que se pinta sobre TODAS las tarjetas de la paleta, encima de su
// tono (ver CardTone.tsx e index.css). La tinta de las tarjetas tiene que leerse sobre cada uno de sus colores.
// `cardOutline`: color CSS de un contorno fino que se dibuja alrededor de todas las tarjetas (para que se distingan de una
// página de tono parecido); si no se define, las tarjetas no llevan contorno.
// `logoOutlines`: contornos de las letras del logo propios de esta paleta (mismo formato que OUTLINES en SinfoniaLogo.tsx). Se
// aplican encima de los del tema, y `all: false` los quita todos: sirve cuando el menú de la paleta no es del color que
// esperan los del tema (p. ej. un menú oscuro en un tema cuyos contornos son para menú claro).
// `logoGradient`: colores de un degradado para el fondo del menú lateral (donde va el logo), encima de LOGO_FONDO, que queda de
// respaldo. Sirve cuando no hay un color liso que quede bien (p. ej. el arcoíris). Los contornos del logo tienen que
// leerse sobre todos sus colores (ver `logoOutlines`).
// `logoColors`: colores de las letras del logo propios de esta paleta (mismo orden que THEMES en SinfoniaLogo.tsx: S, I, N, F,
// O, N, i, A, estrella). Si no los define, se usan los del tema. Sirve para que dos paletas del mismo tema lleven el
// logo distinto (p. ej. de un solo color sobre un fondo en degradado, o en colores sobre un fondo oscuro).
type PaletteVariant = { label: string; colors: Partial<Palette>; cards?: CardTone[]; cardGradient?: string[]; cardOutline?: string; logoOutlines?: Outlines; logoGradient?: string[]; logoColors?: LogoPalette };

const THEME_PALETTES: Partial<Record<ThemeName, Record<string, PaletteVariant>>> = {
    // Las tres paletas de Navidad tienen cada una su identidad, no solo otros tonos:
    //   Clásica     → nieve y pino: página azul hielo, tarjetas verde pino y rojo arándano
    //   Vino        → noche de vino: página oscura, tarjetas claras (champán, rosa, salvia) y borde dorado
    //   Rojo y verde → fiesta: página roja con borde de nieve, tarjetas verdes y blancas
    christmas: {
        clasica: {
            label: 'Clásica',
            colors: {
                FONDO_PAGINA: '#D3E3EE',      // azul hielo: la página
                CELESTE_PRINCIPAL: '#F7FAFC', // nieve: superficies claras (píldoras, campos)
                AZUL_PRINCIPAL: '#0E3B2E',    // verde pino: menú, borde del tablero, texto sobre claro
                AZUL_SECUNDARIO: '#EDB93F',   // dorado: acento (pestaña activa, píldoras, tiradores)
                ROJO: '#CC1F36',              // rojo navideño: alertas, desconectado, botón de pánico
                AMARILLO: '#F9D56E',          // amarillo claro: avisos
                VERDE: '#4CC38A',             // verde acebo: conectado, interruptores activos
            },
            cards: [
                { fondo: '#0E3B2E', tinta: '#F7FAFC' }, // verde pino
                { fondo: '#8B1E32', tinta: '#F7FAFC' }, // rojo arándano
            ],
        },
        'rojo-verde': {
            label: 'Diciembre',
            colors: {
                FONDO_PAGINA: '#B3192E',      // rojo navideño: la página
                CELESTE_PRINCIPAL: '#FBF4EA', // nieve: superficies claras
                AZUL_PRINCIPAL: '#0E3B2E',    // verde pino: menú, texto sobre claro, diálogos
                BORDE_TABLERO: '#FBF4EA',     // nieve: borde y barra de scroll
                AZUL_SECUNDARIO: '#F2C14E',   // dorado: acento
                ROJO: '#5C0A17',              // burdeos: sobre la página roja y las tarjetas verdes se distingue
                AMARILLO: '#F6C945',          // dorado: avisos
                VERDE: '#4CC38A',             // verde acebo: conectado, interruptores activos
            },
            cards: [
                { fondo: '#12553A', tinta: '#FBF4EA' }, // verde
                { fondo: '#FBF4EA', tinta: '#9E1B2F' }, // nieve, con tinta roja
            ],
        },
        'rojo-verde-2': {
            label: 'Rudolf',
            colors: {
                CELESTE_PRINCIPAL: '#FBF4EA', // nieve
                AZUL_PRINCIPAL: '#9E1B2F',    // rojo navideño: texto sobre claro
                AZUL_SECUNDARIO: '#9BDDB3',   // verde menta: acento
                ROJO: '#D61F3A',              // rojo
                AMARILLO: '#F6C945',          // dorado: avisos
                VERDE: '#4CC38A',             // verde acebo: conectado, interruptores activos
                // El rojo se confunde con la letra roja del logo (contraste 2.4): el menú lateral va en verde pino
                LOGO_FONDO: '#0E3B2E',
            },
            cards: [
                { fondo: '#9E1B2F', tinta: '#FBF4EA' }, // rojo
                { fondo: '#12553A', tinta: '#FBF4EA' }, // verde
            ],
        },
        vino: {
            label: 'Vino',
            colors: {
                FONDO_PAGINA: '#2B0B16',      // vino casi negro: la página, oscura
                CELESTE_PRINCIPAL: '#F6E7CF', // champán: superficies claras
                AZUL_PRINCIPAL: '#4A1020',    // vino: menú, texto sobre claro, diálogos
                BORDE_TABLERO: '#E8C27A',     // dorado: borde y barra de scroll
                AZUL_SECUNDARIO: '#5DBB87',   // verde acebo: acento
                ROJO: '#D92B45',              // rojo
                AMARILLO: '#F0C75E',          // dorado: avisos
                VERDE: '#5DBB87',             // verde: conectado, interruptores activos
            },
            cards: [
                { fondo: '#F6E7CF', tinta: '#4A1020' }, // champán
                { fondo: '#EBC4BC', tinta: '#4A1020' }, // rosa palo
                { fondo: '#D5E3C9', tinta: '#4A1020' }, // salvia
            ],
        },
    },
    valentines: {
        rosa: {
            label: 'Rosa',
            colors: {
                CELESTE_PRINCIPAL: '#ffc7d0', // rosa muy claro
                AZUL_PRINCIPAL: '#4A0E2B',    // ciruela: menú, texto sobre claro
                AZUL_SECUNDARIO: '#FF7FA6',   // rosa: acento
                ROJO: '#D61F52',              // carmesí
                AMARILLO: '#FFC857',          // ámbar: avisos
                VERDE: '#5FD3A3',             // menta: conectado, interruptores activos
            },
            cards: [
                { fondo: '#4A0E2B', tinta: '#FFF1F4' }, // ciruela
                { fondo: '#8E1B4F', tinta: '#FFF1F4' }, // frambuesa
                { fondo: '#6B1030', tinta: '#FFF1F4' }, // burdeos
                { fondo: '#7A1658', tinta: '#FFF1F4' }, // magenta oscuro
            ],
        },
        // Modo oscuro: noche de San Valentín, página casi negra con tarjetas de vino y rosa, y un borde rosa que brilla
        oscuro: {
            label: 'Modo oscuro',
            colors: {
                FONDO_PAGINA: '#903962',      // color mas clarito, pinche claude que no sabe (el original es el de abajo, no lo usen)
                // FONDO_PAGINA: '#14070D',      // negro rosado: la página, oscura
                CELESTE_PRINCIPAL: '#FFE9F0', // rosa pálido: superficies claras (píldoras, campos)
                AZUL_PRINCIPAL: '#3A1226',    // vino oscuro: menú, texto sobre claro, diálogos
                BORDE_TABLERO: '#FF5C93',     // rosa vivo: borde y barra de scroll
                AZUL_SECUNDARIO: '#FF8FB1',   // rosa: acento
                ROJO: '#E11D48',              // carmesí: alertas, desconectado, botón de pánico
                AMARILLO: '#FFC857',          // ámbar: avisos
                VERDE: '#5FD3A3',             // menta: conectado, interruptores activos
            },
            cards: [
                { fondo: '#3B1226', tinta: '#FFE9F0' }, // vino
                { fondo: '#561A3A', tinta: '#FFE9F0' }, // frambuesa oscura
                { fondo: '#2F1020', tinta: '#FFE9F0' }, // burdeos casi negro
                { fondo: '#6B1F42', tinta: '#FFE9F0' }, // rosa oscuro
            ],
            // Las tarjetas oscuras se parecen a la página oscura: un contorno rosa tenue las separa
            cardOutline: 'rgba(255, 143, 177, 0.35)',
        },
    },
    halloween: {
        calabaza: {
            label: 'Calabaza',
            colors: {
                CELESTE_PRINCIPAL: '#F7EBDD', // hueso a la luz de una vela
                AZUL_PRINCIPAL: '#1D0F2E',    // morado casi negro: menú, texto sobre claro
                AZUL_SECUNDARIO: '#FF7518',   // naranja calabaza: acento
                ROJO: '#7B2CBF',              // morado de bruja: alertas, desconectado, botón de pánico
                AMARILLO: '#FFC300',          // amarillo vela: avisos
                VERDE: '#7CD336',             // verde baba: conectado, interruptores activos
            },
            cards: [
                { fondo: '#1D0F2E', tinta: '#F7EBDD' }, // morado casi negro
                { fondo: '#3D1F66', tinta: '#F7EBDD' }, // morado
                { fondo: '#1E3A17', tinta: '#F7EBDD' }, // verde musgo
                { fondo: '#6B2A0A', tinta: '#F7EBDD' }, // marrón calabaza
            ],
        },
        noche: {
            label: 'Noche de brujas',
            colors: {
                FONDO_PAGINA: '#100A1A',      // negro violáceo: la página, oscura
                CELESTE_PRINCIPAL: '#F1E4D0', // hueso: superficies claras (píldoras, campos)
                AZUL_PRINCIPAL: '#2B1646',    // morado noche: menú, texto sobre claro, diálogos
                BORDE_TABLERO: '#FF7518',     // naranja calabaza: borde y barra de scroll
                AZUL_SECUNDARIO: '#7CD336',   // verde baba: acento
                ROJO: '#8B3DDB',              // morado de bruja: alertas, desconectado, botón de pánico
                AMARILLO: '#FFC300',          // amarillo vela: avisos
                VERDE: '#7CD336',             // verde baba: conectado, interruptores activos
            },
            cards: [
                { fondo: '#4A2A7A', tinta: '#F1E4D0' }, // morado hechizo
                { fondo: '#1F4A1B', tinta: '#F1E4D0' }, // verde pantano
                // { fondo: '#F1E4D0', tinta: '#2B1646' }, // hueso
                // { fondo: '#7A3A12', tinta: '#F1E4D0' }, // marrón calabaza
            ],
        },
    },
    // Orgullo: dos paletas con el logo distinto. Arcoíris: logo de un solo color sobre un menú en degradado. Medianoche:
    // las letras de colores del tema sobre un menú oscuro
    pride: {
        arcoiris: {
            label: 'Arcoíris',
            colors: {
                // Teoría del color: las tarjetas ya recorren toda la rueda (el arcoíris), así que son lo único colorido y el resto
                // es neutro. Los neutros llevan un matiz frío de la misma familia que el índigo, y se distinguen por valor
                // (luminosidad), no por color: página más clara, menú un paso más oscuro, píldoras blancas. Un solo acento
                // análogo al índigo (periwinkle) y el índigo, complementario del amarillo, como ancla oscura.
                FONDO_PAGINA: '#efe3ff',      // lavanda casi blanca: la página (lo más claro, para que las tarjetas destaquen)
                CELESTE_PRINCIPAL: '#FFFFFF', // blanco: píldoras y campos
                AZUL_PRINCIPAL: '#33235a',    // índigo: ancla oscura (texto, borde del tablero, diálogos)
                AZUL_SECUNDARIO: '#8A82F5',   // periwinkle: el único acento (pestaña activa, tiradores); análogo al índigo
                // Los estados son los tonos de la bandera, más profundos para leerse sobre los pasteles
                ROJO: '#C92D4B',              // rojo de la bandera: alertas, desconectado, botón de pánico
                ROJO_SUAVE: '#DC4660',        // rojo más claro: botones de detener / borrar
                AMARILLO: '#D99A00',          // amarillo de la bandera: avisos
                VERDE: '#238A5A',             // verde de la bandera: conectado, interruptores activos
                // Menú: ningún color liso quedaba bien, así que lleva la bandera en degradado (`logoGradient`, abajo); este color
                // queda de respaldo. El logo de esta paleta es de un solo color (índigo) y se lee sobre todas las franjas
                LOGO_FONDO: '#efe3ff',
            },
            // Todas las tarjetas llevan la bandera completa, en pastel, de arriba abajo. El tono es el de lo que va dentro
            // (píldoras oscuras con letra crema); el degradado se pinta encima del fondo
            cards: [{ fondo: '#FFF4DC', tinta: '#29174dab' }],
            cardGradient: [
                '#FF9AA2', // rojo
                '#FFC48A', // naranja
                '#FFE98A', // amarillo
                '#A8E6B4', // verde
                '#9CC9FF', // azul
                '#C9A8F0', // violeta
            ],
            // Los pasteles son claros como la página: un contorno índigo fino los separa
            cardOutline: 'rgba(43, 27, 84, 0.6)',
            // El fondo del menú lleva la bandera en pastel (el mismo degradado que las tarjetas, repetido aquí)
            logoGradient: [
                '#FF9AA2', // rojo
                '#FFC48A', // naranja
                '#FFE98A', // amarillo
                '#A8E6B4', // verde
                '#9CC9FF', // azul
                '#C9A8F0', // violeta
            ],
            // Logo de un solo color (índigo): se lee sobre todas las franjas del degradado, sin contornos
            logoColors: Array<string>(9).fill('#33235A'),
        },
        // La bandera de noche, en negro y oro. Teoría del color: las tarjetas (el arcoíris en tonos joya) ya recorren toda la
        // rueda, así que lo demás es neutro: negro y azul-negro con un matiz índigo, separados por valor. Un solo acento
        // cálido, el oro, que es el complementario del índigo y el compañero clásico de los tonos joya sobre negro; lo usan
        // el acento, el borde y los avisos.
        medianoche: {
            label: 'Medianoche',
            colors: {
                FONDO_PAGINA: '#0B0A16',      // casi negro con matiz índigo: la página
                CELESTE_PRINCIPAL: '#F4EEFF', // lila casi blanco: píldoras, campos y texto sobre lo oscuro
                AZUL_PRINCIPAL: '#1D1838',    // azul-negro: menú, diálogos y texto sobre claro (un paso por encima de la página)
                BORDE_TABLERO: '#F5C45E',     // oro: borde y barra de scroll
                AZUL_SECUNDARIO: '#F5C45E',   // oro: el único acento (pestaña activa, tiradores)
                ROJO: '#FF5C6C',              // rojo coral: alertas, desconectado, botón de pánico
                ROJO_SUAVE: '#FF8FA3',        // rosa coral: botones de detener / borrar
                AMARILLO: '#FFD166',          // oro claro: avisos
                VERDE: '#4ADE80',             // verde: conectado, interruptores activos
                TEXTO_SOBRE_ROJO: '#1D1838',  // sobre el coral se lee mejor la tinta oscura que el blanco
            },
            // El tono es el de lo que va dentro (píldoras lilas con letra índigo); el degradado se pinta encima
            cards: [{ fondo: '#241552', tinta: '#F4EEFF' }],
            cardGradient: [
                '#9B1B30', // rojo
                '#A5500E', // naranja
                '#7A6600', // amarillo
                '#0F6B3C', // verde
                '#1E40AF', // azul
                '#5B21B6', // violeta
            ],
            // Las tarjetas oscuras se parecen a la página oscura: un contorno dorado tenue las separa
            cardOutline: 'rgba(245, 196, 94, 0.35)',
            // Menú oscuro: el azul, el violeta y el marrón de la estrella casi no se ven. Esas tres letras llevan un halo del
            // color del menú pero más claro, para que se fundan con él en vez de recortarse en blanco. El logo conserva los
            // colores del tema (el arcoíris)
            logoOutlines: {
                O: { color: '#7A6EDB', size: 1 },
                N2: { color: '#7A6EDB', size: 1 },
                star: { color: '#7A6EDB', size: 1 },
            },
        },
    },
};

// Paletas que ofrece un tema (id + nombre), en orden; vacío si el tema no cambia los colores
export const themePaletteOptions = (theme: ThemeName) =>
    Object.entries(THEME_PALETTES[theme] ?? {}).map(([id, variant]) => ({ id, label: variant.label }));

// Id de la paleta por defecto de un tema (la primera); undefined si el tema no tiene paletas
export const defaultPaletteId = (theme: ThemeName): string | undefined => themePaletteOptions(theme)[0]?.id;

// Si `paletteId` es una paleta de ese tema
export const isPaletteOf = (theme: ThemeName, paletteId: string) => Boolean(THEME_PALETTES[theme]?.[paletteId]);

// Colores de una paleta de un tema (por defecto, la primera): los originales, encima los que la paleta define y,
// para las variantes que no define, las derivadas del color principal que haya cambiado
// Variante elegida de un tema: la indicada, o la primera si no existe
const resolveVariant = (theme: ThemeName, paletteId?: string): PaletteVariant | undefined => {
    const variants = THEME_PALETTES[theme];
    return variants?.[paletteId ?? ''] ?? variants?.[defaultPaletteId(theme) ?? ''];
};

// Tonos de tarjeta de una paleta (vacío si no los define: todas las tarjetas usan los colores principales)
export const themeCardTones = (theme: ThemeName, paletteId?: string): CardTone[] => resolveVariant(theme, paletteId)?.cards ?? [];

// Color del contorno de las tarjetas de una paleta (undefined si no tiene)
const themeCardOutline = (theme: ThemeName, paletteId?: string): string | undefined => resolveVariant(theme, paletteId)?.cardOutline;

// Colores de las letras del logo propios de una paleta (undefined si no los define: se usan los del tema)
export const themeLogoColors = (theme: ThemeName, paletteId?: string): LogoPalette | undefined => resolveVariant(theme, paletteId)?.logoColors;

// Contornos del logo propios de una paleta (undefined si no tiene)
export const themeLogoOutlines = (theme: ThemeName, paletteId?: string): Outlines | undefined => resolveVariant(theme, paletteId)?.logoOutlines;

// Estilo del fondo del menú lateral para una paleta: solo añade `backgroundImage` si la paleta tiene `logoGradient`. Se usa
// junto a `backgroundColor: COLORS.LOGO_FONDO`, que queda debajo. `angle`: dirección del degradado (180 = de arriba abajo;
// 90 = de izquierda a derecha, para una barra baja y ancha).
export const themeLogoPlate = (theme: ThemeName, paletteId?: string, angle = 180): { backgroundImage?: string } => {
    const colors = resolveVariant(theme, paletteId)?.logoGradient;
    return colors?.length ? { backgroundImage: `linear-gradient(${angle}deg, ${colors.join(', ')})` } : {};
};

// Colores del degradado de las tarjetas de una paleta (vacío si no tiene)
export const themeCardGradient = (theme: ThemeName, paletteId?: string): string[] => resolveVariant(theme, paletteId)?.cardGradient ?? [];

export const themePalette = (theme: ThemeName, paletteId?: string): Palette => {
    const overrides = resolveVariant(theme, paletteId)?.colors ?? {};
    const palette: Palette = { ...BASE_PALETTE, ...overrides };
    (Object.keys(DERIVED) as ColorName[]).forEach((name) => {
        const spec = DERIVED[name]!;
        if (!overrides[name] && overrides[spec.from]) palette[name] = spec.derive(overrides[spec.from]!);
    });
    return palette;
};

// Aplica la paleta de un tema a toda la app (escribe las variables CSS en <html>)
export const applyTheme = (theme: ThemeName, paletteId?: string) => {
    const root = document.documentElement;
    const palette = themePalette(theme, paletteId);
    (Object.keys(CSS_VARS) as ColorName[]).forEach((name) => root.style.setProperty(CSS_VARS[name], palette[name]));
    root.dataset.theme = theme;
    root.dataset.palette = paletteId ?? defaultPaletteId(theme) ?? '';

    // Degradado de las tarjetas: index.css lo pinta cuando existe `data-card-gradient`
    const gradient = themeCardGradient(theme, paletteId);
    if (gradient.length) {
        root.style.setProperty('--c-card-gradient', `linear-gradient(180deg, ${gradient.join(', ')})`);
        root.dataset.cardGradient = '';
    } else {
        root.style.removeProperty('--c-card-gradient');
        delete root.dataset.cardGradient;
    }

    // Contorno de las tarjetas: index.css lo dibuja cuando existe `data-card-outline`
    const outline = themeCardOutline(theme, paletteId);
    if (outline) {
        root.style.setProperty('--c-card-outline', outline);
        root.dataset.cardOutline = '';
    } else {
        root.style.removeProperty('--c-card-outline');
        delete root.dataset.cardOutline;
    }
};

// Versión de un color con transparencia (`percent` = opacidad, 0-100). Sustituye a `${color}33`, que con variables CSS no funciona.
export const withAlpha = (color: string, percent: number) => `color-mix(in srgb, ${color} ${percent}%, transparent)`;

// --- Aviso (solo en desarrollo) de letras del logo que casi no se ven sobre su fondo ---
const MIN_LOGO_CONTRAST = 3;
const LOGO_LETTERS = ['S', 'I', 'N', 'F', 'O', 'N', 'i', 'A', 'estrella'];

const isHex = (color: unknown): color is string => typeof color === 'string' && /^#[0-9a-f]{6}$/i.test(color);

const luminance = (hex: string) => {
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
        .map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const contrastRatio = (a: string, b: string) => {
    const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
    return (light + 0.05) / (dark + 0.05);
};

// Slots del logo, en el mismo orden que las letras de THEMES (S, I, N, F, O, N, i, A, estrella)
const LOGO_SLOTS = ['S', 'I', 'N1', 'F', 'O', 'N2', 'i', 'A', 'star'] as const;
// Color que usa SinfoniaLogo.tsx para un contorno que no define el suyo
const DEFAULT_LOGO_OUTLINE_COLOR = '#FFFFFF';

// Color del contorno de una letra del logo; undefined si no lo tiene. Mismo orden que SinfoniaLogo.tsx: la entrada de la
// letra y luego `all` de la paleta, y lo mismo del tema; un `false` (o un tamaño 0) quita el contorno de esa letra
const logoOutlineColor = (theme: ThemeName, paletteId: string | undefined, slot: (typeof LOGO_SLOTS)[number]): string | undefined => {
    const levels = [themeLogoOutlines(theme, paletteId), OUTLINES[theme]];
    for (const outlines of levels) {
        if (!outlines) continue;
        for (const entry of [outlines[slot], outlines.all]) {
            if (entry === false) return undefined;
            if (!entry) continue;
            return entry.size !== undefined && entry.size <= 0 ? undefined : entry.color ?? DEFAULT_LOGO_OUTLINE_COLOR;
        }
    }
    return undefined;
};

const warnLogoContrast = () => {
    (Object.keys(THEMES) as ThemeName[]).forEach((theme) => {
        const themeLetters: readonly (string | null | undefined)[] = THEMES[theme];
        const paletteIds: (string | undefined)[] = themePaletteOptions(theme).map((option) => option.id);
        (paletteIds.length ? paletteIds : [undefined]).forEach((paletteId) => {
            const background = themePalette(theme, paletteId).LOGO_FONDO;
            if (!isHex(background)) return;
            const letters = themeLogoColors(theme, paletteId) ?? themeLetters;
            letters.forEach((color, i) => {
                if (!isHex(color)) return;
                // Si la letra tiene contorno y este contrasta con el fondo, se lee aunque ella no contraste
                const outline = logoOutlineColor(theme, paletteId, LOGO_SLOTS[i]);
                if (outline && isHex(outline) && contrastRatio(outline, background) >= MIN_LOGO_CONTRAST) return;
                const ratio = contrastRatio(color, background);
                if (ratio < MIN_LOGO_CONTRAST) {
                    console.warn(
                        `[tema] Logo de "${theme}"${paletteId ? ` (paleta "${paletteId}")` : ''}: la letra ${LOGO_LETTERS[i]} (${color}) casi no se ve sobre el fondo del menú (${background}), contraste ${ratio.toFixed(1)}. Define LOGO_FONDO en la paleta.`,
                    );
                }
            });
        });
    });
};

// Valor de un color como hex: los hex tal cual, y los `color-mix(in srgb, #hex N%, white|black)` que genera DERIVED
const resolveHex = (color: string): string | null => {
    if (isHex(color)) return color;
    const m = /^color-mix\(in srgb, (#[0-9a-f]{6}) (\d+)%, (white|black)\)$/i.exec(color);
    if (!m) return null;
    const keep = Number(m[2]) / 100;
    const other = m[3] === 'white' ? 255 : 0;
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(m[1].slice(i, i + 2), 16));
    return '#' + [r, g, b].map((v) => Math.round(v * keep + other * (1 - keep)).toString(16).padStart(2, '0')).join('');
};

const MIN_TONE_INK_CONTRAST = 4.5;
const MIN_TONE_CLASH_CONTRAST = 1.3;

// Avisa de tonos de tarjeta con la tinta difícil de leer, o casi iguales a un color que aparece sobre las tarjetas
// (acento, rojo, rojo suave de los botones de detener / borrar, verde de los interruptores)
const warnCardTones = () => {
    (Object.keys(THEMES) as ThemeName[]).forEach((theme) => {
        themePaletteOptions(theme).forEach(({ id }) => {
            const palette = themePalette(theme, id);
            const onCards: [ColorName, string | null][] = (['AZUL_SECUNDARIO', 'ROJO', 'ROJO_SUAVE', 'VERDE'] as ColorName[])
                .map((name) => [name, resolveHex(palette[name])]);
            const cards = themeCardTones(theme, id);
            // Cada color del degradado se comprueba como si fuera una tarjeta más, con la tinta de las tarjetas
            const stripes = themeCardGradient(theme, id).map((fondo) => ({ fondo, tinta: cards[0]?.tinta ?? palette.CELESTE_PRINCIPAL }));
            [...cards, ...stripes].forEach(({ fondo, tinta }) => {
                if (isHex(fondo) && isHex(tinta) && contrastRatio(tinta, fondo) < MIN_TONE_INK_CONTRAST) {
                    console.warn(`[tema] "${theme}" (paleta "${id}"): la tinta ${tinta} se lee mal sobre la tarjeta ${fondo} (contraste ${contrastRatio(tinta, fondo).toFixed(1)}).`);
                }
                onCards.forEach(([name, hex]) => {
                    if (isHex(fondo) && hex && contrastRatio(hex, fondo) < MIN_TONE_CLASH_CONTRAST) {
                        console.warn(`[tema] "${theme}" (paleta "${id}"): la tarjeta ${fondo} se confunde con ${name} (${hex}), contraste ${contrastRatio(hex, fondo).toFixed(2)}.`);
                    }
                });
            });
        });
    });
};

const MIN_BORDER_CONTRAST = 3;

// Avisa de paletas cuyo borde del tablero casi no se ve sobre el fondo de la página
const warnPageBorder = () => {
    (Object.keys(THEMES) as ThemeName[]).forEach((theme) => {
        const ids: (string | undefined)[] = themePaletteOptions(theme).map((option) => option.id);
        (ids.length ? ids : [undefined]).forEach((paletteId) => {
            const { FONDO_PAGINA, BORDE_TABLERO } = themePalette(theme, paletteId);
            if (isHex(FONDO_PAGINA) && isHex(BORDE_TABLERO) && contrastRatio(BORDE_TABLERO, FONDO_PAGINA) < MIN_BORDER_CONTRAST) {
                console.warn(`[tema] "${theme}"${paletteId ? ` (paleta "${paletteId}")` : ''}: el borde del tablero (${BORDE_TABLERO}) casi no se ve sobre la página (${FONDO_PAGINA}), contraste ${contrastRatio(BORDE_TABLERO, FONDO_PAGINA).toFixed(1)}.`);
            }
        });
    });
};

if (import.meta.env.DEV) {
    warnLogoContrast();
    warnCardTones();
    warnPageBorder();
}

export const TYPOGRAPHY = {
    FONT_FAMILY_PRINCIPAL: "'Nunito', sans-serif",
    // Pesos de fuente disponibles
    FONT_WEIGHT_EXTRA_LIGHT: 200,
    FONT_WEIGHT_LIGHT: 300,
    FONT_WEIGHT_REGULAR: 400,
    FONT_WEIGHT_MEDIUM: 500,
    FONT_WEIGHT_SEMI_BOLD: 600,
    FONT_WEIGHT_BOLD: 700,
    FONT_WEIGHT_EXTRA_BOLD: 800,
    FONT_WEIGHT_BLACK: 900,
};
