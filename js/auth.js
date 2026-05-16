// ═══════════════════════════════════════════════════════════════════
// weberp-bj | auth.js | Autentikacija i ovlasti
// ═══════════════════════════════════════════════════════════════════

const AUTH = {
  getUser() {
    try {
      return JSON.parse(sessionStorage.getItem('weberp_user') || 'null');
    } catch { return null; }
  },

  getToken() {
    return sessionStorage.getItem('weberp_token');
  },

  isLoggedIn() {
    return !!this.getToken() && !!this.getUser();
  },

  provjeriPristup() {
    if (!this.isLoggedIn()) {
      window.location.href = 'index.html';
      return false;
    }
    return true;
  },

  async odjava() {
    await API.logout().catch(() => {});
    sessionStorage.removeItem('weberp_token');
    sessionStorage.removeItem('weberp_user');
    window.location.href = 'index.html';
  },

  imaOvlast(uvjet) {
    const user = this.getUser();
    if (!user) return false;
    if (user.ULOGA === 'superuser') return true;

    const ovlasti = {
      admin_priprema:       ['narudzbe','dashboard','kalendar','alarmi'],
      admin_maticni:        ['maticni','dashboard'],
      admin_proizvodnja:    ['plan','dashboard','kalendar'],
      uprava:               ['dashboard','kalendar','narudzbe_r','plan_r','alarmi_r','prodaja_r'],
      prodaja:              ['plan_prodaje','narudzbe_r','dashboard','kalendar'],
      korisnik_proizvodnja: ['stvarno','plan_r','dashboard'],
      vozac:                ['vozac','narudzbe_vlastite'],
      ldc_skladiste:        ['vozac','narudzbe_vlastite','dashboard'],
    };

    return (ovlasti[user.ULOGA] || []).some(o =>
      o === uvjet || o === uvjet + '_r' || o.startsWith(uvjet)
    );
  },

  mozePisati(modul) {
    const user = this.getUser();
    if (!user) return false;
    if (user.ULOGA === 'superuser') return true;

    const pisanje = {
      admin_priprema:       ['narudzbe','alarmi'],
      admin_maticni:        ['maticni'],
      admin_proizvodnja:    ['plan'],
      prodaja:              ['plan_prodaje'],
      korisnik_proizvodnja: ['stvarno'],
      vozac:                ['vozac'],
      ldc_skladiste:        ['vozac'],
    };

    return (pisanje[user.ULOGA] || []).includes(modul);
  },

  // Podmape vidljive za ulogu
  vidljivePodmape() {
    const user = this.getUser();
    if (!user) return [];
    const uloga = user.ULOGA;

    const sve = [
      { id:'dashboard',    icon:'📊', label:'Dashboard',         uloge:['superuser','admin_priprema','admin_maticni','admin_proizvodnja','uprava','prodaja','korisnik_proizvodnja','ldc_skladiste'] },
      { id:'kalendar',     icon:'📅', label:'Kalendar',          uloge:['superuser','admin_priprema','admin_maticni','admin_proizvodnja','uprava','prodaja','vozac','ldc_skladiste'] },
      { id:'priprema',     icon:'📋', label:'Narudžbe',          uloge:['superuser','admin_priprema','uprava','prodaja','ldc_skladiste'] },
      { id:'vozac',        icon:'🚛', label:'Moje dostave',      uloge:['vozac','ldc_skladiste'] },
      { id:'plan_proizv',  icon:'🏭', label:'Plan proizvodnje',  uloge:['superuser','admin_priprema','admin_proizvodnja','uprava','korisnik_proizvodnja'] },
      { id:'plan_prodaje', icon:'📈', label:'Plan prodaje',      uloge:['superuser','admin_priprema','uprava','prodaja'] },
      { id:'alarmi',       icon:'🔔', label:'Alarmi',            uloge:['superuser','admin_priprema','uprava'] },
      { id:'maticni',      icon:'📦', label:'Matični podaci',    uloge:['superuser','admin_maticni'] },
      { id:'korisnici',    icon:'👥', label:'Korisnici',         uloge:['superuser'] },
      { id:'postavke',     icon:'⚙️', label:'Postavke',         uloge:['superuser','admin_priprema','admin_maticni','admin_proizvodnja'] },
    ];

    return sve.filter(m => m.uloge.includes(uloga));
  }
};
