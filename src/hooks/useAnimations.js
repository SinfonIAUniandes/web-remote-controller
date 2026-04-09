import { useState, useEffect } from 'react';
import animationsTxt from '../animations/animations.txt';

/**
 * Hook para cargar y acceder a las animaciones disponibles del robot.
 * Parsea animations.txt en una estructura jerárquica y expone una función
 * getAllAnimations() que devuelve la lista plana de paths (ej. "Gestures/Hey_1").
 */
export function useAnimations() {
    const [animations, setAnimations] = useState({});

    useEffect(() => {
        fetch(animationsTxt)
            .then(res => res.text())
            .then(text => {
                const parsed = {};
                text.split('\n').forEach(line => {
                    const parts = line.trim().split('/');
                    if (parts.length === 3) {
                        const [category, subcategory, anim] = parts;
                        if (!parsed[category]) parsed[category] = {};
                        if (!parsed[category][subcategory]) parsed[category][subcategory] = [];
                        parsed[category][subcategory].push(anim);
                    } else if (parts.length === 2) {
                        const [category, anim] = parts;
                        if (!parsed[category]) parsed[category] = {};
                        if (!parsed[category]['_no_subcategory']) parsed[category]['_no_subcategory'] = [];
                        parsed[category]['_no_subcategory'].push(anim);
                    }
                });
                setAnimations(parsed);
            })
            .catch(err => console.error('Error al cargar animaciones:', err));
    }, []);

    /**
     * Devuelve la lista plana de todos los paths de animación.
     * Ej: ["Gestures/Hey_1", "Emotions/Positive/Winner_2", ...]
     */
    const getAllAnimations = () => {
        const list = [];
        Object.keys(animations).forEach(category => {
            Object.keys(animations[category]).forEach(subcategory => {
                animations[category][subcategory].forEach(anim => {
                    if (subcategory === '_no_subcategory') {
                        list.push(`${category}/${anim}`);
                    } else {
                        list.push(`${category}/${subcategory}/${anim}`);
                    }
                });
            });
        });
        return list;
    };

    return { animations, getAllAnimations };
}
