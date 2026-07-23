/**
 * Estructura de la Historia Clínica neuropsicológica de "Ser y Crecer",
 * basada en el instrumento real (4 secciones del Excel del centro).
 *
 * Enfoque data-driven: cada sección tiene grupos y campos; el renderizador
 * dibuja los campos según su tipo y guarda las respuestas en el store por id.
 * Ampliar el instrumento = agregar campos aquí, sin tocar la UI.
 */

export type FieldType = "text" | "textarea" | "number" | "date" | "select" | "bool";

export interface Field {
  id: string;
  label: string;
  type: FieldType;
  options?: string[];
  help?: string;
  /** Ocupa las 2 columnas del grupo. */
  full?: boolean;
}

export interface Group {
  title: string;
  /** Los campos "bool" (Sí/No/obs.) se muestran como lista de una columna. */
  fields: Field[];
}

export interface Section {
  id: string;
  title: string;
  groups: Group[];
}

// Helpers para reducir verbosidad
const t = (id: string, label: string, full = false): Field => ({ id, label, type: "text", full });
const ta = (id: string, label: string): Field => ({ id, label, type: "textarea", full: true });
const num = (id: string, label: string): Field => ({ id, label, type: "number" });
const b = (id: string, label: string, help?: string): Field => ({ id, label, type: "bool", help });
const sel = (id: string, label: string, options: string[]): Field => ({ id, label, type: "select", options });

const INTENSIDAD = ["Leve", "Moderado", "Severo"];
const NIVEL = ["Bueno", "Regular", "Con alteraciones", "Sin alteraciones"];

// ─────────────────────────── 1. TAMIZAJE ───────────────────────────
const TAMIZAJE: Section = {
  id: "tamizaje",
  title: "Tamizaje",
  groups: [
    {
      title: "Tipo de servicio",
      fields: [
        b("srv_evaluacion", "Evaluación"),
        b("srv_consulta", "Consulta"),
        b("srv_reevaluacion", "Reevaluación"),
        b("srv_terapia", "Terapia"),
        b("srv_test_neuro", "Test neuropsicológico"),
        b("srv_controles", "Controles psicológicos"),
        b("srv_recomendaciones", "Recomendaciones"),
      ],
    },
    {
      title: "Motivo de consulta",
      fields: [
        ta("mc_descripcion", "Descripción del problema"),
        t("mc_frecuencia", "Frecuencia (¿cuántas veces al día/semana?)"),
        t("mc_duracion", "Duración (¿cuánto tiempo dura?)"),
        sel("mc_intensidad", "Intensidad", INTENSIDAD),
        t("mc_latencia", "Latencia (¿la conducta descansa?)"),
        t("mc_lugar", "Lugar (¿dónde lo realiza?)"),
        t("mc_estimulo_ext", "Estímulo externo"),
        t("mc_estimulo_ref", "Estímulo reforzador"),
        ta("mc_hipotesis", "Hipótesis"),
      ],
    },
    {
      title: "Expectativas de los padres",
      fields: [
        b("ex_descarte", "¿Buscan descartar algún trastorno?"),
        b("ex_derivado", "¿Alguien lo ha derivado?"),
        b("ex_conducta", "¿Han observado alguna conducta?"),
        b("ex_segunda_opinion", "¿Es una segunda opinión?"),
        b("ex_eval_previa", "¿Hubo una evaluación previa?"),
        b("ex_informe_previo", "¿Existe un informe?"),
        b("ex_solo_diagnostico", "¿Solo requieren un diagnóstico?"),
        b("ex_eval_terapia", "¿Evaluación para terapia?"),
        b("ex_neuropediatria", "¿Han pasado por neuropediatría?"),
        b("ex_psiquiatria", "¿Ha pasado por psiquiatría?"),
        b("ex_terapias", "¿Ha llevado terapias?"),
        ta("ex_comentario", "Comentario / detalle"),
      ],
    },
    {
      title: "Criterios diagnósticos — TEA (DSM-5)",
      fields: [
        b("tea_a", "A. Deficiencias persistentes en comunicación e interacción social (reciprocidad, conductas no verbales, relaciones)"),
        b("tea_b", "B. Patrones restrictivos y repetitivos (estereotipias, insistencia en monotonía, intereses restringidos, hiper/hiporreactividad sensorial)"),
        b("tea_c", "C. Síntomas presentes en las primeras fases del desarrollo"),
        b("tea_d", "D. Deterioro clínicamente significativo del funcionamiento"),
        b("tea_e", "E. No se explica mejor por discapacidad intelectual"),
      ],
    },
    {
      title: "Criterios diagnósticos — TDAH (DSM-5)",
      fields: [
        b("tdah_inatencion", "Inatención: ≥6 síntomas por al menos 6 meses"),
        b("tdah_hiper", "Hiperactividad-impulsividad: ≥6 síntomas por al menos 6 meses"),
        b("tdah_antes12", "B. Síntomas presentes antes de los 12 años"),
        b("tdah_contextos", "C. Presentes en dos o más contextos"),
        b("tdah_interferencia", "D. Interfieren con el funcionamiento social/académico/laboral"),
        b("tdah_no_otro", "E. No se explican mejor por otro trastorno"),
      ],
    },
  ],
};

// ──────────────────── 2. ANAMNESIS DE DESARROLLO ────────────────────
const ANAMNESIS: Section = {
  id: "anamnesis",
  title: "Anamnesis de desarrollo",
  groups: [
    {
      title: "Etapa prenatal",
      fields: [
        b("pre_enfermedades", "Enfermedades o accidentes durante el embarazo"),
        b("pre_hemorragias", "Manchas o hemorragias"),
        b("pre_amenaza_aborto", "Amenaza de aborto"),
        b("pre_presion_alta", "Presión alta"),
        b("pre_alcohol", "Consumo de alcohol"),
        b("pre_fumaba", "Fumaba"),
        b("pre_medicamentos", "Medicamentos"),
        b("pre_convulsiones", "Convulsiones"),
        b("pre_planificado", "Fue planificado"),
        b("pre_deseado", "Ambos deseaban tener al bebé"),
        b("pre_impresiones", "Impresiones fuertes durante el embarazo"),
        ta("pre_obs", "Observaciones"),
      ],
    },
    {
      title: "Etapa perinatal (parto)",
      fields: [
        sel("peri_parto", "Tipo de parto", ["Normal", "Cesárea", "Emergencia"]),
        num("peri_semana", "Nace a la semana"),
        b("peri_lloro", "Lloró enseguida al nacer"),
        b("peri_reanimacion", "Necesitaron reanimarlo / oxígeno"),
        b("peri_incubadora", "Necesitó incubadora"),
        b("peri_ictericia", "Tuvo ictericia"),
        t("peri_peso", "Peso al nacer"),
        t("peri_medida", "Medida al nacer"),
        ta("peri_complicaciones", "Complicaciones o dificultades"),
      ],
    },
    {
      title: "Desarrollo psicomotor (edad en meses)",
      fields: [
        t("dev_cabeza", "Levantó la cabeza"),
        t("dev_sento", "Logró sentarse"),
        t("dev_gateo", "Empezó a gatear"),
        t("dev_bipedestacion", "Bipedestación"),
        t("dev_miraba", "Miraba a los ojos"),
        t("dev_lactancia", "Lactancia"),
        b("dev_zurdo", "Zurdo"),
        b("dev_diestro", "Diestro"),
      ],
    },
    {
      title: "Lenguaje",
      fields: [
        sel("len_nivel", "Nivel general", NIVEL),
        b("len_se_entiende", "Se hace entender"),
        b("len_familia", "Solo le entiende la familia cuando habla"),
        b("len_comprende", "Comprende todo lo que se le dice"),
        b("len_dialogo", "Mantiene el diálogo"),
        b("len_sigue", "Sigue indicaciones"),
        b("len_ecolalia", "Presenta ecolalia"),
        ta("len_obs", "Observaciones del lenguaje"),
      ],
    },
    {
      title: "Atención e inteligencia",
      fields: [
        b("at_focalizada", "Atención focalizada"),
        b("at_sostenida", "Atención sostenida"),
        b("at_selectiva", "Atención selectiva"),
        b("at_alternada", "Atención alternada"),
        b("int_colores", "Reconoce colores"),
        b("int_lee", "Comprende lo que lee"),
        b("int_escribe", "Sabe escribir"),
        b("int_aprendizaje", "Problemas de aprendizaje"),
      ],
    },
    {
      title: "Desarrollo psicosocial y autonomía",
      fields: [
        b("ps_amiguero", "Es amiguero"),
        b("ps_contacto_visual", "Contacto visual"),
        b("ps_turnos", "Respeta turnos"),
        b("ps_emociones", "Reconoce emociones de los demás"),
        b("ps_juego_simbolico", "Juego simbólico"),
        b("ps_empatia", "Empatía"),
        b("au_come_solo", "Come solo"),
        b("au_bano_solo", "Va al baño solo"),
        b("au_viste_solo", "Se cambia / viste solo"),
        b("au_rutinas", "Tiene horarios, hábitos o rutinas"),
      ],
    },
    {
      title: "Contexto familiar",
      fields: [
        sel("fam_constelacion", "Constelación familiar", [
          "Nuclear", "Extensa", "Adoptiva", "Monoparental", "Homoparental", "Reconstituida",
        ]),
        b("fam_vive_padres", "Ha vivido siempre con sus padres"),
        b("fam_sobreproteccion", "Sobreprotección"),
        b("fam_permisividad", "Permisividad"),
        b("fam_violencia_psi", "Violencia psicológica"),
        b("fam_violencia_fis", "Violencia física"),
        ta("fam_obs", "Observaciones familiares"),
      ],
    },
  ],
};

// ──────────────────── 3. PLAN DE EVALUACIÓN ────────────────────
const PLAN_EVAL: Section = {
  id: "plan_evaluacion",
  title: "Plan de evaluación",
  groups: [
    {
      title: "¿Por qué evaluar?",
      fields: [
        b("pq_padres", "A solicitud de los padres"),
        b("pq_profesores", "A solicitud de los profesores"),
        b("pq_neurodesarrollo", "Sospecha de trastorno del neurodesarrollo"),
        b("pq_aprendizaje", "Problemas de aprendizaje"),
        b("pq_conducta", "Problemas de conducta"),
        b("pq_socializacion", "Problemas de socialización"),
        ta("pq_comentario", "Comentario"),
      ],
    },
    {
      title: "¿Para qué evaluar?",
      fields: [
        b("pf_constancia", "Dar constancia de atención"),
        b("pf_recomendaciones", "Dar recomendaciones"),
        b("pf_informe", "Informe psicológico"),
        b("pf_informe_ci", "Informe del CI"),
        b("pf_resumen", "Resumen de atención"),
      ],
    },
    {
      title: "¿Qué voy a evaluar?",
      fields: [
        b("qe_leng_comp", "Lenguaje comprensivo"),
        b("qe_leng_exp", "Lenguaje expresivo"),
        b("qe_social", "Social"),
        b("qe_emociones", "Emociones"),
        b("qe_personalidad", "Personalidad"),
        b("qe_teoria_mente", "Teoría de la mente"),
        b("qe_inteligencia", "Inteligencia (CIT)"),
        b("qe_madurez", "Madurez neuropsicológica"),
        b("qe_hitos", "Hitos del desarrollo"),
        b("qe_motricidad", "Motricidad gruesa/fina"),
      ],
    },
    {
      title: "¿A quién voy a evaluar?",
      fields: [
        b("aq_paciente", "Paciente"),
        b("aq_mama", "Mamá"),
        b("aq_papa", "Papá"),
        b("aq_hermanos", "Hermanos"),
        b("aq_profesores", "Profesores"),
      ],
    },
    {
      title: "¿Cómo voy a evaluar?",
      fields: [
        b("cm_observacion", "Observación"),
        b("cm_entrevista_prof", "Entrevista a la profesora"),
        b("cm_pruebas", "Pruebas psicométricas"),
        b("cm_juegos", "Por medio de juegos"),
        b("cm_test_familia", "Test de la familia"),
      ],
    },
    {
      title: "Batería de tests",
      fields: [
        b("tst_wippsi", "WPPSI"),
        b("tst_wisc", "WISC"),
        b("tst_wais", "WAIS"),
        b("tst_cumanin", "CUMANIN"),
        b("tst_cumanes", "CUMANES"),
        b("tst_neuropsi", "NEUROPSI"),
        b("tst_bender", "BENDER"),
        b("tst_banfe", "BANFE"),
        b("tst_cars", "CARS"),
        b("tst_ados", "ADOS-2"),
        b("tst_adir", "ADI-R"),
        b("tst_mchat", "M-CHAT"),
        b("tst_scq", "SCQ"),
        b("tst_conners", "CONNERS (padres)"),
        b("tst_etdah", "ETDAH"),
        b("tst_prolec", "PROLEC-R"),
        b("tst_proesc", "PROESC"),
        b("tst_plon", "PLON-R"),
        b("tst_rias", "RIAS / RIST"),
        b("tst_denver", "DENVER"),
      ],
    },
    {
      title: "Hipótesis diagnóstica",
      fields: [ta("pe_hipotesis", "Hipótesis diagnóstica")],
    },
  ],
};

export const SECCIONES: Section[] = [TAMIZAJE, ANAMNESIS, PLAN_EVAL];

/** Estados de un objetivo del plan de trabajo. */
export const ESTADOS_OBJETIVO = ["En proceso inicial", "Muestra mejora", "Logrado"] as const;
export type EstadoObjetivo = (typeof ESTADOS_OBJETIVO)[number];
