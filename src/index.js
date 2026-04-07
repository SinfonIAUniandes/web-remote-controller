import './styles/global.css';
import RosConnection from './services/rosConnection.js';
import Navigation from './utils/navigation.js';

// RosManager se carga globalmente para uso en componentes
import './services/RosManager.js';

// Crear la estructura de la aplicacion
const root = document.getElementById('root');
root.innerHTML = `
    <div id="app">
        <aside id="sidebar"></aside>
        <main id="main-content"></main>
    </div>
`;

// Inicializar cuando el DOM este listo
window.addEventListener('load', function() {
    // Conectar a ROS
    RosConnection.connect();
    
    // Cargar la vista HOME por defecto
    Navigation.loadView('home');
});
