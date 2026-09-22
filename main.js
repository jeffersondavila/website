/**
 * Jefferson Dávila — Senior .NET Developer
 *
 * Cada módulo es independiente y sale temprano si su marcado no está en la
 * página, para que un cambio en el HTML no rompa el resto del comportamiento.
 */
(function () {
    'use strict';

    var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* ---------------------------- Navegación móvil ---------------------------- */
    function initNavToggle() {
        var toggle = document.querySelector('.nav-toggle');
        var nav = document.getElementById('nav-primary');
        if (!toggle || !nav) return;

        var desktop = window.matchMedia('(min-width: 60em)');

        function setOpen(open) {
            toggle.setAttribute('aria-expanded', String(open));
            nav.classList.toggle('is-open', open);
        }

        toggle.addEventListener('click', function () {
            setOpen(toggle.getAttribute('aria-expanded') !== 'true');
        });

        // Al elegir un destino, el panel estorba: se cierra.
        nav.addEventListener('click', function (event) {
            if (event.target.closest('a')) setOpen(false);
        });

        document.addEventListener('keydown', function (event) {
            if (event.key !== 'Escape') return;
            if (toggle.getAttribute('aria-expanded') !== 'true') return;
            setOpen(false);
            toggle.focus();
        });

        // El velo es un pseudoelemento de .nav, así que el clic llega con .nav como
        // destino: hay que mirar las coordenadas para saber si cayó dentro del panel.
        document.addEventListener('click', function (event) {
            if (toggle.getAttribute('aria-expanded') !== 'true') return;
            if (toggle.contains(event.target)) return;

            var panel = nav.getBoundingClientRect();
            var inside = event.clientX >= panel.left && event.clientX <= panel.right &&
                event.clientY >= panel.top && event.clientY <= panel.bottom;
            if (inside) return;

            setOpen(false);
        });

        // En escritorio el menú es siempre visible; el estado abierto no aplica.
        desktop.addEventListener('change', function (event) {
            if (event.matches) setOpen(false);
        });
    }

    /* ---------------------------- Sección activa en el menú ---------------------------- */
    function initScrollSpy() {
        var links = Array.prototype.slice.call(document.querySelectorAll('.nav__list a[href^="#"]'));
        if (!links.length || !('IntersectionObserver' in window)) return;

        var byId = {};
        var sections = [];

        links.forEach(function (link) {
            var section = document.getElementById(link.hash.slice(1));
            if (!section) return;
            byId[section.id] = link;
            sections.push(section);
        });
        if (!sections.length) return;

        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                links.forEach(function (link) {
                    link.classList.remove('is-current');
                    link.removeAttribute('aria-current');
                });
                var active = byId[entry.target.id];
                if (!active) return;
                active.classList.add('is-current');
                active.setAttribute('aria-current', 'true');
            });
        }, { rootMargin: '-45% 0px -50% 0px' });

        sections.forEach(function (section) {
            observer.observe(section);
        });
    }

    /* ---------------------------- Aparición de secciones ---------------------------- */
    function initReveal() {
        var items = Array.prototype.slice.call(document.querySelectorAll('.reveal'));
        if (!items.length) return;

        function showAll() {
            items.forEach(function (item) {
                item.classList.add('is-visible');
            });
        }

        if (prefersReducedMotion || !('IntersectionObserver' in window)) {
            showAll();
            return;
        }

        var observer = new IntersectionObserver(function (entries, self) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                entry.target.classList.add('is-visible');
                self.unobserve(entry.target);
            });
        }, { rootMargin: '0px 0px -10% 0px', threshold: 0.05 });

        items.forEach(function (item) {
            observer.observe(item);
        });
    }

    /* ---------------------------- Formulario de contacto ---------------------------- */
    var ENDPOINT = 'https://formsubmit.co/ajax/8ce2a639e4218f7cb7f8d7b448f3a1a5';

    function initContactForm() {
        var form = document.getElementById('contact-form');
        if (!form) return;

        var status = form.querySelector('.form__status');
        var fields = Array.prototype.slice.call(form.querySelectorAll('input[required], textarea[required]'));

        function setStatus(message, state) {
            if (!status) return;
            status.textContent = message;
            status.className = 'form__status' + (state ? ' form__status--' + state : '');
        }

        // La validación nativa no es accesible por sí sola: se refleja en aria-invalid.
        function markValidity() {
            var firstInvalid = null;
            fields.forEach(function (field) {
                var valid = field.checkValidity();
                field.setAttribute('aria-invalid', String(!valid));
                if (!valid && !firstInvalid) firstInvalid = field;
            });
            return firstInvalid;
        }

        fields.forEach(function (field) {
            field.addEventListener('blur', function () {
                if (field.value !== '') field.setAttribute('aria-invalid', String(!field.checkValidity()));
            });
        });

        form.addEventListener('submit', function (event) {
            event.preventDefault();

            var firstInvalid = markValidity();
            if (firstInvalid) {
                setStatus('Revisa los campos marcados antes de enviar.', 'error');
                firstInvalid.focus();
                return;
            }

            form.classList.add('is-sending');
            setStatus('Enviando…');

            fetch(ENDPOINT, { method: 'POST', body: new FormData(form) })
                .then(function (response) {
                    if (!response.ok) throw new Error('HTTP ' + response.status);
                    return response.json();
                })
                .then(function () {
                    form.reset();
                    fields.forEach(function (field) {
                        field.removeAttribute('aria-invalid');
                    });
                    setStatus('Mensaje enviado. Te responderé pronto.', 'ok');
                })
                .catch(function () {
                    setStatus('No se pudo enviar. Escríbeme a jeffersondavila16@gmail.com.', 'error');
                })
                .finally(function () {
                    form.classList.remove('is-sending');
                });
        });
    }

    /* ---------------------------- Año del pie de página ---------------------------- */
    function initCurrentYear() {
        var slot = document.querySelector('[data-current-year]');
        if (slot) slot.textContent = String(new Date().getFullYear());
    }

    initNavToggle();
    initScrollSpy();
    initReveal();
    initContactForm();
    initCurrentYear();
})();
