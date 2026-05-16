// ═══════════════════════════════════════════════════════════════════
// weberp-bj | api.js v1.1 | JSONP podrška za sve pozive
// ═══════════════════════════════════════════════════════════════════

const API_URL = 'https://script.google.com/macros/s/AKfycbxh6R-agYICMnbGuDcyA4eFU7OKIizFXXuVDg32BI_uzf5wuedqcFxQnTzXWUb4N7Fkmw/exec';

const API = {

  // ── Interni JSONP poziv ─────────────────────────────────────────
  call(action, payload) {
    return new Promise((resolve, reject) => {
      const token = sessionStorage.getItem('weberp_token');
      const cbName = 'wbcb_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
      const script = document.createElement('script');

      const timer = setTimeout(() => {
        cleanup();
        reject(new Error('Timeout — server ne odgovara.'));
      }, 20000);

      window[cbName] = function(data) {
        cleanup();
        clearTimeout(timer);
        if (!data.ok && data.error === 'Sesija istekla. Prijavite se ponovo.') {
          sessionStorage.clear();
          window.location.href = 'index.html';
          return;
        }
        resolve(data);
      };

      function cleanup() {
        if (script.parentNode) script.parentNode.removeChild(script);
        delete window[cbName];
      }

      script.onerror = function() {
        cleanup();
        clearTimeout(timer);
        reject(new Error('Greška veze. Provjerite internet.'));
      };

      // Enkodiramo payload kao JSON string u URL parametru
      const params = new URLSearchParams({
        action:   action,
        payload:  JSON.stringify(payload || {}),
        token:    token || '',
        callback: cbName
      });

      script.src = API_URL + '?' + params.toString();
      document.body.appendChild(script);
    });
  },

  // ── Auth ──────────────────────────────────────────────────────
  async login(username, password) { return this.call('login', { username, password }); },
  async logout()                  { return this.call('logout', {}); },
  async getMe()                   { return this.call('getMe', {}); },
  async promijeniLozinku(stara, nova) {
    return this.call('promijeniLozinku', { staraLozinka: stara, novaLozinka: nova });
  },

  // ── Narudžbe ──────────────────────────────────────────────────
  async getNarudzbe(filter)  { return this.call('getNarudzbe', filter || {}); },
  async addNarudzba(data)    { return this.call('addNarudzba', data); },
  async updateNarudzba(data) { return this.call('updateNarudzba', data); },
  async deleteNarudzba(id)   { return this.call('deleteNarudzba', { id }); },

  // ── Vozač ─────────────────────────────────────────────────────
  async vozacPreuzimanje(id) { return this.call('vozacPreuzimanje', { id }); },
  async vozacIstovar(id, napomena, foto_url) {
    return this.call('vozacIstovar', { id, napomena, foto_url });
  },
  async vozacProblem(id, opis, foto_url) {
    return this.call('vozacProblem', { id, opis, foto_url });
  },

  // ── Alarmi ────────────────────────────────────────────────────
  async getAlarmi(status)          { return this.call('getAlarmi', { status }); },
  async resolveAlarm(id, napomena) { return this.call('resolveAlarm', { id, napomena }); },

  // ── Proizvodnja ───────────────────────────────────────────────
  async getPlan(tjedan)    { return this.call('getPlan', { tjedan }); },
  async addPlan(data)      { return this.call('addPlan', data); },
  async updatePlan(data)   { return this.call('updatePlan', data); },
  async getStvarno(tjedan) { return this.call('getStvarno', { tjedan }); },
  async addStvarno(data)   { return this.call('addStvarno', data); },

  // ── Plan prodaje ──────────────────────────────────────────────
  async getPlanProdaje()      { return this.call('getPlanProdaje', {}); },
  async addPlanProdaje(data)  { return this.call('addPlanProdaje', data); },

  // ── Matični ───────────────────────────────────────────────────
  async getMaticni()                   { return this.call('getMaticni', {}); },
  async addArtikal(data)               { return this.call('addArtikal', data); },
  async updateArtikal(data)            { return this.call('updateArtikal', data); },
  async arhivirajArtikal(id, datum_do) {
    return this.call('arhivirajArtikal', { id, datum_do });
  },

  // ── Šifarnici ─────────────────────────────────────────────────
  async getSifrarnici() { return this.call('getSifrarnici', {}); },

  // ── Dashboard i kalendar ──────────────────────────────────────
  async getDashboard()                  { return this.call('getDashboard', {}); },
  async getKalendar(godina, mjesec)     { return this.call('getKalendar', { godina, mjesec }); },

  // ── Korisnici ─────────────────────────────────────────────────
  async getKorisnici()        { return this.call('getKorisnici', {}); },
  async addKorisnik(data)     { return this.call('addKorisnik', data); },
  async updateKorisnik(data)  { return this.call('updateKorisnik', data); },
  async toggleKorisnik(id)    { return this.call('toggleKorisnik', { id }); },
};
