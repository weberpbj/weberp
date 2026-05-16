// ═══════════════════════════════════════════════════════════════════
// weberp-bj | js/api.js | v2.0 — JSONP za sve pozive
// Sve komunikacije idu kroz JSONP jer GitHub Pages + Apps Script
// ne podržava standardni CORS fetch
// ═══════════════════════════════════════════════════════════════════

var API_URL = 'https://script.google.com/macros/s/AKfycbxh6R-agYICMnbGuDcyA4eFU7OKIizFXXuVDg32BI_uzf5wuedqcFxQnTzXWUb4N7Fkmw/exec';

var API = {

  // ── Interni JSONP poziv ────────────────────────────────────────
  call: function(action, payload) {
    return new Promise(function(resolve, reject) {
      var token = '';
      try { token = sessionStorage.getItem('weberp_token') || ''; } catch(e) {}

      var cbName = 'wbcb' + Date.now() + Math.random().toString(36).substr(2, 4);
      var script = document.createElement('script');
      var done = false;

      var timer = setTimeout(function() {
        if (done) return;
        done = true;
        cleanup();
        reject(new Error('Timeout — server ne odgovara.'));
      }, 25000);

      window[cbName] = function(data) {
        if (done) return;
        done = true;
        clearTimeout(timer);
        cleanup();
        if (data && !data.ok && data.error === 'Sesija istekla. Prijavite se ponovo.') {
          try { sessionStorage.clear(); } catch(e) {}
          window.location.href = 'index.html';
          return;
        }
        resolve(data);
      };

      function cleanup() {
        try { if (script.parentNode) script.parentNode.removeChild(script); } catch(e) {}
        try { delete window[cbName]; } catch(e) {}
      }

      script.onerror = function() {
        if (done) return;
        done = true;
        clearTimeout(timer);
        cleanup();
        reject(new Error('Greška veze. Provjerite internet.'));
      };

      var params = 'action=' + encodeURIComponent(action)
        + '&payload=' + encodeURIComponent(JSON.stringify(payload || {}))
        + '&token=' + encodeURIComponent(token)
        + '&callback=' + cbName;

      script.src = API_URL + '?' + params;
      document.body.appendChild(script);
    });
  },

  // ── Auth ──────────────────────────────────────────────────────
  login: function(username, password) {
    return this.call('login', { username: username, password: password });
  },
  logout: function() { return this.call('logout', {}); },
  getMe:  function() { return this.call('getMe', {}); },
  promijeniLozinku: function(stara, nova) {
    return this.call('promijeniLozinku', { staraLozinka: stara, novaLozinka: nova });
  },

  // ── Narudžbe ──────────────────────────────────────────────────
  getNarudzbe:    function(f)  { return this.call('getNarudzbe', f || {}); },
  addNarudzba:    function(d)  { return this.call('addNarudzba', d); },
  updateNarudzba: function(d)  { return this.call('updateNarudzba', d); },
  deleteNarudzba: function(id) { return this.call('deleteNarudzba', { id: id }); },

  // ── Vozač ─────────────────────────────────────────────────────
  vozacPreuzimanje: function(id) { return this.call('vozacPreuzimanje', { id: id }); },
  vozacIstovar: function(id, napomena, foto_url) {
    return this.call('vozacIstovar', { id: id, napomena: napomena, foto_url: foto_url });
  },
  vozacProblem: function(id, opis, foto_url) {
    return this.call('vozacProblem', { id: id, opis: opis, foto_url: foto_url });
  },

  // ── Alarmi ────────────────────────────────────────────────────
  getAlarmi:    function(status) { return this.call('getAlarmi', { status: status }); },
  resolveAlarm: function(id, n)  { return this.call('resolveAlarm', { id: id, napomena: n }); },

  // ── Proizvodnja ───────────────────────────────────────────────
  getPlan:    function(tj) { return this.call('getPlan', { tjedan: tj }); },
  addPlan:    function(d)  { return this.call('addPlan', d); },
  updatePlan: function(d)  { return this.call('updatePlan', d); },
  getStvarno: function(tj) { return this.call('getStvarno', { tjedan: tj }); },
  addStvarno: function(d)  { return this.call('addStvarno', d); },

  // ── Plan prodaje ──────────────────────────────────────────────
  getPlanProdaje:  function()  { return this.call('getPlanProdaje', {}); },
  addPlanProdaje:  function(d) { return this.call('addPlanProdaje', d); },

  // ── Matični ───────────────────────────────────────────────────
  getMaticni:       function()       { return this.call('getMaticni', {}); },
  addArtikal:       function(d)      { return this.call('addArtikal', d); },
  updateArtikal:    function(d)      { return this.call('updateArtikal', d); },
  arhivirajArtikal: function(id, dt) { return this.call('arhivirajArtikal', { id: id, datum_do: dt }); },

  // ── Šifarnici ─────────────────────────────────────────────────
  getSifrarnici: function() { return this.call('getSifrarnici', {}); },

  // ── Dashboard i kalendar ──────────────────────────────────────
  getDashboard: function() { return this.call('getDashboard', {}); },
  getKalendar:  function(g, m) { return this.call('getKalendar', { godina: g, mjesec: m }); },

  // ── Korisnici ─────────────────────────────────────────────────
  getKorisnici:   function()  { return this.call('getKorisnici', {}); },
  addKorisnik:    function(d) { return this.call('addKorisnik', d); },
  updateKorisnik: function(d) { return this.call('updateKorisnik', d); },
  toggleKorisnik: function(id){ return this.call('toggleKorisnik', { id: id }); }
};
