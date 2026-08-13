/**
 * Estructura de la Historia Clínica neuropsicológica de "Ser y Crecer",
 * basada en el instrumento real (4 secciones del Excel del centro).
 *
 * Enfoque data-driven: cada sección tiene grupos y campos; el renderizador
 * dibuja los campos según su tipo y guarda las respuestas en el store por id.
 * Ampliar el instrumento = agregar campos aquí, sin tocar la UI.
 */

// "cumple" = igual que "bool" pero con etiquetas "Cumple / No cumple"
// (criterios diagnósticos DSM-5).
export type FieldType = "text" | "textarea" | "number" | "date" | "select" | "bool" | "cumple";

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
const cu = (id: string, label: string): Field => ({ id, label, type: "cumple" });
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
      title: "TEA — Criterio A · Comunicación e interacción social (debe cumplir TODO)",
      fields: [
        cu("tea_a1", "A.1 Deficiencias en la reciprocidad socioemocional: desde un acercamiento social anormal y fracaso de la conversación normal en ambos sentidos, pasando por la disminución en intereses, emociones o afectos compartidos, hasta el fracaso en iniciar o responder a interacciones sociales."),
        cu("tea_a2", "A.2 Deficiencias en las conductas comunicativas no verbales: desde una comunicación verbal y no verbal poco integrada, pasando por anomalías del contacto visual y del lenguaje corporal o deficiencias del uso de gestos, hasta la falta total de expresión facial y de comunicación no verbal."),
        cu("tea_a3", "A.3 Deficiencias en el desarrollo, mantenimiento y comprensión de las relaciones: desde dificultades para ajustar el comportamiento a contextos sociales, pasando por dificultades para compartir juegos imaginativos o hacer amigos, hasta la ausencia de interés por otras personas."),
      ],
    },
    {
      title: "TEA — Criterio B · Patrones restrictivos y repetitivos (dos o más)",
      fields: [
        cu("tea_b1", "B.1 Movimientos, utilización de objetos o habla estereotipados o repetitivos (estereotipias motoras, alineación de juguetes, ecolalia, frases idiosincrásicas)."),
        cu("tea_b2", "B.2 Insistencia en la monotonía, inflexibilidad de rutinas o patrones ritualizados de comportamiento (angustia ante cambios pequeños, dificultades con las transiciones, rituales, mismo camino o alimentos)."),
        cu("tea_b3", "B.3 Intereses muy restringidos y fijos, anormales por su intensidad o foco (fuerte apego o preocupación por objetos inusuales, intereses excesivamente circunscritos o perseverantes)."),
        cu("tea_b4", "B.4 Hiper- o hiporreactividad a estímulos sensoriales o interés inhabitual por aspectos sensoriales (indiferencia al dolor/temperatura, respuesta adversa a sonidos/texturas, olfateo/palpación de objetos, fascinación por luces o movimiento)."),
      ],
    },
    {
      title: "TEA — Criterios C, D y E",
      fields: [
        cu("tea_c", "C. Los síntomas están presentes en las primeras fases del desarrollo (pueden no manifestarse del todo hasta que la demanda social supera las capacidades, o estar enmascarados por estrategias aprendidas)."),
        cu("tea_d", "D. Los síntomas causan un deterioro clínicamente significativo en lo social, laboral u otras áreas importantes del funcionamiento habitual."),
        cu("tea_e", "E. Estas alteraciones no se explican mejor por discapacidad intelectual o retraso global del desarrollo (la comunicación social ha de estar por debajo de lo previsto para el nivel de desarrollo)."),
      ],
    },
    {
      title: "TDAH — Criterio A · Inatención (seis o más, ≥6 meses)",
      fields: [
        cu("tdah_ina_a", "a. Con frecuencia falla en prestar atención a los detalles o comete errores por descuido en tareas, trabajo u otras actividades."),
        cu("tdah_ina_b", "b. Con frecuencia tiene dificultades para mantener la atención en tareas o actividades recreativas."),
        cu("tdah_ina_c", "c. Con frecuencia parece no escuchar cuando se le habla directamente."),
        cu("tdah_ina_d", "d. Con frecuencia no sigue las instrucciones y no termina las tareas, quehaceres o deberes."),
        cu("tdah_ina_e", "e. Con frecuencia tiene dificultad para organizar tareas y actividades."),
        cu("tdah_ina_f", "f. Con frecuencia evita o le disgustan las tareas que requieren un esfuerzo mental sostenido."),
        cu("tdah_ina_g", "g. Con frecuencia pierde cosas necesarias para tareas o actividades."),
        cu("tdah_ina_h", "h. Con frecuencia se distrae con facilidad por estímulos externos."),
        cu("tdah_ina_i", "i. Con frecuencia olvida las actividades cotidianas."),
      ],
    },
    {
      title: "TDAH — Criterio A · Hiperactividad-impulsividad (seis o más, ≥6 meses)",
      fields: [
        cu("tdah_hip_a", "a. Con frecuencia juguetea o golpea las manos o los pies, o se retuerce en el asiento."),
        cu("tdah_hip_b", "b. Con frecuencia se levanta en situaciones en que se espera que permanezca sentado."),
        cu("tdah_hip_c", "c. Con frecuencia corretea o trepa en situaciones inapropiadas (en adultos, sensación de inquietud)."),
        cu("tdah_hip_d", "d. Con frecuencia es incapaz de jugar o de ocuparse tranquilamente en actividades recreativas."),
        cu("tdah_hip_e", "e. Con frecuencia está 'ocupado', actuando como si 'lo impulsara un motor'."),
        cu("tdah_hip_f", "f. Con frecuencia habla excesivamente."),
        cu("tdah_hip_g", "g. Con frecuencia responde inesperadamente o antes de que se concluya una pregunta."),
        cu("tdah_hip_h", "h. Con frecuencia le es difícil esperar su turno."),
        cu("tdah_hip_i", "i. Con frecuencia interrumpe o se inmiscuye con otros."),
      ],
    },
    {
      title: "TDAH — Criterios B, C, D y E",
      fields: [
        cu("tdah_b", "B. Algunos síntomas de inatención o hiperactivo-impulsivos estaban presentes antes de los 12 años."),
        cu("tdah_c", "C. Varios síntomas están presentes en dos o más contextos (casa, escuela/trabajo, con amigos o parientes, otras actividades)."),
        cu("tdah_d", "D. Existen pruebas claras de que los síntomas interfieren o reducen la calidad del funcionamiento social, académico o laboral."),
        cu("tdah_e", "E. Los síntomas no se producen exclusivamente durante una esquizofrenia u otro trastorno psicótico y no se explican mejor por otro trastorno mental."),
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
      title: "Desarrollo psicomotor",
      fields: [
        t("dev_sento", "Logró sentarse (edad en meses)"),
        t("dev_gateo", "Empezó a gatear (edad en meses)"),
        t("dev_bipedestacion", "Bipedestación (edad en meses)"),
        t("dev_miraba", "Miraba a los ojos (edad en meses)"),
        t("dev_lactancia", "Lactancia"),
        sel("dev_lateralidad", "Lateralidad", ["Zurdo", "Diestro", "Ambidiestro", "No definido"]),
        b("dev_cabeza", "Levantó la cabeza"),
        b("dev_panal", "Uso de pañal"),
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
        ta("au_autonomia", "Autonomía"),
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
export const PLAN_EVAL: Section = {
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

// "Plan de evaluación" se retiró de la historia clínica a pedido del cliente.
// (Se conserva el objeto PLAN_EVAL por si se reactiva más adelante.)
export const SECCIONES: Section[] = [TAMIZAJE, ANAMNESIS];

/** Estados de un objetivo del plan de trabajo. */
export const ESTADOS_OBJETIVO = ["En proceso inicial", "Muestra mejora", "Logrado"] as const;
export type EstadoObjetivo = (typeof ESTADOS_OBJETIVO)[number];
