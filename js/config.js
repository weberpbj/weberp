// ═══════════════════════════════════════════════════════════════════
// weberp-bj | config.js | Centralna konfiguracija
// JEDINA DATOTEKA KOJU TREBAŠ MIJENJATI nakon deploaya Apps Script
// ═══════════════════════════════════════════════════════════════════

const WEBERP_CONFIG = {
  // !! ZAMIJENITI s URL-om nakon deploaya Google Apps Script Web App !!
  API_URL: 'https://script.google.com/macros/s/AKfycbxh6R-agYICMnbGuDcyA4eFU7OKIizFXXuVDg32BI_uzf5wuedqcFxQnTzXWUb4N7Fkmw/exec',

  APP_NAME:    'weberp-bj',
  APP_VERSION: '1.0',
  TVRTKA:      'weberp-bj',

  // Artikli — sinkroniziraju se iz MATICNI_PODACI
  // Ovo je fallback ako API nije dostupan
  ARTIKLI_FALLBACK: [
    'BK','BS','BB','PANJ','MCD','VITEZ','LAN',
    '5 ZIT','BR/TK','BAG','š5-ŽIT','BH','PINCE','KCZ','MAĐARICA'
  ],

  // Skladišta — fallback
  SKLADISTA: ['TKZD','LDC FRIGO','LDC MARI','LDC RALU'],

  // Session timeout u ms (8 sati)
  SESSION_TIMEOUT: 8 * 60 * 60 * 1000,
};
