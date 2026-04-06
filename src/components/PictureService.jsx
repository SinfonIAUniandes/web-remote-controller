import React, { useState, useRef } from 'react';
import { useRos } from '../contexts/RosContext';
import { createService } from '../services/RosManager';
import { COLORS, TYPOGRAPHY } from '../theme';

const PictureService = () => {
    const { ros } = useRos();
    const [url, setUrl] = useState('');
    const [isHoveredEnviar, setIsHoveredEnviar] = useState(false);
    const [isHoveredFile, setIsHoveredFile] = useState(false);
    const fileInputRef = useRef(null); // Referencia oculta para el input de archivo

    // --- LÓGICA DE ROS ---
    const handleUrlChange = (event) => {
        setUrl(event.target.value);
    };

    const handleFileChange = async (event) => {
        const selectedFile = event.target.files[0];
        if (selectedFile) {
            try {
                const base64Data = await convertFileToBase64(selectedFile);
                sendImageToTablet(base64Data); // Envía automáticamente
                setUrl(''); // Limpiamos la URL si se sube un archivo (opcional)
            } catch (error) {
                console.error('Error converting file to base64:', error);
            }
        }
        // Reseteamos el input para permitir subir la misma imagen dos veces seguidas si se desea
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const convertFileToBase64 = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = (error) => reject(error);
        });
    };

    const sendImageToTablet = async (imageData) => {
        if (!ros) {
            console.error('ROS is not connected');
            return;
        }
        const showImageService = createService(ros, '/pytoolkit/ALTabletService/show_image_srv', 'robot_toolkit_msgs/tablet_service_srv');
        const request = { url: imageData };

        showImageService.callService(request, 
            (result) => console.log('Image sent to tablet successfully:', result), 
            (error) => console.error('Error calling service:', error)
        );
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
        <div style={{ width: '480px', height: '190px', background: COLORS.AZUL_PRINCIPAL, borderRadius: '20px', position: 'relative', overflow: 'visible' }}>
            
            {/* Etiqueta título */}
            <div style={{ position: 'absolute', left: 0, top: '21px', width: '180px',  height: '30px', paddingLeft: '19px', paddingRight: '19px', background: COLORS.CELESTE_PRINCIPAL, borderTopRightRadius: '25px', borderBottomRightRadius: '25px', display: 'flex', alignItems: 'center', zIndex: 2 }}>
                <span style={{ textAlign: 'center', width: '100%', fontFamily: TYPOGRAPHY.FONT_FAMILY_PRINCIPAL, fontWeight: TYPOGRAPHY.FONT_WEIGHT_BOLD, fontSize: '16px', color: COLORS.AZUL_PRINCIPAL }}>
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
                style={{ 
                    position: 'absolute', 
                    left: '30px', 
                    top: '76px', 
                    width: 'calc(100% - 80px)', // Deja espacio para el botón de archivo (40px + 10px de margen)
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

            {/* Botón e Input oculto para Subir Archivo */}
            <input 
                type="file" 
                accept="image/*" 
                onChange={handleFileChange} 
                ref={fileInputRef}
                style={{ display: 'none' }} // El input real está oculto
            />
            <button
                onClick={() => fileInputRef.current.click()} // Al hacer clic, abre el selector de archivos
                onMouseEnter={() => setIsHoveredFile(true)}
                onMouseLeave={() => setIsHoveredFile(false)}
                title="Subir imagen desde el equipo"
                style={{
                    position: 'absolute',
                    right: '30px',
                    top: '76px',
                    width: '40px',
                    height: '38px',
                    background: isHoveredFile ? COLORS.AZUL_SECUNDARIO : COLORS.CELESTE_PRINCIPAL,
                    borderRadius: '5px',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    transition: 'background 0.2s',
                }}
            >
                {/* Ícono de imagen en SVG */}
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={COLORS.AZUL_PRINCIPAL} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <polyline points="21 15 16 10 5 21"/>
                </svg>
            </button>

            {/* Botón ENVIAR (Para la URL) */}
            <button
                onClick={sendUrlToTablet}
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

export default PictureService;