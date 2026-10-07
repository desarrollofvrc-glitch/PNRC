/* ============================================================================
   PNRC · Módulo de registro
   Hub de naturaleza → Persona Natural → Persona Jurídica (wizard por tipo)
   ========================================================================== */

import { icono } from "../icons.js";
import {
  $, $$, esc, attr, activarShell, cabecera, piePagina, notificar, abrirModal, cerrarModal,
  validarCedula, validarEmail, validarTelefono, validarTexto, calcularEdad, hoyISO,
  fechaLimiteMenor, evaluarPassword, ETIQUETA_NIVEL, limpiarAlSalir, rutaActual
} from "../app.js";
import {
  ESTADOS, PARROQUIAS_MUESTRA, NACIONALIDADES, SEXOS, TIPOS_INSTITUCION,
  RIF_MPPE, RIF_INFOCENTRO, LETRA_RIF_INFOCENTRO, CARGOS_RESPONSABLE,
  UNIVERSIDADES, FACULTAD_OTRA, especificacionInstitucion, sedeDuplicada
} from "../data.js";

/* =========================================================================
   1. Estado persistente del asistente (localStorage)
   -------------------------------------------------------------------------
   IMPORTANTE (privacidad): el borrador guarda ÚNICAMENTE los campos
   necesarios para repoblar el formulario. Nunca se persisten en el navegador
   la fecha de nacimiento, la dirección, las contraseñas ni los archivos
   adjuntos. En la implementación real (FastAPI) el borrador debe vivir en el
   servidor asociado a la sesión autenticada, no en el cliente.
   ======================================================================= */
const CLAVE_ESTADO = "pnrc-registro-pn";

/** Lista blanca de campos que pueden guardarse en el borrador local. */
const CAMPOS_PERSISTIBLES = [
  "nacionalidad", "cedula", "nombres", "apellidos",
  "sexo", "correo", "telefono", "estado", "municipio", "parroquia"
];

function leerEstado() {
  try { return JSON.parse(localStorage.getItem(CLAVE_ESTADO)) || {}; }
  catch { return {}; }
}

function guardarEstado(datos) {
  const filtrado = {};
  for (const clave of CAMPOS_PERSISTIBLES) {
    if (datos[clave]) filtrado[clave] = datos[clave];
  }
  try { localStorage.setItem(CLAVE_ESTADO, JSON.stringify(filtrado)); }
  catch { /* almacenamiento no disponible o lleno: el borrador es opcional */ }
}

function limpiarEstado() {
  try { localStorage.removeItem(CLAVE_ESTADO); } catch { /* noop */ }
}

/* =========================================================================
   2. Piezas de formulario reutilizables
   ======================================================================= */
function campo({ id, label, tipo = "text", obligatorio = true, ayuda = "", placeholder = "",
                opciones = [], valor = "", extra = "", soloLectura = false, span = "", min, max,
                autocomplete = "off", maxlength }) {
  const req = soloLectura
    ? `<span class="field__opt">automático</span>`
    : obligatorio
      ? `<span class="field__req" aria-hidden="true">*</span><span class="sr-only">obligatorio</span>`
      : `<span class="field__opt">opcional</span>`;

  let control;
  if (tipo === "select") {
    control = `<select class="select" id="${id}" name="${id}" ${obligatorio ? "required" : ""} ${soloLectura ? "disabled" : ""}>
      <option value="">Selecciona una opción…</option>
      ${opciones.map((o) => {
        const v = typeof o === "string" ? o : o.value;
        const t = typeof o === "string" ? o : o.label;
        return `<option value="${attr(v)}" ${valor === v ? "selected" : ""}>${esc(t)}</option>`;
      }).join("")}
    </select>`;
  } else if (tipo === "textarea") {
    control = `<textarea class="textarea" id="${id}" name="${id}" placeholder="${attr(placeholder)}"
      ${obligatorio ? "required" : ""} ${maxlength ? `maxlength="${maxlength}"` : ""}>${esc(valor)}</textarea>`;
  } else {
    control = `<input class="input" id="${id}" name="${id}" type="${tipo}" value="${attr(valor)}"
      placeholder="${attr(placeholder)}" autocomplete="${attr(autocomplete)}"
      ${min !== undefined ? `min="${attr(min)}"` : ""} ${max !== undefined ? `max="${attr(max)}"` : ""}
      ${maxlength ? `maxlength="${maxlength}"` : ""} ${soloLectura ? 'readonly aria-readonly="true"' : ""}
      ${obligatorio ? "required" : ""} ${extra}>`;
  }

  return `
  <div class="field ${span} ${soloLectura ? "is-readonly" : ""}" data-campo="${id}">
    <label class="field__label" for="${id}">${esc(label)} ${req}</label>
    ${control}
    ${soloLectura ? `<span class="field__hint">${icono("lock")} Valor asignado por el sistema, no editable.</span>` : ""}
    ${ayuda ? `<span class="field__hint">${ayuda}</span>` : ""}
    <span class="field__error" id="err-${id}" role="alert">
      ${icono("alertCircle")}<span data-mensaje></span>
    </span>
  </div>`;
}

function campoArchivo({ id, label, obligatorio = true, ayuda = "", acepta = "image/png,image/jpeg,application/pdf", span = "" }) {
  const req = obligatorio
    ? `<span class="field__req" aria-hidden="true">*</span><span class="sr-only">obligatorio</span>`
    : `<span class="field__opt">opcional</span>`;
  return `
  <div class="field ${span}" data-campo="${id}">
    <label class="field__label">${esc(label)} ${req}</label>
    <label class="file-drop" for="${id}" data-drop>
      <input type="file" id="${id}" name="${id}" accept="${attr(acepta)}" ${obligatorio ? "required" : ""}>
      <span class="file-drop__icon">${icono("upload")}</span>
      <span class="file-drop__text">
        <span class="file-drop__title" data-archivo-titulo>Arrastra el archivo o haz clic para seleccionar</span>
        <span class="file-drop__meta" data-archivo-meta>${esc(ayuda)}</span>
      </span>
    </label>
    <span class="field__error" id="err-${id}" role="alert">
      ${icono("alertCircle")}<span data-mensaje></span>
    </span>
  </div>`;
}

/* =========================================================================
   3. Motor de validación
   ======================================================================= */
function marcarError(id, mensaje) {
  const campoEl = document.querySelector(`[data-campo="${id}"]`);
  if (!campoEl) {
    /* No debería ocurrir: indica que una regla apunta a un campo que la
       plantilla no generó. Se avisa en consola para detectarlo en desarrollo. */
    console.warn(`[validación] No existe el contenedor [data-campo="${id}"]: "${mensaje}" no puede mostrarse al usuario.`);
    return;
  }
  campoEl.classList.add("has-error");
  campoEl.classList.remove("is-valid");
  const msg = campoEl.querySelector("[data-mensaje]");
  if (msg) msg.textContent = mensaje;
  const control = campoEl.querySelector(".input, .select, .textarea, .file-drop");
  control?.setAttribute("aria-invalid", "true");
}

function limpiarError(id) {
  const campoEl = document.querySelector(`[data-campo="${id}"]`);
  if (!campoEl) return;
  campoEl.classList.remove("has-error");
  campoEl.classList.add("is-valid");
  const control = campoEl.querySelector(".input, .select, .textarea, .file-drop");
  control?.removeAttribute("aria-invalid");
}

/** Control real de un campo: sirve para enfocar y desplazar la vista. */
function controlDeCampo(id) {
  const campoEl = document.querySelector(`[data-campo="${id}"]`);
  return campoEl?.querySelector(".input, .select, .textarea, input[type=file]") || document.getElementById(id);
}

export function limpiarTodosLosErrores(alcance = document) {
  $$(".field.has-error", alcance).forEach((f) => {
    f.classList.remove("has-error");
    f.querySelector(".input, .select, .textarea, .file-drop")?.removeAttribute("aria-invalid");
  });
  $$("[data-resumen-errores]", alcance).forEach((r) => r.remove());
}

/** Aplica una lista de reglas. Devuelve true si todo está correcto. */
export function validar(reglas) {
  const errores = [];
  for (const r of reglas) {
    const ok = r.test();
    if (!ok) {
      marcarError(r.id, r.mensaje);
      errores.push({ id: r.id, mensaje: r.mensaje, etiqueta: r.etiqueta || r.id });
    } else {
      limpiarError(r.id);
    }
  }
  return { ok: errores.length === 0, errores };
}

/** Muestra el resumen accesible de errores al inicio del formulario. */
export function mostrarResumenErrores(errores, contenedorSelector) {
  const contenedor = document.querySelector(contenedorSelector);
  if (!contenedor) return;
  contenedor.querySelector("[data-resumen-errores]")?.remove();
  if (!errores.length) return;
  const div = document.createElement("div");
  div.className = "error-summary";
  div.setAttribute("data-resumen-errores", "");
  div.setAttribute("role", "alert");
  div.innerHTML = `
    <div class="error-summary__head">${icono("alertCircle")}
      <span>Revisa ${errores.length} ${errores.length === 1 ? "campo" : "campos"} antes de continuar</span>
    </div>
    <ul>${errores.map((e) => `<li><a href="#${e.id}" data-ir-a="${e.id}">${esc(e.etiqueta)}: ${esc(e.mensaje)}</a></li>`).join("")}</ul>`;

  if (contenedor.tagName === "FORM" || contenedor.firstElementChild) contenedor.prepend(div);
  else contenedor.appendChild(div);

  div.querySelectorAll("[data-ir-a]").forEach((a) => a.addEventListener("click", (e) => {
    e.preventDefault();
    const control = controlDeCampo(a.dataset.irA);
    control?.focus();
    control?.scrollIntoView({ behavior: "smooth", block: "center" });
  }));
  div.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

/* =========================================================================
   4. Cascadas territoriales
   ======================================================================= */
export function opcionesEstados() {
  return Object.keys(ESTADOS).sort((a, b) => a.localeCompare(b, "es"));
}

export function municipiosDe(estado) {
  if (!estado || !ESTADOS[estado]) return [];
  return ESTADOS[estado].split("|").sort((a, b) => a.localeCompare(b, "es"));
}

export function parroquiasDe(municipio) {
  return PARROQUIAS_MUESTRA[municipio] || ["Parroquia capital", "Otra parroquia"];
}

function cablearCascada(raiz, { estado, municipio, parroquia }) {
  const selEstado = $(`#${estado}`, raiz);
  const selMunicipio = $(`#${municipio}`, raiz);
  const selParroquia = $(`#${parroquia}`, raiz);
  if (!selEstado || !selMunicipio || !selParroquia) return;

  const llenar = (sel, items, placeholder) => {
    sel.innerHTML = `<option value="">${esc(placeholder)}</option>` +
      items.map((i) => `<option value="${attr(i)}">${esc(i)}</option>`).join("");
  };

  const refrescarMunicipios = (conservar = false) => {
    const previo = conservar ? selMunicipio.value : "";
    const lista = municipiosDe(selEstado.value);
    llenar(selMunicipio, lista, lista.length ? "Selecciona el municipio…" : "Primero elige el estado");
    selMunicipio.disabled = !lista.length;
    if (previo) selMunicipio.value = previo;
    refrescarParroquias();
  };

  const refrescarParroquias = () => {
    const lista = selMunicipio.value ? parroquiasDe(selMunicipio.value) : [];
    llenar(selParroquia, lista, lista.length ? "Selecciona la parroquia…" : "Primero elige el municipio");
    selParroquia.disabled = !lista.length;
  };

  selEstado.addEventListener("change", () => refrescarMunicipios(false));
  selMunicipio.addEventListener("change", refrescarParroquias);
  refrescarMunicipios(true);
}

/* =========================================================================
   5. Medidor de contraseña enlazado a un input
   ======================================================================= */
export function conectarMedidorPassword(inputId, contenedorId, confirmacionId) {
  const input = document.getElementById(inputId);
  const caja = document.getElementById(contenedorId);
  const confirmacion = confirmacionId ? document.getElementById(confirmacionId) : null;
  if (!input || !caja) return;

  const barras = $$(".pw-meter__bar", caja);
  const etiqueta = $(".pw-meter__label", caja);

  const pintar = () => {
    const { nivel, reglas } = evaluarPassword(input.value);
    barras.forEach((b, i) => {
      b.className = "pw-meter__bar" + (i < nivel ? ` is-on-${nivel}` : "");
    });
    etiqueta.textContent = input.value ? ETIQUETA_NIVEL[nivel] : "Aún no escribes una contraseña";
    etiqueta.dataset.level = String(nivel);
    $$(".pw-rule", caja).forEach((li) => {
      const clave = li.dataset.regla;
      const ok = clave === "sinEspacios" ? !/\s/.test(input.value) && input.value.length > 0 : reglas[clave];
      li.classList.toggle("is-ok", Boolean(ok));
      li.querySelector("svg")?.setAttribute("data-ok", ok ? "1" : "0");
    });
  };

  input.addEventListener("input", pintar);
  if (confirmacion) confirmacion.addEventListener("input", () => {
    if (!confirmacion.value) return;
    const igual = confirmacion.value === input.value;
    igual ? limpiarError(confirmacionId) : marcarError(confirmacionId, "Las contraseñas no coinciden.");
  });
  pintar();
}

export function bloqueMedidorPassword() {
  const reglas = [
    ["longitud", "Mínimo 8 caracteres"],
    ["mayuscula", "Una letra mayúscula"],
    ["minuscula", "Una letra minúscula"],
    ["numero", "Un número"],
    ["especial", "Un carácter especial (!@#$…)"],
    ["sinEspacios", "Sin espacios en blanco"]
  ];
  return `
  <div class="pw-meter" id="medidor-password">
    <div class="pw-meter__bars" aria-hidden="true">
      <span class="pw-meter__bar"></span><span class="pw-meter__bar"></span>
      <span class="pw-meter__bar"></span><span class="pw-meter__bar"></span>
    </div>
    <span class="pw-meter__label" data-level="0" role="status">Aún no escribes una contraseña</span>
    <ul class="pw-rules">
      ${reglas.map(([clave, texto]) => `
        <li class="pw-rule" data-regla="${clave}">${icono("check")}<span>${esc(texto)}</span></li>`).join("")}
    </ul>
  </div>`;
}

/* =========================================================================
   6. Shell común de las vistas de registro
   ======================================================================= */
function shellRegistro(contenido, { paso = 1, totalPasos = 3, tituloPasos = [], anchoBoton = true } = {}) {
  return `
  <div class="auth-shell">
    <header class="auth-topbar">
      <a class="brand" href="#/" aria-label="FVRC · Volver a la portada">
        <span class="brand__mark"><img src="assets/img/fvrc-logo-256.png" width="256" height="256" alt="Escudo FVRC"></span>
        <span class="brand__text">
          <span class="brand__name">FVRC</span>
          <span class="brand__tag">Robótica Creativa</span>
        </span>
      </a>
      <nav class="auth-topbar__help" aria-label="Ayuda">
        <a href="#/registro" class="hide-sm">${icono("arrowLeft")} Volver al inicio del registro</a>
        <a href="#/">${icono("headphones")} <span class="hide-sm">Soporte</span></a>
      </nav>
    </header>
    <main class="auth-main" id="contenido">
      <div class="container container--wide">
        <nav class="crumbs" aria-label="Ruta de navegación" style="margin-bottom:var(--sp-5)">
          <a href="#/">Inicio</a><span class="crumbs__sep">/</span>
          <a href="#/registro">Registro</a><span class="crumbs__sep">/</span>
          <span aria-current="page">${esc(tituloPasos[tituloPasos.length - 1] || "Formulario")}</span>
        </nav>
        <div class="auth-grid">
          <div>${contenido}</div>
          <aside class="aside-stack" id="aside-registro"></aside>
        </div>
      </div>
    </main>
  </div>`;
}

function barraProgreso(paso, total, etiquetas) {
  const pct = Math.round((paso / total) * 100);
  return `
  <div class="form-head__progress">
    <div class="progress" role="progressbar" aria-valuenow="${paso}" aria-valuemin="1"
         aria-valuemax="${total}" aria-label="Progreso del registro">
      <div class="progress__fill" style="width:${pct}%"></div>
    </div>
    <div class="form-head__progress-labels">
      <span>${esc(etiquetas[paso - 1] || "")}</span>
      <span><b>Paso ${paso} de ${total}</b> · ${pct}% completado</span>
    </div>
  </div>`;

}

/* =========================================================================
   7. HUB · Selección de naturaleza del usuario
   ======================================================================= */
export function vistaRegistro() {
  const html = `
  ${cabecera()}
  <main id="contenido">
    <section class="section">
      <div class="container container--wide">
        <nav class="crumbs" aria-label="Ruta de navegación" style="margin-bottom:var(--sp-6)">
          <a href="#/">Inicio</a><span class="crumbs__sep">/</span>
          <span aria-current="page">Crear cuenta</span>
        </nav>

        <div class="nature-hero">
          <span class="eyebrow" style="justify-content:center">Paso 1 de 2 · Elige tu perfil</span>
          <h1 class="title-lg" style="margin-top:var(--sp-4)">¿Cómo vas a usar la plataforma?</h1>
          <p>
            La naturaleza de tu registro define qué documentos te vamos a solicitar y qué podrás
            hacer después: inscribirte en cursos, crear clubes, formar equipos o competir.
          </p>
        </div>

        <div class="nature-grid">
          <a class="nature-card reveal" href="#/registro/persona-natural" style="text-decoration:none">
            <div class="nature-card__top">
              <span class="nature-card__icon">${icono("user")}</span>
              <span class="badge badge--success badge--dot">Más rápido</span>
            </div>
            <h2>Persona Natural</h2>
            <p class="nature-card__lede">
              Para tutores, docentes, participantes independientes y aspirantes a federado que
              quieren tomar cursos, talleres y eventos académicos.
            </p>
            <div class="nature-card__tags">
              <span class="badge badge--neutral">Cédula digitalizada</span>
              <span class="badge badge--neutral">Datos de contacto</span>
              <span class="badge badge--neutral">Contraseña</span>
            </div>
            <div class="nature-card__facts">
              <span class="nature-card__fact">${icono("clock")} <span><b>3 secciones</b> · unos 5 minutos</span></span>
              <span class="nature-card__fact">${icono("book")} <span>Acceso a <b>cursos y eventos académicos</b></span></span>
              <span class="nature-card__fact">${icono("robot")} <span>Puedes crear un club al alcanzar <b>5 participantes</b></span></span>
            </div>
            <span class="choice-card__cta">Registrarme como persona natural ${icono("arrowRight")}</span>
          </a>

          <a class="nature-card nature-card--juridica reveal" href="#/registro/persona-juridica" style="text-decoration:none">
            <div class="nature-card__top">
              <span class="nature-card__icon">${icono("building")}</span>
              <span class="badge badge--warning badge--dot">Requiere verificación</span>
            </div>
            <h2>Persona Jurídica</h2>
            <p class="nature-card__lede">
              Para colegios, universidades, infocentros, fundaciones, empresas y clubes que
              quieren federarse y gestionar sus propios participantes y equipos.
            </p>
            <div class="nature-card__tags">
              <span class="badge badge--neutral">RIF</span>
              <span class="badge badge--neutral">Aval institucional</span>
              <span class="badge badge--neutral">Responsable</span>
            </div>
            <div class="nature-card__facts">
              <span class="nature-card__fact">${icono("clock")} <span><b>3 secciones</b> · unos 10 minutos</span></span>
              <span class="nature-card__fact">${icono("users")} <span>Gestión de <b>tutores, clubes y equipos</b></span></span>
              <span class="nature-card__fact">${icono("id")} <span>Una cuenta <b>por sede</b> (RIF + ubicación)</span></span>
            </div>
            <span class="choice-card__cta">Registrar mi institución ${icono("arrowRight")}</span>
          </a>
        </div>

        <div class="alert alert--info" style="margin-top:var(--sp-8)">
          ${icono("info")}
          <div>
            <span class="alert__title">No puedes registrarte como responsable si eres menor de edad</span>
            Las cuentas de persona natural y de responsable institucional exigen ser mayor de 18 años.
            Los participantes menores de edad son dados de alta por un tutor, representante o institución.
          </div>
        </div>

        <div class="grid grid--3" style="margin-top:var(--sp-8)">
          ${[
            ["shield", "Verificación FVRC", "Un administrador revisa tus datos antes de activar la cuenta."],
            ["mail", "Credenciales por correo", "Al ser aprobada recibes tu usuario y tu código RNR único."],
            ["lock", "Datos protegidos", "Tu información se cifra y solo la usa el proceso de verificación."]
          ].map(([ic, t, tx]) => `
            <div class="card card--pad">
              <span class="icon-square" style="width:40px;height:40px">${icono(ic)}</span>
              <h3 class="title-sm" style="margin-top:var(--sp-4)">${esc(t)}</h3>
              <p class="text-sm text-secondary" style="margin-top:var(--sp-2)">${esc(tx)}</p>
            </div>`).join("")}
        </div>

        <p class="center text-secondary" style="margin-top:var(--sp-8)">
          ¿Ya tienes una cuenta aprobada? <a href="#/login">Inicia sesión aquí</a>
        </p>
      </div>
    </section>
  </main>
  ${piePagina()}`;

  return {
    titulo: "Crear cuenta",
    html,
    iniciar() { activarShell(document); }
  };
}

/* =========================================================================
   8. PERSONA NATURAL
   ======================================================================= */
export function vistaPersonaNatural() {
  const guardado = leerEstado();

  const contenido = `
    <div class="form-head">
      <div class="form-head__top">
        <div>
          <span class="eyebrow">Registro · Persona Natural</span>
          <h1 class="title-lg" style="margin-top:var(--sp-3)">Crea tu cuenta en la FVRC</h1>
          <p>
            Completa los tres bloques. Al enviar el formulario, la Federación Venezolana de
            Robótica Creativa verificará tus datos y te enviará tus credenciales por correo.
          </p>
        </div>
        <span class="badge badge--brand badge--dot">Borrador guardado automáticamente</span>
      </div>
      ${barraProgreso(1, 3, ["Datos de identificación", "Ubicación y contacto", "Seguridad"])}
    </div>

    <form class="auth-card" id="form-pn" novalidate>
      <!-- ============ SECCIÓN A ============ -->
      <div class="auth-card__head">
        <span class="section-title__num">A</span>
        <div>
          <h2>Datos de identificación</h2>
          <p>Deben coincidir exactamente con tu documento de identidad.</p>
        </div>
      </div>
      <div class="auth-card__body">
        <div class="form-grid">
          ${campo({
            id: "pn-nacionalidad", label: "Nacionalidad", tipo: "select", obligatorio: true,
            opciones: NACIONALIDADES, valor: guardado.nacionalidad || ""
          })}
          ${campo({
            id: "pn-cedula", label: "Cédula de identidad", obligatorio: true,
            placeholder: "V-12345678", valor: guardado.cedula || "", maxlength: 12,
            ayuda: "Formato V/E + número, con o sin guion."
          })}
          ${campo({ id: "pn-nombres", label: "Nombres", valor: guardado.nombres || "", maxlength: 100 })}
          ${campo({ id: "pn-apellidos", label: "Apellidos", valor: guardado.apellidos || "", maxlength: 100 })}
          ${campo({
            id: "pn-fecha-nacimiento", label: "Fecha de nacimiento", tipo: "date", obligatorio: true,
            valor: guardado.fechaNacimiento || "", min: "1920-01-01", max: hoyISO(),
            ayuda: "Debes ser mayor de 18 años para registrarte como persona natural."
          })}
          ${campo({
            id: "pn-edad", label: "Edad", obligatorio: false, soloLectura: true,
            valor: guardado.fechaNacimiento ? String(calcularEdad(guardado.fechaNacimiento) ?? "") : "",
            ayuda: "Calculada automáticamente por el sistema."
          })}
          ${campo({ id: "pn-sexo", label: "Sexo", tipo: "select", obligatorio: true, opciones: SEXOS, valor: guardado.sexo || "" })}
        </div>

        <div class="form-grid" style="margin-top:var(--sp-5)">
          ${campoArchivo({
            id: "pn-doc-cedula", label: "Cédula o RIF digitalizado",
            ayuda: "PNG, JPG o PDF · máximo 5 MB · ambas caras en un solo archivo"
          })}
          ${campoArchivo({
            id: "pn-foto", label: "Foto tipo carnet",
            ayuda: "PNG o JPG · máximo 2 MB · fondo claro y rostro visible",
            acepta: "image/png,image/jpeg"
          })}
        </div>
      </div>

      <!-- ============ SECCIÓN B ============ -->
      <div class="auth-card__head">
        <span class="section-title__num">B</span>
        <div>
          <h2>Ubicación y contacto</h2>
          <p>Usamos estos datos para asignarte tu código territorial y avisarte de actividades cercanas.</p>
        </div>
      </div>
      <div class="auth-card__body">
        <div class="form-grid">
          ${campo({
            id: "pn-correo", label: "Correo electrónico", tipo: "email", obligatorio: true,
            valor: guardado.correo || "", placeholder: "tucorreo@ejemplo.com",
            ayuda: "Será tu usuario de acceso y debe ser único en la plataforma.",
            autocomplete: "email"
          })}
          ${campo({
            id: "pn-telefono", label: "Teléfono", obligatorio: true,
            valor: guardado.telefono || "", placeholder: "0414-1234567",
            ayuda: "Incluye el código de área."
          })}
          ${campo({ id: "pn-estado", label: "Estado", tipo: "select", obligatorio: true, opciones: opcionesEstados(), valor: guardado.estado || "" })}
          ${campo({ id: "pn-municipio", label: "Municipio", tipo: "select", obligatorio: true, opciones: [] })}
          ${campo({ id: "pn-parroquia", label: "Parroquia", tipo: "select", obligatorio: true, opciones: [] })}
          ${campo({
            id: "pn-direccion", label: "Dirección de habitación", obligatorio: true,
            valor: guardado.direccion || "", maxlength: 250, span: "col-span-2",
            placeholder: "Calle, número de casa o edificio, punto de referencia"
          })}
          ${campo({ id: "pn-instagram", label: "Instagram", obligatorio: false, valor: guardado.instagram || "", placeholder: "@usuario" })}
          ${campo({ id: "pn-linkedin", label: "LinkedIn", obligatorio: false, valor: guardado.linkedin || "", placeholder: "linkedin.com/in/usuario" })}
        </div>
      </div>

      <!-- ============ SECCIÓN C ============ -->
      <div class="auth-card__head">
        <span class="section-title__num">C</span>
        <div>
          <h2>Seguridad</h2>
          <p>Crea una contraseña robusta. Podrás cambiarla después desde tu perfil.</p>
        </div>
      </div>
      <div class="auth-card__body">
        <div class="form-grid">
          ${campo({
            id: "pn-password", label: "Contraseña", tipo: "password", obligatorio: true,
            autocomplete: "new-password",
            extra: 'data-toggle-password="pn-password"',
            ayuda: "Mínimo 8 caracteres, con mayúscula, minúscula y carácter especial."
          })}
          ${campo({
            id: "pn-password2", label: "Confirmación de contraseña", tipo: "password", obligatorio: true,
            autocomplete: "new-password"
          })}
          <div class="col-span-2">${bloqueMedidorPassword()}</div>
        </div>

        <div class="field" data-campo="pn-terminos" style="margin-top:var(--sp-6)">
          <label class="checkline">
            <input type="checkbox" id="pn-terminos" name="terminos" required>
            <span>
              Declaro que la información suministrada es verídica y acepto los
              <a href="#/">términos de uso</a> y la <a href="#/">política de tratamiento de datos</a>
              de la Federación Venezolana de Robótica Creativa.
            </span>
          </label>
          <span class="field__error" id="err-pn-terminos" role="alert">
            ${icono("alertCircle")}<span data-mensaje></span>
          </span>
        </div>

        <label class="checkline" style="margin-top:var(--sp-4)">
          <input type="checkbox" id="pn-boletin" name="boletin" checked>
          <span>Quiero recibir el boletín mensual de convocatorias de cursos y eventos.</span>
        </label>
      </div>

      <div class="auth-card__foot">
        <span class="auth-card__foot-note">
          Al finalizar, tu solicitud pasa a estado <b>En proceso de verificación</b>.
          No podrás iniciar sesión hasta que un administrador de la FVRC la apruebe.
        </span>
        <div class="row">
          <a class="btn btn--ghost" href="#/registro">Cancelar</a>
          <button class="btn btn--primary btn--field" type="submit" id="btn-enviar-pn">
            Finalizar registro ${icono("arrowRight")}
          </button>
        </div>
      </div>
    </form>`;

  return {
    titulo: "Registro de persona natural",
    html: shellRegistro(contenido, { tituloPasos: ["Registro", "Persona natural"] }),
    iniciar() {
      activarShell(document);
      pintarAsidePN();
      cablearCascada(document, { estado: "pn-estado", municipio: "pn-municipio", parroquia: "pn-parroquia" });
      conectarMedidorPassword("pn-password", "medidor-password", "pn-password2");
      cablearArchivos(document);
      cablearAutoguardadoPN();
      document.getElementById("form-pn").addEventListener("submit", enviarPersonaNatural);
      /* Restaurar el municipio/parroquia guardados */
      const g = leerEstado();
      if (g.municipio) {
        const m = document.getElementById("pn-municipio");
        m.value = g.municipio;
        m.dispatchEvent(new Event("change"));
        if (g.parroquia) document.getElementById("pn-parroquia").value = g.parroquia;
      }
      /* Actualiza el resumen lateral al escribir */
      const form = document.getElementById("form-pn");
      form.addEventListener("input", () => { guardarEstado(leerFormularioPN(form)); pintarAsidePN(); });
      form.addEventListener("change", () => { guardarEstado(leerFormularioPN(form)); pintarAsidePN(); });
    }
  };
}

function pintarAsidePN() {
  const aside = document.getElementById("aside-registro");
  if (!aside) return;
  const g = leerEstado();
  const faltantes = [];
  if (!g.nacionalidad) faltantes.push("Nacionalidad");
  if (!g.cedula) faltantes.push("Cédula");
  if (!g.nombres) faltantes.push("Nombres");
  if (!g.apellidos) faltantes.push("Apellidos");
  if (!g.fechaNacimiento) faltantes.push("Fecha de nacimiento");
  if (!g.sexo) faltantes.push("Sexo");
  if (!g.correo) faltantes.push("Correo electrónico");
  if (!g.telefono) faltantes.push("Teléfono");
  if (!g.estado) faltantes.push("Ubicación");

  aside.innerHTML = `
    <div class="aside-card">
      <h3>Resumen de tu registro</h3>
      <dl class="summary-list">
        ${[
          ["Naturaleza", "Persona natural"],
          ["Nombre", [g.nombres, g.apellidos].filter(Boolean).join(" ") || ""],
          ["Cédula", g.nacionalidad && g.cedula ? `${g.nacionalidad === "Venezolano" ? "V" : "E"}-${g.cedula}` : ""],
          ["Edad", g.fechaNacimiento ? `${calcularEdad(g.fechaNacimiento)} años` : ""],
          ["Correo", g.correo],
          ["Ubicación", [g.municipio, g.estado].filter(Boolean).join(", ")]
        ].map(([k, v]) => `
          <div class="summary-list__row">
            <dt>${esc(k)}</dt>
            <dd class="${v ? "" : "is-empty"}">${v ? esc(v) : "Pendiente"}</dd>
          </div>`).join("")}
      </dl>
    </div>

    <div class="aside-card aside-card--brand">
      <h3>Qué falta por completar</h3>
      <ul class="checklist checklist--onDark">
        ${faltantes.length
          ? faltantes.slice(0, 6).map((f) => `<li>${icono("alertCircle")}<span>${esc(f)}</span></li>`).join("")
          : `<li>${icono("checkCircle")}<span>Todos los datos básicos están completos. Revisa la sección C y envía.</span></li>`}
      </ul>
    </div>

    <div class="aside-card">
      <h3>Después de enviar</h3>
      <ol class="checklist">
        <li>${icono("checkCircle")}<span>Tu solicitud queda <b>En proceso de verificación</b>.</span></li>
        <li>${icono("checkCircle")}<span>La FVRC revisa tus documentos y datos.</span></li>
        <li>${icono("checkCircle")}<span>Recibes por correo tus credenciales y tu <b>código RNR</b>.</span></li>
        <li>${icono("checkCircle")}<span>Completas tu perfil (CV y foto) y ya puedes inscribirte.</span></li>
      </ol>
    </div>

    <div class="legal-note">
      ${icono("lock")}
      <span>Tus documentos se almacenan cifrados y solo los consulta el personal autorizado
      durante el proceso de verificación.</span>
    </div>`;
}

function leerFormularioPN(form) {
  const v = (n) => form.querySelector(`[name="${n}"]`)?.value.trim() || "";
  return {
    nacionalidad: v("pn-nacionalidad"), cedula: v("pn-cedula"), nombres: v("pn-nombres"),
    apellidos: v("pn-apellidos"), fechaNacimiento: v("pn-fecha-nacimiento"),
    sexo: v("pn-sexo"), correo: v("pn-correo"), telefono: v("pn-telefono"),
    estado: v("pn-estado"), municipio: v("pn-municipio"), parroquia: v("pn-parroquia"),
    direccion: v("pn-direccion"), instagram: v("pn-instagram"), linkedin: v("pn-linkedin")
  };
}

function cablearAutoguardadoPN() {
  const form = document.getElementById("form-pn");
  if (!form) return;
  const guardar = () => guardarEstado(leerFormularioPN(form));
  const t = setInterval(guardar, 4000);
  limpiarAlSalir(() => { guardar(); clearInterval(t); });
}

function cablearArchivos(raiz) {
  $$("[data-drop]", raiz).forEach((drop) => {
    const input = drop.querySelector('input[type="file"]');
    const titulo = drop.querySelector("[data-archivo-titulo]");
    const meta = drop.querySelector("[data-archivo-meta]");
    const idCampo = input.id;

    const pintar = () => {
      const f = input.files?.[0];
      if (!f) return;
      const mb = (f.size / 1048576).toFixed(2);
      drop.classList.add("has-file");
      titulo.textContent = f.name;
      meta.textContent = `${mb} MB · ${f.type || "archivo"}`;
      if (f.size > 5 * 1048576) marcarError(idCampo, "El archivo supera el máximo de 5 MB.");
      else limpiarError(idCampo);
    };

    input.addEventListener("change", pintar);
    ["dragenter", "dragover"].forEach((ev) => drop.addEventListener(ev, (e) => {
      e.preventDefault(); drop.classList.add("is-dragover");
    }));
    ["dragleave", "drop"].forEach((ev) => drop.addEventListener(ev, (e) => {
      e.preventDefault(); drop.classList.remove("is-dragover");
    }));
    drop.addEventListener("drop", (e) => {
      if (e.dataTransfer?.files?.length) { input.files = e.dataTransfer.files; pintar(); }
    });
  });

  /* Mostrar/ocultar contraseñas */
  $$("[data-toggle-password]", raiz).forEach((campoEl) => {
    const id = campoEl.dataset.togglePassword;
    const input = document.getElementById(id);
    if (!input) return;
    const wrap = input.parentElement;
    const boton = document.createElement("button");
    boton.type = "button";
    boton.className = "btn-affix";
    boton.setAttribute("aria-label", "Mostrar contraseña");
    boton.innerHTML = icono("eye");
    wrap.classList.add("control-wrap");
    input.classList.add("input--affix-right");
    wrap.appendChild(boton);
    boton.addEventListener("click", () => {
      const visible = input.type === "text";
      input.type = visible ? "password" : "text";
      boton.innerHTML = icono(visible ? "eye" : "eyeOff");
      boton.setAttribute("aria-label", visible ? "Mostrar contraseña" : "Ocultar contraseña");
      input.focus();
    });
  });
}

/* --------------------- Envío: Persona Natural --------------------------- */
function enviarPersonaNatural(e) {
  e.preventDefault();
  const form = e.currentTarget;
  const boton = document.getElementById("btn-enviar-pn");
  limpiarTodosLosErrores(form);

  const d = leerFormularioPN(form);
  const archivoCedula = form.querySelector('[name="pn-doc-cedula"]').files?.[0];
  const archivoFoto = form.querySelector('[name="pn-foto"]').files?.[0];
  const pw = form.querySelector('[name="pn-password"]').value;
  const pw2 = form.querySelector('[name="pn-password2"]').value;
  const terminos = form.querySelector('[name="terminos"]').checked;
  const edad = calcularEdad(d.fechaNacimiento);

  const reglas = [
    { id: "pn-nacionalidad", etiqueta: "Nacionalidad", test: () => Boolean(d.nacionalidad), mensaje: "Selecciona tu nacionalidad." },
    { id: "pn-cedula", etiqueta: "Cédula de identidad", test: () => validarCedula(d.cedula), mensaje: "Formato inválido. Ejemplo: V-12345678." },
    { id: "pn-nombres", etiqueta: "Nombres", test: () => validarTexto(d.nombres, 2, 100), mensaje: "Solo letras, entre 2 y 100 caracteres." },
    { id: "pn-apellidos", etiqueta: "Apellidos", test: () => validarTexto(d.apellidos, 2, 100), mensaje: "Solo letras, entre 2 y 100 caracteres." },
    { id: "pn-fecha-nacimiento", etiqueta: "Fecha de nacimiento", test: () => Boolean(d.fechaNacimiento), mensaje: "Indica tu fecha de nacimiento." },
    { id: "pn-fecha-nacimiento", etiqueta: "Mayoría de edad", test: () => edad === null || edad >= 18,
      mensaje: "Debes ser mayor de 18 años para registrarte como persona natural." },
    { id: "pn-sexo", etiqueta: "Sexo", test: () => Boolean(d.sexo), mensaje: "Selecciona una opción." },
    { id: "pn-doc-cedula", etiqueta: "Cédula digitalizada", test: () => Boolean(archivoCedula), mensaje: "Adjunta la imagen o PDF de tu cédula." },
    { id: "pn-foto", etiqueta: "Foto tipo carnet", test: () => Boolean(archivoFoto), mensaje: "Adjunta tu foto tipo carnet." },
    { id: "pn-correo", etiqueta: "Correo electrónico", test: () => validarEmail(d.correo), mensaje: "Ingresa un correo electrónico válido." },
    { id: "pn-telefono", etiqueta: "Teléfono", test: () => validarTelefono(d.telefono), mensaje: "Formato inválido. Ejemplo: 0414-1234567." },
    { id: "pn-estado", etiqueta: "Estado", test: () => Boolean(d.estado), mensaje: "Selecciona tu estado." },
    { id: "pn-municipio", etiqueta: "Municipio", test: () => Boolean(d.municipio), mensaje: "Selecciona tu municipio." },
    { id: "pn-parroquia", etiqueta: "Parroquia", test: () => Boolean(d.parroquia), mensaje: "Selecciona tu parroquia." },
    { id: "pn-direccion", etiqueta: "Dirección", test: () => d.direccion.length >= 10, mensaje: "Describe tu dirección (mínimo 10 caracteres)." },
    { id: "pn-password", etiqueta: "Contraseña", test: () => evaluarPassword(pw).cumplidas === 5, mensaje: "Debe cumplir las 5 reglas de seguridad." },
    { id: "pn-password2", etiqueta: "Confirmación", test: () => pw2.length > 0 && pw === pw2, mensaje: "Las contraseñas no coinciden." },
    { id: "pn-terminos", etiqueta: "Términos y condiciones", test: () => terminos, mensaje: "Debes aceptar los términos para continuar." }
  ];

  const { ok, errores } = validar(reglas);
  if (!ok) {
    mostrarResumenErrores(errores, "#form-pn");
    notificar(`Hay ${errores.length} campos por corregir antes de enviar.`, "warning", "Revisa el formulario");
    const primero = document.getElementById(errores[0].id);
    primero?.focus();
    return;
  }

  /* Simulación de envío */
  boton.classList.add("is-loading");
  boton.disabled = true;

  setTimeout(() => {
    boton.classList.remove("is-loading");
    boton.disabled = false;
    limpiarEstado();
    mostrarExito({
      titulo: "Tu registro fue enviado correctamente",
      nombre: d.nombres,
      correo: d.correo,
      perfil: "Persona Natural",
      siguiente: [
        ["Verificación de datos", "Un administrador de la FVRC revisa tu cédula y tus datos personales (1 a 3 días hábiles)."],
        ["Aprobación y credenciales", "Recibirás un correo con tu usuario y tu código RNR para iniciar sesión."],
        ["Completar perfil", "Deberás cargar tu currículum y confirmar tu foto para poder inscribirte en eventos."],
        ["Inscribirte", "Ya podrás postularte a cursos, talleres, ferias y olimpiadas desde tu panel."]
      ]
    });
  }, 1100);
}

/* =========================================================================
   9. PERSONA JURÍDICA · «Registra tu institución»
   -------------------------------------------------------------------------
   Asistente de tres pasos, en el orden que fija el documento fuente (§3 y §7):
     1. Tipo de institución y datos de la institución.
     2. Datos del responsable institucional (comunes a todos los tipos).
     3. Datos de seguridad y declaración final (comunes a todos los tipos).

   Cada tipo se comporta distinto (campos, RIF y recaudos), pero esa
   diferencia NO vive aquí: está declarada en `data.js`
   (`TIPOS_INSTITUCION` + `especificacionInstitucion`). Esta vista solo dibuja
   y valida esa declaración, de modo que añadir un tipo, un campo condicional
   o un recaudo es un cambio de datos, no de interfaz.
   ======================================================================= */

const CLAVE_ESTADO_PJ = "pnrc-registro-pj";

/* Borrador local: SOLO datos de la institución. Nunca se persisten documentos,
   contraseñas ni datos personales del responsable (misma política que el
   registro de persona natural). */
const CAMPOS_PJ_PERSISTIBLES = [
  "pj-razon-social", "pj-naturaleza-mppe", "pj-nivel-escolar", "pj-codigo-mppe",
  "pj-rif-propio", "pj-tipo-rif", "pj-numero-rif", "pj-naturaleza-otras",
  "pj-universidad", "pj-facultad", "pj-facultad-nueva",
  "pj-dependencia", "pj-dependencia-otra", "pj-tipo-organizacion",
  "pj-estado", "pj-municipio", "pj-parroquia", "pj-direccion",
  "pj-correo-inst", "pj-telefono-inst", "pj-linkedin", "pj-instagram"
];

const PASOS_PJ = [
  { n: 1, titulo: "Tipo de institución", desc: "Tipo, datos fiscales, ubicación y recaudos." },
  { n: 2, titulo: "Responsable institucional", desc: "Datos y documento del responsable." },
  { n: 3, titulo: "Seguridad", desc: "Credenciales, declaración y envío." }
];

/* Estado del asistente (vive lo que dura la vista). */
let tipoActual = null;
let pasoActual = 1;
let firmaRecaudos = "";
let ultimaUniversidad = null;

/* ------------------------- Lectura del formulario ----------------------- */

function cajaDe(id) { return document.querySelector(`[data-campo="${id}"]`); }

/** Valor de un campo por id, sin importar el tipo de control. */
function valorPJ(id) {
  const el = cajaDe(id)?.querySelector("input, select, textarea") || document.getElementById(id);
  if (!el) return "";
  if (el.type === "file") return el.files?.[0]?.name || "";
  if (el.type === "checkbox") return el.checked;
  return String(el.value || "").trim();
}

function archivoPJ(id) {
  const el = cajaDe(id)?.querySelector('input[type="file"]') || document.getElementById(id);
  return el?.type === "file" ? (el.files?.[0] || null) : null;
}

/** Todos los valores del formulario indexados por `name`. */
function valoresPJ() {
  const salida = {};
  $$("#form-pj [name]").forEach((el) => {
    if (el.type === "file") { salida[el.name] = el.files?.[0]?.name || ""; return; }
    if (el.type === "checkbox") { salida[el.name] = el.checked; return; }
    salida[el.name] = String(el.value || "").trim();
  });
  return salida;
}

/* ---------------------------- Borrador local ---------------------------- */

function leerBorradorPJ() {
  try { return JSON.parse(localStorage.getItem(CLAVE_ESTADO_PJ)) || {}; }
  catch { return {}; }
}

function guardarBorradorPJ() {
  const datos = { tipo: tipoActual, paso: pasoActual, valores: {} };
  for (const clave of CAMPOS_PJ_PERSISTIBLES) {
    const v = valorPJ(clave);
    if (typeof v === "string" && v) datos.valores[clave] = v;
  }
  try { localStorage.setItem(CLAVE_ESTADO_PJ, JSON.stringify(datos)); }
  catch { /* almacenamiento no disponible: el borrador es opcional */ }
}

function limpiarBorradorPJ() {
  try { localStorage.removeItem(CLAVE_ESTADO_PJ); } catch { /* noop */ }
}

/* --------------------------- Pintado de campos -------------------------- */

function campoDesdeSpec(c) {
  const comun = {
    id: c.id, label: c.label, obligatorio: c.obligatorio !== false,
    ayuda: c.ayuda || "", span: c.span || ""
  };
  if (c.tipoArchivo) {
    return campoArchivo({ ...comun, acepta: c.acepta || "image/png,image/jpeg,application/pdf" });
  }
  return campo({
    ...comun,
    tipo: c.tipo || "text",
    placeholder: c.placeholder || "",
    opciones: c.opciones || [],
    valor: c.valor ?? "",
    soloLectura: Boolean(c.soloLectura),
    maxlength: c.maxlength
  });
}

function bloqueAlertas(alertas) {
  return alertas.map((a) => `
    <div class="alert alert--${a.tipo || "info"}">
      ${icono(a.tipo === "warning" ? "alert" : a.tipo === "danger" ? "alertCircle" : "info")}
      <div><span class="alert__title">${a.titulo}</span>${a.texto}</div>
    </div>`).join("");
}

function bloqueRecaudos(recaudos) {
  if (!recaudos.length) return "";
  return `
    <div class="cond-block cond-block--recaudos" style="margin-top:var(--sp-6)">
      <span class="cond-block__title">${icono("upload")} Recaudos obligatorios de este tipo de institución</span>
      <p class="text-sm text-secondary" style="margin-bottom:var(--sp-4)">
        La FVRC verifica cada archivo contra el registro oficial antes de aprobar la cuenta.
        Formatos y peso máximo se indican en cada casilla.
      </p>
      <div class="form-grid">${recaudos.map(campoDesdeSpec).join("")}</div>
    </div>`;
}

/** Vuelca valores guardados sobre los controles recién pintados. */
function restaurarValores(raiz, valores, { omitir = [] } = {}) {
  Object.entries(valores || {}).forEach(([id, v]) => {
    if (omitir.includes(id)) return;
    const el = raiz.querySelector(`[data-campo="${id}"] input, [data-campo="${id}"] select, [data-campo="${id}"] textarea`);
    if (!el || el.readOnly || el.disabled) return;
    if (el.type === "file" || el.type === "checkbox") return;
    if (el.tagName === "SELECT") {
      if ([...el.options].some((o) => o.value === v)) el.value = v;
      return;
    }
    el.value = v;
  });
}

/** Rellena el catálogo de facultades según la universidad elegida. */
function sincronizarUniversidad() {
  const sel = cajaDe("pj-universidad")?.querySelector("select");
  const selFac = cajaDe("pj-facultad")?.querySelector("select");
  if (!sel || !selFac) return;

  const universidad = UNIVERSIDADES.find((u) => u.id === sel.value);
  const previa = selFac.value;

  if (universidad) {
    selFac.innerHTML =
      `<option value="">Selecciona la facultad, escuela o decanato…</option>` +
      universidad.facultades.map((f) => `<option value="${attr(f)}">${esc(f)}</option>`).join("") +
      `<option value="${attr(FACULTAD_OTRA)}">Otra facultad o decanato (solicitar alta)</option>`;
    selFac.disabled = false;
    if (previa && [...selFac.options].some((o) => o.value === previa)) selFac.value = previa;
  } else {
    selFac.innerHTML = `<option value="">Primero elige la universidad…</option>`;
    selFac.disabled = true;
  }
}

/** Repinta el bloque del tipo (campos condicionales + recaudos). */
function pintarBloqueTipo({ conservar = true } = {}) {
  const contenedor = document.getElementById("bloque-tipo");
  const contenedorRecaudos = document.getElementById("bloque-recaudos");
  if (!contenedor) return;

  const tipo = TIPOS_INSTITUCION.find((t) => t.id === tipoActual);
  if (!tipo) {
    contenedor.innerHTML = "";
    if (contenedorRecaudos) contenedorRecaudos.innerHTML = "";
    firmaRecaudos = "";
    return;
  }

  const valores = valoresPJ();
  const esp = especificacionInstitucion(tipo.id, valores);

  contenedor.innerHTML = `
    <div class="cond-block" style="margin-top:var(--sp-6)">
      <span class="cond-block__title">
        ${icono(tipo.icono)} Datos de ${esc(tipo.nombre)}${tipo.etiqueta ? ` · ${esc(tipo.etiqueta)}` : ""}
      </span>
      ${bloqueAlertas(esp.alertas)}
      <div class="form-grid">${esp.visibles.map(campoDesdeSpec).join("")}</div>
    </div>`;

  /* Se restauran los valores antes de resolver el catálogo de facultades,
     porque la universidad elegida decide qué facultades existen; la facultad
     se restaura al final, cuando sus opciones ya están cargadas. */
  if (conservar) restaurarValores(contenedor, valores, { omitir: ["pj-facultad"] });
  if (tipo.id === "universidad") {
    sincronizarUniversidad();
    if (conservar && valores["pj-facultad"]) {
      restaurarValores(contenedor, { "pj-facultad": valores["pj-facultad"] });
    }
  }

  /* Los recaudos solo se repintan cuando cambia el conjunto exigido: así no se
     pierde el archivo que el usuario ya había adjuntado. */
  const firma = esp.recaudos.map((r) => r.id).join("|");
  if (firma !== firmaRecaudos) {
    firmaRecaudos = firma;
    if (contenedorRecaudos) {
      contenedorRecaudos.innerHTML = bloqueRecaudos(esp.recaudos);
      cablearArchivos(contenedorRecaudos);
    }
  }

  cablearRamificadores(esp);
}

function cablearRamificadores(esp) {
  esp.ramificadores.forEach((id) => {
    const el = cajaDe(id)?.querySelector("input, select, textarea");
    el?.addEventListener("change", () => {
      pintarBloqueTipo();
      /* El nombre oficial del catálogo se aplica después de repintar y solo
         cuando cambió la universidad elegida, para no pisar lo que el usuario
         haya escrito a mano. */
      if (id === "pj-universidad") aplicarNombreUniversidad();
      actualizarAvisoSede();
      guardarBorradorPJ();
      pintarAsidePJ();
    });
  });
}

/** Completa la razón social con el nombre oficial del catálogo de la FVRC. */
function aplicarNombreUniversidad() {
  const sel = cajaDe("pj-universidad")?.querySelector("select");
  const razon = cajaDe("pj-razon-social")?.querySelector("input");
  if (!sel || !razon) return;
  const universidad = UNIVERSIDADES.find((u) => u.id === sel.value);
  if (universidad && sel.value !== ultimaUniversidad) razon.value = universidad.nombre;
  ultimaUniversidad = sel.value || null;
}

/* ------------------------- Reglas por tipo y campo ---------------------- */

function req(id, etiqueta, mensaje = "Este campo es obligatorio.") {
  return { id, etiqueta, test: () => Boolean(valorPJ(id)), mensaje };
}

function normalizarRif(valor) {
  const limpio = String(valor || "").toUpperCase().replace(/\s/g, "");
  if (!limpio) return "";
  return /^[JG]/.test(limpio) ? limpio.replace(/^([JG])-?/, "$1-") : limpio;
}

/** RIF con el que se valida la unicidad de sede, según el tipo elegido. */
function rifInstitucion() {
  switch (tipoActual) {
    case "mppe":
      return valorPJ("pj-naturaleza-mppe") === "Privada"
        ? normalizarRif(valorPJ("pj-rif-propio"))
        : RIF_MPPE;
    case "infocentro":
      return `${LETRA_RIF_INFOCENTRO}-${RIF_INFOCENTRO}`;
    default: {
      const letra = valorPJ("pj-tipo-rif");
      const numero = valorPJ("pj-numero-rif");
      return letra && numero ? `${letra}-${numero}` : "";
    }
  }
}

const FORMATOS_RIF = {
  "pj-numero-rif": { re: /^\d{7,9}(-\d)?$/, msg: "Escribe solo el número, sin la letra. Ejemplo: 30456789-1." },
  "pj-rif-propio": { re: /^[JG]-?\d{8}(-\d)?$/, msg: "Formato inválido. Ejemplo: J-12345678-9." },
  "pj-codigo-mppe": { re: /^[A-Za-z]{1,4}-?\d{4,10}$/, msg: "Formato inválido. Ejemplo: OD-01234567." },
  "pj-codigo-infocentro": { re: /^[A-Za-z0-9-]{4,20}$/, msg: "Usa el código asignado por la Fundación Infocentro. Ejemplo: INF-000123." }
};

function testCampoInstitucion(c) {
  if (c.tipoArchivo) return !c.obligatorio || Boolean(archivoPJ(c.id));
  const v = valorPJ(c.id);
  if (!v) return c.obligatorio === false;
  if (c.id === "pj-razon-social") return v.length >= 3 && v.length <= 200;
  const formato = FORMATOS_RIF[c.id];
  if (formato) return formato.re.test(v);
  return true;
}

function mensajeCampoInstitucion(c) {
  if (FORMATOS_RIF[c.id]) return FORMATOS_RIF[c.id].msg;
  if (c.id === "pj-razon-social") return "Escribe la razón social (mínimo 3 caracteres).";
  if (c.id === "pj-facultad") return "Selecciona la facultad, escuela o decanato.";
  if (c.id === "pj-facultad-nueva") return "Indica el nombre de la facultad o decanato a registrar.";
  if (c.id === "pj-dependencia") return "Selecciona la dependencia gubernamental.";
  if (c.id === "pj-dependencia-otra") return "Escribe el nombre de la dependencia.";
  if (c.tipoArchivo) return "Adjunta este recaudo para continuar.";
  return "Este campo es obligatorio.";
}

/* ---------------------------- Reglas por paso --------------------------- */

function reglasPaso1() {
  const reglas = [{
    id: "pj-tipo", etiqueta: "Tipo de institución",
    test: () => Boolean(tipoActual), mensaje: "Selecciona el tipo de institución."
  }];
  if (!tipoActual) return reglas;

  const esp = especificacionInstitucion(tipoActual, valoresPJ());

  esp.visibles.forEach((c) => reglas.push({
    id: c.id, etiqueta: c.label,
    test: () => testCampoInstitucion(c),
    mensaje: mensajeCampoInstitucion(c)
  }));

  esp.recaudos.forEach((r) => reglas.push({
    id: r.id, etiqueta: r.label,
    test: () => !r.obligatorio || Boolean(archivoPJ(r.id)),
    mensaje: "Adjunta este recaudo para continuar."
  }));

  reglas.push(
    req("pj-estado", "Estado"),
    req("pj-municipio", "Municipio"),
    req("pj-parroquia", "Parroquia"),
    { id: "pj-direccion", etiqueta: "Dirección fiscal",
      test: () => valorPJ("pj-direccion").length >= 10,
      mensaje: "Describe la dirección fiscal (mínimo 10 caracteres)." },
    { id: "pj-correo-inst", etiqueta: "Correo institucional",
      test: () => validarEmail(valorPJ("pj-correo-inst")), mensaje: "Correo institucional inválido." },
    { id: "pj-telefono-inst", etiqueta: "Teléfono institucional",
      test: () => validarTelefono(valorPJ("pj-telefono-inst")),
      mensaje: "Incluye el código de área. Ejemplo: 0212-1234567." }
  );

  /* Regla de unicidad de sede: (RIF + estado + municipio + parroquia). */
  reglas.push({
    id: "pj-sede", etiqueta: "Unicidad de sede",
    test: () => {
      const rif = rifInstitucion();
      if (!rif) return true;
      return !sedeDuplicada({
        rif,
        estado: valorPJ("pj-estado"),
        municipio: valorPJ("pj-municipio"),
        parroquia: valorPJ("pj-parroquia")
      });
    },
    mensaje: "Ya existe una sede registrada con ese RIF en la misma ubicación. Cada sede necesita su propia cuenta."
  });

  return reglas;
}

function reglasPaso2() {
  const edad = calcularEdad(valorPJ("pj-fecha-nacimiento"));
  const cargo = valorPJ("pj-cargo");
  return [
    { id: "pj-nombres", etiqueta: "Nombres del responsable",
      test: () => validarTexto(valorPJ("pj-nombres"), 2, 100), mensaje: "Solo letras, entre 2 y 100 caracteres." },
    { id: "pj-apellidos", etiqueta: "Apellidos del responsable",
      test: () => validarTexto(valorPJ("pj-apellidos"), 2, 100), mensaje: "Solo letras, entre 2 y 100 caracteres." },
    req("pj-nacionalidad", "Nacionalidad", "Selecciona la nacionalidad."),
    { id: "pj-cedula", etiqueta: "Cédula del responsable",
      test: () => validarCedula(valorPJ("pj-cedula")), mensaje: "Formato inválido. Ejemplo: V-12345678." },
    { id: "pj-fecha-nacimiento", etiqueta: "Fecha de nacimiento",
      test: () => edad !== null && edad >= 18, mensaje: "El responsable debe ser mayor de 18 años." },
    req("pj-sexo", "Sexo", "Selecciona una opción."),
    req("pj-cargo", "Cargo institucional", "Selecciona el cargo del responsable."),
    { id: "pj-cargo-otro", etiqueta: "Cargo (especificar)",
      test: () => cargo !== "Otro cargo (especificar)" || valorPJ("pj-cargo-otro").length >= 3,
      mensaje: "Especifica el cargo del responsable." },
    { id: "pj-correo", etiqueta: "Correo del responsable",
      test: () => validarEmail(valorPJ("pj-correo")), mensaje: "Correo electrónico inválido." },
    { id: "pj-telefono", etiqueta: "Teléfono del responsable",
      test: () => validarTelefono(valorPJ("pj-telefono")),
      mensaje: "Incluye el código de área. Ejemplo: 0414-1234567." },
    { id: "pj-doc-cedula", etiqueta: "Cédula o RIF digitalizado",
      test: () => Boolean(archivoPJ("pj-doc-cedula")), mensaje: "Adjunta la cédula o el RIF digitalizado del responsable." }
  ];
}

function reglasPaso3() {
  const pw = valorPJ("pj-password");
  const pw2 = valorPJ("pj-password2");
  return [
    { id: "pj-password", etiqueta: "Contraseña",
      test: () => evaluarPassword(pw).cumplidas === 5,
      mensaje: "Debe cumplir las 5 reglas de seguridad." },
    { id: "pj-password2", etiqueta: "Confirmación de contraseña",
      test: () => pw2.length > 0 && pw === pw2, mensaje: "Las contraseñas no coinciden." },
    { id: "pj-terminos", etiqueta: "Declaración y términos",
      test: () => Boolean(valorPJ("pj-terminos")), mensaje: "Debes aceptar la declaración para enviar la solicitud." }
  ];
}

/** Valida un paso y devuelve los errores (ya marcados en pantalla). */
function validarPaso(paso) {
  const reglas = paso === 1 ? reglasPaso1() : paso === 2 ? reglasPaso2() : reglasPaso3();
  /* Una regla solo cuenta si su campo existe en pantalla con este tipo. */
  return validar(reglas.filter((r) => cajaDe(r.id))).errores;
}

/* ---------------------------- Navegación -------------------------------- */

function pintarProgreso() {
  const caja = document.getElementById("pj-progreso");
  if (!caja) return;
  caja.innerHTML = barraProgreso(pasoActual, PASOS_PJ.length, PASOS_PJ.map((p) => p.titulo));
}

function pintarStepper() {
  $$("#pj-pasos .wizard-step").forEach((b) => {
    const n = Number(b.dataset.irPaso);
    b.classList.toggle("is-active", n === pasoActual);
    b.classList.toggle("is-done", n < pasoActual);
    if (n === pasoActual) b.setAttribute("aria-current", "step");
    else b.removeAttribute("aria-current");
  });
}

function mostrarErrores(errores, paso) {
  mostrarResumenErrores(errores, `#form-pj .wizard-panel[data-paso="${paso}"]`);
  notificar(
    `Hay ${errores.length} ${errores.length === 1 ? "campo" : "campos"} por corregir en el paso ${paso}.`,
    "warning", `Paso ${paso} · ${PASOS_PJ[paso - 1].titulo}`
  );
  const primero = controlDeCampo(errores[0].id);
  primero?.focus();
  primero?.scrollIntoView({ behavior: "smooth", block: "center" });
}

function irAPaso(n, { enfocar = true } = {}) {
  const destino = Math.min(Math.max(Number(n) || 1, 1), PASOS_PJ.length);
  pasoActual = destino;

  $$("#form-pj .wizard-panel").forEach((p) => { p.hidden = Number(p.dataset.paso) !== destino; });
  document.getElementById("form-pj")?.setAttribute("data-paso", String(destino));

  pintarProgreso();
  pintarStepper();
  if (destino === 3) pintarResumenPJ();
  pintarAsidePJ();
  guardarBorradorPJ();

  const panel = document.querySelector(`#form-pj .wizard-panel[data-paso="${destino}"]`);
  panel?.scrollIntoView({ behavior: "smooth", block: "start" });
  if (enfocar) panel?.querySelector(".input, .select, .textarea")?.focus({ preventScroll: true });
}

function avanzarPaso() {
  const errores = validarPaso(pasoActual);
  if (errores.length) { mostrarErrores(errores, pasoActual); return false; }
  irAPaso(pasoActual + 1);
  return true;
}

function irAPasoDesdeStepper(n) {
  if (n <= pasoActual) { irAPaso(n); return; }
  for (let p = pasoActual; p < n; p++) {
    const errores = validarPaso(p);
    if (errores.length) { mostrarErrores(errores, p); return; }
  }
  irAPaso(n);
}

/* --------------------- Aviso de unicidad de sede ------------------------ */

function actualizarAvisoSede() {
  const aviso = document.querySelector("[data-sede-ok]");
  const caja = cajaDe("pj-sede");
  if (!aviso || !caja) return;
  const rif = rifInstitucion();
  const completo = rif && valorPJ("pj-estado") && valorPJ("pj-municipio") && valorPJ("pj-parroquia");
  const duplicada = completo && sedeDuplicada({
    rif, estado: valorPJ("pj-estado"), municipio: valorPJ("pj-municipio"), parroquia: valorPJ("pj-parroquia")
  });
  aviso.hidden = !completo || Boolean(duplicada);
  if (duplicada) {
    marcarError("pj-sede", `La sede ya está registrada (${duplicada.institucion}). Cada sede necesita su propia cuenta.`);
  } else {
    limpiarError("pj-sede");
  }
}

/* ------------------------------ Resumen -------------------------------- */

function pintarResumenPJ() {
  const caja = document.getElementById("pj-resumen");
  if (!caja) return;
  const tipo = TIPOS_INSTITUCION.find((t) => t.id === tipoActual);
  const esp = tipo ? especificacionInstitucion(tipo.id, valoresPJ()) : null;

  const filas = [];
  const push = (k, v) => filas.push([k, v || "—"]);
  const omitir = new Set(["pj-tipo-rif", "pj-numero-rif", "pj-tipo-rif-infocentro", "pj-numero-rif-infocentro"]);

  push("Tipo de institución", tipo ? `${tipo.nombre}${tipo.etiqueta ? " · " + tipo.etiqueta : ""}` : "");
  if (esp) {
    esp.visibles.forEach((c) => {
      if (omitir.has(c.id) || c.tipoArchivo || c.soloLectura) return;
      if (c.tipo === "select" && !valorPJ(c.id)) return;
      push(c.label, valorPJ(c.id));
    });
  }
  push("RIF institucional", rifInstitucion());
  push("Sede", [valorPJ("pj-estado"), valorPJ("pj-municipio"), valorPJ("pj-parroquia")].filter(Boolean).join(" / "));
  push("Responsable", [valorPJ("pj-nombres"), valorPJ("pj-apellidos")].filter(Boolean).join(" "));
  push("Cédula del responsable", valorPJ("pj-cedula"));
  push("Cargo", valorPJ("pj-cargo") === "Otro cargo (especificar)" ? valorPJ("pj-cargo-otro") : valorPJ("pj-cargo"));
  push("Correo del responsable", valorPJ("pj-correo"));

  const recaudos = esp ? esp.recaudos : [];
  const adjuntos = recaudos.filter((r) => archivoPJ(r.id)).length;

  caja.innerHTML = `
    <div class="cond-block__title">${icono("list")} Resumen de la solicitud</div>
    <dl class="summary-list" style="margin-top:var(--sp-4)">
      ${filas.map(([k, v]) => `<div class="summary-list__row"><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join("")}
    </dl>
    <div class="recaudo-status" style="margin-top:var(--sp-5)">
      <span class="badge badge--${adjuntos === recaudos.length ? "success" : "warning"}">
        ${adjuntos} de ${recaudos.length} recaudos adjuntos
      </span>
      <ul class="doc-checklist" style="margin-top:var(--sp-4)">
        ${recaudos.map((r) => `
          <li class="doc-item">
            ${icono(archivoPJ(r.id) ? "checkCircle" : "alertCircle")}
            <div><strong>${esc(r.label)}</strong><span>${r.obligatorio ? "Obligatorio" : "Opcional"}${archivoPJ(r.id) ? " · adjuntado" : " · pendiente"}</span></div>
          </li>`).join("")}
      </ul>
    </div>`;
}

/* ------------------------------- Aside ---------------------------------- */

function pintarAsidePJ() {
  const aside = document.getElementById("aside-registro");
  if (!aside) return;
  const tipo = TIPOS_INSTITUCION.find((t) => t.id === tipoActual);
  const esp = tipo ? especificacionInstitucion(tipo.id, valoresPJ()) : null;

  aside.innerHTML = `
    <div class="aside-card">
      <h3>Avance de la solicitud</h3>
      <ol class="checklist">
        ${PASOS_PJ.map((p) => `
          <li class="${p.n <= pasoActual ? "" : "is-pending"}">
            ${icono(p.n < pasoActual ? "checkCircle" : "alertCircle")}
            <span><b>Paso ${p.n}.</b> ${esc(p.titulo)}<br>
            <span class="text-xs text-muted">${esc(p.desc)}</span></span>
          </li>`).join("")}
      </ol>
    </div>

    ${tipo ? `
    <div class="aside-card aside-card--brand">
      <h3>Recaudos de ${esc(tipo.nombre)}</h3>
      <ul class="checklist checklist--onDark">
        ${(esp?.recaudos || []).map((r) => `<li>${icono("checkCircle")}<span>${esc(r.label)}${r.obligatorio ? "" : " (opcional)"}</span></li>`).join("")}
        ${(esp?.recaudos || []).length ? "" : `<li>${icono("checkCircle")}<span>Sin recaudos adicionales: el RIF lo aporta el sistema.</span></li>`}
      </ul>
    </div>` : `
    <div class="aside-card">
      <h3>Antes de empezar</h3>
      <p class="text-sm text-secondary">
        Ten a mano el RIF de la institución, la cédula del responsable y la carta o planilla de
        autorización si tu tipo de institución la exige. Los recaudos cambian según el tipo:
        el formulario te mostrará solo los tuyos.
      </p>
    </div>`}

    ${tipo?.notas?.length ? `
    <div class="aside-card">
      <h3>Reglas de ${esc(tipo.nombre)}</h3>
      <ul class="doc-checklist">
        ${tipo.notas.map((n) => `
          <li class="doc-item">${icono("info")}<div><span>${esc(n)}</span></div></li>`).join("")}
      </ul>
    </div>` : ""}

    <div class="aside-card">
      <h3>Regla de sedes</h3>
      <p class="text-sm text-secondary">
        Si tu institución tiene sedes que actúan de forma independiente, cada sede necesita su
        propia cuenta. El sistema valida que la combinación
        <b>RIF + estado + municipio + parroquia</b> no se repita.
      </p>
    </div>

    <div class="aside-card">
      <h3>Qué pasa después</h3>
      <p class="text-sm text-secondary">
        La cuenta queda en <b>proceso de verificación</b> y no podrá iniciar sesión hasta que un
        administrador de la FVRC la apruebe. Ese día recibirá sus credenciales y su código RNR y
        pasará a <b>APROBADO_INICIAL</b>; al cargar currículum, foto y recaudos del club pasará a
        <b>PERFIL_COMPLETO</b>, único estado que habilita inscribirse en eventos.
      </p>
    </div>

    <div class="legal-note">
      ${icono("shield")}
      <span>La FVRC registra en auditoría el usuario, la IP y la fecha de cada creación o cambio
      de estos datos.</span>
    </div>`;
}

/* -------------------------- Piezas de la vista -------------------------- */

function tarjetaTipo(t) {
  return `
    <button type="button" class="type-option" role="radio" aria-checked="false" aria-pressed="false"
            data-tipo-institucion="${attr(t.id)}">
      <span class="type-option__check">${icono("check")}</span>
      <span class="type-option__icon">${icono(t.icono)}</span>
      <strong>${esc(t.nombre)}</strong>
      ${t.etiqueta ? `<span class="type-option__tag">${esc(t.etiqueta)}</span>` : ""}
      <span>${esc(t.desc)}</span>
    </button>`;
}

function panelPaso(paso, contenido, pie) {
  return `
  <section class="wizard-panel" data-paso="${paso.n}" ${paso.n === 1 ? "" : "hidden"}
           aria-labelledby="pj-titulo-paso-${paso.n}">
    ${contenido}
    <div class="auth-card__foot wizard-foot">
      ${pie}
    </div>
  </section>`;
}

export function vistaPersonaJuridica() {
  /* El módulo vive entre navegaciones: el estado del asistente se reinicia en
     cada visita para que no arrastre el tipo ni el paso de la visita previa.
     `restaurarBorradorPJ()` lo repone después si hay un borrador guardado. */
  tipoActual = null;
  pasoActual = 1;
  firmaRecaudos = "";
  ultimaUniversidad = null;

  const contenido = `
    <div class="form-head">
      <div class="form-head__top">
        <div>
          <span class="eyebrow">Registro · Persona Jurídica</span>
          <h1 class="title-lg" style="margin-top:var(--sp-3)">Registra tu institución</h1>
          <p>
            El registro tiene tres pasos. Primero eliges el tipo de institución y completas sus
            datos; el formulario se adapta y te pide únicamente los campos, las reglas de RIF y
            los recaudos que aplican a tu caso. Después vienen los datos del responsable
            institucional y, al final, la seguridad de la cuenta.
          </p>
        </div>
      </div>
      <div id="pj-progreso">${barraProgreso(1, PASOS_PJ.length, PASOS_PJ.map((p) => p.titulo))}</div>
    </div>

    <form class="auth-card" id="form-pj" novalidate data-paso="1">
      <ol class="wizard-steps" id="pj-pasos" aria-label="Pasos del registro institucional">
        ${PASOS_PJ.map((p) => `
          <li>
            <button type="button" class="wizard-step" data-ir-paso="${p.n}">
              <span class="wizard-step__num">${p.n}</span>
              <span class="wizard-step__text">
                <strong>${esc(p.titulo)}</strong>
                <span>${esc(p.desc)}</span>
              </span>
            </button>
          </li>`).join("")}
      </ol>

      ${panelPaso(PASOS_PJ[0], `
        <div class="auth-card__head">
          <span class="section-title__num">A</span>
          <div>
            <h2 id="pj-titulo-paso-1">Tipo de institución</h2>
            <p>Esta selección define las reglas de negocio, los campos y los recaudos obligatorios.</p>
          </div>
        </div>
        <div class="auth-card__body">
          <div class="type-grid" role="radiogroup" aria-label="Tipo de institución" id="tipos-institucion">
            ${TIPOS_INSTITUCION.map(tarjetaTipo).join("")}
          </div>
          <div class="field" data-campo="pj-tipo">
            <span class="field__error" id="err-pj-tipo" role="alert">
              ${icono("alertCircle")}<span data-mensaje></span>
            </span>
          </div>

          <div id="bloque-tipo"></div>
          <div id="bloque-recaudos"></div>

          <div class="cond-block" style="margin-top:var(--sp-6)">
            <span class="cond-block__title">${icono("mapPin")} Ubicación y contacto institucional</span>
            <p class="text-sm text-secondary" style="margin-bottom:var(--sp-4)">
              Corresponde a la sede que estás registrando. Si la institución tiene varias sedes,
              cada una se registra por separado.
            </p>
            <div class="form-grid">
              ${campo({ id: "pj-estado", label: "Estado", tipo: "select", obligatorio: true, opciones: opcionesEstados() })}
              ${campo({ id: "pj-municipio", label: "Municipio", tipo: "select", obligatorio: true, opciones: [] })}
              ${campo({ id: "pj-parroquia", label: "Parroquia", tipo: "select", obligatorio: true, opciones: [] })}
              ${campo({ id: "pj-direccion", label: "Dirección fiscal detallada", obligatorio: true,
                        span: "col-span-2", maxlength: 250,
                        placeholder: "Av. Principal, edificio, piso, oficina, punto de referencia" })}
              ${campo({ id: "pj-correo-inst", label: "Correo institucional oficial", tipo: "email", obligatorio: true,
                        placeholder: "contacto@institucion.edu.ve", autocomplete: "email" })}
              ${campo({ id: "pj-telefono-inst", label: "Teléfono de contacto institucional", obligatorio: true,
                        placeholder: "0212-1234567" })}
              ${campo({ id: "pj-linkedin", label: "LinkedIn", obligatorio: false,
                        placeholder: "linkedin.com/company/institucion" })}
              ${campo({ id: "pj-instagram", label: "Instagram", obligatorio: false, placeholder: "@institucion" })}
            </div>
            <div class="field" data-campo="pj-sede">
              <span class="field__hint field__hint--ok" data-sede-ok hidden>
                ${icono("checkCircle")} La sede (RIF + estado + municipio + parroquia) está disponible.
              </span>
              <span class="field__error" id="err-pj-sede" role="alert">
                ${icono("alertCircle")}<span data-mensaje></span>
              </span>
            </div>
          </div>
        </div>`,
    `<span class="auth-card__foot-note">
       El avance de este paso se guarda en este navegador. No se guardan archivos ni contraseñas.
     </span>
     <div class="row">
       <a class="btn btn--ghost" href="#/registro">Cancelar</a>
       <button class="btn btn--primary btn--field" type="button" data-paso-siguiente>
         Continuar ${icono("arrowRight")}
       </button>
     </div>`)}

      ${panelPaso(PASOS_PJ[1], `
        <div class="auth-card__head">
          <span class="section-title__num">B</span>
          <div>
            <h2 id="pj-titulo-paso-2">Datos del responsable institucional</h2>
            <p>Obligatorios para todos los tipos de institución.</p>
          </div>
        </div>
        <div class="auth-card__body">
          <div class="alert alert--info">
            ${icono("info")}
            <div>
              <span class="alert__title">El responsable responde ante la FVRC</span>
              Debe ser mayor de 18 años y estar facultado para representar a la institución
              (rector, director, decano o representante legal). La FVRC verifica su cédula y su
              cargo contra el registro de la institución antes de aprobar la cuenta.
            </div>
          </div>

          <div class="form-grid" style="margin-top:var(--sp-5)">
            ${campo({ id: "pj-nombres", label: "Nombres", obligatorio: true, maxlength: 100 })}
            ${campo({ id: "pj-apellidos", label: "Apellidos", obligatorio: true, maxlength: 100 })}
            ${campo({ id: "pj-nacionalidad", label: "Nacionalidad", tipo: "select", obligatorio: true, opciones: NACIONALIDADES })}
            ${campo({ id: "pj-cedula", label: "Cédula", obligatorio: true, placeholder: "V-12345678", maxlength: 12 })}
            ${campo({ id: "pj-fecha-nacimiento", label: "Fecha de nacimiento", tipo: "date", obligatorio: true,
                      max: fechaLimiteMenor(), ayuda: "Debes ser mayor de 18 años." })}
            ${campo({ id: "pj-sexo", label: "Sexo", tipo: "select", obligatorio: true, opciones: SEXOS })}
            ${campo({ id: "pj-cargo", label: "Cargo institucional", tipo: "select", obligatorio: true,
                      opciones: CARGOS_RESPONSABLE,
                      ayuda: "Cargo con el que quedas acreditado ante la FVRC." })}
            <div id="bloque-cargo-otro" hidden>
              ${campo({ id: "pj-cargo-otro", label: "Especifica el cargo", obligatorio: true, maxlength: 80 })}
            </div>
            ${campo({ id: "pj-correo", label: "Correo electrónico", tipo: "email", obligatorio: true,
                      placeholder: "responsable@institucion.edu.ve", autocomplete: "email" })}
            ${campo({ id: "pj-telefono", label: "Teléfono", obligatorio: true, placeholder: "0414-1234567" })}
          </div>

          <div class="form-grid" style="margin-top:var(--sp-5)">
            ${campoArchivo({ id: "pj-doc-cedula", label: "Cédula o RIF digitalizado del responsable",
                             ayuda: "PNG, JPG o PDF · máximo 5 MB" })}
          </div>

          <p class="text-sm text-secondary" style="margin-top:var(--sp-5)">
            El currículum y la foto tipo carnet no se piden en este paso: se cargan al completar el
            perfil, después de que la FVRC apruebe la cuenta.
          </p>
        </div>`,
    `<span class="auth-card__foot-note">
       El correo y el teléfono del responsable son los canales oficiales de notificación.
     </span>
     <div class="row">
       <button class="btn btn--ghost" type="button" data-paso-anterior>${icono("arrowLeft")} Atrás</button>
       <button class="btn btn--primary btn--field" type="button" data-paso-siguiente>
         Continuar ${icono("arrowRight")}
       </button>
     </div>`)}

      ${panelPaso(PASOS_PJ[2], `
        <div class="auth-card__head">
          <span class="section-title__num">C</span>
          <div>
            <h2 id="pj-titulo-paso-3">Datos de seguridad</h2>
            <p>Únicos para todos los tipos de institución. Con ellos entrará el responsable.</p>
          </div>
        </div>
        <div class="auth-card__body">
          <div class="alert alert--warning">
            ${icono("lock")}
            <div>
              <span class="alert__title">La cuenta no se activa al enviar</span>
              Al finalizar, la solicitud queda <b>en proceso de verificación</b> y no podrás iniciar
              sesión hasta que un administrador de la FVRC la apruebe. Ese día recibirás por correo
              las credenciales y el código RNR de la institución.
            </div>
          </div>

          <div class="form-grid" style="margin-top:var(--sp-5)">
            ${campo({ id: "pj-password", label: "Contraseña", tipo: "password", obligatorio: true,
                      autocomplete: "new-password", extra: 'data-toggle-password="pj-password"' })}
            ${campo({ id: "pj-password2", label: "Confirmación de contraseña", tipo: "password",
                      obligatorio: true, autocomplete: "new-password" })}
            <div class="col-span-2">${bloqueMedidorPassword()}</div>
          </div>

          <div class="cond-block" id="pj-resumen" style="margin-top:var(--sp-6)"></div>

          <div class="field" data-campo="pj-terminos" style="margin-top:var(--sp-6)">
            <label class="checkline">
              <input type="checkbox" id="pj-terminos" name="pj-terminos" required>
              <span>Declaro que represento legalmente a la institución y que los datos y recaudos
              suministrados son verídicos. Acepto los <a href="#/">términos de uso</a> y la
              <a href="#/">política de tratamiento de datos</a>.</span>
            </label>
            <span class="field__error" id="err-pj-terminos" role="alert">
              ${icono("alertCircle")}<span data-mensaje></span>
            </span>
          </div>
        </div>`,
    `<span class="auth-card__foot-note">
       Cada sede se registra por separado: la combinación <b>RIF + estado + municipio + parroquia</b> es única.
     </span>
     <div class="row">
       <button class="btn btn--ghost" type="button" data-paso-anterior>${icono("arrowLeft")} Atrás</button>
       <button class="btn btn--primary btn--field" type="submit" id="btn-enviar-pj">
         Finalizar Registro ${icono("arrowRight")}
       </button>
     </div>`)}
    </form>`;

  return {
    titulo: "Registro de institución",
    html: shellRegistro(contenido, { tituloPasos: ["Registro", "Persona jurídica"] }),
    iniciar() {
      activarShell(document);
      cablearTiposInstitucion();
      cablearCascada(document, { estado: "pj-estado", municipio: "pj-municipio", parroquia: "pj-parroquia" });
      conectarMedidorPassword("pj-password", "medidor-password", "pj-password2");
      cablearArchivos(document);
      cablearNavegacionPJ();
      cablearCargoOtro();

      const form = document.getElementById("form-pj");
      form.addEventListener("submit", enviarPersonaJuridica);
      /* Delegado: cualquier cambio repinta el aviso de sede y el borrador. */
      form.addEventListener("change", () => {
        actualizarAvisoSede();
        guardarBorradorPJ();
      });

      restaurarBorradorPJ();
      pintarAsidePJ();
      actualizarAvisoSede();
    }
  };
}

/* --------------------- Selección del tipo de institución ---------------- */

function marcarTarjetaSeleccionada(id) {
  $$("#tipos-institucion [data-tipo-institucion]").forEach((b) => {
    const activo = b.dataset.tipoInstitucion === id;
    b.setAttribute("aria-pressed", String(activo));
    b.setAttribute("aria-checked", String(activo));
    b.classList.toggle("is-selected", activo);
  });
}

function seleccionarTipo(id) {
  const cambio = id !== tipoActual;
  tipoActual = id;
  marcarTarjetaSeleccionada(id);
  limpiarError("pj-tipo");
  if (cambio) {
    ultimaUniversidad = null;
    firmaRecaudos = "";
    const contenedor = document.getElementById("bloque-tipo");
    if (contenedor) contenedor.innerHTML = "";
    const recaudos = document.getElementById("bloque-recaudos");
    if (recaudos) recaudos.innerHTML = "";
  }
  pintarBloqueTipo({ conservar: !cambio });
  actualizarAvisoSede();
  guardarBorradorPJ();
  pintarAsidePJ();
}

function cablearTiposInstitucion() {
  const contenedor = document.getElementById("tipos-institucion");
  const botones = $$("[data-tipo-institucion]", contenedor);

  botones.forEach((b, i) => {
    b.addEventListener("click", () => seleccionarTipo(b.dataset.tipoInstitucion));
    /* Navegación con flechas dentro del radiogroup */
    b.addEventListener("keydown", (e) => {
      const mapa = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
      if (!(e.key in mapa)) return;
      e.preventDefault();
      const siguiente = botones[(i + mapa[e.key] + botones.length) % botones.length];
      siguiente.focus();
      seleccionarTipo(siguiente.dataset.tipoInstitucion);
    });
  });
}

function cablearNavegacionPJ() {
  $$("#form-pj [data-paso-siguiente]").forEach((b) =>
    b.addEventListener("click", () => avanzarPaso()));
  $$("#form-pj [data-paso-anterior]").forEach((b) =>
    b.addEventListener("click", () => irAPaso(pasoActual - 1)));
  $$("#pj-pasos .wizard-step").forEach((b) =>
    b.addEventListener("click", () => irAPasoDesdeStepper(Number(b.dataset.irPaso))));
}

function cablearCargoOtro() {
  const sel = document.getElementById("pj-cargo");
  const bloque = document.getElementById("bloque-cargo-otro");
  if (!sel || !bloque) return;
  const pintar = () => { bloque.hidden = sel.value !== "Otro cargo (especificar)"; };
  sel.addEventListener("change", pintar);
  pintar();
}

/* ---------------------------- Borrador ---------------------------------- */

function restaurarUbicacion(valores) {
  const estado = document.getElementById("pj-estado");
  const municipio = document.getElementById("pj-municipio");
  const parroquia = document.getElementById("pj-parroquia");
  if (!estado || !municipio || !parroquia) return;

  estado.value = valores["pj-estado"] || "";
  estado.dispatchEvent(new Event("change"));
  municipio.value = valores["pj-municipio"] || "";
  municipio.dispatchEvent(new Event("change"));
  parroquia.value = valores["pj-parroquia"] || "";
}

function restaurarBorradorPJ() {
  const datos = leerBorradorPJ();
  if (!datos?.tipo || !TIPOS_INSTITUCION.some((t) => t.id === datos.tipo)) return;

  tipoActual = datos.tipo;
  marcarTarjetaSeleccionada(tipoActual);
  pintarBloqueTipo({ conservar: false });

  const form = document.getElementById("form-pj");
  restaurarValores(form, datos.valores || {});
  sincronizarUniversidad();
  restaurarValores(form, datos.valores || {});
  restaurarUbicacion(datos.valores || {});
  cablearCargoOtro();

  notificar("Recuperamos el avance que dejaste en este navegador.", "info", "Borrador restaurado");
  irAPaso(Math.min(Math.max(Number(datos.paso) || 1, 1), PASOS_PJ.length), { enfocar: false });
}

/* --------------------- Envío: Persona Jurídica -------------------------- */

function enviarPersonaJuridica(e) {
  e.preventDefault();

  /* Dentro del asistente, «Enter» equivale a Continuar mientras no sea el
     último paso. */
  if (pasoActual < PASOS_PJ.length) { avanzarPaso(); return; }

  limpiarTodosLosErrores(document);

  for (const paso of [1, 2, 3]) {
    const errores = validarPaso(paso);
    if (errores.length) {
      irAPaso(paso);
      mostrarErrores(errores, paso);
      return;
    }
  }

  const boton = document.getElementById("btn-enviar-pj");
  boton.classList.add("is-loading");
  boton.disabled = true;

  const tipo = TIPOS_INSTITUCION.find((t) => t.id === tipoActual);
  const esp = especificacionInstitucion(tipoActual, valoresPJ());
  const recaudos = esp ? esp.recaudos.filter((r) => r.obligatorio).length : 0;
  const rif = rifInstitucion();

  setTimeout(() => {
    boton.classList.remove("is-loading");
    boton.disabled = false;
    limpiarBorradorPJ();
    mostrarExito({
      titulo: "Solicitud institucional enviada",
      nombre: valorPJ("pj-razon-social") || tipo.nombre,
      correo: valorPJ("pj-correo"),
      perfil: tipo.nombre,
      siguiente: [
        ["Verificación de recaudos",
          `La FVRC valida el RIF ${rif}, los ${recaudos} recaudos obligatorios de ${tipo.nombre} y la unicidad de la sede (RIF + ubicación).`],
        ["Aprobación de la cuenta",
          "Al aprobarse, el responsable recibe por correo sus credenciales y el código RNR de la institución."],
        ["Completar perfil",
          "El responsable carga currículum, foto tipo carnet y los recaudos del club: la cuenta pasa a PERFIL_COMPLETO."],
        ["Operar",
          "Ya puede registrar tutores, crear clubes, formar equipos e inscribirlos en eventos."]
      ]
    });
  }, 1200);
}

/* =========================================================================
   10. Pantalla de éxito compartida
   ======================================================================= */
export function mostrarExito({ titulo, nombre, correo, perfil, siguiente }) {
  const pasos = siguiente.map(([t, d], i) => `
    <li class="timeline__item ${i === 0 ? "is-current" : ""}">
      <span class="timeline__rail">
        <span class="timeline__dot">${i === 0 ? icono("clock") : icono("check")}</span>
        ${i < siguiente.length - 1 ? '<span class="timeline__line"></span>' : ""}
      </span>
      <span class="timeline__body">
        <strong>${esc(t)}</strong>
        <span>${esc(d)}</span>
      </span>
    </li>`).join("");

  document.getElementById("app").innerHTML = `
  <div class="auth-shell">
    <header class="auth-topbar">
      <a class="brand" href="#/">
        <span class="brand__mark"><img src="assets/img/fvrc-logo-256.png" width="256" height="256" alt="Escudo FVRC"></span>
        <span class="brand__text"><span class="brand__name">FVRC</span><span class="brand__tag">Robótica Creativa</span></span>
      </a>
      <nav class="auth-topbar__help"><a href="#/">${icono("arrowLeft")} <span class="hide-sm">Ir a la portada</span></a></nav>
    </header>
    <main class="auth-main" id="contenido">
      <div class="container">
        <div class="success-wrap">
          <span class="success-icon">${icono("checkCircle")}</span>
          <h1>${esc(titulo)}</h1>
          <p>
            Gracias${nombre ? `, <b>${esc(nombre)}</b>` : ""}. Tu solicitud quedó registrada con el perfil
            <b>${esc(perfil)}</b> y ahora se encuentra en <b>proceso de verificación</b> por parte de la FVRC.
          </p>

          <div class="alert alert--info" style="margin-top:var(--sp-6);text-align:left">
            ${icono("mail")}
            <div>
              <span class="alert__title">En proceso de verificación</span>
              Tus datos y recaudos están siendo revisados por la FVRC. Una vez aprobada la cuenta,
              recibirás un correo con tus credenciales de acceso y tu código RNR único.
            </div>
          </div>

          <div class="alert alert--info" style="margin-top:var(--sp-6);text-align:left">
            ${icono("mail")}
            <div>
              <span class="alert__title">Revisa tu correo: ${esc(correo)}</span>
              Cuando la cuenta sea aprobada recibirás un mensaje con tus credenciales de acceso.
              Si no lo ves en unos minutos, revisa la carpeta de spam.
            </div>
          </div>

          <ol class="timeline">${pasos}</ol>

          <div class="hero__ctas" style="justify-content:center;margin-top:var(--sp-8)">
            <a class="btn btn--primary btn--lg" href="#/">${icono("arrowLeft")} Volver a la portada</a>
            <a class="btn btn--outline btn--lg" href="#/">${icono("book")} Ver actividades disponibles</a>
          </div>

          <p class="text-xs text-muted" style="margin-top:var(--sp-6)">
            ¿Necesitas corregir algún dato? Escríbenos a <b>soporte@fvrc.org.ve</b> indicando el correo con el que te registraste.
          </p>
        </div>
      </div>
    </main>
  </div>`;

  document.querySelector("[data-copiar-rnr]")?.addEventListener("click", (e) => {
    const texto = e.currentTarget.dataset.copiarRnr;
    navigator.clipboard?.writeText(texto)
      .then(() => notificar("Código RNR copiado al portapapeles.", "success"))
      .catch(() => notificar("No se pudo copiar el código.", "warning"));
  });
}
