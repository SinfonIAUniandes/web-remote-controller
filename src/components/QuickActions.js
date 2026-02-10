/**
 * quickActions.js
 * Componente con scripts predefinidos que se ejecutan con un solo clic.
 */
import  RosManager from '../services/RosManager.js';    
const QuickActionsComponent = (function() {
    let containerId = null;
    let isExecuting = false;

    const quickScripts = {
        saludo: [
            { tipo: "text", info: "¡Hola! Soy Pepper, es un placer conocerte" },
            { tipo: "movimiento", info: "Gestures/Hey_1" }
        ],
        despedida: [
            { tipo: "text", info: "¡Ha sido un gusto! ¡Hasta la próxima!" },
            { tipo: "movimiento", info: "Gestures/Yes_1" }
        ],
        celebracion: [
            { tipo: "text", info: "¡Excelente trabajo equipo!" },
            { tipo: "movimiento", info: "Emotions/Positive/Happy_1" }
        ]
    };

    function init(elementId) {
        containerId = elementId;
        render();
    }

    function render() {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = `
            <div class="alert alert-info">
                Haz clic en un botón para ejecutar un script completo
            </div>
            <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                <button class="btn-primary" onclick="QuickActionsComponent.executeScript('saludo')">
                    Saludo
                </button>
                <button class="btn-warning" onclick="QuickActionsComponent.executeScript('despedida')">
                    Despedida
                </button>
                <button class="btn-success" onclick="QuickActionsComponent.executeScript('celebracion')">
                    Celebración
                </button>
            </div>
            <div id="execution-status"></div>
        `;
    }

    async function executeScript(scriptName) {
        if (isExecuting) return;
        
        const script = quickScripts[scriptName];
        if (!script) return;

        isExecuting = true;
        const statusEl = document.getElementById('execution-status');
        if (statusEl) {
            statusEl.innerHTML = '<div class="alert alert-info">Ejecutando script...</div>';
        }

        const speechTopic = RosManager.createTopic('/speech', 'robot_toolkit_msgs/speech_msg');
        const animationTopic = RosManager.createTopic('/animations', 'robot_toolkit_msgs/animation_msg');

        for (let action of script) {
            if (action.tipo === "text") {
                RosManager.publishMessage(speechTopic, {
                    language: 'Spanish',
                    text: action.info,
                    animated: true
                });
                await new Promise(resolve => setTimeout(resolve, Math.max(2000, action.info.length * 100)));
            } else if (action.tipo === "movimiento") {
                RosManager.publishMessage(animationTopic, {
                    family: "animations",
                    animation_name: action.info
                });
                await new Promise(resolve => setTimeout(resolve, 3000));
            }
        }

        if (statusEl) {
            statusEl.innerHTML = '<div class="alert alert-success">Script completado</div>';
            setTimeout(() => { statusEl.innerHTML = ''; }, 3000);
        }

        isExecuting = false;
    }

    return { init: init, executeScript: executeScript };
})();