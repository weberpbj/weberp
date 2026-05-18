// weberp-bj v2.0 | views_main.js | Dashboard · Kalendar · Narudžbe · Vozač

// ═══════════════════════════════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════════════════════════════
async function renderDashboard() {
  const [resDash, resF, resM] = await Promise.all([
    API.getDashboard(), API.getSkladiste('LDC FRIGO'), API.getSkladiste('LDC MARI')
  ]);
  const main = document.getElementById('main-content');
  if (!resDash.ok) { main.innerHTML = err(resDash.error); return; }
  const d = resDash.data;
  const f = resF.ok ? resF.data : null;
  const m = resM.ok ? resM.data : null;

  const barF = f ? Math.min(100, Math.round(f.trenutno/f.kapacitet*100)) : 0;
  const barM = m ? Math.min(100, Math.round(m.trenutno/m.kapacitet*100)) : 0;
  const cF = barF>85?'#f85149':barF>70?'#ffa657':'#6366f1';
  const cM = barM>85?'#f85149':barM>70?'#ffa657':'#8b5cf6';

  main.innerHTML = `
  <div style="font-size:17px;font-weight:800;margin-bottom:14px">📊 Dashboard</div>
  <div class="g4" style="margin-bottom:12px">
    ${kpi('Aktivnih narudžbi', d.aktivnih_narudzbi, 'u dostavi / najavljeno', '#58a6ff')}
    ${kpi('Danas utovara', d.danasnje_dostave, 'planiranih utovara', '#79c0ff')}
    ${kpi('Otvoreni alarmi', d.otvoreni_alarmi, 'zahtijevaju akciju', d.otvoreni_alarmi>0?'#f85149':'#3fb950')}
    ${kpi('Plan tjedan', d.plan_tjedan, 'pal · stvarno: '+d.stvarno_tjedan, '#e3b341')}
  </div>
  <div class="g2">
    <div class="card">
      <div class="card-title">🏪 Popunjenost skladišta</div>
      ${f?`<div class="bar-wrap">
        <div class="bar-header"><span style="font-weight:600">LDC FRIGO</span>
          <span style="color:${cF}">${f.trenutno}/${f.kapacitet} pal (${barF}%)</span></div>
        <div class="bar-track"><div class="bar-fill" style="width:${barF}%;background:${cF}"></div></div>
        <div style="font-size:10px;color:#7d8590;margin-top:2px">Slobodno: ${f.slobodno} pal</div>
      </div>`:''}
      ${m?`<div class="bar-wrap">
        <div class="bar-header"><span style="font-weight:600">LDC MARI</span>
          <span style="color:${cM}">${m.trenutno}/${m.kapacitet} pal (${barM}%)</span></div>
        <div class="bar-track"><div class="bar-fill" style="width:${barM}%;background:${cM}"></div></div>
        <div style="font-size:10px;color:${barM>85?'#f85149':'#7d8590'};margin-top:2px">
          ${barM>85?'⚠ ':''}Slobodno: ${m.slobodno} pal</div>
      </div>`:''}
      <div style="margin-top:8px">
        <button class="btn btn-secondary btn-sm" onclick="showView('skladista')">→ Detalji skladišta</button>
      </div>
    </div>
    <div class="card">
      <div class="card-title">⚡ Brze akcije</div>
      ${AUTH.mozePisati('narudzbe')?`<button class="btn btn-primary" style="width:100%;margin-bottom:8px" onclick="showView('priprema')">+ Nova narudžba</button>`:''}
      ${AUTH.mozePisati('plan_proizv')?`<button class="btn btn-secondary" style="width:100%;margin-bottom:8px" onclick="showView('plan_proizv')">+ Unos plana proizvodnje</button>`:''}
      ${AUTH.imaOvlast('projekcija')?`<button class="btn btn-orange" style="width:100%;margin-bottom:8px" onclick="showView('projekcija')">🎯 Tjedna projekcija</button>`:''}
      <button class="btn btn-secondary" style="width:100%;margin-bottom:8px" onclick="showView('kalendar')">📅 Otvori kalendar</button>
      <button class="btn btn-secondary" style="width:100%" onclick="showView('prijevoz')">🚚 Raspored prijevoza</button>
    </div>
  </div>
  <div style="font-size:10px;color:#484f58;text-align:right">
    Zadnje osvježeno: ${new Date(d.zadnja_osvjezeno).toLocaleTimeString('hr-HR')}
  </div>`;
}

// ═══════════════════════════════════════════════════════════════════
// KALENDAR — Excel-style horizontalni tjedni prikaz
// ═══════════════════════════════════════════════════════════════════
let _cal_year  = new Date().getFullYear();
let _cal_month = new Date().getMonth() + 1;
let _cal_woff  = 0; // tjedni offset od prvog tjedna tog mjeseca

async function renderKalendar() {
  const main = document.getElementById('main-content');
  main.innerHTML = `
  <div style="font-size:17px;font-weight:800;margin-bottom:12px">📅 Kalendar</div>
  <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;flex-wrap:wrap">
    <button class="btn btn-secondary" onclick="kalPrev()">‹ Preth. tjedan</button>
    <div id="kal-label" style="font-size:13px;font-weight:800;min-width:240px;text-align:center"></div>
    <button class="btn btn-secondary" onclick="kalNext()">Sljed. tjedan ›</button>
    <select id="kal-mj" class="filter-input" style="width:130px" onchange="kalGoMj()">
      ${['Siječanj','Veljača','Ožujak','Travanj','Svibanj','Lipanj','Srpanj','Kolovoz','Rujan','Listopad','Studeni','Prosinac']
        .map((mj,i)=>`<option value="${i+1}" ${i+1===_cal_month?'selected':''}>${mj}</option>`).join('')}
    </select>
    <select id="kal-god" class="filter-input" style="width:80px" onchange="kalGoGod()">
      ${[2025,2026,2027,2028].map(y=>`<option value="${y}" ${y===_cal_year?'selected':''}>${y}</option>`).join('')}
    </select>
    <button class="btn btn-secondary" onclick="kalDanas()">Danas</button>
    <span style="font-size:9px;color:#7d8590;margin-left:auto">💡 Stupci = narudžbe tog dana &nbsp;·&nbsp; scroll →</span>
  </div>
  <div id="kal-content"><div class="loading-box"><div class="spinner"></div></div></div>
  <div style="display:flex;gap:12px;font-size:9px;color:#7d8590;flex-wrap:wrap;margin-top:8px">
    <span><span style="display:inline-block;width:10px;height:10px;background:#1f3a5f;border:1px solid #58a6ff44;border-radius:2px;margin-right:3px"></span>Vrijednost &gt; 0</span>
    <span><span style="display:inline-block;width:10px;height:10px;background:#0d2a0d;border:1px solid #3fb95044;border-radius:2px;margin-right:3px"></span>Ukupno</span>
    <span><span style="display:inline-block;width:10px;height:10px;background:#2a1a0d;border:1px solid #ffa65744;border-radius:2px;margin-right:3px"></span>Plan proiz.</span>
    <span><span style="display:inline-block;width:10px;height:10px;background:#1c1c2e;border:1px solid #3d306044;border-radius:2px;margin-right:3px"></span>Saldo</span>
    <span><span class="tag tag-blue" style="font-size:8px;padding:0 4px">Dostava</span></span>
    <span><span class="tag tag-purple" style="font-size:8px;padding:0 4px">Prijenos</span></span>
    <span><span class="tag tag-orange" style="font-size:8px;padding:0 4px">Akcija</span></span>
  </div>`;
  await kalLoad();
}

function kalGetDates() {
  // Pronađi prvi ponedjeljak tjedna koji sadrži 1. dan _cal_month/_cal_year + offset
  const d1 = new Date(_cal_year, _cal_month-1, 1);
  const dow = d1.getDay() || 7; // ponedjeljak = 1
  const prviPon = new Date(d1.getTime() - (dow-1)*86400000 + _cal_woff*7*86400000);
  return Array.from({length:7}, (_,i) => new Date(prviPon.getTime()+i*86400000));
}

async function kalLoad() {
  const dates = kalGetDates();
  const pon = dates[0], ned = dates[6];
  const isoW = getISOWeek(pon);
  const lbl = document.getElementById('kal-label');
  if (lbl) lbl.textContent = `Tjedan ${isoW}  ·  ${fmt_datum(pon.toISOString().slice(0,10))} – ${fmt_datum(ned.toISOString().slice(0,10))}`;

  // Dohvati podatke za sve relevantne mjesece
  const mjs = [...new Set(dates.map(d=>d.getMonth()+1))];
  let allData = {};
  await Promise.all(mjs.map(async mj => {
    const god = dates.find(d=>d.getMonth()+1===mj).getFullYear();
    const res = await API.getKalendar(god, mj);
    if (res.ok) Object.assign(allData, res.data);
  }));

  kalBuild(dates, allData);
}

function kalBuild(dates, allData) {
  const DAN = ['NED','PON','UTO','SRI','ČET','PET','SUB'];
  const danas = new Date().toISOString().slice(0,10);
  const MAX_NAR = 6; // max stupaca narudžbi po danu

  const daniInfo = dates.map(d => {
    const ds = d.toISOString().slice(0,10);
    const info = allData[ds] || {};
    return { ds, dow: d.getDay(), nar: info.narudzbe||[], plan: info.plan_pal||0, isToday: ds===danas };
  });

  // Utvrdi koje artikle prikazati (oni s bar. jednom vrijednošću > 0)
  const artSet = ARTIKLI.filter(a => daniInfo.some(di => di.nar.some(n => parseInt(n[a]||0)>0)));
  const artPrik = artSet.length ? artSet : ARTIKLI.slice(0,5);

  let h = '<div class="kal-outer"><table class="kal-tbl">';

  // ── RED 1: Dan nazivi ──
  h += '<tr><td class="rl" style="border:1px solid #30363d"></td>';
  daniInfo.forEach(di => {
    const n = di.nar.slice(0,MAX_NAR);
    const extra = di.nar.length > MAX_NAR ? di.nar.length-MAX_NAR : 0;
    const cols = Math.max(1,n.length) + 3; // saldo + narudžbe(min1) + ukupno + proiz
    const isWk = di.dow===0||di.dow===6;
    const cls  = isWk?'dh sub':di.isToday?'dh tod':'dh';
    h += `<td class="${cls}" colspan="${cols}">${DAN[di.dow]}
      <span style="font-size:9px;font-weight:400;opacity:.7">&nbsp;${di.ds.slice(8)}.${di.ds.slice(5,7)}.</span>
      ${extra?`<span style="font-size:9px;color:#ffa657"> +${extra}</span>`:''}
    </td>`;
  });
  h += '</tr>';

  // ── RED 2: Zaglavlja stupaca (saldo | kupci | ukupno | proiz) ──
  h += '<tr><td class="rl">KUPAC / INFO</td>';
  daniInfo.forEach(di => {
    const n = di.nar.slice(0,MAX_NAR);
    h += `<td class="sh">SALDO</td>`;
    if (n.length) {
      n.forEach(nr => {
        const tCls = nr.tip==='P'?'tag-purple':nr.tip==='A'?'tag-orange':'tag-blue';
        const tLbl = nr.tip==='P'?'Prij.':nr.tip==='A'?'Akc.':'Dost.';
        h += `<td class="nh">
          <div class="nc" title="${nr.kupac}">${nr.kupac}</div>
          <div class="nb">${nr.br_nar||'—'}</div>
          <span class="tag ${tCls}" style="font-size:8px;padding:0 3px">${tLbl}</span>
        </td>`;
      });
    } else {
      h += `<td class="nh" style="color:#484f58;font-style:italic;font-size:9px">—</td>`;
    }
    h += `<td class="uh">UK.</td><td class="ph">PROIZ.</td>`;
  });
  h += '</tr>';

  // ── META: Prijevoz ──
  h += '<tr class="mr"><td class="rl" style="color:#7d8590;font-size:8px">PRIJEVOZ</td>';
  daniInfo.forEach(di => {
    const n = di.nar.slice(0,MAX_NAR);
    h += `<td class="sv"></td>`;
    (n.length?n:[{prijevoz:''}]).forEach(nr => { h += `<td>${nr.prijevoz||'—'}</td>`; });
    h += `<td></td><td></td>`;
  });
  h += '</tr>';

  // ── META: Iz skladišta ──
  h += '<tr class="mr"><td class="rl" style="color:#7d8590;font-size:8px">IZ SKLAD.</td>';
  daniInfo.forEach(di => {
    const n = di.nar.slice(0,MAX_NAR);
    h += `<td class="sv"></td>`;
    (n.length?n:[{iz:''}]).forEach(nr => { h += `<td>${nr.iz||'—'}</td>`; });
    h += `<td></td><td></td>`;
  });
  h += '</tr>';

  // ── META: Utovar ──
  h += '<tr class="mr"><td class="rl" style="color:#7d8590;font-size:8px">UTOVAR</td>';
  daniInfo.forEach(di => {
    const n = di.nar.slice(0,MAX_NAR);
    h += `<td class="sv"></td>`;
    (n.length?n:[{utovar:''}]).forEach(nr => { h += `<td>${nr.utovar?nr.utovar.slice(8)+'.'+nr.utovar.slice(5,7)+'.':'—'}</td>`; });
    h += `<td></td><td></td>`;
  });
  h += '</tr>';

  // ── ARTIKLI ──
  artPrik.forEach(art => {
    h += `<tr class="ar"><td class="rl" style="color:#58a6ff">${art}</td>`;
    daniInfo.forEach(di => {
      const n = di.nar.slice(0,MAX_NAR);
      h += `<td class="sv" style="color:#484f58;font-size:9px">—</td>`;
      let uk = 0;
      if (n.length) {
        n.forEach(nr => {
          const v = parseInt(nr[art])||0;
          uk += v;
          h += `<td class="${v>0?'av hv':'av zr'}">${v>0?v:'·'}</td>`;
        });
      } else {
        h += `<td class="av zr">—</td>`;
      }
      h += `<td class="${uk>0?'uv':'av zr'}">${uk>0?uk:'·'}</td>`;
      h += `<td class="pv" style="color:#484f58">—</td>`;
    });
    h += '</tr>';
  });

  // ── TOTAL ──
  h += '<tr><td class="tl">TOTAL pal</td>';
  daniInfo.forEach(di => {
    const n = di.nar.slice(0,MAX_NAR);
    h += `<td class="sv" style="color:#484f58">—</td>`;
    if (n.length) {
      n.forEach(nr => { h += `<td class="tv2">${parseInt(nr.pal)||0}</td>`; });
    } else {
      h += `<td class="tv2" style="color:#484f58">—</td>`;
    }
    const ukPal = n.reduce((s,nr)=>s+(parseInt(nr.pal)||0),0);
    h += `<td class="tv2" style="color:#3fb950;font-weight:800">${ukPal||'—'}</td>`;
    h += `<td class="pv">${di.plan>0?di.plan:'—'}</td>`;
  });
  h += '</tr>';

  h += '</table></div>';
  const c = document.getElementById('kal-content');
  if (c) c.innerHTML = h;
}

function kalPrev()  { _cal_woff--; kalLoad(); }
function kalNext()  { _cal_woff++; kalLoad(); }
function kalDanas() { _cal_woff=0; _cal_year=new Date().getFullYear(); _cal_month=new Date().getMonth()+1; kalLoad(); }
function kalGoMj()  { _cal_month=parseInt(document.getElementById('kal-mj').value); _cal_woff=0; kalLoad(); }
function kalGoGod() { _cal_year=parseInt(document.getElementById('kal-god').value); _cal_woff=0; kalLoad(); }

// ═══════════════════════════════════════════════════════════════════
// NARUDŽBE
// ═══════════════════════════════════════════════════════════════════
let _nar_all    = [];
let _nar_filter = 'Sve';

async function renderPriprema() {
  const res = await API.getNarudzbe({});
  const main = document.getElementById('main-content');
  if (!res.ok) { main.innerHTML = err(res.error); return; }
  _nar_all = res.data || [];
  const mozePisati  = AUTH.mozePisati('narudzbe');
  const mozeBrisati = AUTH.mozeBrisati('narudzbe');
  main.innerHTML = `
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;flex-wrap:wrap;gap:8px">
    <div style="font-size:17px;font-weight:800">📋 Narudžbe</div>
    ${mozePisati?`<button class="btn btn-primary" onclick="openNarudzbaModal()">+ Nova narudžba</button>`:''}
  </div>
  <div class="filters">
    <input class="filter-input" id="ns" placeholder="Pretraži kupca / br…" oninput="filterNar()" style="width:200px">
    ${['Sve','U dostavi','Najavljeno','Isporučeno','Problem'].map(s=>
      `<button class="filter-btn ${s==='Sve'&&_nar_filter==='Sve'?'active':''}" onclick="setNarF(this,'${s}')">${s}</button>`
    ).join('')}
    <button class="filter-btn" onclick="setNarF(this,'D_tip')">Dostave</button>
    <button class="filter-btn" onclick="setNarF(this,'P_tip')">Prijenosi</button>
    <span class="filters-count" id="nar-count"></span>
  </div>
  <div style="font-size:10px;color:#484f58;margin-bottom:8px">
    📅 Auto-sort po datumu dostave &nbsp;·&nbsp;
    ${mozeBrisati?'🗑 Brisanje dostupno (admin/superuser)':'🔒 Brisanje nije dostupno za vašu ulogu'}
  </div>
  <div class="tbl-wrap">
    <table>
      <thead><tr>
        <th>Tip</th><th>Kupac</th><th>Br. narudžbe</th>
        <th>Dostava</th><th>Utovar</th><th>Iz</th><th>U</th>
        <th>Prijevoz</th><th style="text-align:right">Pal</th><th>Status</th>
        ${mozePisati||mozeBrisati?'<th>Akcija</th>':''}
      </tr></thead>
      <tbody id="nar-tbody"></tbody>
    </table>
  </div>`;
  filterNar();
}

function setNarF(btn, f) {
  document.querySelectorAll('.filter-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  _nar_filter = f;
  filterNar();
}

function filterNar() {
  const s = document.getElementById('ns')?.value.toLowerCase()||'';
  let data = _nar_all;
  if (_nar_filter==='D_tip') data=data.filter(n=>n.TIP==='D');
  else if (_nar_filter==='P_tip') data=data.filter(n=>n.TIP==='P');
  else if (_nar_filter!=='Sve') data=data.filter(n=>n.STATUS===_nar_filter);
  if (s) data=data.filter(n=>String(n.KUPAC).toLowerCase().includes(s)||String(n.BR_NARUDZBE).toLowerCase().includes(s));
  const c=document.getElementById('nar-count'); if(c) c.textContent=data.length+' narudžbi';
  renderNarTbl(data);
}

function renderNarTbl(data) {
  const mp = AUTH.mozePisati('narudzbe'), mb = AUTH.mozeBrisati('narudzbe');
  const tbody = document.getElementById('nar-tbody');
  if (!tbody) return;
  if (!data.length) { tbody.innerHTML=`<tr><td colspan="12" class="tbl-empty">Nema narudžbi.</td></tr>`; return; }
  tbody.innerHTML = data.map(n => {
    const tC = n.TIP==='P'?'tag-purple':n.TIP==='A'?'tag-orange':'tag-blue';
    const tL = n.TIP==='P'?'Prijenos':n.TIP==='A'?'Akcija':'Dostava';
    const sC = n.STATUS==='Isporučeno'?'tag-green':n.STATUS==='Problem'?'tag-red':n.STATUS==='U dostavi'?'tag-blue':'tag-yellow';
    return `<tr>
      <td><span class="tag ${tC}">${tL}</span></td>
      <td style="font-weight:600">${n.KUPAC}</td>
      <td style="font-family:monospace;font-size:10px;color:#7d8590">${n.BR_NARUDZBE||'—'}</td>
      <td style="color:#e3b341;font-weight:600">${fmt_datum(n.DATUM_DOSTAVE)}</td>
      <td style="color:#7d8590">${fmt_datum(n.DATUM_UTOVARA)}</td>
      <td>${n.IZ_SKLADISTA||'—'}</td>
      <td style="color:${n.U_SKLADISTE?'#bc8cff':'#484f58'}">${n.U_SKLADISTE||'—'}</td>
      <td style="color:#7d8590">${n.PRIJEVOZ||'—'}</td>
      <td style="color:#58a6ff;font-weight:700;text-align:right">${n.BR_PALETA_UKUPNO||'—'}</td>
      <td><span class="tag ${sC}">${n.STATUS}</span></td>
      ${mp||mb?`<td style="display:flex;gap:4px">
        ${mp?`<button class="btn btn-secondary btn-sm" onclick="editNarudzba(${n.ID_NARUDZBE})">Uredi</button>`:''}
        ${mb?`<button class="btn btn-danger btn-sm" onclick="obrisiNarudzbu(${n.ID_NARUDZBE})">🗑</button>`:''}
      </td>`:''}
    </tr>`;
  }).join('');
}

function openNarudzbaModal(n) {
  const sif = appState.sifrarnici || {};
  const kupci = (sif.kupci||[]).map(k=>`<option value="${k.NAZIV}" ${n?.KUPAC===k.NAZIV?'selected':''}>${k.NAZIV}</option>`).join('');
  const prij  = (sif.prijevoznici||[]).map(p=>`<option value="${p.NAZIV}" ${n?.PRIJEVOZ===p.NAZIV?'selected':''}>${p.NAZIV}</option>`).join('');
  const sklad = (sif.skladista||[]).map(s=>`<option value="${s.NAZIV}" ${n?.IZ_SKLADISTA===s.NAZIV?'selected':''}>${s.NAZIV}</option>`).join('');
  const sklad2= (sif.skladista||[]).map(s=>`<option value="${s.NAZIV}" ${n?.U_SKLADISTE===s.NAZIV?'selected':''}>${s.NAZIV}</option>`).join('');
  const art   = (sif.artikli||[]).filter(a=>a.AKTIVAN==='Da');
  window._edit_nar_id = n?.ID_NARUDZBE || null;
  document.getElementById('modal-content').innerHTML = `
    <div class="modal-title">${n?'Uredi narudžbu':'Nova narudžba'}</div>
    <div class="form-row col2">
      <div class="form-group"><label>Kupac *</label><select id="f-kupac"><option value="">— Odaberi —</option>${kupci}</select></div>
      <div class="form-group"><label>Tip</label><select id="f-tip">
        <option value="D" ${n?.TIP==='D'||!n?'selected':''}>Dostava kupcu</option>
        <option value="P" ${n?.TIP==='P'?'selected':''}>Prijenos između skladišta</option>
        <option value="A" ${n?.TIP==='A'?'selected':''}>Akcija / Najava</option>
      </select></div>
    </div>
    <div class="form-row col2">
      <div class="form-group"><label>Datum dostave *</label><input type="date" id="f-dd" value="${n?.DATUM_DOSTAVE||''}"></div>
      <div class="form-group"><label>Datum utovara *</label><input type="date" id="f-du" value="${n?.DATUM_UTOVARA||''}"></div>
    </div>
    <div class="form-row col2">
      <div class="form-group"><label>Iz skladišta</label><select id="f-iz"><option value="">— Odaberi —</option>${sklad}</select></div>
      <div class="form-group"><label>U skladište (prijenos)</label><select id="f-u"><option value="">— Nije prijenos —</option>${sklad2}</select></div>
    </div>
    <div class="form-row col2">
      <div class="form-group"><label>Prijevoznik</label><select id="f-prij"><option value="">— Odaberi —</option>${prij}</select></div>
      <div class="form-group"><label>Br. narudžbe</label><input type="text" id="f-brnar" value="${n?.BR_NARUDZBE||''}"></div>
    </div>
    <div class="form-group" style="margin-bottom:10px"><label>Artikli (paleta)</label>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px">
        ${art.map(a=>`<div style="display:flex;align-items:center;gap:4px">
          <label style="font-size:11px;min-width:52px;color:#e6edf3;text-transform:none;letter-spacing:0">${a.KOD}</label>
          <input type="number" id="fa-${a.KOD.replace(/[\/ ]/g,'_')}" min="0" value="${n?n[a.KOD]||0:0}" style="width:60px;text-align:right">
        </div>`).join('')}
      </div>
    </div>
    <div class="form-row col2">
      <div class="form-group"><label>Status</label><select id="f-status">
        ${['U dostavi','Najavljeno','Isporučeno','Problem'].map(s=>`<option ${n?.STATUS===s?'selected':''}>${s}</option>`).join('')}
      </select></div>
      <div class="form-group"><label>Napomena</label><input type="text" id="f-nap" value="${n?.NAPOMENA||''}"></div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary" onclick="closeModal()">Odustani</button>
      <button class="btn btn-primary" onclick="spremiNarudzbu()">Spremi</button>
    </div>`;
  openModal();
}

async function spremiNarudzbu() {
  const sif = appState.sifrarnici || {};
  const art = (sif.artikli||[]).filter(a=>a.AKTIVAN==='Da');
  const data = {
    KUPAC:             document.getElementById('f-kupac').value,
    TIP:               document.getElementById('f-tip').value,
    DATUM_DOSTAVE:     document.getElementById('f-dd').value,
    DATUM_UTOVARA:     document.getElementById('f-du').value,
    IZ_SKLADISTA:      document.getElementById('f-iz').value,
    U_SKLADISTE:       document.getElementById('f-u').value,
    PRIJEVOZ:          document.getElementById('f-prij').value,
    BR_NARUDZBE:       document.getElementById('f-brnar').value,
    STATUS:            document.getElementById('f-status').value,
    NAPOMENA:          document.getElementById('f-nap').value,
  };
  if (!data.KUPAC||!data.DATUM_DOSTAVE) { toast('Kupac i datum dostave su obavezni!','error'); return; }
  art.forEach(a => { data[a.KOD] = parseInt(document.getElementById('fa-'+a.KOD.replace(/[\/ ]/g,'_'))?.value)||0; });
  const res = window._edit_nar_id
    ? await API.updateNarudzba({id:window._edit_nar_id, ...data})
    : await API.addNarudzba(data);
  if (res.ok) { toast(res.msg||'Narudžba spremljena!','success'); closeModal(); await renderPriprema(); }
  else toast(res.error||'Greška!','error');
}

async function editNarudzba(id) {
  const res = await API.getNarudzbe({});
  if (!res.ok) return;
  const n = res.data.find(r=>String(r.ID_NARUDZBE)===String(id));
  if (n) openNarudzbaModal(n);
}

async function obrisiNarudzbu(id) {
  if (!confirm('Obrisati narudžbu #'+id+'? Ova akcija se ne može poništiti.')) return;
  const res = await API.deleteNarudzba(id);
  if (res.ok) { toast('Narudžba obrisana.','info'); await renderPriprema(); }
  else toast(res.error,'error');
}

// ═══════════════════════════════════════════════════════════════════
// VOZAČ
// ═══════════════════════════════════════════════════════════════════
async function renderVozac() {
  const res = await API.getNarudzbe({});
  const main = document.getElementById('main-content');
  if (!res.ok) { main.innerHTML = err(res.error); return; }
  const nar = (res.data||[]).filter(n=>!['Isporučeno'].includes(n.STATUS)||n.VOZAC_POTVRDIO);
  main.innerHTML = `<div style="font-size:17px;font-weight:800;margin-bottom:14px">🚛 Moje dostave</div>
  ${!nar.length
    ? '<div class="card" style="text-align:center;color:#7d8590;padding:32px">Nema aktivnih dostava za danas / sutra.</div>'
    : nar.map(n=>`<div class="vozac-card">
      <div class="vozac-kupac">${n.KUPAC}</div>
      <div class="vozac-info">
        📅 Utovar: <b>${fmt_datum(n.DATUM_UTOVARA)}</b> &nbsp;·&nbsp;
        📦 Dostava: <b>${fmt_datum(n.DATUM_DOSTAVE)}</b> &nbsp;·&nbsp;
        Iz: <b>${n.IZ_SKLADISTA||'—'}</b>${n.U_SKLADISTE?` → <b>${n.U_SKLADISTE}</b>`:''}
      </div>
      <div style="font-size:11px;color:#79c0ff;margin-bottom:10px">Paleta: <b>${n.BR_PALETA_UKUPNO||0}</b></div>
      <div class="vozac-btns">
        ${!n.VOZAC_POTVRDIO?`<button class="btn btn-primary" onclick="vozacPreuzmi(${n.ID_NARUDZBE})">✅ Potvrdi preuzimanje</button>`
          :`<span class="tag tag-green">Preuzeto ✓</span>`}
        ${n.VOZAC_POTVRDIO&&n.STATUS!=='Isporučeno'?`
          <button class="btn btn-success" onclick="vozacIstovarModal(${n.ID_NARUDZBE})">📦 Istovareno</button>
          <button class="btn btn-danger"  onclick="vozacProblemModal(${n.ID_NARUDZBE})">⚠ Problem</button>`:''}
        ${n.STATUS==='Isporučeno'?`<span class="tag tag-green">Isporučeno ✓</span>`:''}
        ${n.STATUS==='Problem'?`<span class="tag tag-red">⚠ Problem prijavljen</span>`:''}
      </div>
    </div>`).join('')}`;
}

async function vozacPreuzmi(id) {
  const res = await API.vozacPreuzimanje(id);
  if (res.ok) { toast('Preuzimanje potvrđeno!','success'); await renderVozac(); }
  else toast(res.error,'error');
}

function vozacIstovarModal(id) {
  document.getElementById('modal-content').innerHTML = `
    <div class="modal-title">📦 Potvrda istovara</div>
    <div class="form-group" style="margin-bottom:12px">
      <label>Napomena (opcionalno)</label>
      <textarea id="istovar-nap" placeholder="Npr. svi artikli uredni..."></textarea>
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary" onclick="closeModal()">Odustani</button>
      <button class="btn btn-success" onclick="potvrdiIstovar(${id})">Potvrdi istovar</button>
    </div>`;
  openModal();
}

async function potvrdiIstovar(id) {
  const nap = document.getElementById('istovar-nap').value;
  const res = await API.vozacIstovar(id, nap);
  if (res.ok) { toast('Istovar potvrđen!','success'); closeModal(); await renderVozac(); }
  else toast(res.error,'error');
}

function vozacProblemModal(id) {
  document.getElementById('modal-content').innerHTML = `
    <div class="modal-title">⚠ Prijava problema</div>
    <div class="form-group" style="margin-bottom:12px">
      <label>Opis problema *</label>
      <textarea id="prob-opis" rows="4" placeholder="Npr. 1 paleta oštećena pri istovaru..."></textarea>
    </div>
    <div style="background:#2d1b1b;border:1px solid #f8514933;border-radius:6px;padding:10px;font-size:11px;color:#f85149;margin-bottom:12px">
      ⚠ Administrator će biti automatski obaviješten.
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary" onclick="closeModal()">Odustani</button>
      <button class="btn btn-danger" onclick="prijaviProblem(${id})">Prijavi problem</button>
    </div>`;
  openModal();
}

async function prijaviProblem(id) {
  const opis = document.getElementById('prob-opis').value.trim();
  if (!opis) { toast('Unesite opis problema!','error'); return; }
  const res = await API.vozacProblem(id, opis);
  if (res.ok) { toast('Problem prijavljen!','info'); closeModal(); await renderVozac(); }
  else toast(res.error,'error');
}
