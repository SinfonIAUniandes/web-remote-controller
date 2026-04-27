import * as ROSLIB from 'roslib';
import { createTopic } from './RosManager';

/**
 * Motor de ejecución de scripts para el robot Pepper.
 * Procesa una secuencia de pasos que incluyen voz y animaciones.
 */
export const executeScript = async (ros, steps, language = 'Spanish', options = {}) => {
    const { signal, stepDelay = 300 } = options;

    if (!ros) throw new Error('ROS no está conectado');

    const speechTopic = createTopic(ros, '/speech', 'robot_toolkit_msgs/speech_msg');
    const animationTopic = createTopic(ros, "/animations", "robot_toolkit_msgs/animation_msg");

    // Función auxiliar para esperar tiempo respetando la señal de aborto
    const wait = (ms) => new Promise((resolve) => {
        const timeout = setTimeout(resolve, ms);
        signal?.addEventListener('abort', () => {
            clearTimeout(timeout);
            resolve();
        }, { once: true });
    });

    for (const step of steps) {
        // Verificar si se ha solicitado detener el script
        if (signal?.aborted) {
            const error = new Error('Script execution aborted');
            error.name = 'AbortError';
            throw error;
        }

        console.log(`Ejecutando paso: ${step.id}`);

        // 1. Procesar Voz (Speech)
        if (step.speech && step.speech.trim() !== "") {
            const speechMessage = new ROSLIB.Message({
                language: language,
                text: step.speech,
                animated: true
            });
            speechTopic.publish(speechMessage);
            
            // Calculamos un tiempo estimado de espera basado en la longitud del texto
            const speechWait = Math.max(1500, step.speech.length * 80);
            await wait(speechWait);
        }

        if (signal?.aborted) break;

        // 2. Procesar Animación
        if (step.animation && step.animation.trim() !== "") {
            const animationMessage = new ROSLIB.Message({
                family: "animations",
                animation_name: step.animation
            });
            animationTopic.publish(animationMessage);
            
            // Espera estándar para que la animación se ejecute
            await wait(2000);
        }

        if (signal?.aborted) break;

        // 3. Retardo entre pasos (para que no se sienta atropellado)
        if (stepDelay > 0) {
            await wait(stepDelay);
        }
    }
};
