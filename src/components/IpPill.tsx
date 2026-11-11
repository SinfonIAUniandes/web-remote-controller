import { useState } from "react";
import { Wifi, WifiOff } from "lucide-react";
import { COLORS } from "../theme";
import { useIpStatus } from "../services/useIpStatus";
import IpModal from "./IpModal";

// IP del robot en una píldora (pareja de BatteryPill, montada sobre el borde del tablero).
// Al hacer clic abre el modal para cambiar la IP.
//   morado → conectado
//   rojo   → sin conexión o sin IP
const IpPill = () => {
    const { ipAddress, setIpAddress, hasIp, connected, statusText } = useIpStatus();
    const [isOpen, setIsOpen] = useState(false);

    const colors = connected
        ? { backgroundColor: COLORS.AZUL_SECUNDARIO, color: COLORS.AZUL_PRINCIPAL }
        : { backgroundColor: COLORS.ROJO, color: COLORS.TEXTO_SOBRE_ROJO };

    const Icon = connected ? Wifi : WifiOff;

    const handleSave = (ip: string) => {
        setIpAddress(ip);
        setIsOpen(false);
    };

    return (
        <>
            <button
                type="button"
                onClick={() => setIsOpen(true)}
                title={`${statusText} · clic para cambiar la IP`}
                aria-label={hasIp ? `IP del robot ${ipAddress}: ${statusText}. Cambiar IP` : "Ingresar la IP del robot"}
                className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-full border-none px-2.5 font-['Nunito'] text-xs font-black leading-none shadow-[0_2px_6px_rgba(0,0,0,0.25)] transition-transform duration-200 hover:scale-105 sm:px-3 sm:text-sm"
                style={colors}
            >
                <Icon aria-hidden="true" size={18} strokeWidth={2.5} className="shrink-0" />
                {/* En pantallas muy estrechas (<360px) solo el icono, para no chocar con la píldora de batería */}
                <span className="max-[359px]:hidden">{hasIp ? ipAddress : "Ingresar IP"}</span>
            </button>

            <IpModal isOpen={isOpen} currentIp={ipAddress} onClose={() => setIsOpen(false)} onSave={handleSave} />
        </>
    );
};

export default IpPill;
