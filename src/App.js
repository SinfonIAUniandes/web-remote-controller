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
import QuickActions from "./components/QuickActions";
import Texto from "./components/Texto";
import ControlSeguridad from "./components/ControlSeguridad";
import LateralMenu from "./components/MenuLateral";
import Animations from "./components/Animations";
import WebService from "./components/WebService";
import HotWords from "./components/HotWords";
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

const App = () => {
    // Estado para guardar el nivel de "zoom" (escala)
    const [scale, setScale] = useState(1);
    
    // NUEVO ESTADO: Controla qué pestaña está visible ('principal' o 'servicios')
    const [activeTab, setActiveTab] = useState("principal");

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
                    }}
                >
                    <div
                        className="top-section"
                        style={{
                            transform: `scale(${scale})`,
                            transformOrigin: "top center",
                            display: "flex",
                            flexDirection: "row",
                            gap: "30px",
                            alignItems: "flex-start",
                            width: "fit-content",
                            height: "950px",
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
                        <div style={{ 
                            position: "relative", 
                            flex: "1", 
                            width: "1084px", 
                            height: "950px",
                            border: `5px solid ${COLORS.AZUL_PRINCIPAL}`, 
                            borderRadius: '25px',
                            overflow: 'hidden' // <- IMPORTANTE: Evita que las esquinas de los tableros se salgan del borde redondeado
                        }}>
                            
                            {/* TABLERO 1: PRINCIPAL */}
                            <section
                                className="tablero-principal"
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    position: "absolute",
                                    top: 0,
                                    left: 0,
                                    padding: "20px", // <- Movimos el padding aquí
                                    boxSizing: "border-box", // <- Mantiene todo dentro de las proporciones
                                    display: "flex",
                                    flexDirection: "row",
                                    alignContent: "space-around",
                                    justifyContent: "space-around",
                                    flexWrap: "wrap",
                                    opacity: activeTab === "principal" ? 1 : 0,
                                    pointerEvents: activeTab === "principal" ? "auto" : "none",
                                    transition: "opacity 0.3s ease",
                                }}
                            >
                                <div
                                    className="tablero-col-izq"
                                    style={{ flex: "0 0 400px", display: "flex", flexDirection: "column", justifyContent: "space-around", height: "100%" }}
                                >
                                    <ControlSeguridad />
                                    <Animations />
                                    <Texto />
                                    <Led />
                                </div>
                                <div
                                    className="tablero-col-der"
                                    style={{ flex: "0 0 580px", display: "flex", flexDirection: "column", justifyContent: "space-around", height: "100%" }}
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
                                    padding: "20px", // <- Movimos el padding aquí también
                                    boxSizing: "border-box", // <- Mantiene todo dentro de las proporciones
                                    display: "grid",
                                    gridTemplateColumns: "repeat(4, 1fr)",
                                    gridTemplateRows: "repeat(4, 1fr)",
                                    gap: "20px",
                                    opacity: activeTab === "servicios" ? 1 : 0,
                                    pointerEvents: activeTab === "servicios" ? "auto" : "none",
                                    transition: "opacity 0.3s ease",
                                }}
                            >
                                <div style={{ gridColumn: "1 / 3", gridRow: "1", width: "100%", height: "100%" }}>
                                    <WebService />
                                </div>
                                <div style={{ gridColumn: '1 / 5', gridRow: '2', width: '100%', height: '100%' }}>
                                    <AudioService />
                                </div>
                                <div style={{ gridColumn: '1 / 3', gridRow: '3', width: '100%', height: '100%' }}>
                                    <BreathingBodyControl />
                                </div>
                                <div style={{ gridColumn: '1 / 2', gridRow: '4', width: '100%', height: '100%' }}>
                                    {/* Este componente nunca se desmonta, por lo que presionar "w" funcionará siempre */}
                                    <Movement /> 
                                </div>
                                <div style={{ gridColumn: '2 / 3', gridRow: '4', width: '100%', height: '100%' }}>
                                    <HeadMovement />
                                </div>
                                <div style={{ gridColumn: "3 / 5", gridRow: "1", width: "100%", height: "100%" }}>
                                    <PictureService />
                                </div>
                                <div
                                    style={{
                                        gridColumn: "3 / 5",
                                        gridRow: "3 / 5",
                                        width: "100%",
                                        height: "100%",
                                        display: "flex",
                                        flexDirection: "column",
                                        justifyContent: "space-between",
                                        position: "relative" 
                                    }}
                                >
                                    <AutonomousLife />
                                    <Tracker />
                                    <TabletVisibility />
                                    <img style={{width: 212, height: 463, left: 249, top: 21, position: 'absolute'}} src={completePepper} alt="Complete Pepper"/>
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
                    <h2>Panel de script</h2>
                    <ScriptPanel />
                    <h2>Scripts Creator</h2>
                    <ScriptsCreator />
                    <h2>Acciones rápidas</h2>
                    <QuickActions />
                </section>
            </main>
        </div>
    );
};

export default App;
