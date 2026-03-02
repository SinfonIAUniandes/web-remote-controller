import React, { useState, useEffect } from "react";
import { useRos } from "../contexts/RosContext";
import { createTopic } from "../services/RosManager";
import { COLORS, TYPOGRAPHY } from "../theme";
import * as ROSLIB from "roslib";

// Ruta al archivo txt
import animationsTxt from "../animations/animations.txt";

const Animations = () => {
    const { ros } = useRos();
    const [selectedCategory, setSelectedCategory] = useState("");
    const [selectedSubcategory, setSelectedSubcategory] = useState("");
    const [selectedAnimation, setSelectedAnimation] = useState("");
    const [animations, setAnimations] = useState({});
    
    // Estados para la UI interactiva
    const [isHovered, setIsHovered] = useState(false);
    const [openDropdown, setOpenDropdown] = useState(null);
    const [hoveredOption, setHoveredOption] = useState(null);

    const animationTopic = createTopic(ros, "/animations", "robot_toolkit_msgs/animation_msg");

    useEffect(() => {
        fetch(animationsTxt)
            .then(response => response.text())
            .then(text => {
                const parsedAnimations = {};

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

        const message = new ROSLIB.Message({ family: "animations", animation_name: fullAnimationPath });

        if (animationTopic) {
            animationTopic.publish(message);
        } else {
            console.error("El publicador de animaciones no está disponible.");
        }
    };

    const toggleDropdown = (dropdown) => {
        setOpenDropdown(openDropdown === dropdown ? null : dropdown);
    };

    const handleSelect = (type, value) => {
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
        <div style={{ display: 'flex', gap: '15px', height: '14px' }}>
            <div style={{ width: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    <div style={{ width: '3px', height: '3px', background: COLORS.CELESTE_PRINCIPAL, borderRadius: '50%' }} />
                    <div style={{ width: '3px', height: '3px', background: COLORS.CELESTE_PRINCIPAL, borderRadius: '50%' }} />
                    <div style={{ width: '3px', height: '3px', background: COLORS.CELESTE_PRINCIPAL, borderRadius: '50%' }} />
                </div>
            </div>
            <div style={{ flex: 1 }}></div>
        </div>
    );

    return (
        <div style={{ 
            width: '400px',
            height: '320px',
            position: 'relative',
            background: COLORS.AZUL_PRINCIPAL, 
            borderRadius: '25px',
            padding: '60px 30px 25px 30px', // Ajustado para balancear la parte superior y dar aire abajo
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
        }}>
            {openDropdown && (
                <div 
                    style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9 }} 
                    onClick={() => setOpenDropdown(null)}
                />
            )}

            <div style={{ 
                position: 'absolute',
                width: '180px',
                height: '30px',
                top: '20px', 
                left: '0px', 
                background: COLORS.CELESTE_PRINCIPAL, 
                borderTopRightRadius: '25px', 
                borderBottomRightRadius: '25px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
            }}>
                <span style={{ color: COLORS.AZUL_PRINCIPAL, fontSize: '16px', fontFamily: TYPOGRAPHY.FONT_FAMILY_PRINCIPAL, fontWeight: '700' }}>
                    Animaciones
                </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', width: '100%', zIndex: 10 }}>
                
                {/* 1. Fila de Categoría */}
                <div style={{ display: 'flex', gap: '15px', position: 'relative', zIndex: 3 }}>
                    {/* Contenedor del icono centrado verticalmente respecto a su fila */}
                    <div style={{ width: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ width: '34px', height: '34px', background: COLORS.CELESTE_PRINCIPAL, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <svg viewBox="0 0 24 24" width="20" height="20" fill={COLORS.AZUL_PRINCIPAL}>
                                <path d="M12 2c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm9 7h-6v13h-2v-6h-2v6H9V9H3V7h18v2z"/>
                            </svg>
                        </div>
                    </div>
                    {/* Contenedor de Texto y Dropdown */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <span style={{ color: COLORS.CELESTE_PRINCIPAL, fontSize: '13px', fontFamily: TYPOGRAPHY.FONT_FAMILY_PRINCIPAL, fontWeight: '700', marginBottom: '4px', textAlign: 'left', lineHeight: 1 }}>
                            Categoría
                        </span>
                        <div style={{ position: 'relative', width: '100%' }}>
                            <div 
                                onClick={() => toggleDropdown('category')}
                                style={{ width: '100%', height: '32px', background: COLORS.CELESTE_PRINCIPAL, borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 10px', boxSizing: 'border-box', cursor: 'pointer' }}
                            >
                                <span style={{ color: COLORS.AZUL_PRINCIPAL, fontSize: '13px', fontFamily: TYPOGRAPHY.FONT_FAMILY_PRINCIPAL, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {selectedCategory || "Seleccione una categoría"}
                                </span>
                                <svg viewBox="0 0 24 24" width="16" height="16" fill={COLORS.AZUL_PRINCIPAL} style={{ transform: openDropdown === 'category' ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                                    <path d="M7 10l5 5 5-5z"/>
                                </svg>
                            </div>
                            {openDropdown === 'category' && (
                                <div style={{ position: 'absolute', top: '100%', left: 0, width: '100%', background: COLORS.CELESTE_PRINCIPAL, borderRadius: '6px', marginTop: '4px', zIndex: 11, maxHeight: '120px', overflowY: 'auto', padding: '4px 0', boxShadow: '0 4px 6px rgba(0,0,0,0.3)' }}>
                                    {categoryOptions.map(category => (
                                        <div 
                                            key={category}
                                            onClick={() => handleSelect('category', category)}
                                            onMouseEnter={() => setHoveredOption(`cat-${category}`)}
                                            onMouseLeave={() => setHoveredOption(null)}
                                            style={{ padding: '6px 10px', cursor: 'pointer', background: hoveredOption === `cat-${category}` ? COLORS.AZUL_SECUNDARIO : 'transparent', color: COLORS.AZUL_PRINCIPAL, fontFamily: TYPOGRAPHY.FONT_FAMILY_PRINCIPAL, fontSize: '13px', transition: 'background 0.2s ease-in-out' }}
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
                <div style={{ display: 'flex', gap: '15px', position: 'relative', zIndex: 2 }}>
                    <div style={{ width: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ width: '34px', height: '34px', background: COLORS.CELESTE_PRINCIPAL, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <svg viewBox="0 0 24 24" width="18" height="18" fill={COLORS.AZUL_PRINCIPAL}>
                                <path d="M9 21c0 .5.4 1 1 1h4c.6 0 1-.5 1-1v-1H9v1zm3-19C8.1 2 5 5.1 5 9c0 2.4 1.2 4.5 3 5.7V17c0 .5.4 1 1 1h6c.6 0 1-.5 1-1v-2.3c1.8-1.3 3-3.4 3-5.7 0-3.9-3.1-7-7-7z"/>
                            </svg>
                        </div>
                    </div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <span style={{ color: COLORS.CELESTE_PRINCIPAL, fontSize: '13px', fontFamily: TYPOGRAPHY.FONT_FAMILY_PRINCIPAL, fontWeight: '700', marginBottom: '4px', textAlign: 'left', lineHeight: 1, opacity: categoryOptions.length && !selectedCategory ? 0.6 : 1 }}>
                            Subcategoría
                        </span>
                        <div style={{ position: 'relative', width: '100%' }}>
                            <div 
                                onClick={() => selectedCategory && subcategoryOptions.length > 0 && toggleDropdown('subcategory')}
                                style={{ width: '100%', height: '32px', background: COLORS.CELESTE_PRINCIPAL, borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 10px', boxSizing: 'border-box', cursor: selectedCategory && subcategoryOptions.length > 0 ? 'pointer' : 'not-allowed', opacity: selectedCategory && subcategoryOptions.length > 0 ? 1 : 0.6 }}
                            >
                                <span style={{ color: COLORS.AZUL_PRINCIPAL, fontSize: '13px', fontFamily: TYPOGRAPHY.FONT_FAMILY_PRINCIPAL, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {selectedSubcategory === "" ? "Seleccione una subcategoría" : selectedSubcategory === "_no_subcategory" ? "Sin subcategoría" : selectedSubcategory}
                                </span>
                                <svg viewBox="0 0 24 24" width="16" height="16" fill={COLORS.AZUL_PRINCIPAL} style={{ transform: openDropdown === 'subcategory' ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                                    <path d="M7 10l5 5 5-5z"/>
                                </svg>
                            </div>
                            {openDropdown === 'subcategory' && (
                                <div style={{ position: 'absolute', top: '100%', left: 0, width: '100%', background: COLORS.CELESTE_PRINCIPAL, borderRadius: '6px', marginTop: '4px', zIndex: 11, maxHeight: '120px', overflowY: 'auto', padding: '4px 0', boxShadow: '0 4px 6px rgba(0,0,0,0.3)' }}>
                                    {subcategoryOptions.map(subcategory => (
                                        <div 
                                            key={subcategory}
                                            onClick={() => handleSelect('subcategory', subcategory)}
                                            onMouseEnter={() => setHoveredOption(`sub-${subcategory}`)}
                                            onMouseLeave={() => setHoveredOption(null)}
                                            style={{ padding: '6px 10px', cursor: 'pointer', background: hoveredOption === `sub-${subcategory}` ? COLORS.AZUL_SECUNDARIO : 'transparent', color: COLORS.AZUL_PRINCIPAL, fontFamily: TYPOGRAPHY.FONT_FAMILY_PRINCIPAL, fontSize: '13px', transition: 'background 0.2s ease-in-out' }}
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
                <div style={{ display: 'flex', gap: '15px', position: 'relative', zIndex: 1 }}>
                    <div style={{ width: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ width: '34px', height: '34px', background: COLORS.CELESTE_PRINCIPAL, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <svg viewBox="0 0 24 24" width="20" height="20" fill={COLORS.AZUL_PRINCIPAL}>
                                <circle cx="8" cy="16" r="4" />
                                <circle cx="12" cy="12" r="4" opacity="0.8" />
                                <circle cx="16" cy="8" r="4" opacity="0.6" />
                            </svg>
                        </div>
                    </div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <span style={{ color: COLORS.CELESTE_PRINCIPAL, fontSize: '13px', fontFamily: TYPOGRAPHY.FONT_FAMILY_PRINCIPAL, fontWeight: '700', marginBottom: '4px', textAlign: 'left', lineHeight: 1, opacity: animationOptions.length === 0 ? 0.6 : 1 }}>
                            Animación
                        </span>
                        <div style={{ position: 'relative', width: '100%' }}>
                            <div 
                                onClick={() => animationOptions.length > 0 && toggleDropdown('animation')}
                                style={{ width: '100%', height: '32px', background: COLORS.CELESTE_PRINCIPAL, borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 10px', boxSizing: 'border-box', cursor: animationOptions.length > 0 ? 'pointer' : 'not-allowed', opacity: animationOptions.length > 0 ? 1 : 0.6 }}
                            >
                                <span style={{ color: COLORS.AZUL_PRINCIPAL, fontSize: '13px', fontFamily: TYPOGRAPHY.FONT_FAMILY_PRINCIPAL, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {selectedAnimation || "Seleccione una animación"}
                                </span>
                                <svg viewBox="0 0 24 24" width="16" height="16" fill={COLORS.AZUL_PRINCIPAL} style={{ transform: openDropdown === 'animation' ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                                    <path d="M7 10l5 5 5-5z"/>
                                </svg>
                            </div>
                            {openDropdown === 'animation' && (
                                <div style={{ position: 'absolute', top: '100%', left: 0, width: '100%', background: COLORS.CELESTE_PRINCIPAL, borderRadius: '6px', marginTop: '4px', zIndex: 11, maxHeight: '120px', overflowY: 'auto', padding: '4px 0', boxShadow: '0 4px 6px rgba(0,0,0,0.3)' }}>
                                    {animationOptions.map(anim => (
                                        <div 
                                            key={anim}
                                            onClick={() => handleSelect('animation', anim)}
                                            onMouseEnter={() => setHoveredOption(`anim-${anim}`)}
                                            onMouseLeave={() => setHoveredOption(null)}
                                            style={{ padding: '6px 10px', cursor: 'pointer', background: hoveredOption === `anim-${anim}` ? COLORS.AZUL_SECUNDARIO : 'transparent', color: COLORS.AZUL_PRINCIPAL, fontFamily: TYPOGRAPHY.FONT_FAMILY_PRINCIPAL, fontSize: '13px', transition: 'background 0.2s ease-in-out' }}
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
            <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                <button
                    onClick={handleAnimation}
                    disabled={!selectedAnimation}
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                    style={{
                        width: '100%',
                        height: '36px', 
                        background: isHovered && selectedAnimation ? COLORS.AZUL_SECUNDARIO : COLORS.CELESTE_PRINCIPAL,
                        color: isHovered && selectedAnimation ? COLORS.AZUL_PRINCIPAL : COLORS.AZUL_PRINCIPAL,
                        borderRadius: '90px',
                        cursor: selectedAnimation ? 'pointer' : 'not-allowed',
                        fontFamily: TYPOGRAPHY.FONT_FAMILY_PRINCIPAL,
                        fontWeight: '700',
                        fontSize: '13px',
                        opacity: selectedAnimation ? 1 : 0.6,
                        transition: 'all 0.2s ease-in-out',
                        border: 'none',
                    }}
                >
                    EJECUTAR ANIMACIÓN
                </button>
            </div>
        </div>
    );
};

export default Animations;