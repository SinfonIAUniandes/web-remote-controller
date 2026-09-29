import React, { useState, useEffect } from 'react';
import { useRos } from '../contexts/RosContext';
import { COLORS, TYPOGRAPHY } from '../theme';
import { createTopic, createService } from '../services/RosManager';
import * as ROSLIB from 'roslib';

const LANGUAGES = ['ES', 'EN'] as const;
type Language = typeof LANGUAGES[number];
const LANGUAGE_MAP: Record<Language, string> = { ES: 'Spanish', EN: 'English' };

const Texto = () => {
    const { ros } = useRos();
    const [text, setText] = useState('');
    const [language, setLanguage] = useState<Language>('ES');
    const [showLangDropdown, setShowLangDropdown] = useState(false);
    const [isHoveredHablar, setIsHoveredHablar] = useState(false);

    useEffect(() => {
        if (ros) {
            const enableAudioService = createService(
                ros,
                '/robot_toolkit/audio_tools_srv',
                'robot_toolkit_msgs/audio_tools_srv'
            );
            enableAudioService.callService(
                { data: { command: 'enable_tts' } },
                (result) => console.log('TTS habilitado:', result),
                (error) => console.error('Error habilitando TTS:', error)
            );
        }
    }, [ros]);

    const handleHablar = () => {
        if (!text.trim() || !ros) return;
        const speechTopic = createTopic(ros, '/speech', 'robot_toolkit_msgs/speech_msg');
        const message = {
            language: LANGUAGE_MAP[language],
            text: text.trim(),
            animated: true,
        };
        speechTopic.publish(message);
    };

    return (
        <div
            className="relative h-[190px] w-full overflow-visible rounded-[20px]"
            style={{ background: COLORS.AZUL_PRINCIPAL }}
        >
            
            {/* Etiqueta título */}
            <div
                className="absolute left-0 top-[21px] z-[2] flex h-[30px] items-center rounded-r-[25px] px-[19px]"
                style={{ background: COLORS.CELESTE_PRINCIPAL }}
            >
                <span
                    className="text-base"
                    style={{ fontFamily: TYPOGRAPHY.FONT_FAMILY_PRINCIPAL, fontWeight: TYPOGRAPHY.FONT_WEIGHT_BOLD, color: COLORS.AZUL_PRINCIPAL }}
                >
                    Texto
                </span>
            </div>

            {/* Selector de idioma */}
            <div
                className="absolute right-5 top-6 z-10 flex cursor-pointer items-center gap-1"
                onClick={() => setShowLangDropdown(v => !v)}
            >
                <span
                    className="text-xs font-bold"
                    style={{ fontFamily: TYPOGRAPHY.FONT_FAMILY_PRINCIPAL, color: COLORS.CELESTE_PRINCIPAL }}
                >
                    {language}
                </span>
                <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none"><path d="M3 4.5L6 7.5L9 4.5" stroke={COLORS.CELESTE_PRINCIPAL} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                {showLangDropdown && (
                    <div
                        className="absolute right-0 top-5 z-20 overflow-hidden rounded-lg shadow-[0_4px_12px_rgba(0,0,0,0.3)]"
                        style={{ background: COLORS.CELESTE_PRINCIPAL }}
                    >
                        {LANGUAGES.map(lang => (
                            <div
                                key={lang}
                                onClick={(e) => { e.stopPropagation(); setLanguage(lang); setShowLangDropdown(false); }}
                                className="cursor-pointer px-4 py-1.5 text-xs font-bold"
                                style={{
                                    fontFamily: TYPOGRAPHY.FONT_FAMILY_PRINCIPAL,
                                    color: COLORS.AZUL_PRINCIPAL,
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
                className="absolute left-[clamp(12px,7.5%,30px)] top-[76px] h-[38px] w-[calc(100%_-_clamp(24px,15%,60px))] rounded-[5px] border-0 px-3 text-sm outline-none"
                style={{
                    background: COLORS.CELESTE_PRINCIPAL,
                    fontFamily: TYPOGRAPHY.FONT_FAMILY_PRINCIPAL,
                    color: COLORS.AZUL_PRINCIPAL,
                }}
            />

            {/* Botón HABLAR — hover igual que los demás botones del proyecto */}
            <button
                onClick={handleHablar}
                disabled={!text.trim()}
                onMouseEnter={() => { if (text.trim()) setIsHoveredHablar(true); }}
                onMouseLeave={() => setIsHoveredHablar(false)}
                className="absolute left-[clamp(12px,7.5%,30px)] top-[139px] h-8 w-[calc(100%_-_clamp(24px,15%,60px))] rounded-[90px] border-0 text-xs transition-colors duration-200"
                style={{
                    background: (isHoveredHablar && text.trim()) ? COLORS.AZUL_SECUNDARIO : COLORS.CELESTE_PRINCIPAL,
                    cursor: text.trim() ? 'pointer' : 'not-allowed',
                    opacity: text.trim() ? 1 : 0.6,
                    fontFamily: TYPOGRAPHY.FONT_FAMILY_PRINCIPAL,
                    fontWeight: TYPOGRAPHY.FONT_WEIGHT_BOLD,
                    color: COLORS.AZUL_PRINCIPAL,
                }}
            >
                HABLAR
            </button>
        </div>
    );
};

export default Texto;