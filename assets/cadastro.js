class PatientRegistration {
  constructor(state, dom, callbacks) {
    this.state = state;
    this.dom = dom;
    this.callbacks = callbacks;
  }

  init() {
    this.dom.patientForm.addEventListener("submit", (event) => this.handleSubmit(event));
    this.dom.clearPatientForm.addEventListener("click", () => this.reset());
    this.dom.patientSearch.addEventListener("input", () => this.render());
    this.dom.patientList.addEventListener("click", (event) => this.handleListClick(event));
  }

  handleSubmit(event) {
    event.preventDefault();
    const data = new FormData(this.dom.patientForm);
    const patient = {
      id: createRecordId(),
      firstName: data.get("firstName").trim(),
      lastName: data.get("lastName").trim(),
      age: data.get("age"),
      gender: data.get("gender"),
      address: data.get("address").trim(),
      insuranceName: data.get("insuranceName").trim(),
      insuranceCard: data.get("insuranceCard").trim(),
      insuranceValidUntil: data.get("insuranceValidUntil"),
      insurancePlan: data.get("insurancePlan"),
      createdAt: new Date().toISOString()
    };
    if (!patient.firstName || !patient.lastName || !patient.age || !patient.gender || !patient.address || !patient.insuranceName || !patient.insuranceCard) {
      this.callbacks.showMessage(this.dom.patientMessage, "Preencha os campos obrigatórios.");
      return;
    }
    if (!/^\d+$/.test(String(patient.age).trim()) || !Number.isInteger(Number(patient.age)) || Number(patient.age) < 0 || Number(patient.age) > 150) {
      this.callbacks.showMessage(this.dom.patientMessage, "Informe uma idade inteira entre 0 e 150."); return;
    }
    this.state.patients.push(patient);
    if (!this.state.save()) { this.state.patients.pop(); return; }
    this.callbacks.selectPatient(patient.id);
    this.state.selectedPatientId = patient.id;
    this.reset();
    this.callbacks.showMessage(this.dom.patientMessage, "Paciente cadastrado.");
    this.callbacks.renderAll();
  }

  handleListClick(event) {
    const selectButton = event.target.closest("[data-select-patient]");
    const deleteButton = event.target.closest("[data-delete-patient]");
    if (selectButton) {
      this.callbacks.selectPatient(selectButton.dataset.selectPatient);
      this.callbacks.setScreen("triagem");
      this.callbacks.renderAll();
    }
    if (deleteButton) {
      const id = deleteButton.dataset.deletePatient;
      if (!this.state.patients.some(patient => patient.id === id)) return;
      const previousPatients = this.state.patients;
      const previousTriages = this.state.triages;
      this.state.patients = previousPatients.filter(patient => patient.id !== id);
      this.state.triages = previousTriages.filter(triage => triage.patientId !== id);
      if (!this.state.save()) { this.state.patients = previousPatients; this.state.triages = previousTriages; return; }
      if (this.state.selectedPatientId === id) this.callbacks.selectPatient("");
      this.callbacks.renderAll();
    }
  }

  reset() {
    this.dom.patientForm.reset();
  }

  render() {
    const search = normalizeSearch(this.dom.patientSearch.value);
    const patients = this.state.patients.filter((patient) => normalizeSearch(this.state.getPatientName(patient)).includes(search));
    if (patients.length === 0) {
      this.dom.patientList.innerHTML = `<div class="empty-state">Nenhum paciente na recepção.</div>`;
      return;
    }
    this.dom.patientList.innerHTML = patients.map((patient, index) => `
      <article class="patient-card">
        <header>
          <div>
            <strong>${escapeHTML(this.state.getPatientName(patient))}</strong>
            <small>${escapeHTML(patient.age)} anos · ${escapeHTML(patient.gender)}</small>
          </div>
          <span class="tag">${escapeHTML(patient.insurancePlan)}</span>
        </header>
        <div class="meta-line">${escapeHTML(patient.address)}</div>
        <div class="meta-line">${escapeHTML(patient.insuranceName)} · ${escapeHTML(patient.insuranceCard)}</div>
        <div class="patient-actions">
          <button class="small-button" data-select-patient="${escapeHTML(patient.id)}" type="button">Triar</button>
          <button class="small-button danger-button" data-delete-patient="${escapeHTML(patient.id)}" type="button">Remover</button>
        </div>
      </article>
    `).join("");
  }
}

window.PatientRegistration = PatientRegistration;
