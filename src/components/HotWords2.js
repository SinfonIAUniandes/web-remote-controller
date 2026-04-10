import React, { useState, useEffect, useRef } from 'react';
import { useRos } from '../contexts/RosContext';
import { createTopic, createService } from '../services/RosManager';

//  Palabras predeterminadas y threshold para cada una
const HOTWORDS = [
    { word: 'hola',   threshold: 0.5 },
    { word: 'ayuda',  threshold: 0.5 },
    { word: 'baila', threshold: 0.5 },
];

//  Lo que responde a cada palabra 
const RESPONSES = {
    'hola':   'Hola, cómo estás?',
    'ayuda':  'Mi mision es ayudarte, qué necesitas?',
    'baila': 'Me encanta bailar, se muchos bailes, luego te muestro',
};

const HotWords = () => {
    const { ros } = useRos();

    //  Estados 
    const [subscribe, setSubscribe] = useState(false);  
    const [noise, setNoise] = useState(false); 
    const [eyes, setEyes]   = useState(false);  
    const [url, setUrl] = useState('Spanish'); // idioma (url string)
    const [detectedWord, setDetectedWord] = useState(null); // última palabra detectada
    const [log, setLog] = useState([]); //hist

    const topicRef = useRef(null);

    // SERVICIO 1: Activar / desactivar reconocimiento 
    // Doc: /pytoolkit/ALSpeechRecognition/set_speechrecognition_srv
    // Parámetros: subscribe (bool), noise (bool), eyes (bool)
    const callSpeechRecognition = (newSubscribe, newNoise, newEyes) => {
        if (!ros) {
            console.error('ROS no conectado');
            return;
        }

        const service = createService(
            ros,
            '/pytoolkit/ALSpeechRecognition/set_speechrecognition_srv',
            'pytoolkit/set_speechrecognition_srv'
        );

        service.callService(
            { subscribe: newSubscribe, noise: newNoise, eyes: newEyes },
            (result) => {
                console.log('SpeechRecognition activado/desactivado:', result);
                // solo actualiza el estado si el robot respondió bien
                setSubscribe(newSubscribe);
                setNoise(newNoise);
                setEyes(newEyes);
            },
            (error) => console.error('Error en set_speechrecognition_srv:', error)
        );
    };

    //  S2: Cambiar idioma 
    // Doc pytoolkit/ALSpeechRecognition/set_hot_word_language_srv
    // Parámetros: url - String
    const callUrlService = (newUrl) => {
        if (!ros) {
            console.error('ROS no conectado');
            return;
        }

        const service = createService(
            ros,
            '/pytoolkit/ALSpeechRecognition/set_hot_word_language_srv',
            'pytoolkit/set_hot_word_language_srv' //confirmar
        );

        service.callService(
            { url: newUrl },
            (result) => {
                console.log('Idioma cambiado:', result);
                setUrl(newUrl);
            },
            (error) => console.error('Error en set_hot_word_language_srv:', error)
        );
    };

    // s3 enviar palabras y umbrales 
    // Doc /pytoolkit/ALSpeechRecognition/set_words_srv
    // Parámetros: words (string[]), threshold (float[])
    const sendVocabulary = () => {
        if (!ros) return;

        const service = createService(
            ros,
            '/pytoolkit/ALSpeechRecognition/set_words_srv',
            'pytoolkit/set_words_threshold_srv' // tipo según documentación
        );

        service.callService(
            {
                words: HOTWORDS.map(h => h.word),  
                threshold: HOTWORDS.map(h => h.threshold), // [0.5, 0.5, 0.5]
            },
            (result) => console.log('Vocabulario enviad:', result),
            (error)  => console.error('Error en set_words_srv:', error)
        );
    };

    //  TOPIC: Recibir palabras detectadas 
    // Documentación: /pytoolkit/ALSpeechRecognition/status
    // CONFIRMAR TIPOO: speech_recognition_status_msg
    // Se suscribe cuando subscribe=true, se desuscribe cuando subscribe=false
    useEffect(() => {
        if (!ros || !subscribe) {
            // si se apaga, desuscribirse del topic
            if (topicRef.current) {
                topicRef.current.unsubscribe();
                topicRef.current = null;
            }
            return;
        }

        // suscribirse al topic donde Pepper publica lo que detectó
        const topic = new window.ROSLIB.Topic({
            ros,
            name: '/pytoolkit/ALSpeechRecognition/status',
            messageType: 'pytoolkit/speech_recognition_status_msg' // según documentación
        });

        topic.subscribe((msg) => {

            // CONFIRMAR CAMPOS DEL MENSAJE!!!!!!!!
            console.log('Mensaje completo recibido:', msg);
        
            const word = (msg.data || msg.word || '').toLowerCase();
            if (!word) return;
        
            setDetectedWord(word);
            setLog(prev => [
                { word, time: new Date().toLocaleTimeString() },
                ...prev.slice(0, 9)
            ]);
        
            // buscar si hay respuesta para esa palabra
            const respuesta = RESPONSES[word];
            if (respuesta) {
                // hacer hablar al robot — segun Texto.js
                const speechTopic = createTopic(
                    ros,
                    '/speech',
                    'robot_toolkit_msgs/speech_msg'
                );
                speechTopic.publish(new window.ROSLIB.Message({
                    language: url,   
                    text: respuesta,
                    animated: true
                }));
            }
        });
        
        topicRef.current = topic;
        return () => {
            topic.unsubscribe();
            topicRef.current = null;
        };

    }, [ros, subscribe]);

    //  Toggles 
    const toggleSubscribe = () => {
        const nuevoEstado = !subscribe;
        callSpeechRecognition(nuevoEstado, noise, eyes);
        if (nuevoEstado) sendVocabulary(); // al activar, manda el vocabulario
    };

    const toggleNoise = () => callSpeechRecognition(subscribe, !noise, eyes);
    const toggleEyes  = () => callSpeechRecognition(subscribe, noise, !eyes);

    //  Render 
    return (
        <div style={{ padding: '16px', fontFamily: 'sans-serif' }}>
            <h2>Hot Words</h2>

            {/* ── 1. Botón activar / desactivar ── */}
            <button onClick={toggleSubscribe}>
                {subscribe ? 'Desactivar HotWords' : 'Activar HotWords'}
            </button>
            <p>Estado: <b>{subscribe ? 'ACTIVO' : 'INACTIVO'}</b></p>

            <hr />

            {/* ── 2. Noise y Eyes ── */}
            <label>
                <input type="checkbox" checked={noise} onChange={toggleNoise} />
                {' '}Activar Noise (efectos de audio)
            </label>
            <br />
            <label>
                <input type="checkbox" checked={eyes} onChange={toggleEyes} />
                {' '}Activar Eyes (expresiones visuales)
            </label>

            <hr />

            {/* ── 3. Idioma ── */}
            <h3>Idioma</h3>
            {/* el campo se llama 'url' según la documentación */}
            <select value={url} onChange={e => callUrlService(e.target.value)}>
                <option value="Spanish">Español</option>
                <option value="English">English</option>
            </select>

            <hr />

            {/* ── 4. Lista de hot words con threshold ── */}
            <h3>Palabras configuradas</h3>
            {HOTWORDS.map(({ word, threshold }) => (
                <div key={word} style={{ marginBottom: '6px' }}>
                    <b>{word}</b>
                    {' — '}confianza mínima: {Math.round(threshold * 100)}%
                    {' → '}
                    <i>{RESPONSES[word]}</i>
                </div>
            ))}

            <hr />

            {/* ── 5. Detección en tiempo real ── */}
            <h3>Última palabra detectada</h3>
            <p>{detectedWord ?? 'Esperando...'}</p>

            <h3>Historial</h3>
            {log.length === 0
                ? <p style={{ opacity: 0.5 }}>Sin detecciones aún</p>
                : log.map((entry, i) => (
                    <div key={i}>{entry.time} — <b>{entry.word}</b></div>
                ))
            }
        </div>
    );
};

export default HotWords;