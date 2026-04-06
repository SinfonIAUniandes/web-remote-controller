import React, { useState } from 'react';
import { useRos } from '../contexts/RosContext';
import { createService } from '../services/RosManager';
import { COLORS, TYPOGRAPHY } from '../theme';

const WebService = () => {
    const { ros } = useRos();
    const [url, setUrl] = useState("");
    const [isHoveredEnviar, setIsHoveredEnviar] = useState(false);

    const handleUrlChange = (event) => {
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
        <div style={{ width: '480px', height: '190px', background: COLORS.AZUL_PRINCIPAL, borderRadius: '20px', position: 'relative', overflow: 'visible' }}>
            
            {/* Etiqueta título */}
            <div style={{width: '180px', height: '30px',position: 'absolute', left: 0, top: '21px', paddingLeft: '19px', paddingRight: '19px', background: COLORS.CELESTE_PRINCIPAL, borderTopRightRadius: '25px', borderBottomRightRadius: '25px', display: 'flex', alignItems: 'center', zIndex: 2 }}>
                <span style={{ fontFamily: TYPOGRAPHY.FONT_FAMILY_PRINCIPAL, fontWeight: TYPOGRAPHY.FONT_WEIGHT_BOLD, fontSize: '16px', color: COLORS.AZUL_PRINCIPAL, textAlign: 'center', width: '100%' }}>
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
                    boxSizing: 'border-box' 
                }} 
            />

            {/* Botón ENVIAR */}
            <button
                onClick={showWebViewOnRobot}
                disabled={!url.trim()}
                onMouseEnter={() => { if (url.trim()) setIsHoveredEnviar(true); }}
                onMouseLeave={() => setIsHoveredEnviar(false)}
                style={{
                    position: 'absolute',
                    left: '30px',
                    top: '139px',
                    width: 'calc(100% - 60px)',
                    height: '32px',
                    background: (isHoveredEnviar && url.trim()) ? COLORS.AZUL_SECUNDARIO : COLORS.CELESTE_PRINCIPAL,
                    borderRadius: '90px',
                    border: 'none',
                    cursor: url.trim() ? 'pointer' : 'not-allowed',
                    opacity: url.trim() ? 1 : 0.6,
                    transition: 'background 0.2s',
                    fontFamily: TYPOGRAPHY.FONT_FAMILY_PRINCIPAL,
                    fontWeight: TYPOGRAPHY.FONT_WEIGHT_BOLD,
                    fontSize: '12px',
                    color: COLORS.AZUL_PRINCIPAL,
                }}
            >
                ENVIAR
            </button>
        </div>
    );
};

export default WebService;