import React, { useState, useEffect } from "react";

import Cameras from "./components/Cameras";
import Leds from "./components/Leds";
import Base from "./components/Base";
import Navegador from "./components/Navegador";
import Imagen from "./components/Imagen";
import EnableRobotSecurity from "./components/EnableRobotSecurity";
import DisableRobotSecurity from "./components/DisableRobotSecurity";
import Battery from "./components/Battery";
import Volumen from "./components/Volumen";
import Audio from "./components/Audio";
import BreathingControl from "./components/BreathingControl";
import AutonomousLifeControl from "./components/AutonomousLifeControl";
import TrackerControl from "./components/TrackerControl";
import ShowWordsTablet from "./components/ShowWordsTablet";
import HideTabletScreen from "./components/HideTabletScreen";
import Cabeza from "./components/Cabeza";
import ScriptPanel from "./components/ScriptPanel";
import PostureControl from "./components/PostureControl";
import ScriptsCreator from "./components/ScriptsCreator";
import Texto from "./components/Texto";
import ControlSeguridad from "./components/ControlSeguridad";
import LateralMenu from "./components/MenuLateral";
import Animations from "./components/Animations";
import WebService from "./components/WebService";
//import HotWords from "./components/HotWords";
import "./App.css";
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
const hashPassword = (password) => {
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
    return /(^127\.)|(^10\.)|(^172\.(1[6-9]|2[0-9]|3[0-1])\.)|(^192\.168\.)|(^localhost$)|(^0\.0\.0\.0$)/.test(
        hostname,
    );
};

const App = () => {
    // Estado para guardar el nivel de "zoom" (escala)
    const [scale, setScale] = useState(1);

    // NUEVO ESTADO: Controla qué pestaña está visible ('principal' o 'servicios')
    const [activeTab, setActiveTab] = useState("principal");

    const [sessionScripts, setSessionScripts] = useState([]);

    // SEGURIDAD: Estado de autorización
    const [isAuthorized, setIsAuthorized] = useState(
        localStorage.getItem("auth_token") === "true",
    );
    const [passInput, setPassInput] = useState("");
    const [onCorrectNetwork] = useState(isLocalNetwork());

    useEffect(() => {
        const calculateScale = () => {
            const availableHeight = window.innerHeight - 60;
            const boardHeight = 950;
            const newScale = Math.min(1, availableHeight / boardHeight);
            setScale(newScale);
        };

        calculateScale();
        window.addEventListener("resize", calculateScale);
        return () => window.removeEventListener("resize", calculateScale);
    }, []);

    const handleLogin = () => {
        // Eliminamos espacios en blanco accidentales
        const hashedInput = hashPassword(passInput.trim());
        if (hashedInput === TARGET_HASH) {
            setIsAuthorized(true);
            localStorage.setItem("auth_token", "true");
        } else {
            alert("Contraseña incorrecta");
            setPassInput("");
        }
    };

    // Pantalla de bloqueo (Por contraseña o por red no segura)
    if (!isAuthorized || !onCorrectNetwork) {
        return (
            <div
                style={{
                    height: "100vh",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    background: COLORS.AZUL_PRINCIPAL,
                    fontFamily: "Nunito",
                }}
            >
                <div
                    style={{
                        background: COLORS.CELESTE_PRINCIPAL,
                        padding: "40px",
                        borderRadius: "20px",
                        textAlign: "center",
                        boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
                    }}
                >
                    <h1 style={{ color: COLORS.AZUL_PRINCIPAL, marginBottom: "20px" }}>
                        Acceso SinfonIA
                    </h1>

                    {!onCorrectNetwork && (
                        <div
                            style={{
                                color: COLORS.ROJO,
                                fontWeight: "bold",
                                marginBottom: "20px",
                                padding: "10px",
                                border: `2px solid ${COLORS.ROJO}`,
                                borderRadius: "10px",
                            }}
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
                        style={{
                            padding: "12px",
                            borderRadius: "10px",
                            border: "none",
                            width: "200px",
                            marginBottom: "20px",
                            outline: "none",
                            textAlign: "center",
                        }}
                    />
                    <br />
                    <button
                        onClick={handleLogin}
                        disabled={!onCorrectNetwork}
                        style={{
                            padding: "10px 30px",
                            borderRadius: "10px",
                            border: "none",
                            background: COLORS.AZUL_PRINCIPAL,
                            color: "white",
                            cursor: "pointer",
                            fontWeight: "bold",
                        }}
                    >
                        ENTRAR
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div
            className="app-layout"
            style={{
                minHeight: "100vh",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                backgroundColor: COLORS.CELESTE_PRINCIPAL,
            }}
        >
            <main
                className="app-content"
                style={{
                    display: "flex",
                    flexDirection: "column",
                    width: "100%",
                    alignItems: "center",
                    padding: "20px 0",
                }}
            >
                {/* ── WRAPPER DE ESCALA ÚNICO ── */}
                <div
                    className="scale-wrapper"
                    style={{
                        height: `${950 * scale}px`,
                        width: "100%",
                        display: "flex",
                        justifyContent: "center",
                        position: "relative",
                        overflow: "hidden"
                    }}
                >
                    <div
                        className="top-section"
                        style={{
                            display: "flex",
                            flexDirection: "row",
                            gap: "30px",
                            alignItems: "flex-start",
                            width: "fit-content",
                            height: "950px",
                            transform: `scale(${scale})`,
                            transformOrigin: "top center",
                            backfaceVisibility: "hidden",
                            WebkitFontSmoothing: "antialiased"
                        }}
                    >
                        {/* ── MENÚ LATERAL ── */}
                        <aside
                            className="app-sidebar"
                            style={{ position: "sticky", top: "0", height: "fit-content" }}
                        >
                            {/* ¡OJO AQUÍ! Pasamos la función setActiveTab para que el menú cambie de vista */}
                            <LateralMenu activeTab={activeTab} setActiveTab={setActiveTab} />
                        </aside>

                        {/* ── CONTENEDOR APILADO PARA AMBOS TABLEROS ── */}
                        <div
                            style={{
                                position: "relative",
                                flex: "1",
                                width: "1084px",
                                height: "950px",
                                border: `5px solid ${COLORS.AZUL_PRINCIPAL}`,
                                borderRadius: "25px",
                                overflow: "hidden", // <- IMPORTANTE: Evita que las esquinas de los tableros se salgan del borde redondeado
                            }}
                        >
                            {/* TABLERO 1: PRINCIPAL */}
                            <section
                                className="tablero-principal"
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    position: "absolute",
                                    top: 0,
                                    left: 0,
                                    padding: "30px", // <- Espacio exterior uniforme
                                    boxSizing: "border-box", // <- Mantiene todo dentro de las proporciones
                                    display: "flex",
                                    flexDirection: "row",
                                    alignContent: "space-between",
                                    justifyContent: "space-between",
                                    flexWrap: "wrap",
                                    opacity: activeTab === "principal" ? 1 : 0,
                                    pointerEvents: activeTab === "principal" ? "auto" : "none",
                                    transition: "opacity 0.3s ease",
                                }}
                            >
                                <div
                                    className="tablero-col-izq"
                                    style={{
                                        flex: "0 0 400px",
                                        display: "flex",
                                        flexDirection: "column",
                                        justifyContent: "space-around",
                                        height: "100%",
                                    }}
                                >
                                    <ControlSeguridad />
                                    <Animations />
                                    <Texto />
                                    <Led />
                                </div>
                                <div
                                    className="tablero-col-der"
                                    style={{
                                        flex: "0 0 580px",
                                        display: "flex",
                                        flexDirection: "column",
                                        justifyContent: "space-around",
                                        height: "100%",
                                    }}
                                >
                                    <Cameras />
                                    <PostureControl />
                                </div>
                            </section>

                            {/* TABLERO 2: SERVICIOS */}
                            <section
                                className="tablero-servicios"
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    position: "absolute",
                                    top: 0,
                                    left: 0,
                                    padding: "30px", // <- Mismo espacio exterior que el principal
                                    boxSizing: "border-box", // <- Mantiene todo dentro de las proporciones
                                    display: "grid",
                                    gridTemplateColumns: "repeat(4, 1fr)",
                                    gridTemplateRows: "190px 190px 190px 240px", // Alturas fijas arriba para reducir espacios, flexible en la 3
                                    columnGap: "44px", // Mantiene la alineación horizontal
                                    rowGap: "20px", // Espaciado uniforme entre filas
                                    opacity: activeTab === "servicios" ? 1 : 0,
                                    pointerEvents: activeTab === "servicios" ? "auto" : "none",
                                    transition: "opacity 0.3s ease",
                                }}
                            >
                                <div
                                    style={{
                                        gridColumn: "1 / 3",
                                        gridRow: "1",
                                        width: "100%",
                                        height: "100%",
                                    }}
                                >
                                    <WebService />
                                </div>
                                <div
                                    style={{
                                        gridColumn: "1 / 5",
                                        gridRow: "2",
                                        width: "100%",
                                        height: "100%",
                                    }}
                                >
                                    <AudioService />
                                </div>
                                <div
                                    style={{
                                        gridColumn: "1 / 3",
                                        gridRow: "3",
                                        width: "100%",
                                        height: "100%",
                                        display: "flex",
                                        alignItems: "flex-start",
                                    }}
                                >
                                    <BreathingBodyControl />
                                </div>
                                {/* Alineamos los componentes de movimiento al final de su celda (bottom) */}
                                <div
                                    style={{
                                        gridColumn: "1 / 2",
                                        gridRow: "4",
                                        width: "100%",
                                        height: "100%",
                                        display: "flex",
                                        alignItems: "flex-end",
                                        zIndex: 2,
                                    }}
                                >
                                    {/* Este componente nunca se desmonta, por lo que presionar "w" funcionará siempre */}
                                    <Movement />
                                </div>
                                <div
                                    style={{
                                        gridColumn: "2 / 3",
                                        gridRow: "4",
                                        width: "100%",
                                        height: "100%",
                                        display: "flex",
                                        alignItems: "flex-end",
                                    }}
                                >
                                    <HeadMovement />
                                </div>
                                <div
                                    style={{
                                        gridColumn: "3 / 5",
                                        gridRow: "1",
                                        width: "100%",
                                        height: "100%",
                                    }}
                                >
                                    <PictureService />
                                </div>

                                {/* CONTENEDOR DERECHA UNIFICADO (Dividido en 3 partes iguales) */}
                                <div
                                    style={{
                                        gridColumn: "3 / 5",
                                        gridRow: "3 / 5",
                                        display: "flex",
                                        flexDirection: "column",
                                        height: "100%",
                                    }}
                                >
                                    <div
                                        style={{ flex: 1, display: "flex", alignItems: "center" }}
                                    >
                                        <AutonomousLife />
                                    </div>
                                    <div
                                        style={{ flex: 1, display: "flex", alignItems: "center" }}
                                    >
                                        <Tracker />
                                    </div>
                                    <div
                                        style={{ flex: 1, display: "flex", alignItems: "center" }}
                                    >
                                        <TabletVisibility />
                                    </div>
                                </div>

                                <img
                                    style={{
                                        width: 212,
                                        height: 420,
                                        left: 780,
                                        bottom: 30,
                                        position: "absolute",
                                        pointerEvents: "none",
                                        zIndex: 1,
                                    }}
                                    src={completePepper}
                                    alt="Complete Pepper"
                                />
                            </section>
                            <section
                                className="Scripts"
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    position: "absolute",
                                    top: 0,
                                    left: 0,
                                    padding: "30px",
                                    boxSizing: "border-box",
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "30px",
                                    opacity: activeTab === "scripts" ? 1 : 0,
                                    pointerEvents: activeTab === "scripts" ? "auto" : "none",
                                    transition: "opacity 0.3s ease",
                                }}
                            >
                                <QuickAction />
                                <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
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

                {/* ── PARTE INFERIOR INTACTA ── */}
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
            </main>
        </div>
    );
};

export default App;
