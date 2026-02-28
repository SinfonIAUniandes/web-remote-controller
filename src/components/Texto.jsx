import React, { useState } from 'react';
import { useRos } from '../contexts/RosContext';
import { COLORS, TYPOGRAPHY } from '../theme';
import { createService, callService } from '../services/RosManager';

const LANGUAGES = ['ES', 'EN', 'FR', 'DE'];

const Texto = () => {
    const { ros } = useRos();
    const [text, setText] = useState('');
    const [language, setLanguage] = useState('ES');
    const [showLangDropdown, setShowLangDropdown] = useState(false);
    const [isHoveredHablar, setIsHoveredHablar] = useState(false);

    const handleHablar = () => {
        if (!text.trim()) return;
        try {
            const service = createService(
                ros,
                '/pytoolkit/ALTextToSpeech/say_srv',
                'robot_toolkit_msgs/speech_srv'
            );
            callService(service, { text: text.trim(), language: language }, (result) => {
                console.log('Hablar result:', result);
            });
        } catch (e) {
            console.error('Error al hablar:', e);
        }
    };

    return (
        <div style={{
            width: '100%',
            height: '190px',
            background: COLORS.AZUL_PRINCIPAL,    // ← corregido
            borderRadius: '20px',
            position: 'relative',
            overflow: 'visible',
        }}>
            {/* Etiqueta título */}
            <div style={{
                position: 'absolute',
                left: 0,
                top: '21px',
                height: '30px',
                paddingLeft: '19px',
                paddingRight: '19px',
                background: COLORS.CELESTE_PRINCIPAL,
                borderTopRightRadius: '25px',
                borderBottomRightRadius: '25px',
                display: 'flex',
                alignItems: 'center',
                zIndex: 2,
            }}>
                <span style={{
                    fontFamily: TYPOGRAPHY.FONT_FAMILY_PRINCIPAL,
                    fontWeight: TYPOGRAPHY.FONT_WEIGHT_BOLD,
                    fontSize: '16px',
                    color: COLORS.AZUL_PRINCIPAL,  // ← corregido
                }}>
                    Texto
                </span>
            </div>

            {/* Selector de idioma */}
            <div
                style={{
                    position: 'absolute',
                    right: '20px',
                    top: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    cursor: 'pointer',
                    zIndex: 10,
                }}
                onClick={() => setShowLangDropdown(v => !v)}
            >
                <span style={{
                    fontFamily: 'Instrument Sans, sans-serif',
                    fontWeight: '700',
                    fontSize: '12px',
                    color: COLORS.CELESTE_PRINCIPAL,
                }}>
                    {language}
                </span>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M3 4.5L6 7.5L9 4.5" stroke={COLORS.CELESTE_PRINCIPAL} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>

                {showLangDropdown && (
                    <div style={{
                        position: 'absolute',
                        top: '20px',
                        right: 0,
                        background: COLORS.CELESTE_PRINCIPAL,
                        borderRadius: '8px',
                        overflow: 'hidden',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                        zIndex: 20,
                    }}>
                        {LANGUAGES.map(lang => (
                            <div
                                key={lang}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setLanguage(lang);
                                    setShowLangDropdown(false);
                                }}
                                style={{
                                    padding: '6px 16px',
                                    fontFamily: 'Instrument Sans, sans-serif',
                                    fontWeight: '700',
                                    fontSize: '12px',
                                    color: COLORS.AZUL_PRINCIPAL,
                                    cursor: 'pointer',
                                    background: lang === language ? 'rgba(0,33,75,0.12)' : 'transparent',
                                }}
                            >
                                {lang}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Input de texto */}
            <input
                type="text"
                value={text}
                onChange={e => setText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleHablar()}
                placeholder="Escribe algo..."
                style={{
                    position: 'absolute',
                    left: '30px',
                    top: '76px',
                    width: 'calc(100% - 60px)',
                    height: '38px',
                    background: COLORS.CELESTE_PRINCIPAL,
                    borderRadius: '5px',
                    border: 'none',
                    outline: 'none',
                    paddingLeft: '12px',
                    paddingRight: '12px',
                    fontFamily: TYPOGRAPHY.FONT_FAMILY_PRINCIPAL,
                    fontSize: '14px',
                    color: COLORS.AZUL_PRINCIPAL,
                    boxSizing: 'border-box',
                }}
            />

            {/* Botón HABLAR */}
            <button
                onClick={handleHablar}
                disabled={!text.trim()}
                onMouseEnter={() => { if (text.trim()) setIsHoveredHablar(true); }}
                onMouseLeave={() => setIsHoveredHablar(false)}
                style={{
                    position: 'absolute',
                    left: '30px',
                    top: '139px',
                    width: 'calc(100% - 60px)',
                    height: '32px',
                    background: (isHoveredHablar && text.trim())
                        ? COLORS.AZUL_PRINCIPAL
                        : COLORS.CELESTE_PRINCIPAL,
                    borderRadius: '90px',
                    border: `2px solid ${COLORS.CELESTE_PRINCIPAL}`,
                    cursor: text.trim() ? 'pointer' : 'not-allowed',
                    opacity: text.trim() ? 1 : 0.6,
                    transition: 'background 0.2s, color 0.2s',
                    fontFamily: TYPOGRAPHY.FONT_FAMILY_PRINCIPAL,
                    fontWeight: TYPOGRAPHY.FONT_WEIGHT_BOLD,
                    fontSize: '12px',
                    color: (isHoveredHablar && text.trim())
                        ? COLORS.CELESTE_PRINCIPAL
                        : COLORS.AZUL_PRINCIPAL,
                }}
            >
                HABLAR
            </button>
        </div>
    );
};

export default Texto;