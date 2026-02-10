/**
 * breathing.js
 * Componente que controla la respiración del robot Pepper.
 * La respiración es un movimiento sutil que hace que el robot parezca más natural.
 */
import RosManager from '../services/RosManager.js'; 
const BreathingComponent = (function() {
    let containerId = null;
    let currentState = {
        body: false,
        arms: false,
        lArm: false,
        rArm: false,
        head: false
    };

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
            <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 10px;">
                    <strong>Seleccionar parte del cuerpo:</strong>
                    <select 
                        id="breathing-part-select"
                        style="width: 100%; padding: 10px; margin-top: 5px; border-radius: 5px; border: 1px solid #ccc;"
                    >
                        <option value="Body">Cuerpo Completo</option>
                        <option value="Arms">Ambos Brazos</option>
                        <option value="LArm">Brazo Izquierdo</option>
                        <option value="RArm">Brazo Derecho</option>
                        <option value="Head">Cabeza</option>
                    </select>
                </label>
            </div>

            <div style="display: flex; gap: 10px;">
                <button 
                    class="btn-success" 
                    onclick="BreathingComponent.toggleBreathing(true)"
                    style="flex: 1; padding: 12px;"
                >
                     Activar
                </button>
                <button 
                    class="btn-danger" 
                    onclick="BreathingComponent.toggleBreathing(false)"
                    style="flex: 1; padding: 12px;"
                >
                    Desactivar
                </button>
            </div>

            <div id="breathing-status" style="margin-top: 15px; padding: 10px; background-color: #f0f0f0; border-radius: 5px;">
                <strong>Estado actual:</strong>
                <ul style="margin: 10px 0 0 20px; font-size: 14px;">
                    <li id="status-body">Cuerpo: <span style="color: #e74c3c;">Desactivado</span></li>
                    <li id="status-arms">Brazos: <span style="color: #e74c3c;">Desactivado</span></li>
                    <li id="status-larm">Brazo Izq: <span style="color: #e74c3c;">Desactivado</span></li>
                    <li id="status-rarm">Brazo Der: <span style="color: #e74c3c;">Desactivado</span></li>
                    <li id="status-head">Cabeza: <span style="color: #e74c3c;">Desactivado</span></li>
                </ul>
            </div>
        `;
    }

    /**
     * Activa o desactiva la respiración
     */
    function toggleBreathing(enable) {
        const partSelect = document.getElementById('breathing-part-select');
        if (!partSelect) return;

        const selectedPart = partSelect.value;

        const service = RosManager.createService(
            '/pytoolkit/ALMotion/toggle_breathing_srv',
            'robot_toolkit_msgs/set_open_close_hand_srv'
        );

        if (!service) {
            alert('Error: El servicio de respiración no está disponible.');
            return;
        }

        const request = {
            hand: selectedPart,
            state: enable ? "True" : "False"
        };

        RosManager.callService(service, request,
            function(result) {
                console.log(`Respiración de ${selectedPart} ${enable ? 'activada' : 'desactivada'}:`, result);
                updateStatus(selectedPart, enable);
                alert(`Respiración ${enable ? 'activada' : 'desactivada'} en ${selectedPart}`);
            },
            function(error) {
                console.error('Error cambiando respiración:', error);
                alert(' Error al cambiar el estado de respiración');
            }
        );
    }

    /**
     * Actualiza el indicador visual de estado
     */
    function updateStatus(part, enabled) {
        // Actualizar estado interno
        const partKey = part.toLowerCase().replace('body', 'body').replace('arms', 'arms')
                           .replace('larm', 'lArm').replace('rarm', 'rArm').replace('head', 'head');
        currentState[partKey] = enabled;

        // Actualizar UI
        const statusMap = {
            'Body': 'status-body',
            'Arms': 'status-arms',
            'LArm': 'status-larm',
            'RArm': 'status-rarm',
            'Head': 'status-head'
        };

        const statusElementId = statusMap[part];
        const statusElement = document.getElementById(statusElementId);
        
        if (statusElement) {
            const statusText = enabled 
                ? '<span style="color: #27ae60;">Activado</span>' 
                : '<span style="color: #e74c3c;">Desactivado</span>';
            
            statusElement.innerHTML = statusElement.innerHTML.split(':')[0] + ': ' + statusText;
        }
    }

    // API pública
    return {
        init: init,
        toggleBreathing: toggleBreathing
    };
})();
