// weberp-bj v2.0 — config.js
// VAŽNO: nakon deploymenta novog Apps Scripta, ažuriraj API_URL_V2
var WEBERP_CONFIG = {
  // ── PRODUKCIJA (v1 - ne dirati) ──
  API_URL: 'https://script.google.com/macros/s/AKfycbx_N97C9AKyBQzn3v3f8OAHBbYayBnEbYyzuH0aOIQ6TSUAP0oUrv2Z3IhhondBmrQ5Ww/exec',

  // ── v2.0 TEST (novi Apps Script deployment URL — upiši kada deployas) ──
  API_URL_V2: 'https://script.google.com/macros/s/AKfycbyGc7wB8zybRr2ncWXe91w5i6hhvlSdzcbNu0HGcheYetYn5wfCXshjdB0JsOLPn-16Xg/exec',

  APP_NAME:  'weberp-bj',
  APP_VER:   'v2.0',
  TVRTKA:    'weberp-bj',

  // Kojim URL-om pozivati (mijenja se na novi nakon deploymenta)
  get ACTIVE_API_URL() {
    return this.API_URL_V2 !== 'ZAMIJENITI_S_NOVIM_URL_NAKON_DEPLOYA'
      ? this.API_URL_V2
      : this.API_URL;
  }
};
