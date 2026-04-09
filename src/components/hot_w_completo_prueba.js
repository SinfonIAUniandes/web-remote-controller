import React, { useState, useEffect, useRef } from 'react';
import { useRos } from '../contexts/RosContext';
import { createService, createTopic } from '../services/RosManager';
import * as ROSLIB from 'roslib';

// hot words ya establecidas
const DEFAULT_HOTWORDS = [
  {
    id: 1,
    word: 'hola',
    threshold: 0.4,
    response: '¡Hola! Un gusto conocerte. Soy Pepper, ¿en qué puedo ayudarte hoy?',
    active: true,
  },
  {
    id: 2,
    word: 'preséntate',
    threshold: 0.4,
    response:
      'Claro que sí. Soy, un robot diseñado para interactuar con personas. Me alegra estar aquí contigo en este evento.',
    active: true,
  },
  {
    id: 3,
    word: 'chao',
    threshold: 0.38,
    response: '¡Hasta luego! Fue un placer hablar contigo. Espero verte pronto.',
    active: true,
  },
];

//estilos
const styles = {
  root: {
    fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
    background: '#0a0e1a',
    minHeight: '100vh',
    color: '#c8d8f0',
    padding: '24px',
    boxSizing: 'border-box',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    marginBottom: '28px',
    borderBottom: '1px solid #1e3a5f',
    paddingBottom: '16px',
  },
  headerDot: (active) => ({
    width: 12,
    height: 12,
    borderRadius: '50%',
    background: active ? '#00ff9d' : '#ff4466',
    boxShadow: active ? '0 0 10px #00ff9d' : '0 0 10px #ff4466',
    flexShrink: 0,
  }),
  title: {
    fontSize: '13px',
    letterSpacing: '0.2em',
    textTransform: 'uppercase',
    color: '#4a9eff',
    margin: 0,
  },
  subtitle: {
    fontSize: '11px',
    color: '#445566',
    margin: '2px 0 0',
    letterSpacing: '0.1em',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
    marginBottom: '20px',
  },
  panel: {
    background: '#0d1520',
    border: '1px solid #1e3a5f',
    borderRadius: '4px',
    padding: '16px',
  },
  panelTitle: {
    fontSize: '10px',
    letterSpacing: '0.18em',
    textTransform: 'uppercase',
    color: '#4a9eff',
    marginBottom: '14px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '10px',
    fontSize: '12px',
  },
  label: { color: '#7a99bb', letterSpacing: '0.05em' },
  toggleBtn: (on) => ({
    background: 'none',
    border: `1px solid ${on ? '#00ff9d' : '#334466'}`,
    color: on ? '#00ff9d' : '#445566',
    borderRadius: '3px',
    padding: '4px 14px',
    fontSize: '10px',
    letterSpacing: '0.15em',
    cursor: 'pointer',
    textTransform: 'uppercase',
    transition: 'all 0.2s',
    boxShadow: on ? '0 0 8px rgba(0,255,157,0.2)' : 'none',
  }),
  select: {
    background: '#0a0e1a',
    border: '1px solid #1e3a5f',
    color: '#c8d8f0',
    borderRadius: '3px',
    padding: '4px 8px',
    fontSize: '11px',
    fontFamily: 'inherit',
  },
  hwCard: (active) => ({
    background: active ? '#0d1a2e' : '#0a0e1a',
    border: `1px solid ${active ? '#1e4a7f' : '#141e2e'}`,
    borderLeft: `3px solid ${active ? '#4a9eff' : '#1e3a5f'}`,
    borderRadius: '3px',
    padding: '12px',
    marginBottom: '10px',
    transition: 'all 0.2s',
  }),
  hwHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '8px',
  },
  hwWord: {
    fontSize: '13px',
    color: '#4a9eff',
    fontWeight: 'bold',
    letterSpacing: '0.1em',
  },
  hwBadge: (active) => ({
    fontSize: '9px',
    letterSpacing: '0.15em',
    textTransform: 'uppercase',
    color: active ? '#00ff9d' : '#445566',
    border: `1px solid ${active ? '#00ff9d44' : '#22334455'}`,
    borderRadius: '2px',
    padding: '2px 8px',
    cursor: 'pointer',
    background: 'none',
    fontFamily: 'inherit',
  }),
  hwResponse: {
    fontSize: '11px',
    color: '#7a99bb',
    lineHeight: 1.5,
    borderTop: '1px solid #1e3a5f',
    paddingTop: '8px',
    marginTop: '4px',
  },
  input: {
    background: '#0a0e1a',
    border: '1px solid #1e3a5f',
    color: '#c8d8f0',
    borderRadius: '3px',
    padding: '6px 10px',
    fontSize: '11px',
    fontFamily: 'inherit',
    width: '100%',
    boxSizing: 'border-box',
    outline: 'none',
  },
  textarea: {
    background: '#0a0e1a',
    border: '1px solid #1e3a5f',
    color: '#c8d8f0',
    borderRadius: '3px',
    padding: '6px 10px',
    fontSize: '11px',
    fontFamily: 'inherit',
    width: '100%',
    boxSizing: 'border-box',
    resize: 'vertical',
    minHeight: '60px',
    outline: 'none',
  },
  addBtn: {
    background: 'none',
    border: '1px dashed #1e4a7f',
    color: '#4a9eff',
    borderRadius: '3px',
    padding: '8px',
    fontSize: '10px',
    letterSpacing: '0.15em',
    cursor: 'pointer',
    width: '100%',
    textTransform: 'uppercase',
    fontFamily: 'inherit',
    marginTop: '6px',
  },
  sendBtn: {
    background: '#0d1a2e',
    border: '1px solid #4a9eff',
    color: '#4a9eff',
    borderRadius: '3px',
    padding: '4px 10px',
    fontSize: '10px',
    cursor: 'pointer',
    fontFamily: 'inherit',
    letterSpacing: '0.1em',
    marginTop: '6px',
  },
  logPanel: {
    background: '#050810',
    border: '1px solid #1e3a5f',
    borderRadius: '4px',
    padding: '14px',
    maxHeight: '180px',
    overflowY: 'auto',
    fontFamily: 'inherit',
    fontSize: '11px',
  },
  logEntry: (type) => ({
    color: type === 'detect' ? '#00ff9d' : type === 'error' ? '#ff4466' : '#445566',
    marginBottom: '4px',
    letterSpacing: '0.03em',
  }),
  activateBtn: (on) => ({
    background: on ? '#001a0d' : '#0a0e1a',
    border: `1px solid ${on ? '#00ff9d' : '#334466'}`,
    color: on ? '#00ff9d' : '#556677',
    borderRadius: '3px',
    padding: '8px 22px',
    fontSize: '11px',
    letterSpacing: '0.15em',
    cursor: 'pointer',
    textTransform: 'uppercase',
    fontFamily: 'inherit',
    boxShadow: on ? '0 0 16px rgba(0,255,157,0.15)' : 'none',
    transition: 'all 0.25s',
  }),
  thresholdInput: {
    background: '#0a0e1a',
    border: '1px solid #1e3a5f',
    color: '#7a99bb',
    borderRadius: '3px',
    padding: '2px 6px',
    fontSize: '11px',
    fontFamily: 'inherit',
    width: '60px',
  },
};

//  Component 
const HotWords = () => {
  const { ros } = useRos();

  // Service states
  const [subscribe, setSubscribe] = useState(false);
  const [noise, setNoise] = useState(false);
  const [eyes, setEyes] = useState(false);
  const [language, setLanguage] = useState('Spanish');

  // HotWords config
  const [hotwords, setHotwords] = useState(DEFAULT_HOTWORDS);
  const [editingId, setEditingId] = useState(null);

  // New word form
  const [newWord, setNewWord] = useState('');
  const [newResponse, setNewResponse] = useState('');
  const [newThreshold, setNewThreshold] = useState('0.4');
  const [showAddForm, setShowAddForm] = useState(false);

  // Log
  const [log, setLog] = useState([{ type: 'info', msg: 'Sistema listo. En espera.' }]);
  const logRef = useRef(null);

  const [hearing, setHearing] = useState(false);

  const addLog = (msg, type = 'info') => {
    const ts = new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLog((prev) => [...prev.slice(-50), { type, msg: `[${ts}] ${msg}` }]);
  };

  // Auto-scroll log
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [log]);

  // suscribirse al servicio
  useEffect(() => {
    if (!ros || !subscribe) return;

    const topic = new ROSLIB.Topic({
      ros,
      name: '/pytoolkit/ALSpeechRecognition/status',
      messageType: 'robot_toolkit_msgs/speech_recognition_status_msg',
    });

    const callback = (msg) => {
      const detected = msg.status;
      addLog(`Detectado: "${detected}"`, 'detect');

      const match = hotwords.find(
        (hw) => hw.active && hw.word.toLowerCase() === detected.toLowerCase()
      );

      if (match && !hearing) {
        setHearing(true);
        addLog(`Respondiendo a "${match.word}"...`, 'info');
        speakResponse(match.response);
        setTimeout(() => setHearing(false), 3000);
      } else if (!match) {
        addLog(`Sin respuesta configurada para "${detected}"`, 'info');
      }
    };

    topic.subscribe(callback);
    addLog('Suscrito al tópico de reconocimiento.');

    return () => {
      topic.unsubscribe();
      addLog('Desuscrito del tópico.');
    };
    
  }, [ros, subscribe, hotwords, hearing]);

  //  hablar/speech topic 
  const speakResponse = (text) => {
    if (!ros) return;
    const speechTopic = new ROSLIB.Topic({
      ros,
      name: '/speech',
      messageType: 'robot_toolkit_msgs/speech_msg',
    });
    const message = new ROSLIB.Message({ language, text, animated: true });
    speechTopic.publish(message);
  };

  //  Call set_speechrecognition_srv 
  const callSpeechRecognition = (newSub, newNoise, newEyes) => {
    if (!ros) { addLog('ROS no conectado.', 'error'); return; }
    const service = createService(
      ros,
      '/pytoolkit/ALSpeechRecognition/set_speechrecognition_srv',
      'pytoolkit/set_speechrecognition_srv'
    );
    service.callService(
      { subscribe: newSub, noise: newNoise, eyes: newEyes },
      () => {
        setSubscribe(newSub);
        setNoise(newNoise);
        setEyes(newEyes);
        addLog(`HotWords ${newSub ? 'activadas' : 'desactivadas'}.`);
      },
      (err) => addLog(`Error SpeechRecognition: ${err}`, 'error')
    );
  };

  //  Call set_hot_word_language_srv 
  const callLanguageService = (lang) => {
    if (!ros) { addLog('ROS no conectado.', 'error'); return; }
    const service = createService(
      ros,
      '/pytoolkit/ALSpeechRecognition/set_hot_word_language_srv',
      'pytoolkit/set_hot_word_language_srv'
    );
    service.callService(
      { url: lang },
      () => { setLanguage(lang); addLog(`Idioma cambiado a ${lang}.`); },
      (err) => addLog(`Error idioma: ${err}`, 'error')
    );
  };

  //  lista hotwords al robot (con tm) 
  const pushHotwordsToRobot = () => {
    if (!ros) { addLog('ROS no conectado.', 'error'); return; }
    const activeWords = hotwords.filter((hw) => hw.active);
    const words = activeWords.map((hw) => hw.word);
    const thresholds = activeWords.map((hw) => parseFloat(hw.threshold));

    // This calls the equivalent of tm.hot_word(words, thresholds)
    const service = createService(
      ros,
      '/speech_utilities/hot_word_srv',
      'speech_utilities/hot_word_srv'
    );
    service.callService(
      { words, noise, eyes, thresholds },
      () => addLog(`HotWords enviadas al robot: [${words.join(', ')}]`),
      (err) => addLog(`Error enviando words: ${err}`, 'error')
    );
  };

  // crud
  const toggleWordActive = (id) => {
    setHotwords((prev) =>
      prev.map((hw) => (hw.id === id ? { ...hw, active: !hw.active } : hw))
    );
  };

  const updateWord = (id, field, value) => {
    setHotwords((prev) =>
      prev.map((hw) => (hw.id === id ? { ...hw, [field]: value } : hw))
    );
  };

  const deleteWord = (id) => {
    setHotwords((prev) => prev.filter((hw) => hw.id !== id));
    addLog('HotWord eliminada.');
  };

  const addHotword = () => {
    if (!newWord.trim() || !newResponse.trim()) return;
    const newHw = {
      id: Date.now(),
      word: newWord.trim().toLowerCase(),
      threshold: parseFloat(newThreshold) || 0.4,
      response: newResponse.trim(),
      active: true,
    };
    setHotwords((prev) => [...prev, newHw]);
    setNewWord('');
    setNewResponse('');
    setNewThreshold('0.4');
    setShowAddForm(false);
    addLog(`Nueva HotWord añadida: "${newHw.word}"`);
  };

  // vista
  return (
    <div style={styles.root}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerDot(subscribe)} />
        <div>
          <p style={styles.title}>Pepper · Interface Control — HotWords</p>
          <p style={styles.subtitle}>Semillero de Investigación · Robots Pepper</p>
        </div>
      </div>

      {/* Top grid: controls + status */}
      <div style={styles.grid}>
        {/* Left: Main controls */}
        <div style={styles.panel}>
          <p style={styles.panelTitle}>⬡ Control principal</p>

          <div style={styles.row}>
            <span style={styles.label}>Estado HotWords</span>
            <button
              style={styles.activateBtn(subscribe)}
              onClick={() => callSpeechRecognition(!subscribe, noise, eyes)}
            >
              {subscribe ? '● Activo' : '○ Inactivo'}
            </button>
          </div>

          <div style={styles.row}>
            <span style={styles.label}>Idioma</span>
            <select
              style={styles.select}
              value={language}
              onChange={(e) => callLanguageService(e.target.value)}
            >
              <option value="Spanish">Español</option>
              <option value="English">English</option>
            </select>
          </div>

          <div style={styles.row}>
            <span style={styles.label}>Noise cancel</span>
            <button
              style={styles.toggleBtn(noise)}
              onClick={() => callSpeechRecognition(subscribe, !noise, eyes)}
            >
              {noise ? 'ON' : 'OFF'}
            </button>
          </div>

          <div style={styles.row}>
            <span style={styles.label}>Eyes feedback</span>
            <button
              style={styles.toggleBtn(eyes)}
              onClick={() => callSpeechRecognition(subscribe, noise, !eyes)}
            >
              {eyes ? 'ON' : 'OFF'}
            </button>
          </div>

          <hr style={{ borderColor: '#1e3a5f', margin: '12px 0' }} />

          <button style={styles.sendBtn} onClick={pushHotwordsToRobot}>
            ↑ Enviar HotWords al robot
          </button>
        </div>

        {/* Right: Log */}
        <div style={styles.panel}>
          <p style={styles.panelTitle}>⬡ Log de actividad</p>
          <div style={styles.logPanel} ref={logRef}>
            {log.map((entry, i) => (
              <div key={i} style={styles.logEntry(entry.type)}>
                {entry.msg}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* HotWords list */}
      <div style={styles.panel}>
        <p style={styles.panelTitle}>
          ⬡ HotWords configuradas
          <span style={{ color: '#445566', fontWeight: 'normal' }}>
            — {hotwords.filter((h) => h.active).length} activas de {hotwords.length}
          </span>
        </p>

        {hotwords.map((hw) => (
          <div key={hw.id} style={styles.hwCard(hw.active)}>
            <div style={styles.hwHeader}>
              <span style={styles.hwWord}>"{hw.word}"</span>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                {/* Threshold */}
                <input
                  style={styles.thresholdInput}
                  type="number"
                  min="0"
                  max="1"
                  step="0.01"
                  value={hw.threshold}
                  title="Umbral de confianza"
                  onChange={(e) => updateWord(hw.id, 'threshold', e.target.value)}
                />
                <button
                  style={styles.hwBadge(hw.active)}
                  onClick={() => toggleWordActive(hw.id)}
                >
                  {hw.active ? 'activa' : 'inactiva'}
                </button>
                <button
                  style={{ ...styles.hwBadge(false), color: '#ff4466', borderColor: '#ff446644' }}
                  onClick={() => deleteWord(hw.id)}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Editable response */}
            {editingId === hw.id ? (
              <div>
                <textarea
                  style={styles.textarea}
                  value={hw.response}
                  onChange={(e) => updateWord(hw.id, 'response', e.target.value)}
                />
                <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                  <button style={styles.sendBtn} onClick={() => { setEditingId(null); addLog(`Respuesta de "${hw.word}" actualizada.`); }}>
                    ✓ Guardar
                  </button>
                  <button style={{ ...styles.sendBtn, color: '#445566', borderColor: '#1e3a5f' }} onClick={() => setEditingId(null)}>
                    Cancelar
                  </button>
                  <button style={{ ...styles.sendBtn, marginLeft: 'auto' }} onClick={() => speakResponse(hw.response)}>
                    ▷ Probar
                  </button>
                </div>
              </div>
            ) : (
              <div style={styles.hwResponse} onClick={() => setEditingId(hw.id)}>
                {hw.response}
                <span style={{ color: '#334455', marginLeft: '8px', fontSize: '10px', cursor: 'pointer' }}>
                  [editar]
                </span>
              </div>
            )}
          </div>
        ))}

        {/* Add new HotWord */}
        {showAddForm ? (
          <div style={{ ...styles.hwCard(false), borderLeft: '3px dashed #1e4a7f' }}>
            <div style={{ marginBottom: '8px' }}>
              <p style={{ fontSize: '10px', color: '#445566', margin: '0 0 4px', letterSpacing: '0.1em' }}>
                PALABRA CLAVE
              </p>
              <input
                style={styles.input}
                placeholder='ej: "ayuda"'
                value={newWord}
                onChange={(e) => setNewWord(e.target.value)}
              />
            </div>
            <div style={{ marginBottom: '8px' }}>
              <p style={{ fontSize: '10px', color: '#445566', margin: '0 0 4px', letterSpacing: '0.1em' }}>
                RESPUESTA DEL ROBOT
              </p>
              <textarea
                style={styles.textarea}
                placeholder="Lo que Pepper dirá cuando escuche la palabra..."
                value={newResponse}
                onChange={(e) => setNewResponse(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span style={{ fontSize: '10px', color: '#445566' }}>Umbral:</span>
              <input
                style={styles.thresholdInput}
                type="number"
                min="0"
                max="1"
                step="0.01"
                value={newThreshold}
                onChange={(e) => setNewThreshold(e.target.value)}
              />
              <button style={styles.sendBtn} onClick={addHotword}>+ Añadir</button>
              <button
                style={{ ...styles.sendBtn, color: '#445566', borderColor: '#1e3a5f' }}
                onClick={() => setShowAddForm(false)}
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <button style={styles.addBtn} onClick={() => setShowAddForm(true)}>
            + Nueva HotWord
          </button>
        )}
      </div>
    </div>
  );
};

export default HotWords;