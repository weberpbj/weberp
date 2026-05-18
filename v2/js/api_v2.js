// weberp-bj v2.0 — api_v2.js
// Sve API metode, JSONP pozivi

function _apiCall(action, payload) {
  return new Promise(function(resolve, reject) {
    var token = '';
    try { token = sessionStorage.getItem('weberp_token') || ''; } catch(e) {}
    var cb = 'cb' + Date.now() + Math.random().toString(36).substr(2,5);
    var s  = document.createElement('script');
    var done = false;
    var t = setTimeout(function() {
      if (done) return; done = true; clean();
      reject(new Error('Timeout. Provjerite internet.'));
    }, 25000);
    window[cb] = function(d) {
      if (done) return; done = true; clearTimeout(t); clean();
      if (d && !d.ok && d.error === 'Sesija istekla. Prijavite se ponovo.') {
        try { sessionStorage.clear(); } catch(e) {}
        window.location.href = 'index_v2.html'; return;
      }
      resolve(d);
    };
    function clean() {
      try { if (s.parentNode) s.parentNode.removeChild(s); } catch(e) {}
      try { delete window[cb]; } catch(e) {}
    }
    s.onerror = function() {
      if (done) return; done = true; clearTimeout(t); clean();
      reject(new Error('Nije moguće spojiti se.'));
    };
    var url = (WEBERP_CONFIG.ACTIVE_API_URL)
      + '?action=' + encodeURIComponent(action)
      + '&payload=' + encodeURIComponent(JSON.stringify(payload || {}))
      + '&token='   + encodeURIComponent(token)
      + '&callback=' + cb;
    s.src = url;
    document.body.appendChild(s);
  });
}

var API = {
  call: function(a, p) { return _apiCall(a, p); },

  // Auth
  login:                   function(u,p)     { return _apiCall('login', {username:u, password:p}); },
  logout:                  function()        { return _apiCall('logout', {}); },
  getMe:                   function()        { return _apiCall('getMe', {}); },
  promijeniLozinku:        function(s,n)     { return _apiCall('promijeniLozinku', {staraLozinka:s, novaLozinka:n}); },
  posaljiPrivremenuLozinku:function(u)       { return _apiCall('posaljiPrivremenuLozinku', {username:u}); },

  // Narudžbe
  getNarudzbe:             function(f)       { return _apiCall('getNarudzbe', f||{}); },
  addNarudzba:             function(d)       { return _apiCall('addNarudzba', d); },
  updateNarudzba:          function(d)       { return _apiCall('updateNarudzba', d); },
  deleteNarudzba:          function(id)      { return _apiCall('deleteNarudzba', {id:id}); },

  // Vozač
  vozacPreuzimanje:        function(id)      { return _apiCall('vozacPreuzimanje', {id:id}); },
  vozacIstovar:            function(id,n)    { return _apiCall('vozacIstovar', {id:id, napomena:n}); },
  vozacProblem:            function(id,o)    { return _apiCall('vozacProblem', {id:id, opis:o}); },

  // Alarmi
  getAlarmi:               function(s)       { return _apiCall('getAlarmi', {status:s}); },
  resolveAlarm:            function(id,n)    { return _apiCall('resolveAlarm', {id:id, napomena:n}); },

  // Plan
  getPlan:                 function(tj)      { return _apiCall('getPlan', {tjedan:tj}); },
  addPlan:                 function(d)       { return _apiCall('addPlan', d); },
  deletePlan:              function(id)      { return _apiCall('deletePlan', {id:id}); },
  getStvarno:              function(tj)      { return _apiCall('getStvarno', {tjedan:tj}); },
  addStvarno:              function(d)       { return _apiCall('addStvarno', d); },

  // Plan prodaje
  getPlanProdaje:          function()        { return _apiCall('getPlanProdaje', {}); },
  addPlanProdaje:          function(d)       { return _apiCall('addPlanProdaje', d); },
  deletePlanProdaje:       function(id)      { return _apiCall('deletePlanProdaje', {id:id}); },

  // Matični
  getMaticni:              function()        { return _apiCall('getMaticni', {}); },
  addArtikal:              function(d)       { return _apiCall('addArtikal', d); },
  updateArtikal:           function(d)       { return _apiCall('updateArtikal', d); },
  arhivirajArtikal:        function(id,dt)   { return _apiCall('arhivirajArtikal', {id:id, datum_do:dt}); },

  // Šifrarnici + Dashboard + Kalendar
  getSifrarnici:           function()        { return _apiCall('getSifrarnici', {}); },
  getDashboard:            function()        { return _apiCall('getDashboard', {}); },
  getKalendar:             function(g,m)     { return _apiCall('getKalendar', {godina:g, mjesec:m}); },

  // Korisnici
  getKorisnici:            function()        { return _apiCall('getKorisnici', {}); },
  addKorisnik:             function(d)       { return _apiCall('addKorisnik', d); },
  updateKorisnik:          function(d)       { return _apiCall('updateKorisnik', d); },
  toggleKorisnik:          function(id)      { return _apiCall('toggleKorisnik', {id:id}); },

  // v2 NOVO
  getSkladiste:            function(sk)      { return _apiCall('getSkladiste', {skladiste:sk}); },
  getPrijevoz:             function(f)       { return _apiCall('getPrijevoz', f||{}); },
  getProjekcija:           function(p)       { return _apiCall('getProjekcija', p||{}); },
  spremiProjekciju:        function(d)       { return _apiCall('spremiProjekciju', d); },
  getIzvjestaj:            function(g,m)     { return _apiCall('getIzvjestaj', {godina:g, mjesec:m}); },
  getVerzije:              function()        { return _apiCall('getVerzije', {}); },
  addVerzija:              function(d)       { return _apiCall('addVerzija', d); },
  aktivirajVerziju:        function(id)      { return _apiCall('aktivirajVerziju', {id:id}); },
};
