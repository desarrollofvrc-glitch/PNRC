/* ============================================================================
   PNRC · Núcleo de la aplicación
   Shell (header/footer), utilidades, modal, toasts, router hash y helpers UI
   ========================================================================== */

import { icono } from "./icons.js";
import { ACTIVIDADES, fechaCorta, parteFecha, rangoFechas, TIPOS_INSTITUCION, textoPrecio, montoPrecio, precioAnterior } from "./data.js";

/* =========================================================================
   1. Utilidades DOM y formato
   ======================================================================= */
export const $  = (sel, raiz = document) => raiz.querySelector(sel);
export const $$ = (sel, raiz = document) => Array.from(raiz.querySelectorAll(sel));

export function esc(valor) {
  return String(valor ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

export function attr(valor) { return esc(valor); }

export async function copiar(texto, mensaje = "Copiado al portapapeles") {
  try {
    await navigator.clipboard.writeText(texto);
    notificar(mensaje, "success");
  } catch {
    notificar("No se pudo copiar automáticamente", "warning");
  }
}

export function formatearNumero(n) { return new Intl.NumberFormat("es-VE").format(n); }

/** Calcula la edad exacta en años a partir de una fecha ISO (YYYY-MM-DD). */
export function calcularEdad(iso, referencia = new Date()) {
  if (!iso) return null;
  const [a, m, d] = iso.split("-").map(Number);
  if (!a || !m || !d) return null;
  const nac = new Date(Date.UTC(a, m - 1, d));
  if (Number.isNaN(nac.getTime())) return null;
  let edad = referencia.getUTCFullYear() - a;
  const mes = referencia.getUTCMonth() + 1;
  const dia = referencia.getUTCDate();
  if (mes < m || (mes === m && dia < d)) edad--;
  return edad;
}

export function hoyISO() {
  const h = new Date();
  return `${h.getFullYear()}-${String(h.getMonth() + 1).padStart(2, "0")}-${String(h.getDate()).padStart(2, "0")}`;
}

export function fechaLimiteMenor() {
  const h = new Date();
  h.setFullYear(h.getFullYear() - 18);
  return h.toISOString().slice(0, 10);
}

/** Genera un código RNR de demostración con el formato del documento. */
export function generarRNR(estado = "DC") {
  const codigos = {
    "Distrito Capital": "01", "Amazonas": "02", "Anzoátegui": "03", "Apure": "04", "Aragua": "05",
    "Barinas": "06", "Bolívar": "07", "Carabobo": "08", "Cojedes": "09", "Delta Amacuro": "10",
    "Falcón": "11", "Guárico": "12", "Lara": "13", "Mérida": "14", "Miranda": "15",
    "Monagas": "16", "Nueva Esparta": "17", "Portuguesa": "18", "Sucre": "19", "Táchira": "20",
    "Trujillo": "21", "Vargas": "22", "Yaracuy": "23", "Zulia": "24"
  };
  const cod = codigos[estado] || "01";
  const anio = String(new Date().getFullYear()).slice(-2);
  const alfabeto = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let azar = "";
  for (let i = 0; i < 6; i++) azar += alfabeto[Math.floor(Math.random() * alfabeto.length)];
  return `RNR ${anio}-${cod}0000-${azar}`;
}

/** Valida cédula venezolana: V/E/J/G + 6 a 9 dígitos, con o sin guiones. */
export function validarCedula(valor) {
  return /^[VEJGvejg]-?\d{6,9}$/.test(String(valor || "").trim());
}

export function validarEmail(valor) {
  return /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(String(valor || "").trim());
}

export function validarTelefono(valor) {
  const limpio = String(valor || "").replace(/[\s\-()]/g, "");
  return /^(0\d{3}|\+?58\d{3})\d{7}$/.test(limpio);
}

export function validarTexto(valor, min = 0, max = 100) {
  const v = String(valor || "").trim();
  return /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ' ]+$/.test(v) && v.length >= min && v.length <= max;
}

/** Medidor de contraseña: devuelve { nivel 0-4, reglas, cumplidas }
 *  Mapeo de fuerza (5 reglas → 4 barras):
 *    0 reglas            → nivel 0 (sin contraseña)
 *    1-2 reglas          → nivel 1 (muy débil)
 *    3 reglas            → nivel 2 (débil)
 *    4 reglas            → nivel 3 (aceptable)
 *    5 reglas            → nivel 4 (contraseña segura: medidor completo)
 */
export function evaluarPassword(pw) {
  const reglas = {
    longitud: pw.length >= 8,
    mayuscula: /[A-ZÁÉÍÓÚÜÑ]/.test(pw),
    minuscula: /[a-záéíóúüñ]/.test(pw),
    numero: /\d/.test(pw),
    especial: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?~`]/.test(pw)
  };
  const cumplidas = Object.values(reglas).filter(Boolean).length;
  let nivel;
  if (pw.length === 0) nivel = 0;
  else if (cumplidas <= 2) nivel = 1;
  else if (cumplidas === 3) nivel = 2;
  else if (cumplidas === 4) nivel = 3;
  else nivel = 4;
  /* Sin espacios en blanco: una clave larga con espacios no se considera segura */
  if (/\s/.test(pw) && nivel > 2) nivel = 2;
  return { nivel, reglas, cumplidas };
}

export const ETIQUETA_NIVEL = ["", "Muy débil", "Débil", "Aceptable", "Contraseña segura"];

/* =========================================================================
   2. Toasts
   ======================================================================= */
let regionToast = null;

export function notificar(mensaje, tipo = "info", titulo = "") {
  if (!regionToast) {
    regionToast = document.createElement("div");
    regionToast.className = "toast-region";
    regionToast.setAttribute("role", "status");
    regionToast.setAttribute("aria-live", "polite");
    document.body.appendChild(regionToast);
  }
  const glifos = { success: "checkCircle", danger: "xCircle", warning: "alert", info: "info" };
  const el = document.createElement("div");
  el.className = `toast toast--${tipo}`;
  el.innerHTML = `${icono(glifos[tipo] || "info")}
    <div>${titulo ? `<strong style="display:block">${esc(titulo)}</strong>` : ""}<span>${esc(mensaje)}</span></div>`;
  regionToast.appendChild(el);
  setTimeout(() => {
    el.style.transition = "opacity .3s, transform .3s";
    el.style.opacity = "0";
    el.style.transform = "translateY(8px)";
    setTimeout(() => el.remove(), 320);
  }, 4200);
}

/* =========================================================================
   3. Modal
   ======================================================================= */
let modalActual = null;
let ultimoFoco = null;

export function abrirModal({ titulo, cuerpo, pie = "", ancho = "" }) {
  cerrarModal();
  ultimoFoco = document.activeElement;
  const modal = document.createElement("div");
  modal.className = "modal";
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-modal", "true");
  modal.setAttribute("aria-label", titulo);
  modal.innerHTML = `
    <div class="modal__panel ${ancho}">
      <div class="modal__head">
        <h2 class="modal__title">${esc(titulo)}</h2>
        <button class="btn btn--ghost btn--icon" data-modal-close aria-label="Cerrar">${icono("x")}</button>
      </div>
      <div class="modal__body">${cuerpo}</div>
      ${pie ? `<div class="modal__foot">${pie}</div>` : ""}
    </div>`;
  document.body.appendChild(modal);
  document.body.style.overflow = "hidden";
  requestAnimationFrame(() => modal.classList.add("is-open"));

  modal.addEventListener("click", (e) => {
    if (e.target === modal || e.target.closest("[data-modal-close]")) cerrarModal();
  });
  document.addEventListener("keydown", alTeclearModal);
  modalActual = modal;
  const primero = modal.querySelector("[data-modal-close]");
  if (primero) setTimeout(() => primero.focus(), 40);
  return modal;
}

function alTeclearModal(e) {
  if (e.key === "Escape") { cerrarModal(); return; }
  if (e.key !== "Tab" || !modalActual) return;
  const focos = $$('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])', modalActual);
  if (!focos.length) return;
  const primero = focos[0], ultimo = focos[focos.length - 1];
  if (e.shiftKey && document.activeElement === primero) { e.preventDefault(); ultimo.focus(); }
  else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primero.focus(); }
}

export function cerrarModal() {
  if (!modalActual) return;
  modalActual.classList.remove("is-open");
  const m = modalActual;
  modalActual = null;
  document.removeEventListener("keydown", alTeclearModal);
  document.body.style.overflow = "";
  setTimeout(() => m.remove(), 220);
  if (ultimoFoco && typeof ultimoFoco.focus === "function") ultimoFoco.focus();
}

/* =========================================================================
   4. Router hash
   ======================================================================= */
const rutas = [];
export function ruta(patron, manejador) { rutas.push({ patron, manejador }); }

let paginaActual = null;

export function navegar(hash, { reemplazar = false } = {}) {
  const destino = hash.startsWith("#") ? hash : `#${hash}`;
  if (location.hash === destino) { resolver(); return; }
  if (reemplazar) history.replaceState(null, "", destino);
  else location.hash = destino;
  if (reemplazar) resolver();
}

export function rutaActual() {
  const bruto = (location.hash || "#/").replace(/^#/, "") || "/";
  return bruto.split("?")[0] || "/";
}

/** Gestiona enlaces de ancla dentro de una misma página (p. ej. #actividades). */
function alCambiarHash() {
  const hash = location.hash || "#/";
  /* Los anclas de sección no son rutas: solo desplazan la vista. */
  if (!hash.startsWith("#/")) {
    const destino = document.getElementById(hash.slice(1));
    if (destino) destino.scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }
  resolver();
}

export function iniciarRouter() {
  window.addEventListener("hashchange", alCambiarHash);
  resolver();
}

async function resolver() {
  const ruta_ = rutaActual();
  for (const { patron, manejador } of rutas) {
    const params = coincidir(patron, ruta_);
    if (!params) continue;

    if (paginaActual && typeof paginaActual.destruir === "function") paginaActual.destruir();
    ejecutarLimpieza();
    paginaActual = null;

    const app = $("#app");
    app.innerHTML = "";
    app.setAttribute("aria-busy", "true");

    try {
      const pagina = await manejador(params, app);
      if (!pagina) throw new Error("La vista no devolvió contenido");
      app.innerHTML = pagina.html;
      paginaActual = pagina;
      if (typeof pagina.iniciar === "function") await pagina.iniciar(pagina);
    } catch (err) {
      console.error("[router] Error al renderizar", ruta_, err);
      app.innerHTML = `<div class="container section">
        <div class="alert alert--danger">${icono("alertCircle")}
          <div><span class="alert__title">No se pudo cargar la vista</span>
          Revisa la consola del navegador para ver el detalle del error.</div></div></div>`;
      paginaActual = null;
    }

    app.removeAttribute("aria-busy");
    window.scrollTo({ top: 0, behavior: "auto" });
    observarReveals();
    document.title = paginaActual?.titulo
      ? `${paginaActual.titulo} · FVRC`
      : "FVRC · Plataforma Nacional de Robótica Creativa";
    return;
  }
  $("#app").innerHTML = paginaNoEncontrada();
}

function coincidir(patron, ruta_) {
  const pp = patron.split("/").filter(Boolean);
  const rp = ruta_.split("/").filter(Boolean);
  if (pp.length !== rp.length) return null;
  const params = {};
  for (let i = 0; i < pp.length; i++) {
    if (pp[i].startsWith(":")) params[pp[i].slice(1)] = decodeURIComponent(rp[i]);
    else if (pp[i] !== rp[i]) return null;
  }
  return params;
}

function paginaNoEncontrada() {
  return `<div class="container section center">
    <h1 class="title-lg">Página no encontrada</h1>
    <p class="lede mx-auto" style="margin-top:1rem">La dirección solicitada no existe en este prototipo.</p>
    <div class="hero__ctas" style="justify-content:center">
      <a class="btn btn--primary btn--lg" href="#/">${icono("arrowLeft")} Volver a la portada</a>
    </div></div>`;
}

/* =========================================================================
   5. Reveal al hacer scroll
   ======================================================================= */
let observador = null;
export function observarReveals() {
  if (!("IntersectionObserver" in window)) {
    $$(".reveal").forEach((el) => el.classList.add("is-visible"));
    return;
  }
  if (!observador) {
    observador = new IntersectionObserver((entradas) => {
      entradas.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add("is-visible"); observador.unobserve(e.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: .08 });
  }
  $$(".reveal:not(.is-visible)").forEach((el) => observador.observe(el));
}

/* =========================================================================
   6. Arte SVG de las tarjetas de actividad
   ======================================================================= */
const ARTES = {
  olimpiada:     { c1: "#0A2463", c2: "#1b3f96", glifo: "trophy" },
  programacion:  { c1: "#04102e", c2: "#123178", glifo: "programacion" },
  taller:        { c1: "#123178", c2: "#23429c", glifo: "tool" },
  ia:            { c1: "#0A2463", c2: "#4a67c4", glifo: "atom" },
  impresion3d:   { c1: "#071a49", c2: "#1b3f96", glifo: "impresion3d" },
  feria:         { c1: "#0A2463", c2: "#00a868", glifo: "feria" },
  docentes:      { c1: "#071a49", c2: "#23429c", glifo: "docente" },
  drones:        { c1: "#04102e", c2: "#4a67c4", glifo: "drones" }
};

export function arteActividad(nombre, semilla = "") {
  const cfg = ARTES[nombre] || ARTES.olimpiada;
  const id = `g${nombre}${semilla}`.replace(/[^a-zA-Z0-9]/g, "");
  /* La ilustración es decorativa: el título de la tarjeta ya comunica el
     contenido, por lo que se oculta a los lectores de pantalla en lugar de
     anunciarla como imagen con contenido. */
  return `
  <svg viewBox="0 0 400 225" aria-hidden="true" focusable="false" preserveAspectRatio="xMidYMid slice">
    <defs>
      <linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${cfg.c1}"/>
        <stop offset="100%" stop-color="${cfg.c2}"/>
      </linearGradient>
      <pattern id="${id}p" width="26" height="26" patternUnits="userSpaceOnUse">
        <path d="M26 0H0v26" fill="none" stroke="rgba(255,255,255,.09)" stroke-width="1"/>
      </pattern>
    </defs>
    <rect width="400" height="225" fill="url(#${id})"/>
    <rect width="400" height="225" fill="url(#${id}p)"/>
    <g opacity=".5" stroke="#EFC300" stroke-width="2.4" fill="none" stroke-linecap="round">
      <path d="M-6 168h64l26-26h52"/>
      <circle cx="140" cy="142" r="5.5" fill="#EFC300" stroke="none"/>
      <path d="M406 62h-58l-22 22h-46"/>
      <circle cx="276" cy="84" r="5.5" fill="#EFC300" stroke="none"/>
    </g>
    <g opacity=".16" fill="#fff">
      <circle cx="330" cy="180" r="52"/><circle cx="60" cy="42" r="34"/>
    </g>
    <g transform="translate(200 112)" fill="none" stroke="rgba(255,255,255,.92)" stroke-width="6"
       stroke-linecap="round" stroke-linejoin="round" opacity=".95">
      <g transform="translate(-30 -30) scale(2.5)">${cuerpoIcono(cfg.glifo)}</g>
    </g>
  </svg>`;
}

/* Devuelve solo los paths internos (sin <svg>) para reutilizar el trazo */
function cuerpoIcono(nombre) {
  const tmp = document.createElement("div");
  tmp.innerHTML = icono(nombre);
  const svg = tmp.querySelector("svg");
  return svg ? svg.innerHTML : "";
}

/* =========================================================================
   7. Shell: header, footer, navegación
   ======================================================================= */
const ENLACES_NAV = [
  { href: "#/#actividades", texto: "Cursos y eventos" },
  { href: "#/#como-funciona", texto: "Cómo funciona" },
  { href: "#/#audiencias", texto: "Para quién" },
  { href: "#/#clubes", texto: "Clubes" },
  { href: "#/#faq", texto: "Preguntas" }
];

export function cabecera({ activo = "" } = {}) {
  return `
  <a class="skip-link" href="#contenido">Saltar al contenido principal</a>
  <header class="site-header" id="header">
    <div class="site-header__inner">
      <a class="brand" href="#/" aria-label="FVRC · Inicio">
        <span class="brand__mark">
          <img src="assets/img/fvrc-logo-256.png" width="256" height="256" alt="Escudo de la Federación Venezolana de Robótica Creativa">
        </span>
        <span class="brand__text">
          <span class="brand__name">FVRC</span>
          <span class="brand__tag">Robótica Creativa</span>
        </span>
      </a>
      <nav class="main-nav" aria-label="Navegación principal">
        ${ENLACES_NAV.map((e) => `<a href="${e.href}" ${activo === e.texto ? 'aria-current="page"' : ""}>${esc(e.texto)}</a>`).join("")}
      </nav>
      <div class="header-actions">
        <button class="btn btn--ghost btn--icon" data-tema title="Cambiar tema" aria-label="Cambiar entre tema claro y oscuro">${icono("moon")}</button>
        <a class="btn btn--ghost btn--login" href="#/login">Iniciar sesión</a>
        <a class="btn btn--accent" href="#/registro">Crear cuenta</a>
        <button class="btn btn--ghost btn--icon nav-toggle" data-menu aria-label="Abrir menú" aria-expanded="false">${icono("menu")}</button>
      </div>
    </div>
  </header>
  <nav class="mobile-nav" id="menu-movil" aria-label="Navegación móvil" hidden>
    ${ENLACES_NAV.map((e) => `<a href="${e.href}" data-menu-link>${esc(e.texto)}</a>`).join("")}
    <a href="#/login" data-menu-link>Iniciar sesión</a>
    <a class="btn btn--accent btn--lg btn--block" href="#/registro" data-menu-link>Crear cuenta</a>
  </nav>`;
}

export function piePagina() {
  const anio = new Date().getFullYear();
  return `
  <footer class="site-footer">
    <div class="container container--wide">
      <div class="site-footer__grid">
        <div>
          <div class="site-footer__brand">
            <img src="assets/img/fvrc-logo-96.png" width="96" height="96" alt="">
            <strong>FVRC</strong>
          </div>
          <p class="site-footer__about">
            Federación Venezolana de Robótica Creativa. Núcleo digital oficial para el registro,
            la formación y la competencia de robótica creativa en todos los estados del país.
          </p>
          <div class="social-row">
            <a href="#/" data-proximamente="Instagram" aria-label="Instagram">${icono("instagram")}</a>
            <a href="#/" data-proximamente="X (Twitter)" aria-label="X">${icono("x_social")}</a>
            <a href="#/" data-proximamente="LinkedIn" aria-label="LinkedIn">${icono("linkedin")}</a>
            <a href="#/" data-proximamente="YouTube" aria-label="YouTube">${icono("youtube")}</a>
          </div>
        </div>
        <div>
          <h3>Plataforma</h3>
          <ul>
            <li><a href="#/registro">Crear cuenta</a></li>
            <li><a href="#/registro/persona-natural">Persona natural</a></li>
            <li><a href="#/registro/persona-juridica">Institución / club</a></li>
            <li><a href="#/login">Iniciar sesión</a></li>
            <li><a href="#/recuperar">Recuperar acceso</a></li>
          </ul>
        </div>
        <div>
          <h3>Actividades</h3>
          <ul>
            <li><a href="#/#actividades">Cursos y talleres</a></li>
            <li><a href="#/#actividades">Olimpiadas</a></li>
            <li><a href="#/#actividades">Ferias y congresos</a></li>
            <li><a href="#/#clubes">Clubes oficiales</a></li>
          </ul>
        </div>
        <div>
          <h3>Institucional</h3>
          <ul>
            <li><a href="#/#audiencias">Sobre la FVRC</a></li>
            <li><a href="#/#faq">Preguntas frecuentes</a></li>
            <li><a href="#/" data-proximamente="Términos de uso">Términos de uso</a></li>
            <li><a href="#/" data-proximamente="Política de privacidad">Política de privacidad</a></li>
            <li><a href="#/" data-proximamente="Contacto y soporte">Contacto y soporte</a></li>
          </ul>
        </div>
      </div>
      <div class="site-footer__bottom">
        <span>© ${anio} Federación Venezolana de Robótica Creativa. Prototipo de demostración.</span>
        <span class="site-footer__legal">
          <a href="#/" data-proximamente="Términos">Términos</a>
          <a href="#/" data-proximamente="Privacidad">Privacidad</a>
          <a href="#/" data-proximamente="Accesibilidad">Accesibilidad</a>
        </span>
      </div>
    </div>
  </footer>`;
}

/** Conecta header/footer/tema/menú tras inyectar el shell en una página. */
export function activarShell(raiz = document) {
  const header = $("#header", raiz);
  const alScroll = () => header?.classList.toggle("is-scrolled", window.scrollY > 8);
  if (header) {
    alScroll();
    window.addEventListener("scroll", alScroll, { passive: true });
  }
  limpiarAlSalir(() => window.removeEventListener("scroll", alScroll));

  const botonMenu = $("[data-menu]", raiz);
  const menu = $("#menu-movil", raiz);
  if (botonMenu && menu) {
    menu.hidden = false;
    const cerrar = () => {
      menu.classList.remove("is-open");
      botonMenu.setAttribute("aria-expanded", "false");
      botonMenu.innerHTML = icono("menu");
      document.body.style.overflow = "";
    };
    botonMenu.addEventListener("click", () => {
      const abierto = menu.classList.toggle("is-open");
      botonMenu.setAttribute("aria-expanded", String(abierto));
      botonMenu.innerHTML = icono(abierto ? "x" : "menu");
      document.body.style.overflow = abierto ? "hidden" : "";
    });
    $$("[data-menu-link]", menu).forEach((a) => a.addEventListener("click", cerrar));
    limpiarAlSalir(cerrar);
  }

  $$("[data-tema]", raiz).forEach((b) => b.addEventListener("click", alternarTema));
  pintarIconoTema();
}

/* -------------------------------------------------------------------------
   Limpieza de efectos al abandonar una página (evita fugas entre rutas)
   ----------------------------------------------------------------------- */
let tareasLimpieza = [];
export function limpiarAlSalir(fn) { tareasLimpieza.push(fn); }
function ejecutarLimpieza() {
  tareasLimpieza.forEach((fn) => { try { fn(); } catch { /* noop */ } });
  tareasLimpieza = [];
}

/* =========================================================================
   8. Tema claro/oscuro
   ======================================================================= */
export function inicializarTema() {
  const guardado = localStorage.getItem("pnrc-tema");
  const prefiereOscuro = window.matchMedia("(prefers-color-scheme: dark)").matches;
  document.documentElement.dataset.theme = guardado || (prefiereOscuro ? "dark" : "light");
}

function alternarTema() {
  const actual = document.documentElement.dataset.theme;
  const nuevo = actual === "dark" ? "light" : "dark";
  document.documentElement.dataset.theme = nuevo;
  localStorage.setItem("pnrc-tema", nuevo);
  pintarIconoTema();
}

function pintarIconoTema() {
  const oscuro = document.documentElement.dataset.theme === "dark";
  $$("[data-tema]").forEach((b) => { b.innerHTML = icono(oscuro ? "sun" : "moon"); });
}

/* =========================================================================
   9. Aside de "aviso de prototipo"
   ======================================================================= */
export function avisoPrototipo(texto = "Estás viendo un prototipo funcional de demostración. Los datos no se envían a ningún servidor.") {
  return `<div class="demo-banner">${icono("info")}
    <span><strong>Prototipo:</strong> ${esc(texto)}</span></div>`;
}

/* =========================================================================
   10. Tarjeta de actividad (portada)
   ======================================================================= */
export function tarjetaActividad(a) {
  const restantes = Math.max(0, a.cupos - a.inscritos);
  const pct = Math.min(100, Math.round((a.inscritos / a.cupos) * 100));
  const claseBarra = a.cerrado || restantes === 0 ? "is-full" : pct >= 80 ? "is-high" : "";
  const agotado = a.cerrado || restantes === 0;
  const f = parteFecha(a.fechaInicio);

  return `
  <article class="activity-card reveal" data-tipo="${attr(a.tipo)}" data-modalidad="${attr(a.modalidad)}"
           data-id="${attr(a.id)}" data-buscar="${attr((a.titulo + " " + a.lugar + " " + a.organiza + " " + a.tipo).toLowerCase())}">
    <div class="activity-card__media">
      ${arteActividad(a.arte, a.id)}
      <div class="activity-card__tags">
        <span class="badge badge--onDark badge--dot">${esc(a.tipo)}</span>
        ${a.destacado ? `<span class="badge badge--accent">Destacado</span>` : ""}
        ${agotado ? `<span class="badge badge--danger">Cupos agotados</span>` : ""}
      </div>
      <div class="activity-card__seats">
        <div class="seats">
          <div class="seats__bar"><div class="seats__fill ${claseBarra}" style="width:${pct}%"></div></div>
          <span class="seats__text">${agotado ? "Sin cupos" : `${formatearNumero(restantes)} cupos`} · ${pct}%</span>
        </div>
      </div>
    </div>
    <div class="activity-card__body">
      <div class="activity-card__meta">
        <span>${icono("calendar")} ${esc(fechaCorta(a.fechaInicio))}</span>
        <span>${icono("mapPin")} ${esc(a.lugar)}</span>
      </div>
      <h3 class="activity-card__title">${esc(a.titulo)}</h3>
      <p class="activity-card__desc">${esc(a.descripcion)}</p>
      <div class="activity-card__org">
        <span class="icon-square">${icono("building")}</span>
        <span>${esc(a.organiza)}</span>
      </div>
      <div class="activity-card__foot">
        <div class="price">
          ${a.precioBs === 0
            ? `<span class="price__free">${esc(a.notaPrecio || "Gratis")}</span>`
            : `<span class="price__now">${esc(montoPrecio(a))}</span>`}
          ${precioAnterior(a) ? `<span class="price__was">${esc(precioAnterior(a))}</span>` : ""}
        </div>
        <button class="btn btn--primary btn--sm" data-ver="${attr(a.id)}" ${agotado ? "disabled" : ""}>
          ${agotado ? "Agotado" : "Ver e inscribirme"} ${icono("arrowRight")}
        </button>
      </div>
    </div>
  </article>`;
}

/** Modal con el detalle completo de una actividad. */
export function verDetalleActividad(id) {
  const a = ACTIVIDADES.find((x) => x.id === id);
  if (!a) return;
  const restantes = Math.max(0, a.cupos - a.inscritos);
  const filas = [
    ["Tipo de actividad", a.tipo],
    ["Modalidad", a.modalidad],
    ["Participación", a.formato],
    ["Fechas", rangoFechas(a.fechaInicio, a.fechaFin)],
    ["Lugar", `${a.lugar} — ${a.sede}`],
    ["Organiza", a.organiza],
    ["Cupos", `${a.inscritos} de ${a.cupos} ocupados · ${restantes} disponibles`],
    ["Cierre de inscripción", fechaCorta(a.cierra)],
    ["Costo", textoPrecio(a)],
    ["Requisitos", a.requisitos]
  ];
  abrirModal({
    titulo: a.titulo,
    ancho: "modal__panel--wide",
    cuerpo: `
      <div style="border-radius:var(--r-lg);overflow:hidden;margin-bottom:var(--sp-5)">
        ${arteActividad(a.arte, a.id + "m")}
      </div>
      <div class="row row--wrap" style="margin-bottom:var(--sp-5)">
        <span class="badge badge--brand">${esc(a.tipo)}</span>
        <span class="badge badge--neutral">${esc(a.modalidad)}</span>
        <span class="badge badge--info">${esc(a.formato)}</span>
        <span class="badge badge--${restantes === 0 ? "danger" : "success"}">
          ${restantes === 0 ? "Cupos agotados" : `${restantes} cupos disponibles`}
        </span>
      </div>
      <p class="text-secondary" style="margin-bottom:var(--sp-6)">${esc(a.descripcion)}</p>
      <dl class="summary-list">
        ${filas.map(([k, v]) => `<div class="summary-list__row"><dt>${esc(k)}</dt><dd title="${attr(v)}">${esc(v)}</dd></div>`).join("")}
      </dl>
      <div class="alert alert--info" style="margin-top:var(--sp-6)">${icono("info")}
        <div><span class="alert__title">Para inscribirte necesitas una cuenta verificada</span>
        La FVRC valida tu registro antes de habilitar la inscripción. Si aún no tienes cuenta, crea una en menos de 5 minutos.</div>
      </div>`,
    pie: `<button class="btn btn--ghost" data-modal-close>Ver otras actividades</button>
          <a class="btn btn--primary" href="#/registro">Crear cuenta y postularme ${icono("arrowRight")}</a>`
  });
}

export { TIPOS_INSTITUCION, ACTIVIDADES, fechaCorta, rangoFechas, parteFecha };
