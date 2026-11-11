type ScrollFadeProps = {
    edge: "top" | "bottom";
    // Hay más contenido en esa dirección
    visible: boolean;
};

// Borde difuminado en la parte superior o inferior del tablero, para avisar de que hay más contenido al hacer scroll.
// Solo en escritorio (`desk`), que es donde el marco scrollea por dentro. Debe ir dentro de un contenedor `relative`
// con esquinas redondeadas de 20px de radio (el radio interno del marco de 25px con borde de 5px).
const ScrollFade = ({ edge, visible }: ScrollFadeProps) => (
    <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-x-0 z-10 hidden h-7 backdrop-blur-[6px] transition-opacity duration-200 desk:block ${
            edge === "top"
                ? "top-0 rounded-t-[20px] bg-gradient-to-b [mask-image:linear-gradient(to_bottom,black,transparent)]"
                : "bottom-0 rounded-b-[20px] bg-gradient-to-t [mask-image:linear-gradient(to_top,black,transparent)]"
        } from-[var(--c-fondo-pagina)]/60 to-transparent ${visible ? "opacity-100" : "opacity-0"}`}
    />
);

export default ScrollFade;
