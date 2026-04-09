import { useRef, useState, useEffect } from 'react';
import { useRos } from '../contexts/RosContext';
import { executeScript, executeStep, parseLegacyTxt, stopSpeech } from '../services/scriptExecutor';
import { useAnimations } from '../hooks/useAnimations';
import { COLORS, TYPOGRAPHY } from '../theme';

const LANGUAGES = ['Spanish', 'English', 'French', 'German'];

const SCREEN_TYPES = [
    { value: 'none',     label: 'Ninguna' },
    { value: 'subtitle', label: 'Subtítulo' },
    { value: 'image',    label: 'Imagen (URL)' },
    { value: 'video',    label: 'Video (archivo)' },
    { value: 'web',      label: 'Página web (URL)' }
];

const createEmptyStep = () => ({
    speech: '',
    animation: '',
    screen: null
});

const ScriptsCreator = () => {
    const { ros } = useRos();
    const { getAllAnimations } = useAnimations();

    const [config, setConfig] = useState({ name: 'mi_script', language: 'Spanish' });
    const [steps, setSteps] = useState([]);
    const [stepDelay, setStepDelay] = useState(3000); // ms entre pasos

    // Estado de ejecución completa
    const [isExecuting, setIsExecuting] = useState(false);
    const [executingIndex, setExecutingIndex] = useState(null);
    const abortRef = useRef(null);

    // Estado de ejecución de paso individual
    const [singleStepIndex, setSingleStepIndex] = useState(null); // paso ejecutándose
    const [completedStepIndex, setCompletedStepIndex] = useState(null); // feedback de finalización
    const singleAbortRef = useRef(null);

    // Limpiar el indicador de "completado" tras 2 segundos
    useEffect(() => {
        if (completedStepIndex === null) return;
        const t = setTimeout(() => setCompletedStepIndex(null), 2000);
        return () => clearTimeout(t);
    }, [completedStepIndex]);

    // ── Mutaciones de pasos ─────────────────────────────────────────────────

    const addStep = () => setSteps(prev => [...prev, createEmptyStep()]);

    const deleteStep = (index) =>
        setSteps(prev => prev.filter((_, i) => i !== index));

    const moveStep = (index, dir) => {
        setSteps(prev => {
            const next = [...prev];
            const target = index + dir;
            if (target < 0 || target >= next.length) return prev;
            [next[index], next[target]] = [next[target], next[index]];
            return next;
        });
    };

    const updateStep = (index, field, value) =>
        setSteps(prev => prev.map((s, i) => i === index ? { ...s, [field]: value } : s));

    const updateScreenType = (index, type) => {
        setSteps(prev => prev.map((s, i) => {
            if (i !== index) return s;
            return { ...s, screen: type === 'none' ? null : { type, content: '' } };
        }));
    };

    const updateScreenContent = (index, content) =>
        setSteps(prev => prev.map((s, i) =>
            i === index ? { ...s, screen: { ...s.screen, content } } : s
        ));

    // Carga de archivo de video → base64 data URI
    const handleVideoUpload = (index, file) => {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            updateScreenContent(index, e.target.result); // data URI base64
        };
        reader.readAsDataURL(file);
    };

    // ── Ejecución completa ──────────────────────────────────────────────────

    const handleExecuteAll = async () => {
        if (!ros || isExecuting || steps.length === 0) return;
        const ctrl = new AbortController();
        abortRef.current = ctrl;
        setIsExecuting(true);
        try {
            await executeScript(ros, steps, config.language, {
                onStepStart: setExecutingIndex,
                onStepEnd: () => {},
                signal: ctrl.signal,
                stepDelay
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

    // ── Ejecución de paso individual ────────────────────────────────────────

    const handleExecuteStep = async (index) => {
        if (!ros || singleStepIndex !== null) return;
        const ctrl = new AbortController();
        singleAbortRef.current = ctrl;
        setSingleStepIndex(index);
        setCompletedStepIndex(null);
        try {
            await executeStep(ros, steps[index], config.language, ctrl.signal);
            if (!ctrl.signal.aborted) {
                setCompletedStepIndex(index);
            }
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

    // ── Download / Upload ───────────────────────────────────────────────────

    const handleDownload = () => {
        const cleanSteps = steps.map(({ id: _id, ...rest }) => rest);
        const data = { config, steps: cleanSteps };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
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
                    if (!data.config || !Array.isArray(data.steps)) throw new Error('Estructura inválida');
                } else {
                    data = parseLegacyTxt(e.target.result, file.name);
                }
                setConfig(data.config);
                setSteps(data.steps.map(({ id: _id, ...rest }) => rest));
                event.target.value = '';
            } catch {
                alert('Error al cargar el archivo. Verifica el formato (.json o .txt).');
            }
        };
        reader.readAsText(file);
    };

    // ── Estilos helpers ─────────────────────────────────────────────────────

    const inputStyle = {
        padding: '4px 6px',
        border: `1px solid ${COLORS.AZUL_SECUNDARIO}`,
        borderRadius: '4px',
        fontFamily: TYPOGRAPHY.FONT_FAMILY_PRINCIPAL,
        fontSize: '13px',
        width: '100%',
        boxSizing: 'border-box'
    };

    const btnBase = {
        padding: '6px 10px',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        fontFamily: TYPOGRAPHY.FONT_FAMILY_PRINCIPAL,
        fontWeight: TYPOGRAPHY.FONT_WEIGHT_SEMI_BOLD,
        fontSize: '13px'
    };

    const allAnimations = getAllAnimations();

    // ── Render ──────────────────────────────────────────────────────────────

    return (
        <div style={{ fontFamily: TYPOGRAPHY.FONT_FAMILY_PRINCIPAL, padding: '16px' }}>
            <h2 style={{ color: COLORS.AZUL_PRINCIPAL, marginBottom: '12px' }}>Creador de Scripts</h2>

            {/* ── HEADER ── */}
            <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '12px',
                alignItems: 'flex-end',
                padding: '12px',
                backgroundColor: COLORS.CELESTE_PRINCIPAL,
                borderRadius: '10px',
                marginBottom: '16px'
            }}>
                <div>
                    <label style={labelStyle}>Nombre</label>
                    <input
                        type="text"
                        value={config.name}
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

                <div>
                    <label style={labelStyle}>Pausa entre pasos (ms)</label>
                    <input
                        type="number"
                        min="0"
                        step="500"
                        value={stepDelay}
                        onChange={e => setStepDelay(Math.max(0, parseInt(e.target.value) || 0))}
                        style={{ ...inputStyle, width: '110px' }}
                    />
                </div>

                <div>
                    <label style={labelStyle}>Editar Script</label>
                    <input
                        id="load-script-input"
                        type="file"
                        accept=".json,.txt"
                        onChange={handleLoadScript}
                        style={{ display: 'none' }}
                    />
                    <button
                        onClick={() => document.getElementById('load-script-input').click()}
                        style={{ ...btnBase, backgroundColor: COLORS.AMARILLO, color: COLORS.AZUL_PRINCIPAL }}
                    >
                        Cargar para editar
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

            {/* ── Stop de paso individual (flotante) ── */}
            {singleStepIndex !== null && (
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '8px 12px',
                    marginBottom: '10px',
                    backgroundColor: '#fff8e1',
                    border: `1px solid ${COLORS.AMARILLO}`,
                    borderRadius: '8px'
                }}>
                    <span style={{ fontSize: '13px', color: COLORS.AZUL_PRINCIPAL }}>
                        ▶ Ejecutando paso {singleStepIndex + 1}...
                    </span>
                    <button
                        onClick={handleStopSingleStep}
                        style={{ ...btnBase, backgroundColor: COLORS.ROJO, color: '#fff', padding: '4px 10px' }}
                    >
                        Detener
                    </button>
                </div>
            )}

            {/* ── TABLA ── */}
            <div style={{ overflowX: 'auto', marginBottom: '12px' }}>
                {steps.length === 0 ? (
                    <div style={{
                        padding: '24px',
                        textAlign: 'center',
                        color: COLORS.AZUL_PRINCIPAL,
                        opacity: 0.5,
                        border: `2px dashed ${COLORS.AZUL_SECUNDARIO}`,
                        borderRadius: '8px'
                    }}>
                        Sin pasos. Añade uno o sube un script.
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
                                const isActive = executingIndex === i;
                                const isSingleActive = singleStepIndex === i;
                                const isCompleted = completedStepIndex === i;
                                const screenType = step.screen?.type ?? 'none';

                                let rowBg = i % 2 === 0 ? '#fff' : '#f7f9ff';
                                if (isActive) rowBg = '#e8fff3';
                                if (isSingleActive) rowBg = '#fffbe6';
                                if (isCompleted) rowBg = '#d4f7e0';

                                return (
                                    <tr
                                        key={i}
                                        style={{
                                            backgroundColor: rowBg,
                                            borderLeft: isActive
                                                ? `4px solid ${COLORS.VERDE}`
                                                : isSingleActive
                                                    ? `4px solid ${COLORS.AMARILLO}`
                                                    : isCompleted
                                                        ? `4px solid ${COLORS.VERDE}`
                                                        : '4px solid transparent',
                                            transition: 'background-color 0.3s'
                                        }}
                                    >
                                        {/* # + feedback */}
                                        <td style={{ ...td, textAlign: 'center', fontWeight: TYPOGRAPHY.FONT_WEIGHT_BOLD, color: COLORS.AZUL_PRINCIPAL, minWidth: '36px' }}>
                                            {isCompleted ? '✓' : isSingleActive ? '▶' : i + 1}
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
                                                    (usa el texto del speech)
                                                </span>
                                            )}
                                            {(screenType === 'image' || screenType === 'web') && (
                                                <input
                                                    type="text"
                                                    value={step.screen?.content ?? ''}
                                                    onChange={e => updateScreenContent(i, e.target.value)}
                                                    placeholder={screenType === 'image' ? 'https://url.com/imagen.jpg' : 'https://pagina.com'}
                                                    style={{ ...inputStyle, minWidth: '200px' }}
                                                />
                                            )}
                                            {screenType === 'video' && (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                    <input
                                                        type="file"
                                                        accept="video/*"
                                                        onChange={e => handleVideoUpload(i, e.target.files[0])}
                                                        style={{ fontSize: '12px' }}
                                                    />
                                                    {step.screen?.content && (
                                                        <span style={{ fontSize: '11px', color: COLORS.VERDE }}>
                                                            ✓ Video cargado
                                                        </span>
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
                                                onClick={() => moveStep(i, -1)}
                                                disabled={i === 0}
                                                title="Subir"
                                                style={{ ...btnBase, backgroundColor: '#e0e0e0', color: '#333', marginRight: '3px' }}
                                            >↑</button>
                                            <button
                                                onClick={() => moveStep(i, 1)}
                                                disabled={i === steps.length - 1}
                                                title="Bajar"
                                                style={{ ...btnBase, backgroundColor: '#e0e0e0', color: '#333', marginRight: '3px' }}
                                            >↓</button>
                                            <button
                                                onClick={() => deleteStep(i)}
                                                title="Eliminar"
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

            {/* ── FOOTER ── */}
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                <button
                    onClick={addStep}
                    style={{ ...btnBase, backgroundColor: COLORS.VERDE, color: '#fff' }}
                >
                    + Agregar paso
                </button>

                <button
                    onClick={handleExecuteAll}
                    disabled={isExecuting || steps.length === 0}
                    style={{
                        ...btnBase,
                        backgroundColor: isExecuting ? '#999' : COLORS.AZUL_SECUNDARIO,
                        color: '#fff',
                        padding: '8px 16px'
                    }}
                >
                    {isExecuting
                        ? `Ejecutando... (paso ${(executingIndex ?? 0) + 1}/${steps.length})`
                        : 'Ejecutar Script Completo'}
                </button>

                {isExecuting && (
                    <button
                        onClick={handleStopAll}
                        style={{ ...btnBase, backgroundColor: COLORS.ROJO, color: '#fff', padding: '8px 16px' }}
                    >
                        Detener todo
                    </button>
                )}

                {steps.length > 0 && (
                    <span style={{ fontSize: '13px', color: COLORS.AZUL_PRINCIPAL, opacity: 0.6, marginLeft: 'auto' }}>
                        {steps.length} paso{steps.length !== 1 ? 's' : ''} · {stepDelay / 1000}s entre pasos
                    </span>
                )}
            </div>
        </div>
    );
};

// ── Estilos estáticos ─────────────────────────────────────────────────────────

const th = {
    padding: '8px 10px',
    textAlign: 'left',
    fontWeight: TYPOGRAPHY.FONT_WEIGHT_SEMI_BOLD,
    fontSize: '13px',
    whiteSpace: 'nowrap'
};

const td = {
    padding: '6px 8px',
    verticalAlign: 'middle',
    borderBottom: '1px solid #e0e6f0'
};

const labelStyle = {
    display: 'block',
    fontSize: '12px',
    fontWeight: TYPOGRAPHY.FONT_WEIGHT_SEMI_BOLD,
    color: COLORS.AZUL_PRINCIPAL,
    marginBottom: '3px'
};

export default ScriptsCreator;
