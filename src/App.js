import React from 'react';

import Cameras from './components/Cameras';
import Leds from './components/Leds';
import Base from './components/Base';
import Navegador from './components/Navegador';
import Imagen from './components/Imagen';
import EnableRobotSecurity from './components/EnableRobotSecurity';
import DisableRobotSecurity from './components/DisableRobotSecurity';
import Battery from './components/Battery';
import Volumen from './components/Volumen';
import Audio from './components/Audio';
import BreathingControl from './components/BreathingControl';
import AutonomousLifeControl from './components/AutonomousLifeControl';
import TrackerControl from './components/TrackerControl';
import ShowWordsTablet from './components/ShowWordsTablet';
import HideTabletScreen from './components/HideTabletScreen';
import Cabeza from './components/Cabeza';
import ScriptPanel from './components/ScriptPanel';
import PostureControl from './components/PostureControl';
import ScriptsCreator from './components/ScriptsCreator';
import QuickActions from './components/QuickActions';
import Texto from './components/Texto';
import ControlSeguridad from './components/ControlSeguridad';
import LateralMenu from './components/MenuLateral';
import Animations from './components/Animations';
import './App.css';
import './fonts.css';
import Led from './components/Led';
import { COLORS } from './theme';

const App = () => {
    return (
        // CONTENEDOR RAIZ: Ocupa toda la pantalla y centra su contenido horizontalmente
        <div className="app-layout" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', backgroundColor: COLORS.CELESTE_PRINCIPAL }}>
            
            {/* CONTENEDOR CENTRAL: Agrupa tanto la parte de arriba (Menú+Tablero) como la parte de abajo (Extra) */}
            <main className="app-content" style={{ display: 'flex', flexDirection: 'column', width: 'fit-content', padding: '20px' }}>
                
                {/* ── PARTE SUPERIOR: Menú y Tablero alineados horizontalmente ── */}
                <div className="top-section" style={{ display: 'flex', flexDirection: 'row', gap: '30px', alignItems: 'flex-start' }}>
                    
                    {/* Menú lateral fijo a la izquierda del tablero (sticky lo mantiene en pantalla al hacer scroll) */}
                    <aside className="app-sidebar" style={{ position: 'sticky', top: '20px', height: 'fit-content' }}>
                        <LateralMenu />
                    </aside>

                    {/* TABLERO PRINCIPAL — los paneles del Figma (estilos originales intactos) */}
                    <section className="tablero-principal" style={{ width: '1084px', height: '950px', display: 'flex', flexDirection: 'row', alignContent: 'space-around', justifyContent: 'space-around', flexWrap: 'wrap' }}>
                        <div className="tablero-col-izq" style={{ flex: '1', display: 'flex', flexDirection: 'column', justifyContent: 'space-around', height: '100%' }}>
                            <ControlSeguridad />
                            <Animations />
                            <Texto />
                            <Led />
                        </div>
                        <div className="tablero-col-der" style={{ flex: '1', display: 'flex', flexDirection: 'column', justifyContent: 'space-around', height: '100%' }}>
                            <Cameras />
                            <PostureControl />
                        </div>
                    </section>
                </div>

                {/* ── PARTE INFERIOR: Resto de componentes (desarrollo / debug) ── */}
                {/* Ocupa el mismo ancho del conjunto de arriba y mantiene tu lista original */}
                <section className="seccion-extra" style={{ width: '100%', marginTop: '60px' }}>
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