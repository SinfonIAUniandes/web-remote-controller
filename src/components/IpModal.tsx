import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { COLORS } from '../theme';
import { getIpPrefix, isValidIpv4 } from '../utils/ip';

type IpModalProps = {
    isOpen: boolean;
    currentIp: string;
    onClose: () => void;
    onSave: (ip: string) => void;
};

const IpModal = ({ isOpen, currentIp, onClose, onSave }: IpModalProps) => {
    const prefix = getIpPrefix(currentIp);
    // 'octet': solo se escribe el último octeto; 'full': se edita la dirección completa
    const [mode, setMode] = useState<'octet' | 'full'>('octet');
    const [value, setValue] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        if (!isOpen) return;
        setError('');
        if (prefix) {
            const lastOctet = currentIp.split('.')[3];
            setMode('octet');
            setValue(/^\d+$/.test(lastOctet) ? lastOctet : '');
        } else {
            setMode('full');
            setValue(currentIp);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    if (!isOpen) return null;

    const showFullAddress = () => {
        setMode('full');
        setValue(`${prefix}.xxx`);
        setError('');
    };

    const handleSave = () => {
        const ip = (mode === 'octet' ? `${prefix}.${value}` : value).trim();
        if (!isValidIpv4(ip)) {
            setError(mode === 'octet' ? 'Introduce un número entre 0 y 255.' : 'Introduce una dirección IPv4 válida (ej. 192.168.1.45).');
            return;
        }
        onSave(ip);
    };

    const inputClass = 'box-border min-w-0 flex-1 rounded-[10px] border-none bg-[var(--celeste)] p-2 text-center font-bold text-[var(--azul)] outline-none';
    const buttonClass = 'h-8 w-full cursor-pointer rounded-[90px] border-none bg-[var(--celeste)] text-xs font-bold text-[var(--azul)] font-[Nunito]';

    // Portal a <body>: el menú lateral es sticky (crea su propio stacking context) y dejaría el modal detrás del resto
    return createPortal(
        <div
            onClick={onClose}
            className="fixed inset-0 z-[1000] flex items-center justify-center bg-[rgba(0,0,0,0.7)] p-4"
            style={{ '--azul': COLORS.AZUL_PRINCIPAL, '--celeste': COLORS.CELESTE_PRINCIPAL } as React.CSSProperties}
        >
            <div
                onClick={e => e.stopPropagation()}
                className="flex max-h-full w-full max-w-[400px] flex-col items-center gap-4 overflow-y-auto rounded-[20px] bg-[var(--azul)] px-6 pb-6"
            >
                <div className="flex h-[30px] w-[245px] max-w-full items-center justify-center rounded-b-[20px] bg-[var(--celeste)] text-base font-extrabold text-[var(--azul)] font-[Nunito]">
                    IP DEL ROBOT
                </div>

                <p className="m-0 text-center text-sm font-bold text-[var(--celeste)] font-[Nunito]">
                    {mode === 'octet'
                        ? 'Introduce el último octeto de la dirección IP del robot.'
                        : 'Introduce la dirección IP completa del robot.'}
                </p>

                <div className="flex w-full items-center gap-1 text-base font-bold text-[var(--celeste)] font-[Nunito]">
                    {mode === 'octet' && <span className="shrink-0">{prefix}.</span>}
                    <input
                        autoFocus
                        type="text"
                        inputMode={mode === 'octet' ? 'numeric' : 'text'}
                        maxLength={mode === 'octet' ? 3 : 15}
                        value={value}
                        placeholder={mode === 'octet' ? 'xxx' : 'xxx.xxx.xxx.xxx'}
                        onChange={e => {
                            setError('');
                            setValue(mode === 'octet' ? e.target.value.replace(/\D/g, '') : e.target.value);
                        }}
                        onKeyDown={e => { if (e.key === 'Enter') handleSave(); }}
                        className={inputClass}
                    />
                </div>

                {error && <div className="text-center text-xs font-bold text-[#E88B93] font-[Nunito]">{error}</div>}

                <div className="flex flex-col items-center w-full gap-2.5">
                    <button onClick={handleSave} className={buttonClass}>CONECTAR</button>
                    {mode === 'octet' && (
                        <button onClick={showFullAddress} className={buttonClass}>MOSTRAR DIRECCIÓN COMPLETA</button>
                    )}
                    <button onClick={onClose} className={buttonClass}>CANCELAR</button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default IpModal;
