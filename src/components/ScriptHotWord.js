import { useRef, useState, useEffect } from 'react';
import { useRos } from '../contexts/RosContext';
import { executeScript, executeStep, parseLegacyTxt, stopSpeech } from '../services/scriptExecutor';
import { createService, createTopic } from '../services/RosManager';
import { useAnimations } from '../hooks/useAnimations';
import { COLORS, TYPOGRAPHY } from '../theme';

// ── Constantes ────────────────────────────────────────────────────────────────

const LANGUAGES = ['Spanish', 'English', 'French', 'German'];

const SCREEN_TYPES = [
    { value: 'none',     label: 'Ninguna' },
    { value: 'subtitle', label: 'Subtítulo' },
    { value: 'image',    label: 'Imagen (URL)' },
    { value: 'video',    label: 'Video (archivo)' },
    { value: 'web',      label: 'Página web (URL)' },
];

const createEmptyStep = () => ({
    speech:    '',
    animation: '',
    screen:    null,
});

// ── Componente ────────────────────────────────────────────────────────────────

const ScriptHotWords = () => {
    const { ros } = useRos();
    const { getAllAnimations } = useAnimations();

    // Config del script
    const [config,   setConfig] = useState({ name: 'mi_script', language: 'Spanish' });
    const [steps,    setSteps]  = useState([]);

    // Hotword global (una sola que dispara todos los pasos)
    const [hotword, setHotword] = useState('');

    // Ejecución de pasos
    const [isExecuting,      setIsExecuting]      = useState(false);
    const [executingIndex,   setExecutingIndex]   = useState(null);
    const [singleStepIndex,  setSingleStepIndex]  = useState(null);
    const [completedStepIndex, setCompletedStepIndex] = useState(null);
    const abortRef       = useRef(null);
    const singleAbortRef = useRef(null);

    // Estado HotWords
    const [hwActive, setHwActive] = useState(false);
    const [noise,    setNoise]    = useState(false);
    const [eyes,     setEyes]     = useState(false);
    const hwTopicRef = useRef(null);

    // Limpiar feedback de "completado" tras 2s
    useEffect(() => {
        if (completedStepIndex === null) return;
        const t = setTimeout(() => setCompletedStepIndex(null), 2000);
        return () => clearTimeout(t);
    }, [completedStepIndex]);

    // ── Suscripción HotWords ──────────────────────────────────────────────────

    useEffect(() => {
        if (!ros || !hwActive) {
            if (hwTopicRef.current) {
                hwTopicRef.current.unsubscribe();
                hwTopicRef.current = null;
            }
            return;
        }

        const topic = createTopic(
            ros,
            '/pytoolkit/ALSpeechRecognition/status',
            'robot_toolkit_msgs/speech_recognition_status_msg'
        );

        topic.subscribe((msg) => {
            const detected = msg.status.toLowerCase().trim();
            console.log('HotWord detected:', detected);

            if (detected === hotword.toLowerCase().trim()) {
                // Ejecutar todos los pasos en secuencia
                handleExecuteAll();
            }
        });

        hwTopicRef.current = topic;

        return () => {
            if (hwTopicRef.current) {
                hwTopicRef.current.unsubscribe();
                hwTopicRef.current = null;
            }
        };
    }, [ros, hwActive, hotword, steps, config.language]);

    // ── Servicios HotWords ────────────────────────────────────────────────────

    const callSpeechRecognition = (newSubscribe, newNoise, newEyes) =>
        new Promise((resolve, reject) => {
            if (!ros) return reject(new Error('ROS not connected'));
            const service = createService(
                ros,
                '/pytoolkit/ALSpeechRecognition/set_speechrecognition_srv',
                'pytoolkit/set_speechrecognition_srv'
            );
            service.callService(
                { subscribe: newSubscribe, noise: newNoise, eyes: newEyes },
                (result) => { console.log('SpeechRecognition:', result); resolve(result); },
                (err)    => { console.error(err); reject(err); }
            );
        });

    const callUrlService = (lang) =>
        new Promise((resolve, reject) => {
            if (!ros) return reject(new Error('ROS not connected'));
            const service = createService(
                ros,
                '/pytoolkit/ALSpeechRecognition/set_hot_word_language_srv',
                'pytoolkit/set_hot_word_language_srv'
            );
            service.callService(
                { url: lang },
                (result) => { console.log('Lang set:', result); resolve(result); },
                (err)    => { console.error(err); reject(err); }
            );
        });

    const sendVocabulary = (word) =>
        new Promise((resolve, reject) => {
            if (!ros) return reject(new Error('ROS not connected'));
            const service = createService(
                ros,
                '/pytoolkit/ALSpeechRecognition/set_words_srv',
                'pytoolkit/set_words_threshold_srv'
            );
            service.callService(
                {
                    words:     [word.toLowerCase().trim()],
                    threshold: [0.35],
                },
                (result) => { console.log('Vocabulary sent:', result); resolve(result); },
                (err)    => { console.error(err); reject(err); }
            );
        });

    // ── Toggle HotWords ───────────────────────────────────────────────────────

    const toggleHotWords = async () => {
        const newState = !hwActive;

        if (!newState) {
            try { await callSpeechRecognition(false, noise, eyes); }
            catch (err) { console.error('Error deactivating:', err); }
            setHwActive(false);
            return;
        }

        if (hotword.trim() === '') {
            alert('Escribe una hotword antes de activar.');
            return;
        }

        if (steps.length === 0) {
            alert('Agrega al menos un paso al script antes de activar.');
            return;
        }

        try {
            await callSpeechRecognition(true, noise, eyes);
            await callUrlService(config.language);
            try {
                await sendVocabulary(hotword);
            } catch (err) {
                console.warn('sendVocabulary failed, retrying...', err);
                try {
                    await callSpeechRecognition(false, noise, eyes);
                    await sendVocabulary(hotword);
                    await callSpeechRecognition(true, noise, eyes);
                } catch (retryErr) {
                    console.error('Retry failed:', retryErr);
                }
            }
            setHwActive(true);
        } catch (err) {
            console.error('Error activating hotwords:', err);
        }
    };

    // ── Ejecución de todos los pasos ──────────────────────────────────────────

    const handleExecuteAll = async () => {
        if (!ros || isExecuting || steps.length === 0) return;
        const ctrl = new AbortController();
        abortRef.current = ctrl;
        setIsExecuting(true);
        try {
            await executeScript(ros, steps, config.language, {
                onStepStart: setExecutingIndex,
                signal: ctrl.signal,
            });
        } finally {
            setIsExecuting(false);
            setExecutingIndex(null);
            abortRef.current = null;
        }
    };

    const handleStopAll = () => {
        abortRef.current?.abort();
        stopSpeech(ros);
    };

    // ── Ejecución de paso individual ──────────────────────────────────────────

    const handleExecuteStep = async (index) => {
        if (!ros || singleStepIndex !== null) return;
        const ctrl = new AbortController();
        singleAbortRef.current = ctrl;
        setSingleStepIndex(index);
        setCompletedStepIndex(null);
        try {
            const topics = {
                speechTopic: createTopic(ros, '/speech',     'robot_toolkit_msgs/speech_msg'),
                animTopic:   createTopic(ros, '/animations', 'robot_toolkit_msgs/animation_msg'),
            };
            await new Promise(r => setTimeout(r, 150));
            await executeStep(ros, steps[index], config.language, ctrl.signal, topics);
            if (!ctrl.signal.aborted) setCompletedStepIndex(index);
        } finally {
            setSingleStepIndex(null);
            singleAbortRef.current = null;
        }
    };

    const handleStopStep = () => {
        singleAbortRef.current?.abort();
        stopSpeech(ros);
        setSingleStepIndex(null);
    };

    // ── Mutaciones de pasos ───────────────────────────────────────────────────

    const addStep = () => setSteps(prev => [...prev, createEmptyStep()]);

    const deleteStep = (i) => setSteps(prev => prev.filter((_, idx) => idx !== i));

    const moveStep = (i, dir) => {
        setSteps(prev => {
            const next   = [...prev];
            const target = i + dir;
            if (target < 0 || target >= next.length) return prev;
            [next[i], next[target]] = [next[target], next[i]];
            return next;
        });
    };

    const updateStep = (i, field, value) =>
        setSteps(prev => prev.map((s, idx) => idx === i ? { ...s, [field]: value } : s));

    const updateScreenType = (i, type) =>
        setSteps(prev => prev.map((s, idx) => {
            if (idx !== i) return s;
            return { ...s, screen: type === 'none' ? null : { type, content: '' } };
        }));

    const updateScreenContent = (i, content) =>
        setSteps(prev => prev.map((s, idx) =>
            idx === i ? { ...s, screen: { ...s.screen, content } } : s
        ));

    const handleVideoUpload = (i, file) => {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => updateScreenContent(i, e.target.result);
        reader.readAsDataURL(file);
    };

    // ── Carga / Descarga ──────────────────────────────────────────────────────

    const handleDownload = () => {
        const data = { config, hotword, steps };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href     = url;
        a.download = `${config.name}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleLoadScript = (event) => {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                let data;
                if (file.name.endsWith('.json')) {
                    data = JSON.parse(e.target.result);
                    if (!data.config || !Array.isArray(data.steps)) throw new Error();
                } else {
                    data = parseLegacyTxt(e.target.result, file.name);
                }
                setConfig(data.config);
                setSteps(data.steps);
                if (data.hotword) setHotword(data.hotword);
                event.target.value = '';
            } catch {
                alert('Error al cargar el archivo. Verifica el formato (.json o .txt).');
            }
        };
        reader.readAsText(file);
    };

    // ── Helpers ───────────────────────────────────────────────────────────────

    const allAnimations = getAllAnimations();
    const canActivate   = hotword.trim() !== '' && steps.length > 0;

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <div style={{ fontFamily: TYPOGRAPHY.FONT_FAMILY_PRINCIPAL, padding: '16px' }}>
            <h2 style={{ color: COLORS.AZUL_PRINCIPAL, marginBottom: '12px' }}>
                Script + HotWord
            </h2>

            {/* ── HEADER ── */}
            <div style={{
                display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'flex-end',
                padding: '12px', backgroundColor: COLORS.CELESTE_PRINCIPAL,
                borderRadius: '10px', marginBottom: '16px',
            }}>
                <div>
                    <label style={labelStyle}>Nombre</label>
                    <input
                        type="text" value={config.name}
                        onChange={e => setConfig({ ...config, name: e.target.value })}
                        style={{ ...inputStyle, width: '150px' }}
                    />
                </div>

                <div>
                    <label style={labelStyle}>Idioma</label>
                    <select
                        value={config.language}
                        onChange={e => setConfig({ ...config, language: e.target.value })}
                        style={{ ...inputStyle, width: '120px' }}
                    >
                        {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                </div>

                {/* HotWord global */}
                <div>
                    <label style={labelStyle}>HotWord</label>
                    <input
                        type="text"
                        value={hotword}
                        onChange={e => setHotword(e.target.value)}
                        placeholder="ej: hola"
                        disabled={hwActive}
                        style={{
                            ...inputStyle,
                            width: '130px',
                            backgroundColor: hwActive ? '#e9e9e9' : '#eef4ff',
                            border: `1px solid ${COLORS.AZUL_SECUNDARIO}`,
                        }}
                    />
                </div>

                <div>
                    <label style={labelStyle}>Cargar script</label>
                    <input id="load-input" type="file" accept=".json,.txt"
                        onChange={handleLoadScript} style={{ display: 'none' }} />
                    <button
                        onClick={() => document.getElementById('load-input').click()}
                        style={{ ...btnBase, backgroundColor: COLORS.AMARILLO, color: COLORS.AZUL_PRINCIPAL }}
                    >
                        Cargar .json / .txt
                    </button>
                </div>

                <button
                    onClick={handleDownload}
                    disabled={steps.length === 0}
                    style={{ ...btnBase, backgroundColor: COLORS.AZUL_SECUNDARIO, color: '#fff', alignSelf: 'flex-end' }}
                >
                    Descargar {config.name}.json
                </button>
            </div>

            {/* ── Banner paso individual ejecutándose ── */}
            {singleStepIndex !== null && (
                <div style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '8px 12px', marginBottom: '10px',
                    backgroundColor: '#fff8e1', border: `1px solid ${COLORS.AMARILLO}`,
                    borderRadius: '8px',
                }}>
                    <span style={{ fontSize: '13px', color: COLORS.AZUL_PRINCIPAL }}>
                        ▶ Ejecutando paso {singleStepIndex + 1}...
                    </span>
                    <button onClick={handleStopStep}
                        style={{ ...btnBase, backgroundColor: COLORS.ROJO, color: '#fff', padding: '4px 10px' }}>
                        Detener
                    </button>
                </div>
            )}

            {/* ── TABLA DE PASOS ── */}
            <div style={{ overflowX: 'auto', marginBottom: '12px' }}>
                {steps.length === 0 ? (
                    <div style={{
                        padding: '24px', textAlign: 'center',
                        color: COLORS.AZUL_PRINCIPAL, opacity: 0.5,
                        border: `2px dashed ${COLORS.AZUL_SECUNDARIO}`, borderRadius: '8px',
                    }}>
                        Sin pasos. Añade uno o carga un script.
                    </div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                        <thead>
                            <tr style={{ backgroundColor: COLORS.AZUL_PRINCIPAL, color: '#fff' }}>
                                <th style={th}>#</th>
                                <th style={th}>Speech</th>
                                <th style={th}>Animación</th>
                                <th style={th}>Pantalla</th>
                                <th style={th}>Contenido pantalla</th>
                                <th style={th}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {steps.map((step, i) => {
                                const isActive       = executingIndex === i;
                                const isSingleActive = singleStepIndex === i;
                                const isCompleted    = completedStepIndex === i;
                                const screenType     = step.screen?.type ?? 'none';

                                let rowBg = i % 2 === 0 ? '#fff' : '#f7f9ff';
                                if (isActive)       rowBg = '#e8fff3';
                                if (isSingleActive) rowBg = '#fffbe6';
                                if (isCompleted)    rowBg = '#d4f7e0';

                                return (
                                    <tr key={i} style={{
                                        backgroundColor: rowBg,
                                        borderLeft: isActive
                                            ? `4px solid ${COLORS.VERDE}`
                                            : isSingleActive
                                                ? `4px solid ${COLORS.AMARILLO}`
                                                : isCompleted
                                                    ? `4px solid ${COLORS.VERDE}`
                                                    : '4px solid transparent',
                                        transition: 'background-color 0.3s',
                                    }}>

                                        {/* Número */}
                                        <td style={{ ...td, textAlign: 'center', fontWeight: TYPOGRAPHY.FONT_WEIGHT_BOLD, color: COLORS.AZUL_PRINCIPAL, minWidth: '36px' }}>
                                            {isCompleted ? '✓' : (isActive || isSingleActive) ? '▶' : i + 1}
                                        </td>

                                        {/* Speech */}
                                        <td style={td}>
                                            <textarea
                                                value={step.speech}
                                                onChange={e => updateStep(i, 'speech', e.target.value)}
                                                placeholder="Texto a hablar..."
                                                rows={2}
                                                style={{ ...inputStyle, minWidth: '180px', resize: 'vertical' }}
                                            />
                                        </td>

                                        {/* Animación */}
                                        <td style={td}>
                                            <select
                                                value={step.animation}
                                                onChange={e => updateStep(i, 'animation', e.target.value)}
                                                style={{ ...inputStyle, minWidth: '140px' }}
                                            >
                                                <option value="">Ninguna</option>
                                                {allAnimations.map((path, idx) => (
                                                    <option key={idx} value={path}>{path}</option>
                                                ))}
                                            </select>
                                        </td>

                                        {/* Tipo pantalla */}
                                        <td style={td}>
                                            <select
                                                value={screenType}
                                                onChange={e => updateScreenType(i, e.target.value)}
                                                style={{ ...inputStyle, width: '130px' }}
                                            >
                                                {SCREEN_TYPES.map(({ value, label }) => (
                                                    <option key={value} value={value}>{label}</option>
                                                ))}
                                            </select>
                                        </td>

                                        {/* Contenido pantalla */}
                                        <td style={td}>
                                            {screenType === 'none' && (
                                                <span style={{ color: '#bbb', fontSize: '12px' }}>—</span>
                                            )}
                                            {screenType === 'subtitle' && (
                                                <span style={{ color: '#888', fontSize: '12px', fontStyle: 'italic' }}>
                                                    (usa el speech)
                                                </span>
                                            )}
                                            {(screenType === 'image' || screenType === 'web') && (
                                                <input
                                                    type="text"
                                                    value={step.screen?.content ?? ''}
                                                    onChange={e => updateScreenContent(i, e.target.value)}
                                                    placeholder={screenType === 'image' ? 'https://...' : 'https://...'}
                                                    style={{ ...inputStyle, minWidth: '180px' }}
                                                />
                                            )}
                                            {screenType === 'video' && (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                    <input type="file" accept="video/*"
                                                        onChange={e => handleVideoUpload(i, e.target.files[0])}
                                                        style={{ fontSize: '12px' }}
                                                    />
                                                    {step.screen?.content && (
                                                        <span style={{ fontSize: '11px', color: COLORS.VERDE }}>✓ Video cargado</span>
                                                    )}
                                                </div>
                                            )}
                                        </td>

                                        {/* Acciones */}
                                        <td style={{ ...td, whiteSpace: 'nowrap' }}>
                                            <button
                                                onClick={() => handleExecuteStep(i)}
                                                disabled={isExecuting || singleStepIndex !== null}
                                                title="Ejecutar este paso"
                                                style={{ ...btnBase, backgroundColor: COLORS.VERDE, color: '#fff', marginRight: '3px' }}
                                            >▶</button>
                                            <button
                                                onClick={() => moveStep(i, -1)} disabled={i === 0}
                                                title="Subir"
                                                style={{ ...btnBase, backgroundColor: '#e0e0e0', color: '#333', marginRight: '3px' }}
                                            >↑</button>
                                            <button
                                                onClick={() => moveStep(i, 1)} disabled={i === steps.length - 1}
                                                title="Bajar"
                                                style={{ ...btnBase, backgroundColor: '#e0e0e0', color: '#333', marginRight: '3px' }}
                                            >↓</button>
                                            <button
                                                onClick={() => deleteStep(i)} title="Eliminar"
                                                style={{ ...btnBase, backgroundColor: COLORS.ROJO, color: '#fff' }}
                                            >×</button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            {/* ── FOOTER TABLA ── */}
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '24px' }}>
                <button onClick={addStep}
                    style={{ ...btnBase, backgroundColor: COLORS.VERDE, color: '#fff' }}>
                    + Agregar paso
                </button>

                {!isExecuting ? (
                    <button
                        onClick={handleExecuteAll}
                        disabled={steps.length === 0}
                        style={{ ...btnBase, backgroundColor: COLORS.AZUL_SECUNDARIO, color: '#fff' }}
                    >
                        ▶▶ Ejecutar todo
                    </button>
                ) : (
                    <button onClick={handleStopAll}
                        style={{ ...btnBase, backgroundColor: COLORS.ROJO, color: '#fff' }}>
                        Detener todo
                    </button>
                )}

                {steps.length > 0 && (
                    <span style={{ fontSize: '13px', color: COLORS.AZUL_PRINCIPAL, opacity: 0.6, marginLeft: 'auto' }}>
                        {steps.length} paso{steps.length !== 1 ? 's' : ''}
                        {isExecuting ? ` · ejecutando paso ${(executingIndex ?? 0) + 1}` : ''}
                    </span>
                )}
            </div>

            {/* ── PANEL HOTWORDS ── */}
            <div style={{
                border: `1px solid ${COLORS.AZUL_SECUNDARIO}`,
                borderRadius: '10px', padding: '16px',
                backgroundColor: COLORS.CELESTE_PRINCIPAL,
            }}>
                <h3 style={{ color: COLORS.AZUL_PRINCIPAL, margin: '0 0 14px' }}>
                    Control de HotWord
                </h3>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'center', marginBottom: '14px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', cursor: 'pointer', color: COLORS.AZUL_PRINCIPAL }}>
                        <input type="checkbox" checked={noise} onChange={() => setNoise(!noise)} disabled={hwActive} />
                        Activar Noise
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', cursor: 'pointer', color: COLORS.AZUL_PRINCIPAL }}>
                        <input type="checkbox" checked={eyes} onChange={() => setEyes(!eyes)} disabled={hwActive} />
                        Activar Eyes
                    </label>
                </div>

                {/* Resumen de lo configurado */}
                {hotword.trim() !== '' && (
                    <p style={{ fontSize: '13px', color: COLORS.AZUL_PRINCIPAL, opacity: 0.8, margin: '0 0 14px' }}>
                        Al escuchar{' '}
                        <span style={{
                            backgroundColor: COLORS.AZUL_SECUNDARIO, color: '#fff',
                            padding: '2px 10px', borderRadius: '10px', fontSize: '12px',
                        }}>
                            {hotword}
                        </span>
                        {' '}→ ejecutará los {steps.length} paso{steps.length !== 1 ? 's' : ''} del script.
                    </p>
                )}

                {/* Botón ON/OFF */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <button
                        onClick={toggleHotWords}
                        disabled={!hwActive && !canActivate}
                        style={{
                            ...btnBase,
                            padding: '9px 20px',
                            backgroundColor: hwActive ? COLORS.ROJO : COLORS.VERDE,
                            color: '#fff',
                            opacity: (!hwActive && !canActivate) ? 0.5 : 1,
                            cursor: (!hwActive && !canActivate) ? 'not-allowed' : 'pointer',
                        }}
                    >
                        {hwActive ? 'Desactivar HotWord' : 'Activar HotWord'}
                    </button>

                    <span style={{
                        fontSize: '13px', fontWeight: TYPOGRAPHY.FONT_WEIGHT_SEMI_BOLD,
                        color: hwActive ? COLORS.VERDE : COLORS.AZUL_PRINCIPAL,
                        opacity: hwActive ? 1 : 0.5,
                    }}>
                        {hwActive ? '● ACTIVO' : '○ INACTIVO'}
                    </span>

                    {!hwActive && !canActivate && (
                        <span style={{ fontSize: '12px', color: COLORS.ROJO, opacity: 0.8 }}>
                            {hotword.trim() === '' ? 'Escribe una hotword arriba' : 'Agrega al menos un paso'}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};

// ── Estilos estáticos ─────────────────────────────────────────────────────────

const th = {
    padding: '8px 10px',
    textAlign: 'left',
    fontSize: '13px',
    whiteSpace: 'nowrap',
};

const td = {
    padding: '6px 8px',
    verticalAlign: 'middle',
    borderBottom: '1px solid #e0e6f0',
};

const labelStyle = {
    display: 'block',
    fontSize: '12px',
    fontWeight: 600,
    marginBottom: '3px',
};

const inputStyle = {
    padding: '4px 6px',
    border: '1px solid #aac',
    borderRadius: '4px',
    fontSize: '13px',
    width: '100%',
    boxSizing: 'border-box',
};

const btnBase = {
    padding: '6px 10px',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 600,
};

export default ScriptHotWords;