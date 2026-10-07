/* ============================================================================
   PNRC · Dashboard del usuario autenticado
   Roles soportados: Persona Natural, Responsable Institucional, Admin Central
   ============================================================================ */

import { icono } from "../icons.js";
import {
  $, $$, esc, attr, notificar, activarShell, limpiarAlSalir, navegar,
  formatearNumero, fechaCorta, parteFecha
} from "../app.js";
import {
  obtenerSesion, cerrarSesion, ACTIVIDADES,
  PARTICIPANTES_DEMO, INSCRIPCIONES_DEMO, NOTIFICACIONES_DEMO, STATS_ADMIN
} from "../data.js";
import { cabeceraAdmin, sidebarAdmin, navMovilAdmin } from "./admin-solicitudes.js";

/* =========================================================================
   Punto de entrada
   ========================================================================= */
export function vistaDashboard() {
  const sesion = obtenerSesion();

  if (!sesion) {
    return {
      titulo: "Acceso restringido",
      html: paginaAccesoRestringido(),
      iniciar() { activarShell(document); }
    };
  }

  const esAdmin = sesion.rol === "Administrador Central";

  return {
    titulo: `Mi panel · ${sesion.nombres}`,
    html: esAdmin ? htmlAdmin(sesion) : htmlUsuario(sesion),
    iniciar() { iniciarDashboard(sesion); }   /* activarShell solo aquí */
  };
}

/* =========================================================================
   HTML · Cabecera autenticada (usuario normal — compartida)
   ========================================================================= */
function cabeceraAutenticada(s) {
  const noLeidas = NOTIFICACIONES_DEMO.filter(n => n.usuarioId === s.id && !n.leida).length;
  return `
  <a class="skip-link" href="#contenido">Saltar al contenido principal</a>
  <header class="site-header site-header--auth" id="header">
    <div class="site-header__inner">
      <a class="brand" href="#/" aria-label="FVRC · Inicio">
        <span class="brand__mark">
          <img src="assets/img/fvrc-logo-256.png" width="42" height="42" alt="Escudo FVRC">
        </span>
        <span class="brand__text">
          <span class="brand__name">FVRC</span>
          <span class="brand__tag">Panel de gestión</span>
        </span>
      </a>
      <div class="header-spacer"></div>
      <div class="header-actions">
        <button class="btn btn--ghost btn--icon" data-tema
          title="Cambiar tema" aria-label="Cambiar entre tema claro y oscuro">
          ${icono("moon")}
        </button>
        <a href="#/dashboard" class="btn btn--ghost btn--icon btn--notif"
          aria-label="${noLeidas} notificaciones sin leer">
          ${icono("bell")}
          ${noLeidas > 0 ? `<span class="notif-dot" aria-hidden="true">${noLeidas}</span>` : ""}
        </a>
        <div class="header-user">
          <span class="avatar avatar--sm">${iniciales(s.nombres, s.apellidos)}</span>
          <span class="header-user__name">${esc(s.nombres)}</span>
          <button class="btn btn--ghost btn--icon" id="btn-menu-usuario"
            aria-label="Menú de usuario" aria-expanded="false" aria-haspopup="true">
            ${icono("chevronDown")}
          </button>
          <div class="header-user__menu" id="menu-usuario" hidden role="menu">
            <a href="#/perfil" role="menuitem">${icono("user")} <span>Mi perfil</span></a>
            <a href="#/dashboard" role="menuitem">${icono("home")} <span>Inicio</span></a>
            <hr>
            <button id="btn-cerrar-sesion" class="btn-link-danger" role="menuitem">
              ${icono("logOut")} <span>Cerrar sesión</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </header>`;
}

/* =========================================================================
   HTML · Nav móvil inferior (usuario normal)
   ========================================================================= */
function navMovil() {
  return `
  <nav class="dash-mobile-nav" aria-label="Navegación principal (móvil)">
    <a class="dash-mobile-nav__item is-active" href="#/dashboard">${icono("home")}<span>Inicio</span></a>
    <a class="dash-mobile-nav__item" href="#/participantes/nuevo">${icono("users")}<span>Participantes</span></a>
    <a class="dash-mobile-nav__item" href="#/clubes">${icono("escudo")}<span>Club</span></a>
    <a class="dash-mobile-nav__item" href="#/#actividades">${icono("search")}<span>Actividades</span></a>
    <a class="dash-mobile-nav__item" href="#/perfil">${icono("user")}<span>Perfil</span></a>
  </nav>`;
}

/* =========================================================================
   HTML · Dashboard usuario normal
   ========================================================================= */
function htmlUsuario(s) {
  const perfilCompleto = s.estadoPerfil === "PERFIL_COMPLETO";
  const inscripciones  = INSCRIPCIONES_DEMO.filter(i => i.usuarioId === s.id);
  const noLeidas       = NOTIFICACIONES_DEMO.filter(n => n.usuarioId === s.id && !n.leida);

  return `
  ${cabeceraAutenticada(s)}

  <div class="dashboard-layout" id="contenido">

    <!-- ── Sidebar (desktop/tablet) ───────────────────────────────────── -->
    <aside class="dash-sidebar" aria-label="Menú del panel">
      <div class="dash-sidebar__avatar">
        <span class="avatar avatar--lg">${iniciales(s.nombres, s.apellidos)}</span>
        <div>
          <strong>${esc(s.nombres)}</strong>
          <span class="badge badge--${perfilCompleto ? "success" : "warning"} badge--sm">
            ${perfilCompleto ? icono("checkCircle") + " Completo" : icono("alert") + " Incompleto"}
          </span>
        </div>
      </div>

      <nav class="dash-nav" aria-label="Secciones del panel">
        <a class="dash-nav__item is-active" href="#/dashboard">
          ${icono("home")}<span>Inicio</span>
        </a>
        <a class="dash-nav__item" href="#/perfil">
          ${icono("user")}<span>Mi perfil</span>
        </a>
        <a class="dash-nav__item" href="#/mis-inscripciones">
          ${icono("calendar")}<span>Inscripciones</span>
          ${inscripciones.length ? `<span class="dash-nav__badge">${inscripciones.length}</span>` : ""}
        </a>
        <a class="dash-nav__item" href="#/participantes/nuevo">
          ${icono("users")}<span>Participantes</span>
        </a>
        <a class="dash-nav__item" href="#/clubes">
          ${icono("escudo")}<span>Mi club</span>
        </a>
        <a class="dash-nav__item" href="#/#actividades">
          ${icono("search")}<span>Buscar actividades</span>
        </a>
        <a class="dash-nav__item" href="#/certificados">
          ${icono("certificado")}<span>Certificados</span>
        </a>
      </nav>

      <div class="dash-sidebar__rnr">
        <span class="text-xs text-muted">Tu código RNR</span>
        <button class="rnr-badge" data-copiar-rnr title="Haz clic para copiar tu RNR">
          <code>${esc(s.rnr)}</code>
          ${icono("copy")}
        </button>
      </div>
    </aside>

    <!-- ── Contenido principal ─────────────────────────────────────────── -->
    <main class="dash-main">

      ${!perfilCompleto ? bannerPerfilIncompleto() : ""}

      <!-- Saludo -->
      <header class="dash-header reveal">
        <div>
          <p class="eyebrow">Bienvenido de vuelta</p>
          <h1>${esc(s.nombres)} ${esc(s.apellidos)}</h1>
          <p class="text-secondary" style="margin-top:var(--sp-1)">
            ${esc(s.rol)} &middot; ${esc(s.estado)}
          </p>
        </div>
        <div class="dash-header__actions">
          <a class="btn btn--primary" href="#/participantes/nuevo">
            ${icono("userPlus")} <span>Registrar participante</span>
          </a>
          <a class="btn btn--outline" href="#/#actividades">
            ${icono("search")} <span>Buscar actividades</span>
          </a>
        </div>
      </header>

      <!-- KPI Cards -->
      <section class="dash-kpis reveal" aria-label="Resumen de actividad">
        ${kpi("users",    "Participantes",    formatearNumero(s.participantes), s.club?.tipo === "OFICIAL" ? "Club oficial" : "Club por defecto", "brand")}
        ${kpi("calendar", "Inscripciones",    formatearNumero(inscripciones.length), inscripciones.filter(i => i.estado === "CONFIRMADA").length + " confirmadas", "success")}
        ${kpi("escudo",   "Estado del club",  s.club ? esc(s.club.tipo) : "Sin club", s.club?.nombre ? esc(s.club.nombre) : "—", s.club?.tipo === "OFICIAL" ? "accent" : "neutral")}
        ${kpi("bell",     "Notificaciones",   String(noLeidas.length), "sin leer", noLeidas.length > 0 ? "warning" : "neutral")}
      </section>

      <!-- Grid de tarjetas -->
      <div class="dash-grid">

        <section class="dash-card reveal" aria-labelledby="tit-insc">
          <div class="dash-card__head">
            <h2 id="tit-insc">${icono("calendar")} Mis inscripciones</h2>
            <a href="#/#actividades" class="btn btn--ghost btn--sm">Ver más</a>
          </div>
          <div class="dash-card__body">
            ${inscripciones.length
              ? inscripciones.map(filaInscripcion).join("")
              : vacioCarta("calendar", "Aún no tienes inscripciones.", "#/#actividades", "Explorar actividades")}
          </div>
        </section>

        <section class="dash-card reveal" aria-labelledby="tit-notif">
          <div class="dash-card__head">
            <h2 id="tit-notif">${icono("bell")} Notificaciones</h2>
            ${noLeidas.length ? `<span class="badge badge--warning badge--sm">${noLeidas.length} nuevas</span>` : ""}
          </div>
          <div class="dash-card__body">
            ${NOTIFICACIONES_DEMO.filter(n => n.usuarioId === s.id).length
              ? NOTIFICACIONES_DEMO.filter(n => n.usuarioId === s.id).map(filaNotif).join("")
              : vacioCarta("bell", "No tienes notificaciones.", "", "")}
          </div>
        </section>

        <section class="dash-card dash-card--wide reveal" aria-labelledby="tit-participantes">
          <div class="dash-card__head">
            <h2 id="tit-participantes">${icono("users")} Participantes del club</h2>
            <a href="#/participantes/nuevo" class="btn btn--ghost btn--sm">
              ${icono("userPlus")} Agregar
            </a>
          </div>
          <div class="dash-card__body" style="padding:0">
            ${tablaParticipantes(s)}
          </div>
        </section>

        <section class="dash-card dash-card--wide reveal" aria-labelledby="tit-prox">
          <div class="dash-card__head">
            <h2 id="tit-prox">${icono("calendar")} Actividades disponibles</h2>
            <a href="#/#actividades" class="btn btn--ghost btn--sm">Ver todas</a>
          </div>
          <div class="dash-card__body dash-actividades">
            ${ACTIVIDADES.filter(a => !a.cerrado).slice(0, 3).map(a => miniActividad(a, s)).join("")}
          </div>
        </section>

      </div>
    </main>
  </div>

  ${navMovil(false)}`;
}

/* =========================================================================
   HTML · Dashboard Admin Central
   ========================================================================= */
function htmlAdmin(s) {
  const st = STATS_ADMIN;
  return `
  <a class="skip-link" href="#contenido">Saltar al contenido principal</a>
  ${cabeceraAdmin(s)}

  <div class="dashboard-layout" id="contenido">

    ${sidebarAdmin(s)}

    <main class="dash-main">

      <!-- Acciones rápidas del admin -->
      <header class="dash-header reveal">
        <div>
          <p class="eyebrow">Panel de administración</p>
          <h1>FVRC · Administración Central</h1>
          <p class="text-secondary" style="margin-top:var(--sp-1)">
            ${new Date().toLocaleDateString("es-VE", { dateStyle: "long" })}
          </p>
        </div>
        <div class="dash-header__actions">
          <a class="btn btn--primary" href="#/admin/solicitudes">
            ${icono("inbox")} <span>${st.solicitudesVerificacion} pendientes</span>
          </a>
          <a class="btn btn--outline" href="#/admin/actividades">
            ${icono("plus")} <span>Nuevo evento</span>
          </a>
        </div>
      </header>

      <!-- KPIs del sistema -->
      <section class="dash-kpis reveal" aria-label="Métricas del sistema">
        ${kpi("users",    "Usuarios",          formatearNumero(st.totalUsuarios),           `+${st.usuariosNuevos} esta semana`, "brand")}
        ${kpi("escudo",   "Clubes oficiales",  formatearNumero(st.clubesOficiales),         `${st.clubesPendientes} en revisión`, "success")}
        ${kpi("calendar", "Actividades",       formatearNumero(st.actividadesActivas),      "Temporada 2026", "accent")}
        ${kpi("inbox",    "Verificaciones",    formatearNumero(st.solicitudesVerificacion), "Requieren acción", "warning")}
        ${kpi("users",    "Participantes",     formatearNumero(st.participantesActivos),    "Activos", "brand")}
        ${kpi("mapPin",   "Estados activos",   formatearNumero(st.estadosConActividad),     "de 24 entidades", "success")}
      </section>

      <!-- Accesos directos a módulos -->
      <section class="dash-grid reveal" aria-label="Módulos de administración">

        <!-- Cola de verificaciones — acceso directo -->
        <div class="dash-card dash-card--wide">
          <div class="dash-card__head">
            <h2>${icono("inbox")} Cola de verificaciones</h2>
            <a class="btn btn--primary btn--sm" href="#/admin/solicitudes">
              Gestionar todas ${icono("arrowRight")}
            </a>
          </div>
          <div class="dash-card__body" style="padding:0">
            ${tablaVerificacionesResumen()}
          </div>
        </div>

        <!-- Accesos rápidos a módulos admin -->
        <div class="dash-card">
          <div class="dash-card__head">
            <h2>${icono("grid")} Accesos rápidos</h2>
          </div>
          <div class="dash-card__body" style="display:grid;grid-template-columns:1fr 1fr;gap:var(--sp-3)">
            ${[
              ["admin/solicitudes",  "inbox",    "Verificaciones",  `${st.solicitudesVerificacion} pendientes`, "warning"],
              ["admin/actividades",  "calendar", "Eventos",         `${st.actividadesActivas} activos`,         "brand"],
              ["admin/usuarios",     "users",    "Usuarios",        `${st.totalUsuarios} registrados`,          "success"],
              ["admin/clubes",       "escudo",   "Clubes",          `${st.clubesOficiales} oficiales`,          "accent"],
              ["admin/reportes",     "grafico",  "Reportes",        "Estadísticas",                             "neutral"],
              ["admin/usuarios",     "mapPin",   "Estados activos", `${st.estadosConActividad} de 24`,          "neutral"]
            ].map(([ruta, ic, tit, sub, color]) => `
              <a href="#/${ruta}" class="kpi-card kpi-card--${color}"
                 style="text-decoration:none;cursor:pointer">
                <div class="kpi-card__icon">${icono(ic)}</div>
                <div class="kpi-card__body">
                  <span class="kpi-card__label">${esc(tit)}</span>
                  <span class="kpi-card__sub">${esc(sub)}</span>
                </div>
              </a>`).join("")}
          </div>
        </div>

        <!-- Actividades recientes -->
        <div class="dash-card">
          <div class="dash-card__head">
            <h2>${icono("calendar")} Actividades recientes</h2>
            <a class="btn btn--ghost btn--sm" href="#/admin/actividades">Ver todas</a>
          </div>
          <div class="dash-card__body">
            ${ACTIVIDADES.slice(0, 5).map(a => `
              <div class="dash-row">
                <span class="badge badge--neutral badge--sm" style="flex-shrink:0">${esc(a.tipo)}</span>
                <span class="dash-row__text">${esc(a.titulo)}</span>
                <span class="text-xs text-muted" style="flex-shrink:0">${esc(fechaCorta(a.fechaInicio))}</span>
              </div>`).join("")}
          </div>
        </div>

      </section>
    </main>
  </div>

  ${navMovilAdmin()}`;
}

/* =========================================================================
   Componentes reutilizables
   ========================================================================= */

function kpi(glifo, titulo, valor, sub, color = "brand") {
  return `
  <div class="kpi-card kpi-card--${color}">
    <div class="kpi-card__icon">${icono(glifo)}</div>
    <div class="kpi-card__body">
      <span class="kpi-card__value">${valor}</span>
      <span class="kpi-card__label">${esc(titulo)}</span>
      <span class="kpi-card__sub">${esc(sub)}</span>
    </div>
  </div>`;
}

function vacioCarta(glifo, texto, href, enlaceTexto) {
  return `
  <div class="dash-empty">
    ${icono(glifo)}
    <p>${esc(texto)}${href ? `<br><a href="${attr(href)}">${esc(enlaceTexto)}</a>` : ""}</p>
  </div>`;
}

function filaInscripcion(ins) {
  const act = ACTIVIDADES.find(a => a.id === ins.actividadId);
  if (!act) return "";
  const cl = ins.estado === "CONFIRMADA" ? "success" : ins.estado === "PENDIENTE" ? "warning" : "neutral";
  return `
  <div class="dash-row">
    <span class="dash-row__dot dash-row__dot--${cl}"></span>
    <div class="dash-row__body">
      <strong>${esc(act.titulo)}</strong>
      <span class="text-xs text-muted">${esc(fechaCorta(act.fechaInicio))} · ${esc(act.modalidad)}</span>
    </div>
    <span class="badge badge--${cl} badge--sm">${esc(ins.estado)}</span>
    <a href="#/actividades/${attr(act.id)}/inscribir" class="btn btn--ghost btn--xs"
       style="flex-shrink:0">Ver</a>
  </div>`;
}

function filaNotif(n) {
  const iconos = { success: "checkCircle", info: "info", warning: "alert", danger: "xCircle" };
  return `
  <div class="dash-row dash-row--notif ${n.leida ? "" : "is-unread"}">
    <span class="dash-row__icon dash-row__icon--${n.tipo}">${icono(iconos[n.tipo] || "info")}</span>
    <div class="dash-row__body">
      <strong>${esc(n.titulo)}</strong>
      <span class="text-xs text-muted">${esc(n.texto)}</span>
    </div>
    <span class="text-xs text-muted" style="flex-shrink:0">${esc(n.fecha)}</span>
  </div>`;
}

function tablaParticipantes(s) {
  const lista = PARTICIPANTES_DEMO.filter(p => p.userId === s.id);
  if (!lista.length) {
    return `<div class="dash-empty">
      ${icono("users")}
      <p>Aún no tienes participantes registrados.<br>
      <a href="#/participantes/nuevo">Registrar el primero</a></p>
    </div>`;
  }
  return `
  <div class="table-scroll">
    <table class="data-table">
      <thead>
        <tr>
          <th>Nombre</th>
          <th>Cédula</th>
          <th>Edad</th>
          <th>Nivel</th>
          <th>Equipo</th>
          <th>Estado</th>
        </tr>
      </thead>
      <tbody>
        ${lista.map(p => `
          <tr>
            <td><strong>${esc(p.nombres)} ${esc(p.apellidos)}</strong></td>
            <td class="mono text-sm">${esc(p.cedula)}</td>
            <td>${p.edad} años</td>
            <td class="text-sm">${esc(p.nivel)}</td>
            <td>${p.equipo
              ? `<span class="badge badge--neutral badge--sm">${esc(p.equipo)}</span>`
              : `<span class="text-muted">—</span>`}</td>
            <td><span class="badge badge--${p.estado === "ACTIVO" ? "success" : "warning"} badge--sm">
              ${esc(p.estado)}
            </span></td>
          </tr>`).join("")}
      </tbody>
    </table>
  </div>`;
}

function miniActividad(a, s) {
  const yaInscrito = INSCRIPCIONES_DEMO.some(i => i.usuarioId === s.id && i.actividadId === a.id);
  const restantes  = Math.max(0, a.cupos - a.inscritos);
  const f          = parteFecha(a.fechaInicio);
  return `
  <div class="mini-actividad">
    <div class="mini-actividad__date">
      <b>${f.dia}</b><span>${f.mesCorto}</span>
    </div>
    <div class="mini-actividad__body">
      <span class="badge badge--neutral badge--sm">${esc(a.tipo)}</span>
      <strong>${esc(a.titulo)}</strong>
      <span class="text-xs text-muted">${esc(a.lugar)} · ${restantes} cupos</span>
    </div>
    <div style="flex-shrink:0">
      ${yaInscrito
        ? `<span class="badge badge--success badge--sm">Inscrito</span>`
        : `<a href="#/actividades/${attr(a.id)}/inscribir" class="btn btn--primary btn--sm">Inscribirme</a>`}
    </div>
  </div>`;
}

function tablaVerificaciones() {
  const datos = [
    { nombre: "U.E. Nacional Bolivariana", tipo: "Inst. Educativa · Pública", fecha: "2026-10-06", estado: "PENDIENTE" },
    { nombre: "Carlos Ramírez",           tipo: "Persona Natural",            fecha: "2026-10-06", estado: "PENDIENTE" },
    { nombre: "Infocentro El Tigre",       tipo: "Infocentro",                fecha: "2026-10-05", estado: "PENDIENTE" },
    { nombre: "Universidad Nororiental",   tipo: "Universidad",               fecha: "2026-10-05", estado: "EN_REVISION" },
    { nombre: "Fundación CreaTech",        tipo: "Inst. Privada",             fecha: "2026-10-04", estado: "EN_REVISION" }
  ];
  return `
  <div class="table-scroll">
    <table class="data-table">
      <thead>
        <tr><th>Solicitante</th><th>Tipo</th><th>Fecha</th><th>Estado</th><th>Acciones</th></tr>
      </thead>
      <tbody>
        ${datos.map(r => `
          <tr>
            <td><strong>${esc(r.nombre)}</strong></td>
            <td class="text-sm">${esc(r.tipo)}</td>
            <td class="text-sm text-muted">${esc(r.fecha)}</td>
            <td><span class="badge badge--${r.estado === "PENDIENTE" ? "warning" : "info"} badge--sm">
              ${esc(r.estado)}
            </span></td>
            <td style="display:flex;gap:var(--sp-2)">
              <button class="btn btn--primary btn--xs"
                data-proximamente="Módulo de verificación">Revisar</button>
              <button class="btn btn--ghost btn--xs"
                data-proximamente="Módulo de verificación">Ver</button>
            </td>
          </tr>`).join("")}
      </tbody>
    </table>
  </div>`;
}

function bannerPerfilIncompleto() {
  return `
  <div class="dash-alert-perfil" role="alert">
    ${icono("alert")}
    <div>
      <strong>Completa tu perfil para participar en actividades</strong><br>
      Tu cuenta fue aprobada (<code>APROBADO_INICIAL</code>). Para inscribirte en eventos
      necesitas subir tu <strong>foto carnet</strong> y <strong>Curriculum Vitae</strong>.
    </div>
    <a href="#/perfil" class="btn btn--warning btn--sm">
      Completar perfil ${icono("arrowRight")}
    </a>
  </div>`;
}

function paginaAccesoRestringido() {
  return `
  <a class="skip-link" href="#contenido">Saltar al contenido</a>
  <header class="site-header" id="header">
    <div class="site-header__inner">
      <a class="brand" href="#/">
        <span class="brand__mark">
          <img src="assets/img/fvrc-logo-256.png" width="42" height="42" alt="Escudo FVRC">
        </span>
        <span class="brand__text"><span class="brand__name">FVRC</span></span>
      </a>
    </div>
  </header>
  <main id="contenido" class="container section center">
    <span class="icon-square" style="width:64px;height:64px;margin:0 auto var(--sp-6)">
      ${icono("lock")}
    </span>
    <h1 class="title-lg">Acceso restringido</h1>
    <p class="lede mx-auto" style="margin-top:var(--sp-4)">
      Esta área requiere que hayas iniciado sesión con una cuenta aprobada por la FVRC.
    </p>
    <div class="hero__ctas" style="justify-content:center;margin-top:var(--sp-8)">
      <a class="btn btn--primary btn--lg" href="#/login">
        Iniciar sesión ${icono("arrowRight")}
      </a>
      <a class="btn btn--outline btn--lg" href="#/">Volver al inicio</a>
    </div>
  </main>`;
}

function iniciales(nombres, apellidos) {
  return esc(
    ((nombres || "").trim()[0] || "").toUpperCase() +
    ((apellidos || "").trim()[0] || "").toUpperCase() || "U"
  );
}

/* =========================================================================
   Interacciones
   ========================================================================= */
function iniciarDashboard(sesion) {
  /* Llama al shell una sola vez */
  activarShell(document);

  /* ── Menú desplegable del usuario ─────────────────────────────────── */
  const btnMenu  = $("#btn-menu-usuario");
  const menuUser = $("#menu-usuario");

  function cerrarMenu() {
    if (!menuUser) return;
    menuUser.hidden = true;
    btnMenu?.setAttribute("aria-expanded", "false");
  }

  if (btnMenu && menuUser) {
    btnMenu.addEventListener("click", (e) => {
      e.stopPropagation();
      const estaAbierto = !menuUser.hidden;
      menuUser.hidden = estaAbierto;
      btnMenu.setAttribute("aria-expanded", String(!estaAbierto));
    });

    /* Cerrar al hacer clic fuera */
    document.addEventListener("click", cerrarMenu);
    limpiarAlSalir(() => document.removeEventListener("click", cerrarMenu));

    /* Evitar que clics dentro del menú cierren el menú antes de navegar */
    menuUser.addEventListener("click", (e) => e.stopPropagation());

    /* Cerrar con Escape */
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") cerrarMenu();
    });
  }

  /* ── Cerrar sesión ─────────────────────────────────────────────────── */
  $("#btn-cerrar-sesion")?.addEventListener("click", () => {
    cerrarSesion();
    notificar("Has cerrado sesión correctamente.", "success");
    navegar("#/login", { reemplazar: true });
  });

  /* ── Copiar RNR ────────────────────────────────────────────────────── */
  $("[data-copiar-rnr]")?.addEventListener("click", () => {
    navigator.clipboard?.writeText(sesion.rnr)
      .then(() => notificar(`RNR copiado: ${sesion.rnr}`, "success"))
      .catch(() => notificar("No se pudo copiar automáticamente.", "warning"));
  });

  /* ── Botones "próximamente" ────────────────────────────────────────── */
  $$("[data-proximamente]").forEach(btn => {
    btn.addEventListener("click", (e) => {
      /* Solo si es un botón (no un enlace) */
      if (btn.tagName === "A") return;
      e.preventDefault();
      notificar(
        `El módulo "${btn.dataset.proximamente}" se implementará en la siguiente fase.`,
        "info", "En desarrollo"
      );
    });
  });
}
