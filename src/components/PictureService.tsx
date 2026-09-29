import { useState } from 'react';
import type { ChangeEvent, CSSProperties } from 'react';
import { useRos } from '../contexts/RosContext';
import { createService } from '../services/RosManager';
import { COLORS } from '../theme';

// Variables CSS alimentadas desde COLORS para usarlas en clases de Tailwind
const themeVars = {
    '--azul': COLORS.AZUL_PRINCIPAL,
    '--celeste': COLORS.CELESTE_PRINCIPAL,
    '--azul-sec': COLORS.AZUL_SECUNDARIO,
} as CSSProperties;

const PictureService = () => {
    const { ros } = useRos();
    const [url, setUrl] = useState('');

    // --- LÓGICA DE ROS ---
    const handleUrlChange = (event: ChangeEvent<HTMLInputElement>) => {
        setUrl(event.target.value);
    };

    const sendUrlToTablet = async () => {
        if (!ros || !url.trim()) {
            console.error('ROS is not connected or URL is empty');
            return;
        }
        const showImageService = createService(ros, '/pytoolkit/ALTabletService/show_image_srv', 'robot_toolkit_msgs/tablet_service_srv');
        const request = { url: url.trim() };

        showImageService.callService(request, 
            (result) => console.log('URL sent to tablet successfully:', result), 
            (error) => console.error('Error calling service:', error)
        );
    };

    // --- RENDERIZADO VISUAL ---
    return (
        <div
            className="relative h-[190px] w-full overflow-visible rounded-[20px] bg-[var(--azul)]"
            style={themeVars}
        >
            
            {/* Etiqueta título */}
            <div
                className="absolute left-0 top-[21px] z-[2] flex h-[30px] w-[min(180px,90%)] items-center rounded-br-[25px] rounded-tr-[25px] bg-[var(--celeste)] px-[19px]"
            >
                <span
                    className="w-full text-center font-['Nunito'] text-base font-bold text-[var(--azul)]"
                >
                    Imagen
                </span>
            </div>

            {/* Input de URL (ajustado en ancho para dejar espacio al botón de archivo) */}
            <input 
                type="text" 
                value={url} 
                onChange={handleUrlChange} 
                onKeyDown={e => e.key === 'Enter' && sendUrlToTablet()} 
                placeholder="Ingresa URL de la imagen..." 
                className="absolute left-[30px] top-[76px] h-[38px] w-[calc(100%-60px)] rounded-[5px] border-0 bg-[var(--celeste)] px-3 font-['Nunito'] text-sm text-[var(--azul)] outline-none"
            />

            {/* Botón ENVIAR (Para la URL) */}
            <button
                onClick={sendUrlToTablet}
                disabled={!url.trim()}
                className="absolute left-[30px] top-[139px] h-[32px] w-[calc(100%-60px)] cursor-pointer rounded-[90px] border-0 bg-[var(--celeste)] font-['Nunito'] text-xs font-bold text-[var(--azul)] transition-colors enabled:hover:bg-[var(--azul-sec)] disabled:cursor-not-allowed disabled:opacity-60"
            >
                ENVIAR
            </button>
        </div>
    );
};

export default PictureService;