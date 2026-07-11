(function () {
  'use strict';

  const { supabaseUrl, supabaseAnonKey, businessSlug } = window.ADMIN_CONFIG;
  const supabase = window.supabase.createClient(supabaseUrl, supabaseAnonKey);

  const state = {
    business: null,
    services: [],
    selectedDate: startOfDay(new Date()),
    filter: 'all',
    appointments: [],
  };

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));

  const loginScreen = $('#login-screen');
  const appScreen = $('#app-screen');

  // ---------------------------------------------------------------------
  // Auth
  // ---------------------------------------------------------------------
  async function init() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      await enterApp();
    }
  }

  $('#login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = $('#login-email').value.trim();
    const password = $('#login-password').value;
    const submitBtn = $('#login-submit');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Entrando…';
    $('#login-alert').innerHTML = '';

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      $('#login-alert').innerHTML = `<div class="alert alert-error">Email o contraseña incorrectos.</div>`;
      submitBtn.disabled = false;
      submitBtn.textContent = 'Entrar';
      return;
    }
    await enterApp();
  });

  $('#logout-btn').addEventListener('click', async () => {
    await supabase.auth.signOut();
    location.reload();
  });

  async function enterApp() {
    const { data: business, error } = await supabase
      .from('businesses')
      .select('id, name, timezone')
      .eq('slug', businessSlug)
      .single();

    if (error || !business) {
      $('#login-alert').innerHTML = `<div class="alert alert-error">Tu usuario no tiene acceso a ningún negocio. Contacta con soporte.</div>`;
      await supabase.auth.signOut();
      return;
    }

    state.business = business;
    $('#business-name-label').textContent = business.name;

    const { data: services } = await supabase
      .from('services')
      .select('id, name, duration_minutes')
      .eq('business_id', business.id)
      .eq('is_active', true)
      .order('display_order');
    state.services = services || [];
    populateServiceSelect();

    loginScreen.style.display = 'none';
    appScreen.classList.add('is-visible');
    await refreshAppointments();
  }

  // ---------------------------------------------------------------------
  // Agenda: carga y render
  // ---------------------------------------------------------------------
  async function refreshAppointments() {
    const dayStart = startOfDay(state.selectedDate);
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

    $('#date-label').textContent = formatDateLabel(state.selectedDate);

    const { data, error } = await supabase
      .from('appointments')
      .select('id, starts_at, ends_at, status, customer_name, customer_phone, customer_email, notes, source, services(name)')
      .eq('business_id', state.business.id)
      .gte('starts_at', dayStart.toISOString())
      .lt('starts_at', dayEnd.toISOString())
      .order('starts_at', { ascending: true });

    if (error) {
      $('#appt-list').innerHTML = `<div class="alert alert-error">No se pudieron cargar las citas.</div>`;
      return;
    }

    state.appointments = data || [];
    renderAppointments();
  }

  function renderAppointments() {
    const list = $('#appt-list');
    const filtered = state.filter === 'all'
      ? state.appointments
      : state.appointments.filter((a) => a.status === state.filter);

    if (filtered.length === 0) {
      list.innerHTML = `<div class="empty-state">No hay citas ${state.filter === 'all' ? '' : 'con este estado '}para este día.</div>`;
      return;
    }

    list.innerHTML = filtered.map(renderApptCard).join('');
    wireApptActions();
  }

  function renderApptCard(appt) {
    const time = new Intl.DateTimeFormat('es-ES', { hour: '2-digit', minute: '2-digit' }).format(new Date(appt.starts_at));
    const statusLabels = { pending: 'Pendiente', confirmed: 'Confirmada', cancelled: 'Cancelada', completed: 'Completada', no_show: 'No presentada' };

    const actions = [];
    if (appt.status === 'pending') {
      actions.push(`<button class="btn btn-success btn-sm" data-action="confirm" data-id="${appt.id}">Confirmar</button>`);
      actions.push(`<button class="btn btn-danger btn-sm" data-action="reject" data-id="${appt.id}">Rechazar</button>`);
    }
    if (appt.status === 'pending' || appt.status === 'confirmed') {
      actions.push(`<button class="btn btn-outline btn-sm" data-action="reschedule" data-id="${appt.id}">Reprogramar</button>`);
      actions.push(`<button class="btn btn-outline btn-sm" data-action="cancel" data-id="${appt.id}">Cancelar</button>`);
    }

    return `
      <article class="appt-card">
        <div class="appt-card-top">
          <div>
            <div class="appt-time">${time}</div>
            <div class="appt-service">${escapeHtml(appt.services?.name || 'Servicio')} ${appt.source === 'admin_manual' ? '&middot; manual' : ''}</div>
          </div>
          <span class="badge badge-${appt.status}">${statusLabels[appt.status] || appt.status}</span>
        </div>
        <div class="appt-contact">
          ${escapeHtml(appt.customer_name)} &middot; <a href="tel:${escapeHtml(appt.customer_phone)}">${escapeHtml(appt.customer_phone)}</a>
          ${appt.customer_email ? ` &middot; ${escapeHtml(appt.customer_email)}` : ''}
          ${appt.notes ? `<div style="margin-top:4px;">${escapeHtml(appt.notes)}</div>` : ''}
        </div>
        <div class="appt-actions">${actions.join('')}</div>
      </article>`;
  }

  function wireApptActions() {
    $$('[data-action]').forEach((btn) => {
      btn.addEventListener('click', () => handleApptAction(btn.dataset.action, btn.dataset.id));
    });
  }

  async function handleApptAction(action, id) {
    if (action === 'confirm') return updateStatus(id, 'confirmed');
    if (action === 'reject') return updateStatus(id, 'cancelled');
    if (action === 'cancel') {
      if (confirm('¿Cancelar esta cita?')) return updateStatus(id, 'cancelled');
      return;
    }
    if (action === 'reschedule') return openRescheduleModal(id);
  }

  async function updateStatus(id, status) {
    const { error } = await supabase.from('appointments').update({ status }).eq('id', id);
    if (error) {
      alert('No se pudo actualizar la cita.');
      return;
    }
    await refreshAppointments();
  }

  // ---------------------------------------------------------------------
  // Navegación de fecha / filtros
  // ---------------------------------------------------------------------
  $('#prev-day').addEventListener('click', () => changeDay(-1));
  $('#next-day').addEventListener('click', () => changeDay(1));

  function changeDay(delta) {
    const next = new Date(state.selectedDate);
    next.setDate(next.getDate() + delta);
    state.selectedDate = next;
    refreshAppointments();
  }

  $$('.filter-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      $$('.filter-tab').forEach((t) => t.classList.remove('is-active'));
      tab.classList.add('is-active');
      state.filter = tab.dataset.filter;
      renderAppointments();
    });
  });

  // ---------------------------------------------------------------------
  // Modales genéricos
  // ---------------------------------------------------------------------
  function openModal(id) { $('#' + id).classList.add('is-open'); }
  function closeModal(id) { $('#' + id).classList.remove('is-open'); }
  $$('[data-close-modal]').forEach((btn) => btn.addEventListener('click', () => closeModal(btn.dataset.closeModal)));
  $$('.modal-overlay').forEach((overlay) => {
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.classList.remove('is-open'); });
  });

  $('#new-appt-fab').addEventListener('click', () => {
    $('#manual-date').value = toDateInputValue(state.selectedDate);
    openModal('manual-modal');
  });

  $$('.bottom-nav button').forEach((btn) => {
    btn.addEventListener('click', () => {
      $$('.bottom-nav button').forEach((b) => b.classList.remove('is-active'));
      btn.classList.add('is-active');
      if (btn.dataset.view === 'block') openModal('block-modal');
    });
  });

  function populateServiceSelect() {
    $('#manual-service').innerHTML = state.services
      .map((s) => `<option value="${s.id}" data-duration="${s.duration_minutes}">${escapeHtml(s.name)} (${s.duration_minutes} min)</option>`)
      .join('');
  }

  // ---------------------------------------------------------------------
  // Crear cita manual (walk-in)
  // ---------------------------------------------------------------------
  $('#manual-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const alertBox = $('#manual-alert');
    alertBox.innerHTML = '';

    const serviceSelect = $('#manual-service');
    const serviceId = serviceSelect.value;
    const durationMinutes = Number(serviceSelect.selectedOptions[0]?.dataset.duration || 30);
    const date = $('#manual-date').value;
    const time = $('#manual-time').value;
    const name = $('#manual-name').value.trim();
    const phone = $('#manual-phone').value.trim();
    const notes = $('#manual-notes').value.trim();

    if (!date || !time || !name || !phone) {
      alertBox.innerHTML = `<div class="alert alert-error">Completa todos los campos obligatorios.</div>`;
      return;
    }

    const startsAt = new Date(`${date}T${time}:00`);
    const endsAt = new Date(startsAt.getTime() + durationMinutes * 60000);

    const { error } = await supabase.from('appointments').insert({
      business_id: state.business.id,
      service_id: serviceId,
      starts_at: startsAt.toISOString(),
      ends_at: endsAt.toISOString(),
      status: 'confirmed',
      source: 'admin_manual',
      customer_name: name,
      customer_phone: phone,
      notes: notes || null,
      gdpr_consent: true,
    });

    if (error) {
      alertBox.innerHTML = `<div class="alert alert-error">No se pudo crear la cita. ${error.message.includes('duplicate') ? 'Ya existe una cita en ese horario.' : ''}</div>`;
      return;
    }

    $('#manual-form').reset();
    closeModal('manual-modal');
    await refreshAppointments();
  });

  // ---------------------------------------------------------------------
  // Bloquear franja horaria manualmente
  // ---------------------------------------------------------------------
  $('#block-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const alertBox = $('#block-alert');
    alertBox.innerHTML = '';

    const from = $('#block-date-from').value;
    const to = $('#block-date-to').value;
    const reason = $('#block-reason').value.trim();

    if (!from || !to || new Date(to) <= new Date(from)) {
      alertBox.innerHTML = `<div class="alert alert-error">Revisa las fechas: "hasta" debe ser posterior a "desde".</div>`;
      return;
    }

    const { error } = await supabase.from('availability_rules').insert({
      business_id: state.business.id,
      rule_type: 'blocked',
      blocked_start_at: new Date(from).toISOString(),
      blocked_end_at: new Date(to).toISOString(),
      reason: reason || null,
    });

    if (error) {
      alertBox.innerHTML = `<div class="alert alert-error">No se pudo bloquear la franja.</div>`;
      return;
    }

    $('#block-form').reset();
    closeModal('block-modal');
    alert('Franja horaria bloqueada correctamente.');
  });

  // ---------------------------------------------------------------------
  // Reprogramar cita
  // ---------------------------------------------------------------------
  function openRescheduleModal(id) {
    const appt = state.appointments.find((a) => a.id === id);
    if (!appt) return;
    $('#reschedule-appt-id').value = id;
    const d = new Date(appt.starts_at);
    $('#reschedule-date').value = toDateInputValue(d);
    $('#reschedule-time').value = toTimeInputValue(d);
    openModal('reschedule-modal');
  }

  $('#reschedule-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const alertBox = $('#reschedule-alert');
    alertBox.innerHTML = '';

    const id = $('#reschedule-appt-id').value;
    const appt = state.appointments.find((a) => a.id === id);
    const date = $('#reschedule-date').value;
    const time = $('#reschedule-time').value;
    if (!appt || !date || !time) return;

    const durationMs = new Date(appt.ends_at).getTime() - new Date(appt.starts_at).getTime();
    const newStart = new Date(`${date}T${time}:00`);
    const newEnd = new Date(newStart.getTime() + durationMs);

    const { error } = await supabase
      .from('appointments')
      .update({ starts_at: newStart.toISOString(), ends_at: newEnd.toISOString() })
      .eq('id', id);

    if (error) {
      alertBox.innerHTML = `<div class="alert alert-error">No se pudo reprogramar la cita.</div>`;
      return;
    }

    closeModal('reschedule-modal');
    await refreshAppointments();
  });

  // ---------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------
  function startOfDay(d) {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
  }
  function formatDateLabel(d) {
    const today = startOfDay(new Date());
    if (d.getTime() === today.getTime()) return 'Hoy';
    return new Intl.DateTimeFormat('es-ES', { weekday: 'long', day: 'numeric', month: 'short' }).format(d);
  }
  function toDateInputValue(d) {
    return d.toISOString().slice(0, 10);
  }
  function toTimeInputValue(d) {
    return d.toTimeString().slice(0, 5);
  }
  function escapeHtml(s) {
    return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  init();
})();
