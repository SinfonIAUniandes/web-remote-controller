import React, { useState, useEffect, useRef } from 'react';
import { useRos } from '../contexts/RosContext';
import { createService, createTopic, publishMessage } from '../services/RosManager';

const HOTWORDS = [
    { word: 'hola', threshold: 0.35 },
    { word: 'ayuda', threshold: 0.35 },
    { word: 'baila', threshold: 0.35 },
];

const RESPONSES = {
    'hola': 'Hola, cómo estás?',
    'ayuda': 'Mi misión es ayudarte, ¿qué necesitas?',
    'baila': 'Me encanta bailar, luego te muestro',
};

const HotWords = () => {
    const { ros } = useRos();

    const [subscribe, setSubscribe] = useState(false);
    const [noise, setNoise] = useState(false);
    const [eyes, setEyes] = useState(false);
    const [url, setUrl] = useState('Spanish');

    const topicRef = useRef(null);

    // servicio que activa o desactiva hw y lo configura con los parámetros de noise y eyes
    // Devuelve una Promise que resuelve cuando el servicio responde
    const callSpeechRecognition = (newSubscribe, newNoise, newEyes) => {
        return new Promise((resolve, reject) => {
            if (!ros) {
                const err = new Error('ROS not connected');
                console.error(err);
                return reject(err);
            }

            const service = createService(
                ros,
                '/pytoolkit/ALSpeechRecognition/set_speechrecognition_srv',
                'pytoolkit/set_speechrecognition_srv'
            );

            const request = {
                subscribe: newSubscribe,
                noise: newNoise,
                eyes: newEyes
            };

            service.callService(
                request,
                (result) => {
                    console.log('SpeechRecognition response:', result);
                    setSubscribe(newSubscribe);
                    setNoise(newNoise);
                    setEyes(newEyes);
                    resolve(result);
                },
                (error) => {
                    console.error('Error in set_speechrecognition_srv:', error);
                    reject(error);
                }
            );
        });
    };

    // servicio de cambiar idioma
    // Devuelve una Promise
    const callUrlService = (newUrl) => {
        return new Promise((resolve, reject) => {
            if (!ros) {
                const err = new Error('ROS not connected');
                console.error(err);
                return reject(err);
            }

            const service = createService(
                ros,
                '/pytoolkit/ALSpeechRecognition/set_hot_word_language_srv',
                'pytoolkit/set_hot_word_language_srv'
            );

            const request = { url: newUrl };

            service.callService(
                request,
                (result) => {
                    console.log('Url response:', result);
                    setUrl(newUrl);
                    resolve(result);
                },
                (error) => {
                    console.error('Error in set_hot_word_language_srv:', error);
                    reject(error);
                }
            );
        });
    };

    const sendVocabulary = () => {
        return new Promise((resolve, reject) => {
            if (!ros) return reject(new Error('ROS not connected'));
            const service = createService(
                ros,
                '/pytoolkit/ALSpeechRecognition/set_words_srv',
                'pytoolkit/set_words_threshold_srv'
            );

            service.callService(
                {
                    words: HOTWORDS.map(h => h.word),
                    threshold: HOTWORDS.map(h => h.threshold),
                },
                (result) => {
                    console.log('Vocabulary sent:', result);
                    resolve(result);
                },
                (error) => {
                    console.error('Error in set_words_srv:', error);
                    reject(error);
                }
            );
        });
    };

    useEffect(() => {
        if (!ros || !subscribe) {
            if (topicRef.current) {
                topicRef.current.unsubscribe();
                topicRef.current = null;
            }
            return;
        }

        const topic = createTopic(ros, '/pytoolkit/ALSpeechRecognition/status', 'robot_toolkit_msgs/speech_recognition_status_msg');

        topic.subscribe((msg) => {
            console.log('HotWords message:', msg);
            const word = (msg.status).toLowerCase();
            console.log('Detected hotword:', word);

            const response = RESPONSES[word];
            if (response) {
                const speechTopic = createTopic(ros, '/speech', 'robot_toolkit_msgs/speech_msg');
                publishMessage(speechTopic, { language: url, text: response, animated: true });
            }
        });

        topicRef.current = topic;

        return () => {
            if (topicRef.current) {
                topicRef.current.unsubscribe();
                topicRef.current = null;
            }
        };
    }, [ros, subscribe, url]);

    const toggleSubscribe = async () => {
        const newState = !subscribe;

        if (!newState) {
            // desactivar
            try {
                await callSpeechRecognition(false, noise, eyes);
            } catch (err) {
                console.error('Error deactivation:', err);
            }
            return;
        }

        // activar -> cambiar idioma -> enviar vocabulario
        try {
            await callSpeechRecognition(true, noise, eyes);
            await callUrlService(url);
            try {
                await sendVocabulary();
            } catch (err) {
                console.warn('sendVocabulary failed, attempting pause/retry:', err);
                try {
                    await callSpeechRecognition(false, noise, eyes);
                    await sendVocabulary();
                    await callSpeechRecognition(true, noise, eyes);
                } catch (retryErr) {
                    console.error('Retry failed:', retryErr);
                }
            }
        } catch (err) {
            console.error('Error activating hotwords sequence:', err);
        }
    };

    // noise
    const toggleNoise = () => {
        setNoise(!noise);
    };

    // eyes
    const toggleEyes = () => {
        setEyes(!eyes);
    };

    //cambiar idioma
    const handleUrlChange = (event) => {
        const newLang = event.target.value;
        callUrlService(newLang);
    };

    const thStyle = {
        border: '1px solid #ccc',
        padding: '8px 16px',
        backgroundColor: '#f0f0f0',
    };
    
    const tdStyle = {
        border: '1px solid #ccc',
        padding: '6px 16px',
    };

    
    return (
        <div style={{ textAlign: 'center' }}>
            <h2>Speech Recognition Control</h2>
    
            {/* Language */}
            <h3>Idioma</h3>
            <select value={url} onChange={handleUrlChange}>
                <option value="Spanish">Spanish</option>
                <option value="English">English</option>
            </select>
    
            <hr />
    
            {/* Noise y Eyes primero */}
            <label>
                <input
                    type="checkbox"
                    checked={noise}
                    onChange={toggleNoise}
                />
                Activar Noise
            </label>
    
            <br />
    
            <label>
                <input
                    type="checkbox"
                    checked={eyes}
                    onChange={toggleEyes}
                />
                Activar Eyes
            </label>
    
            <hr />
    
            {/* ON / OFF al final */}
            <button onClick={toggleSubscribe}>
                {subscribe ? "Desactivar HotWords" : "Activar HotWords"}
            </button>
    
            <p>Estado: {subscribe ? "ACTIVO" : "INACTIVO"}</p>
    
            <hr />
    
            {/* Tabla de hotwords */}
            <h3>Palabras configuradas</h3>
            <table style={{ margin: '0 auto', borderCollapse: 'collapse' }}>
                <thead>
                    <tr>
                        <th style={thStyle}>Palabra</th>
                        <th style={thStyle}>Respuesta</th>
                        <th style={thStyle}>Threshold</th>
                    </tr>
                </thead>
                <tbody>
                    {HOTWORDS.map(({ word, threshold }) => (
                        <tr key={word}>
                            <td style={tdStyle}>{word}</td>
                            <td style={tdStyle}>{RESPONSES[word]}</td>
                            <td style={tdStyle}>{threshold}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default HotWords;