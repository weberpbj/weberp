// weberp-bj v2.0 — auth_v2.js
// Autentikacija, ovlasti, vidljive podmape

const AUTH = {
  getUser() {
    try { return JSON.parse(sessionStorage.getItem('weberp_user') || 'null'); }
    catch { return null; }
  },

  getToken() { return sessionStorage.getItem('weberp_token'); },

  isLoggedIn() { return !!this.getToken() && !!this.getUser(); },

  provjeriPristup() {
    if (!this.isLoggedIn()) { window.location.href = 'index_v2.html'; return false; }
    return true;
  },

  async odjava() {
    await API.logout().catch(() => {});
    sessionStorage.removeItem('weberp_token');
    sessionStorage.removeItem('weberp_user');
    window.location.href = 'index_v2.html';
  },

  // Pristupna prava — iz prilagođenog JSON polja u bazi (v2)
  // Ako prava postoje u JSON obliku, koristi ih; inače fallback na ulogu
  getPrava() {
    const user = this.getUser();
    if (!user) return {};
    if (user.PRISTUPNA_PRAVA) {
      try { return JSON.parse(user.PRISTUPNA_PRAVA); } catch(e) {}
    }
    return null; // fallback na ulogu
  },

  imaOvlast(modul) {
    const user = this.getUser();
    if (!user) return false;
    if (user.ULOGA === 'superuser') return true;

    // Provjeri prilagođena prava
    const prava = this.getPrava();
    if (prava && prava[modul] !== undefined) return prava[modul] !== false;

    // Fallback: po ulozi
    const ovlasti = {
      admin_priprema:       ['narudzbe','dashboard','kalendar','alarmi','plan_proizv','plan_prodaje','prijevoz'],
      admin_maticni:        ['maticni','dashboard'],
      admin_proizvodnja:    ['plan_proizv','dashboard','kalendar','projekcija'],
      uprava:               ['dashboard','kalendar','narudzbe','plan_proizv','alarmi','plan_prodaje','skladista','prijevoz','izvjestaji'],
      prodaja:              ['plan_prodaje','narudzbe','dashboard','kalendar'],
      korisnik_proizvodnja: ['plan_proizv','dashboard','projekcija'],
      vozac:                ['vozac','narudzbe'],
      ldc_skladiste:        ['vozac','narudzbe','dashboard','skladista'],
    };
    return (ovlasti[user.ULOGA] || []).some(o => o === modul || o.startsWith(modul));
  },

  mozePisati(modul) {
    const user = this.getUser();
    if (!user) return false;
    if (user.ULOGA === 'superuser') return true;

    const prava = this.getPrava();
    if (prava && prava[modul + '_write'] !== undefined) return prava[modul + '_write'] === true;

    const pisanje = {
      admin_priprema:       ['narudzbe','alarmi','plan_proizv','plan_prodaje'],
      admin_maticni:        ['maticni'],
      admin_proizvodnja:    ['plan_proizv','projekcija'],
      prodaja:              ['plan_prodaje'],
      korisnik_proizvodnja: ['plan_proizv'],
      vozac:                ['vozac'],
      ldc_skladiste:        ['vozac'],
    };
    return (pisanje[user.ULOGA] || []).includes(modul);
  },

  mozeBrisati(modul) {
    const user = this.getUser();
    if (!user) return false;
    if (user.ULOGA === 'superuser') return true;
    const prava = this.getPrava();
    if (prava && prava[modul + '_delete'] !== undefined) return prava[modul + '_delete'] === true;
    return ['admin_priprema'].includes(user.ULOGA) && ['narudzbe','plan_proizv','plan_prodaje'].includes(modul);
  },

  // Podmape vidljive — v2.0 s novim uvjetima
  vidljivePodmape() {
    const user = this.getUser();
    if (!user) return [];
    const uloga = user.ULOGA;

    const sve = [
      // Pregled
      { id:'dashboard',    icon:'📊', label:'Dashboard',          grp:'Pregled',    uloge:['superuser','admin_priprema','admin_maticni','admin_proizvodnja','uprava','prodaja','korisnik_proizvodnja','ldc_skladiste'] },
      { id:'kalendar',     icon:'📅', label:'Kalendar',           grp:'Pregled',    uloge:['superuser','admin_priprema','admin_maticni','admin_proizvodnja','uprava','prodaja','vozac','ldc_skladiste'] },
      // Operativa
      { id:'priprema',     icon:'📋', label:'Narudžbe',           grp:'Operativa',  uloge:['superuser','admin_priprema','uprava','prodaja','ldc_skladiste'] },
      { id:'vozac',        icon:'🚛', label:'Moje dostave',       grp:'Operativa',  uloge:['vozac','ldc_skladiste'] },
      { id:'plan_proizv',  icon:'🏭', label:'Plan proizvodnje',   grp:'Operativa',  uloge:['superuser','admin_priprema','admin_proizvodnja','uprava','korisnik_proizvodnja'] },
      { id:'plan_prodaje', icon:'📈', label:'Plan prodaje',       grp:'Operativa',  uloge:['superuser','admin_priprema','uprava','prodaja'] },
      { id:'prijevoz',     icon:'🚚', label:'Prijevoz',           grp:'Operativa',  uloge:['superuser','admin_priprema','uprava','ldc_skladiste'], novo:true },
      // Skladišta
      { id:'skladista',    icon:'🏪', label:'Skladišta',          grp:'Skladišta',  uloge:['superuser','admin_priprema','uprava','ldc_skladiste'], novo:true },
      { id:'projekcija',   icon:'🎯', label:'Projekcija',         grp:'Skladišta',  uloge:['superuser','admin_priprema','admin_proizvodnja','uprava'], novo:true },
      // Izvještaji
      { id:'izvjestaji',   icon:'📑', label:'Izvještaji',         grp:'Izvještaji', uloge:['superuser','admin_priprema','uprava'], novo:true },
      // Ostalo
      { id:'alarmi',       icon:'🔔', label:'Alarmi',             grp:'Ostalo',     uloge:['superuser','admin_priprema','uprava'] },
      { id:'maticni',      icon:'📦', label:'Matični podaci',     grp:'Ostalo',     uloge:['superuser','admin_maticni'] },
      { id:'korisnici',    icon:'👥', label:'Korisnici',          grp:'Ostalo',     uloge:['superuser'] },
      { id:'ai',           icon:'🤖', label:'AI Asistent',        grp:'Ostalo',     uloge:['superuser'], novo:true },
      { id:'postavke',     icon:'⚙️', label:'Postavke',           grp:'Ostalo',     uloge:['superuser','admin_priprema','admin_maticni','admin_proizvodnja'] },
    ];

    // Filtriranje: provjeri ulogu ILI prilagođena prava
    return sve.filter(m => {
      if (m.uloge.includes(uloga)) return true;
      const prava = this.getPrava();
      if (prava && prava[m.id] === true) return true;
      return false;
    });
  }
};
