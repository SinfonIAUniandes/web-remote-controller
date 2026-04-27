import React, { useState } from 'react';
import { COLORS, TYPOGRAPHY } from '../theme';

const ScriptPanel = ({ scripts, onSelect, activeIdx }) => {
    const [hoveredIdx, setHoveredIdx] = useState(null);
    const safeScripts = scripts ?? [];

    return (
        <div style={{
            width: '630px',
            height: '230px',                  // altura total reducida
            background: COLORS.AZUL_PRINCIPAL,
            borderRadius: '25px',
            marginTop: '20px',
            position: 'relative',
            overflow: 'hidden',
            boxSizing: 'border-box'
        }}>
            {/* Etiqueta título */}
            <div style={{
                position: 'absolute',
                left: 0,
                top: '12px',
                width: '180px',
                height: '26px',
                background: COLORS.CELESTE_PRINCIPAL,
                borderTopRightRadius: '25px',
                borderBottomRightRadius: '25px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 2
            }}>
                <span style={{
                    fontFamily: TYPOGRAPHY.FONT_FAMILY_PRINCIPAL,
                    fontWeight: '700',
                    fontSize: '13px',
                    color: COLORS.AZUL_PRINCIPAL
                }}>
                    Panel de Scripts
                </span>
            </div>

            {/* Lista de Scripts */}
            <div style={{
                marginTop: '42px',              // espacio para el título
                padding: '0 25px 10px',
                height: '140px',              
                overflowY: 'auto',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                gridAutoRows: '60px',          // altura compacta por tarjeta
                gap: '12px'
            }}>
                {safeScripts.length === 0 ? (
                    <div style={{
                        gridColumn: '1 / -1',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: COLORS.CELESTE_PRINCIPAL,
                        opacity: 0.4,
                        fontSize: '12px',
                        fontFamily: TYPOGRAPHY.FONT_FAMILY_PRINCIPAL,
                        fontStyle: 'italic'
                    }}>
                        No hay scripts cargados o creados aún.
                    </div>
                ) : (
                    safeScripts.map((script, idx) => (
                        <div 
                            key={idx}
                            onClick={() => onSelect(idx)}
                            onMouseEnter={() => setHoveredIdx(idx)}
                            onMouseLeave={() => setHoveredIdx(null)}
                            style={{
                                background: activeIdx === idx
                                    ? COLORS.AZUL_SECUNDARIO
                                    : (hoveredIdx === idx
                                        ? 'rgba(143, 138, 249, 0.15)'
                                        : 'rgba(207, 221, 252, 0.08)'),
                                borderRadius: '10px',
                                padding: '10px',               // padding más compacto
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                border: activeIdx === idx
                                    ? `1px solid ${COLORS.CELESTE_PRINCIPAL}`
                                    : '1px solid transparent',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between',
                                height: '60px',                // altura reducida de tarjeta
                                boxSizing: 'border-box'
                            }}
                        >
                            <div style={{
                                color: activeIdx === idx ? COLORS.AZUL_PRINCIPAL : COLORS.CELESTE_PRINCIPAL,
                                fontWeight: 'bold',
                                fontSize: '12px',              // tamaño de fuente ligeramente menor
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                            }}>
                                {script.config.name || 'Sin nombre'}
                            </div>
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <span style={{
                                    fontSize: '10px',
                                    color: activeIdx === idx ? COLORS.AZUL_PRINCIPAL : COLORS.CELESTE_PRINCIPAL,
                                    opacity: 0.8
                                }}>
                                    {script.config.language}
                                </span>
                                <span style={{
                                    fontSize: '10px',
                                    color: activeIdx === idx ? COLORS.AZUL_PRINCIPAL : COLORS.CELESTE_PRINCIPAL,
                                    opacity: 0.8
                                }}>
                                    {script.steps.length} pasos
                                </span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default ScriptPanel;