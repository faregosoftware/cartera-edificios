import { PrismaClient } from "@prisma/client";

// Una sola instancia en desarrollo (evita agotar conexiones con la recarga en caliente).
const global_ = globalThis as unknown as { prisma?: PrismaClient };
export const prisma = global_.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") global_.prisma = prisma;
