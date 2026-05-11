const localStorageKey = "nemaucar-planning-local-v3";
const apiBase = "/.netlify/functions";

const statuses = {
  available: { label: "Disponible", className: "status-available" },
  reserved: { label: "Reserve", className: "status-reserved" },
  rented: { label: "Loue", className: "status-rented" },
  late: { label: "Retard", className: "status-late" },
  service: { label: "Entretien", className: "status-service" },
};

const seedData = {
  vehicles: [
    {
      id: "veh-real-1",
      plate: "GM-803-RV",
      model: "Aixam City",
      mileage: 24500,
      status: "rented",
      notes: "",
      nextServiceDate: "",
    },
    {
      id: "veh-real-2",
      plate: "GJ-676-VM",
      model: "Aixam City",
      mileage: 31800,
      status: "rented",
      notes: "",
      nextServiceDate: "",
    },
    {
      id: "veh-real-3",
      plate: "GT-392-VC",
      model: "Aixam Minauto",
      mileage: 24500,
      status: "rented",
      notes: "",
      nextServiceDate: "",
    },
    {
      id: "veh-real-4",
      plate: "GE-319-QR",
      model: "Ligier JS50",
      mileage: 31800,
      status: "rented",
      notes: "",
      nextServiceDate: "",
    },
    {
      id: "veh-real-5",
      plate: "GV-723-DV",
      model: "Aixam City",
      mileage: 24500,
      status: "rented",
      notes: "GARDMOB",
      nextServiceDate: "",
    },
  ],
  rentals: [],
  customers: [],
};

const state = {
  data: structuredClone(seedData),
  currentView: "planning",
  calendarMode: "week",
  focusDate: new Date(),
  storageMode: "netlify",
  saveState: "idle",
};

const elements = {
  authShell: document.querySelector("#authShell"),
  loadingShell: document.querySelector("#loadingShell"),
  appRoot: document.querySelector("#appRoot"),
  loginForm: document.querySelector("#loginForm"),
  loginButton: document.querySelector("#loginButton"),
  loginMessage: document.querySelector("#loginMessage"),
  saveBadge: document.querySelector("#saveBadge"),
  setupBanner: document.querySelector("#setupBanner"),
  viewTitle: document.querySelector("#viewTitle"),
  navItems: document.querySelectorAll(".nav-item"),
  views: document.querySelectorAll(".view"),
  calendar: document.querySelector("#calendar"),
  periodLabel: document.querySelector("#periodLabel"),
  statusLegend: document.querySelector("#statusLegend"),
  vehicleList: document.querySelector("#vehicleList"),
  rentalTable: document.querySelector("#rentalTable"),
  alertList: document.querySelector("#alertList"),
  vehicleModal: document.querySelector("#vehicleModal"),
  rentalModal: document.querySelector("#rentalModal"),
  vehicleForm: document.querySelector("#vehicleForm"),
  rentalForm: document.querySelector("#rentalForm"),
  resetFleetButton: document.querySelector("#resetFleetButton"),
};

function setBodyState(mode) {
  document.body.classList.remove("auth-open", "loading-open");
  elements.authShell.classList.add("hidden");
  elements.loadingShell.classList.add("hidden");
  elements.appRoot.classList.add("hidden");

  if (mode === "auth") {
    document.body.classList.add("auth-open");
    elements.authShell.classList.remove("hidden");
    return;
  }

  if (mode === "loading") {
    document.body.classList.add("loading-open");
    elements.loadingShell.classList.remove("hidden");
    return;
  }

  elements.appRoot.classList.remove("hidden");
}

function setSaveState(mode, message) {
  state.saveState = mode;
  elements.saveBadge.textContent = message;
  elements.saveBadge.classList.toggle("is-saving", mode === "saving");
  elements.saveBadge.classList.toggle("is-error", mode === "error");
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function parseDate(value) {
  const [year, month, day] = String(value).split("-").map(Number);
  return new Date(year, (month || 1) - 1, day || 1);
}

function toInputDate(date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function formatDate(dateLike, options = {}) {
  if (!dateLike) return "-";
  const date = typeof dateLike === "string" ? parseDate(dateLike) : dateLike;
  return new Intl.DateTimeFormat("fr-FR", options).format(date);
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function getWeekStart(date) {
  const day = date.getDay() || 7;
  return addDays(date, 1 - day);
}

function sameDay(a, b) {
  return toInputDate(a) === toInputDate(b);
}

function rentalTouchesDay(rental, day) {
  const start = parseDate(rental.startDate);
  const end = parseDate(rental.endDate);
  return day >= start && day <= end;
}

function getPeriodDays() {
  if (state.calendarMode === "week") {
    const start = getWeekStart(state.focusDate);
    return Array.from({ length: 7 }, (_, index) => addDays(start, index));
  }

  const year = state.focusDate.getFullYear();
  const month = state.focusDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  return Array.from({ length: daysInMonth }, (_, index) => new Date(year, month, index + 1));
}

function statusLabel(key) {
  return statuses[key]?.label || key;
}

function statusClass(key) {
  return statuses[key]?.className || "status-available";
}

function vehicleName(id) {
  const vehicle = state.data.vehicles.find((item) => item.id === id);
  if (!vehicle) return "Vehicule supprime";
  const left = vehicle.model || "Modele a renseigner";
  const right = vehicle.plate || "immat. a renseigner";
  return `${left} - ${right}`;
}

function sanitizeData(data) {
  const vehicles = Array.isArray(data?.vehicles) ? data.vehicles : [];
  const rentals = Array.isArray(data?.rentals) ? data.rentals : [];
  const customers = Array.isArray(data?.customers) ? data.customers : [];

  return {
    vehicles: vehicles.map((vehicle) => ({
      id: vehicle.id || `veh-${Date.now()}-${Math.random().toString(16).slice(2, 7)}`,
      plate: vehicle.plate || "",
      model: vehicle.model || "",
      mileage: Number(vehicle.mileage || 0),
      status: vehicle.status || "available",
      notes: vehicle.notes || "",
      nextServiceDate: vehicle.nextServiceDate || "",
    })),
    rentals: rentals.map((rental) => ({
      id: rental.id || `rent-${Date.now()}-${Math.random().toString(16).slice(2, 7)}`,
      customerName: rental.customerName || "",
      phone: rental.phone || "",
      email: rental.email || "",
      vehicleId: rental.vehicleId || "",
      startDate: rental.startDate || toInputDate(new Date()),
      endDate: rental.endDate || toInputDate(addDays(new Date(), 30)),
      rate: rental.rate || "",
      depositPaid: Boolean(rental.depositPaid),
      documentsReceived: Boolean(rental.documentsReceived),
      paymentStatus: rental.paymentStatus || "En attente",
      status: rental.status || "reserved",
      comments: rental.comments || "",
    })),
    customers,
  };
}

function syncCustomers() {
  const seen = new Set();
  state.data.customers = state.data.rentals
    .map((rental) => ({
      name: rental.customerName,
      phone: rental.phone,
      email: rental.email,
    }))
    .filter((customer) => {
      const key = `${customer.name}|${customer.phone}|${customer.email}`;
      if (!customer.name || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function syncVehicleStatuses() {
  state.data.vehicles.forEach((vehicle) => {
    if (vehicle.status === "service") return;
    const linkedRentals = state.data.rentals
      .filter((rental) => rental.vehicleId === vehicle.id)
      .sort((a, b) => parseDate(a.startDate) - parseDate(b.startDate));

    const activeRental = linkedRentals.find(
      (rental) => ["late", "rented"].includes(rental.status) && parseDate(rental.endDate) >= new Date()
    );
    const futureReservation = linkedRentals.find(
      (rental) => rental.status === "reserved" && parseDate(rental.endDate) >= new Date()
    );

    if (activeRental) {
      vehicle.status = activeRental.status;
    } else if (futureReservation) {
      vehicle.status = "reserved";
    } else {
      vehicle.status = "available";
    }
  });
}

function buildSeedFleet() {
  return seedData.vehicles.map((vehicle) => ({ ...vehicle }));
}

function resetAllDataToSeed() {
  state.data = sanitizeData({
    vehicles: buildSeedFleet(),
    rentals: [],
    customers: [],
  });
  syncCustomers();
  syncVehicleStatuses();
}

function normalizeStateData(data) {
  state.data = sanitizeData(data);
  syncCustomers();
  syncVehicleStatuses();
}

function saveLocalData() {
  localStorage.setItem(localStorageKey, JSON.stringify(state.data));
}

function loadLocalData() {
  try {
    const saved = JSON.parse(localStorage.getItem(localStorageKey) || "null");
    if (saved) {
      normalizeStateData(saved);
      return true;
    }
  } catch {
    return false;
  }
  normalizeStateData(seedData);
  return false;
}

function enableLocalFallback(message = "Mode local de secours") {
  state.storageMode = "local";
  saveLocalData();
  setSaveState("idle", message);
}

async function apiRequest(endpoint, options = {}) {
  const response = await fetch(`${apiBase}/${endpoint}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  if (response.status === 204) return null;
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(payload.error || "Erreur reseau");
    error.status = response.status;
    throw error;
  }
  return payload;
}

async function detectStorageMode() {
  if (window.location.protocol === "file:") {
    state.storageMode = "local";
    return;
  }

  try {
    await apiRequest("auth-session");
    state.storageMode = "netlify";
  } catch {
    state.storageMode = "local";
  }
}

async function requireSession() {
  if (state.storageMode === "local") return true;
  const session = await apiRequest("auth-session");
  return Boolean(session?.authenticated);
}

async function login(password) {
  if (state.storageMode === "local") {
    const savedPassword = localStorage.getItem("nemaucar-local-password") || "nemaucar";
    if (password !== savedPassword) throw new Error("Mot de passe incorrect.");
    return;
  }

  await apiRequest("auth-login", {
    method: "POST",
    body: JSON.stringify({ password }),
  });
}

async function logout() {
  if (state.storageMode === "local") {
    setBodyState("auth");
    elements.loginForm.reset();
    return;
  }

  await apiRequest("auth-logout", { method: "POST" });
  setBodyState("auth");
  elements.loginForm.reset();
}

async function loadAppData() {
  if (state.storageMode === "local") {
    loadLocalData();
    return;
  }

  try {
    const payload = await apiRequest("data-read");
    normalizeStateData(payload?.data || seedData);
  } catch (error) {
    if (error.status === 500) {
      normalizeStateData(seedData);
      enableLocalFallback("Mode local de secours");
      return;
    }
    throw error;
  }
}

async function persistData() {
  syncCustomers();
  syncVehicleStatuses();

  if (state.storageMode === "local") {
    saveLocalData();
    setSaveState("idle", "Sauvegarde locale");
    return;
  }

  try {
    setSaveState("saving", "Sauvegarde...");
    await apiRequest("data-write", {
      method: "POST",
      body: JSON.stringify({ data: state.data }),
    });
    setSaveState("idle", "Sauvegarde OK");
  } catch (error) {
    if (error.status === 500) {
      enableLocalFallback("Sauvegarde locale");
      return;
    }
    throw error;
  }
}

function buildAlerts() {
  const today = new Date();
  const todayInput = toInputDate(today);
  const soonLimit = addDays(today, 3);
  const alerts = [];

  state.data.rentals.forEach((rental) => {
    const end = parseDate(rental.endDate);
    if (rental.paymentStatus === "En retard") {
      alerts.push({
        type: "Paiement",
        text: `${rental.customerName} a un paiement en retard.`,
        tone: "status-late",
        rentalId: rental.id,
      });
    }
    if (rental.endDate === todayInput) {
      alerts.push({
        type: "Retour",
        text: `${rental.customerName} doit rendre ${vehicleName(rental.vehicleId)} aujourd'hui.`,
        tone: "status-reserved",
        rentalId: rental.id,
      });
    } else if (end > today && end <= soonLimit) {
      alerts.push({
        type: "Bientot",
        text: `La location de ${rental.customerName} se termine le ${formatDate(rental.endDate)}.`,
        tone: "status-reserved",
        rentalId: rental.id,
      });
    }
    if (rental.status === "late") {
      alerts.push({
        type: "Retard",
        text: `${rental.customerName} est signale en retard.`,
        tone: "status-late",
        rentalId: rental.id,
      });
    }
  });

  state.data.vehicles
    .filter((vehicle) => vehicle.status === "service")
    .forEach((vehicle) =>
      alerts.push({
        type: "Atelier",
        text: `${vehicleName(vehicle.id)} est en entretien.`,
        tone: "status-service",
        vehicleId: vehicle.id,
      })
    );

  return alerts;
}

function renderNavigation() {
  const titles = {
    planning: "Planning",
    vehicles: "Fiches vehicules",
    rentals: "Fiches locations",
    alerts: "Alertes utiles",
  };
  elements.viewTitle.textContent = titles[state.currentView];
  elements.navItems.forEach((item) => item.classList.toggle("active", item.dataset.view === state.currentView));
  elements.views.forEach((view) => view.classList.toggle("active", view.id === `${state.currentView}View`));
}

function renderSummary() {
  const counts = state.data.vehicles.reduce(
    (acc, vehicle) => {
      acc[vehicle.status] = (acc[vehicle.status] || 0) + 1;
      return acc;
    },
    { available: 0, reserved: 0, rented: 0 }
  );
  document.querySelector("#availableCount").textContent = counts.available || 0;
  document.querySelector("#reservedCount").textContent = counts.reserved || 0;
  document.querySelector("#rentedCount").textContent = counts.rented || 0;
  document.querySelector("#alertCount").textContent = buildAlerts().length;
  elements.setupBanner.classList.toggle("hidden", state.data.vehicles.length > 0);
}

function renderLegend() {
  elements.statusLegend.innerHTML = Object.entries(statuses)
    .map(([key, status]) => `<span class="legend-item"><span class="dot ${status.className}"></span>${status.label}</span>`)
    .join("");
}

function renderCalendar() {
  if (!state.data.vehicles.length) {
    elements.calendar.innerHTML = `<div class="list-card"><p>Aucun vehicule configure pour le moment.</p></div>`;
    return;
  }

  const days = getPeriodDays();
  const first = days[0];
  const last = days[days.length - 1];
  elements.periodLabel.textContent =
    state.calendarMode === "week"
      ? `${formatDate(first, { day: "numeric", month: "long" })} - ${formatDate(last, {
          day: "numeric",
          month: "long",
          year: "numeric",
        })}`
      : formatDate(first, { month: "long", year: "numeric" });

  const head = [
    `<div class="calendar-head">Vehicule</div>`,
    ...days.map(
      (day) =>
        `<div class="calendar-head"><strong>${formatDate(day, {
          weekday: "short",
        })}</strong><span>${formatDate(day, { day: "2-digit", month: "2-digit" })}</span></div>`
    ),
  ].join("");

  const rows = state.data.vehicles
    .map((vehicle) => {
      const cells = days
        .map((day) => {
          const rentals = state.data.rentals.filter(
            (rental) => rental.vehicleId === vehicle.id && rentalTouchesDay(rental, day)
          );
          const bookings = rentals
            .map(
              (rental) => `
                <button class="booking ${statusClass(rental.status)}" type="button" data-edit-rental="${rental.id}">
                  <strong>${escapeHtml(rental.customerName || "Client")}</strong>
                  <small>${escapeHtml(statusLabel(rental.status))}</small>
                </button>
              `
            )
            .join("");
          return `<div class="calendar-cell ${sameDay(day, new Date()) ? "today" : ""}">${bookings}</div>`;
        })
        .join("");

      return `
        <div class="vehicle-row-label">
          <strong>${escapeHtml(vehicle.model || "Modele a renseigner")}</strong>
          <span>${escapeHtml(vehicle.plate || "immat. a renseigner")}</span>
          <span class="status-pill ${statusClass(vehicle.status)}">${escapeHtml(statusLabel(vehicle.status))}</span>
        </div>
        ${cells}
      `;
    })
    .join("");

  elements.calendar.innerHTML = `<div class="calendar-grid" style="--day-count:${days.length}">${head}${rows}</div>`;
}

function renderVehicles() {
  if (!state.data.vehicles.length) {
    elements.vehicleList.innerHTML = `<article class="list-card"><h3>Aucun vehicule</h3><p>Ajoutez vos 4 vehicules reels pour commencer.</p></article>`;
    return;
  }

  elements.vehicleList.innerHTML = state.data.vehicles
    .map(
      (vehicle) => `
        <article class="list-card">
          <header>
            <div>
              <h3>${escapeHtml(vehicle.model || "Modele a renseigner")}</h3>
              <p>${escapeHtml(vehicle.plate || "immat. a renseigner")}</p>
            </div>
            <span class="status-pill ${statusClass(vehicle.status)}">${escapeHtml(statusLabel(vehicle.status))}</span>
          </header>
          <dl class="info-list">
            <div><dt>Kilometrage</dt><dd>${Number(vehicle.mileage || 0).toLocaleString("fr-FR")} km</dd></div>
            <div><dt>Prochain entretien</dt><dd>${escapeHtml(vehicle.nextServiceDate ? formatDate(vehicle.nextServiceDate) : "-")}</dd></div>
            <div><dt>Notes</dt><dd>${escapeHtml(vehicle.notes || "-")}</dd></div>
          </dl>
          <div class="card-actions">
            <button class="btn ghost" type="button" data-edit-vehicle="${vehicle.id}">Modifier</button>
          </div>
        </article>
      `
    )
    .join("");
}

function renderRentals() {
  if (!state.data.rentals.length) {
    elements.rentalTable.innerHTML = `<tr><td colspan="7">Aucune location enregistree pour le moment.</td></tr>`;
    return;
  }

  elements.rentalTable.innerHTML = [...state.data.rentals]
    .sort((a, b) => parseDate(a.startDate) - parseDate(b.startDate))
    .map(
      (rental) => `
        <tr>
          <td><strong>${escapeHtml(rental.customerName)}</strong><div class="rental-meta">${escapeHtml(rental.phone)}<br>${escapeHtml(rental.email)}</div></td>
          <td>${escapeHtml(vehicleName(rental.vehicleId))}</td>
          <td>${escapeHtml(formatDate(rental.startDate))}<br>${escapeHtml(formatDate(rental.endDate))}</td>
          <td>${escapeHtml(rental.rate)}</td>
          <td>${escapeHtml(rental.paymentStatus)}<div class="rental-meta">Caution : ${rental.depositPaid ? "oui" : "non"}<br>Docs : ${rental.documentsReceived ? "oui" : "non"}</div></td>
          <td><span class="status-pill ${statusClass(rental.status)}">${escapeHtml(statusLabel(rental.status))}</span></td>
          <td class="table-actions"><button class="btn ghost" type="button" data-edit-rental="${rental.id}">Modifier</button></td>
        </tr>
      `
    )
    .join("");
}

function renderAlerts() {
  const alerts = buildAlerts();
  elements.alertList.innerHTML = alerts.length
    ? alerts
        .map(
          (alert) => `
            <article class="alert-item">
              <span class="alert-badge ${alert.tone}">!</span>
              <div>
                <strong>${escapeHtml(alert.type)}</strong>
                <p>${escapeHtml(alert.text)}</p>
              </div>
              ${alert.rentalId ? `<button class="btn ghost" type="button" data-edit-rental="${alert.rentalId}">Voir</button>` : ""}
            </article>
          `
        )
        .join("")
    : `<article class="alert-item"><span class="alert-badge status-available">OK</span><div><strong>Aucune alerte</strong><p>Tout est clair pour le moment.</p></div></article>`;
}

function fillSelects() {
  const vehicleOptions = state.data.vehicles
    .map((vehicle) => `<option value="${vehicle.id}">${escapeHtml(vehicleName(vehicle.id))}</option>`)
    .join("");
  const statusOptions = Object.entries(statuses)
    .map(([key, value]) => `<option value="${key}">${value.label}</option>`)
    .join("");
  const rentalStatusOptions = Object.entries(statuses)
    .filter(([key]) => key !== "available" && key !== "service")
    .map(([key, value]) => `<option value="${key}">${value.label}</option>`)
    .join("");

  elements.rentalForm.elements.vehicleId.innerHTML = vehicleOptions;
  elements.rentalForm.elements.status.innerHTML = rentalStatusOptions;
  elements.vehicleForm.elements.status.innerHTML = statusOptions;
}

function render() {
  renderNavigation();
  renderSummary();
  renderLegend();
  renderCalendar();
  renderVehicles();
  renderRentals();
  renderAlerts();
  fillSelects();
}

function openVehicleModal(id) {
  const form = elements.vehicleForm;
  form.reset();
  document.querySelector("#vehicleModalTitle").textContent = id ? "Modifier le vehicule" : "Ajouter un vehicule";
  if (id) {
    const vehicle = state.data.vehicles.find((item) => item.id === id);
    Object.entries(vehicle).forEach(([key, value]) => {
      if (form.elements[key]) form.elements[key].value = value ?? "";
    });
  } else {
    form.elements.id.value = "";
    form.elements.status.value = "available";
    form.elements.nextServiceDate.value = toInputDate(addDays(new Date(), 30));
  }
  elements.vehicleModal.showModal();
}

function openRentalModal(id) {
  const form = elements.rentalForm;
  form.reset();
  document.querySelector("#rentalModalTitle").textContent = id ? "Modifier la location" : "Ajouter une location";
  document.querySelector("#deleteRental").classList.toggle("hidden", !id);
  if (id) {
    const rental = state.data.rentals.find((item) => item.id === id);
    Object.entries(rental).forEach(([key, value]) => {
      if (form.elements[key]) form.elements[key].value = String(value);
    });
  } else {
    form.elements.id.value = "";
    form.elements.startDate.value = toInputDate(new Date());
    form.elements.endDate.value = toInputDate(addDays(new Date(), 30));
    form.elements.status.value = "reserved";
    form.elements.paymentStatus.value = "En attente";
  }
  elements.rentalModal.showModal();
}

function formToObject(form) {
  const data = Object.fromEntries(new FormData(form));
  if ("depositPaid" in data) data.depositPaid = data.depositPaid === "true";
  if ("documentsReceived" in data) data.documentsReceived = data.documentsReceived === "true";
  if (data.mileage) data.mileage = Number(data.mileage);
  return data;
}

async function saveVehicle() {
  if (!elements.vehicleForm.reportValidity()) return;
  const vehicle = formToObject(elements.vehicleForm);
  if (vehicle.id) {
    state.data.vehicles = state.data.vehicles.map((item) => (item.id === vehicle.id ? vehicle : item));
  } else {
    vehicle.id = `veh-${Date.now()}`;
    state.data.vehicles.push(vehicle);
  }

  try {
    await persistData();
    render();
    elements.vehicleModal.close();
  } catch (error) {
    setSaveState("error", "Erreur de sauvegarde");
    alert(error.message || "Impossible d'enregistrer le vehicule.");
  }
}

async function saveRental() {
  if (!elements.rentalForm.reportValidity()) return;
  const rental = formToObject(elements.rentalForm);
  if (parseDate(rental.endDate) < parseDate(rental.startDate)) {
    alert("La date de fin doit etre apres la date de debut.");
    return;
  }

  if (rental.id) {
    state.data.rentals = state.data.rentals.map((item) => (item.id === rental.id ? rental : item));
  } else {
    rental.id = `rent-${Date.now()}`;
    state.data.rentals.push(rental);
  }

  try {
    await persistData();
    render();
    elements.rentalModal.close();
  } catch (error) {
    setSaveState("error", "Erreur de sauvegarde");
    alert(error.message || "Impossible d'enregistrer la location.");
  }
}

async function deleteCurrentRental() {
  const id = elements.rentalForm.elements.id.value;
  if (!id || !confirm("Supprimer cette location ?")) return;

  state.data.rentals = state.data.rentals.filter((rental) => rental.id !== id);

  try {
    await persistData();
    render();
    elements.rentalModal.close();
  } catch (error) {
    setSaveState("error", "Erreur de sauvegarde");
    alert(error.message || "Impossible de supprimer la location.");
  }
}

async function resetFleet() {
  const confirmed = confirm(
    "Tout remettre a zero et recharger uniquement la nouvelle flotte ? Les locations, les clients et l'historique seront supprimes."
  );
  if (!confirmed) return;

  try {
    resetAllDataToSeed();
    await persistData();
    render();
    alert("Le planning a ete remis a zero avec la nouvelle flotte.");
  } catch (error) {
    setSaveState("error", "Erreur de sauvegarde");
    alert(error.message || "Impossible de recharger la flotte.");
  }
}

function downloadFile(filename, content, type) {
  const blob = new Blob([content], { type });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

function isCurrentRental(rental) {
  const today = new Date();
  const start = parseDate(rental.startDate);
  const end = parseDate(rental.endDate);
  return start <= today && end >= today && ["reserved", "rented", "late"].includes(rental.status);
}

function exportCurrentRentalsRecap() {
  const currentRentals = state.data.rentals
    .filter(isCurrentRental)
    .sort((a, b) => parseDate(a.endDate) - parseDate(b.endDate));
  const generatedAt = formatDate(new Date(), { day: "2-digit", month: "long", year: "numeric" });

  const rows = currentRentals.length
    ? currentRentals
        .map(
          (rental) => `
            <tr>
              <td><strong>${escapeHtml(rental.customerName)}</strong><br><span>${escapeHtml(rental.phone)}</span><br><span>${escapeHtml(rental.email)}</span></td>
              <td>${escapeHtml(vehicleName(rental.vehicleId))}</td>
              <td>${escapeHtml(formatDate(rental.startDate))}</td>
              <td>${escapeHtml(formatDate(rental.endDate))}</td>
              <td>${escapeHtml(rental.rate)}</td>
              <td>${escapeHtml(statusLabel(rental.status))}</td>
              <td>${escapeHtml(rental.paymentStatus)}</td>
              <td>${rental.depositPaid ? "Oui" : "Non"}</td>
              <td>${rental.documentsReceived ? "Oui" : "Non"}</td>
              <td>${escapeHtml(rental.comments || "")}</td>
            </tr>
          `
        )
        .join("")
    : `<tr><td colspan="10">Aucune location en cours a la date du ${escapeHtml(generatedAt)}.</td></tr>`;

  const html = `<!doctype html>
<html lang="fr">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Recap locations en cours - Nemaucar</title>
    <style>
      body { margin: 0; color: #272625; background: #ffffff; font-family: "Segoe UI", Arial, sans-serif; }
      main { padding: 28px; }
      header { display: flex; justify-content: space-between; gap: 24px; align-items: flex-start; margin-bottom: 22px; border-bottom: 3px solid #93cfa2; padding-bottom: 18px; }
      h1 { margin: 0 0 6px; font-size: 26px; }
      p { margin: 0; color: #6e6a68; }
      .badge { display: inline-block; padding: 8px 12px; border-radius: 8px; background: #f4f8f3; font-weight: 800; }
      table { width: 100%; border-collapse: collapse; font-size: 13px; }
      th, td { padding: 10px; text-align: left; vertical-align: top; border-bottom: 1px solid #e2e8e1; }
      th { color: #6e6a68; text-transform: uppercase; font-size: 11px; }
      span { color: #6e6a68; }
    </style>
  </head>
  <body>
    <main>
      <header>
        <div>
          <h1>Recapitulatif des locations en cours</h1>
          <p>Nemaucar - genere le ${escapeHtml(generatedAt)}</p>
        </div>
        <div class="badge">${currentRentals.length} location${currentRentals.length > 1 ? "s" : ""} en cours</div>
      </header>
      <table>
        <thead>
          <tr>
            <th>Client</th>
            <th>Vehicule</th>
            <th>Debut</th>
            <th>Fin prevue</th>
            <th>Tarif</th>
            <th>Statut</th>
            <th>Paiement</th>
            <th>Caution</th>
            <th>Docs</th>
            <th>Commentaires</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </main>
  </body>
</html>`;

  downloadFile(`recap-locations-en-cours-nemaucar-${toInputDate(new Date())}.html`, html, "text/html");
}

function bindEvents() {
  elements.navItems.forEach((item) => {
    item.addEventListener("click", () => {
      state.currentView = item.dataset.view;
      renderNavigation();
    });
  });

  elements.loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    elements.loginMessage.textContent = "";
    elements.loginButton.disabled = true;

    try {
      const password = new FormData(elements.loginForm).get("password");
      await login(password);
      setBodyState("loading");
      await loadAppData();
      setBodyState("app");
      render();
    } catch (error) {
      setBodyState("auth");
      elements.loginMessage.textContent = error.message || "Connexion impossible.";
    } finally {
      elements.loginButton.disabled = false;
    }
  });

  document.querySelector("#logoutButton").addEventListener("click", async () => {
    await logout();
  });

  document.querySelector("#addVehicleButton").addEventListener("click", () => openVehicleModal());
  document.querySelector("#addRentalButton").addEventListener("click", () => openRentalModal());
  elements.resetFleetButton.addEventListener("click", resetFleet);
  document.querySelector("#saveVehicle").addEventListener("click", saveVehicle);
  document.querySelector("#saveRental").addEventListener("click", saveRental);
  document.querySelector("#deleteRental").addEventListener("click", deleteCurrentRental);
  document.querySelector("#todayButton").addEventListener("click", () => {
    state.focusDate = new Date();
    renderCalendar();
  });

  document.querySelectorAll("[data-calendar-mode]").forEach((button) => {
    button.addEventListener("click", () => {
      state.calendarMode = button.dataset.calendarMode;
      document.querySelectorAll("[data-calendar-mode]").forEach((item) => item.classList.toggle("active", item === button));
      renderCalendar();
    });
  });

  document.querySelector("#previousPeriod").addEventListener("click", () => {
    state.focusDate = addDays(state.focusDate, state.calendarMode === "week" ? -7 : -31);
    renderCalendar();
  });

  document.querySelector("#nextPeriod").addEventListener("click", () => {
    state.focusDate = addDays(state.focusDate, state.calendarMode === "week" ? 7 : 31);
    renderCalendar();
  });

  document.body.addEventListener("click", (event) => {
    const rentalButton = event.target.closest("[data-edit-rental]");
    const vehicleButton = event.target.closest("[data-edit-vehicle]");
    if (rentalButton) openRentalModal(rentalButton.dataset.editRental);
    if (vehicleButton) openVehicleModal(vehicleButton.dataset.editVehicle);
  });

  document.querySelector("#exportData").addEventListener("click", () => {
    downloadFile(`planning-nemaucar-${toInputDate(new Date())}.json`, JSON.stringify(state.data, null, 2), "application/json");
  });

  document.querySelector("#exportCurrentRentals").addEventListener("click", exportCurrentRentalsRecap);

  document.querySelector("#importData").addEventListener("change", async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const imported = JSON.parse(await file.text());
      normalizeStateData(imported);
      await persistData();
      render();
    } catch (error) {
      alert(error.message || "Import impossible.");
    } finally {
      event.target.value = "";
    }
  });
}

async function init() {
  bindEvents();
  setBodyState("loading");
  setSaveState("idle", "Preparation");
  await detectStorageMode();

  if (state.storageMode === "local") {
    loadLocalData();
    setSaveState("idle", "Mode local");
    setBodyState("auth");
    return;
  }

  try {
    const authenticated = await requireSession();
    if (!authenticated) {
      setBodyState("auth");
      return;
    }

    await loadAppData();
    setSaveState("idle", "Connecte");
    setBodyState("app");
    render();
  } catch {
    elements.loginMessage.textContent = "";
    setBodyState("auth");
  }
}

init();
