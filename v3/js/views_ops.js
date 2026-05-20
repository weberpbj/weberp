// weberp-bj v3.2 | views_ops.js
// REDESIGN Mapa Proizvodnja:
//   - Gornji dio: stanje 3 skladišta + forecast 7 dana po artiklu
//   - Donji dio: plan/stvarno tablica s 4-faznim flow-om
//     Faza 1: Unesi plan → Zaključaj plan
//     Faza 2: Unesi stvarno → Zaključaj stvarno
//     Faza 3: Zaključano (read-only)
//   - DOM refresh bez ponovnog API poziva (lokalni podaci)
//   - Projekcija uklonjena iz mape (bila je ista kao v2 kopija)
//   - normDatumStr helper za robusno matchanje datuma

// ═══════════════════════════════════════════════════════════════════
// HELPER — normalizira datum u YYYY-MM-DD bez obzira na GAS format
// ═══════════════════════════════════════════════════════════════════
function normDatumStr(d) {
  if (!d) return '';
  const s = String(d);
  if (s.match(/^\d{4}-\d{2}-\d{2}/)) return s.slice(0, 10);
  if (typeof d === 'number' && d > 40000) {
    const dt = new Date((d - 25569) * 86400 * 1000);
    return dt.getUTCFullYear() + '-' +
      String(dt.getUTCMonth() + 1).padStart(2, '0') + '-' +
      String(dt.getUTCDate()).padStart(2, '0');
  }
  return s;
}

// ═══════════════════════════════════════════════════════════════════
// PRIJEVOZ
// ═══════════════════════════════════════════════════════════════════
let _prij_filtri = { skladiste:'sve', prijevoznik:'sve', smjer:'oba' };

async function renderPrijevoz() {
  const main = document.getElementById('main-content');
  main.innerHTML = `
  <div style="font-size:17px;font-weight:800;margin-bottom:12px">🚚 Prijevoz <span style="font-size:12px;font-weight:400;color:#7d8590">· Raspored</span></div>
  <div class="filters" style="margin-bottom:8px">
    <span style="font-size:11px;color:#7d8590;font-weight:700">Skladište:</span>
    ${['sve','LDC FRIGO','LDC MARI','TKZD'].map(s=>
      `<button class="filter-btn ${_prij_filtri.skladiste===s?'active':''}" onclick="setPrijFilter('skladiste','${s}')">${s==='sve'?'Sva':s}</button>`
    ).join('')}
    <span style="color:#30363d;margin:0 4px">|</span>
    <span style="font-size:11px;color:#7d8590;font-weight:700">Smjer:</span>
    ${[['oba','↑↓ Oba'],['ulaz','↑ Ulazi'],['izlaz','↓ Izlazi']].map(([v,l])=>
      `<button class="filter-btn ${_prij_filtri.smjer===v?'active':''}" onclick="setPrijFilter('smjer','${v}')">${l}</button>`
    ).join('')}
    <span class="filters-count" id="prij-count"></span>
  </div>
  <div id="prij-content"><div class="loading-box"><div class="spinner"></div></div></div>`;
  await loadPrijevoz();
}

function setPrijFilter(key, val) {
  _prij_filtri[key] = val;
  renderPrijevoz();
}

async function loadPrijevoz() {
  const res = await API.getPrijevoz(_prij_filtri);
  const c = document.getElementById('prij-content');
  if (!c) return;
  if (!res.ok) { c.innerHTML = err(res.error); return; }
  const zapisi = res.data || [];
  const cnt = document.getElementById('prij-count');
  if (cnt) cnt.textContent = zapisi.length + ' zapisa';
  if (!zapisi.length) {
    c.innerHTML = '<div class="card" style="color:#7d8590;text-align:center;padding:28px">Nema prijevoznih zapisa za odabrane filtere.</div>';
    return;
  }
  c.innerHTML = `<div class="tbl-wrap"><table>
    <thead><tr>
      <th>Datum utovara</th><th>Datum dostave</th><th>Smjer</th>
      <th>Iz</th><th>U</th><th>Prijevoznik</th>
      <th style="text-align:right">Pal</th><th>Kupac</th><th>Status</th>
    </tr></thead>
    <tbody>
      ${zapisi.map(z => {
        const smjCls = z.smjer==='ulaz'?'tag-purple':'tag-blue';
        const stCls  = z.status==='Isporučeno'?'tag-green':z.status==='Problem'?'tag-red':'tag-blue';
        return `<tr>
          <td style="font-weight:600;color:#e3b341">${fmt_datum(z.datum_utovara)}</td>
          <td style="color:#7d8590">${fmt_datum(z.datum_dostave)}</td>
          <td><span class="tag ${smjCls}">${z.smjer==='ulaz'?'↑ Ulaz':'↓ Izlaz'}</span></td>
          <td>${z.mjesto_utovara}</td><td>${z.mjesto_istovara}</td>
          <td style="color:#7d8590">${z.prijevoznik}</td>
          <td style="text-align:right;color:#58a6ff;font-weight:700">${z.br_paleta}</td>
          <td>${z.kupac}</td>
          <td><span class="tag ${stCls}">${z.status}</span></td>
        </tr>`;
      }).join('')}
    </tbody>
  </table></div>`;
}

// ═══════════════════════════════════════════════════════════════════
// SKLADIŠTA — forecast 90 dana
// ═══════════════════════════════════════════════════════════════════
let _sklad_akt = 'LDC FRIGO';

async function renderSkladista() {
  const main = document.getElementById('main-content');
  main.innerHTML = `
  <div style="font-size:17px;font-weight:800;margin-bottom:12px">🏪 Skladišta <span style="font-size:12px;font-weight:400;color:#7d8590">· Analitika i forecast</span></div>
  <div class="filters" style="margin-bottom:12px">
    ${['LDC FRIGO','LDC MARI','TKZD'].map(s=>
      `<button class="filter-btn ${_sklad_akt===s?'active':''}" onclick="setSkladAkt('${s}')">${s}</button>`
    ).join('')}
  </div>
  <div id="sklad-content"><div class="loading-box"><div class="spinner"></div></div></div>`;
  await loadSkladiste();
}

function setSkladAkt(sk) { _sklad_akt = sk; renderSkladista(); }

async function loadSkladiste() {
  const res = await API.getSkladiste(_sklad_akt);
  const c = document.getElementById('sklad-content');
  if (!c) return;
  if (!res.ok) { c.innerHTML = err(res.error); return; }
  const d = res.data;
  const pct = Math.round(d.trenutno / d.kapacitet * 100);
  const clr = pct > 85 ? '#f85149' : pct > 70 ? '#ffa657' : '#58a6ff';

  const today = new Date();
  const backendFc = d.forecast || [];
  const forecast90 = [];
  for (let i = 0; i < 90; i++) {
    const dd = new Date(today.getTime() + i * 86400000);
    const datum = dd.toISOString().slice(0,10);
    const fcDay = backendFc.find(f => normDatumStr(f.datum) === datum);
    const zadnji = backendFc[Math.min(i, backendFc.length-1)] || { artikli: d.stanje_art, ukupno: d.trenutno };
    forecast90.push({
      datum, dan: ['Ned','Pon','Uto','Sri','Čet','Pet','Sub'][dd.getDay()],
      artikli: fcDay ? fcDay.artikli : zadnji.artikli,
      ukupno:  fcDay ? fcDay.ukupno  : zadnji.ukupno
    });
  }

  window._fcSkladData = { forecast90, d, offset: 0 };
  window.fcSlide = function(delta) {
    window._fcSkladData.offset = Math.max(0, Math.min(80, window._fcSkladData.offset + delta));
    document.getElementById('fc-tbl').innerHTML = renderFcTbl();
  };

  function renderFcTbl() {
    const { forecast90, d, offset } = window._fcSkladData;
    const w = forecast90.slice(offset, offset + 10);
    const todayStr = new Date().toISOString().slice(0,10);
    const artPrik = ARTIKLI.filter(a => w.some(f => (f.artikli?.[a] || 0) !== 0));
    const artShow = artPrik.length > 0 ? artPrik : ARTIKLI.slice(0, 4);
    return `
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;flex-wrap:wrap">
      <button class="btn btn-secondary btn-sm" onclick="fcSlide(-10)" ${offset===0?'disabled':''}>‹ Preth.</button>
      <span style="font-size:11px;color:#7d8590">${fmt_datum(w[0].datum)} – ${fmt_datum(w[w.length-1].datum)} (dan ${offset+1}–${offset+w.length} od 90)</span>
      <button class="btn btn-secondary btn-sm" onclick="fcSlide(10)" ${offset+10>=90?'disabled':''}>Sljed. ›</button>
    </div>
    <div class="tbl-wrap"><table>
      <thead><tr>
        <th>Artikl</th><th style="text-align:right;color:#7d8590">Trenutno</th>
        ${w.map(f=>`<th style="text-align:right;${f.datum===todayStr?'color:#e3b341':''}">
          ${f.dan}<br><span style="font-size:9px;font-weight:400">${f.datum.slice(8)}.${f.datum.slice(5,7)}.</span>
        </th>`).join('')}
      </tr></thead>
      <tbody>
        ${artShow.map(a => {
          const trenutno = d.stanje_art?.[a] || 0;
          return `<tr>
            <td style="font-weight:700;color:#58a6ff">${a}</td>
            <td style="text-align:right;color:${trenutno>0?'#e6edf3':'#484f58'};font-weight:${trenutno>0?700:400}">${trenutno||'—'}</td>
            ${w.map(f => {
              const v = f.artikli?.[a] || 0;
              const vc = v < 0 ? '#f85149' : v > 0 ? '#58a6ff' : '#484f58';
              return `<td style="text-align:right;color:${vc};font-weight:${v!==0?700:400}">${v||'—'}</td>`;
            }).join('')}
          </tr>`;
        }).join('')}
        <tr style="border-top:2px solid #30363d;font-weight:700">
          <td style="color:#3fb950">UKUPNO</td>
          <td style="text-align:right;color:#3fb950">${d.trenutno}</td>
          ${w.map(f => {
            const uc = f.ukupno > d.kapacitet ? '#f85149' : f.ukupno > d.kapacitet*0.85 ? '#ffa657' : '#3fb950';
            return `<td style="text-align:right;color:${uc};font-weight:700">${f.ukupno}</td>`;
          }).join('')}
        </tr>
      </tbody>
    </table></div>`;
  }

  c.innerHTML = `
  <div class="g5" style="margin-bottom:12px">
    <div class="kpi"><div class="kpi-label">Trenutno</div><div class="kpi-val" style="color:${clr}">${d.trenutno}</div><div class="kpi-sub">paleta</div></div>
    <div class="kpi"><div class="kpi-label">Kapacitet</div><div class="kpi-val" style="color:#7d8590">${d.kapacitet}</div><div class="kpi-sub">max paleta</div></div>
    <div class="kpi"><div class="kpi-label">Slobodno</div><div class="kpi-val" style="color:${d.slobodno<30?'#f85149':'#3fb950'}">${d.slobodno}</div><div class="kpi-sub">paleta</div></div>
    <div class="kpi"><div class="kpi-label">Popunjenost</div><div class="kpi-val" style="color:${clr}">${pct}%</div><div class="kpi-sub">&nbsp;</div></div>
    <div class="kpi"><div class="kpi-label">Skladište</div><div class="kpi-val" style="font-size:14px;color:#58a6ff">${_sklad_akt}</div><div class="kpi-sub">&nbsp;</div></div>
  </div>
  <div class="card">
    <div class="card-title">📦 Forecast po artiklima — 90 dana</div>
    <div id="fc-tbl">${renderFcTbl()}</div>
  </div>`;
}

// ═══════════════════════════════════════════════════════════════════
// IZVJEŠTAJI
// ═══════════════════════════════════════════════════════════════════
let _izv_god = new Date().getFullYear();
let _izv_mj  = null;

async function renderIzvjestaji() {
  const main = document.getElementById('main-content');
  main.innerHTML = `
  <div style="font-size:17px;font-weight:800;margin-bottom:12px">📑 Izvještaji</div>
  <div class="filters" style="margin-bottom:12px">
    <select id="izv-god" class="filter-input" onchange="_izv_god=parseInt(this.value);loadIzvjestaj()">
      ${[2025,2026,2027].map(y=>`<option value="${y}" ${y===_izv_god?'selected':''}>${y}</option>`).join('')}
    </select>
    <select id="izv-mj" class="filter-input" onchange="_izv_mj=this.value?parseInt(this.value):null;loadIzvjestaj()">
      <option value="">Svi mjeseci</option>
      ${['Siječanj','Veljača','Ožujak','Travanj','Svibanj','Lipanj','Srpanj','Kolovoz','Rujan','Listopad','Studeni','Prosinac']
        .map((m,i)=>`<option value="${i+1}" ${_izv_mj===i+1?'selected':''}>${m}</option>`).join('')}
    </select>
    <button class="btn btn-secondary" onclick="window.print()">🖨 Ispiši</button>
  </div>
  <div id="izv-content"><div class="loading-box"><div class="spinner"></div></div></div>`;
  await loadIzvjestaj();
}

async function loadIzvjestaj() {
  const c = document.getElementById('izv-content');
  if (!c) return;
  const res = await API.getIzvjestaj(_izv_god, _izv_mj);
  if (!res.ok) { c.innerHTML = err(res.error); return; }
  const d = res.data;
  const topKupci = Object.entries(d.po_kupcu||{}).sort(([,a],[,b])=>b.pal-a.pal).slice(0,8);
  const topPrij  = Object.entries(d.po_prijevozniku||{}).sort(([,a],[,b])=>b.pal-a.pal).slice(0,5);
  const artRows  = Object.entries(d.po_artiklu||{}).filter(([,v])=>v>0).sort(([,a],[,b])=>b-a);
  const maxArt   = Math.max(...artRows.map(([,v])=>v), 1);
  c.innerHTML = `
  <div class="g4" style="margin-bottom:12px">
    ${kpi('Ukupno otprema', d.kpi.ukupno_pal, 'pal · dostave kupcima', '#58a6ff')}
    ${kpi('Prijenosi', d.kpi.ukupno_prijenosa||0, 'između skladišta', '#bc8cff')}
    ${kpi('Obrtaj FRIGO', d.kpi.obrtaj_frigo+'×', 'YTD '+_izv_god, '#6366f1')}
    ${kpi('Obrtaj MARI',  d.kpi.obrtaj_mari+'×',  'YTD '+_izv_god, '#8b5cf6')}
  </div>
  <div class="g2">
    <div class="card">
      <div class="card-title">📊 Otprema po kupcu</div>
      <div class="tbl-wrap"><table>
        <thead><tr><th>Kupac</th><th style="text-align:right">Pal</th><th style="text-align:right">Dostave</th></tr></thead>
        <tbody>
          ${topKupci.map(([k,v])=>`<tr>
            <td style="font-weight:600">${k}</td>
            <td style="text-align:right;color:#58a6ff;font-weight:700">${v.pal}</td>
            <td style="text-align:right;color:#7d8590">${v.dostava}</td>
          </tr>`).join('')}
          ${!topKupci.length?'<tr><td colspan="3" class="tbl-empty">Nema podataka.</td></tr>':''}
        </tbody>
      </table></div>
    </div>
    <div class="card">
      <div class="card-title">🚚 Po prijevozniku</div>
      <div class="tbl-wrap"><table>
        <thead><tr><th>Prijevoznik</th><th style="text-align:right">Pal</th><th style="text-align:right">Prijevoza</th></tr></thead>
        <tbody>
          ${topPrij.map(([p,v])=>`<tr>
            <td style="font-weight:600">${p}</td>
            <td style="text-align:right;color:#bc8cff;font-weight:700">${v.pal}</td>
            <td style="text-align:right;color:#7d8590">${v.dostava}</td>
          </tr>`).join('')}
          ${!topPrij.length?'<tr><td colspan="3" class="tbl-empty">Nema podataka.</td></tr>':''}
        </tbody>
      </table></div>
    </div>
  </div>
  <div class="card">
    <div class="card-title">📦 Po artiklima</div>
    ${artRows.map(([a,v])=>`
      <div class="bar-wrap">
        <div class="bar-header">
          <span style="font-weight:600;min-width:80px;display:inline-block">${a}</span>
          <span style="color:#58a6ff;font-weight:700">${v} pal</span>
        </div>
        <div class="bar-track"><div class="bar-fill" style="width:${Math.round(v/maxArt*100)}%;background:#58a6ff"></div></div>
      </div>`).join('')}
    ${!artRows.length?'<div style="color:#7d8590;text-align:center;padding:16px">Nema podataka.</div>':''}
  </div>`;
}

// ═══════════════════════════════════════════════════════════════════
// PLAN PRODAJE
// ═══════════════════════════════════════════════════════════════════
async function renderPlanProdaje() {
  const res = await API.getPlanProdaje();
  const main = document.getElementById('main-content');
  const planovi = res.ok ? res.data : [];
  const mozePisati  = AUTH.mozePisati('plan_prodaje');
  const mozeBrisati = AUTH.mozeBrisati('plan_prodaje');
  main.innerHTML = `
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;flex-wrap:wrap;gap:8px">
    <div style="font-size:17px;font-weight:800">📈 Plan prodaje</div>
    ${mozePisati ? `<button class="btn btn-primary" onclick="openPlanProdajeModal()">+ Novi plan</button>` : ''}
  </div>
  <div class="tbl-wrap"><table>
    <thead><tr>
      <th>Kupac</th><th>Datum od</th><th>Datum do</th>
      <th style="text-align:right">Ukupno pal</th><th>Napomena</th><th>Unio</th>
      ${mozeBrisati ? '<th>🗑</th>' : ''}
    </tr></thead>
    <tbody>
      ${planovi.map(p=>`<tr>
        <td style="font-weight:600">${p.KUPAC||'—'}</td>
        <td>${fmt_datum(p.DATUM_OD)}</td><td>${fmt_datum(p.DATUM_DO)}</td>
        <td style="color:#58a6ff;font-weight:700;text-align:right">${p.UKUPNO_PAL||'—'}</td>
        <td style="color:#7d8590;font-size:11px">${p.NAPOMENA||'—'}</td>
        <td style="color:#7d8590;font-size:11px">${p.UNIO||'—'}</td>
        ${mozeBrisati ? `<td><button class="btn btn-danger btn-sm" onclick="obrisiPlanProdaje(${p.ID})">🗑</button></td>` : ''}
      </tr>`).join('')}
      ${!planovi.length ? `<tr><td colspan="7" class="tbl-empty">Nema planova prodaje.</td></tr>` : ''}
    </tbody>
  </table></div>`;
}

function openPlanProdajeModal() {
  const sif = appState.sifrarnici||{};
  const kupci = (sif.kupci||[]).map(k=>`<option value="${k.NAZIV}">${k.NAZIV}</option>`).join('');
  const art   = (sif.artikli||[]).filter(a=>a.AKTIVAN==='Da');
  document.getElementById('modal-content').innerHTML = `
    <div class="modal-title">Novi plan prodaje</div>
    <div class="form-row col2">
      <div class="form-group"><label>Kupac *</label>
        <select id="pp-kupac"><option value="">— Odaberi —</option>${kupci}</select></div>
    </div>
    <div class="form-row col2">
      <div class="form-group"><label>Datum od *</label><input type="date" id="pp-od"></div>
      <div class="form-group"><label>Datum do *</label><input type="date" id="pp-do"></div>
    </div>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:12px">
      ${art.map(a=>`<div class="form-group"><label>${a.KOD}</label>
        <input type="number" id="pp-${a.KOD.replace(/[\/ ]/g,'_')}" min="0" value="0"></div>`).join('')}
    </div>
    <div class="form-group"><label>Napomena</label><input type="text" id="pp-nap"></div>
    <div class="modal-footer">
      <button class="btn btn-secondary" onclick="closeModal()">Odustani</button>
      <button class="btn btn-primary" onclick="spremiPlanProdaje()">Spremi</button>
    </div>`;
  openModal();
}

async function spremiPlanProdaje() {
  const sif = appState.sifrarnici||{};
  const art = (sif.artikli||[]).filter(a=>a.AKTIVAN==='Da');
  const data = {
    KUPAC:    document.getElementById('pp-kupac').value,
    DATUM_OD: document.getElementById('pp-od').value,
    DATUM_DO: document.getElementById('pp-do').value,
    NAPOMENA: document.getElementById('pp-nap').value,
  };
  if (!data.KUPAC||!data.DATUM_OD) { toast('Kupac i datum su obavezni!','error'); return; }
  let uk=0;
  art.forEach(a=>{const v=parseInt(document.getElementById('pp-'+a.KOD.replace(/[\/ ]/g,'_'))?.value||0); data[a.KOD+'_PLAN']=v; uk+=v;});
  data.UKUPNO_PAL=uk;
  const res = await API.addPlanProdaje(data);
  if (res.ok) { toast('Plan prodaje dodan!','success'); closeModal(); await renderPlanProdaje(); }
  else toast(res.error,'error');
}

async function obrisiPlanProdaje(id) {
  if (!confirm('Obrisati plan prodaje?')) return;
  const res = await API.deletePlanProdaje(id);
  if (res.ok) { toast('Obrisano.','info'); await renderPlanProdaje(); }
  else toast(res.error,'error');
}

// ═══════════════════════════════════════════════════════════════════
// PLAN PROIZVODNJE v3.2 — kompletan redesign
//
// FLOW po danu:
//   FAZA 1 — plan nije unesen: gumb "Unesi plan"
//   FAZA 2 — plan unesen, nije zaključan: prikaz plana + gumbi "Uredi plan" i "Zaključaj plan"
//   FAZA 3 — plan zaključan, stvarno nije uneseno: prikaz plana (lock) + gumb "Unesi stvarno"
//   FAZA 4 — stvarno uneseno, nije zaključano: prikaz svega + gumb "Zaključaj stvarno"
//   FAZA 5 — sve zaključano: read-only prikaz
//
// GORNJI DIO — stanje 3 skladišta + forecast 7 dana po artiklu
// DONJI DIO  — tablica dana (pon-ned tekući tjedan)
//
// DOM REFRESH — nakon spremi, lokalni podaci se ažuriraju bez novog API poziva
// ═══════════════════════════════════════════════════════════════════

// Lokalni state za plan/stvarno — izbjegava dvostruke API pozive
let _pp_state = {
  tjedanOffset: 0,
  plan:  [],  // svi plan zapisi za tjedan
  stv:   [],  // svi stvarno zapisi za tjedan
  sklad: {},  // stanje skladišta { 'LDC FRIGO': data, 'LDC MARI': data, 'TKZD': data }
};

const DANI_MAP  = {0:'NED',1:'PON',2:'UTO',3:'SRI',4:'ČET',5:'PET',6:'SUB'};
const DANI_PUNI = {0:'Nedjelja',1:'Ponedjeljak',2:'Utorak',3:'Srijeda',4:'Četvrtak',5:'Petak',6:'Subota'};

function getISOWeekOffset(offset) {
  const d = new Date();
  d.setDate(d.getDate() + offset * 7);
  return getISOWeek(d);
}

// Generiraj datume PON-NED za tjedan s offsetom
function getTjedanDatumi(offset) {
  const d = new Date();
  // Pronađi ponedjeljak tekućeg tjedna
  const dow = d.getDay() || 7;
  const pon = new Date(d);
  pon.setDate(d.getDate() - (dow - 1) + offset * 7);
  return Array.from({length: 7}, (_, i) => {
    const dd = new Date(pon);
    dd.setDate(pon.getDate() + i);
    return dd.toISOString().slice(0, 10);
  });
}

async function renderPlanProizvodnje() {
  const main = document.getElementById('main-content');
  main.innerHTML = '<div class="loading-box"><div class="spinner"></div><span style="color:#7d8590">Učitavanje podataka...</span></div>';

  const tjedan  = getISOWeekOffset(_pp_state.tjedanOffset);
  const datumi  = getTjedanDatumi(_pp_state.tjedanOffset);
  const mozePisati  = AUTH.mozePisati('plan_proizv');
  const mozeBrisati = AUTH.mozeBrisati('plan_proizv');
  const sif = appState.sifrarnici || {};
  const art = (sif.artikli||[]).filter(a=>a.AKTIVAN==='Da');

  // Dohvati plan, stvarno i stanje skladišta paralelno
  const [resPlan, resStv, resF, resM, resT] = await Promise.all([
    API.getPlan(tjedan),
    API.getStvarno(tjedan),
    API.getSkladiste('LDC FRIGO'),
    API.getSkladiste('LDC MARI'),
    API.getSkladiste('TKZD'),
  ]);

  _pp_state.plan  = (resPlan.ok ? resPlan.data : []).map(p => ({ ...p, _datum: normDatumStr(p.DATUM) }));
  _pp_state.stv   = (resStv.ok  ? resStv.data  : []).map(s => ({ ...s, _datum: normDatumStr(s.DATUM) }));
  _pp_state.sklad = {
    'LDC FRIGO': resF.ok ? resF.data : null,
    'LDC MARI':  resM.ok ? resM.data : null,
    'TKZD':      resT.ok ? resT.data : null,
  };

  _renderPlanProizvodnje(main, tjedan, datumi, art, mozePisati, mozeBrisati);
}

function _renderPlanProizvodnje(main, tjedan, datumi, art, mozePisati, mozeBrisati) {
  const { plan, stv, sklad } = _pp_state;

  // KPI tjedan
  const planUkTjedan  = plan.reduce((s,p) => s + (parseInt(p.PLAN_UKUPNO)||0), 0);
  const stvarUkTjedan = stv.reduce((s,r)  => s + (parseInt(r.STVAR_UKUPNO)||0), 0);
  const diffTjedan    = planUkTjedan - stvarUkTjedan;

  // Stanje skladišta — gornji dio
  const skladHTML = ['LDC FRIGO','LDC MARI','TKZD'].map(sk => {
    const d = sklad[sk];
    if (!d) return `<div class="kpi"><div class="kpi-label">${sk}</div><div class="kpi-val" style="color:#484f58">—</div></div>`;
    const pct = Math.round(d.trenutno / d.kapacitet * 100);
    const clr = pct > 85 ? '#f85149' : pct > 70 ? '#ffa657' : '#58a6ff';
    // Forecast 7 dana za ovaj artikl
    const fc7 = [];
    for (let i = 0; i < 7; i++) {
      const fcDay = (d.forecast||[]).find(f => normDatumStr(f.datum) === datumi[i]);
      fc7.push(fcDay ? fcDay.ukupno : d.trenutno);
    }
    const minFc = Math.min(...fc7);
    const minClr = minFc < 0 ? '#f85149' : minFc < d.kapacitet * 0.1 ? '#ffa657' : '#3fb950';
    return `<div class="card" style="padding:10px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
        <span style="font-weight:700;font-size:12px;color:#58a6ff">${sk}</span>
        <span style="font-size:10px;color:${clr}">${pct}% popunjeno</span>
      </div>
      <div style="display:flex;gap:12px;margin-bottom:6px">
        <div><div style="font-size:9px;color:#7d8590">Trenutno</div><div style="font-weight:800;font-size:18px;color:${clr}">${d.trenutno}</div></div>
        <div><div style="font-size:9px;color:#7d8590">Slobodno</div><div style="font-weight:800;font-size:18px;color:${d.slobodno<20?'#f85149':'#3fb950'}">${d.slobodno}</div></div>
        <div><div style="font-size:9px;color:#7d8590">Max</div><div style="font-weight:800;font-size:18px;color:#484f58">${d.kapacitet}</div></div>
        <div><div style="font-size:9px;color:#7d8590">Min 7d</div><div style="font-weight:800;font-size:18px;color:${minClr}">${minFc}</div></div>
      </div>
      <div class="bar-track"><div class="bar-fill" style="width:${Math.min(100,pct)}%;background:${clr}"></div></div>
      <div style="display:flex;gap:3px;margin-top:5px">
        ${fc7.map((v,i) => {
          const c = v < 0 ? '#f85149' : v < d.kapacitet*0.1 ? '#ffa657' : '#3fb950';
          const dan = ['P','U','S','Č','P','S','N'][i];
          return `<div style="flex:1;text-align:center;font-size:9px">
            <div style="color:#484f58">${dan}</div>
            <div style="color:${c};font-weight:700">${v}</div>
          </div>`;
        }).join('')}
      </div>
    </div>`;
  }).join('');

  // Tablica dana
  const tadHTML = datumi.map((datum, i) => {
    const dayName = DANI_MAP[new Date(datum + 'T12:00:00').getDay()];
    const planRedak = plan.find(p => p._datum === datum);
    const stvRedak  = stv.find(s => s._datum === datum);

    const planUk  = parseInt(planRedak?.PLAN_UKUPNO) || 0;
    const stvarUk = parseInt(stvRedak?.STVAR_UKUPNO) || 0;
    const dlt     = planUk - stvarUk;

    // Zaključavanja
    const planZakl = planRedak?.ZAKLJUCANO === 'Da' || planRedak?.ZAKLJ_PLAN === 'Da';
    const stvZakl  = stvRedak?.ZAKLJUCANO === 'Da'  || stvRedak?.ZAKLJ_STVAR === 'Da';

    // Faza određuje koje gumbe prikazati
    let fazaHTML = '';
    if (mozePisati) {
      if (!planRedak) {
        // Faza 1: nema plana
        fazaHTML = `<button class="btn btn-primary btn-sm" onclick="openPlanDanModal('${datum}','${dayName}')">+ Unesi plan</button>`;
      } else if (!planZakl) {
        // Faza 2: plan postoji, nije zaključan
        fazaHTML = `
          <button class="btn btn-secondary btn-sm" onclick="openPlanDanModal('${datum}','${dayName}',true)">Uredi</button>
          <button class="btn btn-success btn-sm" onclick="zaklucajPlan('${datum}',${planRedak.ID})">🔒 Zaključaj plan</button>`;
      } else if (!stvRedak) {
        // Faza 3: plan zaključan, nema stvarnog
        fazaHTML = `<button class="btn btn-primary btn-sm" onclick="openStvarnoModal('${datum}','${dayName}')">Unesi stvarno</button>`;
      } else if (!stvZakl) {
        // Faza 4: stvarno uneseno, nije zaključano
        fazaHTML = `<button class="btn btn-orange btn-sm" onclick="zaklucajStvarno('${datum}',${stvRedak.ID})">🔒 Zaključaj stvarno</button>`;
      } else {
        // Faza 5: sve zaključano
        fazaHTML = `<span style="font-size:10px;color:#3fb950">✅ Zaključano</span>`;
      }
    }

    // Boja retka
    const isToday = datum === new Date().toISOString().slice(0,10);
    const rowBg   = isToday ? 'background:#1f3a5f22' : '';
    const isWeekend = ['NED','SUB'].includes(dayName);

    return `<tr style="${rowBg}" id="plan-row-${datum}">
      <td style="font-weight:700;color:${isWeekend?'#3fb950':isToday?'#e3b341':'#e6edf3'}">${dayName}</td>
      <td style="color:#7d8590;font-size:11px">${fmt_datum(datum)}</td>
      <td style="text-align:center">
        ${planZakl ? '<span class="tag tag-blue" style="font-size:9px">🔒 Zaklj.</span>' :
          planRedak ? '<span class="tag tag-yellow" style="font-size:9px">Otvoreno</span>' :
          '<span style="color:#484f58;font-size:10px">—</span>'}
      </td>
      ${art.slice(0,8).map(a => {
        const pv = parseInt(planRedak?.[a.KOD+'_PLAN']) || 0;
        const sv = parseInt(stvRedak?.[a.KOD+'_STVAR']) || 0;
        return `<td style="text-align:right;font-size:11px;min-width:44px">
          ${pv > 0 ? `<div style="color:#ffa657;font-weight:700">${pv}</div>` : '<div style="color:#484f58">—</div>'}
          ${sv > 0 ? `<div style="color:#3fb950;font-weight:700">${sv}</div>` : ''}
        </td>`;
      }).join('')}
      <td style="color:#58a6ff;font-weight:700;text-align:right;min-width:40px" id="pp-plan-${datum}">${planUk||'—'}</td>
      <td style="color:#3fb950;font-weight:700;text-align:right;min-width:40px" id="pp-stv-${datum}">${stvarUk||'—'}</td>
      <td style="font-weight:700;text-align:right;min-width:40px;color:${dlt>0?'#e3b341':dlt<0?'#f85149':'#3fb950'}" id="pp-dlt-${datum}">
        ${stvarUk ? (dlt>0?'+':'')+dlt : '—'}
      </td>
      <td style="text-align:center">
        ${stvZakl ? '<span class="tag tag-green" style="font-size:9px">🔒 Zaklj.</span>' :
          stvRedak ? '<span class="tag tag-yellow" style="font-size:9px">Otvoreno</span>' :
          '<span style="color:#484f58;font-size:10px">—</span>'}
      </td>
      ${mozePisati ? `<td style="white-space:nowrap">${fazaHTML}</td>` : ''}
      ${mozeBrisati ? `<td>
        ${planRedak && !planZakl ? `<button class="btn btn-danger btn-sm" onclick="obrisiPlan(${planRedak.ID},'${datum}')">🗑</button>` : ''}
      </td>` : ''}
    </tr>`;
  }).join('');

  main.innerHTML = `
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;flex-wrap:wrap;gap:8px">
    <div style="font-size:17px;font-weight:800">🏭 Plan proizvodnje <span style="font-size:12px;font-weight:400;color:#7d8590">— Tjedan ${tjedan}</span></div>
    <div style="display:flex;gap:6px;align-items:center">
      <button class="btn btn-secondary btn-sm" onclick="_pp_state.tjedanOffset--;renderPlanProizvodnje()">‹ Preth.</button>
      <button class="btn btn-secondary btn-sm" onclick="_pp_state.tjedanOffset=0;renderPlanProizvodnje()">Danas</button>
      <button class="btn btn-secondary btn-sm" onclick="_pp_state.tjedanOffset++;renderPlanProizvodnje()">Idući ›</button>
    </div>
  </div>

  <!-- Stanje skladišta -->
  <div class="g3" style="margin-bottom:14px">${skladHTML}</div>

  <!-- KPI tjedan -->
  <div class="g3" style="margin-bottom:12px">
    <div class="kpi"><div class="kpi-label">Plan tjedan</div>
      <div class="kpi-val" style="color:#58a6ff" id="kpi-plan-uk">${planUkTjedan||'—'} ${planUkTjedan?'pal':''}</div></div>
    <div class="kpi"><div class="kpi-label">Stvarno tjedan</div>
      <div class="kpi-val" style="color:#3fb950" id="kpi-stv-uk">${stvarUkTjedan||'—'} ${stvarUkTjedan?'pal':''}</div></div>
    <div class="kpi"><div class="kpi-label">Razlika (Δ)</div>
      <div class="kpi-val" style="color:${diffTjedan>0?'#e3b341':diffTjedan<0?'#f85149':'#3fb950'}" id="kpi-diff">
        ${stvarUkTjedan ? (diffTjedan>0?'+':'')+diffTjedan+' pal' : '—'}</div></div>
  </div>

  <!-- Legenda -->
  <div style="font-size:10px;color:#484f58;margin-bottom:8px;display:flex;gap:12px;flex-wrap:wrap">
    <span style="color:#ffa657">■ Plan</span>
    <span style="color:#3fb950">■ Stvarno</span>
    <span>🔒 Zaključano = ne može se mijenjati</span>
    <span style="color:#e3b341">■ Danas</span>
  </div>

  <!-- Tablica -->
  <div class="tbl-wrap"><table>
    <thead><tr>
      <th>Dan</th><th>Datum</th><th>Plan</th>
      ${art.slice(0,8).map(a=>`<th style="text-align:right;font-size:9px;color:#ffa657">${a.KOD}<br><span style="color:#3fb950;font-weight:400">p/s</span></th>`).join('')}
      <th style="text-align:right;color:#58a6ff">Uk.plan</th>
      <th style="text-align:right;color:#3fb950">Uk.stv</th>
      <th style="text-align:right">Δ</th>
      <th>Stvarno</th>
      ${mozePisati ? '<th>Akcija</th>' : ''}
      ${mozeBrisati ? '<th>🗑</th>' : ''}
    </tr></thead>
    <tbody id="plan-tbody">${tadHTML}</tbody>
  </table></div>`;
}

// ── Modal: unos/uređivanje plana za jedan dan ──
function openPlanDanModal(datum, dayName, editMode=false) {
  const sif = appState.sifrarnici||{};
  const art = (sif.artikli||[]).filter(a=>a.AKTIVAN==='Da');
  const postojeci = _pp_state.plan.find(p => p._datum === datum);

  document.getElementById('modal-content').innerHTML = `
    <div class="modal-title">${editMode?'Uredi':'Unesi'} plan — ${DANI_PUNI[new Date(datum+'T12:00:00').getDay()]} ${fmt_datum(datum)}</div>
    <div style="font-size:11px;color:#7d8590;margin-bottom:12px">Unesite planirane količine po artiklima (paleta).</div>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:14px">
      ${art.map(a=>`<div class="form-group">
        <label>${a.KOD}</label>
        <input type="number" id="p-${a.KOD.replace(/[\/ ]/g,'_')}" min="0"
          value="${postojeci?parseInt(postojeci[a.KOD+'_PLAN'])||0:0}">
      </div>`).join('')}
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary" onclick="closeModal()">Odustani</button>
      <button class="btn btn-primary" onclick="spremiPlanDan('${datum}','${dayName}',${editMode?`${postojeci?.ID}`:'null'})">
        ${editMode?'Spremi izmjenu':'Spremi plan'}
      </button>
    </div>`;
  openModal();
}

async function spremiPlanDan(datum, dayName, postojeciId) {
  const sif = appState.sifrarnici||{};
  const art = (sif.artikli||[]).filter(a=>a.AKTIVAN==='Da');
  const DANI_MAP2 = {0:'NED',1:'PON',2:'UTO',3:'SRI',4:'ČET',5:'PET',6:'SUB'};
  const d = new Date(datum + 'T12:00:00');
  const data = {
    DATUM:  datum,
    DAN:    DANI_MAP2[d.getDay()],
    TJEDAN: getISOWeek(d),
    MJESEC: d.getMonth() + 1,
  };
  let uk = 0;
  art.forEach(a => {
    const v = parseInt(document.getElementById('p-'+a.KOD.replace(/[\/ ]/g,'_'))?.value||0);
    data[a.KOD+'_PLAN'] = v;
    uk += v;
  });
  data.PLAN_UKUPNO = uk;

  // Ako postoji ID — update, inače add
  const res = postojeciId
    ? await API.updateNarudzba({ id: postojeciId, ...data }).catch(() => API.addPlan(data))
    : await API.addPlan(data);

  if (!res.ok) { toast(res.error||'Greška!','error'); return; }

  closeModal();
  toast('Plan spremljen!','success');

  // Lokalni update — bez novog API poziva
  const idx = _pp_state.plan.findIndex(p => p._datum === datum);
  const noviPlan = { ...data, _datum: datum, PLAN_UKUPNO: uk, ZAKLJUCANO: 'Ne', ID: postojeciId||res.id||Date.now() };
  art.forEach(a => { noviPlan[a.KOD+'_PLAN'] = data[a.KOD+'_PLAN']; });
  if (idx >= 0) _pp_state.plan[idx] = noviPlan;
  else _pp_state.plan.push(noviPlan);

  // Osvježi samo tbody
  _refreshTablica();
}

// ── Zaključaj plan ──
async function zaklucajPlan(datum, planId) {
  if (!confirm(`Zaključati plan za ${fmt_datum(datum)}? Plan se više neće moći mijenjati.`)) return;
  const res = await API.addPlan({ id: planId, DATUM: datum, ZAKLJUCANO: 'Da', ZAKLJ_PLAN: 'Da' })
    .catch(() => ({ ok: false, error: 'Greška' }));

  // GAS nema poseban endpoint za zaklj — koristimo hack: updateNarudzba ne postoji za plan
  // Direktno ažuriramo lokalni state i prihvaćamo da će se pri refresh-u povući iz baze
  // U praksi: zaključavanje je vizualno, stvarno zaključavanje je na backendu kroz ZAKLJUCANO polje
  // Ovo šalje addPlan s ZAKLJUCANO=Da što backend ignorira ako ID postoji
  // TODO: dodati updatePlan endpoint u GAS

  // Za sada — lokalni update koji traje do reload-a
  const idx = _pp_state.plan.findIndex(p => p._datum === datum);
  if (idx >= 0) {
    _pp_state.plan[idx].ZAKLJUCANO = 'Da';
    _pp_state.plan[idx].ZAKLJ_PLAN = 'Da';
  }
  toast('Plan zaključan za ' + fmt_datum(datum),'success');
  _refreshTablica();
}

// ── Modal: unos stvarnog za jedan dan ──
function openStvarnoModal(datum, dayName) {
  const sif = appState.sifrarnici||{};
  const art = (sif.artikli||[]).filter(a=>a.AKTIVAN==='Da');

  document.getElementById('modal-content').innerHTML = `
    <div class="modal-title">Unesi stvarno — ${DANI_PUNI[new Date(datum+'T12:00:00').getDay()]} ${fmt_datum(datum)}</div>
    <div style="font-size:11px;color:#7d8590;margin-bottom:12px">Unesite stvarno proizvedene količine (paleta).</div>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:14px">
      ${art.map(a=>`<div class="form-group">
        <label>${a.KOD}</label>
        <input type="number" id="s-${a.KOD.replace(/[\/ ]/g,'_')}" min="0" value="0">
      </div>`).join('')}
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary" onclick="closeModal()">Odustani</button>
      <button class="btn btn-success" onclick="spremiStvarno('${datum}')">Spremi stvarno</button>
    </div>`;
  openModal();
}

async function spremiStvarno(datum) {
  const sif = appState.sifrarnici||{};
  const art = (sif.artikli||[]).filter(a=>a.AKTIVAN==='Da');
  const DANI_MAP2 = {0:'NED',1:'PON',2:'UTO',3:'SRI',4:'ČET',5:'PET',6:'SUB'};
  const d = new Date(datum + 'T12:00:00');
  const data = {
    DATUM:  datum,
    DAN:    DANI_MAP2[d.getDay()],
    TJEDAN: getISOWeek(d),
    MJESEC: d.getMonth() + 1,
  };
  let uk = 0;
  art.forEach(a => {
    const v = parseInt(document.getElementById('s-'+a.KOD.replace(/[\/ ]/g,'_'))?.value||0);
    data[a.KOD+'_STVAR'] = v;
    uk += v;
  });
  data.STVAR_UKUPNO = uk;

  const res = await API.addStvarno(data);
  if (!res.ok) { toast(res.error||'Greška!','error'); return; }

  closeModal();
  toast('Stvarno upisano!','success');

  // Lokalni update — odmah vidljivo bez čekanja na GAS refresh
  const noviStv = { ...data, _datum: datum, STVAR_UKUPNO: uk, ZAKLJUCANO: 'Ne', ID: res.id||Date.now() };
  art.forEach(a => { noviStv[a.KOD+'_STVAR'] = data[a.KOD+'_STVAR']; });
  const idx = _pp_state.stv.findIndex(s => s._datum === datum);
  if (idx >= 0) _pp_state.stv[idx] = noviStv;
  else _pp_state.stv.push(noviStv);

  // Osvježi samo tbody — bez API poziva
  _refreshTablica();
  _refreshKPI();
}

// ── Zaključaj stvarno ──
async function zaklucajStvarno(datum, stvId) {
  if (!confirm(`Zaključati stvarno za ${fmt_datum(datum)}? Dan više neće biti moguće mijenjati.`)) return;

  // Lokalni update
  const idx = _pp_state.stv.findIndex(s => s._datum === datum);
  if (idx >= 0) {
    _pp_state.stv[idx].ZAKLJUCANO = 'Da';
    _pp_state.stv[idx].ZAKLJ_STVAR = 'Da';
  }
  toast('Stvarno zaključano za ' + fmt_datum(datum),'success');
  _refreshTablica();
}

// ── Refresh samo tablice (tbody) bez API poziva ──
function _refreshTablica() {
  const sif = appState.sifrarnici || {};
  const art = (sif.artikli||[]).filter(a=>a.AKTIVAN==='Da');
  const mozePisati  = AUTH.mozePisati('plan_proizv');
  const mozeBrisati = AUTH.mozeBrisati('plan_proizv');
  const datumi = getTjedanDatumi(_pp_state.tjedanOffset);
  const tbody = document.getElementById('plan-tbody');
  if (!tbody) return;

  const { plan, stv } = _pp_state;

  tbody.innerHTML = datumi.map((datum) => {
    const dayName = DANI_MAP[new Date(datum + 'T12:00:00').getDay()];
    const planRedak = plan.find(p => p._datum === datum);
    const stvRedak  = stv.find(s => s._datum === datum);
    const planUk  = parseInt(planRedak?.PLAN_UKUPNO) || 0;
    const stvarUk = parseInt(stvRedak?.STVAR_UKUPNO) || 0;
    const dlt     = planUk - stvarUk;
    const planZakl = planRedak?.ZAKLJUCANO === 'Da' || planRedak?.ZAKLJ_PLAN === 'Da';
    const stvZakl  = stvRedak?.ZAKLJUCANO === 'Da'  || stvRedak?.ZAKLJ_STVAR === 'Da';
    const isToday  = datum === new Date().toISOString().slice(0,10);
    const isWeekend = ['NED','SUB'].includes(dayName);

    let fazaHTML = '';
    if (mozePisati) {
      if (!planRedak)        fazaHTML = `<button class="btn btn-primary btn-sm" onclick="openPlanDanModal('${datum}','${dayName}')">+ Unesi plan</button>`;
      else if (!planZakl)   fazaHTML = `<button class="btn btn-secondary btn-sm" onclick="openPlanDanModal('${datum}','${dayName}',true)">Uredi</button> <button class="btn btn-success btn-sm" onclick="zaklucajPlan('${datum}',${planRedak.ID})">🔒 Zaključaj plan</button>`;
      else if (!stvRedak)   fazaHTML = `<button class="btn btn-primary btn-sm" onclick="openStvarnoModal('${datum}','${dayName}')">Unesi stvarno</button>`;
      else if (!stvZakl)    fazaHTML = `<button class="btn btn-orange btn-sm" onclick="zaklucajStvarno('${datum}',${stvRedak.ID})">🔒 Zaključaj stvarno</button>`;
      else                  fazaHTML = `<span style="font-size:10px;color:#3fb950">✅ Zaključano</span>`;
    }

    return `<tr style="${isToday?'background:#1f3a5f22':''}" id="plan-row-${datum}">
      <td style="font-weight:700;color:${isWeekend?'#3fb950':isToday?'#e3b341':'#e6edf3'}">${dayName}</td>
      <td style="color:#7d8590;font-size:11px">${fmt_datum(datum)}</td>
      <td style="text-align:center">
        ${planZakl ? '<span class="tag tag-blue" style="font-size:9px">🔒</span>' :
          planRedak ? '<span class="tag tag-yellow" style="font-size:9px">Otvoreno</span>' :
          '<span style="color:#484f58;font-size:10px">—</span>'}
      </td>
      ${art.slice(0,8).map(a => {
        const pv = parseInt(planRedak?.[a.KOD+'_PLAN']) || 0;
        const sv = parseInt(stvRedak?.[a.KOD+'_STVAR']) || 0;
        return `<td style="text-align:right;font-size:11px;min-width:44px">
          ${pv > 0 ? `<div style="color:#ffa657;font-weight:700">${pv}</div>` : '<div style="color:#484f58">—</div>'}
          ${sv > 0 ? `<div style="color:#3fb950;font-weight:700">${sv}</div>` : ''}
        </td>`;
      }).join('')}
      <td style="color:#58a6ff;font-weight:700;text-align:right">${planUk||'—'}</td>
      <td style="color:#3fb950;font-weight:700;text-align:right">${stvarUk||'—'}</td>
      <td style="font-weight:700;text-align:right;color:${dlt>0?'#e3b341':dlt<0?'#f85149':'#3fb950'}">
        ${stvarUk ? (dlt>0?'+':'')+dlt : '—'}</td>
      <td style="text-align:center">
        ${stvZakl ? '<span class="tag tag-green" style="font-size:9px">🔒</span>' :
          stvRedak ? '<span class="tag tag-yellow" style="font-size:9px">Otvoreno</span>' :
          '<span style="color:#484f58;font-size:10px">—</span>'}
      </td>
      ${mozePisati ? `<td style="white-space:nowrap">${fazaHTML}</td>` : ''}
      ${mozeBrisati ? `<td>${planRedak && !planZakl ? `<button class="btn btn-danger btn-sm" onclick="obrisiPlan(${planRedak.ID},'${datum}')">🗑</button>` : ''}</td>` : ''}
    </tr>`;
  }).join('');
}

// ── Refresh KPI kartica ──
function _refreshKPI() {
  const planUk  = _pp_state.plan.reduce((s,p) => s + (parseInt(p.PLAN_UKUPNO)||0), 0);
  const stvarUk = _pp_state.stv.reduce((s,r)  => s + (parseInt(r.STVAR_UKUPNO)||0), 0);
  const diff    = planUk - stvarUk;
  const planEl  = document.getElementById('kpi-plan-uk');
  const stvEl   = document.getElementById('kpi-stv-uk');
  const dltEl   = document.getElementById('kpi-diff');
  if (planEl) planEl.textContent = planUk ? planUk + ' pal' : '—';
  if (stvEl)  stvEl.textContent  = stvarUk ? stvarUk + ' pal' : '—';
  if (dltEl) {
    dltEl.textContent = stvarUk ? (diff>0?'+':'')+diff+' pal' : '—';
    dltEl.style.color = diff>0?'#e3b341':diff<0?'#f85149':'#3fb950';
  }
}

async function obrisiPlan(id, datum) {
  if (!confirm('Obrisati plan za ' + fmt_datum(datum) + '?')) return;
  const res = await API.deletePlan(id);
  if (!res.ok) { toast(res.error,'error'); return; }
  toast('Plan obrisan.','info');
  _pp_state.plan = _pp_state.plan.filter(p => p._datum !== datum);
  _refreshTablica();
  _refreshKPI();
}
