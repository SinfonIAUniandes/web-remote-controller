import React, { useState } from 'react';
import { useRos } from '../contexts/RosContext';
import { createService } from '../services/RosManager';

const HotWords = () => {
    const { ros } = useRos();

    const [subscribe, setSubscribe] = useState(false);
    const [noise, setNoise] = useState(false);
    const [eyes, setEyes] = useState(false);
    const [url, setUrl] = useState("Spanish");

    // servicio que activa o desactiva hw y lo configura con los parámetros de noise y eyes
    const callSpeechRecognition = (newSubscribe, newNoise, newEyes) => {
        if (!ros) {
            console.error("ROS not connected");
            return;
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
                console.log("SpeechRecognition response:", result);
                setSubscribe(newSubscribe);
                setNoise(newNoise);
                setEyes(newEyes);
            },
            (error) => {
                console.error("Error:", error);
            }
        );
    };

    // servicio de cambiar iidoma
    const callUrlService = (newUrl) => {
        if (!ros) {
            console.error("ROS not connected");
            return;
        }

        const service = createService(
            ros,
            '/pytoolkit/ALSpeechRecognition/set_hot_word_language_srv',
            'pytoolkit/set_hot_word_language_srv'
        );

        const request = {
            url: newUrl
        };

        service.callService(
            request,
            (result) => {
                console.log("Url response:", result);
                setUrl(newUrl);
            },
            (error) => {
                console.error("Error:", error);
            }
        );
    };

    //FALTA: Topic donde se publican las palabras


    //para hacerlo desplehable
    const toggleSubscribe = () => {
        callSpeechRecognition(!subscribe, noise, eyes);
    };

    // noise
    const toggleNoise = () => {
        callSpeechRecognition(subscribe, !noise, eyes);
    };

    // eyes
    const toggleEyes = () => {
        callSpeechRecognition(subscribe, noise, !eyes);
    };

    //cambiar idioma
    const handleUrlChange = (event) => {
        const newLang = event.target.value;
        callUrlService(newLang);
    };

    return (
        <div style={{ textAlign: 'center' }}>
            <h2>Speech Recognition Control</h2>

            {/* ON / OFF */}
            <button onClick={toggleSubscribe}>
                {subscribe ? "Desactivar HotWords" : "Activar HotWords"}
            </button>

            <p>Estado: {subscribe ? "ACTIVO" : "INACTIVO"}</p>

            <hr />

            {/* Language */}
            <h3>Idioma</h3>
            <select value={url} onChange={handleUrlChange}>
                <option value="Spanish">Spanish</option>
                <option value="English">English</option>
            </select>

            <hr />

            {/* Noise */}
            <label>
                <input
                    type="checkbox"
                    checked={noise}
                    onChange={toggleNoise}
                />
                Activar Noise
            </label>

            <br />

            {/* Eyes */}
            <label>
                <input
                    type="checkbox"
                    checked={eyes}
                    onChange={toggleEyes}
                />
                Activar Eyes
            </label>
        </div>
    );
};

export default HotWords;