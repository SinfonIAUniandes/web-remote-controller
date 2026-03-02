import React, { useState, useEffect, useRef } from "react";
import { useRos } from "../contexts/RosContext";
import { createService } from "../services/RosManager";
import { COLORS, TYPOGRAPHY } from "../theme";
import BatteryIcon from "./BatteryIcon";
import logoSinfonia from "../assets/SinfonIA-Logo.png";
import IconoHome from "../assets/Home.svg";
import IconoServicios from "../assets/robot_icon.svg";
import IconoScripts from "../assets/megaphone_icon.svg";
import IconoVolumen from "../assets/sound_icon.svg";
import IconoSpeed from "../assets/movement_icon.svg";

export default function LateralMenu() {
    const { ros, ipAddress } = useRos();
    const [volume, setVolume] = useState(50);
    const [speed, setSpeed] = useState(50);
    const [isHoveredPrincipal, setIsHoveredPrincipal] = useState(false);
    const [isHoveredServicios, setIsHoveredServicios] = useState(false);
    const [isHoveredScripts, setIsHoveredScripts] = useState(false); 
    
    const volumeSliderRef = useRef(null);
    const speedSliderRef = useRef(null);

    const [isVolumeDragging, setIsVolumeDragging] = useState(false);
    const [isSpeedDragging, setIsSpeedDragging] = useState(false);

    // --- Efecto para inicializar el volumen en 50 ---
    useEffect(() => {
        if (ros) {
            const volumeService = createService(ros, '/pytoolkit/ALAudioDevice/set_output_volume_srv', 'robot_toolkit_msgs/set_output_volume_srv');
            const request = { volume: 50 };
            volumeService.callService(
                request, 
                (result) => { console.log('Volumen inicial establecido en 50:', result); }, 
                (error) => { console.error('Error al establecer el volumen inicial:', error); }
            );
        }
    }, [ros]);

    // --- Update volume state & ROS Service ---
    const updateVolume = (newVolume) => {
        const clampedVolume = Math.max(0, Math.min(100, newVolume));
        setVolume(clampedVolume);
        
        if (ros) {
            const volumeService = createService(
                ros,
                "/pytoolkit/ALAudioDevice/set_output_volume_srv",
                "robot_toolkit_msgs/set_output_volume_srv",
            );
            const request = { volume: clampedVolume };
            volumeService.callService(
                request,
                (result) => { /* console.log('Volumen actualizado:', result); */ }, // Comentado para no saturar consola al arrastrar
                (error) => { console.error('Error al actualizar volumen:', error); }
            );
        }
    };

    // --- Update speed state & ROS Service ---
    const updateSpeed = (newSpeed) => {
        const clampedSpeed = Math.max(0, Math.min(100, newSpeed));
        setSpeed(clampedSpeed);
        
        if (ros) {
            const speedService = createService(
                ros,
                "/pytoolkit/ALMotion/set_speed_srv", 
                "robot_toolkit_msgs/set_speed_srv", 
            );
            // Assuming speed is 0-1 for the service based on your commented code
            const request = { speed: clampedSpeed / 100.0 }; 
            speedService.callService(
                request,
                () => { },
                (error) => { console.error('Error al actualizar velocidad:', error); }
            );
        }
    };

    // Generic slider interaction handler
    const handleSliderInteraction = (event, sliderRef, updateFunction) => {
        if (sliderRef.current) {
            const slider = sliderRef.current;
            const rect = slider.getBoundingClientRect();
            const clientX = event.touches ? event.touches[0].clientX : event.clientX;
            const x = clientX - rect.left;
            const width = slider.clientWidth;
            const newValue = Math.round((x / width) * 100);
            updateFunction(newValue);
        }
    };

    // Mouse down handlers
    const handleVolumeMouseDown = (event) => {
        setIsVolumeDragging(true);
        handleSliderInteraction(event, volumeSliderRef, updateVolume);
    };

    const handleSpeedMouseDown = (event) => {
        setIsSpeedDragging(true);
        handleSliderInteraction(event, speedSliderRef, updateSpeed);
    };

    // Mouse move handler
    const handleMouseMove = (event) => {
        if (isVolumeDragging) {
            handleSliderInteraction(event, volumeSliderRef, updateVolume);
        }
        if (isSpeedDragging) {
            handleSliderInteraction(event, speedSliderRef, updateSpeed);
        }
    };

    // Mouse up handler
    const handleMouseUp = () => {
        setIsVolumeDragging(false);
        setIsSpeedDragging(false);
    };

    // Effect for slider drag event listeners
    useEffect(() => {
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        document.addEventListener('touchmove', handleMouseMove);
        document.addEventListener('touchend', handleMouseUp);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            document.removeEventListener('touchmove', handleMouseMove);
            document.removeEventListener('touchend', handleMouseUp);
        };
    }, [isVolumeDragging, isSpeedDragging]); 

    return (
        <div
            className="lateral-menu"
            style={{
                width: "220px",
                height: "950px",
                backgroundColor: COLORS.AZUL_PRINCIPAL,
                justifyContent: "space-between",
                alignItems: "center",
                display: "flex",
                flexDirection: "column",
                padding: "20px 20px",
                borderRadius: "25px",
            }}
        >
            <div
                style={{
                    width: "120px",
                    height: "80px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <BatteryIcon />
                <img
                    src={logoSinfonia}
                    alt="Logo Sinfonia"
                    style={{ width: "120px", height: "39px" }}
                />
            </div>
            <div alt="Menú Navegación" style={{ height: "450px", width: "125px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "space-around" }}>
            <div
                onClick={() => {}}
                onMouseEnter={() => setIsHoveredPrincipal(true)}
                onMouseLeave={() => setIsHoveredPrincipal(false)}
                style={{
                    width: '125px',
                    height: '125px',
                    background: isHoveredPrincipal ? COLORS.AZUL_SECUNDARIO : COLORS.CELESTE_PRINCIPAL,
                    borderRadius: 30,
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: 3,
                    display: 'inline-flex',
                    cursor: 'pointer'
                }}
            >
                <div style={{ alignSelf: 'stretch', height: 25, textAlign: 'center', justifyContent: 'center', display: 'flex', flexDirection: 'column', color: COLORS.AZUL_PRINCIPAL, fontSize: 16, fontFamily: 'Nunito', fontWeight: '700', wordWrap: 'break-word' }}>Principal</div>
                <div style={{ width: 35, height: 35, position: 'relative', overflow: 'hidden' }}>
                    <img src={IconoHome} alt="Icono Principal" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
            </div>
            <div
                onClick={() => {}}
                onMouseEnter={() => setIsHoveredServicios(true)}
                onMouseLeave={() => setIsHoveredServicios(false)}
                style={{
                    width: '125px',
                    height: '125px',
                    background: isHoveredServicios ? COLORS.AZUL_SECUNDARIO : COLORS.CELESTE_PRINCIPAL,
                    borderRadius: 30,
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: 3,
                    display: 'inline-flex',
                    cursor: 'pointer'
                }}
            >
                <div style={{ alignSelf: 'stretch', height: 25, textAlign: 'center', justifyContent: 'center', display: 'flex', flexDirection: 'column', color: COLORS.AZUL_PRINCIPAL, fontSize: 16, fontFamily: 'Nunito', fontWeight: '700', wordWrap: 'break-word' }}>Servicios</div>
                <div style={{ width: 35, height: 35, position: 'relative', overflow: 'hidden' }}>
                    <img src={IconoServicios} alt="Icono Servicios" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
            </div>
            <div
                onClick={() => {}}
                onMouseEnter={() => setIsHoveredScripts(true)}
                onMouseLeave={() => setIsHoveredScripts(false)}
                style={{
                    width: '125px',
                    height: '125px',
                    background: isHoveredScripts ? COLORS.AZUL_SECUNDARIO : COLORS.CELESTE_PRINCIPAL,
                    borderRadius: 30,
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: 3,
                    display: 'inline-flex',
                    cursor: 'pointer'
                }}
            >
                <div style={{ alignSelf: 'stretch', height: 25, textAlign: 'center', justifyContent: 'center', display: 'flex', flexDirection: 'column', color: COLORS.AZUL_PRINCIPAL, fontSize: 16, fontFamily: 'Nunito', fontWeight: '700', wordWrap: 'break-word' }}>Scripts</div>
                <div style={{ width: 35, height: 35, position: 'relative', overflow: 'hidden' }}>
                    <img src={IconoScripts} alt="Icono Scripts" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
            </div>
            </div>
            {/*Sliders and IP container*/}
            <div style={{ width: '180px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
            {/* Volume Slider */}
            <div style={{ width: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                <img src={IconoVolumen} alt="Icono Volumen" style={{ width: '20px', height: '20px' }} />

                <div
                    ref={volumeSliderRef}
                    onMouseDown={handleVolumeMouseDown}
                    onTouchStart={handleVolumeMouseDown}
                    style={{
                        position: 'relative',
                        width: '120px',
                        height: '18px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                    }}
                >
                    <div style={{
                        width: '100%',
                        height: '8px',
                        background: '#00214B', 
                        borderRadius: '90px',
                        border: '5px solid #CFDDFC'
                    }}>
                    </div>
                    <div style={{
                        position: 'absolute',
                        left: `${volume}%`,
                        top: '50%',
                        transform: `translate(-${volume}%, -50%)`,
                        width: '14px',
                        height: '14px',
                        background: '#CFDDFC',
                        boxShadow: '0px 0px 4px rgba(0, 0, 0, 0.70)',
                        borderRadius: '9999px',
                    }}></div>
                </div>

                <div style={{
                    width: '40px',
                    textAlign: 'left',
                    color: '#CFDDFC',
                    fontSize: '12px',
                    fontFamily: 'Nunito',
                    fontWeight: '900'
                }}>
                    {volume}%
                </div>
            </div>
            {/* Speed Slider */}
            <div style={{ width: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                <img src={IconoSpeed} alt="Icono Velocidad" style={{ width: '20px', height: '20px' }} />

                <div
                    ref={speedSliderRef}
                    onMouseDown={handleSpeedMouseDown}
                    onTouchStart={handleSpeedMouseDown}
                    style={{
                        position: 'relative',
                        width: '120px',
                        height: '18px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                    }}
                >
                    <div style={{
                        width: '100%',
                        height: '8px',
                        background: '#00214B', 
                        borderRadius: '90px',
                        border: '5px solid #CFDDFC'
                    }}>
                    </div>
                    <div style={{
                        position: 'absolute',
                        left: `${speed}%`,
                        top: '50%',
                        transform: `translate(-${speed}%, -50%)`,
                        width: '14px',
                        height: '14px',
                        background: COLORS.CELESTE_PRINCIPAL,
                        boxShadow: '0px 0px 4px rgba(0, 0, 0, 0.70)',
                        borderRadius: '9999px',
                    }}></div>
                </div>

                <div style={{
                    width: '40px',
                    textAlign: 'left',
                    color: '#CFDDFC',
                    fontSize: '12px',
                    fontFamily: 'Nunito',
                    fontWeight: '900'
                }}>
                    {speed}%
                </div>
            </div>
            <a style={{ color: COLORS.CELESTE_PRINCIPAL, fontSize: '16px', fontFamily: 'Nunito', fontWeight: TYPOGRAPHY.FONT_WEIGHT_BLACK }}>{ipAddress}</a>
            </div>
        </div>
    );
}