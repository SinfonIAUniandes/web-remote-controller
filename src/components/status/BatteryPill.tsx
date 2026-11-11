import { Battery, BatteryFull, BatteryLow, BatteryMedium } from "lucide-react";
import { COLORS, withAlpha } from "../../theme";
import { useBatteryLevel } from "../../hooks/useBatteryLevel";

const LOW_BATTERY = 30;
const MEDIUM_BATTERY = 60;

// Nivel de batería del robot en una píldora. Pensada para ir montada sobre el borde del tablero.
// Sin lectura (sin conexión) mantiene la forma de la píldora y un icono de batería (vacía) con "--%",
// pero con el morado apagado: así se sigue reconociendo como la batería, sin mostrar un porcentaje falso.
// Color sólido (no transparencia) para que la línea del borde no se vea a través de la píldora.
const BatteryPill = () => {
    const level = useBatteryLevel();

    // level es null sin conexión con el robot: en ese caso no se inventa un porcentaje
    if (level === null || Number.isNaN(level)) {
        return (
            <div
                role="img"
                aria-label="Nivel de batería desconocido: sin conexión con el robot"
                title="Batería: sin datos (sin conexión con el robot)"
                className="inline-flex h-8 items-center gap-1.5 rounded-full px-3 font-['Nunito'] text-sm font-black leading-none shadow-[0_2px_6px_rgba(0,0,0,0.25)]"
                style={{
                    // Morado de la píldora normal mezclado con el celeste de la página
                    backgroundColor: `color-mix(in srgb, ${COLORS.AZUL_SECUNDARIO} 40%, ${COLORS.CELESTE_PRINCIPAL})`,
                    color: withAlpha(COLORS.AZUL_PRINCIPAL, 70),
                }}
            >
                <Battery aria-hidden="true" size={20} strokeWidth={2.5} />
                <span>--%</span>
            </div>
        );
    }

    const percent = Math.min(100, Math.max(0, Math.round(level)));
    const isLow = percent <= LOW_BATTERY;
    const Icon = percent > MEDIUM_BATTERY ? BatteryFull : percent > LOW_BATTERY ? BatteryMedium : BatteryLow;

    return (
        <div
            role="img"
            aria-label={`Nivel de batería: ${percent}%`}
            className="inline-flex h-8 items-center gap-1.5 rounded-full px-3 font-['Nunito'] text-sm font-black leading-none shadow-[0_2px_6px_rgba(0,0,0,0.25)]"
            // Morado (distinto al azul del borde) normalmente; rojo cuando la batería está baja
            style={{
                backgroundColor: isLow ? COLORS.ROJO : COLORS.AZUL_SECUNDARIO,
                color: isLow ? COLORS.TEXTO_SOBRE_ROJO : COLORS.AZUL_PRINCIPAL,
            }}
        >
            <Icon aria-hidden="true" size={20} strokeWidth={2.5} />
            <span>{percent}%</span>
        </div>
    );
};

export default BatteryPill;
