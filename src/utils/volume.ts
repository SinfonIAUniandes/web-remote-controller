// El robot acepta volúmenes de 0 a 150. Los altavoces no saturan (hay un limitador),
// pero por encima de 100 suena muy fuerte y desagradable, así que la UI lo marca como zona de riesgo.
export const MAX_VOLUME = 150;
export const SAFE_VOLUME = 100;
