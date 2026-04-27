import * as ROSLIB from 'roslib';
import { createTopic, createService } from './RosManager';

/**
 * Detiene el TTS del robot usando audio_tools_srv (disable → enable).
 */
export function stopSpeech(ros) {
    if (!ros) return;
    try {
        const svc = createService(ros, '/robot_toolkit/audio_tools_srv', 'robot_toolkit_msgs/audio_tools_srv');
        svc.callService(
            new ROSLIB.ServiceRequest({ data: { command: 'disable_tts' } }),
            () => {
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
 * Acción de pantalla fire-and-forget.
 * Tipos soportados: subtitle | image | video | web
 */
export function fireScreenAction(ros, screen) {
    if (!ros || !screen) return;

    if (screen.type === 'subtitle') {
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
 * Sleep abortable
 */
const sleepAbortable = (ms, signal) => new Promise(resolve => {
    if (signal?.aborted) return resolve();
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener('abort', () => { clearTimeout(timer); resolve(); }, { once: true });
});

/**
 * Ejecuta un solo paso del script.
 * Orden: animación → pantalla no-subtitle → speech → subtítulo (si hay) → espera estimada.
 */
export async function executeStep(ros, step, language = 'Spanish', signal, topics) {
    if (!ros || !step) return;
    if (signal?.aborted) return;

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

        // 4. Subtítulo justo después del speech
        if (isSubtitle && !signal?.aborted) {
            fireScreenAction(ros, { type: 'subtitle', content: step.speech });
        }

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
 */
export async function executeScript(ros, steps, language = 'Spanish', options = {}) {
    const { onStepStart, onStepEnd, signal, stepDelay = 3000 } = options;

    const topics = {
        speechTopic: createTopic(ros, '/speech', 'robot_toolkit_msgs/speech_msg'),
        animTopic:   createTopic(ros, '/animations', 'robot_toolkit_msgs/animation_msg')
    };

    await new Promise(r => setTimeout(r, 150));

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
 * Parser archivos .txt legado
 */
export function parseLegacyTxt(text, filename = 'imported_script') {
    const lines = text.split('\n');
    const config = { name: filename.replace(/\.txt$/i, ''), language: 'Spanish' };
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