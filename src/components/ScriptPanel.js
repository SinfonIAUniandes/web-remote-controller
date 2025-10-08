import { useState } from 'react';
import { useRos } from '../contexts/RosContext';
import { createTopic } from '../services/RosManager';
import * as ROSLIB from 'roslib';

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
    const [state, setState] = useState({ config: {}, actions: [] });
    const [selectedAction, setSelectedAction] = useState(0);
    const [logMessages, setLogMessages] = useState([]);

    const { ros } = useRos();
    const speechTopic = createTopic(ros, '/speech', 'robot_toolkit_msgs/speech_msg');
    const animationTopic = createTopic(ros, "/animations", "robot_toolkit_msgs/animation_msg");
    const subtitleTopic = createTopic(ros, '/tablet_say', 'std_msgs/String');

    const handleOnChange = (event) => {
        if (event.target.files.length > 1) {
            alert('Solo se puede seleccionar un archivo');
            return;
        }

        const file = event.target.files[0];
        setFile(file);

        const reader = new FileReader();

        reader.onload = (e) => {
            const parsed = parseContent(e.target.result);
            setState(parsed);
            setLogMessages([...logMessages, "✅ Archivo cargado con éxito"]);
        };

        reader.onerror = (err) => {
            console.error("Error al leer el archivo:", err);
            setLogMessages([...logMessages, "❌ Error al cargar el archivo"]);
        };

        reader.readAsText(file);
    };

    const handleClicSelectAction = (event) => {
        const todo = event.target.id;
        const limit = state.actions.length;

        if (todo === 'before' && selectedAction > 0) {
            setSelectedAction(selectedAction - 1);
        } else if (todo === 'after' && selectedAction < limit - 1) {
            setSelectedAction(selectedAction + 1);
        }
    };

    const handleExecuteAction = () => {
        if (!ros || !state.actions.length) return;

        const action = state.actions[selectedAction];
        const lang = state.config.language || "Spanish";
        const subtitulos = state.config.subtitulos === "true";
        const mostrarImagen = state.config.img === "true";

        if (action.text) {
            const speechMsg = new ROSLIB.Message({
                language: lang,
                text: action.text,
                animated: !action.action // animado solo si no hay acción
            });
            speechTopic.publish(speechMsg);
            setLogMessages(log => [...log, `🗣️ Speech: ${action.text}`]);

            if (subtitulos && subtitleTopic) {
                const subtitleMsg = new ROSLIB.Message({ data: action.text });
                subtitleTopic.publish(subtitleMsg);
            }
        }

        if (action.action) {
            const animMsg = new ROSLIB.Message({
                family: "animations",
                animation_name: action.action
            });
            animationTopic.publish(animMsg);
            setLogMessages(log => [...log, `🤖 Animación: ${action.action}`]);
        }
    };

    return (
        <div style={{ padding: '20px' }}>
            <h2>📜 Script (formato .txt)</h2>
            <input type="file" onChange={handleOnChange} />

            <div className="status" style={{ marginTop: '10px' }}>
                <p><b>Archivo:</b> {file.name}</p>
                <p><b>Idioma:</b> {state.config?.language || 'N/A'}</p>
                <p><b>Acción actual:</b> {selectedAction + 1} / {state.actions.length}</p>
            </div>

            {/* Mostrar imagen si está activo img=true en config */}
            {state.config.img === "true" && state.actions[selectedAction]?.text && (
                <div style={{ margin: '10px 0' }}>
                    <p>🖼 Imagen actual:</p>
                    <img src={state.actions[selectedAction].text} alt="Imagen" style={{ maxHeight: '200px' }} />
                </div>
            )}

            <div className="actions" style={{ height: "150px", overflowY: "scroll", border: "1px solid #000", marginTop: '10px' }}>
                {state.actions.map(({ id, action }, i) => (
                    <div
                        key={id}
                        onClick={() => setSelectedAction(i)}
                        style={{
                            backgroundColor: selectedAction === i ? "#cce5ff" : "white",
                            padding: "5px",
                            cursor: "pointer"
                        }}
                    >
                        <b>{id}</b> - {action || "🗣️ Texto"}
                    </div>
                ))}
            </div>

            <div className="button-group" style={{ marginTop: '10px' }}>
                <button id="before" onClick={handleClicSelectAction}> ⬅ </button>
                <button onClick={handleExecuteAction}>▶ Ejecutar</button>
                <button id="after" onClick={handleClicSelectAction}> ➡ </button>
            </div>

            <h3>📋 Consola</h3>
            <div className="console" style={{ height: "150px", overflowY: "scroll", border: "solid 1px #000", padding: '5px' }}>
                {logMessages.map((msg, i) => (
                    <p key={i}>{msg}</p>
                ))}
            </div>
        </div>
    );
};

export default ScriptPanel;