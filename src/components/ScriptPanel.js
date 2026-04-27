import { useRef, useState } from 'react';
import { useRos } from '../contexts/RosContext';
import { executeScript, executeStep, parseLegacyTxt, stopSpeech } from '../services/scriptExecutor';
import { COLORS, TYPOGRAPHY } from '../theme';

const ScriptPanel = () => {
    const { ros } = useRos();
    const [scriptData, setScriptData] = useState(null);   // { config, steps }
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [isExecuting, setIsExecuting] = useState(false);
    const abortRef = useRef(null);

    // ── Carga de archivo ────────────────────────────────────────────────────

    const handleFileLoad = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                let data;
                if (file.name.endsWith('.json')) {
                    data = JSON.parse(e.target.result);
                    if (!data.config || !Array.isArray(data.steps)) throw new Error('Estructura inválida');
                } else if (file.name.endsWith('.txt')) {
                    data = parseLegacyTxt(e.target.result, file.name);
                } else {
                    alert('Formato no soportado. Usa .json o .txt');
                    return;
                }
                setScriptData(data);
                setSelectedIndex(0);
                event.target.value = '';
            } catch {
                alert('Error al cargar el archivo. Verifica el formato.');
            }
        };
        reader.readAsText(file);
    };

    // ── Ejecución ───────────────────────────────────────────────────────────

    const handleExecuteStep = () => {
        if (!ros || !scriptData || scriptData.steps.length === 0) return;
        executeStep(ros, scriptData.steps[selectedIndex], scriptData.config.language);
    };

    const handleAutoPlay = async () => {
        if (!ros || !scriptData || isExecuting) return;
        const ctrl = new AbortController();
        abortRef.current = ctrl;
        setIsExecuting(true);
        try {
            await executeScript(ros, scriptData.steps, scriptData.config.language, {
                onStepStart: setSelectedIndex,
                signal: ctrl.signal
            });
        } finally {
            setIsExecuting(false);
            abortRef.current = null;
        }
    };

    const handleStop = () => { abortRef.current?.abort(); stopSpeech(ros); };

    // ── Navegación ──────────────────────────────────────────────────────────

    const steps = scriptData?.steps ?? [];
    const total = steps.length;

    const handlePrev = () => setSelectedIndex(i => Math.max(0, i - 1));
    const handleNext = () => setSelectedIndex(i => Math.min(total - 1, i + 1));

    // ── Helpers de estilo ───────────────────────────────────────────────────

    const btnBase = {
        padding: '7px 14px',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        fontFamily: TYPOGRAPHY.FONT_FAMILY_PRINCIPAL,
        fontWeight: TYPOGRAPHY.FONT_WEIGHT_SEMI_BOLD,
        fontSize: '13px'
    };

    // ── Render ──────────────────────────────────────────────────────────────

    return (
        <div style={{ fontFamily: TYPOGRAPHY.FONT_FAMILY_PRINCIPAL, padding: '16px' }}>
            <h2 style={{ color: COLORS.AZUL_PRINCIPAL, marginBottom: '12px' }}>Reproductor de Script</h2>

            {/* ── Carga de archivo ── */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                flexWrap: 'wrap',
                padding: '10px 14px',
                backgroundColor: COLORS.CELESTE_PRINCIPAL,
                borderRadius: '8px',
                marginBottom: '14px'
            }}>
                <input
                    type="file"
                    accept=".json,.txt"
                    onChange={handleFileLoad}
                    style={{ fontSize: '13px' }}
                />
                {scriptData && (
                    <>
                        <span style={{ fontWeight: TYPOGRAPHY.FONT_WEIGHT_BOLD, color: COLORS.AZUL_PRINCIPAL }}>
                            {scriptData.config.name}
                        </span>
                        <span style={{
                            backgroundColor: COLORS.AZUL_SECUNDARIO,
                            color: '#fff',
                            padding: '2px 8px',
                            borderRadius: '10px',
                            fontSize: '12px'
                        }}>
                            {scriptData.config.language}
                        </span>
                        <span style={{ fontSize: '13px', color: COLORS.AZUL_PRINCIPAL, opacity: 0.6 }}>
                            {total} paso{total !== 1 ? 's' : ''}
                        </span>
                    </>
                )}
            </div>

            {/* ── Lista de pasos ── */}
            {scriptData ? (
                <>
                    <div style={{
                        height: '200px',
                        overflowY: 'auto',
                        border: `1px solid ${COLORS.AZUL_SECUNDARIO}`,
                        borderRadius: '8px',
                        marginBottom: '12px'
                    }}>
                        {steps.map((step, i) => (
                            <div
                                key={i}
                                onClick={() => setSelectedIndex(i)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    padding: '8px 12px',
                                    cursor: 'pointer',
                                    backgroundColor: selectedIndex === i ? COLORS.AZUL_SECUNDARIO : 'transparent',
                                    color: selectedIndex === i ? '#fff' : COLORS.AZUL_PRINCIPAL,
                                    borderBottom: '1px solid #e0e6f0',
                                    transition: 'background-color 0.15s'
                                }}
                            >
                                <span style={{ opacity: 0.6, minWidth: '24px', textAlign: 'right', fontSize: '12px' }}>
                                    {i + 1}
                                </span>
                                <span style={{ fontWeight: TYPOGRAPHY.FONT_WEIGHT_SEMI_BOLD, minWidth: '90px' }}>
                                    {step.id || '—'}
                                </span>
                                <span style={{ fontSize: '13px', opacity: 0.8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {step.speech
                                        ? (step.speech.length > 60 ? step.speech.slice(0, 57) + '…' : step.speech)
                                        : step.animation
                                            ? `[${step.animation}]`
                                            : step.screen
                                                ? `[${step.screen.type}]`
                                                : '—'}
                                </span>
                                {step.animation && (
                                    <span style={{
                                        fontSize: '11px',
                                        backgroundColor: selectedIndex === i ? 'rgba(255,255,255,0.25)' : COLORS.CELESTE_PRINCIPAL,
                                        color: selectedIndex === i ? '#fff' : COLORS.AZUL_PRINCIPAL,
                                        padding: '1px 6px',
                                        borderRadius: '8px',
                                        whiteSpace: 'nowrap',
                                        flexShrink: 0
                                    }}>
                                        {step.animation.split('/').pop()}
                                    </span>
                                )}
                                {step.screen && (
                                    <span style={{
                                        fontSize: '11px',
                                        backgroundColor: selectedIndex === i ? 'rgba(255,255,255,0.25)' : COLORS.AMARILLO,
                                        color: COLORS.AZUL_PRINCIPAL,
                                        padding: '1px 6px',
                                        borderRadius: '8px',
                                        whiteSpace: 'nowrap',
                                        flexShrink: 0
                                    }}>
                                        {step.screen.type}
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* ── Estado actual ── */}
                    <div style={{
                        fontSize: '13px',
                        color: COLORS.AZUL_PRINCIPAL,
                        opacity: 0.7,
                        marginBottom: '10px'
                    }}>
                        Paso {selectedIndex + 1} de {total}
                        {steps[selectedIndex]?.id ? ` — ID: ${steps[selectedIndex].id}` : ''}
                    </div>

                    {/* ── Controles ── */}
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                        <button
                            onClick={handlePrev}
                            disabled={selectedIndex === 0 || isExecuting}
                            style={{ ...btnBase, backgroundColor: '#e0e6f0', color: COLORS.AZUL_PRINCIPAL }}
                        >
                            &lt;&lt; Anterior
                        </button>

                        <button
                            onClick={handleExecuteStep}
                            disabled={isExecuting || total === 0}
                            style={{ ...btnBase, backgroundColor: COLORS.VERDE, color: '#fff' }}
                        >
                            ▶ Ejecutar Paso
                        </button>

                        <button
                            onClick={handleNext}
                            disabled={selectedIndex >= total - 1 || isExecuting}
                            style={{ ...btnBase, backgroundColor: '#e0e6f0', color: COLORS.AZUL_PRINCIPAL }}
                        >
                            Siguiente &gt;&gt;
                        </button>

                        {!isExecuting ? (
                            <button
                                onClick={handleAutoPlay}
                                disabled={total === 0}
                                style={{ ...btnBase, backgroundColor: COLORS.AZUL_SECUNDARIO, color: '#fff' }}
                            >
                                ▶▶ Auto-play
                            </button>
                        ) : (
                            <button
                                onClick={handleStop}
                                style={{ ...btnBase, backgroundColor: COLORS.ROJO, color: '#fff' }}
                            >
                                Detener
                            </button>
                        )}
                    </div>
                </>
            ) : (
                <div style={{
                    padding: '24px',
                    textAlign: 'center',
                    color: COLORS.AZUL_PRINCIPAL,
                    opacity: 0.4,
                    border: `2px dashed ${COLORS.AZUL_SECUNDARIO}`,
                    borderRadius: '8px'
                }}>
                    Carga un script (.json o .txt) para empezar
                </div>
            )}
        </div>
    );
};

export default ScriptPanel;