const IPV4_REGEX = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;

export const isValidIpv4 = (ip: string): boolean => {
    const match = IPV4_REGEX.exec(ip.trim());
    return !!match && match.slice(1).every(octet => Number(octet) <= 255);
};

// Devuelve "a.b.c" de una IP como "a.b.c.d" o "a.b.c.xxx"; null si no tiene tres octetos numéricos
export const getIpPrefix = (ip: string): string | null => {
    const match = /^(\d{1,3}\.\d{1,3}\.\d{1,3})\.[^.]*$/.exec(ip.trim());
    return match ? match[1] : null;
};

// IP inicial: los tres primeros octetos del dispositivo + "xxx" (la IP del robot aún no se ha ingresado)
export const getDefaultIp = (hostname: string): string => {
    const prefix = isValidIpv4(hostname) ? getIpPrefix(hostname) : null;
    // return prefix ? `${prefix}.xxx` : '192.168.1.xxx'; // para testear la otra view del modal
    return prefix ? `${prefix}.xxx` : 'xxx.xxx.xxx.xxx';
};
