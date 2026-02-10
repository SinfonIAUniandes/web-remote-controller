/**
 * home.js
 * Lógica de la vista HOME.
 * Muestra el estado general del sistema y accesos rápidos.
 */
import RosConnection from '../../utils/rosConnection.js';

(function() {
    console.log('🏠 Vista HOME cargada');

    // Cargar componentes necesarios
    loadComponents();

    // Actualizar estado del sistema
    updateSystemStatus();

    /**
     * Carga los componentes JS necesarios
     */
    function loadComponents() {
        // Cargar componente de batería
        const batteryScript = document.createElement('script');
        batteryScript.src = '../src/components/battery.js';
        document.body.appendChild(batteryScript);

        // Cargar componente de volumen
        const volumeScript = document.createElement('script');
        volumeScript.src = '../src/components/volume.js';
        document.body.appendChild(volumeScript);
    }

    /**
     * Actualiza el estado del sistema
     */
    function updateSystemStatus() {
        // Actualizar estado de ROS
        const rosStatusElement = document.getElementById('ros-status');
        if (rosStatusElement) {
            if (RosConnection.getConnectionStatus()) {
                rosStatusElement.innerHTML = '<span style="color: #27ae60;">✅ Conectado</span>';
            } else {
                rosStatusElement.innerHTML = '<span style="color: #e74c3c;">❌ Desconectado</span>';
            }
        }

        // Actualizar cada 5 segundos
        setInterval(updateSystemStatus, 5000);
    }
})();