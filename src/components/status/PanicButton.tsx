import { useCallback, useEffect, useRef, useState } from 'react';
import { useRos } from '../../contexts/RosContext';
import { createService, createTopic } from '../../services/RosManager';
import { stopSpeech } from '../../services/scriptExecutor';
import { triggerPanic } from '../../services/panic';
import { OctagonX } from 'lucide-react';
import { TYPOGRAPHY } from '../../theme';

const STOP_REPEATS = 5;
const STOP_INTERVAL_MS = 50;
const FEEDBACK_MS = 2000;

type PanicButtonProps = {
    // Versión pequeña para la barra compacta del menú en móvil
    compact?: boolean;
    // Solo una instancia montada debe escuchar Esc; si no, el pánico se dispararía varias veces
    enableHotkey?: boolean;
};

const PanicButton = ({ compact = false, enableHotkey = true }: PanicButtonProps) => {
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

        // 3. Corta el audio: TTS y cualquier sonido/stream que esté reproduciendo ALAudioPlayer
        stopSpeech(ros);
        for (const name of ['ALTextToSpeech/shut_up_srv', 'ALAudioPlayer/stop_audio_stream_srv']) {
            createService(ros, `/pytoolkit/${name}`, 'robot_toolkit_msgs/battery_service_srv')
                .callService(
                    {},
                    (result) => console.log(`Panic: ${name}`, result),
                    (error) => console.error(`Panic: error en ${name}`, error)
                );
        }

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
        if (!enableHotkey) return;
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && !e.repeat) handlePanic();
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [handlePanic, enableHotkey]);

    useEffect(() => () => {
        clearInterval(timersRef.current.stop);
        clearTimeout(timersRef.current.feedback);
    }, []);

    const disabled = !ros || !isConnected;
    // const disabled = false

    // Aspecto de botón físico: los estilos (degradado, borde inferior grueso que se "hunde" al pulsar) están en index.css (.panic-btn)
    return (
        <button
            type="button"
            onClick={handlePanic}
            disabled={disabled}
            data-pressed={triggered}
            aria-label="Botón de pánico: detener el robot"
            title={disabled ? 'Sin conexión con el robot' : 'Detener y volver a la posición por defecto (Esc)'}
            className={`panic-btn flex shrink-0 flex-col items-center justify-center border-none text-[var(--c-texto-sobre-rojo)] enabled:cursor-pointer disabled:cursor-not-allowed ${
                compact ? 'panic-btn-compact h-11 min-w-[104px] rounded-[16px] px-3' : 'h-14 w-full rounded-[25px]'
            }`}
            style={{ fontFamily: TYPOGRAPHY.FONT_FAMILY_PRINCIPAL }}
        >
            <span className={`flex items-center gap-1.5 font-black leading-tight [text-shadow:0_1px_0_rgba(0,0,0,0.35)] ${compact ? 'text-sm' : 'text-base'}`}>
                <OctagonX aria-hidden="true" size={compact ? 16 : 20} strokeWidth={2.75} className="shrink-0" />
                {triggered ? 'DETENIDO' : 'PÁNICO'}
            </span>
            {!compact && (
                triggered
                    ? <span className="text-[11px] font-bold leading-tight opacity-90">Volviendo a posición base</span>
                    // Tecla Esc dibujada como keycap: es el atajo del botón
                    : <kbd className="mt-0.5 rounded-[5px] border border-solid border-[var(--c-texto-sobre-rojo)]/50 bg-black/15 px-1.5 py-px font-[inherit] text-[10px] font-bold leading-none">Esc</kbd>
            )}
        </button>
    );
};

export default PanicButton;
