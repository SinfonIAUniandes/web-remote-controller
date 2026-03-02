import React, { createContext, useContext, useState, useEffect } from 'react';
import * as ROSLIB from 'roslib';

const RosContext = createContext();

export const RosProvider = ({ children }) => {
    const [ros, setRos] = useState(null);
    const [rosUrl, setRosUrl] = useState('ws://localhost:9090');
    // 👇 NUEVO: Creamos un estado para guardar solo la IP limpia
    const [ipAddress, setIpAddress] = useState('localhost');
    const [baseSpeed, setBaseSpeed] = useState(0.5);

    useEffect(() => {
        const userIp = prompt("Please enter the server IP address (default is localhost):", "localhost");
        if (userIp) {
            setRosUrl(`ws://${userIp}:9090`);
            setIpAddress(userIp);
        }
    }, []);    

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
        <RosContext.Provider value={{ ros, ipAddress, baseSpeed, setBaseSpeed }}>
            {children}
        </RosContext.Provider>
    );
};

export const useRos = () => {
    return useContext(RosContext);
};
