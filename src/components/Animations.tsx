import { useState, useEffect } from "react";
import { useRos } from "../contexts/RosContext";
import { createTopic } from "../services/RosManager";
import { COLORS, TYPOGRAPHY } from "../theme";

// Ruta al archivo txt
import animationsTxt from "../animations/animations.txt";

const Animations = () => {
    const { ros } = useRos();
    const [selectedCategory, setSelectedCategory] = useState("");
    const [selectedSubcategory, setSelectedSubcategory] = useState("");
    const [selectedAnimation, setSelectedAnimation] = useState("");
    const [animations, setAnimations] = useState<Record<string, Record<string, string[]>>>({});
    
    // Estados para la UI interactiva
    const [isHovered, setIsHovered] = useState(false);
    const [openDropdown, setOpenDropdown] = useState<string | null>(null);
    const [hoveredOption, setHoveredOption] = useState<string | null>(null);

    const animationTopic = ros
        ? createTopic(ros, "/animations", "robot_toolkit_msgs/animation_msg")
        : null;

    useEffect(() => {
        fetch(animationsTxt)
            .then(response => response.text())
            .then(text => {
                const parsedAnimations: Record<string, Record<string, string[]>> = {};

                text.split("\n").forEach(animation => {
                    const parts = animation.trim().split("/");

                    if (parts.length === 3) {
                        const [category, subcategory, anim] = parts;
                        if (!parsedAnimations[category]) parsedAnimations[category] = {};
                        if (!parsedAnimations[category][subcategory]) parsedAnimations[category][subcategory] = [];
                        parsedAnimations[category][subcategory].push(anim);
                    } else if (parts.length === 2) {
                        const [category, anim] = parts;
                        if (!parsedAnimations[category]) parsedAnimations[category] = {};
                        if (!parsedAnimations[category]["_no_subcategory"]) parsedAnimations[category]["_no_subcategory"] = [];
                        parsedAnimations[category]["_no_subcategory"].push(anim);
                    }
                });

                setAnimations(parsedAnimations);
            })
            .catch(error => console.error("Error al cargar las animaciones:", error));
    }, []);

    const handleAnimation = () => {
        if (!selectedAnimation) {
            alert("Seleccione una animación para ejecutar.");
            return;
        }

        const fullAnimationPath = selectedSubcategory === "_no_subcategory"
            ? `${selectedCategory}/${selectedAnimation}`
            : `${selectedCategory}/${selectedSubcategory}/${selectedAnimation}`;

        const message = { family: "animations", animation_name: fullAnimationPath };

        if (animationTopic) {
            animationTopic.publish(message);
        } else {
            console.error("El publicador de animaciones no está disponible.");
        }
    };

    const toggleDropdown = (dropdown: string) => {
        setOpenDropdown(openDropdown === dropdown ? null : dropdown);
    };

    const handleSelect = (type: 'category' | 'subcategory' | 'animation', value: string) => {
        if (type === 'category') {
            setSelectedCategory(value);
            setSelectedSubcategory("");
            setSelectedAnimation("");
        } else if (type === 'subcategory') {
            setSelectedSubcategory(value);
            setSelectedAnimation("");
        } else if (type === 'animation') {
            setSelectedAnimation(value);
        }
        setOpenDropdown(null);
    };

    const categoryOptions = Object.keys(animations);
    const subcategoryOptions = selectedCategory ? Object.keys(animations[selectedCategory] || {}) : [];
    const animationOptions = (animations[selectedCategory]?.[selectedSubcategory] || animations[selectedCategory]?._no_subcategory || []);

    // Fila independiente solo para los 3 puntos (actúa como puente visual perfecto)
    const DotsRow = () => (
        <div className="flex h-[14px] gap-[15px]">
            <div className="flex w-[34px] items-center justify-center">
                <div className="flex flex-col gap-[3px]">
                    <div className="h-[3px] w-[3px] rounded-full" style={{ background: COLORS.CELESTE_PRINCIPAL }} />
                    <div className="h-[3px] w-[3px] rounded-full" style={{ background: COLORS.CELESTE_PRINCIPAL }} />
                    <div className="h-[3px] w-[3px] rounded-full" style={{ background: COLORS.CELESTE_PRINCIPAL }} />
                </div>
            </div>
            <div className="flex-1"></div>
        </div>
    );

    return (
        <div
            // className="relative flex h-[320px] w-full max-w-[400px] flex-col justify-between rounded-[25px] px-4 pb-[25px] pt-[60px] sm:px-[30px]"
            className="relative flex h-[320px] w-full flex-col justify-between rounded-[25px] px-4 pb-[25px] pt-[60px] sm:px-[30px]"
            style={{ background: COLORS.AZUL_PRINCIPAL }}
        >
            {openDropdown && (
                <div 
                    className="fixed inset-0 z-[9]"
                    onClick={() => setOpenDropdown(null)}
                />
            )}

            <div
                className="absolute left-0 top-5 flex h-[30px] w-[180px] items-center justify-center rounded-r-[25px]"
                style={{ background: COLORS.CELESTE_PRINCIPAL }}
            >
                <span
                    className="text-base font-bold"
                    style={{ color: COLORS.AZUL_PRINCIPAL, fontFamily: TYPOGRAPHY.FONT_FAMILY_PRINCIPAL }}
                >
                    Animaciones
                </span>
            </div>

            <div className="z-10 flex w-full flex-col">
                
                {/* 1. Fila de Categoría */}
                <div className="relative z-[3] flex gap-[15px]">
                    {/* Contenedor del icono centrado verticalmente respecto a su fila */}
                    <div className="flex w-[34px] items-center justify-center">
                        <div
                            className="flex h-[34px] w-[34px] items-center justify-center rounded-full"
                            style={{ background: COLORS.CELESTE_PRINCIPAL }}
                        >
                            <svg viewBox="0 0 24 24" width="20" height="20" fill={COLORS.AZUL_PRINCIPAL}>
                                <path d="M12 2c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm9 7h-6v13h-2v-6h-2v6H9V9H3V7h18v2z"/>
                            </svg>
                        </div>
                    </div>
                    {/* Contenedor de Texto y Dropdown */}
                    <div className="flex min-w-0 flex-1 flex-col">
                        <span
                            className="mb-1 text-left text-[13px] font-bold leading-none"
                            style={{ color: COLORS.CELESTE_PRINCIPAL, fontFamily: TYPOGRAPHY.FONT_FAMILY_PRINCIPAL }}
                        >
                            Categoría
                        </span>
                        <div className="relative w-full">
                            <div 
                                onClick={() => toggleDropdown('category')}
                                className="flex h-8 w-full cursor-pointer items-center justify-between rounded-md px-2.5"
                                style={{ background: COLORS.CELESTE_PRINCIPAL }}
                            >
                                <span
                                    className="overflow-hidden text-ellipsis whitespace-nowrap text-[13px]"
                                    style={{ color: COLORS.AZUL_PRINCIPAL, fontFamily: TYPOGRAPHY.FONT_FAMILY_PRINCIPAL }}
                                >
                                    {selectedCategory || "Seleccione una categoría"}
                                </span>
                                <svg viewBox="0 0 24 24" className={`h-4 w-4 shrink-0 transition-transform duration-200 ${openDropdown === 'category' ? 'rotate-180' : 'rotate-0'}`} fill={COLORS.AZUL_PRINCIPAL}>
                                    <path d="M7 10l5 5 5-5z"/>
                                </svg>
                            </div>
                            {openDropdown === 'category' && (
                                <div className="absolute left-0 top-full z-[11] mt-1 max-h-[120px] w-full overflow-y-auto rounded-md py-1 shadow-[0_4px_6px_rgba(0,0,0,0.3)]" style={{ background: COLORS.CELESTE_PRINCIPAL }}>
                                    {categoryOptions.map(category => (
                                        <div 
                                            key={category}
                                            onClick={() => handleSelect('category', category)}
                                            onMouseEnter={() => setHoveredOption(`cat-${category}`)}
                                            onMouseLeave={() => setHoveredOption(null)}
                                            className="cursor-pointer px-2.5 py-1.5 text-[13px] transition-colors duration-200 ease-in-out"
                                            style={{ background: hoveredOption === `cat-${category}` ? COLORS.AZUL_SECUNDARIO : 'transparent', color: COLORS.AZUL_PRINCIPAL, fontFamily: TYPOGRAPHY.FONT_FAMILY_PRINCIPAL }}
                                        >
                                            {category}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <DotsRow />

                {/* 2. Fila de Subcategoría */}
                <div className="relative z-[2] flex gap-[15px]">
                    <div className="flex w-[34px] items-center justify-center">
                        <div className="flex h-[34px] w-[34px] items-center justify-center rounded-full" style={{ background: COLORS.CELESTE_PRINCIPAL }}>
                            <svg viewBox="0 0 24 24" width="18" height="18" fill={COLORS.AZUL_PRINCIPAL}>
                                <path d="M9 21c0 .5.4 1 1 1h4c.6 0 1-.5 1-1v-1H9v1zm3-19C8.1 2 5 5.1 5 9c0 2.4 1.2 4.5 3 5.7V17c0 .5.4 1 1 1h6c.6 0 1-.5 1-1v-2.3c1.8-1.3 3-3.4 3-5.7 0-3.9-3.1-7-7-7z"/>
                            </svg>
                        </div>
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col">
                        <span
                            className="mb-1 text-left text-[13px] font-bold leading-none"
                            style={{ color: COLORS.CELESTE_PRINCIPAL, fontFamily: TYPOGRAPHY.FONT_FAMILY_PRINCIPAL, opacity: categoryOptions.length && !selectedCategory ? 0.6 : 1 }}
                        >
                            Subcategoría
                        </span>
                        <div className="relative w-full">
                            <div 
                                onClick={() => selectedCategory && subcategoryOptions.length > 0 && toggleDropdown('subcategory')}
                                className="flex h-8 w-full items-center justify-between rounded-md px-2.5"
                                style={{ background: COLORS.CELESTE_PRINCIPAL, cursor: selectedCategory && subcategoryOptions.length > 0 ? 'pointer' : 'not-allowed', opacity: selectedCategory && subcategoryOptions.length > 0 ? 1 : 0.6 }}
                            >
                                <span
                                    className="overflow-hidden text-ellipsis whitespace-nowrap text-[13px]"
                                    style={{ color: COLORS.AZUL_PRINCIPAL, fontFamily: TYPOGRAPHY.FONT_FAMILY_PRINCIPAL }}
                                >
                                    {selectedSubcategory === "" ? "Seleccione una subcategoría" : selectedSubcategory === "_no_subcategory" ? "Sin subcategoría" : selectedSubcategory}
                                </span>
                                <svg viewBox="0 0 24 24" className={`h-4 w-4 shrink-0 transition-transform duration-200 ${openDropdown === 'subcategory' ? 'rotate-180' : 'rotate-0'}`} fill={COLORS.AZUL_PRINCIPAL}>
                                    <path d="M7 10l5 5 5-5z"/>
                                </svg>
                            </div>
                            {openDropdown === 'subcategory' && (
                                <div className="absolute left-0 top-full z-[11] mt-1 max-h-[120px] w-full overflow-y-auto rounded-md py-1 shadow-[0_4px_6px_rgba(0,0,0,0.3)]" style={{ background: COLORS.CELESTE_PRINCIPAL }}>
                                    {subcategoryOptions.map(subcategory => (
                                        <div 
                                            key={subcategory}
                                            onClick={() => handleSelect('subcategory', subcategory)}
                                            onMouseEnter={() => setHoveredOption(`sub-${subcategory}`)}
                                            onMouseLeave={() => setHoveredOption(null)}
                                            className="cursor-pointer px-2.5 py-1.5 text-[13px] transition-colors duration-200 ease-in-out"
                                            style={{ background: hoveredOption === `sub-${subcategory}` ? COLORS.AZUL_SECUNDARIO : 'transparent', color: COLORS.AZUL_PRINCIPAL, fontFamily: TYPOGRAPHY.FONT_FAMILY_PRINCIPAL }}
                                        >
                                            {subcategory === "_no_subcategory" ? "Sin subcategoría" : subcategory}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <DotsRow />

                {/* 3. Fila de Animación */}
                <div className="relative z-[1] flex gap-[15px]">
                    <div className="flex w-[34px] items-center justify-center">
                        <div className="flex h-[34px] w-[34px] items-center justify-center rounded-full" style={{ background: COLORS.CELESTE_PRINCIPAL }}>
                            <svg viewBox="0 0 24 24" width="20" height="20" fill={COLORS.AZUL_PRINCIPAL}>
                                <circle cx="8" cy="16" r="4" />
                                <circle cx="12" cy="12" r="4" opacity="0.8" />
                                <circle cx="16" cy="8" r="4" opacity="0.6" />
                            </svg>
                        </div>
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col">
                        <span
                            className="mb-1 text-left text-[13px] font-bold leading-none"
                            style={{ color: COLORS.CELESTE_PRINCIPAL, fontFamily: TYPOGRAPHY.FONT_FAMILY_PRINCIPAL, opacity: animationOptions.length === 0 ? 0.6 : 1 }}
                        >
                            Animación
                        </span>
                        <div className="relative w-full">
                            <div 
                                onClick={() => animationOptions.length > 0 && toggleDropdown('animation')}
                                className="flex h-8 w-full items-center justify-between rounded-md px-2.5"
                                style={{ background: COLORS.CELESTE_PRINCIPAL, cursor: animationOptions.length > 0 ? 'pointer' : 'not-allowed', opacity: animationOptions.length > 0 ? 1 : 0.6 }}
                            >
                                <span
                                    className="overflow-hidden text-ellipsis whitespace-nowrap text-[13px]"
                                    style={{ color: COLORS.AZUL_PRINCIPAL, fontFamily: TYPOGRAPHY.FONT_FAMILY_PRINCIPAL }}
                                >
                                    {selectedAnimation || "Seleccione una animación"}
                                </span>
                                <svg viewBox="0 0 24 24" className={`h-4 w-4 shrink-0 transition-transform duration-200 ${openDropdown === 'animation' ? 'rotate-180' : 'rotate-0'}`} fill={COLORS.AZUL_PRINCIPAL}>
                                    <path d="M7 10l5 5 5-5z"/>
                                </svg>
                            </div>
                            {openDropdown === 'animation' && (
                                <div className="absolute left-0 top-full z-[11] mt-1 max-h-[120px] w-full overflow-y-auto rounded-md py-1 shadow-[0_4px_6px_rgba(0,0,0,0.3)]" style={{ background: COLORS.CELESTE_PRINCIPAL }}>
                                    {animationOptions.map(anim => (
                                        <div 
                                            key={anim}
                                            onClick={() => handleSelect('animation', anim)}
                                            onMouseEnter={() => setHoveredOption(`anim-${anim}`)}
                                            onMouseLeave={() => setHoveredOption(null)}
                                            className="cursor-pointer px-2.5 py-1.5 text-[13px] transition-colors duration-200 ease-in-out"
                                            style={{ background: hoveredOption === `anim-${anim}` ? COLORS.AZUL_SECUNDARIO : 'transparent', color: COLORS.AZUL_PRINCIPAL, fontFamily: TYPOGRAPHY.FONT_FAMILY_PRINCIPAL }}
                                        >
                                            {anim}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Botón Ejecutar */}
            <div className="flex w-full justify-center">
                <button
                    onClick={handleAnimation}
                    disabled={!selectedAnimation}
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                    className="h-9 w-full rounded-[90px] border-0 text-[13px] font-bold transition-all duration-200 ease-in-out"
                    style={{
                        background: isHovered && selectedAnimation ? COLORS.AZUL_SECUNDARIO : COLORS.CELESTE_PRINCIPAL,
                        color: isHovered && selectedAnimation ? COLORS.AZUL_PRINCIPAL : COLORS.AZUL_PRINCIPAL,
                        cursor: selectedAnimation ? 'pointer' : 'not-allowed',
                        fontFamily: TYPOGRAPHY.FONT_FAMILY_PRINCIPAL,
                        opacity: selectedAnimation ? 1 : 0.6,
                    }}
                >
                    EJECUTAR ANIMACIÓN
                </button>
            </div>
        </div>
    );
};

export default Animations;