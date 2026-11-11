# Web Remote Controller (SinfonIA)

Interfaz web para controlar un robot Pepper a través de **ROS 1**. La app habla con el robot por WebSocket
(`rosbridge` + `roslibjs`) y ofrece botones, sliders y modales para mover al robot, cambiar sus LEDs, hacerlo hablar,
ver sus cámaras, ejecutar animaciones y scripts, etc.

Stack: React 19 + TypeScript + Vite 8 + Tailwind CSS v4 (con React Compiler activado).

La documentación de los tópicos y servicios del robot está en
[`context/ROBOT_TOOLKIT_API.md`](context/ROBOT_TOOLKIT_API.md).

---

## Cómo correr la app

Requisitos: Node.js reciente y npm.

```bash
npm install        # solo la primera vez
npm run dev        # servidor de desarrollo en http://localhost:5173
```

### Probar en el celular

```bash
npm run dev -- --host
```

El `--host` hace que Vite escuche en todas las interfaces de red y no solo en `localhost`. Vite imprime algo como:

```
  ➜  Local:   http://localhost:5173/
  ➜  Network: http://192.168.1.25:5173/
```

Abre la dirección **Network** en el navegador del celular. Para que funcione:

- El celular y el computador deben estar en la **misma red Wi-Fi** (y, para controlar al robot, esa red debe ver al robot).
- Si Windows pregunta por el firewall la primera vez, permite el acceso en redes privadas.
- Los cambios de código se reflejan en el celular al instante (HMR).

> Tip: la IP del robot se autocompleta con los tres primeros octetos de la dirección desde la que abriste la app
> (si entras por `192.168.1.25`, la IP inicial queda `192.168.1.xxx`), así solo tienes que escribir el último número.

### Otros comandos

| Comando           | Qué hace                                                     |
| ----------------- | ------------------------------------------------------------ |
| `npm run dev`     | Servidor de desarrollo con recarga en caliente               |
| `npm run build`   | Revisa los tipos (`tsc -b`) y genera el build en `dist/`     |
| `npm run preview` | Sirve el build de `dist/` para probarlo (también acepta `-- --host`) |
| `npm run lint`    | Linter (Oxlint)                                              |

---

## Cómo funciona

### Conexión con el robot

1. Al abrir la app, la píldora de **IP** (arriba) pide la IP del robot. Mientras no sea una IPv4 válida no se intenta conectar.
2. Con una IP válida, `src/contexts/RosContext.tsx` abre un WebSocket a `ws://<ip>:9090` (el puerto de `rosbridge`) y
   expone, vía el hook `useRos()`: la conexión `ros`, si está conectado (`isConnected`), la IP, la velocidad base y el volumen.
3. Los componentes usan `src/services/RosManager.ts`, un envoltorio fino de roslibjs con cinco funciones:
   `createTopic`, `publishMessage`, `subscribeToTopic`, `createService` y `callService`.
   Un botón típico crea un tópico o servicio del toolkit del robot y publica o llama al pulsarlo.
4. Si no hay conexión, la app sigue funcionando en modo "offline" (los botones simplemente no envían nada).

El **botón de pánico** (`components/status/PanicButton.tsx`, lógica en `services/panic.ts`) detiene al robot; está siempre visible.

### Pantalla

Un menú lateral (arriba como desplegable en pantallas pequeñas) con el logo y tres pestañas. El tablero muestra
tarjetas en una cuadrícula que se adapta al ancho (móvil, tablet y escritorio de píxeles fijos a partir de 1360 px).

| Pestaña       | Contenido                                                                              |
| ------------- | -------------------------------------------------------------------------------------- |
| **Principal** | Control de seguridad, animaciones, texto a voz, LEDs, cámaras y postura                |
| **Servicios** | Web, fotos, audio, respiración, movimiento, cabeza, vida autónoma, tracker, tablet     |
| **Scripts**   | Acción rápida, palabras clave, creador y ejecutor de scripts (`services/scriptExecutor.ts`) |

### Estructura del proyecto

```
src/
  main.tsx            Punto de entrada: aplica el tema guardado y monta <RosProvider><App/>
  App.tsx             Layout y pestañas; reparte las tarjetas
  index.css           Tailwind, breakpoint `desk`, degradado/contorno de tarjetas, botón de pánico
  fonts.css           Tipografías
  components/
    layout/           Menú lateral, scroll, CardTone, bordes del tablero
    status/           Batería, IP, sliders (velocidad/volumen) y botón de pánico
    principal/        Tarjetas de la pestaña Principal
      leds/           Modales de LEDs (todos, pecho, orejas, cara) y selectores de color
    servicios/        Tarjetas de la pestaña Servicios
    scripts/          Tarjetas de la pestaña Scripts
  theme/              TODO lo relacionado con temas (ver abajo)
  hooks/              useBatteryLevel, useIpStatus, useScrollHints, useAnimations
  services/           RosManager (roslibjs), scriptExecutor, panic
  contexts/           RosContext (conexión y estado global del robot)
  utils/              Validación de IP, límites de volumen
  assets/             Imágenes y SVG (incluye el logo)
context/              Documentación de la API del robot y planes de diseño
```

---

## Cómo funcionan los temas

Todo vive en `src/theme/`. La idea central: **los componentes nunca tienen colores fijos, usan variables CSS**, y un
tema solo cambia el valor de esas variables.

### Piezas

| Archivo               | Qué hace                                                                                  |
| --------------------- | ----------------------------------------------------------------------------------------- |
| `index.ts`            | Paleta base, paletas de cada tema (`THEME_PALETTES`) y `applyTheme()`                     |
| `SinfoniaLogo.tsx`    | El logo SVG: colores de las letras de cada tema (`THEMES`), nombres (`THEME_LABELS`) y contornos |
| `images.ts`           | Imágenes que cambian con el tema (el Pepper de cada pestaña)                              |
| `useTheme.ts`         | Hook con el tema/paleta actual; lo guarda en `localStorage` (`logo_theme`, `theme_palette`) |
| `useThemeImage.ts`    | Hook que devuelve la imagen del tema activo                                               |
| `ThemeModal.tsx`      | El modal para elegir tema y paleta                                                        |

### Tema vs. paleta

- Un **tema** es una identidad: Original, Orgullo, Navidad, Halloween, San Valentín. Define las letras del logo y las imágenes.
- Un tema puede tener varias **paletas** (variantes de color): p. ej. Orgullo tiene *Arcoíris* y *Medianoche*, Navidad
  tiene *Clásica*, *Diciembre*, *Rudolf* y *Vino*. La primera de cada tema es la predeterminada.
- Un tema que no aparece en `THEME_PALETTES` usa los colores originales (solo cambia el logo y las imágenes).

### Cómo se aplica un tema

1. Los componentes usan `COLORS.AZUL_PRINCIPAL`, `COLORS.ROJO`, etc. Eso **no es un color** sino `var(--c-azul-principal)`.
   En Tailwind hay utilidades equivalentes: `text-azul`, `bg-celeste/20`, `border-lila`.
2. `applyTheme(tema, paleta)` toma la paleta base (`BASE_PALETTE`, la del tema Original), le encima los colores que la
   paleta defina y **deriva** las variantes que falten (p. ej. si cambias `ROJO`, se calculan solos `ROJO_SUAVE`,
   `ROJO_OSCURO`... con `color-mix`). Luego escribe todo como variables CSS en `<html>`.
3. `main.tsx` lo aplica **antes del primer render** con el tema guardado, para evitar un destello de colores originales.
4. Al cambiar de tema, `useTheme().changeTheme()` aplica los colores, guarda la elección y avisa a los componentes. No se
   recrea nada, así que las tarjetas no pierden su estado.

### Qué puede definir una paleta

Una paleta (`PaletteVariant` en `index.ts`) tiene `label`, `colors` y estas opciones, todas opcionales:

| Campo           | Para qué sirve                                                                                      |
| --------------- | --------------------------------------------------------------------------------------------------- |
| `colors`        | Cualquier subconjunto de los colores (`FONDO_PAGINA`, `CELESTE_PRINCIPAL`, `AZUL_PRINCIPAL`, `AZUL_SECUNDARIO`, `ROJO`, `AMARILLO`, `VERDE`, `BORDE_TABLERO`, `LOGO_FONDO`...) |
| `cards`         | Tonos `{ fondo, tinta }` que se reparten entre las tarjetas de cada pestaña, en orden y dando la vuelta |
| `cardGradient`  | Degradado (de arriba abajo) pintado sobre **todas** las tarjetas                                    |
| `cardOutline`   | Contorno fino de las tarjetas (útil si son parecidas al fondo de la página)                         |
| `logoColors`    | Colores de las letras del logo propios de la paleta (si no, se usan los del tema)                   |
| `logoOutlines`  | Contornos por letra del logo (`S, I, N1, F, O, N2, i, A, star` o `all`; `false` quita el contorno)  |
| `logoGradient`  | Degradado para el fondo del menú lateral (donde va el logo), con `LOGO_FONDO` de respaldo           |

Cómo se logra el efecto en las tarjetas (`components/layout/CardTone.tsx`): cada tarjeta va envuelta en
`<CardTone index={n}>`, que redefine **solo para esa tarjeta** `AZUL_PRINCIPAL` (= el fondo de la tarjeta) y
`CELESTE_PRINCIPAL` (= la tinta de lo que va encima). Así los componentes internos se adaptan solos sin cambiar. El
degradado y el contorno los pinta `index.css` con atributos `data-card-gradient` / `data-card-outline` en `<html>`.

### Imágenes por tema

`images.ts` tiene una tabla `THEME_IMAGES[tema][sitio]` con la ruta de la imagen (p. ej. `'src/assets/pepper_navidad.png'`).
Si se deja `''`, se usa la imagen por defecto del componente. En desarrollo, la consola avisa si una ruta no existe.

### Agregar una paleta nueva a un tema existente

En `src/theme/index.ts`, dentro de `THEME_PALETTES[tema]`, añade una entrada:

```ts
pride: {
    // ...paletas existentes
    mi_paleta: {
        label: 'Mi paleta',          // nombre que se ve en el modal
        colors: { FONDO_PAGINA: '#101018', AZUL_PRINCIPAL: '#222244' /* ... */ },
        cards: [{ fondo: '#222244', tinta: '#F4EEFF' }],
    },
},
```

Aparece sola en el modal de temas. Pon primero la que quieras como predeterminada.

### Agregar un tema nuevo

1. `SinfoniaLogo.tsx`: añade el tema a `THEMES` (9 colores: S, I, N, F, O, N, i, A, estrella) y su nombre a `THEME_LABELS`.
2. `images.ts`: añade sus imágenes a `THEME_IMAGES` (TypeScript te obliga a hacerlo; puedes dejarlas en `''`).
3. `index.ts`: opcionalmente, añade sus paletas a `THEME_PALETTES`.

### Avisos de contraste (solo en desarrollo)

En `npm run dev`, la consola avisa si una letra del logo casi no se ve sobre su fondo, si el texto de una tarjeta no se
lee sobre su tono o si el borde del tablero se pierde contra la página. Son avisos, nada se corrige solo.
