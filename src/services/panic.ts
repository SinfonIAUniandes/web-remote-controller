import { useEffect, useRef } from 'react';

// Señal global de pánico: los componentes que ejecutan scripts o mueven el robot la escuchan para cancelar lo que estén haciendo.
export const PANIC_EVENT = 'robot:panic';

export const triggerPanic = () => window.dispatchEvent(new Event(PANIC_EVENT));

export const usePanicListener = (callback: () => void) => {
    // Ref para no re-registrar el listener en cada render
    const callbackRef = useRef(callback);
    callbackRef.current = callback;

    useEffect(() => {
        const handler = () => callbackRef.current();
        window.addEventListener(PANIC_EVENT, handler);
        return () => window.removeEventListener(PANIC_EVENT, handler);
    }, []);
};
