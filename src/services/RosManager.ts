import * as ROSLIB from 'roslib';

//Función para crear un tópico en ROS
const createTopic = (ros: ROSLIB.Ros, topicName: string, messageType: string) => {
    return new ROSLIB.Topic({
        ros: ros,
        name: topicName,
        messageType: messageType
    });
};

//Función para publicar un mensaje en un tópico específico
const publishMessage = (topic: ROSLIB.Topic, messageData: object): void => {
    topic.publish(messageData);
};

//Función para suscribirse a un tópico en ROS
const subscribeToTopic = (topic: ROSLIB.Topic, callback: (message: any) => void): void => {
    topic.subscribe((message: any) => {
        console.log('Received message on ' + topic.name + ': ', message);
        callback(message);
    });
};

//Función para crear un servicio en ROS
const createService = (ros: ROSLIB.Ros, serviceName: string, serviceType: string) => {
    return new ROSLIB.Service({
        ros: ros,
        name: serviceName,
        serviceType: serviceType
    });
};

//Función para llamar a un servicio de ROS y manejar la respuesta o error
const callService = (service: ROSLIB.Service, requestData: object, callback: (result: any) => void): void => {
    service.callService(requestData, (result) => {
        console.log('Service response:', result);
        callback(result);
    }, (error: any) => {
        console.log('Service call failed:', error);
    });
};

//Exportar todas las funciones para su uso en otros archivos :)
export { createTopic, publishMessage, subscribeToTopic, createService, callService };
