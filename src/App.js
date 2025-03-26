// src/App.js
import React from 'react';
import Cameras from './components/Cameras'
import Leds from './components/Leds'
import Base from './components/Base'
import Navegador from './components/Navegador';
import Imagen from './components/Imagen';
import Battery from './components/Battery';
import Volumen from './components/Volumen';
import Texto from './components/Texto';

import BreathingControl from './components/BreathingControl';
import AutonomousLifeControl from './components/AutonomousLifeControl';
import TrackerControl from  './components/TrackerControl';
import ShowWordsTablet from  './components/ShowWordsTablet';
import AudioPlayer from './components/MicrophoneListener'

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
            <Leds />
            <h1>Estado de la Batería</h1>
            <Battery />
            <h1>Volumen</h1>
            <Volumen />
            <h1>Control de Respiración</h1>
            <BreathingControl />
            <h1>Modo Autónomo</h1>
            <AutonomousLifeControl />
            <h1>Control del Tracker</h1 >
            <TrackerControl />
            <h1>Ver en tablet qué dice el robot</h1 >
            <ShowWordsTablet />
        </div>
    );
};
export default App;