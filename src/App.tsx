import { useState } from "react";

import Cameras from "./components/principal/Cameras";
import PostureControl from "./components/principal/PostureControl";
import ScriptsCreator from "./components/scripts/ScriptsCreator";
import Texto from "./components/principal/Texto";
import ControlSeguridad from "./components/principal/ControlSeguridad";
import LateralMenu from "./components/layout/MenuLateral";
import Animations from "./components/principal/Animations";
import WebService from "./components/servicios/WebService";
import "./fonts.css";
import Led from "./components/principal/leds/Led";
import { COLORS } from "./theme";
import PictureService from "./components/servicios/PictureService";
import AudioService from "./components/servicios/AudioService";
import BreathingBodyControl from "./components/servicios/BreathingBodyControl";
import Movement from "./components/servicios/Movement";
import HeadMovement from "./components/servicios/HeadMovement";
import AutonomousLife from "./components/servicios/AutonomousLife";
import Tracker from "./components/servicios/Tracker";
import TabletVisibility from "./components/servicios/TabletVisibility";
import completePepper from "./assets/uwu3.png";
import HotWords from "./components/scripts/HotWords";
import QuickAction from "./components/scripts/QuickAction";
import PanicButton from "./components/status/PanicButton";
import CustomScrollbar from "./components/layout/CustomScrollbar";
import BoardBorderPills from "./components/layout/BoardBorderPills";
import ScrollFade from "./components/layout/ScrollFade";
import CardTone from "./components/layout/CardTone";
import { useScrollHints } from "./hooks/useScrollHints";
import { useThemeImage } from "./theme/useThemeImage";

const App = () => {
    // Pestaña visible: 'principal', 'servicios' o 'scripts' (la cambia el menú lateral)
    const [activeTab, setActiveTab] = useState("principal");

    const [sessionScripts, setSessionScripts] = useState<
        React.ComponentProps<typeof ScriptsCreator>["sessionScripts"]
    >([]);

    // Indicadores de scroll: desenfoque arriba/abajo del marco cuando hay más contenido en esa dirección
    const { scrollRef, canScrollUp, canScrollDown, onScroll } = useScrollHints();

    // Pepper grande de Servicios: la imagen del tema actual (ver theme/images.ts), o la de por defecto
    const pepperImage = useThemeImage("pepperServicios", completePepper);

    // Los tres tableros están apilados en el mismo sitio: solo el de la pestaña activa se ve y recibe clics
    const boardVisibility = (tab: string) => {
        const active = activeTab === tab;
        return {
            position: active ? "relative" : "hidden",
            style: { opacity: active ? 1 : 0, pointerEvents: active ? "auto" : "none" } as React.CSSProperties,
        };
    };
    const principal = boardVisibility("principal");
    const servicios = boardVisibility("servicios");
    const scripts = boardVisibility("scripts");

    return (
        <div
            className="flex min-h-screen w-full flex-col items-center overflow-x-hidden desk:h-screen desk:min-h-0 desk:overflow-hidden"
            style={{ backgroundColor: COLORS.FONDO_PAGINA }}
        >
            <main
                className="flex w-full flex-col items-center overflow-x-hidden px-3 py-5 sm:px-5 desk:h-full desk:min-h-0"
            >
                <div
                    className="flex w-full max-w-[1340px] flex-col gap-5 desk:h-full desk:min-h-0"
                >
                    <div
                        className="flex w-full flex-col items-stretch gap-5 desk:h-full desk:min-h-0 desk:flex-row"
                    >
                        {/* ── MENÚ LATERAL ── */}
                        {/* Desde `desk` (1360px) la pantalla es de alto fijo: el menú ocupa todo el alto a la izquierda y no se mueve; por debajo va arriba a todo el ancho */}
                        <div className="flex w-full shrink-0 flex-col gap-3 desk:h-full desk:min-h-0 desk:w-[220px]">
                            <aside className="w-full shrink-0 overflow-hidden desk:flex desk:min-h-0 desk:flex-1 desk:flex-col">
                                <LateralMenu activeTab={activeTab} setActiveTab={setActiveTab} />
                            </aside>

                            <PanicButton />
                        </div>

                        {/* ── TABLEROS (uno por pestaña, apilados) ── */}
                        {/* El borde azul es el "marco" fijo del alto de la pantalla; lo que scrollea es el contenido de adentro */}
                        <div
                            className="relative min-h-0 w-full min-w-0 flex-1 rounded-[25px] border-[5px] mt-4 desk:mt-3 desk:h-full desk:w-[1084px]"
                            style={{ borderColor: COLORS.BORDE_TABLERO }}
                        >
                            {/* Sin overflow-hidden en el marco para que las píldoras del borde puedan salirse de él; el recorte redondeado (radio interno 25-5=20px) lo hace el contenedor que scrollea */}
                            <div
                                ref={scrollRef}
                                onScroll={onScroll}
                                className="no-native-scrollbar overflow-hidden rounded-[20px] desk:h-full desk:overflow-y-auto"
                            >
                                {/* Alto de diseño mínimo 950px: los tableros son absolutos y se estiran al alto del marco si es mayor */}
                                <div className="relative mt-5 desk:h-full desk:mt-3 desk:min-h-[950px]">
                                    {/* TABLERO 1: PRINCIPAL */}
                                    <section
                                        className={`${principal.position} flex w-full flex-row flex-wrap items-start gap-6 p-4 pt-7 transition-opacity duration-300 ease-in-out sm:p-6 desk:absolute desk:left-0 desk:top-0 desk:flex desk:h-full desk:flex-row desk:flex-wrap desk:content-between desk:items-stretch desk:justify-between desk:gap-0 desk:p-[30px]`}
                                        style={principal.style}
                                    >
                                        {/* Debajo de `desk` las columnas crecen y bajan a otra línea cuando no caben juntas */}
                                        <div
                                            className="flex min-w-0 grow basis-[400px] flex-col gap-6 desk:h-full desk:grow-0 desk:justify-around"
                                        >
                                            <CardTone index={0}><ControlSeguridad /></CardTone>
                                            <CardTone index={1}><Animations /></CardTone>
                                            <CardTone index={2}><Texto /></CardTone>
                                            <CardTone index={3}><Led /></CardTone>
                                        </div>
                                        <div
                                            className="flex min-w-0 grow basis-[580px] flex-col gap-6 desk:h-full desk:grow-0 desk:justify-around"
                                        >
                                            <CardTone index={5}><Cameras visible={activeTab === "principal"} /></CardTone>
                                            <CardTone index={4}><PostureControl /></CardTone>
                                        </div>
                                    </section>

                                    {/* TABLERO 2: SERVICIOS */}
                                    <section
                                        className={`${servicios.position} grid w-full grid-cols-1 gap-6 p-4 transition-opacity duration-300 ease-in-out sm:p-6 md:grid-cols-2 desk:absolute desk:left-0 desk:top-0 desk:grid desk:h-full desk:grid-cols-4 desk:grid-rows-[190px_190px_190px_240px] desk:gap-x-11 desk:gap-y-5 desk:p-[30px]`}
                                        style={servicios.style}
                                    >
                                        <CardTone index={0} className="h-full w-full md:col-start-1 md:row-start-1 desk:col-[1/3] desk:row-[1]">
                                            <WebService />
                                        </CardTone>
                                        <CardTone index={2} className="h-full w-full col-span-1 md:col-span-2 desk:col-span-4 desk:row-2">
                                            <AudioService />
                                        </CardTone>
                                        <CardTone index={3} className="flex h-full w-full items-start md:col-span-2 desk:col-[1/3] desk:row-[3]">
                                            <BreathingBodyControl />
                                        </CardTone>
                                        {/* Alineamos los componentes de movimiento al final de su celda (bottom). En tablet (md) van apilados en la columna izquierda y Pepper de pie ocupa la derecha */}
                                        <CardTone index={2} className="z-[2] flex h-full w-full items-end md:col-start-1 md:row-start-4 desk:col-[1/2] desk:row-[4]">
                                            {/* Este componente nunca se desmonta, por lo que presionar "w" funcionará siempre */}
                                            <Movement />
                                        </CardTone>
                                        <CardTone index={1} className="flex h-full w-full items-end md:col-start-1 md:row-start-5 desk:col-[2/3] desk:row-[4]">
                                            <HeadMovement />
                                        </CardTone>
                                        <CardTone index={1} className="h-full w-full md:col-start-2 md:row-start-1 desk:col-[3/5] desk:row-[1]">
                                            <PictureService />
                                        </CardTone>

                                        {/* CONTENEDOR DERECHA UNIFICADO (Dividido en 3 partes iguales) */}
                                        <div
                                            className="flex h-full flex-col gap-6 md:col-span-2 desk:col-[3/5] desk:row-[3/5]"
                                        >
                                            <CardTone index={4} className="flex flex-1 items-center">
                                                <AutonomousLife />
                                            </CardTone>
                                            <CardTone index={5} className="flex flex-1 items-center">
                                                <Tracker />
                                            </CardTone>
                                            <CardTone index={0} className="flex flex-1 items-center">
                                                <TabletVisibility />
                                            </CardTone>
                                        </div>

                                        {/* Pepper de pie. Móvil: al final de la pestaña, centrado y con su sombra en el suelo. Tablet (md): en la
                                            columna derecha, junto a los dos componentes de movimiento. Escritorio: suelto en el tablero, sin sombra */}
                                        <div className="pointer-events-none flex flex-col items-center justify-self-center md:col-start-2 md:row-[4/6] md:self-end desk:absolute desk:bottom-[30px] desk:left-[790px] desk:z-[1] desk:col-auto desk:row-auto desk:block desk:self-auto">
                                            <img
                                                className="block h-[300px] w-auto md:h-[480px]"
                                                src={pepperImage}
                                                alt="Complete Pepper"
                                            />
                                            {/* Sombra en el suelo: el robot "se apoya" en el final de la pestaña */}
                                            <div aria-hidden="true" className="-mt-2 h-3 w-40 rounded-full bg-[var(--c-borde-tablero)]/20 blur-[3px] desk:hidden" />
                                        </div>
                                    </section>

                                    {/* TABLERO 3: SCRIPTS */}
                                    <section
                                        className={`${scripts.position} flex w-full flex-col gap-[30px] p-4 transition-opacity duration-300 ease-in-out sm:p-6 desk:absolute desk:left-0 desk:top-0 desk:flex desk:h-full desk:p-[30px]`}
                                        style={scripts.style}
                                    >
                                        <CardTone index={0}><QuickAction /></CardTone>
                                        <div className="flex flex-col items-stretch gap-6 lg:flex-row lg:items-start lg:justify-between">
                                            <CardTone index={1}><HotWords scripts={sessionScripts} /></CardTone>
                                            <CardTone index={2}>
                                                <ScriptsCreator
                                                    sessionScripts={sessionScripts}
                                                    setSessionScripts={setSessionScripts}
                                                />
                                            </CardTone>
                                        </div>
                                    </section>
                                </div>
                            </div>

                            {/* Bordes difuminados: solo en escritorio (ahí es donde scrollea el marco) y solo si hay más contenido */}
                            <ScrollFade edge="top" visible={canScrollUp} />
                            <ScrollFade edge="bottom" visible={canScrollDown} />

                            <CustomScrollbar scrollRef={scrollRef} />

                            <BoardBorderPills />
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default App;
