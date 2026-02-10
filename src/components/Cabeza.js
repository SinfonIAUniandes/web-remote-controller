/**
 * cabeza.js
 * Componente que controla el movimiento de la cabeza del robot usando el teclado.
 * Teclas: I (arriba), K (abajo), J (izquierda), L (derecha)
 */
import RosManager from '../services/RosManager.js'; 
const CabezaComponent = (function() {
    let containerId = null;
    let headTopic = null;
    let pitch = 0;
    let yaw = 0;
    const STEP = 0.05;
    const MAX = 1.57;
    const speed = 0.1;

    function init(elementId) {
        containerId = elementId;
        render();
        enableMotionTools();
        createHeadTopic();
        setupKeyboardControls();
    }

    function render() {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = `
            <div class="keyboard-guide">
                <p><strong>Control con teclado:</strong></p>
                <p><kbd>I</kbd> Arriba | <kbd>K</kbd> Abajo</p>
                <p><kbd>J</kbd> Izquierda | <kbd>L</kbd> Derecha</p>
                <p style="margin-top: 10px;">
                    <strong>Pitch:</strong> <span id="head-pitch">0.00</span> rad<br>
                    <strong>Yaw:</strong> <span id="head-yaw">0.00</span> rad
                </p>
            </div>
        `;
    }

    function enableMotionTools() {
        const motionService = RosManager.createService(
            '/robot_toolkit/motion_tools_srv',
            'robot_toolkit_msgs/motion_tools_srv'
        );
        if (!motionService) return;
        RosManager.callService(motionService, { data: { command: "enable_all" } });
    }

    function createHeadTopic() {
        headTopic = RosManager.createTopic('/set_angles', 'robot_toolkit_msgs/set_angles_msg');
    }

    function setupKeyboardControls() {
        document.addEventListener('keydown', handleKeyPress);
    }

    function handleKeyPress(e) {
        const bannedElements = ["input", "textarea"];
        if (bannedElements.includes(e.target.localName.toLowerCase())) return;

        let newPitch = pitch;
        let newYaw = yaw;

        switch(e.key.toLowerCase()) {
            case 'i': newPitch = clamp(pitch - STEP); break;
            case 'k': newPitch = clamp(pitch + STEP); break;
            case 'j': newYaw = clamp(yaw + STEP); break;
            case 'l': newYaw = clamp(yaw - STEP); break;
            default: return;
        }

        pitch = newPitch;
        yaw = newYaw;
        publishHead();
        updateDisplay();
    }

    function clamp(value) {
        return Math.max(-MAX, Math.min(MAX, value));
    }

    function publishHead() {
        if (!headTopic) return;
        const message = {
            names: ["HeadPitch", "HeadYaw"],
            angles: [pitch, yaw],
            fraction_max_speed: [speed, speed]
        };
        RosManager.publishMessage(headTopic, message);
    }

    function updateDisplay() {
        const pitchEl = document.getElementById('head-pitch');
        const yawEl = document.getElementById('head-yaw');
        if (pitchEl) pitchEl.textContent = pitch.toFixed(2);
        if (yawEl) yawEl.textContent = yaw.toFixed(2);
    }

    return { init: init };
})();