/**
 * audio.js
 * Componente que permite reproducir audio en el robot desde una URL.
 */
import RosManager from '../services/RosManager.js'; 
const AudioComponent = (function() {
    let containerId = null;

    function init(elementId) {
        containerId = elementId;
        render();
    }

    function render() {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = `
            <input 
                type="text" 
                id="audio-url" 
                placeholder="http://ejemplo.com/audio.mp3"
                style="width: 100%; padding: 10px; margin-bottom: 10px; border-radius: 5px; border: 1px solid #ccc;"
            >
            <div style="display: flex; gap: 10px;">
                <button class="btn-success" onclick="AudioComponent.playAudio()" style="flex: 1;">
                    ▶ Reproducir
                </button>
                <button class="btn-danger" onclick="AudioComponent.stopAudio()" style="flex: 1;">
                    ⏹ Detener
                </button>
            </div>
        `;
    }

    function playAudio() {
        const urlInput = document.getElementById('audio-url');
        if (!urlInput) return;

        const audioUrl = urlInput.value.trim();
        if (!audioUrl) {
            alert('Ingrese una URL de audio válida.');
            return;
        }

        const audioService = RosManager.createService(
            '/pytoolkit/ALAudioPlayer/play_audio_stream_srv',
            'robot_toolkit_msgs/set_stiffnesses_sev'
        );

        if (!audioService) return;

        RosManager.callService(audioService, { names: audioUrl, stiffnesses: 1.0 });
    }

    function stopAudio() {
        const stopService = RosManager.createService(
            '/pytoolkit/ALAudioPlayer/stop_audio_stream_srv',
            'std_srvs/Empty'
        );

        if (!stopService) return;

        RosManager.callService(stopService, {});
    }

    return { init: init, playAudio: playAudio, stopAudio: stopAudio };
})();