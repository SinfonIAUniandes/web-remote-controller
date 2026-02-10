/**
 * tracker.js
 * Componente que controla el tracker del robot Pepper.
 * El tracker permite que el robot siga personas o rostros con su cabeza y mirada.
 */
import RosManager from '../services/RosManager.js'; 
const TrackerComponent = (function() {
    let containerId = null;
    let isTracking = false;

    /**
     * Inicializa el componente
     */
    function init(elementId) {
        containerId = elementId;
        render();
    }

    /**
     * Renderiza el HTML del componente
     */
    function render() {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = `
            <div class="alert alert-info">
                <strong>¿Qué es el Tracker?</strong><br>
                Permite que el robot siga rostros o personas con su mirada y cabeza,
                creando una interacción más natural.
            </div>

            <div id="tracker-status" style="text-align: center; margin: 20px 0;">
                <div style="font-size: 48px; margin-bottom: 10px;">
                    <span id="tracker-icon"></span>
                </div>
                <p style="font-size: 18px; font-weight: bold;" id="tracker-text">
                    Estado: <span style="color: #e74c3c;">Apagado</span>
                </p>
            </div>

            <div style="display: flex; gap: 10px;">
                <button 
                    class="btn-success" 
                    onclick="TrackerComponent.toggleTracker(true)"
                    style="flex: 1; padding: 15px; font-size: 16px;"
                >
                     Encender Tracker
                </button>
                <button 
                    class="btn-danger" 
                    onclick="TrackerComponent.toggleTracker(false)"
                    style="flex: 1; padding: 15px; font-size: 16px;"
                >
                     Apagar Tracker
                </button>
            </div>

            <div style="margin-top: 15px; padding: 10px; background-color: #d1ecf1; border-radius: 5px; border-left: 4px solid #17a2b8;">
                <p style="font-size: 12px; margin: 0;">
                    <strong> Consejo:</strong> Cuando el tracker está encendido, 
                    el robot seguirá automáticamente rostros detectados. 
                    Apágalo si quieres controlar la cabeza manualmente.
                </p>
            </div>
        `;
    }

    /**
     * Enciende o apaga el tracker
     */
    function toggleTracker(enable) {
        const serviceName = enable 
            ? '/pytoolkit/ALTracker/start_tracker_srv' 
            : '/pytoolkit/ALTracker/stop_tracker_srv';

        const service = RosManager.createService(
            serviceName,
            'robot_toolkit_msgs/battery_service_srv'
        );

        if (!service) {
            alert('Error: El servicio del tracker no está disponible.');
            return;
        }

        const request = {}; // Sin argumentos

        RosManager.callService(service, request,
            function(result) {
                console.log(`Tracker ${enable ? 'encendido' : 'apagado'}:`, result);
                isTracking = enable;
                updateStatus(enable);
                alert(` Tracker ${enable ? 'encendido' : 'apagado'} correctamente`);
            },
            function(error) {
                console.error('Error cambiando tracker:', error);
                alert(' Error al cambiar el estado del tracker');
            }
        );
    }

    /**
     * Actualiza el indicador visual de estado
     */
    function updateStatus(enabled) {
        const trackerIcon = document.getElementById('tracker-icon');
        const trackerText = document.getElementById('tracker-text');

        if (trackerIcon) {
            trackerIcon.textContent = enabled ? '👁️✅' : '👁️';
        }

        if (trackerText) {
            const color = enabled ? '#27ae60' : '#e74c3c';
            const text = enabled ? 'Encendido (Siguiendo rostros)' : 'Apagado';
            trackerText.innerHTML = `Estado: <span style="color: ${color};">${text}</span>`;
        }
    }

    // API pública
    return {
        init: init,
        toggleTracker: toggleTracker
    };
})();

