import BatteryPill from "../status/BatteryPill";
import IpPill from "../status/IpPill";
import RobotSliders from "../status/RobotSliders";

// Píldoras centradas sobre la línea del borde superior del tablero. Debe ir dentro de un contenedor `relative`
// con borde de 5px: relativo al interior, el centro de esa línea está a -2.5px.
//   izquierda: IP del robot · centro: volumen y velocidad (solo escritorio; en móvil van en el menú) · derecha: batería
// La fila no captura clics: solo las píldoras.
const BoardBorderPills = () => (
    <div className="pointer-events-none absolute -top-[2.5px] inset-x-10 z-20 grid -translate-y-1/2 grid-cols-[1fr_auto_1fr] items-center desk:inset-x-14">
        <div className="pointer-events-auto justify-self-start">
            <IpPill />
        </div>
        <RobotSliders showHint className="pointer-events-auto col-start-2 hidden items-center gap-3 desk:flex" />
        <div className="pointer-events-auto col-start-3 justify-self-end">
            <BatteryPill />
        </div>
    </div>
);

export default BoardBorderPills;
