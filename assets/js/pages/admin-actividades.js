/* ============================================================================
   PNRC · Vista Admin — Gestión de Eventos y Actividades
   Crear evento, listar, editar estado y crear actividades hijas
   ============================================================================ */

import { icono } from "../icons.js";
import {
  $, $$, esc, attr, notificar, activarShell, limpiarAlSalir
} from "../app.js";
import { obtenerSesion, ACTIVIDADES } from "../data.js";
import {
  cabeceraAdmin, sidebarAdmin, navMovilAdmin
} from "./admin-solicitudes.js";

/* ── Catálogos ──────────────────────────────────────────────────────────── */
const TIPOS_ACTIVIDAD = [
  "Competición", "Curso", "Taller", "Conferencia", "Foro",
  "Práctica", "Feria", "Exhibición", "Ceremonia", "Evaluación", "Demostración"
];

const MODALIDADES_PART = ["Individual", "Grupal", "Mixta"];
const FORMATOS_ACT     = ["Presencial", "Virtual", "Mixta"];

const AMBITOS_EVENTO = [
  { val: "LOCAL",        label: "Local"         },
  { val: "REGIONAL",     label: "Regional"      },
  { val: "ESTADAL",      label: "Estadal"       },
  { val: "NACIONAL",     label: "Nacional"      },
  { val: "INTERNACIONAL",label: "Internacional" }
];

const ESTADOS_VZLA = [
  "Amazonas","Anzoátegui","Apure","Aragua","Barinas","Bolívar","Carabobo",
  "Cojedes","Delta Amacuro","Distrito Capital","Falcón","Guárico","Lara",
  "Mérida","Miranda","Monagas","Nueva Esparta","Portuguesa","Sucre",
  "Táchira","Trujillo","Vargas","Yaracuy","Zulia"
];

/* ── Estado local (sin backend) ─────────────────────────────────────────── */
const localState = {
  /* Eventos demo creados durante la sesión */
  eventosCreados: [],
  /* Copia de actividades FVRC existentes para mostrar */
  lista: [
    {
      id: "evt-001", nombre: "Olimpiada Nacional de Robótica Creativa 2026",
      ambito: "NACIONAL", formato: "Presencial", estado: "PUBLICADO",
      fechaInicio: "2026-11-14", fechaFin: "2026-11-16",
      lugar: "Caracas, Distrito Capital",
      actividades: 6, inscritos: 214
    },
    {
      id: "evt-002", nombre: "Feria Regional de Robótica Zulia",
      ambito: "REGIONAL", formato: "Presencial", estado: "PUBLICADO",
      fechaInicio: "2026-10-25", fechaFin: "2026-10-26",
      lugar: "Maracaibo, Zulia",
      actividades: 3, inscritos: 88
    },
    {
      id: "evt-003", nombre: "Taller de Arduino e IoT — Anzoátegui",
      ambito: "ESTADAL", formato: "Presencial", estado: "BORRADOR",
      fechaInicio: "2026-10-30", fechaFin: "2026-10-30",
      lugar: "Barcelona, Anzoátegui",
      actividades: 1, inscritos: 0
    },
    {
      id: "evt-004", nombre: "Congreso Virtual de Inteligencia Artificial",
      ambito: "NACIONAL", formato: "Virtual", estado: "PUBLICADO",
      fechaInicio: "2026-09-20", fechaFin: "2026-09-21",
      lugar: "En línea",
      actividades: 4, inscritos: 312
    }
  ],
  filtro: "TODOS",
  vistaActual: "lista"   /* "lista" | "nuevo-evento" | "nueva-actividad" */
};

/* =========================================================================
   Punto de entrada
   ========================================================================= */
export function vistaAdminActividades() {
  const sesion = obtenerSesion();
  if (!sesion || sesion.rol !== "Administrador Central") {
    return {
      titulo: "Acceso restringido",
      html: `<main id="contenido" class="container section center">
        <h1>Acceso restringido</h1>
        <a class="btn btn--primary" href="#/login">Iniciar sesión</a>
      </main>`,
      iniciar() { activarShell(document); }
    };
  }
  return {
    titulo: "Gestión de Eventos · Admin FVRC",
    html: htmlShell(sesion),
    iniciar() { iniciarVista(sesion); }
  };
}

/* =========================================================================
   HTML principal
   ========================================================================= */
function htmlShell(s) {
  return `
  <a class="skip-link" href="#contenido">Saltar al contenido</a>
  ${cabeceraAdmin(s)}
  <div class="dashboard-layout" id="contenido">
    ${sidebarAdmin(s)}
    <main class="dash-main" id="admin-act-main">
      ${renderVista()}
    </main>
  </div>
  ${navMovilAdmin()}

  <!-- Modal crear / editar actividad hija -->
  <div class="modal" id="modal-actividad" role="dialog" aria-modal="true"
       aria-labelledby="modal-act-titulo">
    <div class="modal__panel modal__panel--wide" id="modal-act-panel"></div>
  </div>

  <!-- Modal confirmar cambio de estado -->
  <div class="modal" id="modal-estado-evento" role="dialog" aria-modal="true"
       aria-labelledby="modal-est-titulo">
    <div class="modal__panel" id="modal-est-panel"></div>
  </div>`;
}

/* ── Router de sub-vistas ───────────────────────────────────────────────── */
function renderVista() {
  if (localState.vistaActual === "nuevo-evento") return htmlFormEvento();
  return htmlListaEventos();
}

/* =========================================================================
   Vista: Listado de eventos
   ========================================================================= */
function htmlListaEventos() {
  const todos = [...localState.lista, ...localState.eventosCreados];

  return `
  <header class="dash-header">
    <div>
      <p class="eyebrow">Administración · FVRC</p>
      <h1>Eventos y Actividades</h1>
      <p class="text-secondary" style="margin-top:var(--sp-1)">
        Crea, publica y gestiona todos los eventos de la federación.
      </p>
    </div>
    <div class="dash-header__actions">
      <button class="btn btn--primary" id="btn-nuevo-evento">
        ${icono("plus")} Crear evento
      </button>
    </div>
  </header>

  <!-- KPIs -->
  <section class="dash-kpis" aria-label="Resumen de eventos">
    ${kpiEvt("calendar", "Total eventos",  todos.length,                        "neutral")}
    ${kpiEvt("check",    "Publicados",     todos.filter(e => e.estado === "PUBLICADO").length,  "success")}
    ${kpiEvt("edit",     "Borradores",     todos.filter(e => e.estado === "BORRADOR").length,   "warning")}
    ${kpiEvt("users",    "Total inscritos",todos.reduce((a, e) => a + e.inscritos, 0), "brand")}
  </section>

  <!-- Barra de filtros -->
  <div class="dash-card">
    <div class="dash-card__head" style="flex-wrap:wrap;gap:var(--sp-3)">
      <h2 style="margin:0">${icono("calendar")} Listado de eventos</h2>
      <div class="row row--wrap" style="gap:var(--sp-3);margin-left:auto">
        <div class="control-wrap" style="min-width:220px">
          <input class="input input--prefix" id="buscar-evt" type="search"
                 placeholder="Buscar por nombre o lugar…" autocomplete="off">
          <span class="input-affix input-affix--left">${icono("search")}</span>
        </div>
        <select class="select" id="filtro-estado-evt" style="min-width:160px">
          <option value="TODOS">Todos los estados</option>
          <option value="BORRADOR">Borrador</option>
          <option value="PUBLICADO">Publicado</option>
          <option value="FINALIZADO">Finalizado</option>
          <option value="CANCELADO">Cancelado</option>
        </select>
        <select class="select" id="filtro-ambito-evt" style="min-width:160px">
          <option value="TODOS">Todos los ámbitos</option>
          ${AMBITOS_EVENTO.map(a => `<option value="${a.val}">${a.label}</option>`).join("")}
        </select>
      </div>
    </div>
    <div class="dash-card__body" style="padding:0">
      <div id="tabla-eventos-wrap">${renderTablaEventos(todos)}</div>
    </div>
  </div>`;
}

function renderTablaEventos(lista) {
  if (!lista.length) {
    return `<div class="dash-empty" style="padding:var(--sp-10)">
      ${icono("calendar")}
      <p>No hay eventos. Crea el primero con el botón de arriba.</p>
    </div>`;
  }
  return `
  <div class="table-scroll">
    <table class="data-table" id="tabla-eventos">
      <thead>
        <tr>
          <th>Evento</th>
          <th>Ámbito / Formato</th>
          <th>Fechas</th>
          <th>Lugar</th>
          <th>Actividades</th>
          <th>Inscritos</th>
          <th>Estado</th>
          <th style="text-align:right">Acciones</th>
        </tr>
      </thead>
      <tbody>
        ${lista.map(filaEvento).join("")}
      </tbody>
    </table>
  </div>`;
}

function filaEvento(e) {
  const badgeCl = { PUBLICADO: "success", BORRADOR: "warning", FINALIZADO: "neutral", CANCELADO: "danger" };
  const cl = badgeCl[e.estado] || "neutral";
  return `
  <tr data-evt-id="${attr(e.id)}">
    <td style="min-width:200px">
      <strong style="font-size:var(--fs-sm);display:block">${esc(e.nombre)}</strong>
    </td>
    <td>
      <div style="display:flex;flex-direction:column;gap:4px">
        <span class="badge badge--neutral badge--sm">${esc(e.ambito)}</span>
        <span class="badge badge--brand badge--sm">${esc(e.formato)}</span>
      </div>
    </td>
    <td class="text-sm text-muted" style="white-space:nowrap">
      ${esc(e.fechaInicio)}<br>${esc(e.fechaFin !== e.fechaInicio ? "→ " + e.fechaFin : "")}
    </td>
    <td class="text-sm text-secondary">${esc(e.lugar)}</td>
    <td class="text-sm" style="text-align:center">
      <span class="badge badge--info badge--sm">${e.actividades}</span>
    </td>
    <td class="text-sm" style="text-align:center">
      <strong>${e.inscritos}</strong>
    </td>
    <td>
      <span class="badge badge--${cl} badge--sm badge--dot">${esc(e.estado)}</span>
    </td>
    <td>
      <div style="display:flex;gap:var(--sp-2);justify-content:flex-end;flex-wrap:wrap">
        <button class="btn btn--ghost btn--sm" data-act-hija="${attr(e.id)}"
          title="Agregar actividad al evento">
          ${icono("plus")} Actividad
        </button>
        <button class="btn btn--outline btn--sm" data-cambiar-estado="${attr(e.id)}">
          ${icono("edit")} Estado
        </button>
      </div>
    </td>
  </tr>`;
}

/* =========================================================================
   Vista: Formulario de nuevo evento
   ========================================================================= */
function htmlFormEvento() {
  return `
  <header class="dash-header">
    <div>
      <p class="eyebrow">Administración · FVRC</p>
      <h1>Crear nuevo evento</h1>
      <p class="text-secondary" style="margin-top:var(--sp-1)">
        Define los datos generales. Luego podrás agregar actividades, categorías y requisitos.
      </p>
    </div>
    <div class="dash-header__actions">
      <button class="btn btn--ghost" id="btn-volver-lista">
        ${icono("arrowRight")} Volver al listado
      </button>
    </div>
  </header>

  <div class="auth-grid" style="align-items:start">

    <!-- ── Formulario principal ───────────────────────────────────────── -->
    <div>
      <form id="form-nuevo-evento" novalidate>

        <!-- Sección 1: Datos generales -->
        <div class="auth-card" style="margin-bottom:var(--sp-5)">
          <div class="auth-card__head">
            <span class="section-title__num">1</span>
            <div>
              <h2 class="auth-card__head" style="padding:0;border:0;font-size:var(--fs-xl)">
                Datos generales del evento
              </h2>
            </div>
          </div>
          <div class="auth-card__body">
            <div class="form-grid">

              <div class="field col-span-2" data-campo="evt-nombre">
                <label class="field__label" for="evt-nombre">
                  Nombre del evento <span class="field__req">*</span>
                </label>
                <input class="input" id="evt-nombre" name="nombre" type="text"
                       placeholder="Ej. Olimpiada Nacional de Robótica 2027" maxlength="200" required>
                <span class="field__hint">Máx. 200 caracteres. Debe ser único en el sistema.</span>
                <span class="field__error" role="alert">${icono("alertCircle")}<span data-mensaje></span></span>
              </div>

              <div class="field" data-campo="evt-ambito">
                <label class="field__label" for="evt-ambito">
                  Ámbito <span class="field__req">*</span>
                </label>
                <select class="select" id="evt-ambito" name="ambito" required>
                  <option value="">Seleccionar…</option>
                  ${AMBITOS_EVENTO.map(a =>
                    `<option value="${a.val}">${a.label}</option>`).join("")}
                </select>
                <span class="field__error" role="alert">${icono("alertCircle")}<span data-mensaje></span></span>
              </div>

              <div class="field" data-campo="evt-formato">
                <label class="field__label" for="evt-formato">
                  Formato <span class="field__req">*</span>
                </label>
                <select class="select" id="evt-formato" name="formato" required>
                  <option value="">Seleccionar…</option>
                  ${FORMATOS_ACT.map(f => `<option value="${f}">${f}</option>`).join("")}
                </select>
                <span class="field__error" role="alert">${icono("alertCircle")}<span data-mensaje></span></span>
              </div>

              <div class="field" data-campo="evt-fecha-inicio">
                <label class="field__label" for="evt-fecha-inicio">
                  Fecha de inicio <span class="field__req">*</span>
                </label>
                <input class="input" id="evt-fecha-inicio" name="fechaInicio" type="date" required>
                <span class="field__error" role="alert">${icono("alertCircle")}<span data-mensaje></span></span>
              </div>

              <div class="field" data-campo="evt-fecha-fin">
                <label class="field__label" for="evt-fecha-fin">
                  Fecha de cierre <span class="field__req">*</span>
                </label>
                <input class="input" id="evt-fecha-fin" name="fechaFin" type="date" required>
                <span class="field__error" role="alert">${icono("alertCircle")}<span data-mensaje></span></span>
              </div>

              <!-- Lugar condicional -->
              <div class="field" id="campo-estado-vzla" data-campo="evt-estado-vzla">
                <label class="field__label" for="evt-estado-vzla">
                  Estado (Venezuela) <span class="field__req">*</span>
                </label>
                <select class="select" id="evt-estado-vzla" name="estadoVzla">
                  <option value="">Seleccionar…</option>
                  ${ESTADOS_VZLA.map(e => `<option value="${e}">${e}</option>`).join("")}
                </select>
                <span class="field__error" role="alert">${icono("alertCircle")}<span data-mensaje></span></span>
              </div>

              <div class="field" data-campo="evt-lugar">
                <label class="field__label" for="evt-lugar">
                  Sede / Lugar <span class="field__req">*</span>
                </label>
                <input class="input" id="evt-lugar" name="lugar" type="text"
                       placeholder="Ej. Polideportivo José María Vargas" maxlength="200" required>
                <span class="field__error" role="alert">${icono("alertCircle")}<span data-mensaje></span></span>
              </div>

              <div class="field col-span-2" data-campo="evt-descripcion">
                <label class="field__label" for="evt-descripcion">
                  Descripción / Objetivos <span class="field__req">*</span>
                </label>
                <textarea class="textarea" id="evt-descripcion" name="descripcion"
                          rows="4" placeholder="Describe el propósito, público objetivo y temáticas principales del evento."
                          maxlength="1000" required></textarea>
                <span class="field__hint">Máx. 1000 caracteres.</span>
                <span class="field__error" role="alert">${icono("alertCircle")}<span data-mensaje></span></span>
              </div>

            </div>
          </div>
        </div>

        <!-- Sección 2: Configuración de inscripciones -->
        <div class="auth-card" style="margin-bottom:var(--sp-5)">
          <div class="auth-card__head">
            <span class="section-title__num">2</span>
            <div>
              <h2 class="auth-card__head" style="padding:0;border:0;font-size:var(--fs-xl)">
                Inscripciones y acceso
              </h2>
            </div>
          </div>
          <div class="auth-card__body">
            <div class="form-grid">

              <div class="field" data-campo="evt-cierre-insc">
                <label class="field__label" for="evt-cierre-insc">
                  Cierre de inscripciones <span class="field__req">*</span>
                </label>
                <input class="input" id="evt-cierre-insc" name="cierreInscripciones"
                       type="date" required>
                <span class="field__error" role="alert">${icono("alertCircle")}<span data-mensaje></span></span>
              </div>

              <div class="field" data-campo="evt-cupos">
                <label class="field__label" for="evt-cupos">
                  Cupos máximos totales
                  <span class="field__opt">Opcional</span>
                </label>
                <input class="input" id="evt-cupos" name="cupos" type="number"
                       min="0" step="1" placeholder="0 = sin límite">
                <span class="field__hint">Deja en 0 para cupo ilimitado.</span>
              </div>

              <div class="field" data-campo="evt-costo">
                <label class="field__label" for="evt-costo">
                  Costo de inscripción (Bs.)
                  <span class="field__opt">Opcional</span>
                </label>
                <div class="control-wrap">
                  <input class="input input--prefix" id="evt-costo" name="costo"
                         type="number" min="0" step="0.01" placeholder="0.00">
                  <span class="input-affix input-affix--left">Bs.</span>
                </div>
                <span class="field__hint">Ingresa 0 para marcar el evento como gratuito.</span>
              </div>

              <div class="field col-span-2">
                <label class="field__label">Requisitos de participación</label>
                <div class="form-grid" style="gap:var(--sp-3)">
                  <label class="checkline">
                    <input type="checkbox" name="req_federado">
                    <span><strong>Federado activo</strong> — Solo participantes con licencia federativa vigente.</span>
                  </label>
                  <label class="checkline">
                    <input type="checkbox" name="req_club_oficial">
                    <span><strong>Club oficial</strong> — El participante/equipo debe pertenecer a un club aprobado.</span>
                  </label>
                  <label class="checkline">
                    <input type="checkbox" name="req_tutor">
                    <span><strong>Tutor asignado</strong> — Cada equipo debe tener al menos un tutor activo.</span>
                  </label>
                  <label class="checkline">
                    <input type="checkbox" name="req_autorizacion">
                    <span><strong>Autorización representante</strong> — Obligatoria para participantes menores de edad.</span>
                  </label>
                  <label class="checkline">
                    <input type="checkbox" name="req_pago">
                    <span><strong>Pago aprobado</strong> — Sólo confirma inscripción tras verificar el comprobante.</span>
                  </label>
                </div>
              </div>

            </div>
          </div>
        </div>

        <!-- Sección 3: Actividad inicial (opcional) -->
        <div class="auth-card" style="margin-bottom:var(--sp-5)">
          <div class="auth-card__head">
            <span class="section-title__num">3</span>
            <div>
              <h2 class="auth-card__head" style="padding:0;border:0;font-size:var(--fs-xl)">
                Primera actividad <span class="field__opt">Opcional</span>
              </h2>
              <p style="font-size:var(--fs-sm);color:var(--text-secondary);margin-top:var(--sp-1)">
                Puedes agregar más actividades después de crear el evento.
              </p>
            </div>
          </div>
          <div class="auth-card__body">

            <div class="form-grid">

              <div class="field col-span-2" data-campo="act1-nombre">
                <label class="field__label" for="act1-nombre">Nombre de la actividad</label>
                <input class="input" id="act1-nombre" name="act1_nombre" type="text"
                       placeholder="Ej. Sumo Junior, Taller de Arduino, Ceremonia inaugural…" maxlength="200">
              </div>

              <div class="field" data-campo="act1-tipo">
                <label class="field__label" for="act1-tipo">Tipo de actividad</label>
                <select class="select" id="act1-tipo" name="act1_tipo">
                  <option value="">Seleccionar…</option>
                  ${TIPOS_ACTIVIDAD.map(t => `<option value="${t}">${t}</option>`).join("")}
                </select>
              </div>

              <div class="field" data-campo="act1-modalidad">
                <label class="field__label" for="act1-modalidad">Modalidad de participación</label>
                <select class="select" id="act1-modalidad" name="act1_modalidad">
                  <option value="">Seleccionar…</option>
                  ${MODALIDADES_PART.map(m => `<option value="${m}">${m}</option>`).join("")}
                </select>
              </div>

              <div class="field" data-campo="act1-cupos-min">
                <label class="field__label" for="act1-cupos-min">Cupos mínimos</label>
                <input class="input" id="act1-cupos-min" name="act1_cuposMin"
                       type="number" min="1" step="1" placeholder="1">
              </div>

              <div class="field" data-campo="act1-cupos-max">
                <label class="field__label" for="act1-cupos-max">Cupos máximos</label>
                <input class="input" id="act1-cupos-max" name="act1_cuposMax"
                       type="number" min="0" step="1" placeholder="0 = sin límite">
              </div>

              <div class="field col-span-2" data-campo="act1-desc">
                <label class="field__label" for="act1-desc">Descripción</label>
                <textarea class="textarea" id="act1-desc" name="act1_descripcion"
                          rows="3" placeholder="Breve descripción de la actividad…" maxlength="500"></textarea>
              </div>

            </div>
          </div>
        </div>

        <!-- Acción final -->
        <div class="auth-card__foot" style="border-radius:var(--r-xl);border:1px solid var(--border-subtle)">
          <p class="auth-card__foot-note">
            Al guardar, el evento se crea en estado <strong>BORRADOR</strong>.
            Deberás publicarlo manualmente desde el listado.
          </p>
          <div style="display:flex;gap:var(--sp-3);flex-wrap:wrap">
            <button type="button" class="btn btn--ghost" id="btn-cancelar-evento">
              Cancelar
            </button>
            <button type="submit" class="btn btn--primary" id="btn-guardar-evento">
              ${icono("check")} Guardar evento
            </button>
          </div>
        </div>

      </form>
    </div>

    <!-- ── Panel lateral de ayuda ─────────────────────────────────────── -->
    <aside class="aside-stack">
      <div class="aside-card aside-card--brand">
        <h3>Jerarquía de un evento</h3>
        <div style="display:flex;flex-direction:column;gap:var(--sp-3);margin-top:var(--sp-2)">
          ${[
            ["calendar", "EVENTO", "Contenedor principal"],
            ["list",     "ACTIVIDAD", "Competición, curso, taller…"],
            ["tag",      "CATEGORÍA", "Infantil, Junior, Senior…"],
            ["check",    "INSCRIPCIÓN", "Individual o por equipo"]
          ].map(([ic, titulo, desc]) => `
            <div style="display:flex;gap:var(--sp-3);align-items:center">
              <span style="
                display:grid;place-items:center;
                width:32px;height:32px;flex:none;
                border-radius:var(--r-sm);
                background:rgba(255,255,255,.12);
                color:#fff">
                ${icono(ic)}
              </span>
              <div>
                <strong style="display:block;font-size:var(--fs-sm);color:#fff">${esc(titulo)}</strong>
                <span style="font-size:var(--fs-xs);color:rgba(255,255,255,.7)">${esc(desc)}</span>
              </div>
            </div>`).join("")}
        </div>
      </div>

      <div class="aside-card">
        <h3>Estados del evento</h3>
        <div class="checklist">
          ${[
            ["BORRADOR",   "Visible solo para admins. Sin inscripciones."],
            ["PUBLICADO",  "Visible al público. Inscripciones abiertas."],
            ["FINALIZADO", "Cerrado. Solo lectura y certificados."],
            ["CANCELADO",  "Invisible al público. Sin acciones."]
          ].map(([est, desc]) => `
            <li style="flex-direction:column;align-items:flex-start;gap:4px">
              <span class="badge badge--neutral badge--sm">${est}</span>
              <span style="font-size:var(--fs-xs);color:var(--text-secondary)">${esc(desc)}</span>
            </li>`).join("")}
        </div>
      </div>

      <div class="aside-card">
        <h3>Tipos de actividad</h3>
        <div class="chipset">
          ${TIPOS_ACTIVIDAD.map(t => `<span class="badge badge--brand">${esc(t)}</span>`).join("")}
        </div>
      </div>
    </aside>

  </div>`;
}

/* =========================================================================
   Modal: Agregar actividad hija
   ========================================================================= */
function htmlModalActividad(eventoId) {
  const todos = [...localState.lista, ...localState.eventosCreados];
  const evt = todos.find(e => e.id === eventoId);
  return `
  <div class="modal__head">
    <div>
      <h2 class="modal__title" id="modal-act-titulo">Nueva actividad</h2>
      ${evt ? `<p class="text-sm text-secondary" style="margin-top:4px">Evento: ${esc(evt.nombre)}</p>` : ""}
    </div>
    <button class="btn btn--ghost btn--icon" id="cerrar-modal-act" aria-label="Cerrar">
      ${icono("x")}
    </button>
  </div>
  <form id="form-actividad-hija" novalidate>
    <div class="modal__body">
      <div class="form-grid">

        <div class="field col-span-2" data-campo="act-nombre">
          <label class="field__label" for="act-nombre">
            Nombre <span class="field__req">*</span>
          </label>
          <input class="input" id="act-nombre" type="text" maxlength="200"
                 placeholder="Ej. Sumo Senior, Rescate Junior, Taller de Python…" required>
          <span class="field__error" role="alert">${icono("alertCircle")}<span data-mensaje></span></span>
        </div>

        <div class="field" data-campo="act-tipo">
          <label class="field__label" for="act-tipo">
            Tipo <span class="field__req">*</span>
          </label>
          <select class="select" id="act-tipo" required>
            <option value="">Seleccionar…</option>
            ${TIPOS_ACTIVIDAD.map(t => `<option value="${t}">${t}</option>`).join("")}
          </select>
          <span class="field__error" role="alert">${icono("alertCircle")}<span data-mensaje></span></span>
        </div>

        <div class="field" data-campo="act-modalidad">
          <label class="field__label" for="act-modalidad">
            Modalidad de participación <span class="field__req">*</span>
          </label>
          <select class="select" id="act-modalidad" required>
            <option value="">Seleccionar…</option>
            ${MODALIDADES_PART.map(m => `<option value="${m}">${m}</option>`).join("")}
          </select>
          <span class="field__error" role="alert">${icono("alertCircle")}<span data-mensaje></span></span>
        </div>

        <div class="field" data-campo="act-formato">
          <label class="field__label" for="act-formato">
            Formato <span class="field__req">*</span>
          </label>
          <select class="select" id="act-formato" required>
            <option value="">Seleccionar…</option>
            ${FORMATOS_ACT.map(f => `<option value="${f}">${f}</option>`).join("")}
          </select>
          <span class="field__error" role="alert">${icono("alertCircle")}<span data-mensaje></span></span>
        </div>

        <div class="field" data-campo="act-fecha-ini">
          <label class="field__label" for="act-fecha-ini">
            Fecha inicio <span class="field__req">*</span>
          </label>
          <input class="input" id="act-fecha-ini" type="date" required>
          <span class="field__error" role="alert">${icono("alertCircle")}<span data-mensaje></span></span>
        </div>

        <div class="field" data-campo="act-fecha-fin">
          <label class="field__label" for="act-fecha-fin">
            Fecha fin <span class="field__req">*</span>
          </label>
          <input class="input" id="act-fecha-fin" type="date" required>
          <span class="field__error" role="alert">${icono("alertCircle")}<span data-mensaje></span></span>
        </div>

        <div class="field" data-campo="act-cupos-min">
          <label class="field__label" for="act-cupos-min">Cupos mínimos</label>
          <input class="input" id="act-cupos-min" type="number" min="1" step="1" placeholder="1">
        </div>

        <div class="field" data-campo="act-cupos-max">
          <label class="field__label" for="act-cupos-max">Cupos máximos</label>
          <input class="input" id="act-cupos-max" type="number" min="0" step="1" placeholder="0 = ilimitado">
        </div>

        <div class="field" data-campo="act-costo">
          <label class="field__label" for="act-costo">
            Costo (Bs.) <span class="field__opt">Opcional</span>
          </label>
          <div class="control-wrap">
            <input class="input input--prefix" id="act-costo" type="number" min="0" step="0.01" placeholder="0.00">
            <span class="input-affix input-affix--left">Bs.</span>
          </div>
        </div>

        <div class="field" data-campo="act-publico">
          <label class="field__label" for="act-publico">
            Público objetivo <span class="field__opt">Opcional</span>
          </label>
          <select class="select" id="act-publico">
            <option value="">General</option>
            <option value="participantes">Participantes individuales</option>
            <option value="equipos">Equipos</option>
            <option value="tutores">Docentes / Tutores</option>
          </select>
        </div>

        <div class="field col-span-2" data-campo="act-desc">
          <label class="field__label" for="act-desc">Descripción</label>
          <textarea class="textarea" id="act-desc" rows="3"
                    placeholder="Descripción de la actividad…" maxlength="500"></textarea>
          <span class="field__hint">Máx. 500 caracteres.</span>
        </div>

        <!-- Categorías rápidas -->
        <div class="field col-span-2">
          <label class="field__label">Categorías (opcional)</label>
          <div class="cond-block">
            <p class="cond-block__title">${icono("tag")} Categorías de la actividad</p>
            <div id="categorias-lista" style="display:flex;flex-direction:column;gap:var(--sp-3)">
              ${htmlFilaCategoria(0)}
            </div>
            <button type="button" class="btn btn--ghost btn--sm" id="btn-add-cat"
                    style="margin-top:var(--sp-3)">
              ${icono("plus")} Agregar categoría
            </button>
          </div>
        </div>

      </div>
    </div>
    <div class="modal__foot">
      <button type="button" class="btn btn--ghost" id="modal-act-cancelar">Cancelar</button>
      <button type="submit" class="btn btn--primary" id="modal-act-guardar">
        ${icono("check")} Guardar actividad
      </button>
    </div>
  </form>`;
}

function htmlFilaCategoria(idx) {
  return `
  <div class="form-grid" data-cat-row="${idx}" style="padding:var(--sp-3);background:var(--bg-surface);border:1px solid var(--border-subtle);border-radius:var(--r-md)">
    <div class="field">
      <label class="field__label" for="cat-nombre-${idx}">Nombre</label>
      <input class="input" id="cat-nombre-${idx}" type="text" placeholder="Ej. Infantil" maxlength="80">
    </div>
    <div class="field">
      <label class="field__label" for="cat-edad-min-${idx}">Edad mínima</label>
      <input class="input" id="cat-edad-min-${idx}" type="number" min="4" max="99" placeholder="4">
    </div>
    <div class="field">
      <label class="field__label" for="cat-edad-max-${idx}">Edad máxima</label>
      <input class="input" id="cat-edad-max-${idx}" type="number" min="4" max="99" placeholder="12">
    </div>
    <div class="field" style="align-self:flex-end">
      <button type="button" class="btn btn--danger btn--sm" data-eliminar-cat="${idx}">
        ${icono("x")} Quitar
      </button>
    </div>
  </div>`;
}

/* =========================================================================
   Modal: Cambiar estado de evento
   ========================================================================= */
function htmlModalEstado(eventoId) {
  const todos = [...localState.lista, ...localState.eventosCreados];
  const evt = todos.find(e => e.id === eventoId);
  if (!evt) return "";
  const estados = ["BORRADOR", "PUBLICADO", "FINALIZADO", "CANCELADO"];
  return `
  <div class="modal__head">
    <h2 class="modal__title" id="modal-est-titulo">Cambiar estado del evento</h2>
    <button class="btn btn--ghost btn--icon" id="cerrar-modal-est" aria-label="Cerrar">
      ${icono("x")}
    </button>
  </div>
  <div class="modal__body">
    <p class="text-secondary" style="margin-bottom:var(--sp-5)">
      Evento: <strong>${esc(evt.nombre)}</strong>
    </p>
    <div class="form-grid form-grid--1" style="gap:var(--sp-3)">
      ${estados.map(est => {
        const descs = {
          BORRADOR:   "Visible solo para administradores. Las inscripciones están cerradas.",
          PUBLICADO:  "Visible para el público. Las inscripciones están abiertas.",
          FINALIZADO: "Evento concluido. Solo lectura. Se pueden emitir certificados.",
          CANCELADO:  "Evento cancelado. Se ocultará de la cartelera pública."
        };
        const cls = {BORRADOR:"warning",PUBLICADO:"success",FINALIZADO:"neutral",CANCELADO:"danger"};
        return `
        <label class="type-option ${evt.estado === est ? "is-selected" : ""}"
               aria-pressed="${evt.estado === est}">
          <input type="radio" name="nuevo-estado" value="${est}"
                 ${evt.estado === est ? "checked" : ""}>
          <span class="type-option__icon">${icono(est === "PUBLICADO" ? "check" : est === "BORRADOR" ? "edit" : est === "FINALIZADO" ? "award" : "xCircle")}</span>
          <span>
            <strong>${est}</strong>
            <span style="display:block;font-size:var(--fs-xs);color:var(--text-secondary);margin-top:2px">
              ${descs[est]}
            </span>
          </span>
          <span class="type-option__check">${icono("check")}</span>
        </label>`;
      }).join("")}
    </div>
  </div>
  <div class="modal__foot">
    <button class="btn btn--ghost" id="modal-est-cancelar">Cancelar</button>
    <button class="btn btn--primary" id="modal-est-guardar" data-id="${attr(eventoId)}">
      ${icono("check")} Aplicar cambio
    </button>
  </div>`;
}

/* =========================================================================
   Inicialización de interacciones
   ========================================================================= */
function iniciarVista(sesion) {
  activarShell(document);

  const main = () => $("#admin-act-main");

  function renderMain() {
    main().innerHTML = renderVista();
    registrarEventosPrincipales();
  }

  function registrarEventosPrincipales() {
    /* Botón "Crear evento" */
    $("#btn-nuevo-evento")?.addEventListener("click", () => {
      localState.vistaActual = "nuevo-evento";
      renderMain();
    });

    /* Botón "Volver al listado" */
    $("#btn-volver-lista, #btn-cancelar-evento")
      ?.forEach?.(b => b?.addEventListener("click", () => {
        localState.vistaActual = "lista";
        renderMain();
      }));
    /* id único — buscar ambos */
    ["#btn-volver-lista", "#btn-cancelar-evento"].forEach(sel => {
      $(sel)?.addEventListener("click", () => {
        localState.vistaActual = "lista";
        renderMain();
      });
    });

    /* Filtros y búsqueda */
    let timer;
    $("#buscar-evt")?.addEventListener("input", () => {
      clearTimeout(timer);
      timer = setTimeout(filtrarTabla, 180);
    });
    $("#filtro-estado-evt")?.addEventListener("change", filtrarTabla);
    $("#filtro-ambito-evt")?.addEventListener("change", filtrarTabla);

    /* Acciones en tabla */
    registrarEventosTabla();

    /* Formulario de nuevo evento */
    registrarFormEvento();

    /* Formato condicional: ocultar estado si es virtual */
    $("#evt-formato")?.addEventListener("change", e => {
      const campoEstado = $("#campo-estado-vzla");
      if (campoEstado) {
        campoEstado.style.display = e.target.value === "Virtual" ? "none" : "";
        if (e.target.value === "Virtual") {
          const sel = $("#evt-estado-vzla");
          if (sel) sel.value = "";
          const inp = $("#evt-lugar");
          if (inp && !inp.value) inp.value = "En línea";
        }
      }
    });
  }

  /* ── Filtrar tabla ─────────────────────────────────────────────────── */
  function filtrarTabla() {
    const txt  = ($("#buscar-evt")?.value || "").toLowerCase().trim();
    const est  = $("#filtro-estado-evt")?.value || "TODOS";
    const amb  = $("#filtro-ambito-evt")?.value || "TODOS";
    const todos = [...localState.lista, ...localState.eventosCreados];
    const lista = todos.filter(e => {
      const okEst = est === "TODOS" || e.estado === est;
      const okAmb = amb === "TODOS" || e.ambito === amb;
      const okTxt = !txt || e.nombre.toLowerCase().includes(txt) || e.lugar.toLowerCase().includes(txt);
      return okEst && okAmb && okTxt;
    });
    const wrap = $("#tabla-eventos-wrap");
    if (wrap) wrap.innerHTML = renderTablaEventos(lista);
    registrarEventosTabla();
  }

  /* ── Acciones en tabla ─────────────────────────────────────────────── */
  function registrarEventosTabla() {
    $$("[data-act-hija]").forEach(btn => {
      btn.addEventListener("click", () => abrirModalActividad(btn.dataset.actHija));
    });
    $$("[data-cambiar-estado]").forEach(btn => {
      btn.addEventListener("click", () => abrirModalEstado(btn.dataset.cambiarEstado));
    });
  }

  /* ── Formulario de nuevo evento ────────────────────────────────────── */
  function registrarFormEvento() {
    const form = $("#form-nuevo-evento");
    if (!form) return;

    form.addEventListener("submit", e => {
      e.preventDefault();
      const campos = validarFormEvento(form);
      if (!campos) return;

      const nuevoId = `evt-${Date.now()}`;
      const nuevo = {
        id: nuevoId,
        nombre: campos.nombre,
        ambito: campos.ambito,
        formato: campos.formato,
        estado: "BORRADOR",
        fechaInicio: campos.fechaInicio,
        fechaFin: campos.fechaFin,
        lugar: campos.formato === "Virtual" ? "En línea" :
               `${campos.lugar}, ${campos.estadoVzla}`,
        actividades: campos.act1_nombre ? 1 : 0,
        inscritos: 0
      };

      localState.eventosCreados.push(nuevo);
      notificar(
        `Evento "${nuevo.nombre}" creado en estado BORRADOR. Puedes publicarlo desde el listado.`,
        "success", "Evento creado"
      );
      localState.vistaActual = "lista";
      renderMain();
    });
  }

  function validarFormEvento(form) {
    let fallo = false;
    const campos = {};
    const reqs = [
      ["evt-nombre",      "El nombre del evento es obligatorio."],
      ["evt-ambito",      "Selecciona el ámbito del evento."],
      ["evt-formato",     "Selecciona el formato."],
      ["evt-fecha-inicio","Indica la fecha de inicio."],
      ["evt-fecha-fin",   "Indica la fecha de cierre."],
      ["evt-lugar",       "Indica el lugar o sede."],
      ["evt-descripcion", "Agrega una descripción del evento."],
      ["evt-cierre-insc", "Indica el cierre de inscripciones."]
    ];
    reqs.forEach(([id, msg]) => {
      const el = $(`#${id}`);
      const wrap = el?.closest("[data-campo]");
      if (!el) return;
      if (!el.value.trim()) {
        if (wrap) { wrap.classList.add("has-error"); const m = wrap.querySelector("[data-mensaje]"); if (m) m.textContent = msg; }
        fallo = true;
      } else {
        if (wrap) wrap.classList.remove("has-error");
        campos[el.name || id.replace("evt-", "")] = el.value.trim();
      }
    });
    /* Validar rango de fechas */
    if (!fallo) {
      const fi = new Date(campos.fechaInicio || $("#evt-fecha-inicio")?.value);
      const ff = new Date(campos.fechaFin    || $("#evt-fecha-fin")?.value);
      if (ff < fi) {
        const wrap = $("#evt-fecha-fin")?.closest("[data-campo]");
        if (wrap) { wrap.classList.add("has-error"); const m = wrap.querySelector("[data-mensaje]"); if (m) m.textContent = "La fecha de cierre no puede ser anterior al inicio."; }
        fallo = true;
      }
    }
    if (fallo) {
      form.querySelector(".has-error input, .has-error select, .has-error textarea")?.focus();
      return null;
    }
    /* Recopilar todos los campos del form */
    new FormData(form).forEach((val, key) => { campos[key] = val; });
    return campos;
  }

  /* ── Modal actividad hija ──────────────────────────────────────────── */
  const modalAct = $("#modal-actividad");
  let catIdx = 0;

  function abrirModalActividad(eventoId) {
    catIdx = 0;
    $("#modal-act-panel").innerHTML = htmlModalActividad(eventoId);
    modalAct.classList.add("is-open");
    document.body.style.overflow = "hidden";

    $("#cerrar-modal-act")?.addEventListener("click", cerrarModalAct);
    $("#modal-act-cancelar")?.addEventListener("click", cerrarModalAct);

    /* Agregar categoría */
    $("#btn-add-cat")?.addEventListener("click", () => {
      catIdx++;
      const lista = $("#categorias-lista");
      const div = document.createElement("div");
      div.innerHTML = htmlFilaCategoria(catIdx);
      lista.appendChild(div.firstElementChild);
      registrarElimCat();
    });
    registrarElimCat();

    /* Guardar actividad */
    $("#form-actividad-hija")?.addEventListener("submit", e => {
      e.preventDefault();
      if (!validarModalAct()) return;
      /* Actualizar contador del evento */
      actualizarActividadesEvento(eventoId, 1);
      notificar("Actividad agregada al evento correctamente.", "success", "Actividad creada");
      cerrarModalAct();
      filtrarTabla();
    });
  }

  function registrarElimCat() {
    $$("[data-eliminar-cat]", $("#categorias-lista")).forEach(btn => {
      btn.addEventListener("click", () => {
        btn.closest("[data-cat-row]").remove();
      });
    });
  }

  function validarModalAct() {
    let fallo = false;
    [["act-nombre","Nombre obligatorio."],["act-tipo","Selecciona el tipo."],
     ["act-modalidad","Selecciona la modalidad."],["act-formato","Selecciona el formato."],
     ["act-fecha-ini","Fecha de inicio obligatoria."],["act-fecha-fin","Fecha de fin obligatoria."]
    ].forEach(([id, msg]) => {
      const el = $(`#${id}`);
      const wrap = el?.closest("[data-campo]");
      if (!el?.value.trim()) {
        if (wrap) { wrap.classList.add("has-error"); const m = wrap.querySelector("[data-mensaje]"); if (m) m.textContent = msg; }
        fallo = true;
      } else { if (wrap) wrap.classList.remove("has-error"); }
    });
    if (fallo) { $("#modal-actividad .modal__panel .has-error input, #modal-actividad .modal__panel .has-error select")?.focus(); }
    return !fallo;
  }

  function cerrarModalAct() {
    modalAct.classList.remove("is-open");
    document.body.style.overflow = "";
    setTimeout(() => { $("#modal-act-panel").innerHTML = ""; }, 320);
  }

  /* ── Modal cambio de estado ────────────────────────────────────────── */
  const modalEst = $("#modal-estado-evento");

  function abrirModalEstado(eventoId) {
    $("#modal-est-panel").innerHTML = htmlModalEstado(eventoId);
    modalEst.classList.add("is-open");
    document.body.style.overflow = "hidden";

    $("#cerrar-modal-est")?.addEventListener("click", cerrarModalEst);
    $("#modal-est-cancelar")?.addEventListener("click", cerrarModalEst);

    /* Radio: resaltar opción seleccionada */
    $$('input[name="nuevo-estado"]').forEach(radio => {
      radio.addEventListener("change", () => {
        $$(".type-option").forEach(opt => {
          const inp = opt.querySelector("input");
          const sel = inp?.value === radio.value;
          opt.classList.toggle("is-selected", sel);
          opt.setAttribute("aria-pressed", String(sel));
        });
      });
    });

    $("#modal-est-guardar")?.addEventListener("click", () => {
      const sel = $('input[name="nuevo-estado"]:checked');
      if (!sel) { notificar("Selecciona un estado.", "warning"); return; }
      const nuevoEst = sel.value;
      const id = $("#modal-est-guardar").dataset.id;
      cambiarEstadoEvento(id, nuevoEst);
    });
  }

  function cambiarEstadoEvento(id, nuevoEst) {
    const todos = [...localState.lista, ...localState.eventosCreados];
    const evt = todos.find(e => e.id === id);
    if (!evt) return;
    const enLista = localState.lista.find(e => e.id === id);
    const enCreados = localState.eventosCreados.find(e => e.id === id);
    if (enLista) enLista.estado = nuevoEst;
    if (enCreados) enCreados.estado = nuevoEst;
    notificar(`Estado actualizado a "${nuevoEst}" para "${evt.nombre}".`, "success", "Estado actualizado");
    cerrarModalEst();
    filtrarTabla();
  }

  function actualizarActividadesEvento(id, delta) {
    const enLista = localState.lista.find(e => e.id === id);
    const enCreados = localState.eventosCreados.find(e => e.id === id);
    if (enLista) enLista.actividades = (enLista.actividades || 0) + delta;
    if (enCreados) enCreados.actividades = (enCreados.actividades || 0) + delta;
  }

  function cerrarModalEst() {
    modalEst.classList.remove("is-open");
    document.body.style.overflow = "";
    setTimeout(() => { $("#modal-est-panel").innerHTML = ""; }, 320);
  }

  /* ── Escape global ─────────────────────────────────────────────────── */
  function onKey(e) {
    if (e.key !== "Escape") return;
    if (modalAct.classList.contains("is-open")) cerrarModalAct();
    if (modalEst.classList.contains("is-open")) cerrarModalEst();
  }
  document.addEventListener("keydown", onKey);
  limpiarAlSalir(() => document.removeEventListener("keydown", onKey));

  registrarEventosPrincipales();
}

/* ── KPI helper ─────────────────────────────────────────────────────────── */
function kpiEvt(glifo, label, valor, color) {
  return `
  <div class="kpi-card kpi-card--${color}">
    <div class="kpi-card__icon">${icono(glifo)}</div>
    <div class="kpi-card__body">
      <span class="kpi-card__value">${valor}</span>
      <span class="kpi-card__label">${esc(label)}</span>
    </div>
  </div>`;
}
