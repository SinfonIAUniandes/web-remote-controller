import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRos } from '../contexts/RosContext';
import { createService, createTopic } from '../services/RosManager';
import { executeScript, stopSpeech } from '../services/scriptExecutor';
import { COLORS, TYPOGRAPHY } from '../theme';

const LANGUAGES = ['ES', 'EN'];
const LANGUAGE_MAP = { 'ES': 'Spanish', 'EN': 'English' };

const HotWords = ({ scripts = [] }) => {
    const { ros } = useRos();

    // Lista de hotwords: cada una asocia una palabra a un script (por índice en scripts)
    const [hotwords, setHotwords] = useState([
        { id: 1, word: 'hola',  threshold: 0.35, scriptIndex: 0 },
        { id: 2, word: 'ayuda', threshold: 0.35, scriptIndex: 0 },
        { id: 3, word: 'baila', threshold: 0.35, scriptIndex: 0 },
    ]);

    const [subscribe, setSubscribe] = useState(false);
    const [noise, setNoise] = useState(false);
    const [eyes, setEyes] = useState(false);
    const [language, setLanguage] = useState('ES');
    const [showLangDropdown, setShowLangDropdown] = useState(false);

    // Modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingIndex, setEditingIndex] = useState(null);
    const [modalData, setModalData] = useState({ word: '', scriptIndex: 0, threshold: 0.35 });

    // Ejecución de scripts
    const [executingScriptId, setExecutingScriptId] = useState(null);
    const abortRef = useRef(null);

    const topicRef = useRef(null);
    const nextId = useRef(4);

    // --- Servicios ROS ---
    const callSpeechRecognition = useCallback((newSubscribe, newNoise, newEyes) =>
        new Promise((resolve, reject) => {
            if (!ros) return reject(new Error('ROS not connected'));
            const service = createService(
                ros,
                '/pytoolkit/ALSpeechRecognition/set_speechrecognition_srv',
                'pytoolkit/set_speechrecognition_srv'
            );
            service.callService(
                { subscribe: newSubscribe, noise: newNoise, eyes: newEyes },
                (result) => { 
                    console.log('SpeechRecognition:', result); 
                    resolve(result); 
                },
                (err)    => { console.error(err); reject(err); }
            );
        }), [ros]);

    const callLanguageService = useCallback((newLanguage) =>
        new Promise((resolve, reject) => {
            if (!ros) return reject(new Error('ROS not connected'));
            const service = createService(
                ros,
                '/pytoolkit/ALSpeechRecognition/set_hot_word_language_srv',
                'pytoolkit/set_hot_word_language_srv'
            );
            service.callService(
                { url: newLanguage },
                (result) => { console.log('Lang set:', result); resolve(result); },
                (err)    => { console.error(err); reject(err); }
            );
        }), [ros]);

    const sendVocabulary = useCallback(() =>
        new Promise((resolve, reject) => {
            if (!ros) return reject(new Error('ROS not connected'));
            if (hotwords.length === 0) return resolve(); // nada que enviar
            const service = createService(
                ros,
                '/pytoolkit/ALSpeechRecognition/set_words_srv',
                'robot_toolkit_msgs/set_words_threshold_srv'
            );
            service.callService(
                {
                    words:     hotwords.map(h => h.word.toLowerCase().trim()),
                    threshold: hotwords.map(h => h.threshold),
                },
                (result) => { console.log('Vocabulary sent:', result); resolve(result); },
                (err)    => { console.error(err); reject(err); }
            );
        }), [ros, hotwords]);

    // --- Ejecución de script (useCallback para estabilizar dependencias) ---
    const handleExecuteScript = useCallback(async (script, hotwordId) => {
        if (!ros || executingScriptId !== null) return;
        const ctrl = new AbortController();
        abortRef.current = ctrl;
        setExecutingScriptId(hotwordId);
        try {
            await executeScript(ros, script.steps, script.config.language, {
                signal: ctrl.signal,
                stepDelay: script.config.stepDelay || 3000,
            });
        } catch (err) {
            if (!abortRef.current?.signal.aborted) console.error('Error ejecutando script:', err);
        } finally {
            setExecutingScriptId(null);
            abortRef.current = null;
        }
    }, [ros, executingScriptId]);

    // --- Suscripción al tópico de reconocimiento ---
    useEffect(() => {
        if (!ros || !subscribe) {
            if (topicRef.current) {
                topicRef.current.unsubscribe();
                topicRef.current = null;
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

            const found = hotwords.find(
                h => h.word.toLowerCase().trim() === detected
            );

            if (found && scripts[found.scriptIndex]) {
                const script = scripts[found.scriptIndex];
                handleExecuteScript(script, found.id);
            }
        });

        topicRef.current = topic;

        return () => {
            if (topicRef.current) {
                topicRef.current.unsubscribe();
                topicRef.current = null;
            }
        };
    }, [ros, subscribe, hotwords, scripts, handleExecuteScript]);

    // Reenviar vocabulario automáticamente si cambia la lista mientras está activo
    useEffect(() => {
        if (ros && subscribe) {
            sendVocabulary().catch(err => console.warn('Error reenviando vocabulario:', err));
        }
    }, [ros, subscribe, hotwords, sendVocabulary]);

    // --- Toggle HotWords (activar/desactivar) ---
    const toggleSubscribe = async () => {
        const newState = !subscribe;

        if (!newState) {
            try { await callSpeechRecognition(false, noise, eyes); }
            catch (err) { console.error('Error deactivating:', err); }
            setSubscribe(false);
            return;
        }

        if (hotwords.length === 0) {
            alert('Agrega al menos una palabra para activar.');
            return;
        }

        try {
            await callSpeechRecognition(true, noise, eyes);
            await callLanguageService(LANGUAGE_MAP[language]);
            try {
                await sendVocabulary();
            } catch (err) {
                console.warn('sendVocabulary failed, retrying...', err);
                try {
                    await callSpeechRecognition(false, noise, eyes);
                    await sendVocabulary();
                    await callSpeechRecognition(true, noise, eyes);
                } catch (retryErr) {
                    console.error('Retry failed:', retryErr);
                }
            }
            setSubscribe(true);
        } catch (err) {
            console.error('Error activating hotwords:', err);
        }
    };

    // --- Gestión del modal (añadir/editar) ---
    const openConfigModal = (index = null) => {
        if (index !== null) {
            const hw = hotwords[index];
            setEditingIndex(index);
            setModalData({ word: hw.word, scriptIndex: hw.scriptIndex, threshold: hw.threshold });
        } else {
            setEditingIndex(null);
            setModalData({ word: '', scriptIndex: 0, threshold: 0.35 });
        }
        setIsModalOpen(true);
    };

    const handleSaveWord = () => {
        if (!modalData.word.trim()) return;
        const newList = [...hotwords];
        const newWord = {
            id: editingIndex !== null ? hotwords[editingIndex].id : nextId.current++,
            word: modalData.word.trim(),
            threshold: modalData.threshold,
            scriptIndex: modalData.scriptIndex,
        };
        if (editingIndex !== null) {
            newList[editingIndex] = newWord;
        } else {
            newList.push(newWord);
        }
        setHotwords(newList);
        setIsModalOpen(false);
    };

    const handleDeleteWord = () => {
        if (editingIndex !== null) {
            const newList = hotwords.filter((_, i) => i !== editingIndex);
            setHotwords(newList);
            setIsModalOpen(false);
        }
    };

    // Actualización local de Noise/Eyes (click inmediato)
    const handleNoiseToggle = () => {
        if (subscribe) {
            callSpeechRecognition(subscribe, !noise, eyes)
                .then(() => setNoise(!noise))
                .catch(console.error);
        } else {
            setNoise(!noise);
        }
    };

    const handleEyesToggle = () => {
        if (subscribe) {
            callSpeechRecognition(subscribe, noise, !eyes)
                .then(() => setEyes(!eyes))
                .catch(console.error);
        } else {
            setEyes(!eyes);
        }
    };

    const handleStopScript = () => {
        abortRef.current?.abort();
        stopSpeech(ros);
        setExecutingScriptId(null);
    };

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div style={{ width: '350px', height: '700px', position: 'relative', background: COLORS.AZUL_PRINCIPAL, borderRadius: '20px', overflow: 'hidden' }}>
            
            {/* Etiqueta título */}
            <div style={{ position: 'absolute', left: 0, top: '21px', width: '180px', height: '30px', paddingLeft: '19px', paddingRight: '19px', background: COLORS.CELESTE_PRINCIPAL, borderTopRightRadius: '25px', borderBottomRightRadius: '25px', display: 'flex', alignItems: 'center', zIndex: 2 }}>
                <span style={{ textAlign: 'center', width: '100%', fontFamily: TYPOGRAPHY.FONT_FAMILY_PRINCIPAL, fontWeight: TYPOGRAPHY.FONT_WEIGHT_BOLD, fontSize: '16px', color: COLORS.AZUL_PRINCIPAL }}>
                    Hot Words
                </span>
            </div>

            {/* Selector de idioma */}
            <div style={{ position: 'absolute', right: '20px', top: '24px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', zIndex: 10 }} onClick={() => setShowLangDropdown(v => !v)}>
                <span style={{ fontFamily: TYPOGRAPHY.FONT_FAMILY_PRINCIPAL, fontWeight: '700', fontSize: '12px', color: COLORS.CELESTE_PRINCIPAL }}>{language}</span>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M3 4.5L6 7.5L9 4.5" stroke={COLORS.CELESTE_PRINCIPAL} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                {showLangDropdown && (
                    <div style={{ position: 'absolute', top: '20px', right: 0, background: COLORS.CELESTE_PRINCIPAL, borderRadius: '8px', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.3)', zIndex: 20 }}>
                        {LANGUAGES.map(lang => (
                            <div key={lang} onClick={(e) => { e.stopPropagation(); setLanguage(lang); setShowLangDropdown(false); }} style={{ padding: '6px 16px', fontFamily: TYPOGRAPHY.FONT_FAMILY_PRINCIPAL, fontWeight: '700', fontSize: '12px', color: COLORS.AZUL_PRINCIPAL, cursor: 'pointer', background: lang === language ? 'rgba(0,33,75,0.12)' : 'transparent' }}>{lang}</div>
                        ))}
                    </div>
                )}
            </div>

            {/* Banner de script ejecutándose */}
            {executingScriptId !== null && (
                <div style={{
                    position: 'absolute', top: '55px', left: '20px', right: '20px',
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '6px 12px', backgroundColor: '#fff8e1',
                    border: `1px solid ${COLORS.AMARILLO}`, borderRadius: '8px',
                    zIndex: 5, fontSize: '12px', color: COLORS.AZUL_PRINCIPAL,
                    fontFamily: TYPOGRAPHY.FONT_FAMILY_PRINCIPAL, fontWeight: '700'
                }}>
                    ▶ Ejecutando script...
                    <button onClick={handleStopScript}
                        style={{ marginLeft: 'auto', padding: '2px 10px', borderRadius: '4px', border: 'none', background: COLORS.ROJO, color: '#fff', cursor: 'pointer', fontSize: '11px' }}>
                        Detener
                    </button>
                </div>
            )}

            {/* Controles de Noise y Eyes */}
            {[
                { label: 'Noise', state: noise, setter: handleNoiseToggle, top: 68 },
                { label: 'Eyes',  state: eyes, setter: handleEyesToggle, top: 112 }
            ].map((item) => (
                <div key={item.label} style={{ width: 207, height: 30, left: '71.5px', top: item.top + 20, position: 'absolute' }}>
                    <div style={{ left: 0, top: 4, position: 'absolute', color: COLORS.CELESTE_PRINCIPAL, fontSize: 16, fontFamily: 'Nunito', fontWeight: '700' }}>{item.label}</div>
                    <div 
                        onClick={item.setter}
                        style={{ width: 135, height: 30, left: 72, position: 'absolute', background: COLORS.CELESTE_PRINCIPAL, borderRadius: 25, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer', transition: 'background 0.2s', flexDirection: item.state ? 'row-reverse' : 'row', padding: '0 10px' }}
                    >
                        <div style={{ width: 20, height: 20, background: item.state ? '#28DE64' : COLORS.AZUL_PRINCIPAL, borderRadius: '50%', transition: 'background 0.2s' }} />
                        <div style={{ color: COLORS.AZUL_PRINCIPAL, fontSize: 12, fontFamily: 'Nunito', fontWeight: '700' }}>{item.state ? 'ACTIVO' : 'HABILITAR'}</div>
                    </div>
                </div>
            ))}

            {/* Botón ACTIVAR HOTWORDS */}
            <div 
                onClick={toggleSubscribe}
                style={{ width: 210, height: 30, left: '70px', top: 200, position: 'absolute', background: COLORS.CELESTE_PRINCIPAL, borderRadius: 25, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 10px', cursor: 'pointer', transition: 'background 0.2s', flexDirection: subscribe ? 'row-reverse' : 'row' }}
            >
                <div style={{ width: 20, height: 20, background: subscribe ? '#28DE64' : COLORS.AZUL_PRINCIPAL, borderRadius: '50%', transition: 'background 0.2s' }} />
                <div style={{ color: COLORS.AZUL_PRINCIPAL, fontSize: 12, fontFamily: 'Nunito', fontWeight: '700', flex: 1, textAlign: 'center' }}>
                    {subscribe ? 'DESACTIVAR HOTWORDS' : 'ACTIVAR HOTWORDS'}
                </div>
            </div>

            {/* Sección Vocabulario */}
            <div style={{ width: '100%', textAlign: 'center', top: 260, position: 'absolute', color: COLORS.CELESTE_PRINCIPAL, fontSize: 16, fontFamily: 'Nunito', fontWeight: '700' }}>
                Palabras configuradas
                <div 
                    onClick={() => openConfigModal()}
                    style={{ width: 25, height: 25, display: 'inline-flex', marginLeft: '10px', background: COLORS.CELESTE_PRINCIPAL, borderRadius: 9999, justifyContent: 'center', alignItems: 'center', color: COLORS.AZUL_PRINCIPAL, fontWeight: '900', cursor: 'pointer', verticalAlign: 'middle' }}
                >+</div>
            </div>
            
            {/* Tabla de Palabras */}
            <div style={{ position: 'absolute', left: '20px', top: 300, width: 'calc(100% - 40px)', height: '370px', overflowY: 'auto', background: 'rgba(207, 221, 252, 0.05)', borderRadius: '10px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', color: COLORS.CELESTE_PRINCIPAL, fontFamily: 'Nunito' }}>
                    <thead>
                        <tr style={{ borderBottom: `1px solid ${COLORS.CELESTE_PRINCIPAL}` }}>
                            <th style={{ textAlign: 'left', padding: '10px', fontSize: '12px' }}>PALABRA</th>
                            <th style={{ textAlign: 'left', padding: '10px', fontSize: '12px' }}>SCRIPT</th>
                            <th style={{ textAlign: 'center', padding: '10px', fontSize: '12px' }}>TH</th>
                        </tr>
                    </thead>
                    <tbody>
                        {hotwords.map((item, idx) => {
                            const script = scripts[item.scriptIndex];
                            const scriptName = script ? script.config.name : 'Sin script';
                            return (
                                <tr 
                                    key={item.id} 
                                    onClick={() => openConfigModal(idx)}
                                    style={{ borderBottom: '1px solid rgba(207, 221, 252, 0.1)', cursor: 'pointer' }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(207, 221, 252, 0.1)'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                >
                                    <td style={{ padding: '10px', fontSize: '13px', fontWeight: 'bold' }}>{item.word}</td>
                                    <td style={{ padding: '10px', fontSize: '12px', opacity: 0.8 }}>{scriptName}</td>
                                    <td style={{ padding: '10px', fontSize: '12px', textAlign: 'center' }}>{item.threshold}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* MODAL DE CONFIGURACIÓN */}
            {isModalOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div style={{ width: '600px', height: '300px', position: 'relative', background: COLORS.AZUL_PRINCIPAL, overflow: 'hidden', borderRadius: 20 }}>
                        
                        <div style={{ width: 245, height: 30, left: 178, top: 0, position: 'absolute', background: COLORS.CELESTE_PRINCIPAL, borderBottomRightRadius: 20, borderBottomLeftRadius: 20, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                            <div style={{ color: COLORS.AZUL_PRINCIPAL, fontSize: 16, fontFamily: TYPOGRAPHY.FONT_FAMILY_PRINCIPAL, fontWeight: TYPOGRAPHY.FONT_WEIGHT_EXTRA_BOLD }}>
                                {editingIndex !== null ? 'EDITAR PALABRA' : 'NUEVA PALABRA'}
                            </div>
                        </div>

                        <div style={{ position: 'absolute', left: '30px', top: '55px', width: '280px' }}>
                            <label style={{ color: COLORS.CELESTE_PRINCIPAL, fontSize: '12px', fontWeight: 'bold', fontFamily: 'Nunito' }}>PALABRA CLAVE</label>
                            <input 
                                type="text" 
                                value={modalData.word} 
                                onChange={e => setModalData({...modalData, word: e.target.value})}
                                style={{ width: '100%', padding: '8px', marginTop: '5px', borderRadius: '10px', border: 'none', background: COLORS.CELESTE_PRINCIPAL, color: COLORS.AZUL_PRINCIPAL, fontWeight: 'bold', outline: 'none', boxSizing: 'border-box' }}
                            />

                            <div style={{ marginTop: '15px' }}>
                                <label style={{ color: COLORS.CELESTE_PRINCIPAL, fontSize: '12px', fontWeight: 'bold', fontFamily: 'Nunito' }}>SCRIPT ASOCIADO</label>
                                <select 
                                    value={modalData.scriptIndex} 
                                    onChange={e => setModalData({...modalData, scriptIndex: parseInt(e.target.value)})}
                                    style={{ width: '100%', padding: '8px', marginTop: '5px', borderRadius: '10px', border: 'none', background: COLORS.CELESTE_PRINCIPAL, color: COLORS.AZUL_PRINCIPAL, fontWeight: 'bold', outline: 'none', boxSizing: 'border-box' }}
                                >
                                    {scripts.length === 0 ? (
                                        <option value={0}>No hay scripts disponibles</option>
                                    ) : (
                                        scripts.map((s, idx) => (
                                            <option key={idx} value={idx}>{s.config.name} ({s.steps.length} pasos)</option>
                                        ))
                                    )}
                                </select>
                            </div>
                        </div>

                        <div style={{ position: 'absolute', left: '340px', top: '75px', width: '230px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div>
                                <label style={{ color: COLORS.CELESTE_PRINCIPAL, fontSize: '14px', fontWeight: 'bold', fontFamily: 'Nunito' }}>THRESHOLD: {modalData.threshold}</label>
                                <input 
                                    type="range" min="0.1" max="0.9" step="0.05"
                                    value={modalData.threshold} 
                                    onChange={e => setModalData({...modalData, threshold: parseFloat(e.target.value)})}
                                    style={{ width: '100%', marginTop: '15px', cursor: 'pointer' }}
                                />
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' }}>
                                <button 
                                    onClick={handleSaveWord}
                                    style={{ width: '180px', height: '32px', borderRadius: '90px', border: 'none', background: COLORS.CELESTE_PRINCIPAL, color: COLORS.AZUL_PRINCIPAL, fontWeight: TYPOGRAPHY.FONT_WEIGHT_BOLD, cursor: 'pointer', transition: 'background 0.2s', fontFamily: TYPOGRAPHY.FONT_FAMILY_PRINCIPAL, fontSize: '12px' }}
                                >GUARDAR</button>
                                <button 
                                    onClick={() => setIsModalOpen(false)}
                                    style={{ width: '180px', height: '32px', borderRadius: '90px', border: 'none', background: COLORS.CELESTE_PRINCIPAL, color: COLORS.AZUL_PRINCIPAL, fontWeight: TYPOGRAPHY.FONT_WEIGHT_BOLD, cursor: 'pointer', transition: 'background 0.2s', fontFamily: TYPOGRAPHY.FONT_FAMILY_PRINCIPAL, fontSize: '12px' }}
                                >CANCELAR</button>

                                {editingIndex !== null && (
                                    <button 
                                        onClick={handleDeleteWord}
                                        style={{ width: '180px', height: '32px', borderRadius: '90px', border: 'none', background: '#E88B93', color: COLORS.AZUL_PRINCIPAL, fontWeight: TYPOGRAPHY.FONT_WEIGHT_BOLD, cursor: 'pointer', transition: 'all 0.2s', fontFamily: TYPOGRAPHY.FONT_FAMILY_PRINCIPAL, fontSize: '12px' }}
                                    >ELIMINAR PALABRA</button>
                                )}
                            </div>
                        </div>

                        <button onClick={() => setIsModalOpen(false)} style={{ position: 'absolute', top: 5, right: 15, background: 'none', border: 'none', color: COLORS.CELESTE_PRINCIPAL, fontSize: 24, cursor: 'pointer', zIndex: 10 }}>×</button>

                    </div>
                </div>
            )}
        </div>
    );
};

export default HotWords;