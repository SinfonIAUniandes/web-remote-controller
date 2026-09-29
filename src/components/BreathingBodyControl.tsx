import { useState } from 'react';
import { useRos } from '../contexts/RosContext';
import { COLORS } from '../theme';
import * as ROSLIB from 'roslib';

const BODY_PARTS = [
    { label: 'Cuerpo', value: 'Body' },
    { label: 'Brazos', value: 'Arms' },
    { label: 'Brazo Izquierdo', value: 'LArm' },
    { label: 'Brazo Derecho', value: 'RArm' },
    { label: 'Cabeza', value: 'Head' }
];

const BreathingBodyControl = () => {
    const { ros } = useRos();
    
    // Estados de lógica
    const [selectedPart, setSelectedPart] = useState("Body");
    const [breathingState, setBreathingState] = useState<"True" | "False" | null>(null); // null = Ninguno, 'True' = Activar, 'False' = Desactivar
    
    // Estados visuales e interactivos
    const [showDropdown, setShowDropdown] = useState(false);
    const [hoveredOption, setHoveredOption] = useState<string | null>(null);
    const [isHoveredActivar, setIsHoveredActivar] = useState(false);
    const [isHoveredDesactivar, setIsHoveredDesactivar] = useState(false);

    // Color activo especial según tu diseño
    const COLOR_ACTIVO = '#D91A5D';

    // --- LÓGICA DE ROS ---
    const toggleBreathing = (enable: boolean) => {
        if (!ros) {
            console.error("No hay conexión con ROS.");
            return;
        }

        const service = new ROSLIB.Service({
            ros: ros,
            name: '/pytoolkit/ALMotion/toggle_breathing_srv',
            serviceType: 'robot_toolkit_msgs/set_open_close_hand_srv'
        });

        const request = {
            hand: selectedPart,
            state: enable ? "True" : "False",
        };

        service.callService(
            request, 
            (result) => {
                console.log(`Respiración de ${selectedPart} cambiada a ${enable ? 'True' : 'False'}. Respuesta:`, result);
                setBreathingState(enable ? "True" : "False");
            }, 
            (error) => {
                console.error("Error al cambiar respiración:", error);
            }
        );
    };

    // Obtener etiqueta amigable para mostrar en el Dropdown
    const selectedLabel = BODY_PARTS.find(p => p.value === selectedPart)?.label || 'Cuerpo';

    return (
        <div
            className="relative h-[220px] w-full overflow-visible rounded-[20px] sm:h-[190px]"
            style={{ background: COLORS.AZUL_PRINCIPAL }}
        >
            
            {/* Capa invisible para cerrar el dropdown al hacer clic fuera */}
            {showDropdown && (
                <div
                    className="fixed inset-0 z-[9]"
                    onClick={() => setShowDropdown(false)}
                />
            )}

            {/* Etiqueta título */}
            <div
                className="absolute left-0 top-[21px] z-[2] flex h-[30px] w-[180px] items-center rounded-br-[25px] rounded-tr-[25px] px-[19px]"
                style={{ background: COLORS.CELESTE_PRINCIPAL }}
            >
                <span
                    className="w-full text-center font-['Nunito'] text-base font-bold"
                    style={{ color: COLORS.AZUL_PRINCIPAL }}
                >
                    Control respiración
                </span>
            </div>

            {/* Label superior del selector */}
            <div
                className="absolute left-[30px] top-[65px] font-['Nunito'] text-[13px] font-bold"
                style={{ color: COLORS.CELESTE_PRINCIPAL }}
            >
                Parte del cuerpo
            </div>

            {/* Contenedor relativo del Selector Desplegable Mejorado */}
            <div className="absolute left-[30px] top-[90px] z-10 w-[calc(100%-60px)]">
                {/* Caja del input/trigger */}
                <div 
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="flex h-8 w-full cursor-pointer items-center justify-between rounded-[6px] px-2.5"
                    style={{ background: COLORS.CELESTE_PRINCIPAL }}
                >
                    <span
                        className="overflow-hidden text-ellipsis whitespace-nowrap font-['Nunito'] text-[13px]"
                        style={{ color: COLORS.AZUL_PRINCIPAL }}
                    >
                        {selectedLabel}
                    </span>
                    <svg
                        viewBox="0 0 24 24"
                        width="16"
                        height="16"
                        fill={COLORS.AZUL_PRINCIPAL}
                        className="shrink-0 transition-transform duration-200"
                        style={{ transform: showDropdown ? 'rotate(180deg)' : 'rotate(0deg)' }}
                    >
                        <path d="M7 10l5 5 5-5z"/>
                    </svg>
                </div>

                {/* Opciones del Menú Desplegable */}
                {showDropdown && (
                    <div
                        className="absolute left-0 top-full z-[11] mt-1 max-h-[120px] w-full overflow-y-auto rounded-[6px] py-1 shadow-[0_4px_6px_rgba(0,0,0,0.3)]"
                        style={{ background: COLORS.CELESTE_PRINCIPAL }}
                    >
                        {BODY_PARTS.map((part) => (
                            <div 
                                key={part.value} 
                                onClick={() => {
                                    setSelectedPart(part.value);
                                    setBreathingState(null); // Resetea visualmente los botones al cambiar de parte
                                    setShowDropdown(false);
                                }} 
                                onMouseEnter={() => setHoveredOption(part.value)}
                                onMouseLeave={() => setHoveredOption(null)}
                                className="cursor-pointer px-2.5 py-1.5 font-['Nunito'] text-[13px] transition-colors duration-200"
                                style={{
                                    background: hoveredOption === part.value || part.value === selectedPart ? COLORS.AZUL_SECUNDARIO : 'transparent', 
                                    color: COLORS.AZUL_PRINCIPAL, 
                                }}
                            >
                                {part.label}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Botón ACTIVAR (Mitad izquierda) */}
            <div className="absolute left-[30px] right-[30px] top-[139px] flex flex-col gap-2 sm:flex-row sm:gap-0">
                {/* Botón ACTIVAR */}
                <button
                    onClick={() => toggleBreathing(true)}
                    disabled={!ros}
                    onMouseEnter={() => setIsHoveredActivar(true)}
                    onMouseLeave={() => setIsHoveredActivar(false)}
                    className="h-[32px] w-full rounded-[90px] border-0 font-['Nunito'] text-xs font-bold transition-colors sm:w-[calc(50%-10px)]"
                    style={{
                        background: breathingState === "True" ? COLOR_ACTIVO : (isHoveredActivar && ros ? COLORS.AZUL_SECUNDARIO : COLORS.CELESTE_PRINCIPAL),
                        cursor: ros ? 'pointer' : 'not-allowed',
                        opacity: ros ? 1 : 0.6,
                        color: breathingState === "True" ? '#FFFFFF' : COLORS.AZUL_PRINCIPAL,
                    }}
                >
                    ACTIVAR
                </button>

                {/* Botón DESACTIVAR */}
                <button
                    onClick={() => toggleBreathing(false)}
                    disabled={!ros}
                    onMouseEnter={() => setIsHoveredDesactivar(true)}
                    onMouseLeave={() => setIsHoveredDesactivar(false)}
                    className="h-[32px] w-full rounded-[90px] border-0 font-['Nunito'] text-xs font-bold transition-colors sm:ml-auto sm:w-[calc(50%-10px)]"
                    style={{
                        background: breathingState === "False" ? COLOR_ACTIVO : (isHoveredDesactivar && ros ? COLORS.AZUL_SECUNDARIO : COLORS.CELESTE_PRINCIPAL),
                        cursor: ros ? 'pointer' : 'not-allowed',
                        opacity: ros ? 1 : 0.6,
                        color: breathingState === "False" ? '#FFFFFF' : COLORS.AZUL_PRINCIPAL,
                    }}
                >
                    DESACTIVAR
                </button>
            </div>
        </div>
    );
};

export default BreathingBodyControl;