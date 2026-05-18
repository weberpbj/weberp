// weberp-bj v2.0 | views_ops.js | Prijevoz · Skladišta · Projekcija · Izvještaji · Plan · Plan Prodaje

// ═══════════════════════════════════════════════════════════════════
// PRIJEVOZ
// ═══════════════════════════════════════════════════════════════════
let _prij_filtri = { skladiste:'sve', prijevoznik:'sve', smjer:'oba' };

async function renderPrijevoz() {
  const main = document.getElementById('main-content');
  main.innerHTML = `
  <div style="font-size:17px;font-weight:800;margin-bottom:12px">🚚 Prijevoz <span style="font-size:12px;font-weight:400;color:#7d8590">· Raspored — narednih 10 dana</span></div>
  <div class="filters" style="margin-bottom:8px">
    <span style="font-size:11px;color:#7d8590;font-weight:700">Skladište:</span>
    ${['sve','LDC FRIGO','LDC MARI','TKZD'].map(s=>
      `<button class="filter-btn ${_prij_filtri.skladiste===s?'active':''}" onclick="setPrijFilter('skladiste','${s}',this)">${s==='sve'?'Sva':s}</button>`
    ).join('')}
    <span style="color:#30363d;margin:0 4px">|</span>
    <span style="font-size:11px;color:#7d8590;font-weight:700">Prijevoznik:</span>
    ${['sve','ZMAJ','FRIGO','TKZD'].map(p=>
      `<button class="filter-btn ${_prij_filtri.prijevoznik===p?'active':''}" onclick="setPrijFilter('prijevoznik','${p}',this)">${p==='sve'?'Svi':p}</button>`
    ).join('')}
    <span style="color:#30363d;margin:0 4px">|</span>
    <span style="font-size:11px;color:#7d8590;font-weight:700">Smjer:</span>
    ${[['oba','↑↓ Oba'],['ulaz','↑ Ulazi'],['izlaz','↓ Izlazi']].map(([v,l])=>
      `<button class="filter-btn ${_prij_filtri.smjer===v?'active':''}" onclick="setPrijFilter('smjer','${v}',this)">${l}</button>`
    ).join('')}
    <span class="filters-count" id="prij-count"></span>
  </div>
  <div id="prij-content"><div class="loading-box"><div class="spinner"></div></div></div>`;
  await loadPrijevoz();
}

function setPrijFilter(key, val, btn) {
  _prij_filtri[key] = val;
  // Osvježi active state samo za grupu
  const grps = {'skladiste':[0,3], 'prijevoznik':[4,7], 'smjer':[8,10]};
  document.querySelectorAll('.filter-btn').forEach((b,i) => {
    if (b.closest('.filters')) {
      // reset samo unutar iste "grupe" — jednostavno refresh svega
    }
  });
  // Re-render filtera
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
  if (!zapisi.length) { c.innerHTML='<div class="card" style="color:#7d8590;text-align:center;padding:28px">Nema prijevoznih zapisa za odabrane filtere.</div>'; return; }

  c.innerHTML = `<div class="tbl-wrap">
    <table>
      <thead><tr>
        <th>Datum utovara</th><th>Datum dostave</th><th>Smjer</th>
        <th>Mjesto utovara</th><th>Mjesto istovara</th>
        <th>Prijevoznik</th><th style="text-align:right">Pal</th>
        <th>Kupac / Narudžba</th><th>Status</th><th>Napomena</th>
      </tr></thead>
      <tbody>
        ${zapisi.map(z=>{
          const smjCls = z.smjer==='ulaz'?'tag-purple':'tag-blue';
          const smjLbl = z.smjer==='ulaz'?'↑ Ulaz':'↓ Izlaz';
          const stCls  = z.status==='Isporučeno'?'tag-green':z.status==='Problem'?'tag-red':z.status==='U dostavi'?'tag-blue':'tag-yellow';
          return `<tr>
            <td style="font-weight:600;color:#e3b341">${fmt_datum(z.datum_utovara)}</td>
            <td style="color:#7d8590">${fmt_datum(z.datum_dostave)}</td>
            <td><span class="tag ${smjCls}">${smjLbl}</span></td>
            <td style="font-weight:${z.smjer==='izlaz'?700:400};color:${z.smjer==='izlaz'?'#6366f1':'#e6edf3'}">${z.mjesto_utovara}</td>
            <td style="font-weight:${z.smjer==='ulaz'?700:400};color:${z.smjer==='ulaz'?'#8b5cf6':'#e6edf3'}">${z.mjesto_istovara}</td>
            <td style="color:#7d8590">${z.prijevoznik}</td>
            <td style="text-align:right;color:#58a6ff;font-weight:700">${z.br_paleta}</td>
            <td style="font-size:11px">
              <div style="font-weight:600">${z.kupac}</div>
              <div style="color:#484f58">${z.br_narudzbe||''}</div>
            </td>
            <td><span class="tag ${stCls}" style="font-size:10px">${z.status}</span></td>
            <td style="color:#7d8590;font-size:11px;max-width:150px;overflow:hidden;text-overflow:ellipsis">${z.napomena||'—'}</td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>
  </div>
  <div style="font-size:10px;color:#484f58;margin-top:8px">
    <span style="color:#bc8cff">↑ Ulaz</span> = roba dolazi u skladište &nbsp;·&nbsp;
    <span style="color:#58a6ff">↓ Izlaz</span> = roba odlazi iz skladišta &nbsp;·&nbsp;
    Filteri se mogu kombinirati &nbsp;·&nbsp; Sortirano po datumu utovara
  </div>`;
}

// ═══════════════════════════════════════════════════════════════════
// SKLADIŠTA
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
    <button class="filter-btn" style="color:#484f58;border-style:dashed;cursor:default">LDC RALU <span style="font-size:9px">(hist.)</span></button>
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
  const pct = Math.round(d.trenutno/d.kapacitet*100);
  const clr = pct>85?'#f85149':pct>70?'#ffa657':'#58a6ff';

  // Obrtaj po mjesecima
  const obrtajMj = Object.entries(d.obrtaj||{})
    .sort(([a],[b])=>a.localeCompare(b))
    .slice(-6);

  c.innerHTML = `
  <div class="g5" style="margin-bottom:12px">
    <div class="kpi"><div class="kpi-label">Trenutno</div><div class="kpi-val" style="color:${clr}">${d.trenutno}</div><div class="kpi-sub">paleta</div></div>
    <div class="kpi"><div class="kpi-label">Kapacitet</div><div class="kpi-val" style="color:#7d8590">${d.kapacitet}</div><div class="kpi-sub">max paleta</div></div>
    <div class="kpi"><div class="kpi-label">Slobodno</div><div class="kpi-val" style="color:${d.slobodno<30?'#f85149':'#3fb950'}">${d.slobodno}</div><div class="kpi-sub">paleta</div></div>
    <div class="kpi"><div class="kpi-label">Popunjenost</div><div class="kpi-val" style="color:${clr}">${pct}%</div><div class="kpi-sub">&nbsp;</div></div>
    <div class="kpi"><div class="kpi-label">Aproksimacija</div><div class="kpi-val" style="color:#484f58;font-size:14px">~</div><div class="kpi-sub">temeljem narudžbi</div></div>
  </div>
  <div class="g2">
    <div class="card">
      <div class="card-title">📦 Stanje po artiklima + forecast 10 dana</div>
      <div class="tbl-wrap">
        <table>
          <thead><tr>
            <th>Artikl</th>
            <th style="text-align:right">Danas</th>
            ${(d.forecast||[]).slice(1,6).map(f=>`<th style="text-align:right">${f.datum.slice(8)}.${f.datum.slice(5,7)}.</th>`).join('')}
          </tr></thead>
          <tbody>
            ${ARTIKLI.filter(a=>(d.stanje_art||{})[a]>0 || (d.forecast||[]).some(f=>f.artikli[a]>0)).map(a=>{
              const danas = (d.stanje_art||{})[a]||0;
              return `<tr>
                <td style="font-weight:700;color:#58a6ff">${a}</td>
                <td style="text-align:right;color:${danas>0?'#e6edf3':'#484f58'};font-weight:${danas>0?700:400}">${danas||'—'}</td>
                ${(d.forecast||[]).slice(1,6).map(f=>{
                  const v = f.artikli[a]||0;
                  return `<td style="text-align:right;color:${v>0?'#58a6ff':v<0?'#f85149':'#484f58'}">${v||'—'}</td>`;
                }).join('')}
              </tr>`;
            }).join('')}
            <tr style="border-top:1px solid #30363d;font-weight:700">
              <td style="color:#3fb950">UKUPNO</td>
              <td style="text-align:right;color:#3fb950">${d.trenutno}</td>
              ${(d.forecast||[]).slice(1,6).map(f=>{
                const clrF = f.ukupno>d.kapacitet?'#f85149':f.ukupno>d.kapacitet*0.85?'#ffa657':'#3fb950';
                return `<td style="text-align:right;color:${clrF}">${f.ukupno}</td>`;
              }).join('')}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    <div class="card">
      <div class="card-title">🔄 Ulazi / Izlazi / Obrtaj — zadnjih 6 mjeseci</div>
      <div class="tbl-wrap">
        <table>
          <thead><tr>
            <th>Mj.</th>
            <th style="text-align:right;color:#3fb950">Ulazi ↑</th>
            <th style="text-align:right;color:#f85149">Izlazi ↓</th>
            <th style="text-align:right">Neto</th>
          </tr></thead>
          <tbody>
            ${obrtajMj.map(([mj,v])=>{
              const neto = (v.ulazi||0)-(v.izlazi||0);
              return `<tr>
                <td style="font-weight:700;color:#7d8590">${mj}</td>
                <td style="text-align:right;color:#3fb950">${v.ulazi||0}</td>
                <td style="text-align:right;color:#f85149">${v.izlazi||0}</td>
                <td style="text-align:right;color:${neto>=0?'#3fb950':'#f85149'};font-weight:700">${neto>=0?'+':''}{neto}</td>
              </tr>`;
            }).join('')}
            ${!obrtajMj.length?`<tr><td colspan="4" class="tbl-empty">Nema podataka.</td></tr>`:''}
          </tbody>
        </table>
      </div>
    </div>
  </div>`;
}

// ═══════════════════════════════════════════════════════════════════
// PROJEKCIJA
// ═══════════════════════════════════════════════════════════════════
async function renderProjekcija() {
  const main = document.getElementById('main-content');
  main.innerHTML = `
  <div style="font-size:17px;font-weight:800;margin-bottom:12px">🎯 Projekcija <span style="font-size:12px;font-weight:400;color:#7d8590">· Tjedni plan proizvodnje i razmještaja</span></div>
  <div style="display:flex;gap:8px;align-items:center;margin-bottom:12px;flex-wrap:wrap">
    <button class="btn btn-primary" onclick="genProjekciju()">🎯 Projektiraj idući tjedan</button>
    <button class="btn btn-success" onclick="azurirajProjekciju()">🔄 Ažuriraj projekciju</button>
    <div id="proj-status" style="font-size:11px;color:#7d8590"></div>
    <span style="margin-left:auto;font-size:10px;color:#7d8590">Kap: PON–PET 45 pal/dan · SUB 22 pal (50%)</span>
  </div>
  <div id="proj-content"><div class="loading-box"><div class="spinner"></div></div></div>`;
  await genProjekciju();
}

async function genProjekciju() {
  const c = document.getElementById('proj-content');
  const s = document.getElementById('proj-status');
  if (c) c.innerHTML = '<div class="loading-box"><div class="spinner"></div><span style="color:#7d8590">Generiranje projekcije...</span></div>';
  const res = await API.getProjekcija({});
  if (!res.ok) { if(c) c.innerHTML = err(res.error); return; }
  const d = res.data;
  if (s) s.textContent = `Tjedan: ${fmt_datum(d.tjedan_pocetak)} · FRIGO slobodno: ${d.stanje_frigo.slobodno} pal · MARI slobodno: ${d.stanje_mari.slobodno} pal`;
  buildProjekcija(d);
}

async function azurirajProjekciju() {
  if (document.getElementById('proj-content')) await genProjekciju();
}

function buildProjekcija(d) {
  const c = document.getElementById('proj-content');
  if (!c) return;
  const DANI_HR2 = {PON:'Ponedjeljak',UTO:'Utorak',SRI:'Srijeda',CET:'Četvrtak',PET:'Petak',SUB:'Subota'};
  const isWk = {SUB:true};

  const danHtml = (d.dani||[]).map(dd => {
    const kap = dd.kapacitet;
    const planUk = dd.plan_ukupno;
    const pct = planUk ? Math.round(planUk/kap*100) : 0;
    const cls = isWk[dd.dan]?'wk':'wd';

    const artRows = ARTIKLI.filter(a=>dd.prijedlog_proiz&&dd.prijedlog_proiz[a]>0).map(a=>
      `<div class="proj-item"><span>${a}</span><span style="color:#ffa657;font-weight:700">${dd.prijedlog_proiz[a]} pal</span></div>`
    ).join('');

    const prijRows = (dd.prijedlog_prijevoza||[]).map(pr=>
      `<div class="proj-item">
        <span style="color:${pr.skladiste==='LDC FRIGO'?'#6366f1':'#8b5cf6'}">→ ${pr.skladiste}</span>
        <span style="font-weight:700">${pr.kolicina} pal</span>
      </div>
      <div style="font-size:9px;color:#7d8590">Vozač: ${pr.vozac} · ${pr.sleper} sleper</div>`
    ).join('');

    const narRows = (dd.narudzbe_detalji||[]).slice(0,3).map(n=>
      `<div class="proj-item"><span>${n.kupac}</span><span style="color:#79c0ff">${n.pal} pal</span></div>`
    ).join('');

    return `<div class="proj-day">
      <div class="proj-dh ${cls}">
        <div>
          <div style="font-size:9px;color:#7d8590">${DANI_HR2[dd.dan]||dd.dan}</div>
          ${fmt_datum(dd.datum)}
        </div>
        <div style="text-align:right">
          <div style="font-size:9px;color:#7d8590">Kapacitet</div>
          <span style="color:#3fb950;font-weight:800">${kap} pal</span>
        </div>
      </div>
      <div class="proj-sec">
        <div class="proj-sl">🏭 Proizvodnja${dd.plan_postoji?' (plan postoji)':''}</div>
        ${artRows||`<div style="font-size:9px;color:#484f58;font-style:italic">—</div>`}
        ${planUk>0?`<div class="pbar"><div class="pbar-f" style="width:${Math.min(100,pct)}%;background:#ffa657"></div></div>
        <div style="font-size:9px;color:#7d8590;margin-top:2px">Plan: ${planUk}/${kap} pal (${pct}%)</div>`:''}
      </div>
      <div class="proj-sec">
        <div class="proj-sl">🚚 Prijedlog prijevoza</div>
        ${prijRows||`<div style="font-size:9px;color:#484f58;font-style:italic">—</div>`}
      </div>
      <div class="proj-sec">
        <div class="proj-sl">📦 Narudžbe ${dd.narudzbe_detalji?.length?'('+dd.narudzbe_detalji.length+')':''}</div>
        ${narRows||`<div style="font-size:9px;color:#484f58;font-style:italic">Nema narudžbi</div>`}
        ${(dd.narudzbe_detalji||[]).length>3?`<div style="font-size:9px;color:#7d8590">+${dd.narudzbe_detalji.length-3} više...</div>`:''}
      </div>
    </div>`;
  }).join('');

  const ukPlan = (d.dani||[]).reduce((s,dd)=>s+dd.plan_ukupno,0);

  c.innerHTML = `
  <div class="g6" style="margin-bottom:12px">${danHtml}</div>
  <div class="card">
    <div class="card-title">📊 Tjedni sažetak</div>
    <div class="g4">
      <div class="kpi"><div class="kpi-label">Plan proiz. tjedan</div><div class="kpi-val" style="color:#ffa657">${ukPlan} pal</div></div>
      <div class="kpi"><div class="kpi-label">FRIGO · slobodno</div><div class="kpi-val" style="color:#6366f1">${d.stanje_frigo.slobodno} pal</div><div class="kpi-sub">od ${d.stanje_frigo.kapacitet} max</div></div>
      <div class="kpi"><div class="kpi-label">MARI · slobodno</div><div class="kpi-val" style="color:${d.stanje_mari.slobodno<30?'#f85149':'#8b5cf6'}">${d.stanje_mari.slobodno} pal</div><div class="kpi-sub">od ${d.stanje_mari.kapacitet} max</div></div>
      ${AUTH.mozePisati('projekcija')?`<div class="kpi" style="display:flex;flex-direction:column;justify-content:center">
        <button class="btn btn-primary" onclick="spremiProjekcijuUPlan()">💾 Spremi u plan</button>
        <div style="font-size:10px;color:#7d8590;margin-top:6px;text-align:center">Upisuje projekciju u Plan proizvodnje</div>
      </div>`:''}
    </div>
  </div>`;

  // Spremi podatke za kasniji save
  window._lastProjekcija = d;
}

async function spremiProjekcijuUPlan() {
  const d = window._lastProjekcija;
  if (!d) { toast('Nema podataka za spremanje.','error'); return; }
  const dani = (d.dani||[]).map(dd=>({
    dan: dd.dan, datum: dd.datum,
    podaci: { ...dd.prijedlog_proiz, PLAN_UKUPNO: dd.plan_ukupno||dd.kapacitet }
  }));
  const res = await API.spremiProjekciju({ dani });
  if (res.ok) toast(res.msg||'Projekcija spremljena u plan!','success');
  else toast(res.error,'error');
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
      <option value="">Svi mjeseci (godišnji)</option>
      ${['Siječanj','Veljača','Ožujak','Travanj','Svibanj','Lipanj','Srpanj','Kolovoz','Rujan','Listopad','Studeni','Prosinac']
        .map((m,i)=>`<option value="${i+1}" ${_izv_mj===i+1?'selected':''}>${m}</option>`).join('')}
    </select>
    <button class="btn btn-secondary" onclick="window.print()">🖨 Ispiši A4</button>
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

  // Top kupci sortirano
  const topKupci = Object.entries(d.po_kupcu||{})
    .sort(([,a],[,b])=>b.pal-a.pal).slice(0,8);
  const topPrij = Object.entries(d.po_prijevozniku||{})
    .sort(([,a],[,b])=>b.pal-a.pal).slice(0,5);
  const artRows = Object.entries(d.po_artiklu||{})
    .filter(([,v])=>v>0).sort(([,a],[,b])=>b-a);
  const maxArt = Math.max(...artRows.map(([,v])=>v),1);

  c.innerHTML = `
  <div class="g4" style="margin-bottom:12px">
    ${kpi('Ukupno otprema', d.kpi.ukupno_pal, 'pal · dostave kupcima', '#58a6ff')}
    ${kpi('Prijenosi', d.kpi.ukupno_prijenosa, 'između skladišta', '#bc8cff')}
    ${kpi('Obrtaj FRIGO', d.kpi.obrtaj_frigo+'×', 'YTD '+_izv_god, '#6366f1')}
    ${kpi('Obrtaj MARI',  d.kpi.obrtaj_mari+'×',  'YTD '+_izv_god, '#8b5cf6')}
  </div>
  <div class="g2">
    <div class="card">
      <div class="card-title">📊 Otprema po kupcu (pal)</div>
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
      <div class="card-title">🚚 Prijevoz po prijevozniku (pal)</div>
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
    <div class="card-title">📦 Otprema po artiklima (pal)</div>
    ${artRows.map(([a,v])=>`
      <div class="bar-wrap">
        <div class="bar-header"><span style="font-weight:600;min-width:80px;display:inline-block">${a}</span>
          <span style="color:#58a6ff;font-weight:700">${v} pal</span></div>
        <div class="bar-track"><div class="bar-fill" style="width:${Math.round(v/maxArt*100)}%;background:#58a6ff"></div></div>
      </div>`).join('')}
    ${!artRows.length?'<div style="color:#7d8590;text-align:center;padding:16px">Nema podataka.</div>':''}
  </div>`;
}

// ═══════════════════════════════════════════════════════════════════
// PLAN PROIZVODNJE
// ═══════════════════════════════════════════════════════════════════
async function renderPlanProizvodnje() {
  const tjedan = getISOWeek(new Date());
  const [resPlan, resStv] = await Promise.all([API.getPlan(tjedan), API.getStvarno(tjedan)]);
  const main = document.getElementById('main-content');
  const plan = resPlan.ok ? resPlan.data : [];
  const stv  = resStv.ok  ? resStv.data  : [];
  const mozePisati = AUTH.mozePisati('plan_proizv');
  const mozeBrisati= AUTH.mozeBrisati('plan_proizv');
  const sif = appState.sifrarnici || {};
  const art = (sif.artikli||[]).filter(a=>a.AKTIVAN==='Da').slice(0,8);

  main.innerHTML = `
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;flex-wrap:wrap;gap:8px">
    <div style="font-size:17px;font-weight:800">🏭 Plan proizvodnje <span style="font-size:12px;font-weight:400;color:#7d8590">— Tjedan ${tjedan}</span></div>
    ${mozePisati?`<button class="btn btn-primary" onclick="openPlanModal()">+ Unos plana</button>`:''}
  </div>
  <div style="font-size:10px;color:#484f58;margin-bottom:8px">
    📅 Auto-sort po datumu &nbsp;·&nbsp; ${mozeBrisati?'🗑 Brisanje dostupno':'🔒 Brisanje nije dostupno'}
  </div>
  <div class="tbl-wrap"><table>
    <thead><tr>
      <th>Dan</th><th>Datum</th>
      ${art.map(a=>`<th style="text-align:right">${a.KOD}</th>`).join('')}
      <th style="color:#58a6ff;text-align:right">Plan uk.</th>
      <th style="color:#3fb950;text-align:right">Stvarno</th>
      <th style="text-align:right">Δ</th>
      <th>Zaklj.</th>
      ${mozePisati?'<th>Unos</th>':''}
      ${mozeBrisati?'<th>🗑</th>':''}
    </tr></thead>
    <tbody>
      ${plan.map(p=>{
        const s = stv.find(r=>r.DATUM===p.DATUM)||{};
        const dlt = (parseInt(p.PLAN_UKUPNO)||0)-(parseInt(s.STVAR_UKUPNO)||0);
        const zk  = p.ZAKLJUCANO==='Da';
        return `<tr>
          <td style="font-weight:700">${p.DAN}</td>
          <td style="color:#7d8590">${fmt_datum(p.DATUM)}</td>
          ${art.map(a=>`<td style="text-align:right">${p[a.KOD+'_PLAN']||0}</td>`).join('')}
          <td style="color:#58a6ff;font-weight:700;text-align:right">${p.PLAN_UKUPNO||0}</td>
          <td style="color:#3fb950;font-weight:700;text-align:right">${s.STVAR_UKUPNO||'—'}</td>
          <td style="color:${dlt>0?'#e3b341':dlt<0?'#f85149':'#3fb950'};font-weight:700;text-align:right">
            ${s.STVAR_UKUPNO?((dlt>0?'+':'')+dlt):'—'}</td>
          <td>${zk?'<span class="tag tag-green">Da</span>':'<span class="tag tag-yellow">Ne</span>'}</td>
          ${mozePisati&&!zk?`<td><button class="btn btn-secondary btn-sm" onclick="openStvarnoModal('${p.DATUM}')">Unesi stvarno</button></td>`:mozePisati?'<td>—</td>':''}
          ${mozeBrisati?`<td><button class="btn btn-danger btn-sm" onclick="obrisiPlan(${p.ID})">🗑</button></td>`:''}
        </tr>`;
      }).join('')}
      ${!plan.length?`<tr><td colspan="20" class="tbl-empty">Nema plana za ovaj tjedan.</td></tr>`:''}
    </tbody>
  </table></div>`;
}

function openPlanModal() {
  const sif = appState.sifrarnici||{};
  const art = (sif.artikli||[]).filter(a=>a.AKTIVAN==='Da');
  document.getElementById('modal-content').innerHTML = `
    <div class="modal-title">Unos plana proizvodnje</div>
    <div class="form-row col2">
      <div class="form-group"><label>Dan</label>
        <select id="p-dan">${['PON','UTO','SRI','ČET','PET','SUB','NED'].map(d=>`<option>${d}</option>`).join('')}</select></div>
      <div class="form-group"><label>Datum *</label>
        <input type="date" id="p-datum" min="${new Date().toISOString().slice(0,10)}"></div>
    </div>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:12px">
      ${art.map(a=>`<div class="form-group"><label>${a.KOD}</label>
        <input type="number" id="p-${a.KOD.replace(/[\/ ]/g,'_')}" min="0" value="0"></div>`).join('')}
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary" onclick="closeModal()">Odustani</button>
      <button class="btn btn-primary" onclick="spremiPlan()">Spremi plan</button>
    </div>`;
  openModal();
}

async function spremiPlan() {
  const sif = appState.sifrarnici||{};
  const art = (sif.artikli||[]).filter(a=>a.AKTIVAN==='Da');
  const datum = document.getElementById('p-datum').value;
  if (!datum) { toast('Datum je obavezan!','error'); return; }
  const data = { DAN: document.getElementById('p-dan').value, DATUM: datum };
  let uk = 0;
  art.forEach(a=>{const v=parseInt(document.getElementById('p-'+a.KOD.replace(/[\/ ]/g,'_'))?.value||0); data[a.KOD+'_PLAN']=v; uk+=v;});
  data.PLAN_UKUPNO=uk;
  const res = await API.addPlan(data);
  if (res.ok) { toast('Plan dodan!','success'); closeModal(); await renderPlanProizvodnje(); }
  else toast(res.error,'error');
}

function openStvarnoModal(datum) {
  const sif = appState.sifrarnici||{};
  const art = (sif.artikli||[]).filter(a=>a.AKTIVAN==='Da');
  document.getElementById('modal-content').innerHTML = `
    <div class="modal-title">Unos stvarne proizvodnje — ${fmt_datum(datum)}</div>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:12px">
      ${art.map(a=>`<div class="form-group"><label>${a.KOD}</label>
        <input type="number" id="s-${a.KOD.replace(/[\/ ]/g,'_')}" min="0" value="0"></div>`).join('')}
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary" onclick="closeModal()">Odustani</button>
      <button class="btn btn-success" onclick="spremiStvarno('${datum}')">Spremi</button>
    </div>`;
  openModal();
}

async function spremiStvarno(datum) {
  const sif = appState.sifrarnici||{};
  const art = (sif.artikli||[]).filter(a=>a.AKTIVAN==='Da');
  const data = { DATUM: datum };
  let uk=0;
  art.forEach(a=>{const v=parseInt(document.getElementById('s-'+a.KOD.replace(/[\/ ]/g,'_'))?.value||0); data[a.KOD+'_STVAR']=v; uk+=v;});
  data.STVAR_UKUPNO=uk;
  const res = await API.addStvarno(data);
  if (res.ok) { toast('Stvarno upisano!','success'); closeModal(); await renderPlanProizvodnje(); }
  else toast(res.error,'error');
}

async function obrisiPlan(id) {
  if (!confirm('Obrisati zapis plana?')) return;
  const res = await API.deletePlan(id);
  if (res.ok) { toast('Obrisano.','info'); await renderPlanProizvodnje(); }
  else toast(res.error,'error');
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
    ${mozePisati?`<button class="btn btn-primary" onclick="openPlanProdajeModal()">+ Novi plan</button>`:''}
  </div>
  <div class="tbl-wrap"><table>
    <thead><tr>
      <th>Kupac</th><th>Datum od</th><th>Datum do</th>
      <th style="text-align:right">Ukupno pal</th><th>Napomena</th><th>Unio</th>
      ${mozeBrisati?'<th>🗑</th>':''}
    </tr></thead>
    <tbody>
      ${planovi.map(p=>`<tr>
        <td style="font-weight:600">${p.KUPAC||'—'}</td>
        <td>${fmt_datum(p.DATUM_OD)}</td><td>${fmt_datum(p.DATUM_DO)}</td>
        <td style="color:#58a6ff;font-weight:700;text-align:right">${p.UKUPNO_PAL||'—'}</td>
        <td style="color:#7d8590;font-size:11px">${p.NAPOMENA||'—'}</td>
        <td style="color:#7d8590;font-size:11px">${p.UNIO||'—'}</td>
        ${mozeBrisati?`<td><button class="btn btn-danger btn-sm" onclick="obrisiPlanProdaje(${p.ID})">🗑</button></td>`:''}
      </tr>`).join('')}
      ${!planovi.length?`<tr><td colspan="7" class="tbl-empty">Nema planova prodaje.</td></tr>`:''}
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
      <div class="form-group"><label>Kupac *</label><select id="pp-kupac"><option value="">— Odaberi —</option>${kupci}</select></div>
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
    KUPAC: document.getElementById('pp-kupac').value,
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
