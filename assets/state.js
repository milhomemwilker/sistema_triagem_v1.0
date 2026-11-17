function createRecordId() {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 15) | 64; bytes[8] = (bytes[8] & 63) | 128;
  const hex = Array.from(bytes, b => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
}
// Escape all user-controlled values before HTML interpolation.
function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}
function normalizeSearch(value) { return String(value).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim(); }
class AppState {
  constructor(patientStorageKey, triageStorageKey) {
    this.patientStorageKey = patientStorageKey;
    this.triageStorageKey = triageStorageKey;
    this.snapshotKey = patientStorageKey + "_snapshot_v2";
    this.activeScreen = "cadastro";
    this.selectedPatientId = "";
    this.patients = []; this.triages = []; this.storageError = ""; this.storageBlocked = false;
    try {
      const snapshot = localStorage.getItem(this.snapshotKey);
      const data = snapshot ? JSON.parse(snapshot) : {
        patients: JSON.parse(localStorage.getItem(patientStorageKey) || "[]"),
        triages: JSON.parse(localStorage.getItem(triageStorageKey) || "[]")
      };
      if (!Array.isArray(data.patients) || !Array.isArray(data.triages) ||
          !data.patients.every(x => x && typeof x.id === "string" && typeof x.firstName === "string" && typeof x.lastName === "string") ||
          !data.triages.every(x => x && typeof x.id === "string" && typeof x.patientId === "string" && ["branco","verde","amarelo","vermelho"].includes(x.classification))) throw Error("Formato inválido");
      this.patients = data.patients; this.triages = data.triages;
    } catch (error) {
      this.storageBlocked = true;
      this.storageError = "Não foi possível carregar os dados salvos. Os originais foram preservados. Recupere o armazenamento antes de cadastrar ou alterar registros.";
    }
  }
  save() {
    if (this.storageBlocked) { window.alert(this.storageError); return false; }
    try {
      // One atomic write; original legacy keys remain available for recovery.
      localStorage.setItem(this.snapshotKey, JSON.stringify({patients:this.patients,triages:this.triages}));
      return true;
    } catch (error) { window.alert("Não foi possível salvar. A alteração foi cancelada; verifique o armazenamento do navegador."); return false; }
  }
  getPatientName(patient) { return `${patient.firstName} ${patient.lastName}`; }
  getSelectedPatient() { return this.patients.find(patient => patient.id === this.selectedPatientId); }
}
window.AppState = AppState;
