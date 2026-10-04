import { useCallback, useEffect, useRef, useState } from 'react';
import { useRos } from '../contexts/RosContext';
import { createService, createTopic } from '../services/RosManager';
import { stopSpeech } from '../services/scriptExecutor';
import { triggerPanic } from '../services/panic';
import { COLORS, TYPOGRAPHY } from '../theme';

const STOP_REPEATS = 5;
const STOP_INTERVAL_MS = 50;
const FEEDBACK_MS = 2000;

const PanicButton = () => {
    const { ros, isConnected } = useRos();
    const [triggered, setTriggered] = useState(false);
    const timersRef = useRef<{ stop?: ReturnType<typeof setInterval>; feedback?: ReturnType<typeof setTimeout> }>({});

    const handlePanic = useCallback(() => {
        if (!ros || !isConnected) return;

        // 1. Cancela scripts en ejecución y bloquea teclas de movimiento que sigan presionadas
        triggerPanic();

        // 2. Detiene la base: un solo mensaje puede perderse, así que se repite unas cuantas veces
        const cmdVel = createTopic(ros, '/cmd_vel', 'geometry_msgs/Twist');
        const zero = { linear: { x: 0, y: 0, z: 0 }, angular: { x: 0, y: 0, z: 0 } };
        cmdVel.publish(zero);
        let sent = 1;
        clearInterval(timersRef.current.stop);
        timersRef.current.stop = setInterval(() => {
            cmdVel.publish(zero);
            if (++sent >= STOP_REPEATS) clearInterval(timersRef.current.stop);
        }, STOP_INTERVAL_MS);

        // 3. Silencia el TTS
        stopSpeech(ros);

        // 4. Cabeza al centro
        createTopic(ros, '/set_angles', 'robot_toolkit_msgs/set_angles_msg').publish({
            names: ['HeadPitch', 'HeadYaw'],
            angles: [0, 0],
            fraction_max_speed: [0.2, 0.2],
        });

        // 5. Postura por defecto
        createService(ros, '/pytoolkit/ALRobotPosture/go_to_posture_srv', 'robot_toolkit_msgs/go_to_posture_srv')
            .callService(
                { posture: 'stand' },
                (result) => console.log('Panic: go to stand', result),
                (error) => console.error('Panic: error al ir a stand', error)
            );

        setTriggered(true);
        clearTimeout(timersRef.current.feedback);
        timersRef.current.feedback = setTimeout(() => setTriggered(false), FEEDBACK_MS);
    }, [ros, isConnected]);

    // Atajo Esc: funciona incluso con un campo de texto enfocado
    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && !e.repeat) handlePanic();
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [handlePanic]);

    useEffect(() => () => {
        clearInterval(timersRef.current.stop);
        clearTimeout(timersRef.current.feedback);
    }, []);

    const disabled = !ros || !isConnected;

    return (
        <button
            type="button"
            onClick={handlePanic}
            disabled={disabled}
            aria-label="Botón de pánico: detener el robot"
            title={disabled ? 'Sin conexión con el robot' : 'Detener y volver a la posición por defecto (Esc)'}
            className="flex h-14 w-full shrink-0 flex-col items-center justify-center rounded-[25px] border-none text-white transition-[filter,opacity] duration-200 enabled:cursor-pointer enabled:hover:brightness-90 enabled:active:brightness-75 disabled:cursor-not-allowed disabled:opacity-40"
            style={{ backgroundColor: COLORS.ROJO, fontFamily: TYPOGRAPHY.FONT_FAMILY_PRINCIPAL }}
        >
            <span className="text-base font-black leading-tight">{triggered ? 'DETENIDO' : '⏹ PÁNICO'}</span>
            <span className="text-[11px] font-bold leading-tight opacity-80">{triggered ? 'Volviendo a posición base' : 'Esc'}</span>
        </button>
    );
};

export default PanicButton;
