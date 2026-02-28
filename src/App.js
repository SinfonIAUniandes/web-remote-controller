// src/App.js
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
import Animaciones from './components/Animaciones';
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

import './App.css';
import './fonts.css';

const App = () => {
    return (
        <div className="app-layout">
            {/* ── Menú lateral fijo a la izquierda ── */}
            <aside className="app-sidebar">
                <LateralMenu />
            </aside>

            {/* ── Contenido principal scrollable ── */}
            <main className="app-content">
                {/* TABLERO PRINCIPAL — los paneles del Figma */}
                <section className="tablero-principal">
                    <div className="tablero-col-izq">
                        <ControlSeguridad />
                        <Animaciones />
                        <Texto />
                        <Leds />
                    </div>
                    <div className="tablero-col-der">
                        <Cameras />
                        <PostureControl />
                    </div>
                </section>

                {/* ── Resto de componentes (desarrollo / debug) ── */}
                <section className="seccion-extra">
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