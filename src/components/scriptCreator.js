/**
 * scriptsCreator.js
 * Componente que permite crear scripts personalizados de forma visual.
 * Los scripts combinan speech, animaciones y delays en secuencias ejecutables.
 */
import RosManager from '../services/RosManager.js'; 
const ScriptsCreatorComponent = (function() {
    let containerId = null;
    let isExecuting = false;
    let scriptName = "mi_script";
    let script = {
        speech: [],
        animation: [],
        delays: []
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
            <div class="alert alert-info">
                <strong> Creador de Scripts</strong><br>
                Crea secuencias personalizadas combinando voz, animaciones y pausas.
            </div>

            <!-- Gestión de archivos -->
            <div style="border: 2px solid #3498db; border-radius: 8px; padding: 15px; margin-bottom: 20px; background-color: #f8f9fa;">
                <h4 style="margin-top: 0;"> Gestión de Scripts</h4>
                
                <div style="display: flex; gap: 10px; margin-bottom: 10px; flex-wrap: wrap;">
                    <input 
                        type="text" 
                        id="script-name-input" 
                        value="${scriptName}"
                        placeholder="Nombre del script"
                        style="flex: 1; min-width: 200px; padding: 10px; border-radius: 5px; border: 1px solid #ccc;"
                    >
                    <button class="btn-success" onclick="ScriptsCreatorComponent.downloadScript()" style="padding: 10px 20px;">
                         Descargar
                    </button>
                    <label class="btn-primary" style="padding: 10px 20px; cursor: pointer; display: inline-block;">
                        Cargar
                        <input type="file" accept=".json" onchange="ScriptsCreatorComponent.uploadScript(event)" style="display: none;">
                    </label>
                </div>
            </div>

            <!-- Editor de acciones -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;">
                
                <!-- Speech -->
                <div style="border: 1px solid #ccc; padding: 15px; border-radius: 8px; background-color: #fff;">
                    <h4>🗣️ Voz (${script.speech.length})</h4>
                    <div id="speech-list" style="max-height: 200px; overflow-y: auto; margin-bottom: 10px;"></div>
                    <button class="btn-primary" onclick="ScriptsCreatorComponent.addSpeech()" style="width: 100%;">
                         Añadir Voz
                    </button>
                </div>

                <!-- Animaciones -->
                <div style="border: 1px solid #ccc; padding: 15px; border-radius: 8px; background-color: #fff;">
                    <h4> Animaciones (${script.animation.length})</h4>
                    <div id="animation-list" style="max-height: 200px; overflow-y: auto; margin-bottom: 10px;"></div>
                    <button class="btn-success" onclick="ScriptsCreatorComponent.addAnimation()" style="width: 100%;">
                         Añadir Animación
                    </button>
                </div>
            </div>

            <!-- Botón de ejecución -->
            <div style="border: 2px solid #27ae60; border-radius: 8px; padding: 20px; text-align: center; background-color: #f8fff9;">
                <button 
                    class="btn-success" 
                    onclick="ScriptsCreatorComponent.executeScript()"
                    disabled="${isExecuting}"
                    style="width: 100%; padding: 20px; font-size: 18px; font-weight: bold;"
                >
                    ${isExecuting ? ' Ejecutando...' : '▶ Ejecutar Script Completo'}
                </button>
                <p style="margin: 10px 0 0 0; font-size: 12px; color: #666;">
                    Total de acciones: ${script.speech.length + script.animation.length}
                </p>
            </div>
        `;

        updateLists();
    }

    /**
     * Añade una acción de voz
     */
    function addSpeech() {
        const text = prompt('Escribe lo que el robot debe decir:');
        if (!text || !text.trim()) return;

        script.speech.push({
            tipo: "text",
            info: text.trim(),
            order: script.speech.length + script.animation.length
        });

        render();
    }

    /**
     * Añade una animación
     */
    function addAnimation() {
        const animation = prompt('Escribe el nombre de la animación (ej: Gestures/Hey_1):');
        if (!animation || !animation.trim()) return;

        script.animation.push({
            tipo: "movimiento",
            info: animation.trim(),
            order: script.speech.length + script.animation.length
        });

        render();
    }

    /**
     * Actualiza las listas de acciones
     */
    function updateLists() {
        // Lista de speech
        const speechList = document.getElementById('speech-list');
        if (speechList) {
            speechList.innerHTML = script.speech.length === 0 
                ? '<p style="color: #999; font-size: 12px;">No hay acciones de voz</p>'
                : script.speech.map((item, index) => `
                    <div style="padding: 8px; margin-bottom: 5px; background-color: #f0f0f0; border-radius: 4px; display: flex; justify-content: space-between; align-items: center;">
                        <span style="font-size: 12px; flex: 1; overflow: hidden; text-overflow: ellipsis;">${item.info}</span>
                        <button onclick="ScriptsCreatorComponent.removeSpeech(${index})" style="background: #e74c3c; color: white; border: none; padding: 4px 8px; border-radius: 3px; cursor: pointer; font-size: 11px;">❌</button>
                    </div>
                `).join('');
        }

        // Lista de animaciones
        const animationList = document.getElementById('animation-list');
        if (animationList) {
            animationList.innerHTML = script.animation.length === 0
                ? '<p style="color: #999; font-size: 12px;">No hay animaciones</p>'
                : script.animation.map((item, index) => `
                    <div style="padding: 8px; margin-bottom: 5px; background-color: #f0f0f0; border-radius: 4px; display: flex; justify-content: space-between; align-items: center;">
                        <span style="font-size: 12px; flex: 1; overflow: hidden; text-overflow: ellipsis;">${item.info}</span>
                        <button onclick="ScriptsCreatorComponent.removeAnimation(${index})" style="background: #e74c3c; color: white; border: none; padding: 4px 8px; border-radius: 3px; cursor: pointer; font-size: 11px;">❌</button>
                    </div>
                `).join('');
        }
    }

    /**
     * Elimina una acción de voz
     */
    function removeSpeech(index) {
        script.speech.splice(index, 1);
        render();
    }

    /**
     * Elimina una animación
     */
    function removeAnimation(index) {
        script.animation.splice(index, 1);
        render();
    }

    /**
     * Descarga el script como JSON
     */
    function downloadScript() {
        const nameInput = document.getElementById('script-name-input');
        if (nameInput) {
            scriptName = nameInput.value || 'mi_script';
        }

        const dataStr = JSON.stringify(script, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `${scriptName}.json`;
        link.click();
        
        URL.revokeObjectURL(url);
        alert(' Script descargado');
    }

    /**
     * Carga un script desde archivo
     */
    function uploadScript(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const loadedScript = JSON.parse(e.target.result);
                script = loadedScript;
                scriptName = file.name.replace('.json', '');
                
                const nameInput = document.getElementById('script-name-input');
                if (nameInput) {
                    nameInput.value = scriptName;
                }
                
                render();
                alert(' Script cargado correctamente');
            } catch (error) {
                console.error('Error cargando script:', error);
                alert(' Error: El archivo no es un script válido');
            }
        };
        reader.readAsText(file);
    }

    /**
     * Ejecuta el script completo
     */
    async function executeScript() {
        if (isExecuting) return;
        if (script.speech.length === 0 && script.animation.length === 0) {
            alert('El script está vacío. Añade acciones primero.');
            return;
        }

        isExecuting = true;
        render();

        const speechTopic = RosManager.createTopic('/speech', 'robot_toolkit_msgs/speech_msg');
        const animationTopic = RosManager.createTopic('/animations', 'robot_toolkit_msgs/animation_msg');

        // Combinar todas las acciones
        const allActions = [
            ...script.speech.map(a => ({ ...a, category: 'speech' })),
            ...script.animation.map(a => ({ ...a, category: 'animation' }))
        ];

        // Ejecutar secuencialmente
        for (let action of allActions) {
            if (action.category === 'speech' && action.tipo === 'text') {
                RosManager.publishMessage(speechTopic, {
                    language: 'Spanish',
                    text: action.info,
                    animated: true
                });
                await new Promise(resolve => setTimeout(resolve, Math.max(2000, action.info.length * 100)));
            } else if (action.category === 'animation' && action.tipo === 'movimiento') {
                RosManager.publishMessage(animationTopic, {
                    family: "animations",
                    animation_name: action.info
                });
                await new Promise(resolve => setTimeout(resolve, 3000));
            }
            await new Promise(resolve => setTimeout(resolve, 300));
        }

        isExecuting = false;
        render();
        alert('✅ Script ejecutado completamente');
    }

    // API pública
    return {
        init: init,
        addSpeech: addSpeech,
        addAnimation: addAnimation,
        removeSpeech: removeSpeech,
        removeAnimation: removeAnimation,
        downloadScript: downloadScript,
        uploadScript: uploadScript,
        executeScript: executeScript
    };
})();
