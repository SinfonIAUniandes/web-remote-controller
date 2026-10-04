import { useRef, useState, useEffect } from 'react';
import { useRos } from '../contexts/RosContext';
import { executeStep, executeScript, parseLegacyTxt, stopSpeech } from '../services/scriptExecutor';
import { createTopic } from '../services/RosManager';
import { useAnimations } from '../services/useAnimations';
import { usePanicListener } from '../services/panic';
import { COLORS, TYPOGRAPHY } from '../theme';
import ScriptPanel from './ScriptPanel';

const LANGUAGES = ['Spanish', 'English'];

const SCREEN_TYPES = [
    { value: 'none',     label: 'Ninguna' },
    { value: 'subtitle', label: 'Subtítulo' },
    { value: 'image',    label: 'Imagen (URL)' },
    { value: 'web',      label: 'Página web (URL)' }
];

const createEmptyStep = (): ScriptStep => ({
    speech: '',
    animation: '',
    screen: null
});

type ScriptScreen = {
    type: 'subtitle' | 'image' | 'web' | 'video';
    content: string;
};

type ScriptStep = {
    id?: string;
    speech: string;
    animation: string;
    screen: ScriptScreen | null;
};

type ScriptConfig = {
    name: string;
    language: string;
    stepDelay: number;
};

type SessionScript = {
    config: ScriptConfig;
    steps: ScriptStep[];
};

type ScriptsCreatorProps = {
    sessionScripts: SessionScript[];
    setSessionScripts: React.Dispatch<React.SetStateAction<SessionScript[]>>;
};

// Variables CSS alimentadas desde COLORS/TYPOGRAPHY para usarlas en clases de Tailwind
const themeVars = {
    '--azul': COLORS.AZUL_PRINCIPAL,
    '--celeste': COLORS.CELESTE_PRINCIPAL,
    '--azul-sec': COLORS.AZUL_SECUNDARIO,
    '--font': TYPOGRAPHY.FONT_FAMILY_PRINCIPAL,
} as React.CSSProperties;

// Clases reutilizables
const INPUT = 'box-border h-8 w-full rounded-md border-none bg-[var(--celeste)] px-3 text-[13px] text-[var(--azul)] outline-none font-[family-name:var(--font)]';
const LABEL = 'mb-1.5 block text-[13px] font-bold text-[var(--celeste)] font-[family-name:var(--font)]';
const LABEL_SM = 'mb-1.5 block text-[11px] font-bold uppercase text-[var(--celeste)] font-[family-name:var(--font)]';
const PILL_SM = 'h-8 rounded-[90px] border-none bg-[var(--celeste)] px-[15px] text-[11px] font-bold text-[var(--azul)] transition-colors duration-200 ease-[ease] font-[family-name:var(--font)] hover:bg-[var(--azul-sec)]';
const PILL_LG = 'h-9 rounded-[90px] border-none bg-[var(--celeste)] px-[25px] text-xs font-bold text-[var(--azul)] transition-colors duration-200 ease-[ease] font-[family-name:var(--font)] hover:bg-[var(--azul-sec)]';

const DotsRow = () => (
    <div className="my-0.5 flex h-[14px] gap-[15px]">
        <div className="flex w-[34px] items-center justify-center">
            <div className="flex flex-col gap-[3px]">
                <div className="h-[3px] w-[3px] rounded-full bg-[var(--celeste)]" />
                <div className="h-[3px] w-[3px] rounded-full bg-[var(--celeste)]" />
                <div className="h-[3px] w-[3px] rounded-full bg-[var(--celeste)]" />
            </div>
        </div>
        <div className="flex-1"></div>
    </div>
);

const ScriptsCreator = ({ sessionScripts, setSessionScripts }: ScriptsCreatorProps) => {
    const { ros } = useRos();
    const { getAllAnimations } = useAnimations();

    const [config, setConfig] = useState<ScriptConfig>({ name: 'mi_script', language: 'Spanish', stepDelay: 3000 });
    const [steps, setSteps] = useState<ScriptStep[]>([]);
    const [activeSessionIdx, setActiveSessionIdx] = useState<number | null>(null);

    // Estados de ejecución
    const [isExecuting, setIsExecuting] = useState(false);
    const [executingIndex, setExecutingIndex] = useState<number | null>(null);
    const abortRef = useRef<AbortController | null>(null);
    const dragItem = useRef<number | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

    const [singleStepIndex, setSingleStepIndex] = useState<number | null>(null);
    const [completedStepIndex, setCompletedStepIndex] = useState<number | null>(null);
    const singleAbortRef = useRef<AbortController | null>(null);

    usePanicListener(() => {
        abortRef.current?.abort();
        singleAbortRef.current?.abort();
    });

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [modalStep, setModalStep] = useState(createEmptyStep());

    const [animTree, setAnimTree] = useState<Record<string, Record<string, string[]>>>({});
    const [selCat, setSelCat] = useState("");
    const [selSub, setSelSub] = useState("");

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
        const tree: Record<string, Record<string, string[]>> = {};
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

    const openModal = (index: number | null = null) => {
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

    const handleAnimSelect = (type: 'cat' | 'sub' | 'anim', val: string) => {
        if (type === 'cat') { setSelCat(val); setSelSub(""); setModalStep(prev => ({ ...prev, animation: "" })); }
        else if (type === 'sub') { setSelSub(val); setModalStep(prev => ({ ...prev, animation: "" })); }
        else if (type === 'anim') {
            const fullPath = selSub === "_none" ? `${selCat}/${val}` : `${selCat}/${selSub}/${val}`;
            setModalStep(prev => ({ ...prev, animation: fullPath }));
        }
    };

    const handleDragStart = (e: React.DragEvent, index: number) => { dragItem.current = index; e.dataTransfer.effectAllowed = "move"; };
    const handleDragOver = (e: React.DragEvent, index: number) => { e.preventDefault(); if (dragItem.current !== index) setDragOverIndex(index); };
    const handleDrop = (e: React.DragEvent, index: number) => {
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

    const deleteStep = (e: React.MouseEvent, index: number) => { e.stopPropagation(); setSteps(prev => prev.filter((_, i) => i !== index)); };

    // ── Ejecución de un solo paso ─────────────────────────────────────────
    const handleExecuteStep = async (index: number) => {
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
        if (ros) stopSpeech(ros);
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
        if (ros) stopSpeech(ros);
    };

    const handleDownload = () => {
        const cleanSteps = steps.map(({ id: _id, ...rest }) => rest);
        const blob = new Blob([JSON.stringify({ config, steps: cleanSteps }, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = `${config.name}.json`; a.click(); URL.revokeObjectURL(url);
    };

    const handleLoadScript = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]; if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            try {
            const result = reader.result;
            if (typeof result !== 'string') throw new Error('Invalid file content');
            let data = file.name.endsWith('.json') ? JSON.parse(result) : parseLegacyTxt(result, file.name);
                const loadedScript = { config: data.config, steps: data.steps.map(({ id: _id, ...rest }: ScriptStep) => rest) };
                
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

    const handleSelectFromSession = (idx: number) => {
        setActiveSessionIdx(idx);
        setConfig(sessionScripts[idx].config);
        setSteps(sessionScripts[idx].steps);
    };

    return (
        <div className="flex flex-col gap-0">
        {/* <div style={themeVars} className="relative box-border flex min-h-[450px] w-[630px] max-w-full flex-col overflow-visible rounded-[25px] bg-[var(--azul)]"> */}
        <div style={themeVars} className="relative box-border flex min-h-[450px] max-w-full flex-col overflow-visible rounded-[25px] bg-[var(--azul)]">

            {/* Título */}
            <div className="absolute left-0 top-5 z-[2] flex h-[30px] w-[min(200px,90%)] items-center justify-center rounded-r-[25px] bg-[var(--celeste)]">
                <span className="text-base font-bold text-[var(--azul)] font-[family-name:var(--font)]">
                    Creador de Scripts
                </span>
            </div>

            {/* Configuración rápida */}
            <div className="mx-[30px] mt-[70px] flex flex-wrap items-end gap-[15px]">
                <div className="flex-1">
                    <label className={LABEL_SM}>NOMBRE</label>
                    <input type="text" value={config.name} onChange={e => setConfig({...config, name: e.target.value})} className={INPUT} />
                </div>
                <div className="w-[110px]">
                    <label className={LABEL_SM}>IDIOMA</label>
                    <select value={config.language} onChange={e => setConfig({...config, language: e.target.value})} className={INPUT}>
                        {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                </div>
                <div className="w-[90px]">
                    <label className={LABEL_SM}>DELAY (ms)</label>
                    <input type="number" step="500" value={config.stepDelay} onChange={e => setConfig({...config, stepDelay: parseInt(e.target.value)})} className={INPUT} />
                </div>

                <input id="load-script-input" type="file" accept=".json,.txt" onChange={handleLoadScript} className="hidden" />
                <button onClick={handleNewScript} className={`${PILL_SM} cursor-pointer`}>NUEVO</button>

                <button onClick={() => document.getElementById('load-script-input')?.click()} className={`${PILL_SM} cursor-pointer`}>CARGAR</button>

                <button onClick={handleDownload} disabled={steps.length === 0} className={`${PILL_SM} cursor-pointer disabled:cursor-not-allowed disabled:opacity-50`}>GUARDAR</button>
            </div>

            {/* Tabla de pasos */}
            <div className="mx-5 mt-3 h-[235px] shrink-0 overflow-y-auto rounded-[10px] bg-[rgba(207,221,252,0.03)]">
                {steps.length === 0 ? (
                    <div className="m-[5px] box-border flex h-full items-center justify-center rounded-[10px] border-2 border-dashed border-[rgba(207,221,252,0.15)] text-sm text-[var(--celeste)] opacity-60 font-[family-name:var(--font)]">
                        Sin pasos. Haz clic en "+ Agregar Paso" para comenzar.
                    </div>
                ) : (
                    <table className="w-full border-collapse text-[var(--celeste)] font-[family-name:var(--font)]">
                        <thead className="sticky top-0 z-[5] bg-[var(--azul)]">
                            <tr className="border-b border-solid border-[rgba(207,221,252,0.2)]">
                                <th className="w-[45px] p-2.5 text-center text-xs">#</th>
                                <th className="p-2.5 text-left text-xs">ACCIÓN</th>
                                <th className="w-[100px] p-2.5 text-center text-xs">PANTALLA</th>
                                <th className="w-[100px] p-2.5 text-center text-xs">ACCIONES</th>
                            </tr>
                        </thead>
                        <tbody>
                            {steps.map((step, i) => {
                                const isCurrent = executingIndex === i || singleStepIndex === i;
                                const isDragOver = dragOverIndex === i;
                                const dragFrom = dragItem.current;
                                const dropBelow = isDragOver && dragFrom !== null && dragFrom < i;
                                const dropAbove = isDragOver && dragFrom !== null && dragFrom > i;
                                const rowBorder = dropBelow
                                    ? 'border-b-2 border-dashed border-[var(--celeste)]'
                                    : dropAbove
                                        ? 'border-t-2 border-b-0 border-dashed border-[var(--celeste)]'
                                        : 'border-b border-solid border-[rgba(207,221,252,0.05)]';
                                const rowBg = isCurrent ? 'bg-[rgba(143,138,249,0.15)]' : (isDragOver ? 'bg-[rgba(255,255,255,0.05)]' : 'bg-transparent');
                                return (
                                    <tr
                                        key={i} draggable={!isExecuting} onDragStart={(e) => handleDragStart(e, i)} onDragOver={(e) => handleDragOver(e, i)} onDrop={(e) => handleDrop(e, i)} onDragEnd={handleDragEnd}
                                        className={`transition-colors duration-200 ease-[ease] ${rowBg} ${rowBorder} ${isExecuting ? 'cursor-default' : 'cursor-grab'}`}
                                    >
                                        <td className={`p-2.5 text-center font-bold ${isCurrent ? 'text-[var(--azul-sec)]' : 'text-[var(--celeste)]'}`}>
                                            <div className="flex items-center justify-center gap-1.5">
                                                <span className="cursor-grab text-sm opacity-40">⣿</span>
                                                {completedStepIndex === i ? '✓' : isCurrent ? '▶' : i + 1}
                                            </div>
                                        </td>
                                        <td className="p-2.5">
                                            <div className="text-[13px] font-bold text-[var(--celeste)]">{step.speech ? `"${step.speech.substring(0, 45)}${step.speech.length > 45 ? '...' : ''}"` : 'Sin voz'}</div>
                                            <div className="text-[11px] text-[var(--celeste)] opacity-70">{step.animation ? step.animation.split('/').pop() : 'Sin animación'}</div>
                                        </td>
                                        <td className="p-2.5 text-center text-xs">
                                            {step.screen ? SCREEN_TYPES.find(t => t.value === step.screen?.type)?.label || step.screen?.type : 'Ninguna'}
                                        </td>
                                        <td className="p-2.5 text-center">
                                            <div className="flex justify-center gap-1.5">
                                                <button onClick={() => openModal(i)} className="h-[26px] w-[26px] cursor-pointer rounded-[5px] border-none bg-[var(--azul-sec)] text-xs font-bold text-[var(--azul)]">✎</button>
                                                <button onClick={() => handleExecuteStep(i)} className="h-[26px] w-[26px] cursor-pointer rounded-[5px] border-none bg-[var(--celeste)] text-[10px] text-[var(--azul)]">▶</button>
                                                <button onClick={(e) => deleteStep(e, i)} className="h-[26px] w-[26px] cursor-pointer rounded-[5px] border-none bg-[rgba(220,53,69,0.8)] text-sm text-white">×</button>
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
            <div className="mt-auto flex flex-wrap items-center justify-between gap-2.5 px-[30px] pb-[15px] pt-[15px]">
                <button onClick={() => openModal()} className={`${PILL_LG} cursor-pointer`}>+ AGREGAR PASO</button>

                <div className="flex gap-2.5">
                    {!isExecuting ? (
                        <button
                            onClick={handleExecuteAll} disabled={steps.length === 0}
                            className={`${PILL_LG} cursor-pointer disabled:cursor-not-allowed disabled:opacity-60`}
                        >EJECUTAR SCRIPT</button>
                    ) : (
                        <button
                            onClick={handleStopAll}
                            className="h-9 cursor-pointer rounded-[90px] border-none bg-[#E88B93] px-[25px] text-xs font-bold text-[var(--azul)] transition-colors duration-200 ease-[ease] font-[family-name:var(--font)] hover:bg-[#b3154d]"
                        >DETENER TODO</button>
                    )}
                </div>
            </div>

            {/* Modal para añadir/editar paso */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-[rgba(0,0,0,0.6)] backdrop-blur-[4px]">
                    <div className="relative box-border max-h-[95vh] w-[650px] max-w-[95vw] overflow-y-auto rounded-[25px] bg-[var(--azul)] px-5 pb-[30px] pt-[70px] shadow-[0_15px_35px_rgba(0,0,0,0.4)] sm:px-10">

                        <div className="absolute left-0 top-5 flex h-[30px] w-[min(200px,90%)] items-center justify-center rounded-r-[25px] bg-[var(--celeste)]">
                            <span className="text-base font-bold text-[var(--azul)] font-[family-name:var(--font)]">
                                {editingIndex !== null ? 'Editar Paso' : 'Nuevo Paso'}
                            </span>
                        </div>

                        <button onClick={() => setIsModalOpen(false)} className="absolute right-[25px] top-[15px] cursor-pointer border-none bg-transparent text-[28px] text-[var(--celeste)] opacity-70 transition-opacity duration-200 ease-[ease] hover:opacity-100">×</button>

                        <div className="grid grid-cols-1 gap-[25px] sm:grid-cols-2 sm:grid-rows-[auto_auto_auto] sm:gap-x-[30px]">

                            <div className="flex flex-col sm:[grid-column:1] sm:[grid-row:1/span_2]">
                                <label className={LABEL}>Voz de Pepper</label>
                                <textarea
                                    value={modalStep.speech}
                                    onChange={e => setModalStep({...modalStep, speech: e.target.value})}
                                    placeholder="¿Qué dirá el robot?"
                                    className={`${INPUT} min-h-[100px] flex-1 resize-none pt-2.5`}
                                />
                            </div>

                            <div className="flex flex-col sm:[grid-column:2] sm:[grid-row:1/span_2]">
                                <label className={LABEL}>Animación</label>
                                <div className="flex flex-1 flex-col justify-between">

                                    <div className="flex items-center gap-[15px]">
                                        <div className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full bg-[var(--celeste)]">
                                            <svg viewBox="0 0 24 24" width="20" height="20" fill={COLORS.AZUL_PRINCIPAL}>
                                                <path d="M12 2c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm9 7h-6v13h-2v-6h-2v6H9V9H3V7h18v2z"/>
                                            </svg>
                                        </div>
                                        <select value={selCat} onChange={e => handleAnimSelect('cat', e.target.value)} className={`${INPUT} flex-1`}>
                                            <option value="">Seleccione Categoría...</option>
                                            {Object.keys(animTree).map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>

                                    <DotsRow />

                                    <div className="flex items-center gap-[15px]">
                                        <div className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full bg-[var(--celeste)]">
                                            <svg viewBox="0 0 24 24" width="18" height="18" fill={COLORS.AZUL_PRINCIPAL}>
                                                <path d="M9 21c0 .5.4 1 1 1h4c.6 0 1-.5 1-1v-1H9v1zm3-19C8.1 2 5 5.1 5 9c0 2.4 1.2 4.5 3 5.7V17c0 .5.4 1 1 1h6c.6 0 1-.5 1-1v-2.3c1.8-1.3 3-3.4 3-5.7 0-3.9-3.1-7-7-7z"/>
                                            </svg>
                                        </div>
                                        <select value={selSub} disabled={!selCat} onChange={e => handleAnimSelect('sub', e.target.value)} className={`${INPUT} flex-1 ${selCat ? 'cursor-pointer opacity-100' : 'cursor-not-allowed opacity-60'}`}>
                                            <option value="">Seleccione Subcategoría...</option>
                                            {selCat && Object.keys(animTree[selCat]).map(s => <option key={s} value={s}>{s === '_none' ? 'Sin subcategoría' : s}</option>)}
                                        </select>
                                    </div>

                                    <DotsRow />

                                    <div className="flex items-center gap-[15px]">
                                        <div className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full bg-[var(--celeste)]">
                                            <svg viewBox="0 0 24 24" width="20" height="20" fill={COLORS.AZUL_PRINCIPAL}>
                                                <circle cx="8" cy="16" r="4" /><circle cx="12" cy="12" r="4" opacity="0.8" /><circle cx="16" cy="8" r="4" opacity="0.6" />
                                            </svg>
                                        </div>
                                        <select value={modalStep.animation.split('/').pop()} disabled={!selSub} onChange={e => handleAnimSelect('anim', e.target.value)} className={`${INPUT} flex-1 ${selSub ? 'cursor-pointer opacity-100' : 'cursor-not-allowed opacity-60'}`}>
                                            <option value="">Seleccione Animación...</option>
                                            {selCat && selSub && animTree[selCat][selSub].map(a => <option key={a} value={a}>{a}</option>)}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col sm:[grid-column:1] sm:[grid-row:3]">
                                <label className={LABEL}>Tipo de pantalla</label>
                                <select value={modalStep.screen?.type || 'none'} onChange={e => { const type = e.target.value; setModalStep({ ...modalStep, screen: type === 'none' ? null : { type: type as ScriptScreen['type'], content: '' } }); }} className={INPUT}>
                                    {SCREEN_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                </select>
                            </div>

                            <div className="flex flex-col empty:hidden sm:[grid-column:2] sm:[grid-row:3]">
                                {modalStep.screen && modalStep.screen.type !== 'subtitle' ? (
                                    <>
                                        <label className={LABEL}>Contenido URL</label>
                                        <input type="text" value={modalStep.screen.content} onChange={e => setModalStep({...modalStep, screen: { type: modalStep.screen!.type, content: e.target.value }})} className={INPUT} placeholder="https://..." />
                                    </>
                                ) : null}
                            </div>

                        </div>

                        <div className="mt-[35px] flex flex-wrap justify-center gap-5">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="h-9 w-[160px] cursor-pointer rounded-[90px] border border-solid border-[var(--celeste)] bg-transparent text-[13px] font-bold text-[var(--celeste)] transition-all duration-200 ease-[ease] font-[family-name:var(--font)] hover:bg-[rgba(207,221,252,0.1)]"
                            >CANCELAR</button>
                            <button
                                onClick={saveModalStep}
                                className="h-9 w-[160px] cursor-pointer rounded-[90px] border-none bg-[var(--celeste)] text-[13px] font-bold text-[var(--azul)] transition-all duration-200 ease-[ease] font-[family-name:var(--font)] hover:bg-[var(--azul-sec)]"
                            >GUARDAR PASO</button>
                        </div>

                    </div>
                </div>
            )}

            {/* Alerta de ejecución de paso único */}
            {singleStepIndex !== null && (
                <div className="absolute bottom-[60px] left-1/2 z-10 flex -translate-x-1/2 items-center gap-[15px] whitespace-nowrap rounded-[90px] bg-[rgba(143,138,249,0.95)] px-4 py-1.5 text-xs font-bold text-[var(--azul)] shadow-[0_4px_10px_rgba(0,0,0,0.3)] font-[family-name:var(--font)]">
                    EJECUTANDO PASO {singleStepIndex + 1}...
                    <span onClick={(e) => { e.stopPropagation(); handleStopSingleStep(); }} className="cursor-pointer rounded-[90px] bg-[rgba(0,0,0,0.15)] px-2.5 py-1 text-white">PARAR</span>
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