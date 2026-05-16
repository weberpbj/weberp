// ═══════════════════════════════════════════════════════════════════
// weberp-bj | api.js | Svi pozivi prema Apps Script API
// ═══════════════════════════════════════════════════════════════════

const API = {
  // ── Interni helper ────────────────────────────────────────────────
  async call(action, payload) {
    const token = sessionStorage.getItem('weberp_token');
    try {
      const res = await fetch(WEBERP_CONFIG.API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, payload, token })
      });
      const data = await res.json();
      if (!data.ok && data.error === 'Sesija istekla. Prijavite se ponovo.') {
        AUTH.odjava();
      }
      return data;
    } catch (e) {
      console.error('API error:', e);
      return { ok: false, error: 'Greška veze. Provjerite internet.' };
    }
  },

  // ── Auth ──────────────────────────────────────────────────────────
  async login(username, password) { return this.call('login', { username, password }); },
  async logout()                  { return this.call('logout', {}); },
  async getMe()                   { return this.call('getMe', {}); },
  async promijeniLozinku(stara, nova) { return this.call('promijeniLozinku', { staraLozinka: stara, novaLozinka: nova }); },

  // ── Narudžbe ──────────────────────────────────────────────────────
  async getNarudzbe(filter)       { return this.call('getNarudzbe', filter || {}); },
  async addNarudzba(data)         { return this.call('addNarudzba', data); },
  async updateNarudzba(data)      { return this.call('updateNarudzba', data); },
  async deleteNarudzba(id)        { return this.call('deleteNarudzba', { id }); },

  // ── Vozač ─────────────────────────────────────────────────────────
  async vozacPreuzimanje(id)      { return this.call('vozacPreuzimanje', { id }); },
  async vozacIstovar(id, napomena, foto_url) { return this.call('vozacIstovar', { id, napomena, foto_url }); },
  async vozacProblem(id, opis, foto_url)     { return this.call('vozacProblem', { id, opis, foto_url }); },

  // ── Alarmi ────────────────────────────────────────────────────────
  async getAlarmi(status)         { return this.call('getAlarmi', { status }); },
  async resolveAlarm(id, napomena){ return this.call('resolveAlarm', { id, napomena }); },

  // ── Proizvodnja ───────────────────────────────────────────────────
  async getPlan(tjedan)           { return this.call('getPlan', { tjedan }); },
  async addPlan(data)             { return this.call('addPlan', data); },
  async updatePlan(data)          { return this.call('updatePlan', data); },
  async getStvarno(tjedan)        { return this.call('getStvarno', { tjedan }); },
  async addStvarno(data)          { return this.call('addStvarno', data); },

  // ── Plan prodaje ──────────────────────────────────────────────────
  async getPlanProdaje()          { return this.call('getPlanProdaje', {}); },
  async addPlanProdaje(data)      { return this.call('addPlanProdaje', data); },

  // ── Matični ───────────────────────────────────────────────────────
  async getMaticni()              { return this.call('getMaticni', {}); },
  async addArtikal(data)          { return this.call('addArtikal', data); },
  async updateArtikal(data)       { return this.call('updateArtikal', data); },
  async arhivirajArtikal(id, datum_do) { return this.call('arhivirajArtikal', { id, datum_do }); },

  // ── Šifarnici ─────────────────────────────────────────────────────
  async getSifrarnici()           { return this.call('getSifrarnici', {}); },

  // ── Dashboard i kalendar ──────────────────────────────────────────
  async getDashboard()            { return this.call('getDashboard', {}); },
  async getKalendar(godina, mjesec) { return this.call('getKalendar', { godina, mjesec }); },

  // ── Korisnici ─────────────────────────────────────────────────────
  async getKorisnici()            { return this.call('getKorisnici', {}); },
  async addKorisnik(data)         { return this.call('addKorisnik', data); },
  async updateKorisnik(data)      { return this.call('updateKorisnik', data); },
  async toggleKorisnik(id)        { return this.call('toggleKorisnik', { id }); },
};
