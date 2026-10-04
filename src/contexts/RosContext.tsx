import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import * as ROSLIB from 'roslib';
import { getDefaultIp, isValidIpv4 } from '../utils/ip';

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
    // Los tres primeros octetos son los del dispositivo; el último ("xxx") lo ingresa el usuario
    const [ipAddress, setIpAddress] = useState(() => getDefaultIp(window.location.hostname));
    const [baseSpeed, setBaseSpeed] = useState(0.5);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        // No intentamos conectar hasta que el usuario ingrese una IP completa y válida
        if (!isValidIpv4(ipAddress)) {
            setRos(null);
            setIsConnected(false);
            return;
        }

        // Evita que eventos tardíos de una conexión anterior pisen el estado de la actual
        let active = true;
        const rosInstance = new ROSLIB.Ros({});

        rosInstance.on('connection', () => {
            if (!active) return;
            console.log('Connected to websocket server.');
            setIsConnected(true);
        });

        rosInstance.on('error', (error) => {
            if (!active) return;
            // Silently log error without throwing
            console.warn('ROS Connection failed (running in offline mode):', error);
            setIsConnected(false);
        });

        rosInstance.on('close', () => {
            if (!active) return;
            console.log('Connection to websocket server closed.');
            setIsConnected(false);
        });

        // Wrap connection attempt in try-catch to prevent native unhandled rejection
        try {
            rosInstance.connect(`ws://${ipAddress.trim()}:9090`);
        } catch (e) {
            console.warn('Failed to initiate ROS connection:', e);
        }

        setRos(rosInstance);

        return () => {
            active = false;
            rosInstance.close();
        };
    }, [ipAddress]);

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