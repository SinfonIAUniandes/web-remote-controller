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
            <h1>Texto</h1>
            <Texto/>
            <h1>Volumen</h1>
            <Volumen />
        </div>
    );
};
export default App;