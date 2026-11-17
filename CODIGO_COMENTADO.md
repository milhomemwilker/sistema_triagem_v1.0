# Código corrigido comentado

Este documento contém os cinco arquivos JavaScript alterados, com comentários didáticos em português. O código executável fica em assets/. Os exemplos abaixo preservam seu comportamento.

Consulte o [relatório de bugs](RELATORIO_DE_BUGS.md) para causas, prioridades e resultados.

## Código completo corrigido com comentários didáticos

Os blocos a seguir incluem os cinco arquivos alterados. Os comentários explicam responsabilidades e decisões sem mudar o código executável. Os arquivos HTML e CSS foram preservados; a suíte de testes é explicada na seção seguinte.

### Código comentado de assets/state.js

```javascript
// Gera um identificador único. Usa randomUUID quando disponível e alternativa criptográfica quando ausente.
function createRecordId() {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  // Cria 16 bytes aleatórios sem recorrer a Math.random().
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  // Ajusta os bits da versão 4 e da variante do UUID.
  bytes[6] = (bytes[6] & 15) | 64; bytes[8] = (bytes[8] & 63) | 128;
  const hex = Array.from(bytes, b => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
}
// Codifica valores antes de interpolar em HTML.
// Codifica caracteres especiais em textos e atributos HTML entre aspas. Não usar como proteção universal para outros contextos.
function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}
// Normaliza acentos, caixa e espaços para comparar pesquisas e nomes completos.
function normalizeSearch(value) { return String(value).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim(); }
class AppState {
  // Inicializa listas e seleção; carrega snapshot ou formato antigo e bloqueia gravações quando os dados não podem ser interpretados.
  constructor(patientStorageKey, triageStorageKey) {
    this.patientStorageKey = patientStorageKey;
    this.triageStorageKey = triageStorageKey;
    this.snapshotKey = patientStorageKey + "_snapshot_v2";
    this.activeScreen = "cadastro";
    this.selectedPatientId = "";
    this.patients = []; this.triages = []; this.storageError = ""; this.storageBlocked = false;
    try {
      // Lê primeiro o formato corrigido; as chaves antigas são usadas somente se ele não existir.
      const snapshot = localStorage.getItem(this.snapshotKey);
      const data = snapshot ? JSON.parse(snapshot) : {
        patients: JSON.parse(localStorage.getItem(patientStorageKey) || "[]"),
        triages: JSON.parse(localStorage.getItem(triageStorageKey) || "[]")
      };
      // Além do JSON válido, exige listas e campos essenciais no formato esperado.
      if (!Array.isArray(data.patients) || !Array.isArray(data.triages) ||
          !data.patients.every(x => x && typeof x.id === "string" && typeof x.firstName === "string" && typeof x.lastName === "string") ||
          !data.triages.every(x => x && typeof x.id === "string" && typeof x.patientId === "string" && ["branco","verde","amarelo","vermelho"].includes(x.classification))) throw Error("Formato inválido");
      this.patients = data.patients; this.triages = data.triages;
    } catch (error) {
      // Evita sobrescrever o conteúdo original após falha de leitura.
      this.storageBlocked = true;
      this.storageError = "Não foi possível carregar os dados salvos. Os originais foram preservados. Recupere o armazenamento antes de cadastrar ou alterar registros.";
    }
  }
  // Retorna true somente após salvar as duas listas juntas. Retorna false se bloqueado ou se o armazenamento falhar.
  save() {
    if (this.storageBlocked) { window.alert(this.storageError); return false; }
    try {
      // Gravação única; chaves legadas permanecem disponíveis para recuperação.
      // Grava um único JSON com as duas listas; as chaves antigas continuam preservadas.
      localStorage.setItem(this.snapshotKey, JSON.stringify({patients:this.patients,triages:this.triages}));
      return true;
    } catch (error) { window.alert("Não foi possível salvar. A alteração foi cancelada; verifique o armazenamento do navegador."); return false; }
  }
  // Monta o nome completo a partir de nome e sobrenome.
  getPatientName(patient) { return `${patient.firstName} ${patient.lastName}`; }
  // Busca o objeto do paciente pelo ID selecionado; retorna undefined quando não existe.
  getSelectedPatient() { return this.patients.find(patient => patient.id === this.selectedPatientId); }
}
window.AppState = AppState;
```

### Código comentado de assets/cadastro.js

```javascript
class PatientRegistration {
  // Recebe o estado compartilhado, os elementos da interface e as funções de comunicação com a aplicação.
  constructor(state, dom, callbacks) {
    this.state = state;
    this.dom = dom;
    this.callbacks = callbacks;
  }

  // Conecta envio, limpeza, pesquisa e cliques nos cartões aos métodos do controlador.
  init() {
    this.dom.patientForm.addEventListener("submit", (event) => this.handleSubmit(event));
    this.dom.clearPatientForm.addEventListener("click", () => this.reset());
    this.dom.patientSearch.addEventListener("input", () => this.render());
    this.dom.patientList.addEventListener("click", (event) => this.handleListClick(event));
  }

  // Lê o formulário, valida campos e idade, cria o registro e salva. Só limpa o formulário após sucesso.
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
      // Armazena data e hora completas, adequadas ao desempate e independentes da apresentação local.
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

  // Distingue Triar de Remover usando delegação de eventos. Seleção e exclusão utilizam IDs únicos.
  handleListClick(event) {
    const selectButton = event.target.closest("[data-select-patient]");
    const deleteButton = event.target.closest("[data-delete-patient]");
    if (selectButton) {
      this.callbacks.selectPatient(selectButton.dataset.selectPatient);
      this.callbacks.setScreen("triagem");
      this.callbacks.renderAll();
    }
    if (deleteButton) {
      // O botão contém o ID do paciente, não o índice do resultado filtrado.
      const id = deleteButton.dataset.deletePatient;
      if (!this.state.patients.some(patient => patient.id === id)) return;
      // Guarda as listas anteriores para restaurá-las se a persistência falhar.
      const previousPatients = this.state.patients;
      const previousTriages = this.state.triages;
      this.state.patients = previousPatients.filter(patient => patient.id !== id);
      this.state.triages = previousTriages.filter(triage => triage.patientId !== id);
      if (!this.state.save()) { this.state.patients = previousPatients; this.state.triages = previousTriages; return; }
      if (this.state.selectedPatientId === id) this.callbacks.selectPatient("");
      this.callbacks.renderAll();
    }
  }

  // Restaura os valores iniciais do formulário de cadastro; não apaga pacientes salvos.
  reset() {
    this.dom.patientForm.reset();
  }

  // Filtra pelo nome completo normalizado e monta os cartões com interpolação codificada para HTML.
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
```

### Código comentado de assets/triagem.js

```javascript
class TriageController {
  // Recebe estado, interface, callbacks e nomes permitidos das classificações.
  constructor(state, dom, callbacks, priorityLabels) {
    this.state = state;
    this.dom = dom;
    this.callbacks = callbacks;
    this.priorityLabels = priorityLabels;
  }

  // Conecta seleção de paciente, sinais vitais, sugestão, envio e limpeza aos respectivos métodos.
  init() {
    this.dom.triagePatient.addEventListener("change", () => this.selectPatient());
    ["bloodPressure", "temperature", "oxygen", "heartRate"].forEach((id) => {
      document.getElementById(id).addEventListener("input", () => this.renderVitalPreview());
    });
    this.dom.suggestRisk.addEventListener("click", () => this.suggestRisk());
    this.dom.triageForm.addEventListener("submit", (event) => this.handleSubmit(event));
    this.dom.clearTriageForm.addEventListener("click", () => this.reset());
  }

  // Ao mudar de paciente, limpa os dados anteriores. Valida o novo ID e atualiza seleção, resumo e prévia.
  selectPatient(id = this.dom.triagePatient.value) {
    if (id !== this.state.selectedPatientId) {
      this.dom.triageForm.reset();
      this.dom.riskSuggestion.textContent = "Sem sugestão";
      this.dom.triageMessage.textContent = "";
    }
    this.state.selectedPatientId = this.state.patients.some(p => p.id === id) ? id : "";
    this.renderPatientOptions(); this.renderPatientSummary(); this.renderVitalPreview();
  }
  // Valida a sintaxe de pressão com barra; retorna NaN para campos que não possam ser interpretados.
  parseBloodPressure(value) {
    // A expressão regular exige dois grupos numéricos separados por barra e aceita espaços ao redor dela.
    const parts = String(value).trim().match(/^(\d{1,3})\s*\/\s*(\d{1,3})$/);
    if (!parts) return {systolic:NaN, diastolic:NaN};
    return {systolic:Number(parts[1]), diastolic:Number(parts[2])};
  }
  // Centraliza leitura e validação: pressão, decimais, oxigenação, frequência opcional e sintomas. Retorna dados e mensagem de erro.
  readVitals() {
    const read = id => document.getElementById(id).value.trim();
    // Valida todo o texto antes da conversão: não aceita sufixos como 38abc.
    const decimal = value => /^(?:\d+(?:[.,]\d+)?|[.,]\d+)$/.test(value) ? Number(value.replace(",", ".")) : NaN;
    const pressure = this.parseBloodPressure(read("bloodPressure"));
    const temperature = decimal(read("temperature")), oxygen = decimal(read("oxygen"));
    // Campo opcional: vazio vira null em vez de zero.
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
  // Método legado preservado, mas não chamado pelo envio corrigido. O novo envio exige classificação explícita válida.
  normalizeClassification(value) {
    return value || "branco";
  }

  // Calcula somente após validação. Retorna null em erro; conserva os limites de classificação já existentes no projeto.
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

  // Mostra erro e limpa a classificação quando os dados são inválidos; caso contrário, seleciona a opção sugerida.
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

  // Valida dados, classificação e paciente; bloqueia duplicação ativa; inclui data completa e desfaz a inclusão se save falhar.
  handleSubmit(event) {
    event.preventDefault();
    const data = new FormData(this.dom.triageForm);
    const classification = data.get("classification");
    const vitals = this.readVitals();
    if (vitals.error) { this.callbacks.showMessage(this.dom.triageMessage, vitals.error); return; }
    // Só aceita classificações presentes no conjunto de rótulos; não atribui branco silenciosamente.
    if (!Object.hasOwn(this.priorityLabels, classification)) { this.callbacks.showMessage(this.dom.triageMessage, "Selecione uma classificação."); return; }
    if (!this.state.getSelectedPatient()) { this.callbacks.showMessage(this.dom.triageMessage, "Selecione um paciente válido."); return; }
    // Impede que o mesmo paciente apareça duas vezes na fila ativa.
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
      // Armazena data e hora completas, adequadas ao desempate e independentes da apresentação local.
      createdAt: new Date().toISOString(),
      time: new Date().toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit"
      })
    });
    // Remove a entrada recém-criada da memória se a gravação não ocorrer.
    if (!this.state.save()) { this.state.triages.pop(); return; }
    this.reset();
    this.callbacks.showMessage(this.dom.triageMessage, "Triagem registrada.");
    this.callbacks.renderAll();
  }

  // Limpa formulário e seleção atual. Atualiza as opções, o resumo e a prévia sem excluir registros existentes.
  reset() {
    this.dom.triageForm.reset();
    this.state.selectedPatientId = "";
    this.dom.riskSuggestion.textContent = "Sem sugestão";
    this.renderPatientOptions();
    this.renderPatientSummary();
    this.renderVitalPreview();
  }

  // Exibe nome completo e ID, com codificação de HTML para impedir interpretação de marcação digitada.
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

  // Exibe os dados do paciente selecionado. Na ausência de seleção válida, mostra orientação em vez de um resumo antigo.
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

  // Atualiza a prévia dos campos e destaque de oxigenação. A validação autoritativa permanece em readVitals().
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
```

### Código comentado de assets/fila.js

```javascript
class QueueController {
  // Recebe os dados compartilhados, elementos da fila, rótulos e cores conhecidos e callback de atualização.
  constructor(state, dom, priorityLabels, priorityColor, callbacks) {
    this.state = state;
    this.dom = dom;
    this.priorityLabels = priorityLabels;
    this.priorityColor = priorityColor;
    this.callbacks = callbacks;
  }

  // Associa o botão Chamar próximo ao método de chamada.
  init() {
    this.dom.callNext.addEventListener("click", () => this.callNext());
  }

  // Retorna outra lista ordenada: prioridade primeiro; data completa depois; índice original como alternativa para registros antigos.
  orderedTriages() {
    const priorities = {vermelho:0, amarelo:1, verde:2, branco:3};
    return this.state.triages.map((item,index) => ({item,index})).sort((a,b) => {
      // Compara primeiro o peso de cada classificação; desconhecidos ficam depois dos valores conhecidos.
      const priority = (priorities[a.item.classification] ?? 4) - (priorities[b.item.classification] ?? 4);
      if (priority) return priority;
      // Converte timestamps para números; datas antigas ausentes serão tratadas pelo índice original.
      const ta = Date.parse(a.item.createdAt), tb = Date.parse(b.item.createdAt);
      return Number.isFinite(ta) && Number.isFinite(tb) ? ta-tb || a.index-b.index : a.index-b.index;
    }).map(entry => entry.item);
  }
  // Escolhe o primeiro da ordem calculada, retira da fila e salva; restaura o estado em falha. Não cria histórico de atendimento.
  callNext() {
    if (this.state.triages.length === 0) {
      return;
    }
    const called = this.orderedTriages()[0];
    // Mantém a referência original da fila para poder restaurá-la.
    const previous = this.state.triages;
    this.state.triages = previous.filter(item => item.id !== called.id);
    // Cancela a chamada em caso de falha; o paciente permanece aguardando.
    if (!this.state.save()) { this.state.triages = previous; return; }
    const patient = this.state.patients.find((item) => item.id === called.patientId);
    window.alert(`${patient ? this.state.getPatientName(patient) : "Paciente"} encaminhado para atendimento.`);
    this.callbacks.renderAll();
  }

  // Usa a mesma ordenação da chamada e codifica valores dinâmicos na montagem dos cartões.
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
```

### Código comentado de assets/app.js

```javascript
const patientStorageKey = "ps_escola_pacientes";
const triageStorageKey = "ps_escola_triagens";

const screenTitles = {
  cadastro: "Cadastro de paciente",
  triagem: "Determinação de triagem",
  fila: "Fila do pronto socorro"
};

const priorityLabels = {
  branco: "Branco",
  verde: "Verde",
  amarelo: "Amarelo",
  vermelho: "Vermelho"
};

const priorityColor = {
  branco: "#dbeafe",
  verde: "#51b56d",
  amarelo: "#f0b83c",
  vermelho: "#d94444"
};

class NavigationController {
  // Recebe referências do estado e dos elementos usados por este controlador.
  constructor(state, dom) {
    this.state = state;
    this.dom = dom;
  }

  // Inicializa os recursos do controlador correspondente. Na aplicação principal, inicia todos e apresenta erros de armazenamento.
  init() {
    this.dom.navTabs.forEach((tab) => {
      tab.addEventListener("click", () => this.setScreen(tab.dataset.screen));
    });
  }

  // Atualiza título e classes active para exibir a tela escolhida.
  setScreen(screen) {
    this.state.activeScreen = screen;
    this.dom.screenTitle.textContent = screenTitles[screen];
    this.dom.navTabs.forEach((tab) => {
      tab.classList.toggle("active", tab.dataset.screen === screen);
    });
    this.dom.screens.forEach((section) => {
      section.classList.toggle("active", section.id === screen);
    });
  }
}

class DashboardController {
  // Recebe referências do estado e dos elementos usados por este controlador.
  constructor(state, dom) {
    this.state = state;
    this.dom = dom;
  }

  // Inicializa os recursos do controlador correspondente. Na aplicação principal, inicia todos e apresenta erros de armazenamento.
  init() {
    this.updateClock();
    window.setInterval(() => this.updateClock(), 30000);
  }

  // Formata o relógio para pt-BR com hora e minuto.
  updateClock() {
    const now = new Date();
    this.dom.shiftClock.textContent = now.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  // Atualiza quantidades de cadastros, triagens ativas e classificações vermelhas.
  renderCounters() {
    this.dom.patientCount.textContent = this.state.patients.length;
    this.dom.waitingCount.textContent = this.state.triages.length;
    this.dom.criticalCount.textContent = this.state.triages.filter((item) => item.classification === "vermelho").length;
  }
}

class TriageApp {
  // Monta os controladores e seus callbacks. O callback de seleção só é executado após a inicialização dos objetos.
  constructor() {
    this.state = new AppState(patientStorageKey, triageStorageKey);
    this.dom = this.createDomMap();
    this.navigation = new NavigationController(this.state, this.dom);
    this.dashboard = new DashboardController(this.state, this.dom);
    this.registration = new PatientRegistration(this.state, this.dom, {
      showMessage: (target, message) => this.showMessage(target, message),
      renderAll: () => this.renderAll(),
      // Encaminha seleção da recepção para a função que também limpa os dados da triagem.
      selectPatient: (id) => this.triage.selectPatient(id),
      setScreen: (screen) => this.navigation.setScreen(screen)
    });
    this.triage = new TriageController(this.state, this.dom, {
      showMessage: (target, message) => this.showMessage(target, message),
      renderAll: () => this.renderAll()
    }, priorityLabels);
    this.queue = new QueueController(this.state, this.dom, priorityLabels, priorityColor, {
      renderAll: () => this.renderAll()
    });
  }

  // Agrupa referências dos elementos HTML para evitar buscas espalhadas por toda a aplicação.
  createDomMap() {
    return {
      screenTitle: document.getElementById("screenTitle"),
      navTabs: document.querySelectorAll(".nav-tab"),
      screens: document.querySelectorAll(".screen"),
      shiftClock: document.getElementById("shiftClock"),
      patientForm: document.getElementById("patientForm"),
      clearPatientForm: document.getElementById("clearPatientForm"),
      patientMessage: document.getElementById("patientMessage"),
      patientSearch: document.getElementById("patientSearch"),
      patientList: document.getElementById("patientList"),
      triageForm: document.getElementById("triageForm"),
      clearTriageForm: document.getElementById("clearTriageForm"),
      triageMessage: document.getElementById("triageMessage"),
      triagePatient: document.getElementById("triagePatient"),
      patientSummary: document.getElementById("patientSummary"),
      vitalPreview: document.getElementById("vitalPreview"),
      suggestRisk: document.getElementById("suggestRisk"),
      riskSuggestion: document.getElementById("riskSuggestion"),
      queueBoard: document.getElementById("queueBoard"),
      callNext: document.getElementById("callNext"),
      patientCount: document.getElementById("patientCount"),
      criticalCount: document.getElementById("criticalCount"),
      waitingCount: document.getElementById("waitingCount")
    };
  }

  // Inicializa os recursos do controlador correspondente. Na aplicação principal, inicia todos e apresenta erros de armazenamento.
  init() {
    this.navigation.init();
    this.dashboard.init();
    this.registration.init();
    this.triage.init();
    this.queue.init();
    this.renderAll();
    if (this.state.storageError) this.showMessage(this.dom.patientMessage, this.state.storageError);
  }

  // Exibe mensagens com textContent; removeu-se o temporizador que apagava o texto após 2,8 segundos.
  showMessage(target, message) {
    target.textContent = message;
    // A mensagem fica visível até ser substituída ou limpa pelas ações previstas.
  }

  // Atualiza indicadores, recepção, seleção, resumo, prévia dos sinais e fila a partir do estado atual.
  renderAll() {
    this.dashboard.renderCounters();
    this.registration.render();
    this.triage.renderPatientOptions();
    this.triage.renderPatientSummary();
    this.triage.renderVitalPreview();
    this.queue.render();
  }
}

const app = new TriageApp();
app.init();
```
