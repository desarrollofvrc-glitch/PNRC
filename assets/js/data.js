/* ============================================================================
   PNRC · Capa de datos del prototipo (contenido de demostración)
   Todo lo que consume la portada y los formularios vive aquí.
   Al integrar con FastAPI este archivo se reemplaza por llamadas a la API
   (ver docs/TRASPASO-FastAPI-React.md).
   ========================================================================== */

/* ---------------------------------------------------------------------------
   División territorial (muestra representativa para el prototipo).
   Formato: "Estado": "Municipio|Municipio|..."
   NOTA para producción: reemplazar por el dataset oficial INE completo
   (23 estados + Distrito Capital, 335 municipios, 1.136 parroquias).
   -------------------------------------------------------------------------- */
export const ESTADOS = {
  "Amazonas": "Atures|Atabapo|Alto Orinoco|Autana|Manapiare|Maroa|Río Negro",
  "Anzoátegui": "Simón Bolívar|Sotillo|Anaco|Bolívar|Bruzual|Carvajal|Freites|Guanipa|Guanta|Independencia|Libertad|Miranda|Monagas|Peñalver|Píritu|San Juan de Capistrano|Santa Ana|Aragua|Cajigal|McGregor|Urbaneja",
  "Apure": "San Fernando|Achaguas|Biruaca|Muñoz|Páez|Pedro Camejo|Rómulo Gallegos",
  "Aragua": "Girardot|Santiago Mariño|José Félix Ribas|Libertador|Mario Briceño Iragorry|Zamora|Aguasay|Bolívar|Camatagua|Francisco Linares Alcántara|José Ángel Lamas|José Rafael Revenga|Ocumare de la Costa de Oro|San Casimiro|San Sebastián|Santos Michelena|Sucre|Tovar|Urdaneta",
  "Barinas": "Barinas|Bolívar|Cruz Paredes|Ezequiel Zamora|Obispos|Pedraza|Rojas|Sosa|Andrés Eloy Blanco|Alberto Arvelo Torrealba|Antonio José de Sucre|Arismendi",
  "Bolívar": "Heres|Angostura|Caroní|Cedeño|El Callao|Gran Sabana|Piar|Roscio|Sifontes|Sucre|Padre Pedro Chien",
  "Carabobo": "Valencia|Naguanagua|San Diego|Guacara|Puerto Cabello|Montalbán|Bejuma|Carlos Arvelo|Diego Ibarra|Juan José Mora|Libertador|Miranda|Los Guayos|San Joaquín",
  "Cojedes": "Ezequiel Zamora|Anzoátegui|Falcón|Girardot|Lima Blanco|Ricaurte|Rómulo Gallegos|Tinaco|Tinaquillo|El Pao de San Juan Bautista",
  "Delta Amacuro": "Tucupita|Antonio Díaz|Casacoima|Pedernales",
  "Distrito Capital": "Libertador",
  "Falcón": "Miranda|Colina|Falcón|Acosta|Bolívar|Buchivacoa|Cacique Manaure|Carirubana|Dabajuro|Democracia|Federación|Jacura|Los Taques|Mauroa|Monseñor Iturriza|Palmasola|Petit|Píritu|San Francisco|Silva|Sucre|Tocópero|Unión|Urumaco|Zamora",
  "Guárico": "Juan Germán Roscio|Miranda|Zaraza|Chaguaramas|El Socorro|Francisco de Miranda|José Félix Ribas|José Tadeo Monagas|Julián Mellado|Las Mercedes|Leonardo Infante|Ortiz|Pedro Zaraza|San Gerónimo de Guayabal|San José de Guaribe|Santa María de Ipire|Camaguán|Esteros de Camaguán",
  "Lara": "Iribarren|Palavecino|Torres|Urdaneta|Crespo|Jiménez|Morán|Andrés Eloy Blanco|Simón Planas",
  "Mérida": "Libertador|Alberto Adriani|Campo Elías|Santos Marquina|Sucre|Tovar|Andrés Bello|Antonio Pinto Salinas|Aricagua|Arzobispo Chacón|Caracciolo Parra Olmedo|Cardenal Quintero|Guaraque|Julio César Salas|Justo Briceño|Miranda|Obispo Ramos de Lora|Padre Noguera|Pueblo Llano|Rangel|Rivas Dávila|Tulio Febres Cordero|Zea",
  "Miranda": "Sucre|Baruta|Chacao|El Hatillo|Plaza|Guaicaipuro|Los Salias|Carrizal|Cristóbal Rojas|Independencia|Lander|Páez|Paz Castillo|Simón Bolívar|Urdaneta|Acevedo|Andrés Bello|Bolívar|Brión|Buroz|Pedro Gual",
  "Monagas": "Maturín|Acosta|Aguasay|Bolívar|Caripe|Cedeño|Ezequiel Zamora|Libertador|Piar|Punceres|Santa Bárbara|Sotillo|Uracoa",
  "Nueva Esparta": "Arismendi|Antolín del Campo|Díaz|García|Gómez|Maneiro|Marcano|Mariño|Península de Macanao|Tubores|Villalba",
  "Portuguesa": "Guanare|Acarigua-Páez|Araure|Agua Blanca|Esteller|Guanarito|Monseñor José Vicente de Unda|Ospino|Papelón|San Genaro de Boconoíto|San Rafael de Onoto|Santa Rosalía|Sucre|Turén",
  "Sucre": "Sucre|Andrés Eloy Blanco|Andrés Mata|Arismendi|Benítez|Bermúdez|Bolívar|Cajigal|Cruz Salmerón Acosta|Libertador|Mariño|Mejía|Montes|Ribero|Valdez",
  "Táchira": "San Cristóbal|Cárdenas|Ayacucho|Bolívar|Capacho Nuevo|Capacho Viejo|Córdoba|Fernández Feo|Francisco de Miranda|García de Hevia|Guásimos|Independencia|Jáuregui|José María Vargas|Junín|Libertad|Lobatera|Michelena|Panamericano|Pedraza|Pimpinela|Rafael Urdaneta|Samuel Darío Maldonado|San Judas Tadeo|Seboruco|Simón Rodríguez|Sucre|Uribante|Antonio Rómulo Costa",
  "Trujillo": "Trujillo|Valera|Boconó|Carache|Candelaria|Carvajal|Escuque|Juan Vicente Campo Elías|La Ceiba|Miranda|Monte Carmelo|Motatán|Pampán|Pampanito|Rafael Rangel|San Rafael de Carvajal|Sucre|Urdaneta|Andrés Bello|Bolívar|José Felipe Márquez Cañizales",
  "Vargas": "Vargas",
  "Yaracuy": "San Felipe|Independencia|Cocorote|Peña|Bruzual|Bolívar|Crespo|La Trinidad|Manuel Monge|Nirgua|Páez|Sucre|Urachiche|Veroes|Arístides Bastidas|José Antonio Páez",
  "Zulia": "Maracaibo|San Francisco|Cabimas|Lagunillas|Machiques de Perijá|Colón|Rosario de Perijá|Santa Rita|Miranda|Guajira|Jesús Enrique Lossada|Jesús María Semprún|La Cañada de Urdaneta|Mara|Almirante Padilla|Baralt|Sucre|Valmore Rodríguez|Simón Bolívar|Páez|Urdaneta|Catatumbo|Francisco Javier Pulgar"
};

export const PARROQUIAS_MUESTRA = {
  "Maracaibo": ["Bolívar", "Chiquinquirá", "Coquivacoa", "Juana de Ávila", "Olegario Villalobos", "Raúl Leoni", "Santa Lucía", "Venancio Pulgar", "Idelfonso Vásquez", "Antonio Herrera Toro", "Cacique Mara", "Caracciolo Parra Pérez", "Cecilio Acosta", "Cristo de Aranza", "Francisco Eugenio Bustamante", "Luis Hurtado Higuera", "Manuel Dagnino", "San Isidro"],
  "Libertador": ["Altagracia", "Antímano", "Caricuao", "Catedral", "Coche", "El Junquito", "El Paraíso", "El Recreo", "El Valle", "La Candelaria", "La Pastora", "La Vega", "Macarao", "Maiquetía", "Petare", "San Agustín", "San Bernardino", "San José", "San Juan", "San Pedro", "Santa Rosalía", "Sucre", "23 de Enero"],
  "Baruta": ["Baruta", "El Cafetal", "Las Minas de Baruta", "Nuestra Señora del Rosario"],
  "Iribarren": ["Catedral", "Concepción", "El Cují", "Juan de Villegas", "Santa Rosa", "Tamaca", "Unión", "Aguedo Felipe Alvarado", "Buena Vista", "Juárez", "Guerrera Ana Soto"],
  "Valencia": ["Catedral", "El Socorro", "Miguel Peña", "Rafael Urdaneta", "San José", "San Blas", "Santa Rosa", "Negro Primero", "Candelaria", "Carabobo", "San Miguel"],
  "Girardot": ["Las Delicias", "Madre María de San José", "Joacquín Crespo", "José Casanova Godoy", "Andrés Eloy Blanco", "Los Tacariguas", "Pedro José Ovalles", "Choroní"],
  "Maturín": ["San Simón", "Alto de Los Godos", "Las Cocuizas", "Los Godos", "Santa Cruz", "Boquerón", "San Vicente", "El Corozo", "La Pica", "Santa Inés"],
  "San Cristóbal": ["San Juan Bautista", "La Concordia", "Pedro María Morantes", "San Sebastián", "Francisco Romero Lobo", "Pueblo Nuevo"],
  "Barinas": ["Barinas", "Alto Barinas", "El Carmen", "Rómulo Betancourt", "Corazón de Jesús", "Ramón Ignacio Méndez", "Juan Antonio Rodríguez Domínguez", "Manuel Palacio Fajardo", "Santa Lucía"]
};

/* ---------------------------------------------------------------------------
   Moneda oficial del prototipo: bolívar (VES)
   --------------------------------------------------------------------------
   Todos los importes del prototipo se llevan en bolívares. `TASA_REFERENCIAL`
   documenta el supuesto usado SOLO para convertir los importes de referencia
   que estaban expresados en divisas; en producción el monto debe congelarse
   en bolívares al momento de publicar la actividad y, si la FVRC decide
   expresarlo en divisas, actualizarse con la tasa oficial del BCV del día.
   ------------------------------------------------------------------------ */
export const MONEDA = {
  codigo: "VES",
  codigoIso: "VES",
  nombre: "Bolívar",
  simbolo: "Bs.",
  /** true mientras el importe se muestre en unidades enteras (no céntimos). */
  unidadesEnteras: true
};

/** Bs por USD usados para trasladar los importes de demostración a bolívares. */
export const TASA_REFERENCIAL = 300;

export const NACIONALIDADES = ["Venezolano", "Extranjero"];

export const SEXOS = [
  { value: "M", label: "Masculino" },
  { value: "F", label: "Femenino" }
];

export const PARENTESCOS = ["Madre", "Padre", "Tutor", "Otro"];

export const NIVELES_EDUCATIVOS = [
  "No estudia", "Preescolar N1", "Preescolar N2",
  "1er Grado Primaria", "2do Grado Primaria", "3er Grado Primaria",
  "4to Grado Primaria", "5to Grado Primaria", "6to Grado Primaria",
  "1er año liceo", "2do año liceo", "3er año liceo", "4to año liceo", "5to año liceo",
  "Universitario", "Graduado o estudiante", "Carrera/Profesión", "Otros"
];

/* ---------------------------------------------------------------------------
   Catálogos del registro de Persona Jurídica
   -------------------------------------------------------------------------- */
export const NIVELES_ESCOLARES = [
  "Educación Inicial (Maternal / Preescolar)",
  "Educación Primaria (1.º a 6.º Grado)",
  "Educación Media General (1.º a 5.º Año)",
  "Educación Media Técnica (1.º a 6.º Año)"
];

export const TIPOS_RIF = [
  { value: "J", label: "J — Jurídico (empresas, sociedades, fundaciones y asociaciones)" },
  { value: "G", label: "G — Gubernamental (entes, ministerios y organismos del Estado)" }
];

export const TIPOS_ORGANIZACION = ["Empresa", "Fundación"];

export const DEPENDENCIAS_GOBIERNO = [
  "Ministerio del Poder Popular para la Educación",
  "Ministerio del Poder Popular para Ciencia y Tecnología",
  "Ministerio del Poder Popular para la Juventud y el Deporte",
  "Gobernación",
  "Alcaldía",
  "Otra dependencia (especificar)"
];

/** Cargos admitidos para el responsable institucional (documento fuente §6.1 y §6.2). */
export const CARGOS_RESPONSABLE = [
  "Rector(a)",
  "Director(a) general",
  "Decano(a)",
  "Director(a) de escuela",
  "Coordinador(a) docente",
  "Coordinador(a) de extensión universitaria",
  "Representante legal",
  "Responsable del espacio",
  "Otro cargo (especificar)"
];

/* ---------------------------------------------------------------------------
   Universidades precargadas (el admin FVRC puede ampliar el catálogo).
   La relación universidad → facultad es la que controla la regla
   «un club oficial por facultad, escuela o decanato».
   -------------------------------------------------------------------------- */
export const UNIVERSIDADES = [
  { id: "ucv", nombre: "Universidad Central de Venezuela", siglas: "UCV",
    facultades: ["Facultad de Ingeniería", "Facultad de Ciencias", "Facultad de Humanidades y Educación", "Facultad de Arquitectura y Urbanismo"] },
  { id: "usb", nombre: "Universidad Simón Bolívar", siglas: "USB",
    facultades: ["Facultad de Ingeniería y Ciencias Aplicadas", "Facultad de Ciencias Básicas y Matemáticas", "Facultad de Estudios Generales"] },
  { id: "unexpo", nombre: "Universidad Nacional Experimental Politécnica Antonio José de Sucre", siglas: "UNEXPO",
    facultades: ["Vicerrectorado Puerto Ordaz — Ingeniería", "Vicerrectorado Barquisimeto — Ingeniería", "Vicerrectorado Caracas — Ingeniería"] },
  { id: "unefa", nombre: "Universidad Nacional Experimental Politécnica de la Fuerza Armada Nacional Bolivariana", siglas: "UNEFA",
    facultades: ["Núcleo Caracas — Ingeniería", "Núcleo Zulia — Ingeniería", "Núcleo Lara — Ingeniería"] },
  { id: "ula", nombre: "Universidad de Los Andes", siglas: "ULA",
    facultades: ["Facultad de Ingeniería", "Facultad de Ciencias", "Facultad de Medicina", "Núcleo Universitario Pedro Rincón Gutiérrez"] },
  { id: "luz", nombre: "Universidad del Zulia", siglas: "LUZ",
    facultades: ["Facultad de Ingeniería", "Facultad de Ciencias Económicas y Sociales", "Facultad Experimental de Ciencias", "Núcleo Costa Oriental del Lago"] },
  { id: "uc", nombre: "Universidad de Carabobo", siglas: "UC",
    facultades: ["Facultad de Ingeniería", "Facultad Experimental de Ciencias y Tecnología", "Facultad de Ciencias de la Educación"] },
  { id: "ucla", nombre: "Universidad Centroccidental Lisandro Alvarado", siglas: "UCLA",
    facultades: ["Decanato de Ingeniería Civil", "Decanato de Ciencias y Tecnología", "Decanato Experimental de Humanidades y Artes"] }
];

/** Valor centinela del selector de universidad cuando no está en el catálogo. */
export const UNIVERSIDAD_OTRA = "__otra";

/** Valor centinela del selector de facultad cuando debe darse de alta. */
export const FACULTAD_OTRA = "__otra";

/* RIF fijos del documento fuente (no editables por el usuario) */
export const RIF_MPPE = "G-20000009-0";
export const LETRA_RIF_INFOCENTRO = "G";
export const RIF_INFOCENTRO = "20007728-0";

/* ---------------------------------------------------------------------------
   Tipos de institución (Persona Jurídica)
   --------------------------------------------------------------------------
   Cada tipo tiene comportamiento propio (documento fuente §6, §7 y §6.5):
   cambian los campos, los recaudos obligatorios y las reglas del RIF. Para no
   dispersar esas diferencias en el HTML, cada tipo se declara aquí de forma
   declarativa y `registro.js` solo lo dibuja y lo valida:

     · selectores    → campos de catálogo que ramifican el formulario.
     · campos        → campos siempre visibles del tipo.
     · grupos        → campos, alertas y recaudos que aparecen solo cuando un
                       selector toma un valor concreto (p. ej. Naturaleza).
     · recaudos      → archivos obligatorios propios del tipo.
     · notas         → avisos de la regla de negocio (se muestran en el panel).
   -------------------------------------------------------------------------- */
export const TIPOS_INSTITUCION = [
  {
    id: "mppe",
    nombre: "Institución Educativa",
    etiqueta: "Adscrita al MPPE",
    desc: "Colegios y escuelas regidas por el Ministerio del Poder Popular para la Educación.",
    icono: "colegio",
    rifFijo: RIF_MPPE,
    campos: [
      { id: "pj-naturaleza-mppe", label: "Naturaleza", tipo: "select", obligatorio: true,
        opciones: ["Pública", "Privada"],
        ayuda: "Define el RIF aplicable y los recaudos de autorización que exige la FVRC." },
      { id: "pj-nivel-escolar", label: "Nivel escolar", tipo: "select", obligatorio: true,
        opciones: NIVELES_ESCOLARES },
      { id: "pj-razon-social", label: "Razón social", obligatorio: true, span: "col-span-2",
        maxlength: 200, placeholder: "U.E. Nacional Andrés Bello",
        ayuda: "Nombre legal de la institución tal como aparece en el RIF." },
      { id: "pj-codigo-mppe", label: "Código MPPE (DEA)", obligatorio: true,
        placeholder: "OD-01234567", ayuda: "Código de dependencia educativa." }
    ],
    grupos: [
      {
        depende: "pj-naturaleza-mppe", valor: "Pública",
        alerta: { tipo: "info", titulo: "RIF del MPPE aplicado automáticamente",
          texto: `Las instituciones educativas públicas operan con el RIF <b class="mono">${RIF_MPPE}</b>, bloqueado para edición.` },
        campos: [
          { id: "pj-rif-mppe", label: "RIF institucional", obligatorio: true,
            valor: RIF_MPPE, soloLectura: true, ayuda: "Asignado por el MPPE." }
        ],
        recaudos: [
          { id: "pj-planilla-fvrc", label: "Planilla de Autorización FVRC (Pública)", obligatorio: true,
            acepta: "application/pdf",
            ayuda: "PDF firmado y sellado por la dirección de la institución para la creación del club." },
          { id: "pj-resolucion-director", label: "Resolución de acreditación del director(a) firmante", obligatorio: true,
            acepta: "application/pdf,image/png",
            ayuda: "PDF o PNG de la resolución vigente." }
        ]
      },
      {
        depende: "pj-naturaleza-mppe", valor: "Privada",
        alerta: { tipo: "warning", titulo: "Institución educativa privada",
          texto: `El RIF del MPPE (${RIF_MPPE}) no aplica: registra el RIF propio de la institución y su archivo.` },
        campos: [
          { id: "pj-rif-propio", label: "RIF propio de la institución", obligatorio: true,
            placeholder: "J-12345678-9", ayuda: "Inicial J o G según corresponda." }
        ],
        recaudos: [
          { id: "pj-doc-rif-propio", label: "Archivo del RIF institucional", obligatorio: true,
            acepta: "image/png,image/jpeg", ayuda: "PNG o JPG del RIF propio · máximo 5 MB" },
          { id: "pj-planilla-privada", label: "Planilla de Autorización de la institución educativa (Privada)", obligatorio: true,
            acepta: "application/pdf", ayuda: "PDF emitido por la institución o entidad educativa." }
        ]
      }
    ],
    notas: [
      "Si la institución es privada, el RIF del MPPE queda solo como referencia y se habilita el RIF propio.",
      "Al crear un club oficial, la FVRC pedirá además los datos del director(a): nombres, apellidos, cédula, correo institucional, cargo y teléfono."
    ]
  },
  {
    id: "publica",
    nombre: "Institución Pública",
    etiqueta: "Entes y fundaciones del Estado",
    desc: "Fundaciones, entes gubernamentales y organismos adscritos al Estado.",
    icono: "publica",
    campos: [
      { id: "pj-razon-social", label: "Razón social", obligatorio: true, span: "col-span-2",
        maxlength: 200, placeholder: "Fundación para el Desarrollo Científico" },
      { id: "pj-tipo-rif", label: "Tipo de RIF", tipo: "select", obligatorio: true,
        opciones: TIPOS_RIF, valor: "G", ayuda: "Por defecto G (gubernamental) para instituciones públicas." },
      { id: "pj-numero-rif", label: "Número de RIF", obligatorio: true,
        placeholder: "20000009-0", ayuda: "Solo el número, sin la letra." }
    ],
    recaudos: [
      { id: "pj-doc-rif", label: "Comprobante de RIF", obligatorio: true,
        acepta: "application/pdf,image/png,image/jpeg", ayuda: "PDF, PNG o JPG · máximo 5 MB" }
    ],
    notas: [
      "El comprobante de RIF se verifica contra el registro oficial antes de aprobar la cuenta.",
      "Toda institución designa un responsable en la cuenta principal para validación de la FVRC."
    ]
  },
  {
    id: "privada",
    nombre: "Institución Privada",
    etiqueta: "Empresas y fundaciones",
    desc: "Empresas y fundaciones privadas con personalidad jurídica propia.",
    icono: "privada",
    campos: [
      { id: "pj-razon-social", label: "Razón social", obligatorio: true, span: "col-span-2",
        maxlength: 200, placeholder: "Fundación Robótica Creativa" },
      { id: "pj-tipo-rif", label: "Tipo de RIF", tipo: "select", obligatorio: true,
        opciones: TIPOS_RIF, valor: "J", ayuda: "Por defecto J (jurídico) para instituciones privadas." },
      { id: "pj-numero-rif", label: "Número de RIF", obligatorio: true,
        placeholder: "30456789-1", ayuda: "Solo el número, sin la letra." }
    ],
    recaudos: [
      { id: "pj-doc-rif", label: "Comprobante de RIF", obligatorio: true,
        acepta: "application/pdf,image/png,image/jpeg", ayuda: "PDF, PNG o JPG · máximo 5 MB" }
    ],
    notas: [
      "El comprobante de RIF se verifica contra el registro oficial antes de aprobar la cuenta."
    ]
  },
  {
    id: "universidad",
    nombre: "Universidad",
    etiqueta: "Educación superior",
    desc: "Instituciones de educación superior con facultades, escuelas o decanatos.",
    icono: "universidad",
    campos: [
      { id: "pj-universidad", label: "Universidad", tipo: "select", obligatorio: true,
        opciones: [
          ...UNIVERSIDADES.map((u) => ({ value: u.id, label: `${u.nombre} (${u.siglas})` })),
          { value: UNIVERSIDAD_OTRA, label: "Mi universidad no está en la lista" }
        ],
        ayuda: "Catálogo precargado y administrado por la FVRC. Si no aparece, se registra con los datos que suministres." },
      { id: "pj-razon-social", label: "Razón social", obligatorio: true, span: "col-span-2",
        maxlength: 200, placeholder: "Universidad Nacional Experimental…",
        ayuda: "Nombre formal u oficial de la institución." },
      { id: "pj-facultad", label: "Facultad / Escuela / Decanato / Núcleo", tipo: "select", obligatorio: true,
        opciones: [], ayuda: "Primero selecciona la universidad. Un (1) club oficial por facultad.",
        visibleSi: { campo: "pj-universidad", distintoDe: UNIVERSIDAD_OTRA } },
      { id: "pj-facultad-nueva", label: "Nombre de la facultad o decanato", obligatorio: true,
        visibleSi: [
          { campo: "pj-universidad", valor: UNIVERSIDAD_OTRA },
          { campo: "pj-facultad", valor: FACULTAD_OTRA }
        ],
        ayuda: "La FVRC da de alta el catálogo antes de aprobar. Se admite un (1) club oficial por facultad." },
      { id: "pj-tipo-rif", label: "Tipo de RIF", tipo: "select", obligatorio: true,
        opciones: TIPOS_RIF, valor: "J", ayuda: "J si la universidad es privada; G si es pública." },
      { id: "pj-numero-rif", label: "Número de RIF", obligatorio: true,
        placeholder: "12345678-9", ayuda: "Solo el número, sin la letra." }
    ],
    recaudos: [
      { id: "pj-doc-rif", label: "Comprobante de RIF", obligatorio: true,
        acepta: "application/pdf,image/png", ayuda: "PDF o PNG · máximo 5 MB" },
      { id: "pj-planilla-universitaria", label: "Planilla de Autorización del Club Universitario", obligatorio: true,
        acepta: "application/pdf,image/png",
        ayuda: "PDF o PNG firmada por el Director(a) de Escuela, Decano(a) o Coordinador(a) Docente de Extensión Universitaria." }
    ],
    notas: [
      "La relación universidad → facultad controla el límite de un club oficial por facultad, escuela o decanato.",
      "Si la universidad no existe en el catálogo, el usuario la registra y el administrador de la FVRC formaliza el alta con sus facultades."
    ]
  },
  {
    id: "infocentro",
    nombre: "Infocentro",
    etiqueta: "Fundación Infocentro",
    desc: "Centros tecnológicos comunitarios de la Fundación Infocentro.",
    icono: "infocentro",
    rifFijo: `${LETRA_RIF_INFOCENTRO}-${RIF_INFOCENTRO}`,
    campos: [
      { id: "pj-razon-social", label: "Razón social o nombre del espacio", obligatorio: true, span: "col-span-2",
        maxlength: 200, placeholder: "Infocentro Naguanagua" },
      { id: "pj-tipo-rif-infocentro", label: "Tipo de RIF", obligatorio: true,
        valor: LETRA_RIF_INFOCENTRO, soloLectura: true, ayuda: "Letra G bloqueada para Infocentro." },
      { id: "pj-numero-rif-infocentro", label: "Número de RIF", obligatorio: true,
        valor: RIF_INFOCENTRO, soloLectura: true, ayuda: "RIF institucional asignado a la Fundación Infocentro." },
      { id: "pj-codigo-infocentro", label: "Código Infocentro", obligatorio: true,
        placeholder: "INF-000123", maxlength: 20,
        ayuda: "Identificador único asignado por la Fundación Infocentro. Se valida antes de aprobar la cuenta." }
    ],
    recaudos: [
      { id: "pj-carta-designacion", label: "Carta de Designación o Aval Institucional", obligatorio: true,
        acepta: "application/pdf",
        ayuda: "PDF del oficio de designación, carta de aval o documento oficial firmado y sellado que te acredita como responsable del espacio." }
    ],
    notas: [
      "El RIF del Infocentro es único y no se solicita comprobante: la FVRC lo valida contra la Fundación Infocentro.",
      "Cada Infocentro se registra como una sede independiente del resto de la red."
    ]
  },
  {
    id: "otras",
    nombre: "Otras instituciones",
    etiqueta: "No clasificadas",
    desc: "Cualquier otra entidad no clasificada en las categorías anteriores.",
    icono: "otras",
    campos: [
      { id: "pj-razon-social", label: "Razón social", obligatorio: true, span: "col-span-2",
        maxlength: 200, placeholder: "Nombre legal de la entidad" },
      { id: "pj-tipo-rif", label: "Tipo de RIF", tipo: "select", obligatorio: true,
        opciones: TIPOS_RIF, ayuda: "J para entidades privadas; G para entes y organismos del Estado." },
      { id: "pj-numero-rif", label: "Número de RIF", obligatorio: true,
        placeholder: "12345678-9", ayuda: "Solo el número, sin la letra." },
      { id: "pj-naturaleza-otras", label: "Naturaleza", tipo: "select", obligatorio: true,
        opciones: ["Pública", "Privada"],
        ayuda: "Determina si la entidad está adscrita al Estado o si es una organización privada." }
    ],
    grupos: [
      {
        depende: "pj-naturaleza-otras", valor: "Pública",
        campos: [
          { id: "pj-dependencia", label: "Dependencia gubernamental", tipo: "select", obligatorio: true,
            opciones: DEPENDENCIAS_GOBIERNO, span: "col-span-2",
            ayuda: "Ente, ministerio u organismo al cual está adscrita la institución." },
          { id: "pj-dependencia-otra", label: "Nombre de la dependencia", obligatorio: true, span: "col-span-2",
            visibleSi: { campo: "pj-dependencia", valor: "Otra dependencia (especificar)" } }
        ]
      },
      {
        depende: "pj-naturaleza-otras", valor: "Privada",
        campos: [
          { id: "pj-tipo-organizacion", label: "Tipo de organización", tipo: "select", obligatorio: true,
            opciones: TIPOS_ORGANIZACION, span: "col-span-2",
            ayuda: "Especifica si la entidad privada es una empresa o una fundación." }
        ]
      }
    ],
    recaudos: [
      { id: "pj-doc-rif", label: "Comprobante de RIF", obligatorio: true,
        acepta: "application/pdf,image/png,image/jpeg", ayuda: "PDF, PNG o JPG · máximo 5 MB" },
      { id: "pj-doc-legal", label: "Acta constitutiva o documento legal", obligatorio: false,
        acepta: "application/pdf,image/png,image/jpeg",
        ayuda: "Opcional: acta constitutiva, estatutos o resolución de creación." }
    ],
    notas: [
      "Los recaudos adicionales se verifican según la naturaleza declarada (pública o privada)."
    ]
  }
];

/**
 * Resuelve los campos, alertas y recaudos visibles de un tipo de institución
 * a partir de los valores ya elegidos en sus selectores.
 * Es una función pura: sirve igual para dibujar el formulario y para validarlo.
 */
/** Normaliza `visibleSi` a una lista de condiciones (se combinan con OR). */
function condicionesDe(campo) {
  const cond = campo.visibleSi;
  if (!cond) return [];
  return Array.isArray(cond) ? cond : [cond];
}

function cumpleCondicion(cond, valores) {
  const actual = valores[cond.campo];
  if ("valor" in cond) return actual === cond.valor;
  if ("distintoDe" in cond) return actual !== cond.distintoDe;
  if ("algunoDe" in cond) return cond.algunoDe.includes(actual);
  return true;
}

/** ¿El campo debe verse con los valores ya elegidos en el formulario? */
export function esVisible(campo, valores = {}) {
  const condiciones = condicionesDe(campo);
  return condiciones.length === 0 || condiciones.some((c) => cumpleCondicion(c, valores));
}

export function especificacionInstitucion(tipoId, valores = {}) {
  const tipo = TIPOS_INSTITUCION.find((t) => t.id === tipoId);
  if (!tipo) return null;

  const grupos = tipo.grupos || [];
  const gruposActivos = grupos.filter((g) => valores[g.depende] === g.valor);
  const campos = [...(tipo.campos || []), ...gruposActivos.flatMap((g) => g.campos || [])];

  /* Campos cuyo cambio obliga a repintar el bloque: los que ramifican y los
     que gobiernan la visibilidad de otro campo. */
  const ramificadores = [...new Set([
    ...grupos.map((g) => g.depende),
    ...campos.flatMap((c) => condicionesDe(c).map((cond) => cond.campo))
  ])];

  return {
    tipo,
    campos,
    ramificadores,
    visibles: campos.filter((c) => esVisible(c, valores)),
    alertas: gruposActivos.flatMap((g) => (g.alerta ? [g.alerta] : [])),
    /* Todo recaudo es un archivo: se marca aquí para que la vista no tenga que
       repetir `tipoArchivo` en cada declaración. */
    recaudos: [...(tipo.recaudos || []), ...gruposActivos.flatMap((g) => g.recaudos || [])]
      .map((r) => ({ ...r, tipoArchivo: true })),
    notas: tipo.notas || []
  };
}

/* ---------------------------------------------------------------------------
   Regla de unicidad de sede: (RIF + estado + municipio + parroquia).
   Se usa una muestra para mostrar la validación en el prototipo.
   -------------------------------------------------------------------------- */
export const SEDES_REGISTRADAS = [
  { rif: "G-20000009-0", estado: "Zulia", municipio: "Maracaibo", parroquia: "Bolívar",
    institucion: "U.E. Nacional Andrés Bello · sede Maracaibo" },
  { rif: "J-30456789-1", estado: "Lara", municipio: "Iribarren", parroquia: "Catedral",
    institucion: "Colegio La Salle Barquisimeto" },
  { rif: "G-20007728-0", estado: "Carabobo", municipio: "Naguanagua", parroquia: "Naguanagua",
    institucion: "Infocentro Naguanagua" }
];

/** Devuelve la sede ya registrada que colisiona, o null si la combinación es única. */
export function sedeDuplicada({ rif, estado, municipio, parroquia }) {
  const norm = (v) => String(v || "").trim().toLowerCase();
  return SEDES_REGISTRADAS.find((s) =>
    norm(s.rif) === norm(rif) &&
    norm(s.estado) === norm(estado) &&
    norm(s.municipio) === norm(municipio) &&
    norm(s.parroquia) === norm(parroquia)) || null;
}

/* ---------------------------------------------------------------------------
   Actividades para la portada
   -------------------------------------------------------------------------- */
export const ACTIVIDADES = [
  {
    id: "onrc-2026",
    titulo: "Olimpiada Nacional de Robótica Creativa 2026",
    tipo: "Olimpiada",
    modalidad: "Presencial",
    formato: "Individual y equipos",
    categoria: "Competencia oficial · Federados",
    lugar: "Caracas, Distrito Capital",
    sede: "Polideportivo José María Vargas",
    fechaInicio: "2026-11-14",
    fechaFin: "2026-11-16",
    cupos: 600, inscritos: 487,
    precioBs: 0,
    notaPrecio: "Inscripción gratuita",
    organiza: "FVRC · Coordinación Nacional",
    descripcion: "La cita más importante del año: 3 días de competencia por categorías, exhibición tecnológica y premiación nacional.",
    arte: "olimpiada",
    destacado: true,
    cierra: "2026-10-30",
    requisitos: "Federado con club oficial · Equipos de 2 a 4 integrantes · Perfil completo"
  },
  {
    id: "python-iot",
    titulo: "Curso: Programación en Python aplicada a IoT",
    tipo: "Curso",
    modalidad: "Virtual",
    formato: "Individual",
    categoria: "Académico · Abierto",
    lugar: "Videoconferencia (Zoom)",
    sede: "Modalidad virtual sincrónica",
    fechaInicio: "2026-10-20",
    fechaFin: "2026-12-05",
    cupos: 120, inscritos: 96,
    precioBs: 15 * TASA_REFERENCIAL,
    notaPrecio: "4 cuotas",
    precioAnteriorBs: 25 * TASA_REFERENCIAL,
    organiza: "FVRC · Academia Nacional",
    descripcion: "8 semanas para dominar Python, sensores y microcontroladores con proyectos evaluados y certificado avalado por la FVRC.",
    arte: "programacion",
    destacado: true,
    cierra: "2026-10-18",
    requisitos: "Mayor de 14 años · Computadora con internet · Sin club requerido"
  },
  {
    id: "taller-lego",
    titulo: "Taller de Robótica Educativa con LEGO Mindstorms",
    tipo: "Taller",
    modalidad: "Presencial",
    formato: "Equipos",
    categoria: "Docentes y tutores",
    lugar: "Barquisimeto, Lara",
    sede: "Universidad Centroccidental Lisandro Alvarado",
    fechaInicio: "2026-10-25",
    fechaFin: "2026-10-26",
    cupos: 40, inscritos: 38,
    precioBs: 8 * TASA_REFERENCIAL,
    notaPrecio: "incluye kit de práctica",
    organiza: "FVRC Lara · Club Robolara",
    descripcion: "Formación intensiva para docentes: montaje, programación por bloques y evaluación por competencias en el aula.",
    arte: "taller",
    destacado: true,
    cierra: "2026-10-23",
    requisitos: "Docente o tutor activo · Cupo máximo 40"
  },
  {
    id: "ia-congreso",
    titulo: "Congreso Nacional de Inteligencia Artificial y Educación",
    tipo: "Congreso",
    modalidad: "Mixta",
    formato: "Individual",
    categoria: "Académico · Abierto",
    lugar: "Maracaibo, Zulia",
    sede: "Universidad del Zulia · Auditorio",
    fechaInicio: "2026-11-05",
    fechaFin: "2026-11-06",
    cupos: 300, inscritos: 300,
    precioBs: 10 * TASA_REFERENCIAL,
    notaPrecio: "agotado",
    organiza: "FVRC Zulia",
    descripcion: "Ponencias, mesas de trabajo y talleres sobre IA generativa aplicada a la enseñanza de la robótica.",
    arte: "ia",
    destacado: false,
    cerrado: true,
    cierra: "2026-11-01",
    requisitos: "Público general · Registro previo obligatorio"
  },
  {
    id: "impresion3d",
    titulo: "Taller de Diseño e Impresión 3D para Clubes",
    tipo: "Taller",
    modalidad: "Presencial",
    formato: "Equipos",
    categoria: "Competencia oficial · Federados",
    lugar: "Valencia, Carabobo",
    sede: "Infocentro Naguanagua",
    fechaInicio: "2026-11-21",
    fechaFin: "2026-11-22",
    cupos: 36, inscritos: 21,
    precioBs: 12 * TASA_REFERENCIAL,
    notaPrecio: "cupos limitados",
    organiza: "FVRC Carabobo · Club Cibernética UC",
    descripcion: "Del modelado CAD a la pieza impresa: fabricación de chasis y refacciones para equipos de competencia.",
    arte: "impresion3d",
    destacado: false,
    cierra: "2026-11-18",
    requisitos: "Tutor con club oficial · Traer laptop"
  },
  {
    id: "feria-andina",
    titulo: "Feria de Robótica Creativa Región Andina",
    tipo: "Feria",
    modalidad: "Presencial",
    formato: "Individual y equipos",
    categoria: "Académico · Abierto",
    lugar: "Mérida, Mérida",
    sede: "Núcleo Universitario La Hechicera",
    fechaInicio: "2026-12-04",
    fechaFin: "2026-12-05",
    cupos: 250, inscritos: 143,
    precioBs: 0,
    notaPrecio: "Entrada libre",
    organiza: "FVRC Mérida",
    descripcion: "Exhibición abierta al público con demostraciones, retos por edades y premiación regional andina.",
    arte: "feria",
    destacado: false,
    cierra: "2026-12-01",
    requisitos: "Abierto a aspirantes a federado y público general"
  },
  {
    id: "curso-docentes",
    titulo: "Curso: Didáctica de la Robótica para Docentes de Primaria",
    tipo: "Curso",
    modalidad: "Virtual",
    formato: "Individual",
    categoria: "Docentes y tutores",
    lugar: "Campus virtual FVRC",
    sede: "Modalidad asincrónica con tutorías",
    fechaInicio: "2026-10-28",
    fechaFin: "2026-12-19",
    cupos: 200, inscritos: 88,
    precioBs: 0,
    notaPrecio: "Financiado por la FVRC",
    organiza: "FVRC · Academia Nacional",
    descripcion: "Programa gratuito para docentes del sector oficial: planificación por proyectos, evaluación y robótica de bajo costo.",
    arte: "docentes",
    destacado: false,
    cierra: "2026-10-26",
    requisitos: "Docente activo · Constancia de trabajo"
  },
  {
    id: "drones",
    titulo: "Demostración de Drones y Sistemas Autónomos",
    tipo: "Demostración",
    modalidad: "Presencial",
    formato: "Individual",
    categoria: "Académico · Abierto",
    lugar: "Puerto Ordaz, Bolívar",
    sede: "Parque Cachamay",
    fechaInicio: "2026-11-28",
    fechaFin: "2026-11-28",
    cupos: 500, inscritos: 212,
    precioBs: 0,
    notaPrecio: "Entrada libre",
    organiza: "FVRC Bolívar",
    descripcion: "Vuelo demostrativo, charlas de seguridad aérea y concurso de ascenso vertical para estudiantes.",
    arte: "drones",
    destacado: false,
    cierra: "2026-11-27",
    requisitos: "Público general · Menores acompañados"
  }
];

export const TIPOS_ACTIVIDAD = [
  "Olimpiada", "Competencia", "Curso", "Taller", "Congreso",
  "Conferencia", "Feria", "Demostración", "Evaluación"
];
/* Modalidades según el documento fuente (VII. Módulos de Eventos → Datos de la
   Actividad: «formato (Presencial, Virtual, Mixta)»). Se conserva el nombre
   `modalidad` en el modelo del prototipo por corresponder con la interfaz. */
export const MODALIDADES = ["Presencial", "Virtual", "Mixta"];

/* ---------------------------------------------------------------------------
   Contenido de portada: prueba social, beneficios, testimonios, FAQ
   -------------------------------------------------------------------------- */
export const HERO_STATS = [
  { valor: "1.240+", label: "Participantes registrados" },
  { valor: "18", label: "Estados con actividad" },
  { valor: "45", label: "Clubes oficiales" },
  { valor: "120", label: "Actividades al año" }
];

export const BENEFICIOS = [
  { icono: "escudo", titulo: "Respaldo federativo",
    texto: "Cada inscripción, club y resultado queda validado por la FVRC y respaldado con trazabilidad completa." },
  { icono: "certificado", titulo: "Certificados digitales",
    texto: "Recibe constancias y certificados verificables al culminar cada curso, taller o competencia." },
  { icono: "rutas", titulo: "Rutas de aprendizaje",
    texto: "Programas por edades y niveles: desde robótica inicial hasta competencia internacional." },
  { icono: "grafico", titulo: "Progreso medible",
    texto: "Indicadores de avance por participante, club e institución con reportes comparativos." },
  { icono: "bandera", titulo: "Representa a Venezuela",
    texto: "Acceso a convocatorias nacionales y a las delegaciones que compiten en el exterior." },
  { icono: "comunidad", titulo: "Comunidad nacional",
    texto: "Tutores, docentes y clubes conectados en una sola red de robótica creativa." }
];

export const AUDIENCIAS = [
  { icono: "estudiante", titulo: "Estudiantes y participantes",
    texto: "De 4 a 17 años y adultos que quieren aprender construyendo.",
    puntos: ["Cursos y talleres por nivel", "Olimpiadas y competencias", "Certificado de participación"] },
  { icono: "docente", titulo: "Docentes y tutores",
    texto: "Formación, materiales y respaldo para llevar la robótica al aula.",
    puntos: ["Formación gratuita avalada", "Guías y planificaciones", "Acompañamiento de la FVRC"] },
  { icono: "institucion", titulo: "Instituciones y clubes",
    texto: "Colegios, universidades, infocentros y clubes que quieren federarse.",
    puntos: ["Registro institucional en línea", "Gestión de clubes y equipos", "Reportes e indicadores"] }
];

export const TESTIMONIOS = [
  { nombre: "María Fernanda Rojas", cargo: "Tutora · Club Robolara, Lara",
    iniciales: "MR",
    texto: "Antes inscribíamos a los muchachos por correo y perdíamos el control de los cupos. Ahora registro al equipo, subo la planilla y en minutos queda validado." },
  { nombre: "Prof. José Gregorio Peña", cargo: "Responsable Institucional · U.E. Andrés Bello, Zulia",
    iniciales: "JP",
    texto: "La plataforma ordenó todo el papeleo de la institución. La sede de Maracaibo y la de Cabimas trabajan por separado sin duplicar registros." },
  { nombre: "Daniela Contreras", cargo: "Participante · 4.º año, Carabobo",
    iniciales: "DC",
    texto: "Conseguí el taller de impresión 3D, me inscribí sola y ya tengo mi certificado digital cargado en el perfil." }
];

export const FAQ = [
  { p: "¿Necesito pertenecer a un club para participar?",
    r: "No siempre. Los cursos, talleres, ferias y conferencias están abiertos a cualquier persona registrada, incluso si solo te interesa la parte académica (perfil de aspirante a federado). Para competencias oficiales sí se requiere pertenecer a un club oficial de la FVRC." },
  { p: "¿Cuánto tarda la verificación de mi registro?",
    r: "El equipo de la FVRC revisa cada solicitud y notifica por correo a la dirección registrada. Cuando tu cuenta sea aprobada recibirás tus credenciales y tu código RNR único. Hasta ese momento no podrás iniciar sesión." },
  { p: "¿Qué significa el código RNR?",
    r: "Es tu identificador único federativo. Se compone del año, la ubicación territorial y un código aleatorio. Solo se asigna después de que la FVRC verifica tus datos y tu vínculo con la robótica." },
  { p: "¿Puedo registrar a mi hijo o representado?",
    r: "Sí. Un particular mayor de edad, un tutor o una institución puede dar de alta a participantes. Si el participante es menor de edad, el sistema solicitará además los datos y documentos del representante legal." },
  { p: "¿Qué documentos debo tener listos?",
    r: "Para persona natural: cédula digitalizada y, al completar el perfil, foto tipo carnet y currículum. Para persona jurídica: RIF o comprobante equivalente, carta de designación o aval institucional y los datos del responsable." },
  { p: "¿Los cursos tienen costo?",
    r: "La mayoría de los cursos y talleres son gratuitos o tienen un costo solidario. Cuando una actividad tiene costo, la plataforma muestra el monto en bolívares (Bs.) y la fecha límite antes de inscribirte, sin cargos ocultos." },
  { p: "¿En qué moneda se pagan las actividades?",
    r: "En bolívares (VES). El prototipo muestra todos los importes en Bs. y el monto se congela al momento de publicar la actividad; si la FVRC define una tasa de referencia, se informa junto al monto y se actualiza según la tasa oficial del BCV." }
];

/* ---------------------------------------------------------------------------
   Utilidades de fecha y formato
   -------------------------------------------------------------------------- */
const MESES = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"];
const MESES_LARGO = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto",
  "septiembre", "octubre", "noviembre", "diciembre"];

export function parteFecha(iso) {
  const [a, m, d] = iso.split("-").map(Number);
  return { dia: d, mes: m, anio: a, mesCorto: MESES[m - 1], mesLargo: MESES_LARGO[m - 1] };
}

export function fechaCorta(iso) {
  const f = parteFecha(iso);
  return `${f.dia} ${f.mesCorto} ${f.anio}`;
}

export function rangoFechas(inicio, fin) {
  const a = parteFecha(inicio), b = parteFecha(fin);
  if (inicio === fin) return `${a.dia} de ${a.mesLargo} de ${a.anio}`;
  if (a.mes === b.mes && a.anio === b.anio) return `${a.dia} al ${b.dia} de ${a.mesLargo} de ${a.anio}`;
  return `${a.dia} ${a.mesCorto} – ${b.dia} ${b.mesCorto} ${b.anio}`;
}

/* ---------------------------------------------------------------------------
   Formato de importes en bolívares (VES)
   --------------------------------------------------------------------------
   Convención venezolana: punto para los miles, coma para los decimales y el
   símbolo «Bs.» delante del monto. La interfaz nunca escribe un importe a
   mano: todo pasa por `formatearBs` / `textoPrecio`, de modo que un cambio de
   tarifa o de moneda se resuelve en un solo lugar.
   ------------------------------------------------------------------------ */
export function formatearBs(valor, { decimales = 2 } = {}) {
  const n = Number(valor);
  if (!Number.isFinite(n)) return `${MONEDA.simbolo} 0,00`;
  const fijo = Math.abs(n).toFixed(decimales);
  const [entera, decimal] = fijo.split(".");
  const miles = entera.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  const signo = n < 0 ? "-" : "";
  return decimales > 0
    ? `${signo}${MONEDA.simbolo} ${miles},${decimal}`
    : `${signo}${MONEDA.simbolo} ${miles}`;
}

export function moneda(valor) {
  if (!valor) return "Gratis";
  return formatearBs(valor);
}

/** Importe de una actividad (0 = sin costo) sin la nota adicional. */
export function montoPrecio(a) {
  if (!a || !a.precioBs) return a?.notaPrecio || "Gratis";
  return formatearBs(a.precioBs);
}

/** Importe con su nota: «Bs. 4.500,00 · 4 cuotas». */
export function textoPrecio(a) {
  const monto = montoPrecio(a);
  if (!a || !a.precioBs || !a.notaPrecio) return monto;
  return `${monto} · ${a.notaPrecio}`;
}

/** Precio anterior tachado (solo cuando hay descuento real). */
export function precioAnterior(a) {
  if (!a || !a.precioAnteriorBs || a.precioAnteriorBs <= a.precioBs) return "";
  return formatearBs(a.precioAnteriorBs);
}

export function mensajeExitoRegistro(nombre) {
  return `¡Listo${nombre ? ", " + nombre : ""}! Tu cuenta fue creada y está en proceso de verificación.`;
}


/* ===========================================================================
   DATOS DE DEMOSTRACIÓN — Sesión y usuarios simulados
   En producción estos datos los entrega la API (FastAPI + JWT).
   =========================================================================== */

/* ---------------------------------------------------------------------------
   Usuarios de demostración disponibles en el login simulado
   -------------------------------------------------------------------------- */
export const USUARIOS_DEMO = [
  {
    id: "u001",
    correo: "carlos.mendoza@email.com",
    rnr: "RNR26-010000-A3B7C2",
    password: "Demo1234!",
    nombres: "Carlos Andrés",
    apellidos: "Mendoza Rivero",
    rol: "Persona Natural",
    estadoPerfil: "PERFIL_COMPLETO",
    estado: "Miranda",
    municipio: "Baruta",
    cedula: "V-14328971",
    telefono: "0414-1234567",
    club: {
      id: "club-001",
      nombre: "Club RoboMiranda",
      tipo: "OFICIAL",
      codigo: "CLUB-FVRC26-RM001",
      participantes: 8,
      equipos: 2
    },
    inscripciones: ["onrc-2026", "python-iot"],
    participantes: 8,
    notificaciones: 3
  },
  {
    id: "u002",
    correo: "lucia.torres@uc.edu.ve",
    rnr: "RNR26-080000-X9Y2Z5",
    password: "Demo1234!",
    nombres: "Lucía Beatriz",
    apellidos: "Torres Guzmán",
    rol: "Responsable Institucional",
    estadoPerfil: "APROBADO_INICIAL",
    estado: "Carabobo",
    municipio: "Valencia",
    cedula: "V-18765432",
    telefono: "0412-9876543",
    club: {
      id: "club-002",
      nombre: "Club Institucional - UC Ingeniería",
      tipo: "POR_DEFECTO",
      codigo: null,
      participantes: 3,
      equipos: 0
    },
    inscripciones: ["taller-lego"],
    participantes: 3,
    notificaciones: 1
  },
  {
    id: "u003",
    correo: "admin@fvrc.org.ve",
    rnr: "RNR26-010000-ADMIN1",
    password: "Admin1234!",
    nombres: "Administrador",
    apellidos: "Central FVRC",
    rol: "Administrador Central",
    estadoPerfil: "PERFIL_COMPLETO",
    estado: "Distrito Capital",
    municipio: "Libertador",
    cedula: "V-10000001",
    telefono: "0212-5550001",
    club: null,
    inscripciones: [],
    participantes: 0,
    notificaciones: 12
  }
];

/* ---------------------------------------------------------------------------
   Sesión activa simulada (persiste en sessionStorage en el prototipo)
   -------------------------------------------------------------------------- */
export function obtenerSesion() {
  try {
    const raw = sessionStorage.getItem("pnrc-sesion");
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function guardarSesion(usuario) {
  sessionStorage.setItem("pnrc-sesion", JSON.stringify(usuario));
}

export function cerrarSesion() {
  sessionStorage.removeItem("pnrc-sesion");
}

export function usuarioPorCredenciales(correoOrnr, password) {
  const id = correoOrnr.trim().toLowerCase();
  return USUARIOS_DEMO.find((u) =>
    (u.correo.toLowerCase() === id || u.rnr.toLowerCase() === id) &&
    u.password === password
  ) || null;
}

/* ---------------------------------------------------------------------------
   Participantes de demostración (vinculados al club del usuario u001)
   -------------------------------------------------------------------------- */
export const PARTICIPANTES_DEMO = [
  {
    id: "p001", clubId: "club-001", userId: "u001",
    nombres: "Diego Alejandro", apellidos: "Mendoza Torres",
    cedula: "V-28001001", edad: 15, sexo: "M",
    nivel: "4to año liceo", estado: "ACTIVO",
    equipo: "Equipo Fénix", fechaRegistro: "2026-03-10"
  },
  {
    id: "p002", clubId: "club-001", userId: "u001",
    nombres: "María Fernanda", apellidos: "Rojas Castillo",
    cedula: "V-28001002", edad: 16, sexo: "F",
    nivel: "5to año liceo", estado: "ACTIVO",
    equipo: "Equipo Fénix", fechaRegistro: "2026-03-10"
  },
  {
    id: "p003", clubId: "club-001", userId: "u001",
    nombres: "Andrés Felipe", apellidos: "Gómez Pérez",
    cedula: "V-28001003", edad: 14, sexo: "M",
    nivel: "3er año liceo", estado: "ACTIVO",
    equipo: "Equipo Vortex", fechaRegistro: "2026-04-02"
  },
  {
    id: "p004", clubId: "club-001", userId: "u001",
    nombres: "Valentina", apellidos: "Núñez Salazar",
    cedula: "V-28001004", edad: 15, sexo: "F",
    nivel: "4to año liceo", estado: "ACTIVO",
    equipo: "Equipo Vortex", fechaRegistro: "2026-04-02"
  },
  {
    id: "p005", clubId: "club-001", userId: "u001",
    nombres: "Samuel", apellidos: "Herrera Blanco",
    cedula: "V-28001005", edad: 17, sexo: "M",
    nivel: "5to año liceo", estado: "ACTIVO",
    equipo: "Equipo Fénix", fechaRegistro: "2026-04-15"
  },
  {
    id: "p006", clubId: "club-001", userId: "u001",
    nombres: "Camila", apellidos: "Díaz Moreno",
    cedula: "V-28001006", edad: 13, sexo: "F",
    nivel: "2do año liceo", estado: "ACTIVO",
    equipo: null, fechaRegistro: "2026-05-20"
  },
  {
    id: "p007", clubId: "club-001", userId: "u001",
    nombres: "Luis Eduardo", apellidos: "Soto Ramos",
    cedula: "V-28001007", edad: 16, sexo: "M",
    nivel: "4to año liceo", estado: "ACTIVO",
    equipo: "Equipo Vortex", fechaRegistro: "2026-05-20"
  },
  {
    id: "p008", clubId: "club-001", userId: "u001",
    nombres: "Isabella", apellidos: "Vargas Ríos",
    cedula: "V-28001008", edad: 14, sexo: "F",
    nivel: "3er año liceo", estado: "ACTIVO",
    equipo: null, fechaRegistro: "2026-06-01"
  }
];

/* ---------------------------------------------------------------------------
   Inscripciones de demostración
   -------------------------------------------------------------------------- */
export const INSCRIPCIONES_DEMO = [
  {
    id: "ins-001", usuarioId: "u001", actividadId: "onrc-2026",
    estado: "CONFIRMADA", fechaInscripcion: "2026-09-05",
    modalidad: "Equipo", equipo: "Equipo Fénix",
    comprobante: "INS-ONRC2026-001"
  },
  {
    id: "ins-002", usuarioId: "u001", actividadId: "python-iot",
    estado: "CONFIRMADA", fechaInscripcion: "2026-09-12",
    modalidad: "Individual", equipo: null,
    comprobante: "INS-PYIOT-002"
  },
  {
    id: "ins-003", usuarioId: "u002", actividadId: "taller-lego",
    estado: "PENDIENTE", fechaInscripcion: "2026-09-20",
    modalidad: "Individual", equipo: null,
    comprobante: null
  }
];

/* ---------------------------------------------------------------------------
   Notificaciones de demostración
   -------------------------------------------------------------------------- */
export const NOTIFICACIONES_DEMO = [
  {
    id: "n001", usuarioId: "u001", tipo: "success", leida: false,
    titulo: "Inscripción confirmada",
    texto: "Tu equipo 'Equipo Fénix' quedó inscrito en la Olimpiada Nacional 2026.",
    fecha: "2026-09-05"
  },
  {
    id: "n002", usuarioId: "u001", tipo: "info", leida: false,
    titulo: "Cierre de inscripción próximo",
    texto: "El curso de Python para IoT cierra inscripciones el 18 de octubre.",
    fecha: "2026-10-01"
  },
  {
    id: "n003", usuarioId: "u001", tipo: "warning", leida: false,
    titulo: "Completa tu perfil",
    texto: "Carga tu foto carnet y CV para poder participar en todos los eventos.",
    fecha: "2026-08-20"
  },
  {
    id: "n004", usuarioId: "u003", tipo: "info", leida: false,
    titulo: "Nuevas solicitudes pendientes",
    texto: "Hay 5 registros nuevos esperando verificación FVRC.",
    fecha: "2026-10-06"
  }
];

/* ---------------------------------------------------------------------------
   Estadísticas del panel de administración (datos simulados)
   -------------------------------------------------------------------------- */
export const STATS_ADMIN = {
  totalUsuarios: 1247,
  usuariosNuevos: 38,
  clubesOficiales: 45,
  clubesPendientes: 7,
  actividadesActivas: 8,
  inscripcionesHoy: 23,
  solicitudesVerificacion: 12,
  participantesActivos: 3891,
  estadosConActividad: 18
};
