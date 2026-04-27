import React, { useRef, useState, useEffect } from 'react';
import { useRos } from '../contexts/RosContext';
import { executeStep, executeScript, parseLegacyTxt, stopSpeech } from '../services/scriptExecutor';
import { createTopic } from '../services/RosManager';
import { useAnimations } from '../services/useAnimations';
import { COLORS, TYPOGRAPHY } from '../theme';
import ScriptPanel from './ScriptPanel';

const LANGUAGES = ['Spanish', 'English'];

const SCREEN_TYPES = [
    { value: 'none',     label: 'Ninguna' },
    { value: 'subtitle', label: 'Subtítulo' },
    { value: 'image',    label: 'Imagen (URL)' },
    { value: 'web',      label: 'Página web (URL)' }
];

const createEmptyStep = () => ({
    speech: '',
    animation: '',
    screen: null
});

const ScriptsCreator = ({ sessionScripts, setSessionScripts }) => {
    const { ros } = useRos();
    const { getAllAnimations } = useAnimations();

    const [config, setConfig] = useState({ name: 'mi_script', language: 'Spanish', stepDelay: 3000 });
    const [steps, setSteps] = useState([]);
    const [activeSessionIdx, setActiveSessionIdx] = useState(null);

    // Estados de ejecución
    const [isExecuting, setIsExecuting] = useState(false);
    const [executingIndex, setExecutingIndex] = useState(null);
    const abortRef = useRef(null);
    const dragItem = useRef(null);
    const [dragOverIndex, setDragOverIndex] = useState(null);

    const [singleStepIndex, setSingleStepIndex] = useState(null);
    const [completedStepIndex, setCompletedStepIndex] = useState(null);
    const singleAbortRef = useRef(null);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingIndex, setEditingIndex] = useState(null);
    const [modalStep, setModalStep] = useState(createEmptyStep());

    const [animTree, setAnimTree] = useState({});
    const [selCat, setSelCat] = useState("");
    const [selSub, setSelSub] = useState("");

    const [hoverBtn, setHoveredBtn] = useState(null);
    const [hoverModal, setHoverModal] = useState(null);

    // Inicializa un script por defecto si no hay ninguno en la sesión
    useEffect(() => {
        if (sessionScripts.length === 0) {
            const defaultScript = {
                config: { name: 'mi_script', language: 'Spanish', stepDelay: 3000 },
                steps: []
            };
            setSessionScripts([defaultScript]);
            setActiveSessionIdx(0);
            setConfig(defaultScript.config);
            setSteps(defaultScript.steps);
        } else if (activeSessionIdx === null && sessionScripts.length > 0) {
            setActiveSessionIdx(0);
            setConfig(sessionScripts[0].config);
            setSteps(sessionScripts[0].steps);
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Sincroniza el script activo con la sesión en tiempo real
    useEffect(() => {
        if (activeSessionIdx !== null && activeSessionIdx < sessionScripts.length) {
            setSessionScripts(prev => {
                const newList = [...prev];
                newList[activeSessionIdx] = { config, steps };
                return newList;
            });
        }
    }, [config, steps, activeSessionIdx]); // eslint-disable-line react-hooks/exhaustive-deps

    // Carga el árbol de animaciones
    useEffect(() => {
        const list = getAllAnimations();
        const tree = {};
        list.forEach(path => {
            const parts = path.trim().split("/");
            if (parts.length === 3) {
                const [c, s, a] = parts;
                if (!tree[c]) tree[c] = {};
                if (!tree[c][s]) tree[c][s] = [];
                tree[c][s].push(a);
            } else if (parts.length === 2) {
                const [c, a] = parts;
                if (!tree[c]) tree[c] = {};
                if (!tree[c]["_none"]) tree[c]["_none"] = [];
                tree[c]["_none"].push(a);
            }
        });
        setAnimTree(tree);
    }, [getAllAnimations]);

    const openModal = (index = null) => {
        if (index !== null) {
            setEditingIndex(index);
            const step = steps[index];
            setModalStep({ ...step });
            if (step.animation) {
                const p = step.animation.split("/");
                if (p.length === 3) { setSelCat(p[0]); setSelSub(p[1]); }
                else if (p.length === 2) { setSelCat(p[0]); setSelSub("_none"); }
            }
        } else {
            setEditingIndex(null);
            setModalStep(createEmptyStep());
            setSelCat(""); setSelSub("");
        }
        setIsModalOpen(true);
    };

    const saveModalStep = () => {
        const newList = [...steps];
        if (editingIndex !== null) newList[editingIndex] = modalStep;
        else newList.push(modalStep);
        setSteps(newList);
        setIsModalOpen(false);
    };

    const handleAnimSelect = (type, val) => {
        if (type === 'cat') { setSelCat(val); setSelSub(""); setModalStep(prev => ({ ...prev, animation: "" })); }
        else if (type === 'sub') { setSelSub(val); setModalStep(prev => ({ ...prev, animation: "" })); }
        else if (type === 'anim') {
            const fullPath = selSub === "_none" ? `${selCat}/${val}` : `${selCat}/${selSub}/${val}`;
            setModalStep(prev => ({ ...prev, animation: fullPath }));
        }
    };

    const handleDragStart = (e, index) => { dragItem.current = index; e.dataTransfer.effectAllowed = "move"; };
    const handleDragOver = (e, index) => { e.preventDefault(); if (dragItem.current !== index) setDragOverIndex(index); };
    const handleDrop = (e, index) => {
        e.preventDefault();
        if (dragItem.current === null || dragItem.current === index) return;
        const newList = [...steps];
        const itemToMove = newList.splice(dragItem.current, 1)[0];
        newList.splice(index, 0, itemToMove);
        dragItem.current = null; setDragOverIndex(null); setSteps(newList);
    };
    const handleDragEnd = () => { dragItem.current = null; setDragOverIndex(null); };

    useEffect(() => {
        if (completedStepIndex === null) return;
        const t = setTimeout(() => setCompletedStepIndex(null), 2000);
        return () => clearTimeout(t);
    }, [completedStepIndex]);

    const deleteStep = (e, index) => { e.stopPropagation(); setSteps(prev => prev.filter((_, i) => i !== index)); };

    // ── Ejecución de un solo paso ─────────────────────────────────────────
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

    const handleStopSingleStep = () => {
        singleAbortRef.current?.abort();
        stopSpeech(ros);
        setSingleStepIndex(null);
    };

    // ── Ejecutar script completo ──────────────────────────────────────────
    const handleExecuteAll = async () => {
        if (!ros || isExecuting || steps.length === 0) return;
        const ctrl = new AbortController();
        abortRef.current = ctrl;
        setIsExecuting(true);
        try {
            await executeScript(ros, steps, config.language, {
                onStepStart: setExecutingIndex,
                signal: ctrl.signal,
                stepDelay: config.stepDelay
            });
        } catch (err) {
            if (!abortRef.current?.signal.aborted) console.error('Error ejecutando script:', err);
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

    const handleDownload = () => {
        const cleanSteps = steps.map(({ id: _id, ...rest }) => rest);
        const blob = new Blob([JSON.stringify({ config, steps: cleanSteps }, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = `${config.name}.json`; a.click(); URL.revokeObjectURL(url);
    };

    const handleLoadScript = (event) => {
        const file = event.target.files[0]; if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                let data = file.name.endsWith('.json') ? JSON.parse(e.target.result) : parseLegacyTxt(e.target.result, file.name);
                const loadedScript = { config: data.config, steps: data.steps.map(({ id: _id, ...rest }) => rest) };
                
                setSessionScripts(prev => {
                    const newList = [...prev, loadedScript];
                    setActiveSessionIdx(newList.length - 1);
                    return newList;
                });

                setConfig(loadedScript.config); setSteps(loadedScript.steps); event.target.value = '';
            } catch { alert('Error al cargar el archivo.'); }
        };
        reader.readAsText(file);
    };

    const handleNewScript = () => {
        const newEmpty = { config: { name: 'nuevo_script', language: 'Spanish', stepDelay: 3000 }, steps: [] };
        setSessionScripts(prev => {
            const newList = [...prev, newEmpty];
            setActiveSessionIdx(newList.length - 1);
            return newList;
        });
        setConfig(newEmpty.config);
        setSteps([]);
    };

    const handleSelectFromSession = (idx) => {
        setActiveSessionIdx(idx);
        setConfig(sessionScripts[idx].config);
        setSteps(sessionScripts[idx].steps);
    };

    // Estilos reutilizables
    const inputStyle = { background: COLORS.CELESTE_PRINCIPAL, borderRadius: '6px', border: 'none', padding: '0 12px', height: '32px', fontFamily: TYPOGRAPHY.FONT_FAMILY_PRINCIPAL, fontSize: '13px', color: COLORS.AZUL_PRINCIPAL, outline: 'none', width: '100%', boxSizing: 'border-box' };
    const labelStyle = { color: COLORS.CELESTE_PRINCIPAL, fontSize: '13px', fontFamily: TYPOGRAPHY.FONT_FAMILY_PRINCIPAL, fontWeight: '700', marginBottom: '6px', display: 'block' };

    const DotsRow = () => (
        <div style={{ display: 'flex', gap: '15px', height: '14px', margin: '2px 0' }}>
            <div style={{ width: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    <div style={{ width: '3px', height: '3px', background: COLORS.CELESTE_PRINCIPAL, borderRadius: '50%' }} />
                    <div style={{ width: '3px', height: '3px', background: COLORS.CELESTE_PRINCIPAL, borderRadius: '50%' }} />
                    <div style={{ width: '3px', height: '3px', background: COLORS.CELESTE_PRINCIPAL, borderRadius: '50%' }} />
                </div>
            </div>
            <div style={{ flex: 1 }}></div>
        </div>
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0px' }}>
        <div style={{ width: '630px', height: '450px', position: 'relative', background: COLORS.AZUL_PRINCIPAL, borderRadius: '25px', overflow: 'visible', boxSizing: 'border-box' }}>
            
            {/* Título */}
            <div style={{ position: 'absolute', left: 0, top: '20px', width: '200px', height: '30px', background: COLORS.CELESTE_PRINCIPAL, borderTopRightRadius: '25px', borderBottomRightRadius: '25px', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>
                <span style={{ fontFamily: TYPOGRAPHY.FONT_FAMILY_PRINCIPAL, fontWeight: '700', fontSize: '16px', color: COLORS.AZUL_PRINCIPAL }}>
                    Creador de Scripts
                </span>
            </div>

            {/* Configuración rápida */}
            <div style={{ position: 'absolute', top: '70px', left: '30px', right: '30px', display: 'flex', gap: '15px', alignItems: 'flex-end' }}>
                <div style={{ flex: 1 }}>
                    <label style={{ ...labelStyle, fontSize: '11px', textTransform: 'uppercase' }}>NOMBRE</label>
                    <input type="text" value={config.name} onChange={e => setConfig({...config, name: e.target.value})} style={inputStyle} />
                </div>
                <div style={{ width: '110px' }}>
                    <label style={{ ...labelStyle, fontSize: '11px', textTransform: 'uppercase' }}>IDIOMA</label>
                    <select value={config.language} onChange={e => setConfig({...config, language: e.target.value})} style={inputStyle}>
                        {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                </div>
                <div style={{ width: '90px' }}>
                    <label style={{ ...labelStyle, fontSize: '11px', textTransform: 'uppercase' }}>DELAY (ms)</label>
                    <input type="number" step="500" value={config.stepDelay} onChange={e => setConfig({...config, stepDelay: parseInt(e.target.value)})} style={inputStyle} />
                </div>
                
                <input id="load-script-input" type="file" accept=".json,.txt" onChange={handleLoadScript} style={{ display: 'none' }} />
                <button 
                    onClick={handleNewScript}
                    onMouseEnter={() => setHoveredBtn('new')} onMouseLeave={() => setHoveredBtn(null)}
                    style={{ height: '32px', padding: '0 15px', borderRadius: '90px', border: 'none', background: hoverBtn === 'new' ? COLORS.AZUL_SECUNDARIO : COLORS.CELESTE_PRINCIPAL, color: COLORS.AZUL_PRINCIPAL, fontFamily: TYPOGRAPHY.FONT_FAMILY_PRINCIPAL, fontWeight: '700', fontSize: '11px', cursor: 'pointer', transition: 'background 0.2s' }}
                >NUEVO</button>

                <button 
                    onClick={() => document.getElementById('load-script-input').click()}
                    onMouseEnter={() => setHoveredBtn('load')} onMouseLeave={() => setHoveredBtn(null)}
                    style={{ height: '32px', padding: '0 15px', borderRadius: '90px', border: 'none', background: hoverBtn === 'load' ? COLORS.AZUL_SECUNDARIO : COLORS.CELESTE_PRINCIPAL, color: COLORS.AZUL_PRINCIPAL, fontFamily: TYPOGRAPHY.FONT_FAMILY_PRINCIPAL, fontWeight: '700', fontSize: '11px', cursor: 'pointer', transition: 'background 0.2s' }}
                >CARGAR</button>
                
                <button 
                    onClick={handleDownload} disabled={steps.length === 0}
                    onMouseEnter={() => setHoveredBtn('save')} onMouseLeave={() => setHoveredBtn(null)}
                    style={{ height: '32px', padding: '0 15px', borderRadius: '90px', border: 'none', background: hoverBtn === 'save' ? COLORS.AZUL_SECUNDARIO : COLORS.CELESTE_PRINCIPAL, color: COLORS.AZUL_PRINCIPAL, fontFamily: TYPOGRAPHY.FONT_FAMILY_PRINCIPAL, fontWeight: '700', fontSize: '11px', cursor: steps.length ? 'pointer' : 'not-allowed', opacity: steps.length ? 1 : 0.5, transition: 'background 0.2s' }}
                >GUARDAR</button>
            </div>

            {/* Tabla de pasos */}
            <div style={{ position: 'absolute', top: '135px', left: '20px', right: '20px', height: '235px', overflowY: 'auto', background: 'rgba(207, 221, 252, 0.03)', borderRadius: '10px' }}>
                {steps.length === 0 ? (
                    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: COLORS.CELESTE_PRINCIPAL, opacity: 0.6, fontSize: '14px', fontFamily: TYPOGRAPHY.FONT_FAMILY_PRINCIPAL, border: '2px dashed rgba(207,221,252,0.15)', borderRadius: '10px', margin: '5px', boxSizing: 'border-box' }}>
                        Sin pasos. Haz clic en "+ Agregar Paso" para comenzar.
                    </div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', color: COLORS.CELESTE_PRINCIPAL, fontFamily: TYPOGRAPHY.FONT_FAMILY_PRINCIPAL }}>
                        <thead style={{ position: 'sticky', top: 0, background: COLORS.AZUL_PRINCIPAL, zIndex: 5 }}>
                            <tr style={{ borderBottom: `1px solid rgba(207, 221, 252, 0.2)` }}>
                                <th style={{ padding: '10px', width: '45px', fontSize: '12px', textAlign: 'center' }}>#</th>
                                <th style={{ padding: '10px', fontSize: '12px', textAlign: 'left' }}>ACCIÓN</th>
                                <th style={{ padding: '10px', width: '100px', fontSize: '12px', textAlign: 'center' }}>PANTALLA</th>
                                <th style={{ padding: '10px', width: '100px', fontSize: '12px', textAlign: 'center' }}>ACCIONES</th>
                            </tr>
                        </thead>
                        <tbody>
                            {steps.map((step, i) => {
                                const isCurrent = executingIndex === i || singleStepIndex === i;
                                const isDragOver = dragOverIndex === i;
                                const borderBottomStyle = isDragOver && dragItem.current < i
                                    ? `2px dashed ${COLORS.CELESTE_PRINCIPAL}`
                                    : isDragOver && dragItem.current > i
                                        ? 'none'
                                        : '1px solid rgba(207, 221, 252, 0.05)';
                                return (
                                    <tr 
                                        key={i} draggable={!isExecuting} onDragStart={(e) => handleDragStart(e, i)} onDragOver={(e) => handleDragOver(e, i)} onDrop={(e) => handleDrop(e, i)} onDragEnd={handleDragEnd}
                                        style={{
                                            background: isCurrent ? 'rgba(143, 138, 249, 0.15)' : (isDragOver ? 'rgba(255, 255, 255, 0.05)' : 'transparent'),
                                            cursor: isExecuting ? 'default' : 'grab',
                                            borderTop: isDragOver && dragItem.current > i ? `2px dashed ${COLORS.CELESTE_PRINCIPAL}` : 'none',
                                            borderBottom: borderBottomStyle,
                                            transition: 'background 0.2s'
                                        }}
                                    >
                                        <td style={{ padding: '10px', textAlign: 'center', fontWeight: 'bold', color: isCurrent ? COLORS.AZUL_SECUNDARIO : COLORS.CELESTE_PRINCIPAL }}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                                                <span style={{ cursor: 'grab', opacity: 0.4, fontSize: '14px' }}>⣿</span>
                                                {completedStepIndex === i ? '✓' : isCurrent ? '▶' : i + 1}
                                            </div>
                                        </td>
                                        <td style={{ padding: '10px' }}>
                                            <div style={{ fontSize: '13px', fontWeight: '700', color: COLORS.CELESTE_PRINCIPAL }}>{step.speech ? `"${step.speech.substring(0, 45)}${step.speech.length > 45 ? '...' : ''}"` : 'Sin voz'}</div>
                                            <div style={{ fontSize: '11px', opacity: 0.7, color: COLORS.CELESTE_PRINCIPAL }}>{step.animation ? step.animation.split('/').pop() : 'Sin animación'}</div>
                                        </td>
                                        <td style={{ padding: '10px', textAlign: 'center', fontSize: '12px' }}>
                                            {step.screen && step.screen.type !== 'none' ? SCREEN_TYPES.find(t => t.value === step.screen.type)?.label || step.screen.type : 'Ninguna'}
                                        </td>
                                        <td style={{ padding: '10px', textAlign: 'center' }}>
                                            <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                                                <button onClick={() => openModal(i)} style={{ width: '26px', height: '26px', borderRadius: '5px', border: 'none', background: COLORS.AZUL_SECUNDARIO, color: COLORS.AZUL_PRINCIPAL, cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>✎</button>
                                                <button onClick={() => handleExecuteStep(i)} style={{ width: '26px', height: '26px', borderRadius: '5px', border: 'none', background: COLORS.CELESTE_PRINCIPAL, color: COLORS.AZUL_PRINCIPAL, cursor: 'pointer', fontSize: '10px' }}>▶</button>
                                                <button onClick={(e) => deleteStep(e, i)} style={{ width: '26px', height: '26px', borderRadius: '5px', border: 'none', background: 'rgba(220,53,69,0.8)', color: 'white', cursor: 'pointer', fontSize: '14px' }}>×</button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Footer con botones principales */}
            <div style={{ position: 'absolute', bottom: '15px', left: '30px', right: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button 
                    onClick={() => openModal()}
                    onMouseEnter={() => setHoveredBtn('add')} onMouseLeave={() => setHoveredBtn(null)}
                    style={{ height: '36px', padding: '0 25px', borderRadius: '90px', border: 'none', background: hoverBtn === 'add' ? COLORS.AZUL_SECUNDARIO : COLORS.CELESTE_PRINCIPAL, color: COLORS.AZUL_PRINCIPAL, fontFamily: TYPOGRAPHY.FONT_FAMILY_PRINCIPAL, fontWeight: '700', fontSize: '12px', cursor: 'pointer', transition: 'background 0.2s' }}
                >+ AGREGAR PASO</button>

                <div style={{ display: 'flex', gap: '10px' }}>
                    {!isExecuting ? (
                        <button 
                            onClick={handleExecuteAll} disabled={steps.length === 0}
                            onMouseEnter={() => setHoveredBtn('run')} onMouseLeave={() => setHoveredBtn(null)}
                            style={{ height: '36px', padding: '0 25px', borderRadius: '90px', border: 'none', background: hoverBtn === 'run' ? COLORS.AZUL_SECUNDARIO : COLORS.CELESTE_PRINCIPAL, color: COLORS.AZUL_PRINCIPAL, fontFamily: TYPOGRAPHY.FONT_FAMILY_PRINCIPAL, fontWeight: '700', fontSize: '12px', cursor: steps.length ? 'pointer' : 'not-allowed', opacity: steps.length ? 1 : 0.6, transition: 'background 0.2s' }}
                        >EJECUTAR SCRIPT</button>
                    ) : (
                        <button 
                            onClick={handleStopAll}
                            onMouseEnter={() => setHoveredBtn('stop')} onMouseLeave={() => setHoveredBtn(null)}
                            style={{ height: '36px', padding: '0 25px', borderRadius: '90px', border: 'none', background: hoverBtn === 'stop' ? '#b3154d' : '#E88B93', color: COLORS.AZUL_PRINCIPAL, fontFamily: TYPOGRAPHY.FONT_FAMILY_PRINCIPAL, fontWeight: '700', fontSize: '12px', cursor: 'pointer', transition: 'background 0.2s' }}
                        >DETENER TODO</button>
                    )}
                </div>
            </div>

            {/* Modal para añadir/editar paso */}
            {isModalOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div style={{ width: '650px', background: COLORS.AZUL_PRINCIPAL, borderRadius: '25px', position: 'relative', padding: '70px 40px 30px 40px', boxSizing: 'border-box', boxShadow: '0 15px 35px rgba(0,0,0,0.4)' }}>
                        
                        <div style={{ position: 'absolute', left: 0, top: '20px', width: '200px', height: '30px', background: COLORS.CELESTE_PRINCIPAL, borderTopRightRadius: '25px', borderBottomRightRadius: '25px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                            <span style={{ color: COLORS.AZUL_PRINCIPAL, fontFamily: TYPOGRAPHY.FONT_FAMILY_PRINCIPAL, fontWeight: '700', fontSize: '16px' }}>
                                {editingIndex !== null ? 'Editar Paso' : 'Nuevo Paso'}
                            </span>
                        </div>

                        <button onClick={() => setIsModalOpen(false)} style={{ position: 'absolute', top: '15px', right: '25px', background: 'none', border: 'none', color: COLORS.CELESTE_PRINCIPAL, fontSize: '28px', cursor: 'pointer', opacity: 0.7, transition: 'opacity 0.2s' }} onMouseEnter={e => e.target.style.opacity=1} onMouseLeave={e => e.target.style.opacity=0.7}>×</button>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: 'auto auto auto', gap: '25px 30px' }}>
                            
                            <div style={{ gridColumn: '1', gridRow: '1 / span 2', display: 'flex', flexDirection: 'column' }}>
                                <label style={labelStyle}>Voz de Pepper</label>
                                <textarea 
                                    value={modalStep.speech} 
                                    onChange={e => setModalStep({...modalStep, speech: e.target.value})} 
                                    placeholder="¿Qué dirá el robot?" 
                                    style={{ ...inputStyle, flex: 1, paddingTop: '10px', resize: 'none' }} 
                                />
                            </div>

                            <div style={{ gridColumn: '2', gridRow: '1 / span 2', display: 'flex', flexDirection: 'column' }}>
                                <label style={labelStyle}>Animación</label>
                                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', flex: 1 }}>
                                    
                                    <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                                        <div style={{ width: '34px', height: '34px', background: COLORS.CELESTE_PRINCIPAL, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                            <svg viewBox="0 0 24 24" width="20" height="20" fill={COLORS.AZUL_PRINCIPAL}>
                                                <path d="M12 2c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm9 7h-6v13h-2v-6h-2v6H9V9H3V7h18v2z"/>
                                            </svg>
                                        </div>
                                        <select value={selCat} onChange={e => handleAnimSelect('cat', e.target.value)} style={{ ...inputStyle, flex: 1 }}>
                                            <option value="">Seleccione Categoría...</option>
                                            {Object.keys(animTree).map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>

                                    <DotsRow />

                                    <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                                        <div style={{ width: '34px', height: '34px', background: COLORS.CELESTE_PRINCIPAL, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                            <svg viewBox="0 0 24 24" width="18" height="18" fill={COLORS.AZUL_PRINCIPAL}>
                                                <path d="M9 21c0 .5.4 1 1 1h4c.6 0 1-.5 1-1v-1H9v1zm3-19C8.1 2 5 5.1 5 9c0 2.4 1.2 4.5 3 5.7V17c0 .5.4 1 1 1h6c.6 0 1-.5 1-1v-2.3c1.8-1.3 3-3.4 3-5.7 0-3.9-3.1-7-7-7z"/>
                                            </svg>
                                        </div>
                                        <select value={selSub} disabled={!selCat} onChange={e => handleAnimSelect('sub', e.target.value)} style={{ ...inputStyle, flex: 1, opacity: selCat ? 1 : 0.6, cursor: selCat ? 'pointer' : 'not-allowed' }}>
                                            <option value="">Seleccione Subcategoría...</option>
                                            {selCat && Object.keys(animTree[selCat]).map(s => <option key={s} value={s}>{s === '_none' ? 'Sin subcategoría' : s}</option>)}
                                        </select>
                                    </div>

                                    <DotsRow />

                                    <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                                        <div style={{ width: '34px', height: '34px', background: COLORS.CELESTE_PRINCIPAL, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                            <svg viewBox="0 0 24 24" width="20" height="20" fill={COLORS.AZUL_PRINCIPAL}>
                                                <circle cx="8" cy="16" r="4" /><circle cx="12" cy="12" r="4" opacity="0.8" /><circle cx="16" cy="8" r="4" opacity="0.6" />
                                            </svg>
                                        </div>
                                        <select value={modalStep.animation.split('/').pop()} disabled={!selSub} onChange={e => handleAnimSelect('anim', e.target.value)} style={{ ...inputStyle, flex: 1, opacity: selSub ? 1 : 0.6, cursor: selSub ? 'pointer' : 'not-allowed' }}>
                                            <option value="">Seleccione Animación...</option>
                                            {selCat && selSub && animTree[selCat][selSub].map(a => <option key={a} value={a}>{a}</option>)}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div style={{ gridColumn: '1', gridRow: '3', display: 'flex', flexDirection: 'column' }}>
                                <label style={labelStyle}>Tipo de pantalla</label>
                                <select value={modalStep.screen?.type || 'none'} onChange={e => setModalStep({...modalStep, screen: e.target.value === 'none' ? null : { type: e.target.value, content: "" }})} style={inputStyle}>
                                    {SCREEN_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                </select>
                            </div>

                            <div style={{ gridColumn: '2', gridRow: '3', display: 'flex', flexDirection: 'column' }}>
                                {modalStep.screen && modalStep.screen.type !== 'subtitle' && modalStep.screen.type !== 'none' ? (
                                    <>
                                        <label style={labelStyle}>Contenido URL</label>
                                        <input type="text" value={modalStep.screen.content} onChange={e => setModalStep({...modalStep, screen: { ...modalStep.screen, content: e.target.value }})} style={inputStyle} placeholder="https://..." />
                                    </>
                                ) : null}
                            </div>

                        </div>

                        <div style={{ marginTop: '35px', display: 'flex', justifyContent: 'center', gap: '20px' }}>
                            <button 
                                onClick={() => setIsModalOpen(false)}
                                onMouseEnter={() => setHoverModal('cancel')} onMouseLeave={() => setHoverModal(null)}
                                style={{ width: '160px', height: '36px', borderRadius: '90px', border: `1px solid ${COLORS.CELESTE_PRINCIPAL}`, background: hoverModal === 'cancel' ? 'rgba(207, 221, 252, 0.1)' : 'transparent', color: COLORS.CELESTE_PRINCIPAL, fontFamily: TYPOGRAPHY.FONT_FAMILY_PRINCIPAL, fontWeight: '700', fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s' }}
                            >CANCELAR</button>
                            <button 
                                onClick={saveModalStep}
                                onMouseEnter={() => setHoverModal('save')} onMouseLeave={() => setHoverModal(null)}
                                style={{ width: '160px', height: '36px', borderRadius: '90px', border: 'none', background: hoverModal === 'save' ? COLORS.AZUL_SECUNDARIO : COLORS.CELESTE_PRINCIPAL, color: COLORS.AZUL_PRINCIPAL, fontFamily: TYPOGRAPHY.FONT_FAMILY_PRINCIPAL, fontWeight: '700', fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s' }}
                            >GUARDAR PASO</button>
                        </div>

                    </div>
                </div>
            )}

            {/* Alerta de ejecución de paso único */}
            {singleStepIndex !== null && (
                <div style={{ position: 'absolute', bottom: '60px', left: '50%', transform: 'translateX(-50%)', background: 'rgba(143, 138, 249, 0.95)', padding: '6px 16px', borderRadius: '90px', color: COLORS.AZUL_PRINCIPAL, fontFamily: TYPOGRAPHY.FONT_FAMILY_PRINCIPAL, fontSize: '12px', fontWeight: '700', zIndex: 10, display: 'flex', alignItems: 'center', gap: '15px', boxShadow: '0 4px 10px rgba(0,0,0,0.3)' }}>
                    EJECUTANDO PASO {singleStepIndex + 1}...
                    <span onClick={(e) => { e.stopPropagation(); handleStopSingleStep(); }} style={{ cursor: 'pointer', background: 'rgba(0,0,0,0.15)', padding: '4px 10px', borderRadius: '90px', color: '#fff' }}>PARAR</span>
                </div>
            )}
        </div>

        {/* Biblioteca de Scripts */}
        <ScriptPanel 
            scripts={sessionScripts} 
            activeIdx={activeSessionIdx} 
            onSelect={handleSelectFromSession} 
        />
        </div>
    );
};

export default ScriptsCreator;