import type { CSSProperties, ReactNode } from "react";
import { themeCardTones } from "../theme";
import { useTheme } from "../services/useTheme";

type CardToneProps = {
    // Posición de la tarjeta en su pestaña: elige el tono `index % nº de tonos` de la paleta
    index: number;
    // Por defecto el envoltorio no genera caja (`contents`) y no mueve nada del diseño; si la tarjeta ya iba dentro
    // de un contenedor con sus propias clases de layout, se pueden pasar aquí
    className?: string;
    children: ReactNode;
};

// Da a una tarjeta (y a todo lo que lleva dentro) el tono que le toca de la paleta activa. Lo hace redefiniendo, solo
// para esa tarjeta, las variables que usan los componentes: AZUL_PRINCIPAL pasa a ser el color de la tarjeta y
// CELESTE_PRINCIPAL el de lo que va sobre ella. Así los componentes no cambian: píldoras, campos y textos se
// adaptan solos (en una tarjeta clara, la tinta oscura y los textos del color de la tarjeta).
// Si la paleta tiene degradado (`cardGradient`), index.css lo pinta sobre el fondo de cada tarjeta, que es el hijo directo
// de este envoltorio (por eso lleva `data-card-tone`).
// El envoltorio se renderiza siempre (con o sin tonos) para que cambiar de tema no recree las tarjetas ni pierda su estado.
const CardTone = ({ index, className = "contents", children }: CardToneProps) => {
    const { theme, palette } = useTheme();
    const tones = themeCardTones(theme, palette);
    const tone = tones.length ? tones[index % tones.length] : undefined;

    const style = tone
        ? ({ "--c-azul-principal": tone.fondo, "--c-celeste-principal": tone.tinta } as CSSProperties)
        : undefined;

    return (
        <div data-card-tone="" className={className} style={style}>
            {children}
        </div>
    );
};

export default CardTone;
