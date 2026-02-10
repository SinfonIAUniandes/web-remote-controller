/**
 * battery.js
 * Componente que muestra el nivel de batería del robot Pepper.
 * Llama al servicio ROS para obtener el porcentaje de batería.
 */
import RosManager from '../services/RosManager.js';
const BatteryComponent = (function() {
    let containerId = null;
    let batteryLevel = 0;
    let updateInterval = null;

    /**
     * Inicializa el componente en el contenedor especificado
     */
    function init(elementId) {
        containerId = elementId;
        render();
        fetchBatteryLevel();
        
        // Actualizar cada 30 segundos
        updateInterval = setInterval(fetchBatteryLevel, 30000);
    }

    /**
     * Renderiza el HTML del componente
     */
    function render() {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = `
            <div style="padding: 15px; background-color: rgba(255,255,255,0.1); border-radius: 5px; margin-top: 20px;">
                <h4 style="margin-bottom: 10px; font-size: 14px;">🔋 Batería</h4>
                <div style="background-color: rgba(0,0,0,0.2); border-radius: 10px; overflow: hidden; height: 20px; margin-bottom: 5px;">
                    <div id="battery-bar" style="height: 100%; background: linear-gradient(90deg, #27ae60, #2ecc71); width: ${batteryLevel}%; transition: width 0.5s;"></div>
                </div>
                <p id="battery-text" style="font-size: 12px; text-align: center;">${batteryLevel}%</p>
            </div>
        `;
    }

    /**
     * Obtiene el nivel de batería del robot
     */
    function fetchBatteryLevel() {
        const service = RosManager.createService(
            '/pytoolkit/ALBatteryService/get_porcentage',
            'robot_toolkit_msgs/BatteryPercentageService'
        );

        if (!service) return;

        RosManager.callService(service, {}, function(result) {
            batteryLevel = result.porcentage || 0;
            updateDisplay();
        });
    }

    /**
     * Actualiza la visualización de la batería
     */
    function updateDisplay() {
        const bar = document.getElementById('battery-bar');
        const text = document.getElementById('battery-text');
        
        if (bar) {
            bar.style.width = batteryLevel + '%';
            
            // Cambiar color según el nivel
            if (batteryLevel > 50) {
                bar.style.background = 'linear-gradient(90deg, #27ae60, #2ecc71)';
            } else if (batteryLevel > 20) {
                bar.style.background = 'linear-gradient(90deg, #f39c12, #f1c40f)';
            } else {
                bar.style.background = 'linear-gradient(90deg, #e74c3c, #c0392b)';
            }
        }
        
        if (text) {
            text.textContent = batteryLevel + '%';
        }
    }

    /**
     * Limpia el componente
     */
    function destroy() {
        if (updateInterval) {
            clearInterval(updateInterval);
        }
    }

    // API pública
    return {
        init: init,
        destroy: destroy
    };
})();
