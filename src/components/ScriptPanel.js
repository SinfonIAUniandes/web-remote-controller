import { useState } from 'react';
import { useRos } from '../contexts/RosContext';
import { createTopic } from '../services/RosManager';
import * as ROSLIB from 'roslib';
import ShowWordsTablet from './ShowWordsTablet';

function parseContent(text) {
    try {
        const lines = text.split('\n').filter(line => line.trim() !== '');
        const result = { config: {}, actions: [] };
        let currentSection = null;

        lines.forEach(line => {
            if (line.startsWith('<config>')) {
                currentSection = 'config';
            } else if (line.startsWith('</config>')) {
                currentSection = null;
            } else if (currentSection === 'config') {
                const [key, value] = line.split('=');
                result.config[key.trim().toLowerCase()] = value.trim();
            } else {
                const parts = line.split(',');
                if (parts.length >= 3) {
                    const [id, action, text] = parts.map(part => part.trim().replace(/^"|"$/g, ''));
                    result.actions.push({
                        id,
                        action: action || null,
                        text: text || null
                    });
                }
            }
        });

        return result;
    } catch (err) {
        console.error('Error parsing the file: ', err);
    }
}

const ScriptPanel = () => {
    const [file, setFile] = useState({ name: '' });
    const [state, setState] = useState([]);
    const [selectedAction, setSelectedAction] = useState(0);
    const [logMessages, setLogMessages] = useState([]);
    const [showSubtitle, setShowSubtitle] = useState('');

    const { ros } = useRos();
    const speechTopic = createTopic(ros, '/speech', 'robot_toolkit_msgs/speech_msg');
    const animationTopic = createTopic(ros, "/animations", "robot_toolkit_msgs/animation_msg");
    const pantallaTopic = createTopic(ros, "/tablet_text", "std_msgs/String");

    function handleOnChange(event) {
        if (event.target.files.length > 1) {
            alert('Solo se puede seleccionar un archivo!');
            return;
        }

        const file = event.target.files[0];
        setFile(file);

        const reader = new FileReader();

        reader.onload = (event) => {
            const result = event.target.result;
            const parsedFile = parseContent(result);
            setState(parsedFile);
            setLogMessages(prev => [...prev, "Archivo cargado!"]);
        };

        reader.onerror = (error) => {
            console.error("Error al leer el archivo: ", error);
            setLogMessages(prev => [...prev, "Error al cargar el archivo!"]);
        };

        reader.readAsText(file);
    }

    function handleClicSelectAction(event) {
        if (file.name === '') return;
        const todo = event.target.id;

        if (selectedAction <= state.actions.length && selectedAction >= 0) {
            if (todo === 'before') {
                setSelectedAction(selectedAction - 1);
                return;
            }

            setSelectedAction(selectedAction + 1);
        }
    }

    function handleExecuteAction(event) {
        if (!ros) return;
        const action = state.actions[selectedAction];

        // Mostrar subtítulo en tablet si está activo en <config>
        if (action.text && state.config.subtitulos === "true") {
            setShowSubtitle(action.text);
            const msg = new ROSLIB.Message({ data: action.text });
            pantallaTopic.publish(msg);
        } else {
            setShowSubtitle('');
        }

        if (action.text !== null) {
            const animate = action.action === null ? true : false;
            const message = new ROSLIB.Message({
                language: state.config.language || 'Spanish',
                text: action.text,
                animated: animate
            });
            if (speechTopic) {
                setLogMessages(prev => [...prev, "🗣️ Publicando texto en /speech"]);
                speechTopic.publish(message);
            } else {
                console.error("El publicador de speech no está disponible.");
            }
        }

        if (action.action !== null) {
            const message = new ROSLIB.Message({
                family: "animations",
                animation_name: action.action
            });
            if (animationTopic) {
                setLogMessages(prev => [...prev, `🕺 Animación enviada: ${action.action}`]);
                animationTopic.publish(message);
            } else {
                console.error("El publicador de animaciones no está disponible.");
            }
        }
    }

    return (
        <div>
            <h2>Script</h2>
            <input type="file" onChange={handleOnChange} />

            <div className="status">
                <p><b>Nombre del script:</b> {file.name}</p>
                <p><b>Lenguaje del script:</b> {state.config?.language}</p>
                <p><b>Subtítulos:</b> {state.config?.subtitulos === "true" ? "Sí" : "No"}</p>
                <p><b>Estado actual:</b> {selectedAction + 1}</p>
            </div>

            <div className="actions" style={{ height: "150px", overflowY: "scroll", border: "solid 1px #000" }}>
                {state.actions?.map(({ id }, i) => (
                    <h3
                        onClick={() => setSelectedAction(i)}
                        style={{ backgroundColor: selectedAction === i ? "red" : "" }}
                        key={id}
                    >
                        {id}
                    </h3>
                ))}
            </div>

            <div className="button-group">
                <button id="before" onClick={handleClicSelectAction}> &lt;&lt; </button>
                <button onClick={handleExecuteAction}>Iniciar</button>
                <button id="after" onClick={handleClicSelectAction}> &gt;&gt; </button>
            </div>

            {showSubtitle && (
                <div style={{
                    marginTop: '20px',
                    padding: '10px',
                    backgroundColor: '#ffffcc',
                    borderRadius: '5px',
                    textAlign: 'center'
                }}>
                    <ShowWordsTablet text={showSubtitle} />
                </div>
            )}

            <h2>Consola</h2>
            <div className="console" style={{ height: "150px", overflowY: "scroll", border: "solid 1px #000" }}>
                {logMessages.map((item, i) => (
                    <p key={i}>{item}</p>
                ))}
            </div>
        </div>
    );
};

export default ScriptPanel;