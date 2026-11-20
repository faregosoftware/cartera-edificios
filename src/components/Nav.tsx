"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function Nav({ items }: { items: { href: string; texto: string }[] }) {
  const ruta = usePathname();
  return (
    <>
      {items.map((i) => {
        const activo = i.href === "/" ? ruta === "/" : ruta.startsWith(i.href);
        return (
          <Link key={i.href} href={i.href} className={activo ? "on" : ""} aria-current={activo ? "page" : undefined}>
            {i.texto}
          </Link>
        );
      })}
    </>
  );
}
