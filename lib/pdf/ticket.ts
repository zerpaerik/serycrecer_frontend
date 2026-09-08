/**
 * Genera el ticket de atención como PDF (80 mm de ancho, alto según contenido).
 * Se dibuja como texto real —no como captura de pantalla—, así el archivo pesa
 * poco y se lee nítido al enviarlo por WhatsApp.
 */
import { formatDate, formatPEN } from "@/lib/format";

export interface TicketData {
  id: number | string;
  fecha: string;
  hora?: string | null;
  total: number;
  pagado: number;
  saldo: number;
  estado: string;
  paciente: string;
  documento?: string;
  psicologo?: string;
  items: { nombre: string; monto: number }[];
  metodos: string;
}

export interface TicketConfig {
  nombre?: string;
  ruc?: string;
  direccion?: string;
  telefono?: string;
}

const ANCHO = 80; // mm (rollo de ticketera)
const MARGEN = 4;
const UTIL = ANCHO - MARGEN * 2;

/** Nombre de archivo sugerido: Ticket-000012-Lucia-Vega.pdf */
export function nombreArchivoTicket(t: TicketData) {
  const n = String(t.id).padStart(6, "0");
  const paciente = t.paciente
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // quita tildes
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `Ticket-${n}${paciente ? `-${paciente}` : ""}.pdf`;
}

export async function generarTicketPdf(t: TicketData, config: TicketConfig) {
  const { jsPDF } = await import("jspdf");

  // Se dibuja primero en una hoja larga para medir el alto real del contenido…
  const medicion = new jsPDF({ unit: "mm", format: [ANCHO, 400] });
  const alto = dibujar(medicion, t, config) + MARGEN;

  // …y luego se genera el ticket con el alto exacto (sin papel de sobra).
  const doc = new jsPDF({ unit: "mm", format: [ANCHO, alto], compress: true });
  dibujar(doc, t, config);
  return doc;
}

/** Dibuja el ticket y devuelve la posición vertical final (mm). */
function dibujar(doc: import("jspdf").jsPDF, t: TicketData, config: TicketConfig) {
  const centro = ANCHO / 2;
  const izq = MARGEN;
  const der = ANCHO - MARGEN;
  let y = 7;

  const linea = (grosor = 0.15) => {
    doc.setLineWidth(grosor);
    doc.setLineDashPattern([0.6, 0.6], 0);
    doc.line(izq, y, der, y);
    doc.setLineDashPattern([], 0);
    y += 3;
  };
  const centrado = (txt: string, size: number, bold = false, salto = 4) => {
    doc.setFontSize(size);
    doc.setFont("helvetica", bold ? "bold" : "normal");
    for (const l of doc.splitTextToSize(txt, UTIL)) {
      doc.text(l, centro, y, { align: "center" });
      y += salto;
    }
  };
  const fila = (etiqueta: string, valor: string, bold = false) => {
    doc.setFontSize(7.5);
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.text(etiqueta, izq, y);
    doc.text(valor, der, y, { align: "right" });
    y += 4.2;
  };

  // Encabezado del centro
  centrado(config.nombre ?? "Ser y Crecer", 10, true, 4.6);
  doc.setTextColor(90);
  if (config.ruc) centrado(`RUC ${config.ruc}`, 6.5, false, 3.2);
  if (config.direccion) centrado(config.direccion, 6.5, false, 3.2);
  if (config.telefono) centrado(config.telefono, 6.5, false, 3.2);
  doc.setTextColor(0);

  y += 1.5;
  centrado("TICKET DE ATENCIÓN", 8.5, true, 4.5);
  linea();

  // Datos de la atención
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  const datos: [string, string][] = [
    ["N°", String(t.id).padStart(6, "0")],
    ["Fecha", `${formatDate(t.fecha)}${t.hora ? ` ${t.hora}` : ""}`],
    ["Paciente", t.paciente],
  ];
  if (t.documento) datos.push(["Documento", t.documento]);
  datos.push(["Psicólogo", t.psicologo ?? "—"]);
  for (const [k, v] of datos) {
    doc.setTextColor(110);
    doc.text(`${k}:`, izq, y);
    doc.setTextColor(0);
    // El valor se ajusta al ancho restante para no salirse del ticket.
    const sangria = izq + 17;
    for (const l of doc.splitTextToSize(v, der - sangria)) {
      doc.text(l, sangria, y);
      y += 3.6;
    }
    y += 0.4;
  }

  y += 0.5;
  linea();

  // Ítems
  doc.setFontSize(7.5);
  for (const it of t.items) {
    doc.setFont("helvetica", "normal");
    const importe = formatPEN(it.monto);
    const anchoImporte = doc.getTextWidth(importe);
    const lineas = doc.splitTextToSize(it.nombre, UTIL - anchoImporte - 2);
    lineas.forEach((l: string, i: number) => {
      doc.text(l, izq, y);
      if (i === 0) doc.text(importe, der, y, { align: "right" });
      y += 3.6;
    });
  }

  y += 0.8;
  linea();

  // Totales
  fila("TOTAL", formatPEN(t.total), true);
  fila("Pagado", formatPEN(t.pagado));
  fila("Saldo", formatPEN(t.saldo));

  y += 0.5;
  doc.setFontSize(7);
  doc.setTextColor(80);
  doc.text(`Método: ${t.metodos}`, izq, y);
  y += 3.8;
  doc.text(`Estado: ${t.estado}`, izq, y);
  y += 4;
  doc.setTextColor(0);

  linea();
  y += 1;
  doc.setTextColor(110);
  centrado("¡Gracias por su preferencia!", 7, false, 3.4);
  centrado(config.nombre ?? "Ser y Crecer", 7, false, 3.4);
  doc.setTextColor(0);

  return y;
}
