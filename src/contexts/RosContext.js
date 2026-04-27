import React, { createContext, useContext, useState, useEffect } from 'react';
import * as ROSLIB from 'roslib';

const RosContext = createContext();

export const RosProvider = ({ children }) => {
    const [ros, setRos] = useState(null);
    const [ipAddress, setIpAddress] = useState(window.location.hostname);
    const [rosUrl, setRosUrl] = useState(`ws://${window.location.hostname}:9090`);
    const [baseSpeed, setBaseSpeed] = useState(0.5);

    // Actualiza rosUrl cuando ipAddress cambie (ya sea al inicio o por el menú)
    useEffect(() => {
        setRosUrl(`ws://${ipAddress}:9090`);
    }, [ipAddress]);

    const connect = (url_param) => {
        const rosInstance = new ROSLIB.Ros({ url: url_param });

        rosInstance.on('connection', () => {
            console.log('Connected to websocket server.');
        });

        rosInstance.on('error', (error) => {
            console.log('Error connecting to websocket server: ', error);
        });

        rosInstance.on('close', () => {
            console.log('Connection to websocket server closed.');
        });

        setRos(rosInstance);
    };

    useEffect(() => {
        connect(rosUrl);
    }, [rosUrl]);

    return (
        <RosContext.Provider value={{ ros, ipAddress, setIpAddress, baseSpeed, setBaseSpeed }}>
            {children}
        </RosContext.Provider>
    );
};

export const useRos = () => {
    return useContext(RosContext);
};
