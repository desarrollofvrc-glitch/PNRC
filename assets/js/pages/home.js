/* ============================================================================
   PNRC · Portada pública (landing)
   ========================================================================== */

import { icono } from "../icons.js";
import {
  $, $$, esc, attr, activarShell, cabecera, piePagina, tarjetaActividad,
  verDetalleActividad, notificar, formatearNumero, avisoPrototipo, arteActividad, limpiarAlSalir
} from "../app.js";
import {
  ACTIVIDADES, TIPOS_ACTIVIDAD, MODALIDADES, HERO_STATS, BENEFICIOS,
  AUDIENCIAS, TESTIMONIOS, FAQ, fechaCorta, parteFecha, rangoFechas
} from "../data.js";

/* Filtros activos de la cartelera */
const filtros = { tipo: "Todos", modalidad: "Todas", texto: "", orden: "proximos" };

export function vistaPortada() {
  return {
    titulo: "Cursos, talleres y competencias de robótica en Venezuela",
    html: `    ${cabecera()}
    <main id="contenido">
      ${bloqueHero()}
      ${bloqueFranja()}
      <section class="section section--tight" aria-labelledby="titulo-actividades" id="actividades">
        <div class="container container--wide">
          ${bloqueCartelera()}
        </div>
      </section>
      ${bloqueComoFunciona()}
      ${bloqueAudiencias()}
      ${bloqueBeneficios()}
      ${bloqueClubes()}
      ${bloqueTestimonios()}
      ${bloqueFaq()}
      ${bloqueNewsletter()}
    </main>
    ${piePagina()}
    <div id="zona-modal"></div>`
  };
}

/* ------------------------------- Hero ----------------------------------- */
function bloqueHero() {
  const proximas = ACTIVIDADES
    .filter((a) => !a.cerrado)
    .sort((x, y) => x.fechaInicio.localeCompare(y.fechaInicio))
    .slice(0, 3);

  return `
  <section class="hero">
    <div class="container container--wide">
      <div class="hero__grid">
        <div>
          <span class="hero__badge"><b>Nuevo</b> Inscripciones abiertas · Temporada 2026</span>
          <h1 class="title-xl">Formamos a la generación que construye, programa y <em>compite</em> con sus propias manos.</h1>
          <p class="hero__lede">
            La plataforma oficial de la Federación Venezolana de Robótica Creativa. Encuentra cursos,
            talleres, olimpiadas y ferias en todo el país, inscríbete en línea y recibe tu
            certificado digital avalado por la federación.
          </p>
          <div class="hero__ctas">
            <a class="btn btn--accent btn--xl" href="#/registro">Crear mi cuenta gratis ${icono("arrowRight")}</a>
            <a class="btn btn--outline-inverse btn--xl" href="#actividades">${icono("search")} Explorar actividades</a>
          </div>
          <div class="hero__microcopy">
            <span>${icono("check")} Registro sin costo</span>
            <span>${icono("check")} Verificación FVRC</span>
            <span>${icono("check")} Certificado digital incluido</span>
          </div>
          <div class="hero__stats">
            ${HERO_STATS.map((s) => `
              <div class="hero__stat">
                <b>${esc(s.valor)}</b>
                <span>${esc(s.label)}</span>
              </div>`).join("")}
          </div>
        </div>
        <aside class="hero__panel" aria-label="Próximas actividades">
          <div class="hero__panel-head">
            <h2>Próximas actividades</h2>
            <span class="badge badge--onDark badge--dot">En vivo</span>
          </div>
          <div class="hero__panel-list">
            ${proximas.map((a) => {
              const f = parteFecha(a.fechaInicio);
              return `<a class="hero__mini" href="#actividades" data-ver="${attr(a.id)}">
                <span class="hero__mini-date"><b>${f.dia}</b><span>${f.mesCorto}</span></span>
                <span class="hero__mini-body">
                  <strong>${esc(a.titulo)}</strong>
                  <span>${esc(a.tipo)} · ${esc(a.lugar)}</span>
                </span>
              </a>`;
            }).join("")}
          </div>
          <a class="btn btn--inverse btn--block" style="margin-top:var(--sp-5)" href="#actividades">
            Ver las ${ACTIVIDADES.length} actividades disponibles
          </a>
        </aside>
      </div>
    </div>
  </section>`;
}

/* --------------------------- Franja de confianza ------------------------ */
function bloqueFranja() {
  const items = [
    ["shield", "Federación Venezolana de Robótica Creativa"],
    ["building", "Adscrita al Ministerio de Ciencia y Tecnología"],
    ["users", "45 clubes oficiales activos"],
    ["award", "Certificados verificables"]
  ];
  return `
  <section class="trustbar" aria-label="Respaldo institucional">
    <div class="container container--wide">
      <div class="trustbar__inner">
        <span class="trustbar__label">Con el respaldo de</span>
        <div class="trustbar__items">
          ${items.map(([ic, tx]) => `<span class="trustbar__item">${icono(ic)} ${esc(tx)}</span>`).join("")}
        </div>
      </div>
    </div>
  </section>`;
}

/* ----------------------------- Cartelera -------------------------------- */
function bloqueCartelera() {
  const conteos = contarPorTipo();
  const chips = ["Todos", ...TIPOS_ACTIVIDAD.filter((t) => conteos[t])];
  const proxima = [...ACTIVIDADES].sort((a, b) => a.fechaInicio.localeCompare(b.fechaInicio))[0];

  return `
    <div class="section-head">
      <span class="eyebrow">Cartelera nacional</span>
      <h2 class="title-lg" id="titulo-actividades">Cursos y eventos disponibles ahora mismo</h2>
      <p class="lede">
        Filtra por tipo de actividad, modalidad o sede. Cada ficha muestra cupos reales,
        fecha de cierre y requisitos antes de que inicies tu inscripción.
      </p>
    </div>

    <div class="searchbar" role="search" style="margin-bottom:var(--sp-6)">
      <div class="searchbar__field">
        ${icono("search")}
        <label class="sr-only" for="buscar-actividad">Buscar actividad</label>
        <input id="buscar-actividad" type="search" placeholder="Buscar por nombre, ciudad o institución…" autocomplete="off">
      </div>
      <div class="searchbar__sep" aria-hidden="true"></div>
      <div class="searchbar__field" style="flex:0 0 auto;min-width:200px">
        ${icono("mapPin")}
        <label class="sr-only" for="orden-actividad">Orden</label>
        <select id="orden-actividad" class="select" style="border:0;background-color:transparent;padding-left:0">
          <option value="proximos">Próximas por fecha</option>
          <option value="cupos">Más cupos disponibles</option>
          <option value="titulo">Orden alfabético</option>
        </select>
      </div>
      <button class="btn btn--primary" data-aplicar-filtros>${icono("search")} Buscar</button>
    </div>

    <div class="stack stack-4" style="margin-bottom:var(--sp-6)">
      <div class="chipset" role="group" aria-label="Filtrar por tipo de actividad">
        ${chips.map((t) => {
          const n = t === "Todos" ? ACTIVIDADES.length : conteos[t];
          return `<button class="chip" data-filtro-tipo="${attr(t)}" aria-pressed="${filtros.tipo === t}">
            ${esc(t)}<span class="chip__count">${n}</span></button>`;
        }).join("")}
      </div>
      <div class="chipset" role="group" aria-label="Filtrar por modalidad">
        ${["Todas", ...MODALIDADES].map((m) => `
          <button class="chip" data-filtro-modalidad="${attr(m)}" aria-pressed="${filtros.modalidad === m}">
            ${esc(m === "Todas" ? "Todas las modalidades" : m)}</button>`).join("")}
      </div>
    </div>

    <div class="results-bar">
      <span class="results-bar__count" id="conteo-resultados"><b>${ACTIVIDADES.length}</b> actividades disponibles</span>
      <span class="pill-note">${icono("clock")} Cierre de inscripciones más próximo: ${esc(fechaCorta(proxima.cierra))}</span>
    </div>

    <div class="grid grid--auto" id="lista-actividades" aria-live="polite">
      ${ACTIVIDADES.map(tarjetaActividad).join("")}
    </div>

    <div id="sin-resultados" hidden>
      <div class="empty-state">
        ${icono("search")}
        <h3>No encontramos actividades con esos filtros</h3>
        <p class="text-secondary">Prueba quitando algún filtro o revisa la cartelera completa.</p>
        <button class="btn btn--outline" data-limpiar-filtros>${icono("refresh")} Limpiar filtros</button>
      </div>
    </div>

    <div class="center" style="margin-top:var(--sp-10)">
      <div class="pill-note" style="padding:var(--sp-4) var(--sp-5);border-radius:var(--r-lg)">
        ${icono("bell")}
        <span>Se publican nuevas convocatorias cada semana. Suscríbete al boletín para recibirlas primero.</span>
        <a class="btn btn--sm btn--primary" href="#boletin">Suscribirme</a>
      </div>
    </div>`;
}

function contarPorTipo() {
  return ACTIVIDADES.reduce((acc, a) => { acc[a.tipo] = (acc[a.tipo] || 0) + 1; return acc; }, {});
}

/* --------------------------- Cómo funciona ------------------------------ */
function bloqueComoFunciona() {
  const pasos = [
    ["user", "Crea tu cuenta", "Elige si te registras como persona natural o como institución. Toma menos de 5 minutos y no tiene costo."],
    ["shield", "La FVRC verifica", "Revisamos tus datos y documentos. Al aprobar tu solicitud recibes por correo tus credenciales y tu código RNR."],
    ["calendarCheck", "Inscríbete", "Explora la cartelera, revisa requisitos y cupos, y postúlate a cursos, talleres, ferias u olimpiadas."],
    ["award", "Aprende y certifica", "Participa, acumula resultados en tu perfil y descarga tus certificados digitales avalados."]
  ];
  return `
  <section class="section section--brand" id="como-funciona" aria-labelledby="titulo-como">
    <div class="container container--wide">
      <div class="section-head section-head--center">
        <span class="eyebrow">Cómo funciona</span>
        <h2 class="title-lg" id="titulo-como">De cero a competir en cuatro pasos</h2>
        <p class="lede mx-auto">
          Un solo flujo para participantes, docentes, clubes e instituciones. Sin planillas en papel
          y con trazabilidad de cada etapa.
        </p>
      </div>
      <div class="steps-flow">
        ${pasos.map(([ic, t, tx]) => `
          <article class="flow-step reveal">
            <span class="flow-step__icon">${icono(ic)}</span>
            <h3>${esc(t)}</h3>
            <p>${esc(tx)}</p>
          </article>`).join("")}
      </div>
      <div class="hero__ctas" style="justify-content:center;margin-top:var(--sp-10)">
        <a class="btn btn--accent btn--lg" href="#/registro">Empezar ahora ${icono("arrowRight")}</a>
        <a class="btn btn--outline-inverse btn--lg" href="#/login">Ya tengo cuenta</a>
      </div>
    </div>
  </section>`;
}

/* ---------------------------- Audiencias -------------------------------- */
function bloqueAudiencias() {
  return `
  <section class="section" id="audiencias" aria-labelledby="titulo-audiencias">
    <div class="container container--wide">
      <div class="section-head">
        <span class="eyebrow">Para quién es</span>
        <h2 class="title-lg" id="titulo-audiencias">Una plataforma, tres formas de participar</h2>
        <p class="lede">Cada perfil tiene su propio recorrido, sus requisitos y sus permisos dentro de la federación.</p>
      </div>
      <div class="grid grid--3">
        ${AUDIENCIAS.map((a) => `
          <article class="audience-card reveal">
            <span class="audience-card__icon">${icono(a.icono)}</span>
            <h3>${esc(a.titulo)}</h3>
            <p>${esc(a.texto)}</p>
            <ul>${a.puntos.map((p) => `<li>${icono("check")}<span>${esc(p)}</span></li>`).join("")}</ul>
          </article>`).join("")}
      </div>
      <div class="nature-grid" style="margin-top:var(--sp-10)">
        <a class="choice-card reveal" href="#/registro/persona-natural" style="text-decoration:none">
          <span class="choice-card__icon">${icono("user")}</span>
          <span class="choice-card__title">Soy persona natural</span>
          <span class="choice-card__desc">
            Tutores, docentes, participantes independientes y aspirantes a federado que solo
            buscan cursos y eventos académicos.
          </span>
          <span class="choice-card__cta">Registrarme como persona natural ${icono("arrowRight")}</span>
        </a>
        <a class="choice-card reveal" href="#/registro/persona-juridica" style="text-decoration:none">
          <span class="choice-card__icon">${icono("building")}</span>
          <span class="choice-card__title">Represento una institución</span>
          <span class="choice-card__desc">
            Colegios, universidades, infocentros, fundaciones, empresas y clubes que desean
            federarse y gestionar sus equipos.
          </span>
          <span class="choice-card__cta">Registrar mi institución ${icono("arrowRight")}</span>
        </a>
      </div>
    </div>
  </section>`;
}

/* ---------------------------- Beneficios -------------------------------- */
function bloqueBeneficios() {
  return `
  <section class="section section--alt" aria-labelledby="titulo-beneficios">
    <div class="container container--wide">
      <div class="section-head">
        <span class="eyebrow">Por qué registrarte</span>
        <h2 class="title-lg" id="titulo-beneficios">Todo lo que obtienes al ser parte de la FVRC</h2>
      </div>
      <div class="grid grid--3">
        ${BENEFICIOS.map((b) => `
          <article class="benefit reveal">
            <span class="benefit__icon">${icono(b.icono)}</span>
            <div>
              <h3>${esc(b.titulo)}</h3>
              <p>${esc(b.texto)}</p>
            </div>
          </article>`).join("")}
      </div>
    </div>
  </section>`;
}

/* ------------------------------- Clubes --------------------------------- */
function bloqueClubes() {
  const clubes = [
    { nombre: "Club Robolara", lugar: "Barquisimeto, Lara", lineas: ["Programación y algoritmos", "Electrónica y circuitos"], miembros: 24, estado: "Abierto" },
    { nombre: "Cibernética UC", lugar: "Valencia, Carabobo", lineas: ["Automatización Industrial", "Internet de las cosas"], miembros: 18, estado: "Bajo invitación" },
    { nombre: "Zulia Bots", lugar: "Maracaibo, Zulia", lineas: ["Inteligencia artificial", "Diseño e impresión 3D"], miembros: 31, estado: "Abierto" },
    { nombre: "Andes Robotics", lugar: "Mérida, Mérida", lineas: ["Mecánica y estructuras", "Telecomunicaciones"], miembros: 12, estado: "Abierto" }
  ];
  return `
  <section class="section" id="clubes" aria-labelledby="titulo-clubes">
    <div class="container container--wide">
      <div class="section-head">
        <span class="eyebrow">Comunidad</span>
        <h2 class="title-lg" id="titulo-clubes">Clubes oficiales que ya están compitiendo</h2>
        <p class="lede">
          Un club oficial requiere al menos 5 participantes activos, un tutor responsable y la
          aprobación de la FVRC. Así se ve el directorio público.
        </p>
      </div>
      <div class="grid grid--4">
        ${clubes.map((c) => `
          <article class="card card--pad reveal">
            <div class="row row--between" style="align-items:flex-start">
              <span class="icon-square" style="width:44px;height:44px">${icono("robot")}</span>
              <span class="badge badge--${c.estado === "Abierto" ? "success" : "warning"}">${esc(c.estado)}</span>
            </div>
            <h3 class="title-sm" style="margin-top:var(--sp-4)">${esc(c.nombre)}</h3>
            <p class="text-sm text-secondary" style="margin-top:var(--sp-2)">${icono("mapPin")} ${esc(c.lugar)}</p>
            <div class="chipset" style="margin-top:var(--sp-4)">
              ${c.lineas.map((l) => `<span class="badge badge--neutral">${esc(l)}</span>`).join("")}
            </div>
            <div class="row row--between" style="margin-top:var(--sp-5);padding-top:var(--sp-4);border-top:1px solid var(--border-subtle)">
              <span class="text-xs text-muted">${icono("users")} ${c.miembros} integrantes</span>
              <a class="btn btn--outline btn--sm" href="#/registro">Unirme</a>
            </div>
          </article>`).join("")}
      </div>
      <div class="alert alert--info" style="margin-top:var(--sp-8)">
        ${icono("info")}
        <div>
          <span class="alert__title">¿Quieres crear tu propio club?</span>
          Reúne 5 participantes, registra a un tutor responsable y solicita la formalización.
          La FVRC verificará los recaudos antes de otorgar el estatus oficial.
        </div>
      </div>
    </div>
  </section>`;
}

/* ----------------------------- Testimonios ------------------------------ */
function bloqueTestimonios() {
  const estrella = `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="m12 3.5 2.7 5.6 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1L3.2 10l6.1-.9L12 3.5Z"/></svg>`;
  return `
  <section class="section section--alt" aria-labelledby="titulo-testimonios">
    <div class="container container--wide">
      <div class="section-head section-head--center">
        <span class="eyebrow">Voces de la comunidad</span>
        <h2 class="title-lg" id="titulo-testimonios">Quienes ya usan la plataforma</h2>
      </div>
      <div class="grid grid--3">
        ${TESTIMONIOS.map((t) => `
          <figure class="quote reveal">
            <div class="quote__stars" aria-label="5 de 5 estrellas">${estrella.repeat(5)}</div>
            <blockquote>“${esc(t.texto)}”</blockquote>
            <figcaption>
              <span class="avatar" aria-hidden="true">${esc(t.iniciales)}</span>
              <span>
                <strong>${esc(t.nombre)}</strong>
                <span>${esc(t.cargo)}</span>
              </span>
            </figcaption>
          </figure>`).join("")}
      </div>
    </div>
  </section>`;
}

/* --------------------------------- FAQ ---------------------------------- */
function bloqueFaq() {
  return `
  <section class="section" id="faq" aria-labelledby="titulo-faq">
    <div class="container container--medium">
      <div class="section-head section-head--center">
        <span class="eyebrow">Preguntas frecuentes</span>
        <h2 class="title-lg" id="titulo-faq">Resolvemos tus dudas antes de empezar</h2>
      </div>
      <div class="faq">
        ${FAQ.map((f, i) => `
          <div class="faq__item">
            <h3>
              <button class="faq__q" aria-expanded="false" aria-controls="faq-${i}" id="faq-q-${i}">
                <span>${esc(f.p)}</span>${icono("plus")}
              </button>
            </h3>
            <div class="faq__a" id="faq-${i}" role="region" aria-labelledby="faq-q-${i}">
              <div class="faq__a-inner">${esc(f.r)}</div>
            </div>
          </div>`).join("")}
      </div>
      <div class="center" style="margin-top:var(--sp-8)">
        <p class="text-secondary">¿No encontraste lo que buscabas?</p>
        <div class="hero__ctas" style="justify-content:center;margin-top:var(--sp-3)">
          <a class="btn btn--outline" href="#/">${icono("headphones")} Contactar a soporte</a>
          <a class="btn btn--primary" href="#/registro">Crear mi cuenta</a>
        </div>
      </div>
    </div>
  </section>`;
}

/* ------------------------------ Newsletter ------------------------------ */
function bloqueNewsletter() {
  return `
  <section class="section section--tight" id="boletin" aria-labelledby="titulo-boletin">
    <div class="container container--wide">
      <div class="card card--pad-lg reveal">
        <div class="newsletter">
          <div>
            <span class="eyebrow">Boletín de convocatorias</span>
            <h2 class="title-md" id="titulo-boletin" style="margin-top:var(--sp-3)">
              Recibe las nuevas actividades antes de que se llenen
            </h2>
            <p class="lede" style="margin-top:var(--sp-3)">
              Una vez al mes: cursos abiertos, olimpiadas, talleres para docentes y convocatorias
              de la federación. Sin spam, con enlace de baja en cada envío.
            </p>
          </div>
          <form class="newsletter__form" id="form-boletin" novalidate>
            <div class="newsletter__row">
              <label class="sr-only" for="boletin-correo">Correo electrónico</label>
              <input class="input" id="boletin-correo" name="correo" type="email"
                     placeholder="tucorreo@ejemplo.com" autocomplete="email" required>
              <button class="btn btn--primary btn--field" type="submit">Suscribirme ${icono("send")}</button>
            </div>
            <div class="hp-field" aria-hidden="true">
              <label for="boletin-empresa">No completar</label>
              <input id="boletin-empresa" name="empresa" type="text" tabindex="-1" autocomplete="off">
            </div>
            <label class="checkline">
              <input type="checkbox" name="consentimiento" required>
              <span>Autorizo el tratamiento de mis datos para recibir información de la FVRC,
              conforme a la <a href="#/">política de privacidad</a>.</span>
            </label>
            <p class="text-xs text-muted" id="boletin-estado" role="status"></p>
          </form>
        </div>
      </div>
    </div>
  </section>

  <section class="section section--tight">
    <div class="container container--wide">
      <div class="cta-band">
        <span class="eyebrow" style="color:var(--c-accent-400)">Únete a la federación</span>
        <h2 class="title-lg" style="margin-top:var(--sp-3)">Tu primer proyecto de robótica empieza hoy</h2>
        <p>Crea tu cuenta gratis, deja que la FVRC verifique tus datos y postúlate a la próxima convocatoria.</p>
        <div class="hero__ctas">
          <a class="btn btn--accent btn--xl" href="#/registro">Crear mi cuenta ${icono("arrowRight")}</a>
          <a class="btn btn--outline-inverse btn--xl" href="#actividades">Ver actividades</a>
        </div>
      </div>
    </div>
  </section>`;
}

/* =========================================================================
   Inicialización de la portada
   ======================================================================= */
export function iniciarPortada(page) {
  activarShell(document);
  /* --- Filtros y búsqueda --- */
  const lista = $("#lista-actividades");
  const vacio = $("#sin-resultados");
  const conteo = $("#conteo-resultados");
  const input = $("#buscar-actividad");
  const selOrden = $("#orden-actividad");

  const aplicar = () => {
    const tarjetas = $$(".activity-card", lista);
    let visibles = 0;
    tarjetas.forEach((t) => {
      const okTipo = filtros.tipo === "Todos" || t.dataset.tipo === filtros.tipo;
      const okMod = filtros.modalidad === "Todas" || t.dataset.modalidad === filtros.modalidad;
      const okTexto = !filtros.texto || t.dataset.buscar.includes(filtros.texto);
      const visible = okTipo && okMod && okTexto;
      t.style.display = visible ? "" : "none";
      if (visible) visibles++;
    });

    ordenarTarjetas(tarjetas, lista, selOrden.value);

    conteo.innerHTML = `<b>${visibles}</b> ${visibles === 1 ? "actividad" : "actividades"} ${visibles === ACTIVIDADES.length ? "disponibles" : "encontradas"}`;
    vacio.hidden = visibles !== 0;
    lista.hidden = visibles === 0;
  };

  $$("[data-filtro-tipo]", document).forEach((b) => b.addEventListener("click", () => {
    filtros.tipo = b.dataset.filtroTipo;
    $$("[data-filtro-tipo]").forEach((o) => o.setAttribute("aria-pressed", String(o === b)));
    aplicar();
  }));

  $$("[data-filtro-modalidad]", document).forEach((b) => b.addEventListener("click", () => {
    filtros.modalidad = b.dataset.filtroModalidad;
    $$("[data-filtro-modalidad]").forEach((o) => o.setAttribute("aria-pressed", String(o === b)));
    aplicar();
  }));

  let temporizador;
  input?.addEventListener("input", () => {
    clearTimeout(temporizador);
    temporizador = setTimeout(() => {
      filtros.texto = input.value.trim().toLowerCase();
      aplicar();
    }, 180);
  });

  selOrden?.addEventListener("change", () => { filtros.orden = selOrden.value; aplicar(); });

  $("[data-aplicar-filtros]")?.addEventListener("click", () => {
    $("#actividades")?.scrollIntoView({ behavior: "smooth", block: "start" });
    aplicar();
  });

  $("[data-limpiar-filtros]")?.addEventListener("click", () => {
    filtros.tipo = "Todos"; filtros.modalidad = "Todas"; filtros.texto = "";
    if (input) input.value = "";
    if (selOrden) selOrden.value = "proximos";
    $$("[data-filtro-tipo]").forEach((o) => o.setAttribute("aria-pressed", String(o.dataset.filtroTipo === "Todos")));
    $$("[data-filtro-modalidad]").forEach((o) => o.setAttribute("aria-pressed", String(o.dataset.filtroModalidad === "Todas")));
    aplicar();
  });

  /* --- Detalle de actividad --- */
  document.addEventListener("click", (e) => {
    const disparador = e.target.closest("[data-ver]");
    if (!disparador) return;
    const id = disparador.dataset.ver;
    if (disparador.tagName === "A" && disparador.getAttribute("href") === "#actividades") {
      e.preventDefault();
      $("#actividades")?.scrollIntoView({ behavior: "smooth" });
      setTimeout(() => verDetalleActividad(id), 260);
      return;
    }
    verDetalleActividad(id);
  });

  /* --- Acordeón de preguntas --- */
  const ajustarAlturaFaq = () => {
    $$(".faq__q").forEach((b) => {
      if (b.getAttribute("aria-expanded") !== "true") return;
      const p = document.getElementById(b.getAttribute("aria-controls"));
      if (p) p.style.height = `${p.scrollHeight}px`;
    });
  };

  $$(".faq__q").forEach((boton) => {
    boton.addEventListener("click", () => {
      const panel = document.getElementById(boton.getAttribute("aria-controls"));
      const abierto = boton.getAttribute("aria-expanded") === "true";
      $$(".faq__q").forEach((b) => {
        if (b === boton) return;
        b.setAttribute("aria-expanded", "false");
        const p = document.getElementById(b.getAttribute("aria-controls"));
        if (p) p.style.height = "0px";
      });
      boton.setAttribute("aria-expanded", String(!abierto));
      panel.style.height = abierto ? "0px" : `${panel.scrollHeight}px`;
    });
  });

  /* La altura fijada en píxeles debe recalcularse al cambiar el ancho */
  window.addEventListener("resize", ajustarAlturaFaq);
  limpiarAlSalir(() => window.removeEventListener("resize", ajustarAlturaFaq));

  /* --- Boletín (captura de leads) --- */
  const formBoletin = $("#form-boletin");
  formBoletin?.addEventListener("submit", (e) => {
    e.preventDefault();
    const estado = $("#boletin-estado");
    const correo = $("#boletin-correo");
    const consentimiento = formBoletin.querySelector('[name="consentimiento"]');
    const honeypot = formBoletin.querySelector('[name="empresa"]');

    if (honeypot.value) return; /* bot detectado */
    if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(correo.value.trim())) {
      estado.textContent = "Ingresa un correo electrónico válido.";
      estado.style.color = "var(--c-danger-700)";
      correo.focus();
      return;
    }
    if (!consentimiento.checked) {
      estado.textContent = "Debes autorizar el tratamiento de tus datos para continuar.";
      estado.style.color = "var(--c-danger-700)";
      consentimiento.focus();
      return;
    }
    estado.textContent = "¡Suscripción registrada! Te escribiremos a " + correo.value.trim() + ".";
    estado.style.color = "var(--c-success-600)";
    formBoletin.reset();
    notificar("Te suscribimos al boletín de convocatorias.", "success", "Suscripción exitosa");
  });

  aplicar();
  return page;
}

function ordenarTarjetas(tarjetas, contenedor, criterio) {
  const clave = (t) => {
    const a = ACTIVIDADES.find((x) => x.id === t.dataset.id);
    if (!a) return "";
    if (criterio === "titulo") return a.titulo.toLowerCase();
    if (criterio === "cupos") return String(-(a.cupos - a.inscritos)).padStart(6, "0");
    return a.fechaInicio;
  };
  [...tarjetas]
    .sort((x, y) => clave(x).localeCompare(clave(y)))
    .forEach((t) => contenedor.appendChild(t));
}

export { arteActividad };
