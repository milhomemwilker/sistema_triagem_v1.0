class QueueController {
  constructor(state, dom, priorityLabels, priorityColor, callbacks) {
    this.state = state;
    this.dom = dom;
    this.priorityLabels = priorityLabels;
    this.priorityColor = priorityColor;
    this.callbacks = callbacks;
  }

  init() {
    this.dom.callNext.addEventListener("click", () => this.callNext());
  }

  orderedTriages() {
    const priorities = {vermelho:0, amarelo:1, verde:2, branco:3};
    return this.state.triages.map((item,index) => ({item,index})).sort((a,b) => {
      const priority = (priorities[a.item.classification] ?? 4) - (priorities[b.item.classification] ?? 4);
      if (priority) return priority;
      const ta = Date.parse(a.item.createdAt), tb = Date.parse(b.item.createdAt);
      return Number.isFinite(ta) && Number.isFinite(tb) ? ta-tb || a.index-b.index : a.index-b.index;
    }).map(entry => entry.item);
  }
  callNext() {
    if (this.state.triages.length === 0) {
      return;
    }
    const called = this.orderedTriages()[0];
    const previous = this.state.triages;
    this.state.triages = previous.filter(item => item.id !== called.id);
    if (!this.state.save()) { this.state.triages = previous; return; }
    const patient = this.state.patients.find((item) => item.id === called.patientId);
    window.alert(`${patient ? this.state.getPatientName(patient) : "Paciente"} encaminhado para atendimento.`);
    this.callbacks.renderAll();
  }

  render() {
    if (this.state.triages.length === 0) {
      this.dom.queueBoard.innerHTML = `<div class="empty-state">Nenhum paciente aguardando atendimento.</div>`;
      return;
    }
    this.dom.queueBoard.innerHTML = this.orderedTriages().map((triage) => {
      const patient = this.state.patients.find((item) => item.id === triage.patientId);
      const patientName = patient ? this.state.getPatientName(patient) : "Paciente não encontrado";
      return `
        <article class="queue-card">
          <div class="risk-bar" style="background:${escapeHTML(this.priorityColor[triage.classification])}"></div>
          <div class="queue-body">
            <header>
              <div>
                <strong>${escapeHTML(patientName)}</strong>
                <small>Entrada ${escapeHTML(triage.time)}</small>
              </div>
              <span class="tag ${escapeHTML(triage.classification)}">${escapeHTML(this.priorityLabels[triage.classification])}</span>
            </header>
            <div class="tag-row">
              <span class="tag">PA ${escapeHTML(triage.bloodPressure)}</span>
              <span class="tag">Temp ${escapeHTML(triage.temperature)} °C</span>
              <span class="tag">SpO2 ${escapeHTML(triage.oxygen)}%</span>
            </div>
            <p class="meta-line">${escapeHTML(triage.symptoms)}</p>
          </div>
        </article>
      `;
    }).join("");
  }
}

window.QueueController = QueueController;
