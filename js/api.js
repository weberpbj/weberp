// ═══════════════════════════════════════════════════════════════════
// weberp-bj | js/api.js | v2.0 JSONP
// ═══════════════════════════════════════════════════════════════════

var API_URL = 'https://script.google.com/macros/s/AKfycbxh6R-agYICMnbGuDcyA4eFU7OKIizFXXuVDg32BI_uzf5wuedqcFxQnTzXWUb4N7Fkmw/exec';

var API = {
  call: function(action, payload) {
    return new Promise(function(resolve, reject) {
      var token = '';
      try { token = sessionStorage.getItem('weberp_token') || ''; } catch(e) {}
      var cbName = 'wbcb' + Date.now() + Math.random().toString(36).substr(2,4);
      var script = document.createElement('script');
      var done = false;
      var timer = setTimeout(function() {
        if (done) return; done = true; cleanup();
        reject(new Error('Timeout.'));
      }, 25000);
      window[cbName] = function(data) {
        if (done) return; done = true; clearTimeout(timer); cleanup();
        if (data && !data.ok && data.error === 'Sesija istekla. Prijavite se ponovo.') {
          try { sessionStorage.clear(); } catch(e) {}
          window.location.href = 'index.html'; return;
        }
        resolve(data);
      };
      function cleanup() {
        try { if (script.parentNode) script.parentNode.removeChild(script); } catch(e) {}
        try { delete window[cbName]; } catch(e) {}
      }
      script.onerror = function() {
        if (done) return; done = true; clearTimeout(timer); cleanup();
        reject(new Error('Greška veze. Provjerite internet.'));
      };
      script.src = API_URL + '?action=' + encodeURIComponent(action)
        + '&payload=' + encodeURIComponent(JSON.stringify(payload || {}))
        + '&token=' + encodeURIComponent(token)
        + '&callback=' + cbName;
      document.body.appendChild(script);
    });
  },
  login:            function(u,p)    { return this.call('login',{username:u,password:p}); },
  logout:           function()       { return this.call('logout',{}); },
  getMe:            function()       { return this.call('getMe',{}); },
  promijeniLozinku: function(s,n)    { return this.call('promijeniLozinku',{staraLozinka:s,novaLozinka:n}); },
  getNarudzbe:      function(f)      { return this.call('getNarudzbe',f||{}); },
  addNarudzba:      function(d)      { return this.call('addNarudzba',d); },
  updateNarudzba:   function(d)      { return this.call('updateNarudzba',d); },
  deleteNarudzba:   function(id)     { return this.call('deleteNarudzba',{id:id}); },
  vozacPreuzimanje: function(id)     { return this.call('vozacPreuzimanje',{id:id}); },
  vozacIstovar:     function(id,n,f) { return this.call('vozacIstovar',{id:id,napomena:n,foto_url:f}); },
  vozacProblem:     function(id,o,f) { return this.call('vozacProblem',{id:id,opis:o,foto_url:f}); },
  getAlarmi:        function(s)      { return this.call('getAlarmi',{status:s}); },
  resolveAlarm:     function(id,n)   { return this.call('resolveAlarm',{id:id,napomena:n}); },
  getPlan:          function(tj)     { return this.call('getPlan',{tjedan:tj}); },
  addPlan:          function(d)      { return this.call('addPlan',d); },
  updatePlan:       function(d)      { return this.call('updatePlan',d); },
  getStvarno:       function(tj)     { return this.call('getStvarno',{tjedan:tj}); },
  addStvarno:       function(d)      { return this.call('addStvarno',d); },
  getPlanProdaje:   function()       { return this.call('getPlanProdaje',{}); },
  addPlanProdaje:   function(d)      { return this.call('addPlanProdaje',d); },
  getMaticni:       function()       { return this.call('getMaticni',{}); },
  addArtikal:       function(d)      { return this.call('addArtikal',d); },
  updateArtikal:    function(d)      { return this.call('updateArtikal',d); },
  arhivirajArtikal: function(id,dt)  { return this.call('arhivirajArtikal',{id:id,datum_do:dt}); },
  getSifrarnici:    function()       { return this.call('getSifrarnici',{}); },
  getDashboard:     function()       { return this.call('getDashboard',{}); },
  getKalendar:      function(g,m)    { return this.call('getKalendar',{godina:g,mjesec:m}); },
  getKorisnici:     function()       { return this.call('getKorisnici',{}); },
  addKorisnik:      function(d)      { return this.call('addKorisnik',d); },
  updateKorisnik:   function(d)      { return this.call('updateKorisnik',d); },
  toggleKorisnik:   function(id)     { return this.call('toggleKorisnik',{id:id}); }
};
