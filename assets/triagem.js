class TriageController {
  constructor(state, dom, callbacks, priorityLabels) {
    this.state = state;
    this.dom = dom;
    this.callbacks = callbacks;
    this.priorityLabels = priorityLabels;
  }

  init() {
    this.dom.triagePatient.addEventListener("change", () => this.selectPatient());
    ["bloodPressure", "temperature", "oxygen", "heartRate"].forEach((id) => {
      document.getElementById(id).addEventListener("input", () => this.renderVitalPreview());
    });
    this.dom.suggestRisk.addEventListener("click", () => this.suggestRisk());
    this.dom.triageForm.addEventListener("submit", (event) => this.handleSubmit(event));
    this.dom.clearTriageForm.addEventListener("click", () => this.reset());
  }

  selectPatient(id = this.dom.triagePatient.value) {
    if (id !== this.state.selectedPatientId) {
      this.dom.triageForm.reset();
      this.dom.riskSuggestion.textContent = "Sem sugestão";
      this.dom.triageMessage.textContent = "";
    }
    this.state.selectedPatientId = this.state.patients.some(p => p.id === id) ? id : "";
    this.renderPatientOptions(); this.renderPatientSummary(); this.renderVitalPreview();
  }
  parseBloodPressure(value) {
    const parts = String(value).trim().match(/^(\d{1,3})\s*\/\s*(\d{1,3})$/);
    if (!parts) return {systolic:NaN, diastolic:NaN};
    return {systolic:Number(parts[1]), diastolic:Number(parts[2])};
  }
  readVitals() {
    const read = id => document.getElementById(id).value.trim();
    const decimal = value => /^(?:\d+(?:[.,]\d+)?|[.,]\d+)$/.test(value) ? Number(value.replace(",", ".")) : NaN;
    const pressure = this.parseBloodPressure(read("bloodPressure"));
    const temperature = decimal(read("temperature")), oxygen = decimal(read("oxygen"));
    const heartRate = read("heartRate") ? decimal(read("heartRate")) : null;
    const symptoms = read("symptoms");
    let error = "";
    if (!Number.isFinite(pressure.systolic) || !Number.isFinite(pressure.diastolic) || pressure.systolic <= 0 || pressure.diastolic <= 0 || pressure.systolic <= pressure.diastolic) error = "Informe pressão válida no formato 120/80, com sistólica maior que diastólica.";
    else if (!Number.isFinite(temperature) || temperature <= 0) error = "Informe temperatura numérica positiva, com ponto ou vírgula.";
    else if (!Number.isFinite(oxygen) || oxygen < 0 || oxygen > 100) error = "Informe oxigenação entre 0 e 100%.";
    else if (heartRate !== null && (!Number.isInteger(heartRate) || heartRate <= 0)) error = "Informe frequência cardíaca inteira positiva ou deixe em branco.";
    else if (!symptoms) error = "Informe sintomas e observações.";
    return {pressure,temperature,oxygen,heartRate,symptoms,error};
  }
  normalizeClassification(value) {
    return value || "branco";
  }

  calculateSuggestion() {
    const {pressure, temperature, oxygen, symptoms: rawSymptoms, heartRate, error} = this.readVitals();
    if (error) return null;
    const symptoms = rawSymptoms.toLowerCase();
    let risk = "verde";
    if (oxygen < 90 || pressure.systolic >= 180 || temperature >= 38.5 || symptoms.includes("dor no peito") || symptoms.includes("convuls")) {
      risk = "vermelho";
    } else if (oxygen < 94 || pressure.systolic >= 160 || temperature >= 37.8 || heartRate > 120 || symptoms.includes("falta de ar")) {
      risk = "amarelo";
    } else if (symptoms.includes("receita") || symptoms.includes("atestado")) {
      risk = "branco";
    }
    return risk;
  }

  suggestRisk() {
    const vitals = this.readVitals();
    if (vitals.error) {
      this.callbacks.showMessage(this.dom.triageMessage, vitals.error);
      this.dom.riskSuggestion.textContent = "Dados inválidos";
      document.querySelectorAll('[name="classification"]').forEach(input => input.checked = false);
      return;
    }
    const risk = this.calculateSuggestion();
    const riskInput = document.querySelector(`[name="classification"][value="${risk}"]`);
    if (riskInput) {
      riskInput.checked = true;
    }
    this.dom.riskSuggestion.textContent = `Sugestão: ${this.priorityLabels[risk]}`;
  }

  handleSubmit(event) {
    event.preventDefault();
    const data = new FormData(this.dom.triageForm);
    const classification = data.get("classification");
    const vitals = this.readVitals();
    if (vitals.error) { this.callbacks.showMessage(this.dom.triageMessage, vitals.error); return; }
    if (!Object.hasOwn(this.priorityLabels, classification)) { this.callbacks.showMessage(this.dom.triageMessage, "Selecione uma classificação."); return; }
    if (!this.state.getSelectedPatient()) { this.callbacks.showMessage(this.dom.triageMessage, "Selecione um paciente válido."); return; }
    if (this.state.triages.some(item => item.patientId === this.state.selectedPatientId)) {
      this.callbacks.showMessage(this.dom.triageMessage, "Este paciente já está na fila. Não é possível duplicar a triagem."); return;
    }
    if (!this.state.selectedPatientId || !data.get("bloodPressure") || !data.get("temperature") || !data.get("oxygen") || !data.get("symptoms")) {
      this.callbacks.showMessage(this.dom.triageMessage, "Preencha todos os dados da triagem.");
      return;
    }
    this.state.triages.push({
      id: createRecordId(),
      patientId: this.state.selectedPatientId,
      bloodPressure: data.get("bloodPressure"),
      temperature: data.get("temperature"),
      oxygen: data.get("oxygen"),
      heartRate: data.get("heartRate"),
      symptoms: data.get("symptoms").trim(),
      classification,
      createdAt: new Date().toISOString(),
      time: new Date().toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit"
      })
    });
    if (!this.state.save()) { this.state.triages.pop(); return; }
    this.reset();
    this.callbacks.showMessage(this.dom.triageMessage, "Triagem registrada.");
    this.callbacks.renderAll();
  }

  reset() {
    this.dom.triageForm.reset();
    this.state.selectedPatientId = "";
    this.dom.riskSuggestion.textContent = "Sem sugestão";
    this.renderPatientOptions();
    this.renderPatientSummary();
    this.renderVitalPreview();
  }

  renderPatientOptions() {
    if (this.state.patients.length === 0) {
      this.dom.triagePatient.innerHTML = `<option value="">Nenhum paciente cadastrado</option>`;
      return;
    }
    this.dom.triagePatient.innerHTML = `<option value="">Selecionar paciente</option>` + this.state.patients.map((patient) => `
      <option value="${escapeHTML(patient.id)}">${escapeHTML(this.state.getPatientName(patient))} — ${escapeHTML(patient.id)}</option>
    `).join("");
    this.dom.triagePatient.value = this.state.selectedPatientId;
  }

  renderPatientSummary() {
    const patient = this.state.getSelectedPatient();
    if (!patient) {
      this.dom.patientSummary.innerHTML = `<div class="empty-state">Selecione um paciente para ver o resumo.</div>`;
      return;
    }
    this.dom.patientSummary.innerHTML = `
      <div class="summary-row"><span>Nome</span><strong>${escapeHTML(this.state.getPatientName(patient))}</strong></div>
      <div class="summary-row"><span>Idade</span><strong>${escapeHTML(patient.age)}</strong></div>
      <div class="summary-row"><span>Gênero</span><strong>${escapeHTML(patient.gender)}</strong></div>
      <div class="summary-row"><span>Convênio</span><strong>${escapeHTML(patient.insuranceName)}</strong></div>
      <div class="summary-row"><span>Plano</span><strong>${escapeHTML(patient.insurancePlan)}</strong></div>
    `;
  }

  renderVitalPreview() {
    const pressure = document.getElementById("bloodPressure").value || "--";
    const temperature = document.getElementById("temperature").value || "--";
    const oxygen = document.getElementById("oxygen").value || "--";
    const oxygenNumber = Number(oxygen);
    const oxygenClass = oxygenNumber < 90 ? "alert" : "";
    this.dom.vitalPreview.innerHTML = `
      <div class="vital-row"><span>Pressão</span><strong>${escapeHTML(pressure)}</strong></div>
      <div class="vital-row"><span>Temperatura</span><strong>${escapeHTML(temperature)} °C</strong></div>
      <div class="vital-row"><span>Oxigenação</span><strong class="${escapeHTML(oxygenClass)}">${escapeHTML(oxygen)}%</strong></div>
    `;
  }
}

window.TriageController = TriageController;
