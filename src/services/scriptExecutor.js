import * as ROSLIB from 'roslib';
import { createTopic, createService } from './RosManager';

/** Sleep normal (sin interrupción) */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Sleep interruptible por AbortSignal.
 * Si la señal se activa antes de que pase el tiempo, resuelve inmediatamente.
 */
const sleepAbortable = (ms, signal) => new Promise(resolve => {
    if (signal?.aborted) return resolve();
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener('abort', () => { clearTimeout(timer); resolve(); }, { once: true });
});

/**
 * Intenta detener el TTS del robot (best-effort — falla silenciosamente).
 */
export function stopSpeech(ros) {
    if (!ros) return;
    try {
        const svc = createService(
            ros,
            '/pytoolkit/ALTextToSpeech/stop_srv',
            'robot_toolkit_msgs/battery_service_srv'
        );
        svc.callService(new ROSLIB.ServiceRequest({}), () => {}, () => {});
    } catch (_) {}
}

/**
 * Dispara la acción de pantalla (fire-and-forget).
 *
 * Tipos soportados y servicios ROS usados:
 *   subtitle → show_words_srv  (sin params — muestra las palabras del speech en curso)
 *   image    → show_image_srv  con { url } — soporta jpg, png, gif, bmp, svg y data URIs base64
 *   video    → show_image_srv  con { url } — data URI base64 del archivo (funciona en Pepper firmware reciente)
 *   web      → show_web_view_srv con { url } — cualquier URL HTTP/HTTPS
 *
 * NOTA sobre formatos de imagen: jpg/jpeg y png son los más fiables en la tablet Pepper.
 * gif, bmp y svg pueden funcionar según el firmware. Para video, mp4 en base64 funciona
 * para archivos pequeños; para videos grandes se recomienda alojarlos en un servidor y usar 'web'.
 */
export function fireScreenAction(ros, screen) {
    if (!ros || !screen) return;

    if (screen.type === 'subtitle') {
        // Se llama después de que el speech ya fue publicado (ver executeStep)
        const svc = createService(
            ros,
            '/pytoolkit/ALTabletService/show_words_srv',
            'robot_toolkit_msgs/battery_service_srv'
        );
        svc.callService(new ROSLIB.ServiceRequest({}), () => {}, () => {});

    } else if (screen.type === 'image' || screen.type === 'video') {
        if (!screen.content) return;
        const svc = createService(
            ros,
            '/pytoolkit/ALTabletService/show_image_srv',
            'robot_toolkit_msgs/tablet_service_srv'
        );
        svc.callService(new ROSLIB.ServiceRequest({ url: screen.content }), () => {}, () => {});

    } else if (screen.type === 'web') {
        if (!screen.content) return;
        const svc = createService(
            ros,
            '/pytoolkit/ALTabletService/show_web_view_srv',
            'robot_toolkit_msgs/tablet_service_srv'
        );
        svc.callService(new ROSLIB.ServiceRequest({ url: screen.content }), () => {}, () => {});
    }
}

/**
 * Ejecuta un solo paso del script.
 * Orden correcto:
 *   1. Animación (fire-and-forget)
 *   2. Speech (publicar)
 *   3. Subtítulo DESPUÉS del speech — así la tablet lee el texto en curso
 *   4. Imagen/video/web (fire-and-forget, puede ir antes o después)
 *   5. Await duración estimada (interruptible por signal)
 *
 * @param {AbortSignal} [signal] — para detener la espera inmediatamente
 */
export async function executeStep(ros, step, language = 'Spanish', signal) {
    if (!ros || !step) return;
    if (signal?.aborted) return;

    const speechTopic = createTopic(ros, '/speech', 'robot_toolkit_msgs/speech_msg');
    const animTopic = createTopic(ros, '/animations', 'robot_toolkit_msgs/animation_msg');

    const hasAnimation = step.animation && step.animation.trim() !== '';
    const hasSpeech = step.speech && step.speech.trim() !== '';
    const hasScreen = !!step.screen;
    const isSubtitle = step.screen?.type === 'subtitle';

    // 1. Animación — fire-and-forget
    if (hasAnimation) {
        animTopic.publish(new ROSLIB.Message({
            family: 'animations',
            animation_name: step.animation
        }));
    }

    // 2. Pantalla NO-subtítulo — fire-and-forget antes del speech
    if (hasScreen && !isSubtitle) {
        fireScreenAction(ros, step.screen);
    }

    // 3. Speech — publicar
    if (hasSpeech) {
        speechTopic.publish(new ROSLIB.Message({
            language,
            text: step.speech,
            animated: !hasAnimation
        }));

        // 4. Subtítulo DESPUÉS del speech (la tablet necesita que el speech haya empezado)
        if (isSubtitle) {
            await sleep(100); // pequeña pausa para que el robot empiece a hablar
            if (!signal?.aborted) fireScreenAction(ros, step.screen);
        }

        // 5. Esperar duración estimada (interruptible)
        const waitMs = Math.max(1500, step.speech.length * 80);
        await sleepAbortable(waitMs, signal);

    } else if (hasAnimation) {
        // Solo animación
        await sleepAbortable(2000, signal);
    } else if (hasScreen && !isSubtitle) {
        // Solo pantalla — espera breve para que se vea
        await sleepAbortable(1000, signal);
    }
}

/**
 * Ejecuta todos los pasos en secuencia.
 * @param {object} options
 * @param {Function} [options.onStepStart]  — callback(index) al inicio de cada paso
 * @param {Function} [options.onStepEnd]    — callback(index) al fin de cada paso
 * @param {AbortSignal} [options.signal]    — para cancelar toda la ejecución
 * @param {number} [options.stepDelay=3000] — ms de pausa entre pasos
 */
export async function executeScript(ros, steps, language = 'Spanish', options = {}) {
    const { onStepStart, onStepEnd, signal, stepDelay = 3000 } = options;

    for (let i = 0; i < steps.length; i++) {
        if (signal?.aborted) break;

        onStepStart?.(i);
        await executeStep(ros, steps[i], language, signal);
        onStepEnd?.(i);

        if (i < steps.length - 1 && !signal?.aborted) {
            await sleepAbortable(stepDelay, signal);
        }
    }
}

/**
 * Parsea el formato .txt legado:
 * <config>
 * language=Spanish
 * </config>
 * id,animation,"speech text"
 */
export function parseLegacyTxt(text, filename = 'imported_script') {
    const lines = text.split('\n');
    const config = {
        name: filename.replace(/\.txt$/i, ''),
        language: 'Spanish'
    };
    const steps = [];
    let inConfig = false;

    for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line) continue;

        if (line === '<config>') { inConfig = true; continue; }
        if (line === '</config>') { inConfig = false; continue; }

        if (inConfig) {
            const eqIdx = line.indexOf('=');
            if (eqIdx !== -1) {
                const key = line.slice(0, eqIdx).trim().toLowerCase();
                const val = line.slice(eqIdx + 1).trim();
                config[key] = val;
            }
            continue;
        }

        const match = line.match(/^([^,]*),([^,]*),(.*)$/);
        if (match) {
            const id = match[1].trim();
            const animation = match[2].trim() || null;
            const speech = match[3].trim().replace(/^"|"$/g, '');
            steps.push({ id, speech, animation, screen: null });
        }
    }

    return { config, steps };
}
