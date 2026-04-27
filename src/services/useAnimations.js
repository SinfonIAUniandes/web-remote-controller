import { useState, useEffect } from 'react';
import animationsTxt from '../animations/animations.txt';

export const useAnimations = () => {
    const [animations, setAnimations] = useState([]);

    useEffect(() => {
        fetch(animationsTxt)
            .then(res => res.text())
            .then(text => {
                const list = text.split('\n')
                    .map(line => line.trim())
                    .filter(line => line.length > 0);
                setAnimations(list);
            })
            .catch(err => console.error("Error cargando animaciones:", err));
    }, []);

    const getAllAnimations = () => animations;

    return {
        getAllAnimations
    };
};