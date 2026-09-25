/* DROMEN — interacciones del sitio */
(function () {
  'use strict';

  // Destino de las consultas del formulario (servicio FormSubmit.co).
  var FORM_ENDPOINT = 'https://formsubmit.co/ajax/rodrigo.farias@dromen.cl';

  var header = document.querySelector('.site-header');
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('main-nav');
  var toTop = document.querySelector('.to-top');

  // Año del footer
  var year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  // Header con sombra al hacer scroll + botón volver arriba
  function onScroll() {
    var y = window.scrollY;
    if (header) header.classList.toggle('scrolled', y > 10);
    if (toTop) toTop.classList.toggle('show', y > 600);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  if (toTop) toTop.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: 'smooth' }); });

  // Menú móvil
  function closeNav() {
    if (!nav) return;
    nav.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('nav-open');
  }
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
      document.body.classList.toggle('nav-open', open);
    });
    nav.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', closeNav); });
    window.addEventListener('resize', function () { if (window.innerWidth > 960) closeNav(); });
  }

  // Resaltar sección activa en el menú
  var navLinks = nav ? nav.querySelectorAll('a[href^="#"]') : [];
  var sections = Array.prototype.map.call(navLinks, function (a) { return document.querySelector(a.getAttribute('href')); }).filter(Boolean);
  if ('IntersectionObserver' in window && sections.length) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        navLinks.forEach(function (a) { a.classList.toggle('active', a.getAttribute('href') === '#' + e.target.id); });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach(function (s) { spy.observe(s); });
  }

  // Animaciones de aparición
  var reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12 });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('visible'); });
  }

  // Formulario de contacto
  var form = document.getElementById('contact-form');
  if (!form) return;
  var status = document.getElementById('form-status');
  var btn = document.getElementById('submit-btn');
  var btnHTML = btn.innerHTML;
  var emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  var phoneRe = /^[+\d][\d\s()-]{6,}$/;

  function setInvalid(input, bad) {
    input.closest('.field').classList.toggle('invalid', bad);
    input.setAttribute('aria-invalid', bad ? 'true' : 'false');
  }

  function validate() {
    var ok = true;
    var nombre = form.nombre, email = form.email, tel = form.telefono, msg = form.mensaje;
    var checks = [
      [nombre, nombre.value.trim().length >= 2],
      [email, emailRe.test(email.value.trim())],
      [tel, tel.value.trim() === '' || phoneRe.test(tel.value.trim())],
      [msg, msg.value.trim().length >= 5]
    ];
    checks.forEach(function (c) { setInvalid(c[0], !c[1]); if (!c[1]) ok = false; });
    return ok;
  }

  form.querySelectorAll('input, textarea').forEach(function (el) {
    el.addEventListener('input', function () {
      if (el.closest('.field') && el.closest('.field').classList.contains('invalid')) validate();
    });
  });

  function showStatus(type, text) {
    status.className = 'form-status ' + type;
    status.textContent = text;
  }

  form.addEventListener('submit', function (ev) {
    ev.preventDefault();
    status.className = 'form-status';
    status.textContent = '';

    if (!validate()) {
      showStatus('err', 'Revisa los campos marcados antes de enviar.');
      var first = form.querySelector('.invalid input, .invalid textarea');
      if (first) first.focus();
      return;
    }
    if (!form.consent.checked) {
      showStatus('err', 'Debes aceptar la Política de Privacidad para enviar tu consulta.');
      return;
    }
    if (form._honey.value) return; // bot

    var data = {
      Nombre: form.nombre.value.trim(),
      Email: form.email.value.trim(),
      'Teléfono': form.telefono.value.trim() || '-',
      Empresa: form.empresa.value.trim() || '-',
      Mensaje: form.mensaje.value.trim(),
      _subject: 'Nueva consulta desde dromen.cl — ' + form.nombre.value.trim(),
      _replyto: form.email.value.trim(),
      _template: 'table',
      _captcha: 'false'
    };

    btn.disabled = true;
    btn.textContent = 'Enviando…';

    fetch(FORM_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(data)
    })
      .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, body: j }; }); })
      .then(function (res) {
        if (res.ok && String(res.body.success) === 'true') {
          form.reset();
          showStatus('ok', '¡Gracias! Recibimos tu consulta y te contactaremos a la brevedad.');
        } else {
          throw new Error(res.body && res.body.message);
        }
      })
      .catch(function () {
        showStatus('err', 'No pudimos enviar tu consulta. Inténtalo nuevamente o escríbenos a consulta@dromen.cl.');
      })
      .then(function () {
        btn.disabled = false;
        btn.innerHTML = btnHTML;
      });
  });
})();
