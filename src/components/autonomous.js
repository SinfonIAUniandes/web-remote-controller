/**
 * autonomous.js
 * Componente que controla la vida autónoma del robot Pepper.
 * La vida autónoma hace que el robot se mueva y reaccione de forma natural cuando está inactivo.
 */
import RosManager from '../services/RosManager.js'; 
const AutonomousComponent = (function() {
    let containerId = null;
    let isEnabled = false;

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
                <strong>¿Qué es la Vida Autónoma?</strong><br>
                Cuando está activada, el robot se mueve de forma natural, parpadea, 
                y reacciona a estímulos del entorno para parecer más "vivo".
            </div>

            <div id="autonomous-status" style="text-align: center; margin: 20px 0;">
                <div style="font-size: 48px; margin-bottom: 10px;">
                    <span id="status-icon">⭕</span>
                </div>
                <p style="font-size: 18px; font-weight: bold;" id="status-text">
                    Estado: <span style="color: #e74c3c;">Desactivado</span>
                </p>
            </div>

            <div style="display: flex; gap: 10px;">
                <button 
                    class="btn-success" 
                    onclick="AutonomousComponent.toggleAutonomousLife(true)"
                    style="flex: 1; padding: 15px; font-size: 16px;"
                >
                    ✅ Activar Vida Autónoma
                </button>
                <button 
                    class="btn-danger" 
                    onclick="AutonomousComponent.toggleAutonomousLife(false)"
                    style="flex: 1; padding: 15px; font-size: 16px;"
                >
                    ❌ Desactivar Vida Autónoma
                </button>
            </div>

            <div style="margin-top: 15px; padding: 10px; background-color: #fff3cd; border-radius: 5px; border-left: 4px solid #ffc107;">
                <p style="font-size: 12px; margin: 0;">
                    <strong>⚠️ Nota:</strong> Cuando la vida autónoma está activada, 
                    el robot puede moverse de forma independiente. Desactívala antes de 
                    ejecutar comandos de movimiento manual.
                </p>
            </div>
        `;
    }

    /**
     * Activa o desactiva la vida autónoma
     */
    function toggleAutonomousLife(enable) {
        const service = RosManager.createService(
            '/pytoolkit/ALAutonomousLife/set_state_srv',
            'std_srvs/SetBool'
        );

        if (!service) {
            alert('Error: El servicio de vida autónoma no está disponible.');
            return;
        }

        const request = {
            data: enable
        };

        RosManager.callService(service, request,
            function(result) {
                console.log(`Vida autónoma ${enable ? 'activada' : 'desactivada'}:`, result);
                isEnabled = enable;
                updateStatus(enable);
                alert(`✅ Vida autónoma ${enable ? 'activada' : 'desactivada'} correctamente`);
            },
            function(error) {
                console.error('Error cambiando vida autónoma:', error);
                alert('❌ Error al cambiar el estado de vida autónoma');
            }
        );
    }

    /**
     * Actualiza el indicador visual de estado
     */
    function updateStatus(enabled) {
        const statusIcon = document.getElementById('status-icon');
        const statusText = document.getElementById('status-text');

        if (statusIcon) {
            statusIcon.textContent = enabled ? '✅' : '⭕';
        }

        if (statusText) {
            const color = enabled ? '#27ae60' : '#e74c3c';
            const text = enabled ? 'Activado' : 'Desactivado';
            statusText.innerHTML = `Estado: <span style="color: ${color};">${text}</span>`;
        }
    }

    // API pública
    return {
        init: init,
        toggleAutonomousLife: toggleAutonomousLife
    };
})();
