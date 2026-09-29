import { useState, useEffect, useRef, useCallback } from 'react';
import { useRos } from '../contexts/RosContext';
import { createService, createTopic } from '../services/RosManager';
import { executeScript, stopSpeech } from '../services/scriptExecutor';
import { COLORS, TYPOGRAPHY } from '../theme';

const LANGUAGES = ['ES', 'EN'] as const;
type Language = typeof LANGUAGES[number];
const LANGUAGE_MAP: Record<Language, string> = { ES: 'Spanish', EN: 'English' };

type Script = {
    steps: any[];
    config: {
        name: string;
        language: string;
        stepDelay?: number;
    };
};

type HotWordsProps = {
    scripts?: Script[];
};

// Variables CSS alimentadas desde COLORS/TYPOGRAPHY para usarlas en clases de Tailwind
const themeVars = {
    '--azul': COLORS.AZUL_PRINCIPAL,
    '--celeste': COLORS.CELESTE_PRINCIPAL,
    '--rojo': COLORS.ROJO,
    '--amarillo': COLORS.AMARILLO,
    '--verde': COLORS.VERDE,
    '--font': TYPOGRAPHY.FONT_FAMILY_PRINCIPAL,
} as React.CSSProperties;

const HotWords = ({ scripts = [] }: HotWordsProps) => {
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
    const [language, setLanguage] = useState<Language>('ES');
    const [showLangDropdown, setShowLangDropdown] = useState(false);

    // Modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [modalData, setModalData] = useState({ word: '', scriptIndex: 0, threshold: 0.35 });

    // Ejecución de scripts
    const [executingScriptId, setExecutingScriptId] = useState<number | null>(null);
    const abortRef = useRef<AbortController | null>(null);

    const topicRef = useRef<{ unsubscribe: () => void } | null>(null);
    const nextId = useRef(4);

    // --- Servicios ROS ---
    const callSpeechRecognition = useCallback((newSubscribe: boolean, newNoise: boolean, newEyes: boolean) =>
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

    const callLanguageService = useCallback((newLanguage: string) =>
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
        new Promise<void>((resolve, reject) => {
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
                (result) => { console.log('Vocabulary sent:', result); resolve(); },
                (err)    => { console.error(err); reject(err); }
            );
        }), [ros, hotwords]);

    // --- Ejecución de script (useCallback para estabilizar dependencias) ---
    const handleExecuteScript = useCallback(async (
        script: { steps: any[]; config: { language: string; stepDelay?: number } },
        hotwordId: number
    ) => {
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
            const detected = (msg as { status: string }).status.toLowerCase().trim();
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
    const openConfigModal = (index: number | null = null) => {
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
        if (ros) stopSpeech(ros);
        setExecutingScriptId(null);
    };

    // ── Render ────────────────────────────────────────────────────────────────
    const toggles = [
        { label: 'Noise', state: noise, setter: handleNoiseToggle, topClass: 'top-[88px]' },
        { label: 'Eyes',  state: eyes,  setter: handleEyesToggle,  topClass: 'top-[132px]' }
    ];

    return (
        // <div style={themeVars} className="relative h-[700px] w-full max-w-[350px] overflow-hidden rounded-[20px] bg-[var(--azul)]">
        <div style={themeVars} className="relative h-[700px] w-full overflow-hidden rounded-[20px] bg-[var(--azul)]">

            {/* Etiqueta título */}
            <div className="absolute left-0 top-[21px] z-[2] flex h-[30px] w-[min(180px,90%)] items-center rounded-r-[25px] bg-[var(--celeste)] px-[19px]">
                <span className="w-full text-center text-base font-bold text-[var(--azul)] font-[family-name:var(--font)]">
                    Hot Words
                </span>
            </div>

            {/* Selector de idioma */}
            <div className="absolute right-5 top-6 z-10 flex cursor-pointer items-center gap-1" onClick={() => setShowLangDropdown(v => !v)}>
                <span className="text-xs font-bold text-[var(--celeste)] font-[family-name:var(--font)]">{language}</span>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M3 4.5L6 7.5L9 4.5" stroke={COLORS.CELESTE_PRINCIPAL} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                {showLangDropdown && (
                    <div className="absolute right-0 top-5 z-20 overflow-hidden rounded-lg bg-[var(--celeste)] shadow-[0_4px_12px_rgba(0,0,0,0.3)]">
                        {LANGUAGES.map(lang => (
                            <div
                                key={lang}
                                onClick={(e) => { e.stopPropagation(); setLanguage(lang); setShowLangDropdown(false); }}
                                className={`cursor-pointer px-4 py-1.5 text-xs font-bold text-[var(--azul)] font-[family-name:var(--font)] ${lang === language ? 'bg-[rgba(0,33,75,0.12)]' : 'bg-transparent'}`}
                            >{lang}</div>
                        ))}
                    </div>
                )}
            </div>

            {/* Banner de script ejecutándose */}
            {executingScriptId !== null && (
                <div className="absolute left-5 right-5 top-[55px] z-[5] flex items-center gap-2.5 rounded-lg border border-solid border-[var(--amarillo)] bg-[#fff8e1] px-3 py-1.5 text-xs font-bold text-[var(--azul)] font-[family-name:var(--font)]">
                    ▶ Ejecutando script...
                    <button
                        onClick={handleStopScript}
                        className="ml-auto cursor-pointer rounded border-none bg-[var(--rojo)] px-2.5 py-0.5 text-[11px] text-white"
                    >
                        Detener
                    </button>
                </div>
            )}

            {/* Controles de Noise y Eyes */}
            {toggles.map((item) => (
                <div key={item.label} className={`absolute inset-x-0 mx-auto h-[30px] w-[207px] ${item.topClass}`}>
                    <div className="absolute left-0 top-1 text-base font-bold text-[var(--celeste)] font-['Nunito']">{item.label}</div>
                    <div
                        onClick={item.setter}
                        className={`absolute left-[72px] flex h-[30px] w-[135px] cursor-pointer items-center justify-center gap-2 rounded-[25px] bg-[var(--celeste)] px-2.5 transition-colors duration-200 ease-[ease] ${item.state ? 'flex-row-reverse' : 'flex-row'}`}
                    >
                        <div className={`h-5 w-5 rounded-full transition-colors duration-200 ease-[ease] ${item.state ? 'bg-[var(--verde)]' : 'bg-[var(--azul)]'}`} />
                        <div className="text-xs font-bold text-[var(--azul)] font-['Nunito']">{item.state ? 'ACTIVO' : 'HABILITAR'}</div>
                    </div>
                </div>
            ))}

            {/* Botón ACTIVAR HOTWORDS */}
            <div
                onClick={toggleSubscribe}
                className={`absolute inset-x-0 top-[200px] mx-auto flex h-[30px] w-[210px] cursor-pointer items-center justify-between rounded-[25px] bg-[var(--celeste)] px-2.5 transition-colors duration-200 ease-[ease] ${subscribe ? 'flex-row-reverse' : 'flex-row'}`}
            >
                <div className={`h-5 w-5 rounded-full transition-colors duration-200 ease-[ease] ${subscribe ? 'bg-[var(--verde)]' : 'bg-[var(--azul)]'}`} />
                <div className="flex-1 text-center text-xs font-bold text-[var(--azul)] font-['Nunito']">
                    {subscribe ? 'DESACTIVAR HOTWORDS' : 'ACTIVAR HOTWORDS'}
                </div>
            </div>

            {/* Sección Vocabulario */}
            <div className="absolute top-[260px] w-full text-center text-base font-bold text-[var(--celeste)] font-['Nunito']">
                Palabras configuradas
                <div
                    onClick={() => openConfigModal()}
                    className="ml-2.5 inline-flex h-[25px] w-[25px] cursor-pointer items-center justify-center rounded-full bg-[var(--celeste)] align-middle font-black text-[var(--azul)]"
                >+</div>
            </div>

            {/* Tabla de Palabras */}
            <div className="absolute left-5 top-[300px] h-[370px] w-[calc(100%-40px)] overflow-y-auto rounded-[10px] bg-[rgba(207,221,252,0.05)]">
                <table className="w-full border-collapse text-[var(--celeste)] font-['Nunito']">
                    <thead>
                        <tr className="border-b border-solid border-[var(--celeste)]">
                            <th className="p-2.5 text-left text-xs">PALABRA</th>
                            <th className="p-2.5 text-left text-xs">SCRIPT</th>
                            <th className="p-2.5 text-center text-xs">TH</th>
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
                                    className="cursor-pointer border-b border-solid border-[rgba(207,221,252,0.1)] bg-transparent hover:bg-[rgba(207,221,252,0.1)]"
                                >
                                    <td className="p-2.5 text-[13px] font-bold">{item.word}</td>
                                    <td className="p-2.5 text-xs opacity-80">{scriptName}</td>
                                    <td className="p-2.5 text-center text-xs">{item.threshold}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* MODAL DE CONFIGURACIÓN */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-[rgba(0,0,0,0.7)]">
                    {/* Layout original (absoluto, 600x300) desde sm; apilado en pantallas pequeñas */}
                    <div className="relative flex max-h-[95vh] w-[600px] max-w-[95vw] flex-col gap-5 overflow-y-auto rounded-[20px] bg-[var(--azul)] px-6 pb-6 pt-12 sm:block sm:h-[300px] sm:overflow-hidden sm:p-0">

                        <div className="absolute left-1/2 top-0 flex h-[30px] w-[245px] -translate-x-1/2 items-center justify-center rounded-b-[20px] bg-[var(--celeste)] sm:left-[178px] sm:translate-x-0">
                            <div className="text-base font-extrabold text-[var(--azul)] font-[family-name:var(--font)]">
                                {editingIndex !== null ? 'EDITAR PALABRA' : 'NUEVA PALABRA'}
                            </div>
                        </div>

                        <div className="w-full sm:absolute sm:left-[30px] sm:top-[55px] sm:w-[280px]">
                            <label className="text-xs font-bold text-[var(--celeste)] font-['Nunito']">PALABRA CLAVE</label>
                            <input
                                type="text"
                                value={modalData.word}
                                onChange={e => setModalData({...modalData, word: e.target.value})}
                                className="mt-[5px] box-border w-full rounded-[10px] border-none bg-[var(--celeste)] p-2 font-bold text-[var(--azul)] outline-none"
                            />

                            <div className="mt-[15px]">
                                <label className="text-xs font-bold text-[var(--celeste)] font-['Nunito']">SCRIPT ASOCIADO</label>
                                <select
                                    value={modalData.scriptIndex}
                                    onChange={e => setModalData({...modalData, scriptIndex: parseInt(e.target.value)})}
                                    className="mt-[5px] box-border w-full rounded-[10px] border-none bg-[var(--celeste)] p-2 font-bold text-[var(--azul)] outline-none"
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

                        <div className="flex w-full flex-col gap-5 sm:absolute sm:left-[340px] sm:top-[75px] sm:w-[230px]">
                            <div>
                                <label className="text-sm font-bold text-[var(--celeste)] font-['Nunito']">THRESHOLD: {modalData.threshold}</label>
                                <input
                                    type="range" min="0.1" max="0.9" step="0.05"
                                    value={modalData.threshold}
                                    onChange={e => setModalData({...modalData, threshold: parseFloat(e.target.value)})}
                                    className="mt-[15px] w-full cursor-pointer"
                                />
                            </div>

                            <div className="flex flex-col items-center gap-2.5">
                                <button
                                    onClick={handleSaveWord}
                                    className="h-8 w-[180px] cursor-pointer rounded-[90px] border-none bg-[var(--celeste)] text-xs font-bold text-[var(--azul)] transition-colors duration-200 ease-[ease] font-[family-name:var(--font)]"
                                >GUARDAR</button>
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="h-8 w-[180px] cursor-pointer rounded-[90px] border-none bg-[var(--celeste)] text-xs font-bold text-[var(--azul)] transition-colors duration-200 ease-[ease] font-[family-name:var(--font)]"
                                >CANCELAR</button>

                                {editingIndex !== null && (
                                    <button
                                        onClick={handleDeleteWord}
                                        className="h-8 w-[180px] cursor-pointer rounded-[90px] border-none bg-[#E88B93] text-xs font-bold text-[var(--azul)] transition-all duration-200 ease-[ease] font-[family-name:var(--font)]"
                                    >ELIMINAR PALABRA</button>
                                )}
                            </div>
                        </div>

                        <button onClick={() => setIsModalOpen(false)} className="absolute right-[15px] top-[5px] z-10 cursor-pointer border-none bg-transparent text-[24px] text-[var(--celeste)]">×</button>

                    </div>
                </div>
            )}
        </div>
    );
};

export default HotWords;