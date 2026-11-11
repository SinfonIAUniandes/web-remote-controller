import { SportShoe, TriangleAlert, Volume1, Volume2, VolumeX } from "lucide-react";
import { useRos } from "../contexts/RosContext";
import { MAX_VOLUME, SAFE_VOLUME } from "../utils/volume";
import SliderPill from "./SliderPill";

// Volumen y velocidad de la base del robot. Ambos valores viven en RosContext, así que
// pueden mostrarse en varios sitios a la vez (borde del tablero en escritorio, menú en móvil).
// `showHint`: cartel de aviso bajo la píldora del volumen cuando pasa de 100 (solo cabe sobre el borde del tablero).
const RobotSliders = ({ className = "", showHint = false }: { className?: string; showHint?: boolean }) => {
    const { volume, setVolume, baseSpeed, setBaseSpeed } = useRos();

    const VolumeIcon = volume === 0 ? VolumeX : volume < 50 ? Volume1 : Volume2;

    return (
        <div className={className}>
            <SliderPill
                icon={VolumeIcon}
                dangerIcon={TriangleAlert}
                label="Volumen"
                value={volume}
                onChange={setVolume}
                max={MAX_VOLUME}
                dangerAbove={SAFE_VOLUME}
                dangerHint={`Más de ${SAFE_VOLUME}% puede sonar muy fuerte`}
                showHint={showHint}
            />
            <SliderPill
                icon={SportShoe}
                label="Velocidad"
                value={Math.round(baseSpeed * 100)}
                onChange={(percent) => setBaseSpeed(percent / 100)}
            />
        </div>
    );
};

export default RobotSliders;
