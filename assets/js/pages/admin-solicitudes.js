/* ============================================================================
   PNRC · Vista Admin — Cola de verificación / Aprobación de solicitudes
   Administrador Central y Administrador Regional
   ============================================================================ */

import { icono } from "../icons.js";
import {
  $, $$, esc, attr, notificar, activarShell, limpiarAlSalir, navegar
} from "../app.js";
import { obtenerSesion, STATS_ADMIN } from "../data.js";

/* ── Datos demo de solicitudes ──────────────────────────────────────────── */
const SOLICITUDES_DEMO = [
  {
    id: "sol-001", tipo: "Persona Natural", nombre: "Carlos Mendoza", cedula: "V-18.540.210",
    correo: "carlos.mendoza@email.com", estado: "PENDIENTE", fecha: "2026-10-06",
    estadoVzla: "Anzoátegui", municipio: "Sotillo", perfil: "Tutor",
    docs: ["Cédula digitalizada"],
    nota: ""
  },
  {
    id: "sol-002", tipo: "Inst. Educativa · Pública", nombre: "U.E. Nacional Bolivariana",
    cedula: "G-20000009-0", correo: "ue.bolivariana@mppe.gob.ve", estado: "PENDIENTE",
    fecha: "2026-10-06", estadoVzla: "Miranda", municipio: "Sucre", perfil: "Institución",
    docs: ["Código MPPE", "RIF MPPE", "Planilla FVRC firmada"],
    nota: ""
  },
  {
    id: "sol-003", tipo: "Infocentro", nombre: "Infocentro El Tigre",
    cedula: "G-20007728-0", correo: "infocentro.eltigre@cit.gob.ve", estado: "PENDIENTE",
    fecha: "2026-10-05", estadoVzla: "Anzoátegui", municipio: "Simón Rodríguez", perfil: "Institución",
    docs: ["Código Infocentro", "Carta de Designación"],
    nota: ""
  },
  {
    id: "sol-004", tipo: "Universidad", nombre: "Universidad Nororiental Privada",
    cedula: "J-30145222-5", correo: "rectorado@unorpri.edu.ve", estado: "EN_REVISION",
    fecha: "2026-10-05", estadoVzla: "Bolívar", municipio: "Caroní", perfil: "Institución",
    docs: ["RIF Institucional", "Planilla autorización club", "Cédula responsable"],
    nota: "Pendiente confirmar facultad de Ingeniería."
  },
  {
    id: "sol-005", tipo: "Inst. Privada", nombre: "Fundación CreaTech",
    cedula: "J-40123887-1", correo: "info@createch.org.ve", estado: "EN_REVISION",
    fecha: "2026-10-04", estadoVzla: "Carabobo", municipio: "Valencia", perfil: "Institución",
    docs: ["RIF Institucional", "Planilla autorización"],
    nota: ""
  },
  {
    id: "sol-006", tipo: "Persona Natural", nombre: "Laura Jiménez",
    cedula: "V-22.318.940", correo: "laura.jimenez@gmail.com", estado: "APROBADO",
    fecha: "2026-10-03", estadoVzla: "Carabobo", municipio: "Valencia", perfil: "Tutor",
    docs: ["Cédula digitalizada"],
    nota: ""
  },
  {
    id: "sol-007", tipo: "Inst. Educativa · Pública", nombre: "Liceo Bolivariano Andrés Bello",
    cedula: "G-20000009-0", correo: "liceo.andresbello@mppe.gob.ve", estado: "RECHAZADO",
    fecha: "2026-10-02", estadoVzla: "Táchira", municipio: "San Cristóbal", perfil: "Institución",
    docs: ["Código MPPE"],
    nota: "Faltan: Planilla FVRC firmada y sellada por la dirección, resolución de acreditación del director."
  },
  {
    id: "sol-008", tipo: "Persona Natural", nombre: "Miguel Torres",
    cedula: "V-14.778.021", correo: "miguel.torres@email.com", estado: "PENDIENTE",
    fecha: "2026-10-06", estadoVzla: "Zulia", municipio: "Maracaibo", perfil: "Aspirante a Federado",
    docs: ["Cédula digitalizada"],
    nota: ""
  }
];

/* ── Estado local mutable (simulación sin backend) ──────────────────────── */
const estado = { lista: SOLICITUDES_DEMO.map(s => ({ ...s })), filtro: "TODOS", busqueda: "" };

/* =========================================================================
   Punto de entrada
   ========================================================================= */
export function vistaAdminSolicitudes() {
  const sesion = obtenerSesion();
  if (!sesion || sesion.rol !== "Administrador Central") {
    return {
      titulo: "Acceso restringido",
      html: htmlAccesoDenegado(),
      iniciar() { activarShell(document); }
    };
  }
  return {
    titulo: "Verificación de solicitudes · Admin FVRC",
    html: htmlShell(sesion),
    iniciar() { iniciarVista(sesion); }
  };
}

/* =========================================================================
   HTML principal
   ========================================================================= */
function htmlShell(s) {
  return `
  <a class="skip-link" href="#contenido">Saltar al contenido principal</a>
  ${cabeceraAdmin(s)}
  <div class="dashboard-layout" id="contenido">
    ${sidebarAdmin(s)}
    <main class="dash-main">

      <!-- Encabezado de sección -->
      <header class="dash-header">
        <div>
          <p class="eyebrow">Administración · FVRC</p>
          <h1>Cola de Verificaciones</h1>
          <p class="text-secondary" style="margin-top:var(--sp-1)">
            Revisa, aprueba o rechaza solicitudes de registro pendientes.
          </p>
        </div>
        <div class="dash-header__actions">
          <button class="btn btn--outline" id="btn-exportar">
            ${icono("download")} Exportar
          </button>
        </div>
      </header>

      <!-- KPIs rápidos -->
      <section class="dash-kpis" aria-label="Resumen de cola">
        ${kpiSol("inbox",    "Pendientes",   contarPor("PENDIENTE"),   "brand")}
        ${kpiSol("search",   "En revisión",  contarPor("EN_REVISION"), "warning")}
        ${kpiSol("check",    "Aprobados",    contarPor("APROBADO"),    "success")}
        ${kpiSol("xCircle",  "Rechazados",   contarPor("RECHAZADO"),   "neutral")}
      </section>

      <!-- Barra de filtros -->
      <div class="dash-card">
        <div class="dash-card__head" style="flex-wrap:wrap;gap:var(--sp-3)">
          <h2 class="dash-card__head-title" style="margin:0">
            ${icono("inbox")} Solicitudes de registro
          </h2>
          <div class="row row--wrap" style="gap:var(--sp-3);margin-left:auto">
            <div class="control-wrap" style="min-width:220px">
              <input class="input input--prefix" id="buscar-sol" type="search"
                     placeholder="Buscar nombre, cédula, correo…" autocomplete="off">
              <span class="input-affix input-affix--left">${icono("search")}</span>
            </div>
            <select class="select" id="filtro-estado-sol" style="min-width:160px">
              <option value="TODOS">Todos los estados</option>
              <option value="PENDIENTE">Pendiente</option>
              <option value="EN_REVISION">En revisión</option>
              <option value="APROBADO">Aprobado</option>
              <option value="RECHAZADO">Rechazado</option>
            </select>
            <select class="select" id="filtro-tipo-sol" style="min-width:180px">
              <option value="TODOS">Todos los tipos</option>
              <option value="Persona Natural">Persona Natural</option>
              <option value="Institución">Institución</option>
            </select>
          </div>
        </div>
        <div class="dash-card__body" style="padding:0">
          <div id="tabla-solicitudes-wrap">
            ${renderTabla(estado.lista)}
          </div>
        </div>
      </div>

    </main>
  </div>
  ${navMovilAdmin()}

  <!-- Modal de detalle / acción -->
  <div class="modal" id="modal-solicitud" role="dialog" aria-modal="true"
       aria-labelledby="modal-sol-titulo">
    <div class="modal__panel modal__panel--wide" id="modal-sol-panel">
      <!-- Contenido se inyecta dinámicamente -->
    </div>
  </div>`;
}

/* ── Tabla de solicitudes ───────────────────────────────────────────────── */
function renderTabla(lista) {
  if (!lista.length) {
    return `<div class="dash-empty" style="padding:var(--sp-10) var(--sp-6)">
      ${icono("inbox")}
      <p>No hay solicitudes que coincidan con los filtros.</p>
    </div>`;
  }

  return `
  <div class="table-scroll">
    <table class="data-table" id="tabla-solicitudes">
      <thead>
        <tr>
          <th>Solicitante</th>
          <th>Tipo</th>
          <th>Estado / Ubicación</th>
          <th>Fecha</th>
          <th>Estado</th>
          <th style="text-align:right">Acciones</th>
        </tr>
      </thead>
      <tbody>
        ${lista.map(filaTabla).join("")}
      </tbody>
    </table>
  </div>`;
}

function filaTabla(s) {
  const badgeCl = { PENDIENTE: "warning", EN_REVISION: "info", APROBADO: "success", RECHAZADO: "danger" };
  const cl = badgeCl[s.estado] || "neutral";
  return `
  <tr data-id="${attr(s.id)}">
    <td>
      <div style="display:flex;flex-direction:column;gap:2px;min-width:160px">
        <strong style="font-size:var(--fs-sm)">${esc(s.nombre)}</strong>
        <span class="text-xs text-muted">${esc(s.cedula)}</span>
        <span class="text-xs text-muted">${esc(s.correo)}</span>
      </div>
    </td>
    <td>
      <div style="display:flex;flex-direction:column;gap:4px">
        <span class="badge badge--neutral badge--sm">${esc(s.tipo)}</span>
        <span class="text-xs text-muted">${esc(s.perfil)}</span>
      </div>
    </td>
    <td class="text-sm text-secondary">${esc(s.estadoVzla)}, ${esc(s.municipio)}</td>
    <td class="text-sm text-muted">${esc(s.fecha)}</td>
    <td><span class="badge badge--${cl} badge--sm badge--dot">${esc(s.estado.replace("_", " "))}</span></td>
    <td>
      <div style="display:flex;gap:var(--sp-2);justify-content:flex-end;flex-wrap:wrap">
        <button class="btn btn--ghost btn--sm" data-ver="${attr(s.id)}">
          ${icono("eye")} Ver
        </button>
        ${s.estado === "PENDIENTE" || s.estado === "EN_REVISION" ? `
          <button class="btn btn--primary btn--sm" data-aprobar="${attr(s.id)}">
            ${icono("check")} Aprobar
          </button>
          <button class="btn btn--danger btn--sm" data-rechazar="${attr(s.id)}">
            ${icono("xCircle")} Rechazar
          </button>` : ""}
      </div>
    </td>
  </tr>`;
}

/* ── Modal de detalle ───────────────────────────────────────────────────── */
function htmlModalDetalle(s) {
  const badgeCl = { PENDIENTE: "warning", EN_REVISION: "info", APROBADO: "success", RECHAZADO: "danger" };
  const cl = badgeCl[s.estado] || "neutral";

  return `
  <div class="modal__head">
    <div style="display:flex;flex-direction:column;gap:var(--sp-2)">
      <h2 class="modal__title" id="modal-sol-titulo">Solicitud de Registro</h2>
      <span class="badge badge--${cl}">${esc(s.estado.replace("_", " "))}</span>
    </div>
    <button class="btn btn--ghost btn--icon" id="cerrar-modal-sol" aria-label="Cerrar">
      ${icono("x")}
    </button>
  </div>
  <div class="modal__body">

    <!-- Datos del solicitante -->
    <div class="aside-card" style="margin-bottom:var(--sp-5)">
      <h3>Datos del solicitante</h3>
      <dl class="summary-list">
        <div class="summary-list__row"><dt>Nombre / Razón social</dt><dd>${esc(s.nombre)}</dd></div>
        <div class="summary-list__row"><dt>Cédula / RIF</dt><dd class="mono">${esc(s.cedula)}</dd></div>
        <div class="summary-list__row"><dt>Correo</dt><dd>${esc(s.correo)}</dd></div>
        <div class="summary-list__row"><dt>Tipo</dt><dd>${esc(s.tipo)}</dd></div>
        <div class="summary-list__row"><dt>Perfil solicitado</dt><dd>${esc(s.perfil)}</dd></div>
        <div class="summary-list__row"><dt>Ubicación</dt><dd>${esc(s.estadoVzla)}, ${esc(s.municipio)}</dd></div>
        <div class="summary-list__row"><dt>Fecha de solicitud</dt><dd>${esc(s.fecha)}</dd></div>
      </dl>
    </div>

    <!-- Documentos adjuntos -->
    <div class="aside-card" style="margin-bottom:var(--sp-5)">
      <h3>Documentos adjuntos</h3>
      <div class="doc-checklist">
        ${s.docs.map(d => `
          <div class="doc-item">
            ${icono("fileText")}
            <div>
              <strong>${esc(d)}</strong>
              <span>Simulado · Prototipo visual</span>
            </div>
            <span class="badge badge--success badge--sm" style="margin-left:auto">Cargado</span>
          </div>`).join("")}
      </div>
    </div>

    <!-- Nota interna (si hay) -->
    ${s.nota ? `
    <div class="alert alert--warning" style="margin-bottom:var(--sp-5)">
      ${icono("alert")}
      <div><span class="alert__title">Nota interna</span>${esc(s.nota)}</div>
    </div>` : ""}

    <!-- Motivo de rechazo (solo si aún está pendiente/en revisión) -->
    ${(s.estado === "PENDIENTE" || s.estado === "EN_REVISION") ? `
    <div class="field" id="campo-motivo-rechazo" style="display:none">
      <label class="field__label" for="motivo-rechazo">
        Motivo de rechazo <span class="field__req">*</span>
      </label>
      <textarea class="textarea" id="motivo-rechazo" rows="3"
        placeholder="Describe claramente por qué se rechaza la solicitud y qué documentos faltan…"
        maxlength="500"></textarea>
      <span class="field__hint">Máximo 500 caracteres. Este mensaje se envía al solicitante.</span>
      <span class="field__error" role="alert"><span data-mensaje></span></span>
    </div>` : ""}

  </div>

  ${(s.estado === "PENDIENTE" || s.estado === "EN_REVISION") ? `
  <div class="modal__foot">
    <button class="btn btn--ghost" id="modal-btn-cerrar">Cancelar</button>
    <button class="btn btn--danger" id="modal-btn-rechazar" data-id="${attr(s.id)}">
      ${icono("xCircle")} Rechazar solicitud
    </button>
    <button class="btn btn--primary" id="modal-btn-aprobar" data-id="${attr(s.id)}">
      ${icono("check")} Aprobar y activar cuenta
    </button>
  </div>` : `
  <div class="modal__foot">
    <button class="btn btn--ghost" id="modal-btn-cerrar">Cerrar</button>
  </div>`}`;
}

/* =========================================================================
   Inicialización de interacciones
   ========================================================================= */
function iniciarVista(sesion) {
  activarShell(document);

  const wrap = () => $("#tabla-solicitudes-wrap");
  const modal = $("#modal-solicitud");

  /* ── Actualizar tabla ──────────────────────────────────────────────── */
  function actualizarTabla() {
    const txt = ($("#buscar-sol")?.value || "").toLowerCase().trim();
    const filtroEst = $("#filtro-estado-sol")?.value || "TODOS";
    const filtroTip = $("#filtro-tipo-sol")?.value || "TODOS";

    const lista = estado.lista.filter(s => {
      const okEst = filtroEst === "TODOS" || s.estado === filtroEst;
      const okTip = filtroTip === "TODOS" ||
        (filtroTip === "Persona Natural" ? s.tipo === "Persona Natural" : s.tipo !== "Persona Natural");
      const okTxt = !txt || [s.nombre, s.cedula, s.correo, s.estadoVzla].some(v => v.toLowerCase().includes(txt));
      return okEst && okTip && okTxt;
    });

    wrap().innerHTML = renderTabla(lista);
    registrarEventosTabla();
  }

  /* ── Eventos de búsqueda y filtros ────────────────────────────────── */
  let timer;
  $("#buscar-sol")?.addEventListener("input", () => { clearTimeout(timer); timer = setTimeout(actualizarTabla, 180); });
  $("#filtro-estado-sol")?.addEventListener("change", actualizarTabla);
  $("#filtro-tipo-sol")?.addEventListener("change", actualizarTabla);

  /* ── Exportar (simulado) ───────────────────────────────────────────── */
  $("#btn-exportar")?.addEventListener("click", () => {
    notificar("Exportación en formato CSV generada correctamente (simulado).", "success", "Exportar datos");
  });

  /* ── Acciones desde tabla ──────────────────────────────────────────── */
  function registrarEventosTabla() {
    /* Ver detalle */
    $$("[data-ver]", wrap()).forEach(btn => {
      btn.addEventListener("click", () => abrirDetalle(btn.dataset.ver));
    });
    /* Aprobar directo */
    $$("[data-aprobar]", wrap()).forEach(btn => {
      btn.addEventListener("click", () => aprobarSolicitud(btn.dataset.aprobar));
    });
    /* Rechazar directo */
    $$("[data-rechazar]", wrap()).forEach(btn => {
      btn.addEventListener("click", () => abrirRechazo(btn.dataset.rechazar));
    });
  }

  registrarEventosTabla();

  /* ── Modal helpers ─────────────────────────────────────────────────── */
  function abrirModal(contenido) {
    $("#modal-sol-panel").innerHTML = contenido;
    modal.classList.add("is-open");
    document.body.style.overflow = "hidden";

    $("#cerrar-modal-sol")?.addEventListener("click", cerrarModal);
    $("#modal-btn-cerrar")?.addEventListener("click", cerrarModal);

    /* Aprobar desde modal */
    $("#modal-btn-aprobar")?.addEventListener("click", () => {
      aprobarSolicitud($("#modal-btn-aprobar").dataset.id);
    });

    /* Rechazar desde modal: 1ª pulsación muestra campo, 2ª confirma */
    const btnRech = $("#modal-btn-rechazar");
    if (btnRech) {
      btnRech.addEventListener("click", () => {
        const campo = $("#campo-motivo-rechazo");
        const textarea = $("#motivo-rechazo");
        if (campo.style.display === "none") {
          campo.style.display = "";
          textarea.focus();
          btnRech.innerHTML = `${icono("xCircle")} Confirmar rechazo`;
          btnRech.classList.add("btn--danger");
        } else {
          if (!textarea.value.trim()) {
            const err = campo.querySelector("[data-mensaje]");
            if (err) err.textContent = "El motivo de rechazo es obligatorio.";
            campo.querySelector(".field__error").style.display = "flex";
            textarea.focus();
            return;
          }
          rechazarSolicitud(btnRech.dataset.id, textarea.value.trim());
        }
      });
    }
  }

  function cerrarModal() {
    modal.classList.remove("is-open");
    document.body.style.overflow = "";
    setTimeout(() => { $("#modal-sol-panel").innerHTML = ""; }, 320);
  }

  function abrirDetalle(id) {
    const sol = estado.lista.find(s => s.id === id);
    if (!sol) return;
    abrirModal(htmlModalDetalle(sol));
  }

  function abrirRechazo(id) {
    abrirDetalle(id);
    /* Abrir directamente el campo motivo */
    setTimeout(() => {
      const campo = $("#campo-motivo-rechazo");
      if (campo) {
        campo.style.display = "";
        $("#motivo-rechazo")?.focus();
        const btnRech = $("#modal-btn-rechazar");
        if (btnRech) btnRech.innerHTML = `${icono("xCircle")} Confirmar rechazo`;
      }
    }, 60);
  }

  /* ── Acciones de negocio ───────────────────────────────────────────── */
  function aprobarSolicitud(id) {
    const idx = estado.lista.findIndex(s => s.id === id);
    if (idx === -1) return;
    estado.lista[idx].estado = "APROBADO";
    notificar(
      `"${estado.lista[idx].nombre}" fue aprobado. Se enviará correo con credenciales y código RNR.`,
      "success", "Solicitud aprobada"
    );
    cerrarModal();
    actualizarTabla();
    actualizarKPIs();
  }

  function rechazarSolicitud(id, motivo) {
    const idx = estado.lista.findIndex(s => s.id === id);
    if (idx === -1) return;
    estado.lista[idx].estado = "RECHAZADO";
    estado.lista[idx].nota = motivo;
    notificar(
      `"${estado.lista[idx].nombre}" fue rechazado. Se notificará al solicitante con el motivo indicado.`,
      "warning", "Solicitud rechazada"
    );
    cerrarModal();
    actualizarTabla();
    actualizarKPIs();
  }

  function actualizarKPIs() {
    const kpis = document.querySelectorAll(".dash-kpis .kpi-card");
    const vals = [
      contarPor("PENDIENTE"),
      contarPor("EN_REVISION"),
      contarPor("APROBADO"),
      contarPor("RECHAZADO")
    ];
    kpis.forEach((k, i) => {
      const valEl = k.querySelector(".kpi-card__value");
      if (valEl && vals[i] !== undefined) valEl.textContent = String(vals[i]);
    });
  }

  /* ── Cerrar modal con Escape ───────────────────────────────────────── */
  function onKeydown(e) { if (e.key === "Escape") cerrarModal(); }
  document.addEventListener("keydown", onKeydown);
  limpiarAlSalir(() => document.removeEventListener("keydown", onKeydown));
}

/* =========================================================================
   Helpers
   ========================================================================= */
function contarPor(est) {
  return estado.lista.filter(s => s.estado === est).length;
}

function kpiSol(glifo, label, valor, color) {
  return `
  <div class="kpi-card kpi-card--${color}">
    <div class="kpi-card__icon">${icono(glifo)}</div>
    <div class="kpi-card__body">
      <span class="kpi-card__value">${valor}</span>
      <span class="kpi-card__label">${esc(label)}</span>
    </div>
  </div>`;
}

/* ── Cabecera, sidebar y nav móvil (se reutilizan en ambas vistas admin) ─ */
export function cabeceraAdmin(s) {
  return `
  <header class="site-header site-header--auth" id="header">
    <div class="site-header__inner">
      <a class="brand" href="#/dashboard" aria-label="FVRC · Panel admin">
        <span class="brand__mark">
          <img src="assets/img/fvrc-logo-256.png" width="42" height="42" alt="Escudo FVRC">
        </span>
        <span class="brand__text">
          <span class="brand__name">FVRC</span>
          <span class="brand__tag">Administración Central</span>
        </span>
      </a>
      <div class="header-spacer"></div>
      <div class="header-actions">
        <button class="btn btn--ghost btn--icon" data-tema
          title="Cambiar tema" aria-label="Cambiar entre tema claro y oscuro">
          ${icono("moon")}
        </button>
        <a href="#/dashboard" class="btn btn--ghost btn--icon btn--notif"
          aria-label="${STATS_ADMIN.solicitudesVerificacion} solicitudes pendientes">
          ${icono("bell")}
          <span class="notif-dot" aria-hidden="true">${STATS_ADMIN.solicitudesVerificacion}</span>
        </a>
        <div class="header-user" style="display:flex;align-items:center;gap:var(--sp-2)">
          <span class="avatar avatar--sm avatar--admin">${icono("escudo")}</span>
          <span class="header-user__name">Admin FVRC</span>
        </div>
        <a href="#/dashboard" class="btn btn--ghost btn--sm">
          ${icono("home")} Panel
        </a>
      </div>
    </div>
  </header>`;
}

export function sidebarAdmin(s) {
  const ruta = window.location.hash;
  const activo = (r) => ruta.includes(r) ? "is-active" : "";
  return `
  <aside class="dash-sidebar" aria-label="Menú administración">
    <div class="dash-sidebar__avatar">
      <span class="avatar avatar--lg avatar--admin">${icono("escudo")}</span>
      <div>
        <strong>Admin Central</strong>
        <span class="badge badge--brand badge--sm">FVRC</span>
      </div>
    </div>
    <nav class="dash-nav" aria-label="Secciones de administración">
      <a class="dash-nav__item ${activo("dashboard")}" href="#/dashboard">
        ${icono("home")}<span>Panel general</span>
      </a>
      <a class="dash-nav__item ${activo("solicitudes")}" href="#/admin/solicitudes">
        ${icono("inbox")}<span>Solicitudes</span>
        <span class="dash-nav__badge">${STATS_ADMIN.solicitudesVerificacion}</span>
      </a>
      <a class="dash-nav__item ${activo("usuarios")}" href="#/admin/usuarios">
        ${icono("users")}<span>Usuarios</span>
      </a>
      <a class="dash-nav__item ${activo("clubes")}" href="#/admin/clubes">
        ${icono("escudo")}<span>Clubes</span>
      </a>
      <a class="dash-nav__item ${activo("actividades")}" href="#/admin/actividades">
        ${icono("calendar")}<span>Eventos y actividades</span>
      </a>
      <a class="dash-nav__item ${activo("reportes")}" href="#/admin/reportes">
        ${icono("grafico")}<span>Reportes</span>
      </a>
    </nav>
  </aside>`;
}

export function navMovilAdmin() {
  return `
  <nav class="dash-mobile-nav" aria-label="Navegación (móvil)">
    <a class="dash-mobile-nav__item" href="#/dashboard">${icono("home")}<span>Panel</span></a>
    <a class="dash-mobile-nav__item is-active" href="#/admin/solicitudes">${icono("inbox")}<span>Solicitudes</span></a>
    <a class="dash-mobile-nav__item" href="#/admin/usuarios">${icono("users")}<span>Usuarios</span></a>
    <a class="dash-mobile-nav__item" href="#/admin/actividades">${icono("calendar")}<span>Eventos</span></a>
    <a class="dash-mobile-nav__item" href="#/admin/reportes">${icono("grafico")}<span>Reportes</span></a>
  </nav>`;
}

function htmlAccesoDenegado() {
  return `
  <main id="contenido" class="container section center">
    <span class="icon-square" style="width:64px;height:64px;margin:0 auto var(--sp-6)">${icono("lock")}</span>
    <h1 class="title-lg">Acceso restringido</h1>
    <p class="lede mx-auto" style="margin-top:var(--sp-4)">
      Esta sección requiere el rol de Administrador Central.
    </p>
    <div class="hero__ctas" style="justify-content:center;margin-top:var(--sp-8)">
      <a class="btn btn--primary btn--lg" href="#/login">Iniciar sesión ${icono("arrowRight")}</a>
      <a class="btn btn--outline btn--lg" href="#/">Volver al inicio</a>
    </div>
  </main>`;
}
