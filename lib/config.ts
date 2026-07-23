/** URL base de la API (NestJS). Configurable por entorno. */
export const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api"
).replace(/\/$/, "");
