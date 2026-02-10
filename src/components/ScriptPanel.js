/**
 * scriptPanel.js
 * Componente que permite cargar y ejecutar scripts desde archivos.
 * Lee archivos de script en formato específico y los ejecuta paso a paso.
 */
import RosManager from '../services/RosManager.js'; 
const ScriptPanelComponent = (function() {
    let containerId = null;
    let loadedScript = null;
    let currentActionIndex = 0;
    let isExecuting = false;

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
                <strong> Panel de Scripts</strong><br>
                Carga archivos de script (.json) y ejecútalos paso a paso o completamente.
            </div>

            <!-- Carga de archivo -->
            <div style="border: 2px dashed #3498db; border-radius: 8px; padding: 20px; margin-bottom: 20px; text-align: center; background-color: #f8f9fa;">
                <label class="btn-primary" style="padding: 15px 30px; font-size: 16px; cursor: pointer; display: inline-block;">
                     Cargar Script (.json)
                    <input type="file" accept=".json,.txt" onchange="ScriptPanelComponent.handleFileUpload(event)" style="display: none;">
                </label>
                <p style="margin: 10px 0 0 0; font-size: 12px; color: #666;">
                    Formatos soportados: .json
                </p>
            </div>

            <!-- Información del script cargado -->
            <div id="script-info" style="margin-bottom: 20px;">
                ${loadedScript ? renderScriptInfo() : '<p style="color: #999; text-align: center;">No hay script cargado</p>'}
            </div>

            <!-- Controles de ejecución -->
            ${loadedScript ? renderControls() : ''}

            <!-- Lista de acciones -->
            ${loadedScript ? renderActionsList() : ''}
        `;
    }

    /**
     * Renderiza la información del script cargado
     */
    function renderScriptInfo() {
        const totalActions = (loadedScript.speech?.length || 0) + (loadedScript.animation?.length || 0);
        return `
            <div style="border: 1px solid #27ae60; border-radius: 8px; padding: 15px; background-color: #d4edda;">
                <h4 style="margin: 0 0 10px 0; color: #155724;">✅ Script Cargado</h4>
                <p style="margin: 5px 0;"><strong>Total de acciones:</strong> ${totalActions}</p>
                <p style="margin: 5px 0;"><strong>Acciones de voz:</strong> ${loadedScript.speech?.length || 0}</p>
                <p style="margin: 5px 0;"><strong>Animaciones:</strong> ${loadedScript.animation?.length || 0}</p>
                <p style="margin: 5px 0;"><strong>Acción actual:</strong> ${currentActionIndex + 1} / ${totalActions}</p>
            </div>
        `;
    }

    /**
     * Renderiza los controles de ejecución
     */
    function renderControls() {
        return `
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin-bottom: 20px;">
                <button 
                    class="btn-warning" 
                    onclick="ScriptPanelComponent.previousAction()"
                    ${currentActionIndex === 0 ? 'disabled' : ''}
                    style="padding: 15px;"
                >
                    ⏮ Anterior
                </button>
                
                <button 
                    class="btn-success" 
                    onclick="ScriptPanelComponent.executeCurrentAction()"
                    ${isExecuting ? 'disabled' : ''}
                    style="padding: 15px; font-weight: bold;"
                >
                    ${isExecuting ? '⏳ Ejecutando...' : '▶Ejecutar Actual'}
                </button>
                
                <button 
                    class="btn-warning" 
                    onclick="ScriptPanelComponent.nextAction()"
                    ${currentActionIndex >= getTotalActions() - 1 ? 'disabled' : ''}
                    style="padding: 15px;"
                >
                    ⏭ Siguiente
                </button>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px;">
                <button 
                    class="btn-primary" 
                    onclick="ScriptPanelComponent.executeAllActions()"
                    ${isExecuting ? 'disabled' : ''}
                    style="padding: 15px; font-weight: bold;"
                >
                    ▶ Ejecutar Todo
                </button>
                
                <button 
                    class="btn-danger" 
                    onclick="ScriptPanelComponent.resetScript()"
                    style="padding: 15px;"
                >
                    🔄 Reiniciar
                </button>
            </div>
        `;
    }

    /**
     * Renderiza la lista de acciones
     */
    function renderActionsList() {
        const allActions = getAllActions();
        
        return `
            <div style="border: 1px solid #ccc; border-radius: 8px; padding: 15px; background-color: #fff;">
                <h4> Secuencia de Acciones</h4>
                <div style="max-height: 300px; overflow-y: auto;">
                    ${allActions.map((action, index) => `
                        <div style="
                            padding: 10px;
                            margin-bottom: 8px;
                            background-color: ${index === currentActionIndex ? '#3498db' : '#f0f0f0'};
                            color: ${index === currentActionIndex ? 'white' : 'black'};
                            border-radius: 5px;
                            border-left: 4px solid ${action.category === 'speech' ? '#27ae60' : '#e67e22'};
                        ">
                            <strong>${index + 1}.</strong>
                            ${action.category === 'speech' ? ' Voz' : ' Animación'}:
                            <em>${action.info}</em>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    /**
     * Maneja la carga de archivo
     */
    function handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const content = e.target.result;
                loadedScript = JSON.parse(content);
                currentActionIndex = 0;
                render();
                alert(' Script cargado correctamente');
            } catch (error) {
                console.error('Error cargando script:', error);
                alert(' Error: El archivo no es válido');
            }
        };
        reader.readAsText(file);
    }

    /**
     * Obtiene todas las acciones combinadas
     */
    function getAllActions() {
        if (!loadedScript) return [];
        
        return [
            ...(loadedScript.speech || []).map(a => ({ ...a, category: 'speech' })),
            ...(loadedScript.animation || []).map(a => ({ ...a, category: 'animation' }))
        ];
    }

    /**
     * Obtiene el total de acciones
     */
    function getTotalActions() {
        return getAllActions().length;
    }

    /**
     * Va a la acción anterior
     */
    function previousAction() {
        if (currentActionIndex > 0) {
            currentActionIndex--;
            render();
        }
    }

    /**
     * Va a la siguiente acción
     */
    function nextAction() {
        if (currentActionIndex < getTotalActions() - 1) {
            currentActionIndex++;
            render();
        }
    }

    /**
     * Ejecuta la acción actual
     */
    async function executeCurrentAction() {
        if (!loadedScript || isExecuting) return;

        const allActions = getAllActions();
        const action = allActions[currentActionIndex];
        
        if (!action) return;

        isExecuting = true;
        render();

        await executeAction(action);

        isExecuting = false;
        
        // Avanzar a la siguiente acción automáticamente
        if (currentActionIndex < getTotalActions() - 1) {
            currentActionIndex++;
        }
        
        render();
    }

    /**
     * Ejecuta todas las acciones secuencialmente
     */
    async function executeAllActions() {
        if (!loadedScript || isExecuting) return;

        isExecuting = true;
        currentActionIndex = 0;
        render();

        const allActions = getAllActions();

        for (let i = 0; i < allActions.length; i++) {
            currentActionIndex = i;
            render();
            
            await executeAction(allActions[i]);
            await new Promise(resolve => setTimeout(resolve, 300));
        }

        isExecuting = false;
        render();
        alert(' Script ejecutado completamente');
    }

    /**
     * Ejecuta una acción individual
     */
    async function executeAction(action) {
        if (action.category === 'speech' && action.tipo === 'text') {
            const speechTopic = RosManager.createTopic('/speech', 'robot_toolkit_msgs/speech_msg');
            RosManager.publishMessage(speechTopic, {
                language: 'Spanish',
                text: action.info,
                animated: true
            });
            await new Promise(resolve => setTimeout(resolve, Math.max(2000, action.info.length * 100)));
        } else if (action.category === 'animation' && action.tipo === 'movimiento') {
            const animationTopic = RosManager.createTopic('/animations', 'robot_toolkit_msgs/animation_msg');
            RosManager.publishMessage(animationTopic, {
                family: "animations",
                animation_name: action.info
            });
            await new Promise(resolve => setTimeout(resolve, 3000));
        }
    }

    /**
     * Reinicia el script
     */
    function resetScript() {
        currentActionIndex = 0;
        render();
        alert(' Script reiniciado');
    }

    // API pública
    return {
        init: init,
        handleFileUpload: handleFileUpload,
        previousAction: previousAction,
        nextAction: nextAction,
        executeCurrentAction: executeCurrentAction,
        executeAllActions: executeAllActions,
        resetScript: resetScript
    };
})();
