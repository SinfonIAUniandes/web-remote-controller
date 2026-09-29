import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import * as ROSLIB from 'roslib';

type RosContextValue = {
    ros: ROSLIB.Ros | null;
    ipAddress: string;
    setIpAddress: React.Dispatch<React.SetStateAction<string>>;
    baseSpeed: number;
    setBaseSpeed: React.Dispatch<React.SetStateAction<number>>;
    isConnected: boolean;
};

const RosContext = createContext<RosContextValue | null>(null);

export const RosProvider = ({ children }: { children: ReactNode }) => {
    const [ros, setRos] = useState<ROSLIB.Ros | null>(null);
    const [ipAddress, setIpAddress] = useState(window.location.hostname);
    const [rosUrl, setRosUrl] = useState(`ws://${window.location.hostname}:9090`);
    const [baseSpeed, setBaseSpeed] = useState(0.5);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        setRosUrl(`ws://${ipAddress}:9090`);
    }, [ipAddress]);

    const connect = (url_param: string) => {
        const rosInstance = new ROSLIB.Ros({});

        rosInstance.on('connection', () => {
            console.log('Connected to websocket server.');
            setIsConnected(true);
        });

        rosInstance.on('error', (error) => {
            // Silently log error without throwing
            console.warn('ROS Connection failed (running in offline mode):', error);
            setIsConnected(false);
        });

        rosInstance.on('close', () => {
            console.log('Connection to websocket server closed.');
            setIsConnected(false);
        });

        // Wrap connection attempt in try-catch to prevent native unhandled rejection
        try {
            rosInstance.connect(url_param);
        } catch (e) {
            console.warn('Failed to initiate ROS connection:', e);
        }

        setRos(rosInstance);
    };

    useEffect(() => {
        connect(rosUrl);
    }, [rosUrl]);

    return (
        <RosContext.Provider value={{ ros, ipAddress, setIpAddress, baseSpeed, setBaseSpeed, isConnected }}>
            {children}
        </RosContext.Provider>
    );
};

export const useRos = () => {
    const context = useContext(RosContext);
    // Safe fallback so destructuring never crashes if a component renders before provider attaches
    if (!context) {
        return {
            ros: null,
            ipAddress: 'localhost',
            setIpAddress: () => {},
            baseSpeed: 0.5,
            setBaseSpeed: () => {},
            isConnected: false,
        };
    }
    return context;
};