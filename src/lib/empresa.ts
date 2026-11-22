// Datos de la empresa, configurables con variables de entorno.
// RECIBO_EMPRESA y RECIBO_NIT se siguen aceptando como nombres anteriores.
export function datosEmpresa() {
  return {
    nombre: process.env.NOMBRE_EMPRESA || process.env.RECIBO_EMPRESA || "Cartera de Edificios",
    rnc: process.env.RECIBO_RNC || process.env.RECIBO_NIT || "",
    direccion: process.env.RECIBO_DIRECCION || "",
    telefono: process.env.RECIBO_TELEFONO || "",
  };
}
