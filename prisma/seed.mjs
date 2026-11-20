// Carga inicial: roles por defecto y primer administrador.
// Uso: npm run db:seed   (con SEED_DEMO=1 también carga datos de ejemplo)
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { ROLES_INICIALES } from "../src/lib/permisos.ts";

const prisma = new PrismaClient();

async function main() {
  for (const r of ROLES_INICIALES) {
    await prisma.rol.upsert({
      where: { nombre: r.nombre },
      // Si el rol ya existe no se tocan sus permisos: el administrador pudo haberlos cambiado.
      update: { sistema: r.sistema },
      create: { nombre: r.nombre, descripcion: r.descripcion, permisos: r.permisos, sistema: r.sistema },
    });
  }
  console.log(`Roles listos: ${ROLES_INICIALES.map((r) => r.nombre).join(", ")}`);

  const email = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || "";
  if (!email || password.length < 10) {
    console.log("ADMIN_EMAIL o ADMIN_PASSWORD (mínimo 10 caracteres) no definidos: no se creó administrador.");
  } else {
    const existe = await prisma.usuario.findUnique({ where: { email } });
    if (existe) {
      console.log(`El usuario ${email} ya existe: no se modificó.`);
    } else {
      const admin = await prisma.rol.findUniqueOrThrow({ where: { nombre: "Administrador" } });
      await prisma.usuario.create({
        data: {
          email,
          nombre: process.env.ADMIN_NOMBRE || "Administrador",
          passwordHash: await bcrypt.hash(password, 12),
          rolId: admin.id,
          debeCambiarPassword: true,
        },
      });
      console.log(`Administrador creado: ${email} (deberá cambiar la contraseña al entrar).`);
    }
  }

  if (process.env.SEED_DEMO === "1" && (await prisma.edificio.count()) === 0) {
    const e1 = await prisma.edificio.create({ data: { nombre: "Edificio Illimani", direccion: "Av. 20 de Octubre 2150, Sopocachi", ciudad: "La Paz" } });
    const e2 = await prisma.edificio.create({ data: { nombre: "Torre Calacoto", direccion: "Calle 15 de Calacoto 8020", ciudad: "La Paz" } });
    const u1 = await prisma.unidad.create({ data: { edificioId: e1.id, codigo: "2A", piso: "2", superficie: 85, dormitorios: 2, rentaReferencia: 3200 } });
    await prisma.unidad.create({ data: { edificioId: e1.id, codigo: "3B", piso: "3", superficie: 110, dormitorios: 3, rentaReferencia: 4100 } });
    const u3 = await prisma.unidad.create({ data: { edificioId: e1.id, codigo: "Local 1", tipo: "Local comercial", piso: "PB", superficie: 60, rentaReferencia: 5500 } });
    const u4 = await prisma.unidad.create({ data: { edificioId: e2.id, codigo: "501", tipo: "Oficina", piso: "5", superficie: 72, rentaReferencia: 650, monedaReferencia: "USD" } });
    await prisma.unidad.create({ data: { edificioId: e2.id, codigo: "802", piso: "8", superficie: 140, dormitorios: 3, rentaReferencia: 900, monedaReferencia: "USD" } });
    const i1 = await prisma.inquilino.create({ data: { nombre: "María Quispe Mamani", documento: "4589123 LP", telefono: "+591 71234567" } });
    const i2 = await prisma.inquilino.create({ data: { nombre: "Farmacia San Miguel S.R.L.", tipoDoc: "NIT", documento: "1020304025" } });
    const i3 = await prisma.inquilino.create({ data: { nombre: "Consultora Andina S.A.", tipoDoc: "NIT", documento: "3041526017" } });
    const d = (s) => new Date(s + "T00:00:00Z");
    await prisma.contrato.createMany({
      data: [
        { unidadId: u1.id, inquilinoId: i1.id, inicio: d("2026-03-01"), fin: d("2027-02-28"), renta: 3200, garantia: 6400, diaPago: 5 },
        { unidadId: u3.id, inquilinoId: i2.id, inicio: d("2025-01-01"), fin: d("2026-12-31"), renta: 5500, garantia: 11000, diaPago: 10 },
        { unidadId: u4.id, inquilinoId: i3.id, inicio: d("2025-11-10"), fin: d("2026-11-09"), renta: 650, moneda: "USD", garantia: 1300, diaPago: 1 },
      ],
    });
    console.log("Datos de ejemplo cargados.");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
