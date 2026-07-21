import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Sirve las imágenes tal cual (los logos ya están optimizados a ~50KB).
  // Evita el optimizador de imágenes de Next, que satura la CPU en instancias
  // pequeñas de Railway y disparaba los tiempos de respuesta a 10-25s.
  images: { unoptimized: true },
};

export default nextConfig;
