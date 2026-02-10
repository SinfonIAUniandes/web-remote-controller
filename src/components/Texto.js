/**
 * texto.js
 * Componente que permite hacer que el robot hable texto.
 * Utiliza el servicio de síntesis de voz del robot.
 */
import RosManager from '../services/RosManager.js';
const TextoComponent = (function() {
    let containerId = null;
    let speechTopic = null;

    /**
     * Inicializa el componente
     */
    function init(elementId) {
        containerId = elementId;
        render();
        enableAudioTools();
    }

    /**
     * Renderiza el HTML del componente
     */
    function render() {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = `
            <textarea 
                id="speech-text" 
                placeholder="Escribe aquí lo que quieres que el robot diga..."
                style="width: 100%; min-height: 100px; padding: 10px; border-radius: 5px; border: 1px solid #ccc; resize: vertical;"
            ></textarea>
            
            <select id="speech-language" style="width: 100%; padding: 10px; margin-top: 10px; border-radius: 5px; border: 1px solid #ccc;">
                <option value="Spanish">Español</option>
                <option value="English">Inglés</option>
            </select>
            
            <label style="display: block; margin-top: 10px;">
                <input type="checkbox" id="speech-animated" checked>
                Gestos animados
            </label>
            
            <button 
                class="btn-primary" 
                onclick="TextoComponent.speak()" 
                style="width: 100%; margin-top: 10px; padding: 12px;"
            >
                🗣️ Hacer Hablar al Robot
            </button>
        `;
    }

    /**
     * Habilita las herramientas de audio
     */
    function enableAudioTools() {
        const audioService = RosManager.createService(
            '/robot_toolkit/audio_tools_srv',
            'robot_toolkit_msgs/audio_tools_srv'
        );

        if (!audioService) return;

        const request = {
            data: { command: "enable_tts" }
        };

        RosManager.callService(audioService, request, function(result) {
            console.log('Herramientas de audio habilitadas:', result);
        });

        // Crear el tópico de speech
        speechTopic = RosManager.createTopic('/speech', 'robot_toolkit_msgs/speech_msg');
    }

    /**
     * Hace que el robot hable
     */
    function speak() {
        const textElement = document.getElementById('speech-text');
        const languageElement = document.getElementById('speech-language');
        const animatedElement = document.getElementById('speech-animated');

        if (!textElement || !languageElement || !animatedElement) {
            console.error('Elementos no encontrados');
            return;
        }

        const text = textElement.value.trim();
        const language = languageElement.value;
        const animated = animatedElement.checked;

        if (!text) {
            alert('Por favor, escribe un texto para que el robot hable.');
            return;
        }

        if (!speechTopic) {
            alert('Error: El tópico de voz no está disponible.');
            return;
        }

        const message = {
            language: language,
            text: text,
            animated: animated
        };

        RosManager.publishMessage(speechTopic, message);
        console.log('Mensaje de voz enviado:', message);
    }

    // API pública
    return {
        init: init,
        speak: speak
    };
})();
