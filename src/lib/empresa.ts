// Datos de la empresa, configurables con variables de entorno.
// RECIBO_EMPRESA se sigue aceptando como nombre anterior de NOMBRE_EMPRESA.
export function datosEmpresa() {
  return {
    nombre: process.env.NOMBRE_EMPRESA || process.env.RECIBO_EMPRESA || "Cartera de Edificios",
    nit: process.env.RECIBO_NIT || "",
    direccion: process.env.RECIBO_DIRECCION || "",
    telefono: process.env.RECIBO_TELEFONO || "",
  };
}
