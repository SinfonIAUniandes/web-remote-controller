import { useCallback, useEffect, useRef, useState } from 'react';

// Indica si el contenedor que scrollea tiene más contenido hacia arriba o hacia abajo.
// Devuelve el ref que hay que ponerle al contenedor y el handler para su evento onScroll.
export const useScrollHints = () => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [canScrollUp, setCanScrollUp] = useState(false);
    const [canScrollDown, setCanScrollDown] = useState(false);

    const updateScrollHints = useCallback(() => {
        const el = scrollRef.current;
        if (!el) return;
        setCanScrollUp(el.scrollTop > 1);
        setCanScrollDown(el.scrollTop + el.clientHeight < el.scrollHeight - 1);
    }, []);

    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;
        updateScrollHints();
        // Recalcula al cambiar el alto de la ventana o del contenido
        const observer = new ResizeObserver(updateScrollHints);
        observer.observe(el);
        if (el.firstElementChild) observer.observe(el.firstElementChild);
        return () => observer.disconnect();
    }, [updateScrollHints]);

    return { scrollRef, canScrollUp, canScrollDown, onScroll: updateScrollHints };
};
