import React, { useState, useEffect, useRef } from 'react';
import { useRos } from '../contexts/RosContext';
import { createService, createTopic, publishMessage } from '../services/RosManager';
import { COLORS, TYPOGRAPHY } from '../theme';

const LANGUAGES = ['ES', 'EN'];
const LANGUAGE_MAP = { 'ES': 'Spanish', 'EN': 'English' };

const HotWords = () => {
    const { ros } = useRos();

    // Estado para el vocabulario (inicializado con valores por defecto)
    const [wordsList, setWordsList] = useState([
        { word: 'hola', threshold: 0.35, response: 'Hola, cómo estás?' },
        { word: 'ayuda', threshold: 0.35, response: 'Mi misión es ayudarte, ¿qué necesitas?' },
        { word: 'baila', threshold: 0.35, response: 'Me encanta bailar, luego te muestro' },
    ]);

    const [subscribe, setSubscribe] = useState(false);
    const [noise, setNoise] = useState(false);
    const [eyes, setEyes] = useState(false);
    const [language, setLanguage] = useState('ES');
    const [showLangDropdown, setShowLangDropdown] = useState(false);
    
    // Estados de UI y Modal
    const [isHoveredNoise, setIsHoveredNoise] = useState(false);
    const [isHoveredEyes, setIsHoveredEyes] = useState(false);
    const [isHoveredSubscribe, setIsHoveredSubscribe] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Estados de hover para el Modal
    const [isHoveredCancelar, setIsHoveredCancelar] = useState(false);
    const [isHoveredGuardar, setIsHoveredGuardar] = useState(false);
    const [isHoveredEliminar, setIsHoveredEliminar] = useState(false);

    const [editingIndex, setEditingIndex] = useState(null); // null para nuevo, index para editar
    const [modalData, setModalData] = useState({ word: '', response: '', threshold: 0.35 });

    const topicRef = useRef(null);

    // --- GESTIÓN DE MODAL ---
    const openConfigModal = (index = null) => {
        if (index !== null) {
            setEditingIndex(index);
            setModalData({ ...wordsList[index] });
        } else {
            setEditingIndex(null);
            setModalData({ word: '', response: '', threshold: 0.35 });
        }
        setIsModalOpen(true);
    };

    const handleSaveWord = () => {
        if (!modalData.word.trim() || !modalData.response.trim()) return;
        const newList = [...wordsList];
        if (editingIndex !== null) newList[editingIndex] = modalData;
        else newList.push(modalData);
        setWordsList(newList);
        setIsModalOpen(false);
    };

    const callSpeechRecognition = (newSubscribe, newNoise, newEyes) => {
        return new Promise((resolve, reject) => {
            if (!ros) return reject(new Error('ROS not connected'));

            const service = createService(
                ros,
                '/pytoolkit/ALSpeechRecognition/set_speechrecognition_srv',
                'pytoolkit/set_speechrecognition_srv'
            );

            const request = { subscribe: newSubscribe, noise: newNoise, eyes: newEyes };

            service.callService(request, (result) => {
                setSubscribe(newSubscribe);
                setNoise(newNoise);
                setEyes(newEyes);
                resolve(result);
            }, (error) => reject(error));
        });
    };

    const callLanguageService = (newLanguage) => {
        return new Promise((resolve, reject) => {
            if (!ros) return reject(new Error('ROS not connected'));
            const service = createService(
                ros,
                '/pytoolkit/ALSpeechRecognition/set_hot_word_language_srv',
                'pytoolkit/set_hot_word_language_srv'
            );
            service.callService({ url: newLanguage }, (result) => resolve(result), (error) => reject(error));
        });
    };

    const sendVocabulary = () => {
        return new Promise((resolve, reject) => {
            if (!ros) return reject(new Error('ROS not connected'));
            const service = createService(
                ros,
                '/pytoolkit/ALSpeechRecognition/set_words_srv',
                'robot_toolkit_msgs/set_words_threshold_srv'
            );
            service.callService({
                words: wordsList.map(h => h.word),
                threshold: wordsList.map(h => h.threshold),
            }, (result) => resolve(result), (error) => reject(error));
        });
    };

    useEffect(() => {
        if (!ros || !subscribe) {
            if (topicRef.current) { topicRef.current.unsubscribe(); topicRef.current = null; }
            return;
        }
        const topic = createTopic(ros, '/pytoolkit/ALSpeechRecognition/status', 'robot_toolkit_msgs/speech_recognition_status_msg');
        topic.subscribe((msg) => {
            const word = (msg.status).toLowerCase();
            const found = wordsList.find(h => h.word.toLowerCase() === word);
            if (found) {
                const speechTopic = createTopic(ros, '/speech', 'robot_toolkit_msgs/speech_msg');
                publishMessage(speechTopic, { language: LANGUAGE_MAP[language], text: found.response, animated: true });
            }
        });
        topicRef.current = topic;
        return () => { if (topicRef.current) { topicRef.current.unsubscribe(); topicRef.current = null; } };
    }, [ros, subscribe, language, wordsList]);

    const toggleSubscribe = async () => {
        const newState = !subscribe;
        try {
            if (!newState) { await callSpeechRecognition(false, noise, eyes); return; }
            await callSpeechRecognition(true, noise, eyes);
            await callLanguageService(LANGUAGE_MAP[language]);
            await sendVocabulary();
        } catch (err) { console.error('Error in Hotwords sequence:', err); }
    };

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

            {/* Controles de Noise y Eyes */}
            {[
                { label: 'Noise', state: noise, setter: () => callSpeechRecognition(subscribe, !noise, eyes), hover: isHoveredNoise, setHover: setIsHoveredNoise, top: 68 },
                { label: 'Eyes', state: eyes, setter: () => callSpeechRecognition(subscribe, noise, !eyes), hover: isHoveredEyes, setHover: setIsHoveredEyes, top: 112 }
            ].map((item) => (
                <div key={item.label} style={{ width: 207, height: 30, left: '71.5px', top: item.top + 20, position: 'absolute' }}>
                    <div style={{ left: 0, top: 4, position: 'absolute', color: COLORS.CELESTE_PRINCIPAL, fontSize: 16, fontFamily: 'Nunito', fontWeight: '700' }}>{item.label}</div>
                    <div 
                        onClick={item.setter}
                        onMouseEnter={() => item.setHover(true)}
                        onMouseLeave={() => item.setHover(false)}
                        style={{ width: 135, height: 30, left: 72, position: 'absolute', background: item.hover ? COLORS.AZUL_SECUNDARIO : COLORS.CELESTE_PRINCIPAL, borderRadius: 25, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer', transition: 'background 0.2s', flexDirection: item.state ? 'row-reverse' : 'row', padding: '0 10px' }}
                    >
                        <div style={{ width: 20, height: 20, background: item.state ? '#28DE64' : COLORS.AZUL_PRINCIPAL, borderRadius: '50%', transition: 'background 0.2s' }} />
                        <div style={{ color: COLORS.AZUL_PRINCIPAL, fontSize: 12, fontFamily: 'Nunito', fontWeight: '700' }}>{item.state ? 'ACTIVO' : 'HABILITAR'}</div>
                    </div>
                </div>
            ))}

            {/* Botón ACTIVAR HOTWORDS */}
            <div 
                onClick={toggleSubscribe}
                onMouseEnter={() => setIsHoveredSubscribe(true)}
                onMouseLeave={() => setIsHoveredSubscribe(false)}
                style={{ width: 210, height: 30, left: '70px', top: 200, position: 'absolute', background: isHoveredSubscribe ? COLORS.AZUL_SECUNDARIO : COLORS.CELESTE_PRINCIPAL, borderRadius: 25, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 10px', cursor: 'pointer', transition: 'background 0.2s', flexDirection: subscribe ? 'row-reverse' : 'row' }}
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
                            <th style={{ textAlign: 'left', padding: '10px', fontSize: '12px' }}>RESPUESTA</th>
                            <th style={{ textAlign: 'center', padding: '10px', fontSize: '12px' }}>TH</th>
                        </tr>
                    </thead>
                    <tbody>
                        {wordsList.map((item, idx) => (
                            <tr 
                                key={idx} 
                                onClick={() => openConfigModal(idx)}
                                style={{ borderBottom: '1px solid rgba(207, 221, 252, 0.1)', cursor: 'pointer' }}
                                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(207, 221, 252, 0.1)'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                            >
                                <td style={{ padding: '10px', fontSize: '13px', fontWeight: 'bold' }}>{item.word}</td>
                                <td style={{ padding: '10px', fontSize: '12px', opacity: 0.8 }}>{item.response}</td>
                                <td style={{ padding: '10px', fontSize: '12px', textAlign: 'center' }}>{item.threshold}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* MODAL DE CONFIGURACIÓN */}
            {isModalOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div style={{ width: '600px', height: '300px', position: 'relative', background: COLORS.AZUL_PRINCIPAL, overflow: 'hidden', borderRadius: 20 }}>
                        
                        {/* Título Estilo LED Modal */}
                        <div style={{ width: 245, height: 30, left: 178, top: 0, position: 'absolute', background: COLORS.CELESTE_PRINCIPAL, borderBottomRightRadius: 20, borderBottomLeftRadius: 20, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                            <div style={{ color: COLORS.AZUL_PRINCIPAL, fontSize: 16, fontFamily: TYPOGRAPHY.FONT_FAMILY_PRINCIPAL, fontWeight: TYPOGRAPHY.FONT_WEIGHT_EXTRA_BOLD }}>
                                {editingIndex !== null ? 'EDITAR PALABRA' : 'NUEVA PALABRA'}
                            </div>
                        </div>

                        {/* Formulario alineado */}
                        <div style={{ position: 'absolute', left: '30px', top: '55px', width: '280px' }}>
                            <label style={{ color: COLORS.CELESTE_PRINCIPAL, fontSize: '12px', fontWeight: 'bold', fontFamily: 'Nunito' }}>PALABRA CLAVE</label>
                            <input 
                                type="text" 
                                value={modalData.word} 
                                onChange={e => setModalData({...modalData, word: e.target.value})}
                                style={{ width: '100%', padding: '8px', marginTop: '5px', borderRadius: '10px', border: 'none', background: COLORS.CELESTE_PRINCIPAL, color: COLORS.AZUL_PRINCIPAL, fontWeight: 'bold', outline: 'none', boxSizing: 'border-box' }}
                            />
                            
                            <div style={{ marginTop: '15px' }}>
                                <label style={{ color: COLORS.CELESTE_PRINCIPAL, fontSize: '12px', fontWeight: 'bold', fontFamily: 'Nunito' }}>RESPUESTA</label>
                                <textarea 
                                    value={modalData.response} 
                                    onChange={e => setModalData({...modalData, response: e.target.value})}
                                    style={{ width: '100%', height: '80px', padding: '8px', marginTop: '5px', borderRadius: '10px', border: 'none', background: COLORS.CELESTE_PRINCIPAL, color: COLORS.AZUL_PRINCIPAL, fontWeight: 'bold', outline: 'none', resize: 'none', boxSizing: 'border-box' }}
                                />
                            </div>
                        </div>

                        {/* Columna Derecha: Threshold y Acciones */}
                        <div style={{ 
                            position: 'absolute', 
                            left: '340px', 
                            top: '75px', 
                            width: '230px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '20px'
                        }}>
                            <div>
                            <label style={{ color: COLORS.CELESTE_PRINCIPAL, fontSize: '14px', fontWeight: 'bold', fontFamily: 'Nunito' }}>THRESHOLD: {modalData.threshold}</label>
                            <input 
                                type="range" min="0.1" max="0.9" step="0.05"
                                value={modalData.threshold} 
                                onChange={e => setModalData({...modalData, threshold: parseFloat(e.target.value)})}
                                style={{ width: '100%', marginTop: '15px', cursor: 'pointer' }}
                            />
                            </div>

                            {/* Grupo de Botones debajo de Threshold */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' }}>
                                <button 
                                    onClick={handleSaveWord}
                                    onMouseEnter={() => setIsHoveredGuardar(true)}
                                    onMouseLeave={() => setIsHoveredGuardar(false)}
                                    style={{ 
                                        width: '180px', height: '32px', borderRadius: '90px', border: 'none', 
                                        background: isHoveredGuardar ? COLORS.AZUL_SECUNDARIO : COLORS.CELESTE_PRINCIPAL, 
                                        color: COLORS.AZUL_PRINCIPAL, fontWeight: TYPOGRAPHY.FONT_WEIGHT_BOLD, cursor: 'pointer', 
                                        transition: 'background 0.2s', fontFamily: TYPOGRAPHY.FONT_FAMILY_PRINCIPAL, fontSize: '12px'
                                    }}
                                >
                                    GUARDAR
                                </button>
                                <button 
                                    onClick={() => setIsModalOpen(false)}
                                    onMouseEnter={() => setIsHoveredCancelar(true)}
                                    onMouseLeave={() => setIsHoveredCancelar(false)}
                                    style={{ 
                                        width: '180px', height: '32px', borderRadius: '90px', border: 'none', 
                                        background: isHoveredCancelar ? COLORS.AZUL_SECUNDARIO : COLORS.CELESTE_PRINCIPAL, 
                                        color: COLORS.AZUL_PRINCIPAL, fontWeight: TYPOGRAPHY.FONT_WEIGHT_BOLD, cursor: 'pointer', 
                                        transition: 'background 0.2s', fontFamily: TYPOGRAPHY.FONT_FAMILY_PRINCIPAL, fontSize: '12px'
                                    }}
                                >
                                    CANCELAR
                                </button>

                                {editingIndex !== null && (
                                    <button 
                                        onClick={() => {
                                            const newList = wordsList.filter((_, i) => i !== editingIndex);
                                            setWordsList(newList);
                                            setIsModalOpen(false);
                                        }}
                                        onMouseEnter={() => setIsHoveredEliminar(true)}
                                        onMouseLeave={() => setIsHoveredEliminar(false)}
                                        style={{ 
                                            width: '180px', height: '32px', borderRadius: '90px', border: 'none', 
                                            background: isHoveredEliminar ? '#DC3545' : '#E88B93', 
                                            color: isHoveredEliminar ? '#FFFFFF' : COLORS.AZUL_PRINCIPAL, 
                                            fontWeight: TYPOGRAPHY.FONT_WEIGHT_BOLD, cursor: 'pointer', 
                                            transition: 'all 0.2s', fontFamily: TYPOGRAPHY.FONT_FAMILY_PRINCIPAL, fontSize: '12px'
                                        }}
                                    >
                                        ELIMINAR PALABRA
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Botón Cerrar "X" */}
                        <button onClick={() => setIsModalOpen(false)} style={{ position: 'absolute', top: 5, right: 15, background: 'none', border: 'none', color: COLORS.CELESTE_PRINCIPAL, fontSize: 24, cursor: 'pointer', zIndex: 10 }}>×</button>

                    </div>
                </div>
            )}
        </div>
    );
};

export default HotWords;
