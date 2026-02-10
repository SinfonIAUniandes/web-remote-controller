/**
 * posture.js
 * Componente que controla las posturas del robot Pepper.
 * Permite cambiar entre diferentes posturas predefinidas (stand, rest, crouch, sit).
 */
import RosManager from '../services/RosManager.js'; 
const PostureComponent = (function() {
    let containerId = null;
    let currentPosture = 'unknown';

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
                <strong>🧍 Control de Posturas</strong><br>
                Cambia la postura del robot entre diferentes posiciones predefinidas.
            </div>

            <div id="current-posture" style="text-align: center; margin: 20px 0; padding: 15px; background-color: #f0f0f0; border-radius: 8px;">
                <p style="font-size: 14px; margin: 0 0 5px 0; color: #666;">Postura actual:</p>
                <p style="font-size: 24px; font-weight: bold; margin: 0;" id="posture-name">
                    Desconocida
                </p>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 15px;">
                <button 
                    class="btn-success" 
                    onclick="PostureComponent.goToPosture('stand')"
                    style="padding: 20px; font-size: 16px; display: flex; flex-direction: column; align-items: center; gap: 10px;"
                >
                    <span style="font-size: 32px;"></span>
                    <span>Stand (De Pie)</span>
                </button>

                <button 
                    class="btn-primary" 
                    onclick="PostureComponent.goToPosture('rest')"
                    style="padding: 20px; font-size: 16px; display: flex; flex-direction: column; align-items: center; gap: 10px;"
                >
                    <span style="font-size: 32px;"></span>
                    <span>Rest (Reposo)</span>
                </button>

                <button 
                    class="btn-warning" 
                    onclick="PostureComponent.goToPosture('crouch')"
                    style="padding: 20px; font-size: 16px; display: flex; flex-direction: column; align-items: center; gap: 10px;"
                >
                    <span style="font-size: 32px;"></span>
                    <span>Crouch (Agachado)</span>
                </button>

                <button 
                    class="btn-danger" 
                    onclick="PostureComponent.goToPosture('sit')"
                    style="padding: 20px; font-size: 16px; display: flex; flex-direction: column; align-items: center; gap: 10px;"
                >
                    <span style="font-size: 32px;"></span>
                    <span>Sit (Sentado)</span>
                </button>
            </div>

            <div style="padding: 10px; background-color: #fff3cd; border-radius: 5px; border-left: 4px solid #ffc107;">
                <p style="font-size: 12px; margin: 0;">
                    <strong>💡 Descripción de posturas:</strong><br>
                    • <strong>Stand:</strong> Robot completamente de pie, listo para interactuar<br>
                    • <strong>Rest:</strong> Postura de reposo, motores relajados (ahorro de energía)<br>
                    • <strong>Crouch:</strong> Robot agachado, altura reducida<br>
                    • <strong>Sit:</strong> Robot sentado (requiere superficie para sentarse)
                </p>
            </div>
        `;
    }

    /**
     * Cambia a una postura específica
     */
    function goToPosture(postureName) {
        const service = RosManager.createService(
            '/pytoolkit/ALRobotPosture/go_to_posture_srv',
            'robot_toolkit_msgs/go_to_posture_srv'
        );

        if (!service) {
            alert('Error: El servicio de posturas no está disponible.');
            return;
        }

        // Mapeo de nombres amigables a nombres del sistema
        const postureMap = {
            'stand': 'Stand',
            'rest': 'Crouch',  // Rest suele ser Crouch en algunos sistemas
            'crouch': 'Crouch',
            'sit': 'Sit'
        };

        const systemPostureName = postureMap[postureName] || postureName;
        const request = { args: systemPostureName };

        // Mostrar indicador de carga
        updatePostureName(`Cambiando a ${postureName}...`);

        RosManager.callService(service, request,
            function(result) {
                console.log(`Postura cambiada a ${postureName}:`, result);
                currentPosture = postureName;
                updatePostureName(postureName);
                alert(` Robot en postura: ${postureName}`);
            },
            function(error) {
                console.error('Error cambiando postura:', error);
                updatePostureName('Error');
                alert(` Error al cambiar a postura ${postureName}`);
            }
        );
    }

    /**
     * Actualiza el nombre de la postura actual en la UI
     */
    function updatePostureName(posture) {
        const postureNameElement = document.getElementById('posture-name');
        if (!postureNameElement) return;

        const postureNames = {
            'stand': '🧍 Stand (De Pie)',
            'rest': '😌 Rest (Reposo)',
            'crouch': '🙇 Crouch (Agachado)',
            'sit': '🪑 Sit (Sentado)',
            'unknown': '❓ Desconocida'
        };

        postureNameElement.textContent = postureNames[posture.toLowerCase()] || posture;
    }

    // API pública
    return {
        init: init,
        goToPosture: goToPosture
    };
})();
