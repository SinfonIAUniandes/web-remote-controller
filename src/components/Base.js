/**
 * base.js
 * Componente que controla el movimiento de la base del robot con el teclado.
 * Teclas: W (adelante), S (atrás), A (izquierda), D (derecha), Q (rotar izq), E (rotar der)
 */
import RosManager from '../services/RosManager.js'; 
const BaseComponent = (function() {
    let containerId = null;
    const SPEED = 0.5;

    function init(elementId) {
        containerId = elementId;
        render();
        enableNavigationTools();
        setupKeyboardControls();
    }

    function render() {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = `
            <div class="alert alert-info">
                <strong>Controles de movimiento:</strong><br>
                <kbd>W</kbd> Adelante | <kbd>S</kbd> Atrás | <kbd>A</kbd> Izquierda | <kbd>D</kbd> Derecha<br>
                <kbd>Q</kbd> Rotar Izquierda | <kbd>E</kbd> Rotar Derecha
            </div>
            <div class="keyboard-controls">
                <div></div>
                <div class="key-button">W ↑</div>
                <div></div>
                <div class="key-button">A ←</div>
                <div class="key-button">S ↓</div>
                <div class="key-button">D →</div>
                <div class="key-button">Q ↶</div>
                <div></div>
                <div class="key-button">E ↷</div>
            </div>
        `;
    }

    function enableNavigationTools() {
        const navService = RosManager.createService(
            '/robot_toolkit/navigation_tools_srv',
            'robot_toolkit_msgs/navigation_tools_srv'
        );
        if (!navService) return;
        RosManager.callService(navService, { data: { command: "enable_all" } });
    }

    function setupKeyboardControls() {
        document.addEventListener('keydown', handleKeyPress);
    }

    function handleKeyPress(e) {
        const bannedElements = ["input", "textarea"];
        if (bannedElements.includes(e.target.localName.toLowerCase())) return;

        const cmdVelTopic = RosManager.createTopic('/cmd_vel', 'geometry_msgs/Twist');
        if (!cmdVelTopic) return;

        let message = {
            linear: { x: 0, y: 0, z: 0 },
            angular: { x: 0, y: 0, z: 0 }
        };

        switch(e.key.toLowerCase()) {
            case 'w': message.linear.x = SPEED; break;
            case 's': message.linear.x = -SPEED; break;
            case 'a': message.linear.y = SPEED; break;
            case 'd': message.linear.y = -SPEED; break;
            case 'q': message.angular.z = SPEED; break;
            case 'e': message.angular.z = -SPEED; break;
            default: return;
        }

        RosManager.publishMessage(cmdVelTopic, message);
    }

    return { init: init };
})();