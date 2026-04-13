import * as ROSLIB from 'roslib';
import { createTopic, createService } from './RosManager';

/** Sleep normal */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Sleep interruptible por AbortSignal.
 * Se resuelve inmediatamente si la señal ya está activada o cuando se activa.
 */
const sleepAbortable = (ms, signal) => new Promise(resolve => {
    if (signal?.aborted) return resolve();
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener('abort', () => { clearTimeout(timer); resolve(); }, { once: true });
});

/**
 * Detiene el TTS del robot usando audio_tools_srv (disable → enable).
 * disable_tts interrumpe el speech en curso; enable_tts lo deja listo para el siguiente uso.
 * Patrón confirmado: Texto.jsx usa el mismo servicio para enable_tts.
 */
export function stopSpeech(ros) {
    if (!ros) return;
    try {
        const svc = createService(ros, '/robot_toolkit/audio_tools_srv', 'robot_toolkit_msgs/audio_tools_srv');
        svc.callService(
            new ROSLIB.ServiceRequest({ data: { command: 'disable_tts' } }),
            () => {
                // Re-enable inmediatamente para que el TTS quede disponible para el próximo uso
                svc.callService(
                    new ROSLIB.ServiceRequest({ data: { command: 'enable_tts' } }),
                    () => {}, () => {}
                );
            },
            () => {}
        );
    } catch (_) {}
}

/**
 * Dispara la acción de pantalla (fire-and-forget).
 *
 * Tipos soportados:
 *   subtitle → show_web_view_srv con HTML generado (texto blanco sobre fondo negro)
 *             screen.content debe contener el texto a mostrar
 *   image    → show_image_srv con { url }  (jpg/png más fiables en Pepper)
 *   video    → show_image_srv con { url }  (data URI base64, funciona para archivos pequeños)
 *   web      → show_web_view_srv con { url } (cualquier URL HTTP/HTTPS)
 */
export function fireScreenAction(ros, screen) {
    if (!ros || !screen) return;

    if (screen.type === 'subtitle') {
        // Generar HTML con el texto del speech para mostrarlo en la tablet
        const text = screen.content || '';
        const html = `<!DOCTYPE html><html><body style="margin:0;background:#000;display:flex;align-items:center;justify-content:center;height:100vh"><p style="color:#fff;font-family:sans-serif;font-size:38px;text-align:center;padding:24px;line-height:1.4;word-break:break-word">${text}</p></body></html>`;
        const uri = `data:text/html;charset=utf-8,${encodeURIComponent(html)}`;
        const svc = createService(ros, '/pytoolkit/ALTabletService/show_web_view_srv', 'robot_toolkit_msgs/tablet_service_srv');
        svc.callService(new ROSLIB.ServiceRequest({ url: uri }), () => {}, () => {});

    } else if (screen.type === 'image' || screen.type === 'video') {
        if (!screen.content) return;
        const svc = createService(ros, '/pytoolkit/ALTabletService/show_image_srv', 'robot_toolkit_msgs/tablet_service_srv');
        svc.callService(new ROSLIB.ServiceRequest({ url: screen.content }), () => {}, () => {});

    } else if (screen.type === 'web') {
        if (!screen.content) return;
        const svc = createService(ros, '/pytoolkit/ALTabletService/show_web_view_srv', 'robot_toolkit_msgs/tablet_service_srv');
        svc.callService(new ROSLIB.ServiceRequest({ url: screen.content }), () => {}, () => {});
    }
}

/**
 * Ejecuta un solo paso del script.
 *
 * Orden de ejecución:
 *   1. Animación (fire-and-forget)
 *   2. Pantalla no-subtitle (fire-and-forget)
 *   3. Publicar speech
 *   4. Subtítulo inmediatamente después del speech (así la tablet muestra el texto mientras habla)
 *   5. Await duración estimada (interruptible por signal)
 *
 * @param {object} ros
 * @param {object} step       — { speech, animation, screen }
 * @param {string} language
 * @param {AbortSignal} [signal]
 * @param {object} [topics]   — { speechTopic, animTopic } pre-creados para evitar warmup issues
 */
export async function executeStep(ros, step, language = 'Spanish', signal, topics) {
    if (!ros || !step) return;
    if (signal?.aborted) return;

    // Usar topics pre-creados si se pasan; crear propios si se llama de forma aislada
    const speechTopic = topics?.speechTopic ?? createTopic(ros, '/speech', 'robot_toolkit_msgs/speech_msg');
    const animTopic   = topics?.animTopic   ?? createTopic(ros, '/animations', 'robot_toolkit_msgs/animation_msg');

    const hasAnimation = !!(step.animation && step.animation.trim());
    const hasSpeech    = !!(step.speech && step.speech.trim());
    const hasScreen    = !!step.screen;
    const isSubtitle   = step.screen?.type === 'subtitle';

    // 1. Animación
    if (hasAnimation) {
        animTopic.publish(new ROSLIB.Message({
            family: 'animations',
            animation_name: step.animation
        }));
    }

    // 2. Pantalla no-subtitle (imagen, video, web)
    if (hasScreen && !isSubtitle) {
        fireScreenAction(ros, step.screen);
    }

    // 3. Speech
    if (hasSpeech) {
        speechTopic.publish(new ROSLIB.Message({
            language,
            text: step.speech,
            animated: !hasAnimation
        }));

        // 4. Subtítulo: se muestra con el texto del speech, inmediatamente después de publicar
        if (isSubtitle && !signal?.aborted) {
            fireScreenAction(ros, { type: 'subtitle', content: step.speech });
        }

        // 5. Esperar duración estimada (interruptible)
        const waitMs = Math.max(1500, step.speech.length * 80);
        await sleepAbortable(waitMs, signal);

    } else if (hasAnimation) {
        await sleepAbortable(2000, signal);
    } else if (hasScreen && !isSubtitle) {
        await sleepAbortable(1000, signal);
    }
}

/**
 * Ejecuta todos los pasos en secuencia.
 * Crea los topics UNA sola vez y espera 150ms de warmup antes del primer paso,
 * evitando el problema de timing en la primera publicación.
 *
 * @param {object} options
 * @param {Function} [options.onStepStart]  — callback(index) al inicio de cada paso
 * @param {Function} [options.onStepEnd]    — callback(index) al fin de cada paso
 * @param {AbortSignal} [options.signal]
 * @param {number} [options.stepDelay=3000] — ms de pausa entre pasos
 */
export async function executeScript(ros, steps, language = 'Spanish', options = {}) {
    const { onStepStart, onStepEnd, signal, stepDelay = 3000 } = options;

    // Crear topics una sola vez para toda la ejecución
    const topics = {
        speechTopic: createTopic(ros, '/speech', 'robot_toolkit_msgs/speech_msg'),
        animTopic:   createTopic(ros, '/animations', 'robot_toolkit_msgs/animation_msg')
    };

    // Warmup: dar tiempo al subscriber ROS para registrarse antes del primer mensaje
    await sleep(150);

    for (let i = 0; i < steps.length; i++) {
        if (signal?.aborted) break;

        onStepStart?.(i);
        await executeStep(ros, steps[i], language, signal, topics);
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
            const id        = match[1].trim();
            const animation = match[2].trim() || null;
            const speech    = match[3].trim().replace(/^"|"$/g, '');
            steps.push({ id, speech, animation, screen: null });
        }
    }

    return { config, steps };
}
