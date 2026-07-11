/*!
 * Widget de reservas — Centro Estética Virginia Vera
 * ---------------------------------------------------
 * Archivo ÚNICO, sin dependencias ni instalación. Solo hay que subirlo tal
 * cual a tu hosting (por ejemplo junto a index.html) y enlazarlo con:
 *
 *   <script src="booking-widget.js" defer></script>
 *
 * y añadir en el sitio donde quieras que aparezca el formulario de reserva:
 *
 *   <booking-widget
 *     data-supabase-url="https://TU_PROYECTO.supabase.co"
 *     data-supabase-anon-key="TU_CLAVE_ANON"
 *     data-business="virginia-vera">
 *   </booking-widget>
 *
 * No requiere Node, npm, ni ninguna terminal. Es JavaScript "de toda la
 * vida" que cualquier navegador entiende directamente.
 */
(function () {
  'use strict';

  var STEP = { SERVICE: 0, SLOT: 1, FORM: 2, SUCCESS: 3 };

  var WIDGET_CSS = "\
    :host, .rw-root {\
      --rw-primary: #D4AF6E; --rw-primary-dk: #BF9D5A; --rw-on-primary: #FFFFFF;\
      --rw-text: #2C1A10; --rw-text-mid: #5C3D2A; --rw-text-light: #9C7B68;\
      --rw-bg: #FFFFFF; --rw-bg-alt: #FAFAF7; --rw-border: #E8D5C0;\
      --rw-radius: 14px; --rw-radius-pill: 999px;\
      --rw-font: 'Lato', system-ui, sans-serif; --rw-font-heading: 'Playfair Display', Georgia, serif;\
      --rw-error: #B3261E; --rw-success: #3F7A4A;\
    }\
    * { box-sizing: border-box; }\
    .rw-root { font-family: var(--rw-font); color: var(--rw-text); max-width: 560px; margin: 0 auto; }\
    .rw-card { background: var(--rw-bg); border: 1px solid var(--rw-border); border-radius: var(--rw-radius); padding: 24px; box-shadow: 0 4px 24px rgba(0,0,0,0.06); }\
    .rw-steps { display: flex; gap: 8px; margin-bottom: 24px; }\
    .rw-step-dot { flex: 1; height: 4px; border-radius: var(--rw-radius-pill); background: var(--rw-border); transition: background .3s ease; }\
    .rw-step-dot.is-active, .rw-step-dot.is-done { background: var(--rw-primary); }\
    .rw-heading { font-family: var(--rw-font-heading); font-size: 1.3rem; font-weight: 700; color: var(--rw-text); margin: 0 0 4px; }\
    .rw-subheading { font-size: .9rem; color: var(--rw-text-light); margin: 0 0 20px; }\
    .rw-service-list, .rw-slot-list { display: flex; flex-direction: column; gap: 10px; max-height: 380px; overflow-y: auto; padding-right: 2px; }\
    .rw-service-item { display: flex; justify-content: space-between; align-items: center; gap: 12px; padding: 14px 16px; border: 1.5px solid var(--rw-border); border-radius: var(--rw-radius); background: var(--rw-bg-alt); cursor: pointer; text-align: left; font-family: inherit; color: inherit; transition: border-color .2s ease, transform .15s ease; width: 100%; }\
    .rw-service-item:hover, .rw-service-item:focus-visible { border-color: var(--rw-primary); outline: none; }\
    .rw-service-item:active { transform: scale(.99); }\
    .rw-service-name { font-weight: 700; font-size: .98rem; }\
    .rw-service-meta { font-size: .82rem; color: var(--rw-text-light); margin-top: 2px; }\
    .rw-service-price { font-weight: 700; color: var(--rw-primary-dk); white-space: nowrap; font-size: .9rem; }\
    .rw-date-nav { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }\
    .rw-date-nav-label { font-weight: 700; font-family: var(--rw-font-heading); }\
    .rw-icon-btn { border: 1.5px solid var(--rw-border); background: var(--rw-bg); border-radius: var(--rw-radius-pill); width: 36px; height: 36px; display: inline-flex; align-items: center; justify-content: center; cursor: pointer; font-size: 1rem; color: var(--rw-text); }\
    .rw-icon-btn:disabled { opacity: .35; cursor: not-allowed; }\
    .rw-icon-btn:hover:not(:disabled) { border-color: var(--rw-primary); }\
    .rw-slot-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(84px, 1fr)); gap: 8px; }\
    .rw-slot-btn { padding: 10px 6px; border: 1.5px solid var(--rw-border); border-radius: var(--rw-radius); background: var(--rw-bg-alt); cursor: pointer; font-family: inherit; font-size: .88rem; font-weight: 700; color: var(--rw-text); text-align: center; }\
    .rw-slot-btn:hover, .rw-slot-btn:focus-visible { border-color: var(--rw-primary); outline: none; }\
    .rw-slot-btn.is-selected { background: var(--rw-primary); border-color: var(--rw-primary); color: var(--rw-on-primary); }\
    .rw-empty-state { text-align: center; padding: 32px 12px; color: var(--rw-text-light); font-size: .92rem; }\
    .rw-form-group { margin-bottom: 16px; }\
    .rw-label { display: block; font-size: .82rem; font-weight: 700; color: var(--rw-text-mid); margin-bottom: 6px; }\
    .rw-input, .rw-textarea { width: 100%; padding: 12px 14px; border: 1.5px solid var(--rw-border); border-radius: var(--rw-radius); font-family: inherit; font-size: .95rem; color: var(--rw-text); background: var(--rw-bg-alt); }\
    .rw-input:focus, .rw-textarea:focus { outline: none; border-color: var(--rw-primary); }\
    .rw-input.is-invalid { border-color: var(--rw-error); }\
    .rw-field-error { color: var(--rw-error); font-size: .78rem; margin-top: 4px; }\
    .rw-checkbox-row { display: flex; align-items: flex-start; gap: 10px; font-size: .85rem; color: var(--rw-text-mid); line-height: 1.5; }\
    .rw-checkbox-row input { margin-top: 3px; width: 16px; height: 16px; flex-shrink: 0; accent-color: var(--rw-primary); }\
    .rw-summary { background: var(--rw-bg-alt); border-radius: var(--rw-radius); padding: 14px 16px; font-size: .88rem; margin-bottom: 20px; border: 1px solid var(--rw-border); }\
    .rw-summary strong { color: var(--rw-text); }\
    .rw-actions { display: flex; gap: 10px; margin-top: 20px; }\
    .rw-btn { font-family: inherit; font-weight: 700; font-size: .92rem; letter-spacing: .02em; border-radius: var(--rw-radius-pill); padding: 13px 24px; cursor: pointer; border: 2px solid transparent; transition: transform .15s ease, box-shadow .15s ease, opacity .15s ease; }\
    .rw-btn:disabled { opacity: .55; cursor: not-allowed; }\
    .rw-btn-primary { background: var(--rw-primary); color: var(--rw-on-primary); flex: 1; box-shadow: 0 6px 20px rgba(0,0,0,0.12); }\
    .rw-btn-primary:hover:not(:disabled) { background: var(--rw-primary-dk); transform: translateY(-1px); }\
    .rw-btn-outline { background: transparent; border-color: var(--rw-border); color: var(--rw-text-mid); }\
    .rw-btn-outline:hover:not(:disabled) { border-color: var(--rw-primary); color: var(--rw-primary-dk); }\
    .rw-alert { padding: 12px 14px; border-radius: var(--rw-radius); font-size: .85rem; margin-bottom: 16px; }\
    .rw-alert-error { background: #FBEAE9; color: var(--rw-error); }\
    .rw-success-state { text-align: center; padding: 20px 8px; }\
    .rw-success-icon { width: 56px; height: 56px; border-radius: 50%; background: var(--rw-success); color: #fff; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; font-size: 1.6rem; }\
    .rw-success-state h3 { font-family: var(--rw-font-heading); font-size: 1.3rem; margin-bottom: 8px; }\
    .rw-success-state p { color: var(--rw-text-light); font-size: .92rem; line-height: 1.6; }\
    .rw-spinner { width: 20px; height: 20px; border: 2.5px solid rgba(255,255,255,0.4); border-top-color: #fff; border-radius: 50%; animation: rw-spin .7s linear infinite; display: inline-block; }\
    @keyframes rw-spin { to { transform: rotate(360deg); } }\
    .rw-skeleton { background: linear-gradient(90deg, var(--rw-bg-alt) 25%, var(--rw-border) 50%, var(--rw-bg-alt) 75%); background-size: 200% 100%; animation: rw-shimmer 1.4s ease-in-out infinite; border-radius: var(--rw-radius); height: 56px; }\
    @keyframes rw-shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }\
    @media (max-width: 480px) { .rw-card { padding: 18px; border-radius: 0; border-left: none; border-right: none; } .rw-slot-grid { grid-template-columns: repeat(auto-fill, minmax(72px, 1fr)); } }\
  ";

  // --- Cliente API (habla con Supabase: lectura directa + Edge Function) ---
  function ApiError(message, status, details) {
    var e = new Error(message);
    e.name = 'ApiError';
    e.status = status;
    e.details = details;
    return e;
  }

  function createApiClient(cfg) {
    var restBase = cfg.supabaseUrl + '/rest/v1';
    var functionsBase = cfg.supabaseUrl + '/functions/v1';
    var restHeaders = {
      apikey: cfg.supabaseAnonKey,
      Authorization: 'Bearer ' + cfg.supabaseAnonKey,
      'Content-Type': 'application/json',
    };

    function getBusiness() {
      return fetch(restBase + '/businesses?slug=eq.' + encodeURIComponent(cfg.businessSlug) +
        '&is_active=eq.true&select=id,name,phone,address,primary_color,secondary_color,font_family,border_radius,logo_url,timezone',
        { headers: restHeaders })
        .then(function (res) {
          if (!res.ok) throw ApiError('No se pudo cargar el negocio', res.status);
          return res.json();
        })
        .then(function (rows) {
          if (!rows.length) throw ApiError('Negocio no encontrado', 404);
          return rows[0];
        });
    }

    function getServices(businessId) {
      return fetch(restBase + '/services?business_id=eq.' + businessId +
        '&is_active=eq.true&select=id,name,description,duration_minutes,price_cents&order=display_order.asc',
        { headers: restHeaders })
        .then(function (res) {
          if (!res.ok) throw ApiError('No se pudieron cargar los servicios', res.status);
          return res.json();
        });
    }

    function getAvailableSlots(args) {
      return fetch(restBase + '/rpc/get_available_slots', {
        method: 'POST',
        headers: restHeaders,
        body: JSON.stringify({
          p_business_id: args.businessId,
          p_service_id: args.serviceId,
          p_date_from: args.dateFrom,
          p_date_to: args.dateTo,
          p_slot_interval_minutes: 15,
        }),
      }).then(function (res) {
        if (!res.ok) throw ApiError('No se pudo cargar la disponibilidad', res.status);
        return res.json();
      });
    }

    function createAppointment(payload) {
      var body = Object.assign({ businessSlug: cfg.businessSlug }, payload);
      return fetch(functionsBase + '/create-appointment', {
        method: 'POST',
        headers: {
          apikey: cfg.supabaseAnonKey,
          Authorization: 'Bearer ' + cfg.supabaseAnonKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      }).then(function (res) {
        return res.json().catch(function () { return {}; }).then(function (json) {
          if (!res.ok) throw ApiError(json.message || json.error || 'No se pudo crear la cita', res.status, json.details);
          return json;
        });
      });
    }

    return { getBusiness: getBusiness, getServices: getServices, getAvailableSlots: getAvailableSlots, createAppointment: createAppointment };
  }

  // --- Helpers ---------------------------------------------------------
  function startOfToday() { var d = new Date(); d.setHours(0, 0, 0, 0); return d; }
  function isSameDay(a, b) { return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate(); }
  function dateKey(d) {
    // OJO: se usan los componentes de fecha LOCALES del navegador, no
    // toISOString() (que convierte a UTC y desplaza un día cuando el
    // usuario está en un huso horario adelantado a UTC, como España).
    var y = d.getFullYear();
    var m = String(d.getMonth() + 1).padStart(2, '0');
    var day = String(d.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + day;
  }
  function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  function formatPrice(cents) {
    if (cents == null) return 'Consultar';
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(cents / 100);
  }
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  // --- Componente --------------------------------------------------------
  function BookingWidget() {
    var el = Reflect.construct(HTMLElement, [], BookingWidget);
    el._shadow = el.attachShadow({ mode: 'open' });
    el._state = {
      step: STEP.SERVICE,
      loading: true,
      error: null,
      business: null,
      services: [],
      selectedService: null,
      selectedDate: startOfToday(),
      slotsByDay: {},
      selectedSlot: null,
      submitting: false,
    };
    return el;
  }
  Object.setPrototypeOf(BookingWidget.prototype, HTMLElement.prototype);
  Object.setPrototypeOf(BookingWidget, HTMLElement);

  BookingWidget.prototype.connectedCallback = function () {
    var self = this;
    var supabaseUrl = this.dataset.supabaseUrl;
    var supabaseAnonKey = this.dataset.supabaseAnonKey;
    var businessSlug = this.dataset.business;

    if (!supabaseUrl || !supabaseAnonKey || !businessSlug) {
      this._renderConfigError();
      return;
    }

    this._api = createApiClient({ supabaseUrl: supabaseUrl, supabaseAnonKey: supabaseAnonKey, businessSlug: businessSlug });
    this._renderShell();

    var io = new IntersectionObserver(function (entries) {
      for (var i = 0; i < entries.length; i++) {
        if (entries[i].isIntersecting) {
          io.disconnect();
          self._bootstrap();
          break;
        }
      }
    }, { rootMargin: '200px' });
    io.observe(this);
  };

  BookingWidget.prototype._bootstrap = function () {
    var self = this;
    this._api.getBusiness()
      .then(function (business) {
        self._applyTheme(business);
        return self._api.getServices(business.id).then(function (services) {
          self._state.business = business;
          self._state.services = services;
          self._state.loading = false;
          self._render();
        });
      })
      .catch(function (err) {
        self._state.loading = false;
        self._state.error = (err && err.name === 'ApiError') ? err.message : 'No se pudo cargar el sistema de reservas.';
        self._render();
      });
  };

  BookingWidget.prototype._applyTheme = function (business) {
    var root = this._shadow.querySelector('.rw-root');
    if (!root) return;
    var primary = this.dataset.primaryColor || business.primary_color;
    var secondary = this.dataset.secondaryColor || business.secondary_color;
    var font = this.dataset.fontFamily || business.font_family;
    var radius = this.dataset.radius || business.border_radius;
    if (primary) root.style.setProperty('--rw-primary', primary);
    if (secondary) root.style.setProperty('--rw-text', secondary);
    if (font) root.style.setProperty('--rw-font-heading', font);
    if (radius) root.style.setProperty('--rw-radius', radius);
  };

  BookingWidget.prototype._renderConfigError = function () {
    this._shadow.innerHTML = '<div style="font-family:sans-serif;color:#B3261E;padding:16px;border:1px solid #B3261E;border-radius:8px;">' +
      'Widget de reservas mal configurado: faltan atributos data-supabase-url, data-supabase-anon-key o data-business.</div>';
  };

  BookingWidget.prototype._renderShell = function () {
    var style = document.createElement('style');
    style.textContent = WIDGET_CSS;
    this._shadow.appendChild(style);
    this._root = document.createElement('div');
    this._root.className = 'rw-root';
    this._root.setAttribute('role', 'region');
    this._root.setAttribute('aria-label', 'Reserva tu cita online');
    this._shadow.appendChild(this._root);
    this._render();
  };

  BookingWidget.prototype._render = function () {
    if (!this._root) return;
    var s = this._state;

    if (s.error) {
      this._root.innerHTML = '<div class="rw-card"><div class="rw-alert rw-alert-error">' + escapeHtml(s.error) + '</div></div>';
      return;
    }
    if (s.loading) {
      this._root.innerHTML = '<div class="rw-card"><div class="rw-skeleton" style="margin-bottom:10px;"></div><div class="rw-skeleton" style="margin-bottom:10px;"></div><div class="rw-skeleton"></div></div>';
      return;
    }

    var dots = [0, 1, 2].map(function (i) {
      return '<div class="rw-step-dot ' + (i < s.step ? 'is-done' : '') + ' ' + (i === s.step ? 'is-active' : '') + '"></div>';
    }).join('');

    this._root.innerHTML = '<div class="rw-card"><div class="rw-steps" aria-hidden="true">' + dots + '</div><div id="rw-step-content"></div></div>';

    var content = this._root.querySelector('#rw-step-content');
    if (s.step === STEP.SERVICE) this._renderServiceStep(content);
    else if (s.step === STEP.SLOT) this._renderSlotStep(content);
    else if (s.step === STEP.FORM) this._renderFormStep(content);
    else if (s.step === STEP.SUCCESS) this._renderSuccessStep(content);
  };

  BookingWidget.prototype._renderServiceStep = function (content) {
    var self = this;
    var s = this._state;
    content.innerHTML = '<h2 class="rw-heading">Elige tu servicio</h2>' +
      '<p class="rw-subheading">Selecciona el tratamiento que quieres reservar</p>' +
      '<div class="rw-service-list" role="list">' +
      s.services.map(function (svc) {
        return '<button type="button" class="rw-service-item" role="listitem" data-id="' + svc.id + '">' +
          '<span><span class="rw-service-name">' + escapeHtml(svc.name) + '</span>' +
          '<span class="rw-service-meta">' + svc.duration_minutes + ' min</span></span>' +
          '<span class="rw-service-price">' + formatPrice(svc.price_cents) + '</span></button>';
      }).join('') + '</div>';

    var buttons = content.querySelectorAll('.rw-service-item');
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].addEventListener('click', function (e) {
        var id = e.currentTarget.dataset.id;
        self._state.selectedService = s.services.filter(function (x) { return x.id === id; })[0];
        self._state.step = STEP.SLOT;
        self._state.selectedDate = startOfToday();
        self._state.slotsByDay = {};
        self._render();
        self._loadSlotsForSelectedDate();
      });
    }
  };

  BookingWidget.prototype._renderSlotStep = function (content) {
    var self = this;
    var s = this._state;
    var dateLabel = new Intl.DateTimeFormat('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }).format(s.selectedDate);
    var key = dateKey(s.selectedDate);
    var daySlots = s.slotsByDay[key];

    content.innerHTML = '<h2 class="rw-heading">Elige fecha y hora</h2>' +
      '<p class="rw-subheading">' + escapeHtml(s.selectedService.name) + ' &middot; ' + s.selectedService.duration_minutes + ' min</p>' +
      '<div class="rw-date-nav">' +
      '<button type="button" class="rw-icon-btn" id="rw-prev-day" aria-label="Día anterior" ' + (isSameDay(s.selectedDate, startOfToday()) ? 'disabled' : '') + '>&#8592;</button>' +
      '<span class="rw-date-nav-label">' + capitalize(dateLabel) + '</span>' +
      '<button type="button" class="rw-icon-btn" id="rw-next-day" aria-label="Día siguiente">&#8594;</button></div>' +
      '<div id="rw-slot-area">' + (daySlots === undefined ? '<div class="rw-skeleton"></div>' : this._slotGridHtml(daySlots)) + '</div>' +
      '<div class="rw-actions">' +
      '<button type="button" class="rw-btn rw-btn-outline" id="rw-back">Atrás</button>' +
      '<button type="button" class="rw-btn rw-btn-primary" id="rw-continue" ' + (s.selectedSlot ? '' : 'disabled') + '>Continuar</button></div>';

    content.querySelector('#rw-prev-day').addEventListener('click', function () { self._changeDay(-1); });
    content.querySelector('#rw-next-day').addEventListener('click', function () { self._changeDay(1); });
    content.querySelector('#rw-back').addEventListener('click', function () {
      self._state.step = STEP.SERVICE;
      self._state.selectedSlot = null;
      self._render();
    });
    content.querySelector('#rw-continue').addEventListener('click', function () {
      self._state.step = STEP.FORM;
      self._render();
    });

    this._wireSlotButtons(content);
  };

  BookingWidget.prototype._slotGridHtml = function (daySlots) {
    if (!daySlots || daySlots.length === 0) {
      return '<div class="rw-empty-state">No hay horas disponibles este día. Prueba con otra fecha.</div>';
    }
    var s = this._state;
    return '<div class="rw-slot-grid">' + daySlots.map(function (slot) {
      var time = new Intl.DateTimeFormat('es-ES', { hour: '2-digit', minute: '2-digit' }).format(new Date(slot.slot_start));
      var isSelected = s.selectedSlot && s.selectedSlot.slot_start === slot.slot_start;
      return '<button type="button" class="rw-slot-btn ' + (isSelected ? 'is-selected' : '') + '" data-start="' + slot.slot_start + '" data-staff="' + slot.staff_id + '">' + time + '</button>';
    }).join('') + '</div>';
  };

  BookingWidget.prototype._wireSlotButtons = function (content) {
    var self = this;
    var buttons = content.querySelectorAll('.rw-slot-btn');
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].addEventListener('click', function (e) {
        self._state.selectedSlot = { slot_start: e.currentTarget.dataset.start, staff_id: e.currentTarget.dataset.staff };
        self._render();
      });
    }
  };

  BookingWidget.prototype._changeDay = function (delta) {
    var next = new Date(this._state.selectedDate);
    next.setDate(next.getDate() + delta);
    if (next < startOfToday()) return;
    this._state.selectedDate = next;
    this._state.selectedSlot = null;
    this._render();
    this._loadSlotsForSelectedDate();
  };

  BookingWidget.prototype._loadSlotsForSelectedDate = function () {
    var self = this;
    var s = this._state;
    var key = dateKey(s.selectedDate);
    if (Object.prototype.hasOwnProperty.call(s.slotsByDay, key)) return;
    this._api.getAvailableSlots({ businessId: s.business.id, serviceId: s.selectedService.id, dateFrom: key, dateTo: key })
      .then(function (slots) { s.slotsByDay[key] = slots; })
      .catch(function () { s.slotsByDay[key] = []; })
      .then(function () { if (self._state.step === STEP.SLOT) self._render(); });
  };

  BookingWidget.prototype._renderFormStep = function (content) {
    var self = this;
    var s = this._state;
    var time = new Intl.DateTimeFormat('es-ES', { dateStyle: 'full', timeStyle: 'short' }).format(new Date(s.selectedSlot.slot_start));

    content.innerHTML = '<h2 class="rw-heading">Tus datos</h2>' +
      '<div class="rw-summary"><div><strong>' + escapeHtml(s.selectedService.name) + '</strong></div><div>' + capitalize(time) + '</div></div>' +
      '<form id="rw-form" novalidate>' +
      '<div class="rw-form-group"><label class="rw-label" for="rw-name">Nombre completo *</label>' +
      '<input class="rw-input" id="rw-name" name="name" type="text" autocomplete="name" required maxlength="200" />' +
      '<div class="rw-field-error" id="rw-name-error" hidden></div></div>' +
      '<div class="rw-form-group"><label class="rw-label" for="rw-phone">Teléfono *</label>' +
      '<input class="rw-input" id="rw-phone" name="phone" type="tel" autocomplete="tel" required maxlength="20" placeholder="600 000 000" />' +
      '<div class="rw-field-error" id="rw-phone-error" hidden></div></div>' +
      '<div class="rw-form-group"><label class="rw-label" for="rw-email">Email (opcional)</label>' +
      '<input class="rw-input" id="rw-email" name="email" type="email" autocomplete="email" maxlength="200" />' +
      '<div class="rw-field-error" id="rw-email-error" hidden></div></div>' +
      '<div class="rw-form-group"><label class="rw-label" for="rw-notes">Comentarios (opcional)</label>' +
      '<textarea class="rw-textarea" id="rw-notes" name="notes" rows="2" maxlength="1000"></textarea></div>' +
      '<div class="rw-form-group"><label class="rw-checkbox-row" for="rw-gdpr">' +
      '<input type="checkbox" id="rw-gdpr" name="gdpr" required />' +
      '<span>Acepto que mis datos sean tratados para gestionar mi cita, conforme al RGPD. *</span></label>' +
      '<div class="rw-field-error" id="rw-gdpr-error" hidden></div></div>' +
      '<div id="rw-form-alert"></div>' +
      '<div class="rw-actions"><button type="button" class="rw-btn rw-btn-outline" id="rw-back">Atrás</button>' +
      '<button type="submit" class="rw-btn rw-btn-primary" id="rw-submit">Confirmar cita</button></div></form>';

    content.querySelector('#rw-back').addEventListener('click', function () {
      self._state.step = STEP.SLOT;
      self._render();
    });
    content.querySelector('#rw-form').addEventListener('submit', function (e) { self._handleSubmit(e); });
  };

  BookingWidget.prototype._handleSubmit = function (e) {
    e.preventDefault();
    var self = this;
    if (this._state.submitting) return;
    var form = e.target;
    var name = form.name.value.trim();
    var phone = form.phone.value.trim();
    var email = form.email.value.trim();
    var notes = form.notes.value.trim();
    var gdpr = form.gdpr.checked;

    var errs = {};
    if (!name) errs.name = 'Indica tu nombre.';
    if (!phone || !/^[+\d][\d\s()-]{6,20}$/.test(phone)) errs.phone = 'Indica un teléfono válido.';
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = 'El email no es válido.';
    if (!gdpr) errs.gdpr = 'Debes aceptar el tratamiento de tus datos para continuar.';

    this._clearFormErrors(form);
    if (Object.keys(errs).length > 0) {
      this._showFormErrors(form, errs);
      return;
    }

    this._state.submitting = true;
    var submitBtn = form.querySelector('#rw-submit');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="rw-spinner" aria-hidden="true"></span> Reservando…';

    var s = this._state;
    this._api.createAppointment({
      serviceId: s.selectedService.id,
      staffId: s.selectedSlot.staff_id,
      startsAt: s.selectedSlot.slot_start,
      customerName: name,
      customerPhone: phone,
      customerEmail: email || undefined,
      notes: notes || undefined,
      gdprConsent: true,
    }).then(function () {
      self._state.step = STEP.SUCCESS;
      self._state.submitting = false;
      self._render();
      self.dispatchEvent(new CustomEvent('booking-widget:booked', { bubbles: true, composed: true, detail: { service: s.selectedService.name } }));
    }).catch(function (err) {
      self._state.submitting = false;
      var alertBox = form.querySelector('#rw-form-alert');
      var message = (err && err.status === 409)
        ? 'Ese horario acaba de reservarse. Elige otra hora disponible.'
        : 'No se pudo completar la reserva. Inténtalo de nuevo.';
      alertBox.innerHTML = '<div class="rw-alert rw-alert-error">' + escapeHtml(message) + '</div>';
      submitBtn.disabled = false;
      submitBtn.textContent = 'Confirmar cita';
      if (err && err.status === 409) {
        delete self._state.slotsByDay[dateKey(self._state.selectedDate)];
        self._state.selectedSlot = null;
      }
    });
  };

  BookingWidget.prototype._showFormErrors = function (form, errs) {
    for (var field in errs) {
      var input = form.querySelector('[name="' + field + '"]');
      var errorEl = form.querySelector('#rw-' + field + '-error');
      if (input) input.classList.add('is-invalid');
      if (errorEl) { errorEl.textContent = errs[field]; errorEl.hidden = false; }
    }
    var firstField = Object.keys(errs)[0];
    var el = form.querySelector('[name="' + firstField + '"]');
    if (el) el.focus();
  };

  BookingWidget.prototype._clearFormErrors = function (form) {
    var invalids = form.querySelectorAll('.is-invalid');
    for (var i = 0; i < invalids.length; i++) invalids[i].classList.remove('is-invalid');
    var errors = form.querySelectorAll('.rw-field-error');
    for (var j = 0; j < errors.length; j++) { errors[j].hidden = true; errors[j].textContent = ''; }
  };

  BookingWidget.prototype._renderSuccessStep = function (content) {
    var self = this;
    var s = this._state;
    var time = new Intl.DateTimeFormat('es-ES', { dateStyle: 'full', timeStyle: 'short' }).format(new Date(s.selectedSlot.slot_start));
    content.innerHTML = '<div class="rw-success-state"><div class="rw-success-icon" aria-hidden="true">&#10003;</div>' +
      '<h3>¡Cita solicitada!</h3><p>Hemos recibido tu solicitud para <strong>' + escapeHtml(s.selectedService.name) + '</strong> el ' + capitalize(time) + '.<br />' +
      'Te hemos enviado un email de confirmación. Si no lo ves, revisa spam.</p>' +
      '<div class="rw-actions" style="margin-top:24px;"><button type="button" class="rw-btn rw-btn-primary" id="rw-new-booking" style="flex:1;">Reservar otra cita</button></div></div>';
    content.querySelector('#rw-new-booking').addEventListener('click', function () {
      self._state.step = STEP.SERVICE;
      self._state.selectedService = null;
      self._state.selectedSlot = null;
      self._state.slotsByDay = {};
      self._render();
    });
  };

  if (!customElements.get('booking-widget')) {
    customElements.define('booking-widget', BookingWidget);
  }
})();
