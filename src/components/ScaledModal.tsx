import { useEffect, useState, type ReactNode } from 'react';

interface ScaledModalProps {
    width: number;
    height: number;
    children: ReactNode;
}

const MARGIN = 16;

// Escala el contenido de tamaño fijo (width x height) para que siempre quepa en el viewport.
const useFitScale = (width: number, height: number) => {
    const compute = () => Math.min(1, (window.innerWidth - MARGIN) / width, (window.innerHeight - MARGIN) / height);
    const [scale, setScale] = useState(compute);

    useEffect(() => {
        const onResize = () => setScale(compute());
        onResize();
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, [width, height]);

    return scale;
};

const ScaledModal = ({ width, height, children }: ScaledModalProps) => {
    const scale = useFitScale(width, height);

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            {/* La caja externa ocupa el tamaño ya escalado; la interna conserva el diseño original */}
            <div style={{ width: width * scale, height: height * scale, flexShrink: 0 }}>
                <div style={{ width, height, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
                    {children}
                </div>
            </div>
        </div>
    );
};

export default ScaledModal;
