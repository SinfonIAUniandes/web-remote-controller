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
import Texto from './components/Texto';
import Animaciones from './components/Animaciones';
import Audio from './components/Audio';
import BreathingControl from './components/BreathingControl';
import AutonomousLifeControl from './components/AutonomousLifeControl';
import TrackerControl from './components/TrackerControl';
import ShowWordsTablet from './components/ShowWordsTablet';
import HideTabletScreen from './components/HideTabletScreen';
import Cabeza from './components/Cabeza';
import ScriptPanel from './components/ScriptPanel'
import PostureControl from './components/PostureControl'

const App = () => {
    return (
        <div className="App">
            <h1>Robot camera feed</h1>
            <Cameras />
            <h1>Servicio Web</h1>
            <Navegador />
            <h1>Imagen en la tablet</h1>
            <Imagen />
            <h1>Robot base</h1>
            <Base />
            <h1>Leds</h1>
            <Leds />
            <h1>Activar control de Seguridad</h1>
            <EnableRobotSecurity />
            <h1>Desactivar control de Seguridad</h1>
            <DisableRobotSecurity />
            <h1>Estado de la Batería</h1>
            <Battery />
            <h1>Texto</h1>
            <Texto />
            <h1>Volumen</h1>
            <Volumen />
            <h1>Control de Respiración</h1>
            <BreathingControl />
            <h1>Modo Autónomo</h1>
            <AutonomousLifeControl />
            <h1>Control del Tracker</h1>
            <TrackerControl />
            <h1>Ver en tablet qué dice el robot</h1>
            <ShowWordsTablet />
            <h1>Animaciones</h1>
            <Animaciones />
            <h1>Audio</h1>
            <Audio />
            <h1>Cabeza</h1>
            <Cabeza />
            <h1>Ocultar pantalla de la tablet</h1>
            <HideTabletScreen />
            <h1>Panel de script</h1>
            <ScriptPanel />
            <h1>Postura control</h1>
            <PostureControl />
        </div>
    );
};

export default App;
