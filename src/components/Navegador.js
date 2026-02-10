/**
 * navegador.js
 * Componente que permite mostrar páginas web en la tablet del robot Pepper.
 * Utiliza el servicio de ROS para mostrar URLs en la pantalla del robot.
 */
import RosManager from '../services/RosManager.js'; 
const NavegadorComponent = (function() {
    let containerId = null;

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
            <label style="display: block; margin-bottom: 10px;">
                <strong>URL de la página web:</strong>
                <input 
                    type="text" 
                    id="web-url-input" 
                    placeholder="https://ejemplo.com"
                    value="https://www.google.com"
                    style="width: 100%; padding: 10px; margin-top: 5px; border-radius: 5px; border: 1px solid #ccc;"
                >
            </label>
            
            <button 
                class="btn-primary" 
                onclick="NavegadorComponent.showWebPage()" 
                style="width: 100%; padding: 12px;"
            >
                 Mostrar en Tablet
            </button>
            
            <div style="margin-top: 15px;">
                <p style="font-size: 12px; color: #666;">
                    <strong>Sugerencias:</strong><br>
                    • https://www.google.com<br>
                    • https://www.youtube.com<br>
                    • https://www.wikipedia.org
                </p>
            </div>
        `;
    }

    /**
     * Muestra una página web en la tablet del robot
     */
    function showWebPage() {
        const urlInput = document.getElementById('web-url-input');
        if (!urlInput) {
            console.error('Input de URL no encontrado');
            return;
        }

        const url = urlInput.value.trim();
        
        if (!url) {
            alert('Por favor, ingresa una URL válida.');
            return;
        }

        // Validar que tenga http:// o https://
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            alert('La URL debe comenzar con http:// o https://');
            return;
        }

        const service = RosManager.createService(
            '/pytoolkit/ALTabletService/show_web_view_srv',
            'robot_toolkit_msgs/tablet_service_srv'
        );

        if (!service) {
            alert('Error: El servicio de tablet no está disponible.');
            return;
        }

        const request = { url: url };

        RosManager.callService(service, request, 
            function(result) {
                console.log('Página web mostrada en tablet:', url);
                alert(' Página cargada en la tablet del robot');
            },
            function(error) {
                console.error('Error mostrando página web:', error);
                alert(' Error al cargar la página en la tablet');
            }
        );
    }

    // API pública
    return {
        init: init,
        showWebPage: showWebPage
    };
})();

