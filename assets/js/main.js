/* ============================================================================
   PNRC · Punto de entrada del prototipo
   Registra las rutas e inicializa el router.
   ============================================================================ */

import { ruta, iniciarRouter, notificar, inicializarTema } from "./app.js";
import { vistaPortada, iniciarPortada } from "./pages/home.js";
import { vistaRegistro, vistaPersonaNatural, vistaPersonaJuridica } from "./pages/registro.js";
import { vistaLogin, vistaRecuperar, vistaRestablecer } from "./pages/auth.js";
import { vistaDashboard } from "./pages/dashboard.js";

/* ── Rutas públicas ──────────────────────────────────────────────────────── */
ruta("/",       () => { const p = vistaPortada(); p.iniciar = () => iniciarPortada(p); return p; });
ruta("/registro", () => vistaRegistro());
ruta("/registro/persona-natural", () => vistaPersonaNatural());
ruta("/registro/persona-juridica", () => vistaPersonaJuridica());
ruta("/login",     () => vistaLogin());
ruta("/recuperar", () => vistaRecuperar());
ruta("/restablecer/:token", (params) => vistaRestablecer(params));

/* ── Rutas del área privada (Fase 1) ─────────────────────────────────────── */
ruta("/dashboard",  () => vistaDashboard());
ruta("/perfil",     () => vistaDashboard());          /* Fase 1C: placeholder hasta implementar */
ruta("/mis-inscripciones", () => vistaDashboard());   /* Placeholder */
ruta("/certificados",      () => vistaDashboard());   /* Placeholder */
ruta("/participantes/nuevo", () => vistaDashboard()); /* Fase 2A: placeholder */
ruta("/clubes",    () => vistaDashboard());           /* Fase 2B: placeholder */
ruta("/admin",     () => vistaDashboard());           /* Fase 3: placeholder */
ruta("/admin/solicitudes",  () => vistaDashboard());
ruta("/admin/usuarios",     () => vistaDashboard());
ruta("/admin/clubes",       () => vistaDashboard());
ruta("/admin/actividades",  () => vistaDashboard());
ruta("/admin/reportes",     () => vistaDashboard());

/* ── Arranque ────────────────────────────────────────────────────────────── */
inicializarTema();

document.addEventListener("DOMContentLoaded", () => {
  iniciarRouter();
  notificar(
    "Prototipo funcional PNRC · Usa correo demo@fvrc.org.ve / Demo1234! para entrar al panel.",
    "info",
    "Bienvenido a la PNRC"
  );
});

/* Aviso para enlaces de secciones aún no implementadas */
document.addEventListener("click", (e) => {
  const enlace = e.target.closest("a[data-proximamente]");
  if (!enlace) return;
  e.preventDefault();
  notificar(
    `La sección "${enlace.dataset.proximamente}" se implementará en las próximas fases del proyecto.`,
    "info", "Sección en desarrollo"
  );
});
