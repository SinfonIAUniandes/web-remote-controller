import { useRos } from '../contexts/RosContext';
import { isValidIpv4 } from '../utils/ip';

// Estado de la IP del robot, compartido por las distintas vistas de la IP (IpPill, IpChip)
export const useIpStatus = () => {
    const { ipAddress, setIpAddress, isConnected } = useRos();

    const hasIp = isValidIpv4(ipAddress);
    const connected = hasIp && isConnected;
    const statusText = !hasIp ? 'Falta la IP del robot' : connected ? 'Conectado' : 'Sin conexión';

    return { ipAddress, setIpAddress, hasIp, connected, statusText };
};
