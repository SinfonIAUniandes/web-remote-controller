import { useState, useEffect } from 'react';
import { useRos } from '../contexts/RosContext';
import * as ROSLIB from 'roslib';

// Nivel de batería actual del robot (0-100), o null si no se conoce:
// sin conexión con el robot, o conectado pero sin respuesta todavía del servicio.
export const useBatteryLevel = (): number | null => {
    const { ros, isConnected } = useRos();
    const [level, setLevel] = useState<number | null>(null);

    useEffect(() => {
        // Sin conexión no hay lectura válida: se descarta el valor anterior en vez de mostrarlo como si fuera actual
        if (!ros || !isConnected) {
            setLevel(null);
            return;
        }

        // Evita aplicar la respuesta de una conexión anterior si ya cambió el estado
        let active = true;

        const batteryService = new ROSLIB.Service({
            ros: ros,
            name: '/pytoolkit/ALBatteryService/get_porcentage',
            serviceType: 'robot_toolkit_msgs/BatteryPercentageService'
        });

        batteryService.callService({}, (result) => {
            if (!active) return;
            console.log('Respuesta del servicio de bateria:', result);
            const batteryResult = result as { porcentage: number | string };
            const percentage = Number(batteryResult.porcentage);
            setLevel(Number.isFinite(percentage) ? percentage : null);
        }, (error: unknown) => {
            console.warn('No se pudo leer la batería:', error);
        });

        return () => { active = false; };
    }, [ros, isConnected]);

    return isConnected ? level : null;
};
