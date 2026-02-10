/**
 * volume.js
 * Componente que controla el volumen del robot Pepper.
 * Permite ajustar el nivel de volumen usando un slider.
 */
import RosManager from '../services/RosManager.js';
const VolumeComponent = (function() {
    let containerId = null;
    let currentVolume = 50;

    /**
     * Inicializa el componente en el contenedor especificado
     */
    function init(elementId) {
        containerId = elementId;
        render();
        setInitialVolume();
    }

    /**
     * Renderiza el HTML del componente
     */
    function render() {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = `
            <div style="padding: 15px; background-color: rgba(255,255,255,0.1); border-radius: 5px; margin-top: 20px;">
                <h4 style="margin-bottom: 10px; font-size: 14px;"> Volumen</h4>
                <input 
                    type="range" 
                    id="volume-slider" 
                    min="0" 
                    max="100" 
                    value="${currentVolume}"
                    style="width: 100%; margin-bottom: 5px;"
                    oninput="VolumeComponent.handleVolumeChange(this.value)"
                >
                <div style="display: flex; justify-content: space-between; font-size: 12px;">
                    <span>0</span>
                    <span id="volume-value">${currentVolume}</span>
                    <span>100</span>
                </div>
            </div>
        `;
    }

    /**
     * Establece el volumen inicial
     */
    function setInitialVolume() {
        setVolume(50);
    }

    /**
     * Maneja el cambio de volumen
     */
    function handleVolumeChange(value) {
        currentVolume = parseInt(value);
        setVolume(currentVolume);
        
        const volumeValueElement = document.getElementById('volume-value');
        if (volumeValueElement) {
            volumeValueElement.textContent = currentVolume;
        }
    }

    /**
     * Establece el volumen en el robot
     */
    function setVolume(volume) {
        const service = RosManager.createService(
            '/pytoolkit/ALAudioDevice/set_output_volume_srv',
            'robot_toolkit_msgs/set_output_volume_srv'
        );

        if (!service) return;

        RosManager.callService(service, { volume: volume }, function(result) {
            console.log('Volumen establecido en:', volume);
        });
    }

    // API pública
    return {
        init: init,
        handleVolumeChange: handleVolumeChange
    };
})();