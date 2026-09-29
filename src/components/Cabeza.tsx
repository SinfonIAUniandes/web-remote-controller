import { useEffect, useState } from 'react';
import { useRos } from '../contexts/RosContext';
import { createTopic, createService } from '../services/RosManager';

const HeadMovementControl = () => {
    const { ros } = useRos();
    const [pitch, setPitch] = useState(0);  // HeadPitch
    const [yaw, setYaw] = useState(0);      // HeadYaw
    const speed = 0.1;
    const STEP = 0.05;
    const MAX = 1.57;  // 90 grados en radianes

    const headTopic = ros
        ? createTopic(ros, '/set_angles', 'robot_toolkit_msgs/set_angles_msg')
        : null;

    useEffect(() => {
        if (ros) {
            const motionService = createService(
                ros,
                '/robot_toolkit/motion_tools_srv',
                'robot_toolkit_msgs/motion_tools_srv'
            );

            const request = { data: { command: "enable_all" } };

            motionService.callService(request,
                (result) => console.log('Motion tools service ready:', result),
                (error) => console.error('Error al activar motion tools:', error)
            );
        }
    }, [ros]);

    const publishHead = (newPitch: number, newYaw: number) => {
        if (!headTopic) return;

        const message = {
            names: ["HeadPitch", "HeadYaw"],
            angles: [newPitch, newYaw],
            fraction_max_speed: [speed, speed]
        };

        headTopic.publish(message);
        console.log("Moviendo cabeza a:", message);
    };

    const clamp = (value: number): number => Math.max(-MAX, Math.min(MAX, value));

    const handleKey = (e: KeyboardEvent) => {
        let newPitch = pitch;
        let newYaw = yaw;

        switch (e.key.toLowerCase()) {
            case 'i': // arriba
                newPitch = clamp(pitch - STEP);
                break;
            case 'k': // abajo
                newPitch = clamp(pitch + STEP);
                break;
            case 'j': // izquierda
                newYaw = clamp(yaw + STEP);
                break;
            case 'l': // derecha
                newYaw = clamp(yaw - STEP);
                break;
            default:
                return;
        }

        setPitch(newPitch);
        setYaw(newYaw);
        publishHead(newPitch, newYaw);
    };

    useEffect(() => {
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [pitch, yaw]);

    return (
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <h2>🎮 Mover Cabeza con Teclado</h2>
            <p><strong>I</strong> = arriba | <strong>K</strong> = abajo | <strong>J</strong> = izquierda | <strong>L</strong> = derecha</p>
            <p>Pitch: {pitch.toFixed(2)} rad | Yaw: {yaw.toFixed(2)} rad</p>
        </div>
    );
};

export default HeadMovementControl;