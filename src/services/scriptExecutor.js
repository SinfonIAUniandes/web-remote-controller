import * as ROSLIB from 'roslib';
import { createTopic, createService } from './RosManager';

/**
 * Detiene cualquier discurso activo en el robot
 */
export const stopSpeech = (ros) => {
    if (!ros) return;
    const stopService = createService(ros, '/pytoolkit/ALTextToSpeech/stop_all_srv', 'std_srvs/Empty');
    stopService.callService(new ROSLIB.ServiceRequest({}), () => {}, () => {});
};

/**
 * Ejecuta un único paso del script
 */
export const executeStep = async (ros, step, language, signal, topics = null) => {
    const speechTopic = topics?.speechTopic || createTopic(ros, '/speech', 'robot_toolkit_msgs/speech_msg');
    const animationTopic = topics?.animTopic || createTopic(ros, "/animations", "robot_toolkit_msgs/animation_msg");

    const wait = (ms) => new Promise((resolve) => {
        const timeout = setTimeout(resolve, ms);
        signal?.addEventListener('abort', () => {
            clearTimeout(timeout);
            resolve();
        }, { once: true });
    });

    if (step.speech?.trim()) {
        speechTopic.publish(new ROSLIB.Message({
            language: language,
            text: step.speech,
            animated: true
        }));
        // Espera estimada: 80ms por caracter + margen de seguridad
        await wait(Math.max(1500, step.speech.length * 80));
    }

    if (signal?.aborted) return;

    if (step.animation?.trim()) {
        animationTopic.publish(new ROSLIB.Message({
            family: "animations",
            animation_name: step.animation
        }));
        await wait(2000); // Tiempo para la animación
    }
};

/**
 * Motor de ejecución de scripts para el robot Pepper.
 * Procesa una secuencia de pasos que incluyen voz y animaciones.
 */
export const executeScript = async (ros, steps, language = 'Spanish', options = {}) => {
    const { signal, stepDelay = 300 } = options;

    if (!ros) throw new Error('ROS no está conectado');
    
    const topics = {
        speechTopic: createTopic(ros, '/speech', 'robot_toolkit_msgs/speech_msg'),
        animTopic: createTopic(ros, "/animations", "robot_toolkit_msgs/animation_msg")
    };

    for (const step of steps) {
        if (signal?.aborted) {
            const error = new Error('Script execution aborted');
            error.name = 'AbortError';
            throw error;
        }

        if (options.onStepStart) options.onStepStart(steps.indexOf(step));
        
        await executeStep(ros, step, language, signal, topics);

        if (signal?.aborted) break;
        if (stepDelay > 0) {
            await new Promise(r => setTimeout(r, stepDelay));
        }
    }
};

/**
 * Parser para archivos .txt de legado (Formato: "Texto | Animación")
 */
export const parseLegacyTxt = (content, fileName) => {
    const lines = content.split('\n');
    const steps = lines.map(line => {
        const parts = line.split('|');
        return {
            speech: parts[0]?.trim() || '',
            animation: parts[1]?.trim() || '',
            screen: null
        };
    }).filter(s => s.speech || s.animation);

    return {
        config: {
            name: fileName.replace('.txt', ''),
            language: 'Spanish',
            stepDelay: 3000
        },
        steps
    };
};
