/* ============================================================================
   PNRC · Vistas de autenticación: inicio de sesión y recuperación de acceso
   ========================================================================== */

import { icono } from "../icons.js";
import {
  $, $$, esc, attr, notificar, activarShell, cabecera, piePagina,
  validarEmail, evaluarPassword, ETIQUETA_NIVEL, limpiarAlSalir, navegar
} from "../app.js";
import { usuarioPorCredenciales, guardarSesion } from "../data.js";

/* =========================================================================
   1. Inicio de sesión
   ======================================================================= */
export function vistaLogin() {
  return {
    titulo: "Iniciar sesión",
    html: `
    <div class="login-shell">
      <aside class="login-aside">
        <a class="brand" href="#/" style="text-decoration:none">
          <span class="brand__mark"><img src="assets/img/fvrc-logo-256.png" width="256" height="256" alt="Escudo FVRC"></span>
          <span class="brand__text">
            <span class="brand__name" style="color:#fff">FVRC</span>
            <span class="brand__tag" style="color:rgba(255,255,255,.7)">Robótica Creativa</span>
          </span>
        </a>
        <div>
          <span class="eyebrow" style="color:var(--c-accent-400)">Panel de gestión</span>
          <h2>Tu club, tus equipos y tus resultados en un solo lugar</h2>
          <p>
            Desde tu panel puedes inscribir participantes, gestionar equipos, postularte a
            eventos y descargar tus certificados digitales.
          </p>
          <ul class="checklist checklist--onDark" style="margin-top:var(--sp-6)">
            <li>${icono("checkCircle")}<span>Seguimiento del estado de tus solicitudes</span></li>
            <li>${icono("checkCircle")}<span>Inscripciones y cupos en tiempo real</span></li>
            <li>${icono("checkCircle")}<span>Certificados y resultados descargables</span></li>
          </ul>
        </div>
        <p class="text-xs" style="color:rgba(255,255,255,.5)">
          Prototipo de demostración · Federación Venezolana de Robótica Creativa
        </p>
      </aside>

      <main class="login-main" id="contenido">
        <div class="login-form">
          <div class="crumbs" style="margin-bottom:var(--sp-5)">
            <a href="#/">Inicio</a><span class="crumbs__sep">/</span>
            <span aria-current="page">Iniciar sesión</span>
          </div>
          <h1>Inicia sesión</h1>
          <p>Accede con el correo que registraste y la contraseña enviada por la FVRC.</p>

          <form id="form-login" novalidate>
            <div class="field" data-campo="login-correo">
              <label class="field__label" for="login-correo">Correo electrónico o código RNR</label>
              <div class="control-wrap">
                <input class="input input--prefix" id="login-correo" name="correo" type="text"
                       autocomplete="username" placeholder="tucorreo@ejemplo.com" required>
                <span class="input-affix input-affix--left">${icono("mail")}</span>
              </div>
              <span class="field__error" id="err-login-correo" role="alert">
                ${icono("alertCircle")}<span data-mensaje></span>
              </span>
            </div>

            <div class="field" data-campo="login-password">
              <label class="field__label" for="login-password">Contraseña</label>
              <div class="control-wrap">
                <input class="input" id="login-password" name="password" type="password"
                       autocomplete="current-password" placeholder="Tu contraseña" required>
                <button type="button" class="btn-affix" id="ver-password" aria-label="Mostrar contraseña">
                  ${icono("eye")}
                </button>
              </div>
              <span class="field__error" id="err-login-password" role="alert">
                ${icono("alertCircle")}<span data-mensaje></span>
              </span>
            </div>

            <div class="row row--between row--wrap">
              <label class="checkline">
                <input type="checkbox" name="recordarme" checked>
                <span>Mantener mi sesión activa</span>
              </label>
              <a href="#/recuperar" class="text-sm strong">¿Olvidaste tu contraseña?</a>
            </div>

            <button class="btn btn--primary btn--field btn--block" type="submit" id="btn-login">
              Entrar a mi panel
            </button>

            <p class="text-xs text-muted" id="login-estado" role="status"></p>
          </form>

          <div class="login-support">
            <div class="alert alert--info" style="text-align:left">
              ${icono("info")}
              <div>
                <span class="alert__title">¿Tu cuenta sigue en verificación?</span>
                El acceso se habilita únicamente cuando un administrador de la FVRC aprueba tu
                registro. Recibirás un correo con tus credenciales al ser aprobada.
              </div>
            </div>
            <span>¿Aún no tienes cuenta? <a href="#/registro">Regístrate aquí</a></span>
            <span>¿Problemas para entrar? <a href="#/">Contacta a soporte</a></span>
          </div>
        </div>
      </main>
    </div>`,
    iniciar() {
      const botonVer = $("#ver-password");
      const input = $("#login-password");
      botonVer?.addEventListener("click", () => {
        const visible = input.type === "text";
        input.type = visible ? "password" : "text";
        botonVer.innerHTML = icono(visible ? "eye" : "eyeOff");
        botonVer.setAttribute("aria-label", visible ? "Mostrar contraseña" : "Ocultar contraseña");
        input.focus();
      });

      const form = $("#form-login");
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const correo = form.querySelector('[name="correo"]').value.trim();
        const password = form.querySelector('[name="password"]').value;
        const estado = $("#login-estado");

        const campoCorreo = form.querySelector('[data-campo="login-correo"]');
        const campoPass = form.querySelector('[data-campo="login-password"]');
        campoCorreo.classList.remove("has-error");
        campoPass.classList.remove("has-error");

        let fallo = false;
        if (!correo || (!validarEmail(correo) && !/^RNR\s?\d/i.test(correo))) {
          marcar(campoCorreo, "Ingresa un correo válido o tu código RNR.");
          fallo = true;
        }
        if (!password) {
          marcar(campoPass, "Ingresa tu contraseña.");
          fallo = true;
        }
        if (fallo) {
          form.querySelector(".has-error .input")?.focus();
          return;
        }

        const boton = $("#btn-login");
        boton.classList.add("is-loading");
        boton.disabled = true;

        setTimeout(() => {
          boton.classList.remove("is-loading");
          boton.disabled = false;

          /* Buscar usuario demo con las credenciales ingresadas */
          const usuario = usuarioPorCredenciales(correo, password);

          if (usuario) {
            guardarSesion(usuario);
            notificar(`Bienvenido, ${usuario.nombres}. Redirigiendo a tu panel…`, "success", "Sesión iniciada");
            setTimeout(() => navegar("#/dashboard"), 400);
          } else {
            estado.textContent = "Credenciales incorrectas. Prueba con carlos.mendoza@email.com / Demo1234! o admin@fvrc.org.ve / Admin1234!";
            estado.style.color = "var(--c-danger-600)";
            marcar(campoCorreo, "Correo o contraseña no válidos.");
            form.querySelector(".has-error .input")?.focus();
          }
        }, 900);
      });
    }
  };
}

function marcar(campo, mensaje) {
  campo.classList.add("has-error");
  const msg = campo.querySelector("[data-mensaje]");
  if (msg) msg.textContent = mensaje;
}

/* =========================================================================
   2. Recuperación de acceso (respuesta siempre genérica)
   ======================================================================= */
export function vistaRecuperar() {
  return {
    titulo: "Recuperar acceso",
    html: `
    ${cabecera()}
    <main id="contenido">
      <section class="section">
        <div class="container container--medium">
          <nav class="crumbs" style="margin-bottom:var(--sp-6)">
            <a href="#/">Inicio</a><span class="crumbs__sep">/</span>
            <a href="#/login">Iniciar sesión</a><span class="crumbs__sep">/</span>
            <span aria-current="page">Recuperar acceso</span>
          </nav>

          <div class="auth-card">
            <div class="auth-card__body" style="padding:clamp(1.5rem,4vw,3rem)">
              <span class="icon-square" style="width:52px;height:52px">${icono("key")}</span>
              <h1 class="title-md" style="margin-top:var(--sp-5)">Recupera tu usuario o contraseña</h1>
              <p class="lede" style="margin-top:var(--sp-3)">
                Escribe el correo con el que te registraste. Si coincide con nuestros registros,
                generaremos una clave temporal y te la enviaremos por correo.
              </p>

              <form id="form-recuperar" class="stack" novalidate style="margin-top:var(--sp-8)">
                <div class="field" data-campo="rec-correo">
                  <label class="field__label" for="rec-correo">Correo electrónico registrado</label>
                  <input class="input" id="rec-correo" name="correo" type="email"
                         placeholder="tucorreo@ejemplo.com" autocomplete="email" required>
                  <span class="field__hint">Debe ser el mismo correo del registro original.</span>
                  <span class="field__error" id="err-rec-correo" role="alert">
                    ${icono("alertCircle")}<span data-mensaje></span>
                  </span>
                </div>

                <button class="btn btn--primary btn--field btn--block" type="submit">
                  Enviar instrucciones
                </button>
              </form>

              <div id="respuesta-recuperar" hidden style="margin-top:var(--sp-6)">
                <div class="alert alert--success">
                  ${icono("checkCircle")}
                  <div>
                    <span class="alert__title">Solicitud procesada</span>
                    Si los datos proporcionados coinciden con nuestros registros, hemos enviado un
                    correo con las instrucciones para recuperar su usuario.
                  </div>
                </div>
                <div class="alert alert--info" style="margin-top:var(--sp-4)">
                  ${icono("info")}
                  <div>
                    Por seguridad, mostramos siempre el mismo mensaje: así evitamos que terceros
                    puedan averiguar qué correos están registrados en la plataforma.
                  </div>
                </div>
              </div>

              <div class="login-support" style="margin-top:var(--sp-8);border-top:1px solid var(--border-subtle)">
                <span>¿Recordaste tu contraseña? <a href="#/login">Volver a iniciar sesión</a></span>
                <span>¿Tu cuenta aún está en verificación? <a href="#/">Contacta a soporte</a></span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
    ${piePagina()}`,
    iniciar() {
      activarShell(document);
      const form = $("#form-recuperar");
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const campo = form.querySelector('[data-campo="rec-correo"]');
        const correo = form.querySelector('[name="correo"]').value.trim();
        campo.classList.remove("has-error");
        if (!validarEmail(correo)) {
          marcar(campo, "Ingresa un correo electrónico válido.");
          form.querySelector(".input").focus();
          return;
        }
        $("#respuesta-recuperar").hidden = false;
        form.reset();
        $("#respuesta-recuperar").scrollIntoView({ behavior: "smooth", block: "center" });
        notificar("Revisa tu correo si los datos coinciden con nuestros registros.", "success");
      });
    }
  };
}

/* =========================================================================
   3. Restablecer contraseña con token
   ======================================================================= */
export function vistaRestablecer({ token } = {}) {
  return {
    titulo: "Restablecer contraseña",
    html: `
    ${cabecera()}
    <main id="contenido">
      <section class="section">
        <div class="container container--medium">
          <div class="auth-card">
            <div class="auth-card__body" style="padding:clamp(1.5rem,4vw,3rem)">
              <span class="icon-square" style="width:52px;height:52px">${icono("lock")}</span>
              <h1 class="title-md" style="margin-top:var(--sp-5)">Crea tu nueva contraseña</h1>
              <p class="lede" style="margin-top:var(--sp-3)">
                El enlace de recuperación es válido por 30 minutos y de un solo uso.
                Al guardar, tu clave temporal queda invalidada.
              </p>

              <form id="form-restablecer" novalidate style="margin-top:var(--sp-8)">
                <div class="form-grid form-grid--1">
                  <div class="field" data-campo="res-password">
                    <label class="field__label" for="res-password">Nueva contraseña</label>
                    <div class="control-wrap">
                      <input class="input" id="res-password" name="password" type="password"
                             autocomplete="new-password" required>
                      <button type="button" class="btn-affix" id="ver-res" aria-label="Mostrar contraseña">
                        ${icono("eye")}
                      </button>
                    </div>
                    <span class="field__error" id="err-res-password" role="alert">
                      ${icono("alertCircle")}<span data-mensaje></span>
                    </span>
                  </div>
                  <div class="field" data-campo="res-password2">
                    <label class="field__label" for="res-password2">Confirmación de contraseña</label>
                    <input class="input" id="res-password2" name="password2" type="password"
                           autocomplete="new-password" required>
                    <span class="field__error" id="err-res-password2" role="alert">
                      ${icono("alertCircle")}<span data-mensaje></span>
                    </span>
                  </div>
                  <div class="pw-meter" id="medidor-res">
                    <div class="pw-meter__bars" aria-hidden="true">
                      <span class="pw-meter__bar"></span><span class="pw-meter__bar"></span>
                      <span class="pw-meter__bar"></span><span class="pw-meter__bar"></span>
                    </div>
                    <span class="pw-meter__label" data-level="0" role="status">Aún no escribes una contraseña</span>
                  </div>
                </div>
                <button class="btn btn--primary btn--field btn--block" type="submit">
                  Guardar nueva contraseña
                </button>
              </form>

              <div id="confirmacion-restablecer" hidden style="margin-top:var(--sp-6)">
                <div class="alert alert--success">
                  ${icono("checkCircle")}
                  <div>
                    <span class="alert__title">Contraseña actualizada</span>
                    Ya puedes iniciar sesión con tu nueva contraseña.
                    <a href="#/login">Ir al inicio de sesión</a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
    ${piePagina()}`,
    iniciar() {
      activarShell(document);
      if (!token) return;
      const input = $("#res-password");
      const input2 = $("#res-password2");
      const caja = $("#medidor-res");
      const barras = $$(".pw-meter__bar", caja);
      const etiqueta = $(".pw-meter__label", caja);

      input.addEventListener("input", () => {
        const { nivel } = evaluarPassword(input.value);
        barras.forEach((b, i) => { b.className = "pw-meter__bar" + (i < nivel ? ` is-on-${nivel}` : ""); });
        etiqueta.textContent = input.value ? ETIQUETA_NIVEL[nivel] : "Aún no escribes una contraseña";
        etiqueta.dataset.level = String(nivel);
      });

      $("#ver-res")?.addEventListener("click", () => {
        const visible = input.type === "text";
        input.type = visible ? "password" : "text";
        $("#ver-res").innerHTML = icono(visible ? "eye" : "eyeOff");
      });

      $("#form-restablecer").addEventListener("submit", (e) => {
        e.preventDefault();
        const c1 = document.querySelector('[data-campo="res-password"]');
        const c2 = document.querySelector('[data-campo="res-password2"]');
        c1.classList.remove("has-error"); c2.classList.remove("has-error");
        let fallo = false;
        if (evaluarPassword(input.value).cumplidas !== 5) {
          marcar(c1, "La contraseña debe cumplir las 5 reglas de seguridad."); fallo = true;
        }
        if (input2.value !== input.value || !input2.value) {
          marcar(c2, "Las contraseñas no coinciden."); fallo = true;
        }
        if (fallo) return;
        $("#confirmacion-restablecer").hidden = false;
        notificar("Tu contraseña fue actualizada correctamente.", "success");
      });
    }
  };
}
