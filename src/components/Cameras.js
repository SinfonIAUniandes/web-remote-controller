/**
 * cameras.js
 * Componente que muestra las cámaras frontal e inferior del robot Pepper.
 * Se suscribe a los tópicos de ROS para recibir las imágenes en tiempo real.
 */
import RosManager from '../services/RosManager.js';
const CamerasComponent = (function() {
    let containerId = null;
    let frontCameraTopic = null;
    let bottomCameraTopic = null;

    /**
     * Inicializa el componente
     */
    function init(elementId) {
        containerId = elementId;
        render();
        enableCameras();
        subscribeToCameras();
    }

    /**
     * Renderiza el HTML del componente
     */
    function render() {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = `
            <div>
                <h4>Cámara Frontal</h4>
                <img id="front-camera" src="" alt="Cámara Frontal" style="width: 100%; max-width: 400px; background-color: #ecf0f1;">
            </div>
            <div>
                <h4>Cámara Inferior</h4>
                <img id="bottom-camera" src="" alt="Cámara Inferior" style="width: 100%; max-width: 400px; background-color: #ecf0f1;">
            </div>
        `;
    }

    /**
     * Habilita las cámaras en el robot
     */
    function enableCameras() {
        const visionService = RosManager.createService(
            '/robot_toolkit/vision_tools_srv',
            'robot_toolkit_msgs/vision_tools_msg'
        );

        if (!visionService) return;

        // Habilitar cámara frontal
        const frontRequest = {
            data: {
                camera_name: "front_camera",
                command: "custom",
                resolution: 0,
                frame_rate: 30,
                color_space: 11
            }
        };

        RosManager.callService(visionService, frontRequest, function(result) {
            console.log('Cámara frontal habilitada:', result);
        });

        // Habilitar cámara inferior
        const bottomRequest = {
            data: {
                camera_name: "bottom_camera",
                command: "custom",
                resolution: 0,
                frame_rate: 30,
                color_space: 11
            }
        };

        RosManager.callService(visionService, bottomRequest, function(result) {
            console.log('Cámara inferior habilitada:', result);
        });
    }

    /**
     * Se suscribe a los tópicos de las cámaras
     */
    function subscribeToCameras() {
        // Tópico de cámara frontal
        frontCameraTopic = RosManager.createTopic(
            '/robot_toolkit_node/camera/front/image_raw/compressed',
            'sensor_msgs/CompressedImage'
        );

        RosManager.subscribeToTopic(frontCameraTopic, function(message) {
            const frontImg = document.getElementById('front-camera');
            if (frontImg) {
                frontImg.src = "data:image/jpeg;base64," + message.data;
            }
        });

        // Tópico de cámara inferior
        bottomCameraTopic = RosManager.createTopic(
            '/robot_toolkit_node/camera/bottom/image_raw/compressed',
            'sensor_msgs/CompressedImage'
        );

        RosManager.subscribeToTopic(bottomCameraTopic, function(message) {
            const bottomImg = document.getElementById('bottom-camera');
            if (bottomImg) {
                bottomImg.src = "data:image/jpeg;base64," + message.data;
            }
        });
    }

    /**
     * Limpia el componente
     */
    function destroy() {
        if (frontCameraTopic) frontCameraTopic.unsubscribe();
        if (bottomCameraTopic) bottomCameraTopic.unsubscribe();
    }

    // API pública
    return {
        init: init,
        destroy: destroy
    };
})();