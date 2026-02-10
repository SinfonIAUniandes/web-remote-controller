/**
 * leds.js
 * Componente que controla los LEDs del robot Pepper.
 * Permite cambiar el color y la duración de los LEDs.
 */
import RosManager from '../services/RosManager.js'; 
const LedsComponent = (function() {
    let containerId = null;
    let ledsTopic = null;

    /**
     * Inicializa el componente
     */
    function init(elementId) {
        containerId = elementId;
        render();
        enableMiscTools();
        createLedsTopic();
    }

    /**
     * Renderiza el HTML del componente
     */
    function render() {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = `
            <label style="display: block; margin-bottom: 10px;">
                <strong>Nombre del LED:</strong>
                <select id="led-name" style="width: 100%; padding: 10px; margin-top: 5px; border-radius: 5px; border: 1px solid #ccc;">
                    <option value="FaceLeds">Cara completa</option>
                    <option value="ChestLeds">Pecho</option>
                    <option value="LeftEarLeds">Oreja izquierda</option>
                    <option value="RightEarLeds">Oreja derecha</option>
                    <option value="LeftFaceLeds">Cara izquierda</option>
                    <option value="RightFaceLeds">Cara derecha</option>
                    <option value="AllLeds">Todos los LEDs</option>
                </select>
            </label>
            
            <label style="display: block; margin-bottom: 10px;">
                <strong>Color:</strong>
                <input 
                    type="color" 
                    id="led-color" 
                    value="#ffffff"
                    style="width: 100%; height: 50px; border: none; cursor: pointer; margin-top: 5px; border-radius: 5px;"
                >
            </label>
            
            <label style="display: block; margin-bottom: 10px;">
                <strong>Duración (segundos):</strong>
                <input 
                    type="number" 
                    id="led-time" 
                    value="0" 
                    min="0"
                    style="width: 100%; padding: 10px; margin-top: 5px; border-radius: 5px; border: 1px solid #ccc;"
                >
                <small style="color: #666;">0 = cambio permanente</small>
            </label>
            
            <button 
                class="btn-primary" 
                onclick="LedsComponent.setLedColor()" 
                style="width: 100%; padding: 12px;"
            >
                💡 Actualizar LEDs
            </button>
        `;
    }

    /**
     * Habilita las herramientas misceláneas
     */
    function enableMiscTools() {
        const miscService = RosManager.createService(
            '/robot_toolkit/misc_tools_srv',
            'robot_toolkit_msgs/misc_tools_srv'
        );

        if (!miscService) return;

        const request = {
            data: { command: "enable_all" }
        };

        RosManager.callService(miscService, request, function(result) {
            console.log('Herramientas misceláneas habilitadas:', result);
        });
    }

    /**
     * Crea el tópico de LEDs
     */
    function createLedsTopic() {
        ledsTopic = RosManager.createTopic('/leds', 'robot_toolkit_msgs/leds_parameters_msg');
    }

    /**
     * Convierte color hexadecimal a RGB
     */
    function hexToRgb(hex) {
        const red = parseInt(hex.substring(1, 3), 16);
        const green = parseInt(hex.substring(3, 5), 16);
        const blue = parseInt(hex.substring(5, 7), 16);
        return { red, green, blue };
    }

    /**
     * Establece el color de los LEDs
     */
    function setLedColor() {
        const nameElement = document.getElementById('led-name');
        const colorElement = document.getElementById('led-color');
        const timeElement = document.getElementById('led-time');

        if (!nameElement || !colorElement || !timeElement) {
            console.error('Elementos no encontrados');
            return;
        }

        const ledName = nameElement.value;
        const color = colorElement.value;
        const time = parseInt(timeElement.value) || 0;

        const { red, green, blue } = hexToRgb(color);

        if (!ledsTopic) {
            alert('Error: El tópico de LEDs no está disponible.');
            return;
        }

        const message = {
            name: ledName,
            red: red,
            green: green,
            blue: blue,
            time: time
        };

        RosManager.publishMessage(ledsTopic, message);
        console.log('Color de LEDs actualizado:', message);
    }

    // API pública
    return {
        init: init,
        setLedColor: setLedColor
    };
})();