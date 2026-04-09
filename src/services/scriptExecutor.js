import * as ROSLIB from 'roslib';
import { createTopic, createService } from './RosManager';

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Dispara la acción de pantalla (fire-and-forget, sin await).
 * subtitle → show_words_srv (sin parámetros)
 * image/video → show_image_srv con { url }
 */
export function fireScreenAction(ros, screen) {
    if (!ros || !screen) return;

    if (screen.type === 'subtitle') {
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
    }
}

/**
 * Ejecuta un solo paso del script.
 * Orden: pantalla (no-blocking) → animación (no-blocking) → speech (await duración estimada)
 */
export async function executeStep(ros, step, language = 'Spanish') {
    if (!ros || !step) return;

    const speechTopic = createTopic(ros, '/speech', 'robot_toolkit_msgs/speech_msg');
    const animTopic = createTopic(ros, '/animations', 'robot_toolkit_msgs/animation_msg');

    // 1. Pantalla — fire-and-forget
    if (step.screen) {
        fireScreenAction(ros, step.screen);
    }

    // 2. Animación — fire-and-forget
    const hasAnimation = step.animation && step.animation.trim() !== '';
    if (hasAnimation) {
        animTopic.publish(new ROSLIB.Message({
            family: 'animations',
            animation_name: step.animation
        }));
    }

    // 3. Speech — publicar y esperar duración estimada
    const hasSpeech = step.speech && step.speech.trim() !== '';
    if (hasSpeech) {
        speechTopic.publish(new ROSLIB.Message({
            language,
            text: step.speech,
            animated: !hasAnimation  // animated: true solo si no hay animación explícita
        }));
        const waitMs = Math.max(1500, step.speech.length * 80);
        await sleep(waitMs);
    } else if (hasAnimation) {
        // Solo animación, sin speech
        await sleep(2000);
    }
    // Pantalla sola (sin speech ni animation): no esperar
}

/**
 * Ejecuta todos los pasos del script en secuencia.
 * @param {object} ros - Instancia ROS
 * @param {Array} steps - Array de pasos del script
 * @param {string} language - Idioma del script
 * @param {object} options
 * @param {Function} [options.onStepStart] - Callback(index) al iniciar cada paso
 * @param {Function} [options.onStepEnd]   - Callback(index) al terminar cada paso
 * @param {AbortSignal} [options.signal]   - AbortSignal para cancelar la ejecución
 */
export async function executeScript(ros, steps, language = 'Spanish', options = {}) {
    const { onStepStart, onStepEnd, signal } = options;

    for (let i = 0; i < steps.length; i++) {
        if (signal?.aborted) break;

        onStepStart?.(i);
        await executeStep(ros, steps[i], language);
        onStepEnd?.(i);

        // Pausa entre pasos (excepto después del último)
        if (i < steps.length - 1 && !signal?.aborted) {
            await sleep(300);
        }
    }
}

/**
 * Parsea el formato .txt legado:
 * <config>
 * language=Spanish
 * </config>
 * id,animation,"speech text"
 *
 * @returns {{ config: { name: string, language: string }, steps: Array }}
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

        // Parsear línea de acción: id,animation,"speech text"
        // Usamos un split manual para manejar comillas correctamente:
        // campo1 y campo2 son todo hasta la segunda coma;
        // campo3 es el resto (que puede contener comas si está entre comillas).
        const match = line.match(/^([^,]*),([^,]*),(.*)$/);
        if (match) {
            const id = match[1].trim();
            const animation = match[2].trim() || null;
            // Eliminar comillas envolventes del texto de speech
            const speech = match[3].trim().replace(/^"|"$/g, '');
            steps.push({ id, speech, animation, screen: null });
        }
    }

    return { config, steps };
}
