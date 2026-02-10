/**
 * rosManager.js
 * Funciones auxiliares para crear tópicos y servicios de ROS.
 * Simplifica la interacción con el sistema ROS.
 */
import RosConnection from './rosConnection.js';
import ROSLIB from 'roslib';
const RosManager = (function() {
    
    /**
     * Crea un tópico de ROS
     */
    function createTopic(topicName, messageType) {
        const ros = RosConnection.getRos();
        if (!ros) {
            console.error('ROS no está conectado');
            return null;
        }

        return new ROSLIB.Topic({
            ros: ros,
            name: topicName,
            messageType: messageType
        });
    }

    /**
     * Publica un mensaje en un tópico
     */
    function publishMessage(topic, messageData) {
        if (!topic) {
            console.error('El tópico no existe');
            return;
        }

        const rosMessage = new ROSLIB.Message(messageData);
        topic.publish(rosMessage);
        console.log('📤 Mensaje publicado en', topic.name, ':', messageData);
    }

    /**
     * Suscribe a un tópico
     */
    function subscribeToTopic(topic, callback) {
        if (!topic) {
            console.error('El tópico no existe');
            return;
        }

        topic.subscribe(function(message) {
            console.log(' Mensaje recibido en', topic.name, ':', message);
            callback(message);
        });
    }

    /**
     * Crea un servicio de ROS
     */
    function createService(serviceName, serviceType) {
        const ros = RosConnection.getRos();
        if (!ros) {
            console.error('ROS no está conectado');
            return null;
        }

        return new ROSLIB.Service({
            ros: ros,
            name: serviceName,
            serviceType: serviceType
        });
    }

    /**
     * Llama a un servicio de ROS
     */
    function callService(service, requestData, successCallback, errorCallback) {
        if (!service) {
            console.error('El servicio no existe');
            return;
        }

        const request = new ROSLIB.ServiceRequest(requestData);

        service.callService(request, 
            function(result) {
                console.log(' Servicio respondió:', result);
                if (successCallback) successCallback(result);
            },
            function(error) {
                console.error(' Error llamando al servicio:', error);
                if (errorCallback) errorCallback(error);
            }
        );
    }

    // API pública
    return {
        createTopic: createTopic,
        publishMessage: publishMessage,
        subscribeToTopic: subscribeToTopic,
        createService: createService,
        callService: callService
    };
})();