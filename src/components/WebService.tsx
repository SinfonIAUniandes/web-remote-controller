import { useState } from 'react';
import type { ChangeEvent } from 'react';
import { useRos } from '../contexts/RosContext';
import { createService } from '../services/RosManager';
import { COLORS } from '../theme';

const WebService = () => {
    const { ros } = useRos();
    const [url, setUrl] = useState("");
    const [isHoveredEnviar, setIsHoveredEnviar] = useState(false);

    const handleUrlChange = (event: ChangeEvent<HTMLInputElement>) => {
        setUrl(event.target.value);
    };

    const showWebViewOnRobot = () => {
        if (!url.trim() || !ros) return; // Evita enviar si está vacío o sin conexión

        const showWebViewService = createService(
            ros, 
            '/pytoolkit/ALTabletService/show_web_view_srv', 
            'robot_toolkit_msgs/tablet_service_srv'
        );

        const request = { url: url.trim() };

        showWebViewService.callService(
            request, 
            (result) => {
                console.log('Service called successfully:', result);
            }, 
            (error) => {
                console.error('Error calling service:', error);
            }
        );
    };

    return (
        <div
            className="relative h-[190px] w-full  overflow-visible rounded-[20px]"
            style={{ background: COLORS.AZUL_PRINCIPAL }}
        >
            
            {/* Etiqueta título */}
            <div
                className="absolute left-0 top-[21px] z-[2] flex h-[30px] w-[180px] items-center rounded-br-[25px] rounded-tr-[25px] px-[19px]"
                style={{ background: COLORS.CELESTE_PRINCIPAL }}
            >
                <span
                    className="w-full text-center font-['Nunito'] text-base font-bold"
                    style={{ color: COLORS.AZUL_PRINCIPAL }}
                >
                    Servicio Web
                </span>
            </div>

            {/* Input de URL */}
            <input 
                type="text" 
                value={url} 
                onChange={handleUrlChange} 
                onKeyDown={e => e.key === 'Enter' && showWebViewOnRobot()} 
                placeholder="Ingresa URL del servicio..." 
                className="absolute left-[30px] top-[76px] h-[38px] w-[calc(100%-60px)] rounded-[5px] border-0 px-3 font-['Nunito'] text-sm outline-none"
                style={{
                    background: COLORS.CELESTE_PRINCIPAL,
                    color: COLORS.AZUL_PRINCIPAL,
                }}
            />

            {/* Botón ENVIAR */}
            <button
                onClick={showWebViewOnRobot}
                disabled={!url.trim()}
                onMouseEnter={() => { if (url.trim()) setIsHoveredEnviar(true); }}
                onMouseLeave={() => setIsHoveredEnviar(false)}
                className="absolute left-[30px] top-[139px] h-[32px] w-[calc(100%-60px)] rounded-[90px] border-0 font-['Nunito'] text-xs font-bold transition-colors"
                style={{
                    background: (isHoveredEnviar && url.trim()) ? COLORS.AZUL_SECUNDARIO : COLORS.CELESTE_PRINCIPAL,
                    cursor: url.trim() ? 'pointer' : 'not-allowed',
                    opacity: url.trim() ? 1 : 0.6,
                    color: COLORS.AZUL_PRINCIPAL,
                }}
            >
                ENVIAR
            </button>
        </div>
    );
};

export default WebService;