/**
 * rosConnection.js
 * Maneja la conexion WebSocket con el servidor ROS del robot Pepper.
 * Proporciona una instancia global de ROS que puede ser utilizada por todos los componentes.
 */
import ROSLIB from 'roslib';

const RosConnection = (function() {
    let ros = null;
    let isConnected = false;
    let rosUrl = 'ws://localhost:9090';

    /**
     * Conecta al servidor ROS
     */
    function connect(customUrl) {
        if (customUrl) {
            rosUrl = customUrl;
        } else {
            // Pedir IP al usuario si no se proporciona
            const userIp = prompt("Ingrese la direccion IP del servidor (default: localhost):", "localhost");
            if (userIp) {
                rosUrl = `ws://${userIp}:9090`;
            }
        }

        ros = new ROSLIB.Ros({
            url: rosUrl
        });

        ros.on('connection', function() {
            console.log('Conectado al servidor WebSocket ROS');
            isConnected = true;
            updateConnectionStatus(true);
        });

        ros.on('error', function(error) {
            console.error('Error conectando al servidor WebSocket:', error);
            isConnected = false;
            updateConnectionStatus(false);
        });

        ros.on('close', function() {
            console.log('Conexion con el servidor WebSocket cerrada');
            isConnected = false;
            updateConnectionStatus(false);
        });
    }

    /**
     * Actualiza el indicador visual de estado de conexion
     */
    function updateConnectionStatus(connected) {
        const statusElement = document.getElementById('connection-status');
        if (statusElement) {
            if (connected) {
                statusElement.innerHTML = '<span class="status-indicator status-connected"></span>Conectado';
                statusElement.style.color = '#27ae60';
            } else {
                statusElement.innerHTML = '<span class="status-indicator status-disconnected"></span>Desconectado';
                statusElement.style.color = '#e74c3c';
            }
        }
    }

    /**
     * Obtiene la instancia de ROS
     */
    function getRos() {
        return ros;
    }

    /**
     * Verifica si esta conectado
     */
    function getConnectionStatus() {
        return isConnected;
    }

    /**
     * Reconectar
     */
    function reconnect() {
        if (ros) {
            ros.close();
        }
        connect(rosUrl);
    }

    // API publica
    return {
        connect: connect,
        getRos: getRos,
        getConnectionStatus: getConnectionStatus,
        reconnect: reconnect
    };
})();

// Exportar para uso global
window.RosConnection = RosConnection;
export default RosConnection;