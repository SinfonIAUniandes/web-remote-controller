import React from 'react';
import { COLORS, TYPOGRAPHY } from '../theme';

interface Script {
    config: {
        name?: string;
        language?: string;
    };
    steps: unknown[];
}

interface ScriptPanelProps {
    scripts?: Script[];
    onSelect: (index: number) => void;
    activeIdx?: number | null;
}

// Variables CSS alimentadas desde COLORS/TYPOGRAPHY para usarlas en clases de Tailwind
const themeVars = {
    '--azul': COLORS.AZUL_PRINCIPAL,
    '--celeste': COLORS.CELESTE_PRINCIPAL,
    '--azul-sec': COLORS.AZUL_SECUNDARIO,
    '--font': TYPOGRAPHY.FONT_FAMILY_PRINCIPAL,
} as React.CSSProperties;

const ScriptPanel = ({ scripts, onSelect, activeIdx }: ScriptPanelProps) => {
    const safeScripts = scripts ?? [];

    return (
        <div
            style={themeVars}
            className="relative mt-5 box-border h-[230px] w-[630px] max-w-full overflow-hidden rounded-[25px] bg-[var(--azul)]"
        >
            {/* Etiqueta título */}
            <div className="absolute left-0 top-3 z-[2] flex h-[26px] w-[min(180px,90%)] items-center justify-center rounded-r-[25px] bg-[var(--celeste)]">
                <span className="text-[13px] font-bold text-[var(--azul)] font-[family-name:var(--font)]">
                    Panel de Scripts
                </span>
            </div>

            {/* Lista de Scripts */}
            <div className="mt-[42px] grid h-[140px] auto-rows-[60px] grid-cols-[repeat(auto-fill,minmax(min(180px,100%),1fr))] gap-3 overflow-y-auto px-[25px] pb-2.5">
                {safeScripts.length === 0 ? (
                    <div className="col-span-full flex h-full items-center justify-center text-xs italic text-[var(--celeste)] opacity-40 font-[family-name:var(--font)]">
                        No hay scripts cargados o creados aún.
                    </div>
                ) : (
                    safeScripts.map((script, idx) => {
                        const isActive = activeIdx === idx;
                        const textColor = isActive ? 'text-[var(--azul)]' : 'text-[var(--celeste)]';
                        return (
                            <div
                                key={idx}
                                onClick={() => onSelect(idx)}
                                className={`box-border flex h-[60px] cursor-pointer flex-col justify-between rounded-[10px] border border-solid p-2.5 transition-all duration-200 ease-[ease] ${
                                    isActive
                                        ? 'border-[var(--celeste)] bg-[var(--azul-sec)]'
                                        : 'border-transparent bg-[rgba(207,221,252,0.08)] hover:bg-[rgba(143,138,249,0.15)]'
                                }`}
                            >
                                <div className={`overflow-hidden text-ellipsis whitespace-nowrap text-xs font-bold ${textColor}`}>
                                    {script.config.name || 'Sin nombre'}
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className={`text-[10px] opacity-80 ${textColor}`}>
                                        {script.config.language}
                                    </span>
                                    <span className={`text-[10px] opacity-80 ${textColor}`}>
                                        {script.steps.length} pasos
                                    </span>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default ScriptPanel;
