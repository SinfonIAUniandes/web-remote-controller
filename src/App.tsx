import React, { useState } from "react";

import Cameras from "./components/Cameras";
import PostureControl from "./components/PostureControl";
import ScriptsCreator from "./components/ScriptsCreator";
import Texto from "./components/Texto";
import ControlSeguridad from "./components/ControlSeguridad";
import LateralMenu from "./components/MenuLateral";
import Animations from "./components/Animations";
import WebService from "./components/WebService";
import "./fonts.css";
import Led from "./components/Led";
import { COLORS } from "./theme";
import PictureService from "./components/PictureService";
import AudioService from "./components/AudioService";
import BreathingBodyControl from "./components/BreathingBodyControl";
import Movement from "./components/Movement";
import HeadMovement from "./components/HeadMovement";
import AutonomousLife from "./components/AutonomousLife";
import Tracker from "./components/Tracker";
import TabletVisibility from "./components/TabletVisibility";
import completePepper from "./assets/complete_pepper.png";
import HotWords from "./components/HotWords";
import QuickAction from "./components/QuickAction";

// Función de hash "pesada" con Key Stretching (500 rondas) y Salt
const hashPassword = (password: string) => {
    const salt = "SinfonIA_Robot_2024_Salt";
    let currentStr = password + salt;
    let h = 2166136261; // Offset FNV

    // Key Stretching: Ejecutamos 500 rondas de hashing
    for (let i = 0; i < 500; i++) {
        for (let j = 0; j < currentStr.length; j++) {
            h ^= currentStr.charCodeAt(j);
            h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24);
        }
        h = h | 0;
        currentStr = h.toString(16); // Alimentamos el hash a la siguiente ronda
    }
    return (h >>> 0).toString(16);
};

const TARGET_HASH = "ad5ac8e6";

// Función para verificar si la red es local (localhost o rangos privados)
const isLocalNetwork = () => {
    const hostname = window.location.hostname;
    return /(^127\.)|(^10\.)|(^172\.(1[6-9]|2[0-9]|3[0-1])\.)|(^192\.168\.)|(^157\.253\.)|(^localhost$)|(^0\.0\.0\.0$)/.test(
        hostname,
    );
};

const App = () => {
    // NUEVO ESTADO: Controla qué pestaña está visible ('principal' o 'servicios')
    const [activeTab, setActiveTab] = useState("principal");

    const [sessionScripts, setSessionScripts] = useState<
        React.ComponentProps<typeof ScriptsCreator>["sessionScripts"]
    >([]);

    // SEGURIDAD: Estado de autorización
    const [isAuthorized, setIsAuthorized] = useState(
        localStorage.getItem("auth_token") === "true",
    );
    const [passInput, setPassInput] = useState("");
    const [onCorrectNetwork] = useState(isLocalNetwork());

    const handleLogin = () => {
        // Eliminamos espacios en blanco accidentales
        const hashedInput = hashPassword(passInput.trim());
        setIsAuthorized(true);
        localStorage.setItem("auth_token", "true");
        // if (hashedInput === TARGET_HASH) {
        //     setIsAuthorized(true);
        //     localStorage.setItem("auth_token", "true");
        // } else {
        //     alert("Contraseña incorrecta");
        //     setPassInput("");
        // }
    };

    // Pantalla de bloqueo (Por contraseña o por red no segura)
    if (!isAuthorized || !onCorrectNetwork) {
        return (
            <div
                className="flex h-screen items-center justify-center"
                style={{ background: COLORS.AZUL_PRINCIPAL, fontFamily: "Nunito" }}
            >
                <div
                    className="rounded-[20px] p-10 text-center shadow-[0_10px_30px_rgba(0,0,0,0.5)]"
                    style={{ background: COLORS.CELESTE_PRINCIPAL }}
                >
                    <h1 className="mb-5" style={{ color: COLORS.AZUL_PRINCIPAL }}>
                        Acceso SinfonIA
                    </h1>

                    {!onCorrectNetwork && (
                        <div
                            className="mb-5 rounded-[10px] border-2 p-2.5 font-bold"
                            style={{ color: COLORS.ROJO, borderColor: COLORS.ROJO }}
                        >
                            ADVERTENCIA: No estás en la red local del robot.
                        </div>
                    )}

                    <input
                        type="password"
                        placeholder={onCorrectNetwork ? "Contraseña" : "Red no permitida"}
                        disabled={!onCorrectNetwork}
                        value={passInput}
                        onChange={(e) => setPassInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                        className="mb-5 w-[200px] rounded-[10px] border-0 p-3 text-center outline-none"
                    />
                    <br />
                    <button
                        onClick={handleLogin}
                        disabled={!onCorrectNetwork}
                        className="cursor-pointer rounded-[10px] border-0 px-[30px] py-2.5 font-bold text-white"
                        style={{ background: COLORS.AZUL_PRINCIPAL }}
                    >
                        ENTRAR
                    </button>
                </div>
            </div>
        );
    }


    return (
        <div
            className="flex min-h-screen w-full flex-col items-center overflow-x-hidden"
            style={{ backgroundColor: COLORS.CELESTE_PRINCIPAL }}
        >
            <main
                className="flex w-full flex-col items-center overflow-x-hidden px-3 py-5 sm:px-5"
            >
                <div
                    className="flex w-full max-w-[1340px] flex-col gap-5"
                >
                    <div
                        className="flex w-full flex-col items-stretch gap-5 lg:flex-row lg:items-start"
                    >
                        {/* ── MENÚ LATERAL ── */}
                        <aside
                            className="w-full shrink-0 overflow-hidden lg:sticky lg:top-0 lg:w-[220px]"
                        >
                            {/* ¡OJO AQUÍ! Pasamos la función setActiveTab para que el menú cambie de vista */}
                            <LateralMenu activeTab={activeTab} setActiveTab={setActiveTab} />
                        </aside>

                        {/* ── CONTENEDOR APILADO PARA AMBOS TABLEROS ── */}
                        <div
                            className="relative min-h-0 w-full min-w-0 flex-1 overflow-hidden rounded-[25px] border-[5px] lg:h-[950px] lg:min-h-[950px] lg:w-[1084px]"
                            style={{ borderColor: COLORS.AZUL_PRINCIPAL }}
                        >
                            {/* TABLERO 1: PRINCIPAL */}
                            <section
                                className={`${activeTab === "principal" ? "relative" : "hidden"} flex w-full flex-col gap-6 p-4 transition-opacity duration-300 ease-in-out sm:p-6 lg:absolute lg:left-0 lg:top-0 lg:flex lg:h-full lg:flex-row lg:flex-wrap lg:content-between lg:justify-between lg:gap-0 lg:p-[30px]`}
                                style={{
                                    opacity: activeTab === "principal" ? 1 : 0,
                                    pointerEvents: activeTab === "principal" ? "auto" : "none",
                                }}
                            >
                                <div
                                    className="flex w-full basis-[400px] flex-col gap-6 lg:h-full lg:justify-around"
                                >
                                    <ControlSeguridad />
                                    <Animations />
                                    <Texto />
                                    <Led />
                                </div>
                                <div
                                    className="flex w-full basis-[580px] flex-col gap-6 lg:h-full lg:justify-around"
                                >
                                    <Cameras />
                                    <PostureControl />
                                </div>
                            </section>

                            {/* TABLERO 2: SERVICIOS */}
                            <section
                                className={`${activeTab === "servicios" ? "relative" : "hidden"} grid w-full grid-cols-1 gap-6 p-4 transition-opacity duration-300 ease-in-out sm:p-6 lg:absolute lg:left-0 lg:top-0 lg:grid lg:h-full lg:grid-cols-4 lg:grid-rows-[190px_190px_190px_240px] lg:gap-x-11 lg:gap-y-5 lg:p-[30px]`}
                                style={{
                                    opacity: activeTab === "servicios" ? 1 : 0,
                                    pointerEvents: activeTab === "servicios" ? "auto" : "none",
                                }}
                            >
                                <div
                                    className="h-full w-full lg:col-[1/3] lg:row-[1]"
                                >
                                    <WebService />
                                </div>
                                <div
                                    className="h-full w-full col-span-1 lg:col-span-4 lg:row-2"
                                >
                                    <AudioService />
                                </div>
                                <div
                                    className="flex h-full w-full items-start lg:col-[1/3] lg:row-[3]"
                                >
                                    <BreathingBodyControl />
                                </div>
                                {/* Alineamos los componentes de movimiento al final de su celda (bottom) */}
                                <div
                                    className="z-[2] flex h-full w-full items-end lg:col-[1/2] lg:row-[4]"
                                >
                                    {/* Este componente nunca se desmonta, por lo que presionar "w" funcionará siempre */}
                                    <Movement />
                                </div>
                                <div
                                    className="flex h-full w-full items-end lg:col-[2/3] lg:row-[4]"
                                >
                                    <HeadMovement />
                                </div>
                                <div
                                    className="h-full w-full lg:col-[3/5] lg:row-[1]"
                                >
                                    <PictureService />
                                </div>

                                {/* CONTENEDOR DERECHA UNIFICADO (Dividido en 3 partes iguales) */}
                                <div
                                    className="flex h-full flex-col gap-6 lg:col-[3/5] lg:row-[3/5]"
                                >
                                    <div
                                        className="flex flex-1 items-center"
                                    >
                                        <AutonomousLife />
                                    </div>
                                    <div
                                        className="flex flex-1 items-center"
                                    >
                                        <Tracker />
                                    </div>
                                    <div
                                        className="flex flex-1 items-center"
                                    >
                                        <TabletVisibility />
                                    </div>
                                </div>

                                <img
                                    className="pointer-events-none absolute bottom-[30px] left-[780px] z-[1] hidden h-[420px] w-[212px] lg:block"
                                    src={completePepper}
                                    alt="Complete Pepper"
                                />
                            </section>
                            <section
                                className={`${activeTab === "scripts" ? "relative" : "hidden"} flex w-full flex-col gap-[30px] p-4 transition-opacity duration-300 ease-in-out sm:p-6 lg:absolute lg:left-0 lg:top-0 lg:flex lg:h-full lg:p-[30px]`}
                                style={{
                                    opacity: activeTab === "scripts" ? 1 : 0,
                                    pointerEvents: activeTab === "scripts" ? "auto" : "none",
                                }}
                            >
                                <QuickAction />
                                <div className="flex flex-col items-stretch gap-6 lg:flex-row lg:items-start lg:justify-between">
                                    <HotWords scripts={sessionScripts} />
                                    <ScriptsCreator
                                        sessionScripts={sessionScripts}
                                        setSessionScripts={setSessionScripts}
                                    />
                                </div>
                            </section>
                        </div>
                    </div>
                </div>
                
                {/* ── PARTE INFERIOR INTACTA ── 
                <section
                    className="seccion-extra"
                    style={{ width: "100%", maxWidth: "1084px", marginTop: "60px" }}
                >
                    <Leds />
                    <h2>Servicios Web</h2>
                    <Navegador />
                    <h2>Imagen en la tablet</h2>
                    <Imagen />
                    <h2>Robot base</h2>
                    <Base />
                    <h2>Activar seguridad</h2>
                    <EnableRobotSecurity />
                    <h2>Desactivar seguridad</h2>
                    <DisableRobotSecurity />
                    <h2>Batería</h2>
                    <Battery />
                    <h2>Volumen</h2>
                    <Volumen />
                    <h2>Control de Respiración</h2>
                    <BreathingControl />
                    <h2>Modo Autónomo</h2>
                    <AutonomousLifeControl />
                    <h2>Control del Tracker</h2>
                    <TrackerControl />
                    <h2>Mostrar texto en tablet</h2>
                    <ShowWordsTablet />
                    <h2>Audio</h2>
                    <Audio />
                    <h2>Cabeza</h2>
                    <Cabeza />
                    <h2>Ocultar pantalla tablet</h2>
                    <HideTabletScreen />
                    <h2>Acciones rápidas</h2>
                    <QuickAction />
                </section>
                */}
            </main>
        </div>
    );

};


export default App
