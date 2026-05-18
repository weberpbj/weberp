// weberp-bj v2.0 | views_admin.js | Alarmi · Matični · Korisnici · AI Asistent · Postavke

// ═══════════════════════════════════════════════════════════════════
// ALARMI
// ═══════════════════════════════════════════════════════════════════
async function renderAlarmi() {
  const res = await API.getAlarmi();
  const main = document.getElementById('main-content');
  if (!res.ok) { main.innerHTML = err(res.error); return; }
  const alarmi  = res.data || [];
  const otvoreni = alarmi.filter(a=>a.STATUS_ALARMA==='Otvoren').length;
  main.innerHTML = `
  <div style="font-size:17px;font-weight:800;margin-bottom:14px">
    🔔 Alarmi ${otvoreni>0?`<span class="alarm-badge">${otvoreni}</span>`:''}
  </div>
  <div class="tbl-wrap"><table>
    <thead><tr>
      <th>#</th><th>Narudžba</th><th>Kupac</th><th>Datum</th>
      <th>Vozač</th><th>Opis problema</th><th>Status</th><th>Akcija</th>
    </tr></thead>
    <tbody>
      ${alarmi.map(a=>`<tr>
        <td style="color:#7d8590">${a.ID}</td>
        <td style="color:#7d8590;font-family:monospace">#${a.ID_NARUDZBE}</td>
        <td style="font-weight:600">${a.KUPAC}</td>
        <td>${fmt_datum(a.DATUM_DOSTAVE)}</td>
        <td style="color:#7d8590">${a.VOZAC}</td>
        <td style="color:#e3b341;max-width:200px">${a.OPIS_PROBLEMA}</td>
        <td><span class="tag ${a.STATUS_ALARMA==='Otvoren'?'tag-red':'tag-green'}">${a.STATUS_ALARMA}</span></td>
        <td>${a.STATUS_ALARMA==='Otvoren'
          ?`<button class="btn btn-success btn-sm" onclick="resolveAlarmModal(${a.ID})">Riješi</button>`
          :`<span style="font-size:11px;color:#7d8590">${a.RIJESIO||'—'}</span>`
        }</td>
      </tr>`).join('')}
      ${!alarmi.length?'<tr><td colspan="8" class="tbl-empty">Nema alarma.</td></tr>':''}
    </tbody>
  </table></div>`;
}

function resolveAlarmModal(id) {
  document.getElementById('modal-content').innerHTML = `
    <div class="modal-title">Rješavanje alarma #${id}</div>
    <div class="form-group" style="margin-bottom:12px">
      <label>Napomena o rješenju</label>
      <textarea id="res-nap" placeholder="Što je poduzeto..."></textarea>
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary" onclick="closeModal()">Odustani</button>
      <button class="btn btn-success" onclick="resolveAlarm(${id})">Označi riješenim</button>
    </div>`;
  openModal();
}

async function resolveAlarm(id) {
  const nap = document.getElementById('res-nap').value;
  const res = await API.resolveAlarm(id, nap);
  if (res.ok) {
    toast('Alarm riješen!','success'); closeModal();
    appState.alarmi_count = Math.max(0, appState.alarmi_count-1);
    renderSidebar(); await renderAlarmi();
  } else toast(res.error,'error');
}

// ═══════════════════════════════════════════════════════════════════
// MATIČNI PODACI
// ═══════════════════════════════════════════════════════════════════
async function renderMaticni() {
  const res = await API.getMaticni();
  const main = document.getElementById('main-content');
  if (!res.ok) { main.innerHTML = err(res.error); return; }
  const artikli = res.data || [];
  main.innerHTML = `
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;flex-wrap:wrap;gap:8px">
    <div style="font-size:17px;font-weight:800">📦 Matični podaci — Artikli</div>
    <button class="btn btn-primary" onclick="openArtModal()">+ Novi artikal</button>
  </div>
  <div class="tbl-wrap"><table>
    <thead><tr>
      <th>Kod</th><th>Naziv</th><th>Kom/Pal</th>
      <th>Aktivan</th><th>Datum od</th><th>Datum do</th><th>Akcija</th>
    </tr></thead>
    <tbody>
      ${artikli.map(a=>`<tr>
        <td style="font-weight:700;color:#58a6ff">${a.KOD}</td>
        <td>${a.NAZIV}</td>
        <td style="text-align:right">${a.KOM_PO_PAL}</td>
        <td><span class="tag ${a.AKTIVAN==='Da'?'tag-green':'tag-red'}">${a.AKTIVAN}</span></td>
        <td style="color:#7d8590">${a.DATUM_OD||'—'}</td>
        <td style="color:${a.DATUM_DO?'#f85149':'#7d8590'}">${a.DATUM_DO||'—'}</td>
        <td style="display:flex;gap:4px">
          <button class="btn btn-secondary btn-sm" onclick='openArtModal(${JSON.stringify(a).replace(/'/g,"&#39;")})'>Uredi</button>
          ${a.AKTIVAN==='Da'?`<button class="btn btn-danger btn-sm" onclick="arhivirajArt(${a.ID})">Arhiviraj</button>`:''}
        </td>
      </tr>`).join('')}
    </tbody>
  </table></div>`;
}

function openArtModal(a) {
  document.getElementById('modal-content').innerHTML = `
    <div class="modal-title">${a?'Uredi artikal':'Novi artikal'}</div>
    <div class="form-row col2">
      <div class="form-group"><label>Kod *</label><input type="text" id="a-kod" value="${a?.KOD||''}"></div>
      <div class="form-group"><label>Naziv *</label><input type="text" id="a-naziv" value="${a?.NAZIV||''}"></div>
    </div>
    <div class="form-row col2">
      <div class="form-group"><label>Kom/Paleti *</label><input type="number" id="a-kom" value="${a?.KOM_PO_PAL||576}" min="1"></div>
      <div class="form-group"><label>Datum od</label><input type="date" id="a-od" value="${a?.DATUM_OD||new Date().toISOString().slice(0,10)}"></div>
    </div>
    <div class="form-group"><label>Napomena</label><input type="text" id="a-nap" value="${a?.NAPOMENA||''}"></div>
    <div class="modal-footer">
      <button class="btn btn-secondary" onclick="closeModal()">Odustani</button>
      <button class="btn btn-primary" onclick="spremiArt(${a?.ID||'null'})">Spremi</button>
    </div>`;
  openModal();
}

async function spremiArt(id) {
  const data = {
    KOD: document.getElementById('a-kod').value.trim(),
    NAZIV: document.getElementById('a-naziv').value.trim(),
    KOM_PO_PAL: parseInt(document.getElementById('a-kom').value)||576,
    DATUM_OD: document.getElementById('a-od').value,
    NAPOMENA: document.getElementById('a-nap').value,
  };
  if (!data.KOD||!data.NAZIV) { toast('Kod i naziv su obavezni!','error'); return; }
  const res = id ? await API.updateArtikal({id,...data}) : await API.addArtikal(data);
  if (res.ok) { toast(res.msg||'Artikal spremljen!','success'); closeModal(); await loadSifrarnici(); await renderMaticni(); }
  else toast(res.error,'error');
}

async function arhivirajArt(id) {
  if (!confirm('Arhivirati artikal? Neće biti dostupan za nove narudžbe.')) return;
  const datum = prompt('Datum arhiviranja (YYYY-MM-DD):',new Date().toISOString().slice(0,10));
  if (!datum) return;
  const res = await API.arhivirajArtikal(id, datum);
  if (res.ok) { toast('Artikal arhiviran.','info'); await loadSifrarnici(); await renderMaticni(); }
  else toast(res.error,'error');
}

// ═══════════════════════════════════════════════════════════════════
// KORISNICI — s checkboxima pristupnih prava
// ═══════════════════════════════════════════════════════════════════
async function renderKorisnici() {
  const res = await API.getKorisnici();
  const main = document.getElementById('main-content');
  if (!res.ok) { main.innerHTML = err(res.error); return; }
  const korisnici = res.data || [];
  main.innerHTML = `
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;flex-wrap:wrap;gap:8px">
    <div style="font-size:17px;font-weight:800">👥 Korisnici i ovlasti</div>
    <button class="btn btn-primary" onclick="openKorModal()">+ Novi korisnik</button>
  </div>
  <div class="tbl-wrap"><table>
    <thead><tr>
      <th>Username</th><th>Ime i prezime</th><th>Uloga</th>
      <th>Skladište</th><th>Email</th><th>Status</th><th>Zadnja prijava</th><th>Akcija</th>
    </tr></thead>
    <tbody>
      ${korisnici.map(k=>`<tr>
        <td style="font-family:monospace;font-weight:600">${k.USERNAME}</td>
        <td>${k.IME_PREZIME}</td>
        <td><span class="tag tag-blue" style="font-size:10px">${k.ULOGA}</span></td>
        <td style="color:#7d8590">${k.SKLADISTE||'—'}</td>
        <td style="color:#7d8590;font-size:11px">${k.EMAIL||'—'}</td>
        <td><span class="tag ${k.AKTIVNA==='Da'?'tag-green':'tag-red'}">${k.AKTIVNA==='Da'?'Aktivan':'Neaktivan'}</span></td>
        <td style="color:#7d8590;font-size:11px">${k.ZADNJA_PRIJAVA?new Date(k.ZADNJA_PRIJAVA).toLocaleDateString('hr-HR'):'—'}</td>
        <td style="display:flex;gap:4px;flex-wrap:wrap">
          <button class="btn btn-secondary btn-sm" onclick='openKorModal(${JSON.stringify(k).replace(/'/g,"&#39;")})'>Uredi</button>
          <button class="btn ${k.AKTIVNA==='Da'?'btn-danger':'btn-success'} btn-sm" onclick="toggleKor(${k.ID})">
            ${k.AKTIVNA==='Da'?'Deaktiviraj':'Aktiviraj'}</button>
        </td>
      </tr>`).join('')}
    </tbody>
  </table></div>`;
}

// Sve podmape za prava
const SVE_PODMAPE = [
  { id:'dashboard',    label:'📊 Dashboard' },
  { id:'kalendar',     label:'📅 Kalendar' },
  { id:'priprema',     label:'📋 Narudžbe' },
  { id:'plan_proizv',  label:'🏭 Plan proizvodnje' },
  { id:'plan_prodaje', label:'📈 Plan prodaje' },
  { id:'prijevoz',     label:'🚚 Prijevoz' },
  { id:'skladista',    label:'🏪 Skladišta' },
  { id:'projekcija',   label:'🎯 Projekcija' },
  { id:'izvjestaji',   label:'📑 Izvještaji' },
  { id:'alarmi',       label:'🔔 Alarmi' },
  { id:'maticni',      label:'📦 Matični podaci' },
  { id:'korisnici',    label:'👥 Korisnici' },
  { id:'ai',           label:'🤖 AI Asistent' },
  { id:'postavke',     label:'⚙️ Postavke' },
];

function openKorModal(k) {
  const uloge = ['superuser','admin_priprema','admin_maticni','admin_proizvodnja',
    'uprava','prodaja','korisnik_proizvodnja','vozac','ldc_skladiste'];
  const sif = appState.sifrarnici||{};
  const sklad = (sif.skladista||[]).map(s=>
    `<option value="${s.NAZIV}" ${k?.SKLADISTE===s.NAZIV?'selected':''}>${s.NAZIV}</option>`).join('');

  // Parsiranje postojećih prava
  let praviPrava = {};
  if (k?.PRISTUPNA_PRAVA) {
    try { praviPrava = JSON.parse(k.PRISTUPNA_PRAVA); } catch(e) {}
  }

  const pravaTbl = `
  <div style="margin-top:12px;border-top:1px solid #30363d;padding-top:10px">
    <div style="font-size:10px;font-weight:700;color:#7d8590;text-transform:uppercase;margin-bottom:8px">
      Pristupna prava — podmape <span style="color:#484f58">(prazno = koristi ulogu)</span>
    </div>
    <div style="overflow-x:auto">
      <table class="prava-tbl" style="width:100%">
        <thead><tr>
          <th style="text-align:left">Podmapa</th>
          <th>Čitanje</th><th>Pisanje</th><th>Brisanje</th>
        </tr></thead>
        <tbody>
          ${SVE_PODMAPE.map(p=>`<tr>
            <td style="text-align:left">${p.label}</td>
            <td><input type="checkbox" class="pchk" id="pr-${p.id}-r"
              ${praviPrava[p.id]===true||praviPrava[p.id+'_read']===true?'checked':''}></td>
            <td><input type="checkbox" class="pchk" id="pr-${p.id}-w"
              ${praviPrava[p.id+'_write']===true?'checked':''}></td>
            <td><input type="checkbox" class="pchk" id="pr-${p.id}-d"
              ${praviPrava[p.id+'_delete']===true?'checked':''}></td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>
  </div>`;

  window._edit_kor_id = k?.ID || null;
  document.getElementById('modal-content').innerHTML = `
    <div class="modal-title">${k?'Uredi korisnika — '+k.USERNAME:'Novi korisnik'}</div>
    <div class="form-row col2">
      <div class="form-group"><label>Username *</label>
        <input type="text" id="k-user" value="${k?.USERNAME||''}" ${k?'readonly':''}></div>
      <div class="form-group"><label>${k?'Nova lozinka (prazno = ne mijenja)':'Lozinka *'}</label>
        <input type="password" id="k-pass" placeholder="${k?'Ostavi prazno = ne mijenja':'Min. 8 znakova'}"></div>
    </div>
    <div class="form-row col2">
      <div class="form-group"><label>Ime i prezime</label>
        <input type="text" id="k-ime" value="${k?.IME_PREZIME||''}"></div>
      <div class="form-group"><label>Uloga *</label>
        <select id="k-uloga">${uloge.map(u=>`<option value="${u}" ${k?.ULOGA===u?'selected':''}>${u}</option>`).join('')}</select>
      </div>
    </div>
    <div class="form-row col2">
      <div class="form-group"><label>Skladište (za vozača/LDC)</label>
        <select id="k-sklad"><option value="">— Nije vezano —</option>${sklad}</select></div>
      <div class="form-group"><label>Email * <span style="color:#484f58">(za privremenu lozinku)</span></label>
        <input type="email" id="k-email" value="${k?.EMAIL||''}"></div>
    </div>
    ${pravaTbl}
    <div class="modal-footer">
      <button class="btn btn-secondary" onclick="closeModal()">Odustani</button>
      <button class="btn btn-primary" onclick="spremiKor()">Spremi</button>
    </div>`;
  openModal();
}

async function spremiKor() {
  const id = window._edit_kor_id;
  // Skupi prava
  const prava = {};
  SVE_PODMAPE.forEach(p=>{
    const r = document.getElementById('pr-'+p.id+'-r')?.checked;
    const w = document.getElementById('pr-'+p.id+'-w')?.checked;
    const d = document.getElementById('pr-'+p.id+'-d')?.checked;
    if (r) prava[p.id]=true;
    if (w) prava[p.id+'_write']=true;
    if (d) prava[p.id+'_delete']=true;
  });
  const data = {
    username:    document.getElementById('k-user').value.trim(),
    password:    document.getElementById('k-pass').value,
    ime_prezime: document.getElementById('k-ime').value.trim(),
    uloga:       document.getElementById('k-uloga').value,
    skladiste:   document.getElementById('k-sklad').value,
    email:       document.getElementById('k-email').value.trim(),
    pristupna_prava: Object.keys(prava).length ? prava : undefined,
  };
  if (!id && !data.password) { toast('Lozinka je obavezna!','error'); return; }
  const res = id
    ? await API.updateKorisnik({id, nova_lozinka:data.password||undefined, ...data})
    : await API.addKorisnik(data);
  if (res.ok) { toast(res.msg||'Korisnik spremljen!','success'); closeModal(); await renderKorisnici(); }
  else toast(res.error,'error');
}

async function toggleKor(id) {
  const res = await API.toggleKorisnik(id);
  if (res.ok) { toast(res.msg,'info'); await renderKorisnici(); }
  else toast(res.error,'error');
}

// ═══════════════════════════════════════════════════════════════════
// AI ASISTENT — via Apps Script backend
// ═══════════════════════════════════════════════════════════════════
let _ai_history = []; // { role:'user'|'assistant', content }

async function renderAI() {
  const [resVer] = await Promise.all([API.getVerzije()]);
  const main = document.getElementById('main-content');
  const verzije = resVer.ok ? resVer.data : [];
  const aktVer  = verzije.find(v=>String(v.AKTIVAN)==='Da')||verzije[0]||{};

  main.innerHTML = `
  <div style="font-size:17px;font-weight:800;margin-bottom:12px">🤖 AI Asistent <span style="font-size:12px;font-weight:400;color:#7d8590">· Razvoj i nadogradnje</span></div>
  <div class="g2">
    <div class="card" style="display:flex;flex-direction:column;height:480px">
      <div class="card-title">💬 Chat — opis željene nadogradnje</div>
      <div class="ai-chat">
        <div class="ai-msgs" id="ai-msgs">
          <div class="ai-b b">Pozdrav! Ovdje sam za razvoj i nadogradnje aplikacije. Opišite što trebate promijeniti ili dodati, i pripremit ću kod za implementaciju.</div>
        </div>
        <div class="ai-row">
          <textarea class="ai-in" id="ai-input" placeholder="Opišite željenu nadogradnju..." rows="2"
            onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();aiPosalji();}"></textarea>
          <button class="btn btn-primary" onclick="aiPosalji()">Pošalji</button>
        </div>
        <div style="font-size:9px;color:#484f58;margin-top:4px">Enter = pošalji &nbsp;·&nbsp; Shift+Enter = novi redak</div>
      </div>
    </div>
    <div>
      <div class="card" style="margin-bottom:12px">
        <div class="card-title">📁 Verzije koda</div>
        <div class="tbl-wrap"><table>
          <thead><tr><th>Verzija</th><th>Datum</th><th>Opis</th><th>Status</th>
            ${AUTH.getUser()?.ULOGA==='superuser'?'<th>Akcija</th>':''}
          </tr></thead>
          <tbody>
            ${verzije.map(v=>`<tr>
              <td style="font-weight:700;color:${v.AKTIVAN==='Da'?'#3fb950':'#7d8590'}">${v.NAZIV||v.ID}</td>
              <td style="color:#7d8590;font-size:10px">${v.DATUM||'—'}</td>
              <td style="font-size:11px">${v.OPIS||'—'}</td>
              <td><span class="tag ${v.AKTIVAN==='Da'?'tag-green':'tag-yellow'}">${v.AKTIVAN==='Da'?'AKTIVAN':'Neaktivan'}</span></td>
              ${AUTH.getUser()?.ULOGA==='superuser'?`<td>
                ${v.AKTIVAN!=='Da'?`<button class="btn btn-success btn-sm" onclick="aktivirajVer(${v.ID})">Aktiviraj</button>`:'—'}
              </td>`:''}
            </tr>`).join('')}
            ${!verzije.length?'<tr><td colspan="5" class="tbl-empty">Nema verzija.</td></tr>':''}
          </tbody>
        </table></div>
        ${AUTH.getUser()?.ULOGA==='superuser'?`
        <div style="margin-top:10px">
          <button class="btn btn-secondary btn-sm" onclick="openDodajVer()">+ Dodaj verziju</button>
        </div>`:''}
      </div>
      <div class="card">
        <div class="card-title">ℹ️ Aktivna verzija</div>
        <div style="font-size:13px;color:#7d8590;line-height:2">
          <div>Verzija: <b style="color:#e6edf3">${aktVer.NAZIV||'—'}</b></div>
          <div>Opis: <b style="color:#e6edf3">${aktVer.OPIS||'—'}</b></div>
          <div>Datum: <b style="color:#e6edf3">${aktVer.DATUM||'—'}</b></div>
          <div>Autor: <b style="color:#58a6ff">${aktVer.AUTOR||'—'}</b></div>
        </div>
        ${AUTH.getUser()?.ULOGA==='superuser'?`
        <div style="display:flex;gap:8px;margin-top:10px">
          <button class="btn btn-primary" onclick="renderAI()">🔄 Osvježi</button>
        </div>`:''}
      </div>
    </div>
  </div>`;

  // Obnovi povijest chata
  const msgs = document.getElementById('ai-msgs');
  if (msgs && _ai_history.length>0) {
    _ai_history.forEach(m=>{
      const div = document.createElement('div');
      div.className = 'ai-b '+(m.role==='user'?'u':'b');
      div.textContent = m.content;
      msgs.appendChild(div);
    });
    msgs.scrollTop = msgs.scrollHeight;
  }
}

async function aiPosalji() {
  const input = document.getElementById('ai-input');
  const msgs  = document.getElementById('ai-msgs');
  const poruka = input?.value.trim();
  if (!poruka) return;
  input.value = '';

  // Prikaži korisnikovu poruku
  const userDiv = document.createElement('div');
  userDiv.className = 'ai-b u';
  userDiv.textContent = poruka;
  msgs.appendChild(userDiv);
  _ai_history.push({role:'user', content:poruka});

  // Loader
  const loadDiv = document.createElement('div');
  loadDiv.className = 'ai-b b';
  loadDiv.innerHTML = '<div class="spinner"></div>';
  msgs.appendChild(loadDiv);
  msgs.scrollTop = msgs.scrollHeight;

  // Poziv Apps Script backend (AI chat akcija)
  try {
    const res = await API.call('aiChat', {
      history: _ai_history.slice(-10), // zadnjih 10 poruka
      system: 'Ti si asistent za razvoj weberp-bj logističke aplikacije. ' +
              'Koristiš Google Apps Script za backend i vanilla JS + HTML za frontend. ' +
              'Aplikacija se zove weberp-bj i služi za upravljanje logistikom ' +
              'prehrambene tvrtke (narudžbe, skladišta, prijevoz, plan proizvodnje). ' +
              'Odgovaraj kratko i konkretno. Ako generiraš kod, koristi isti stil kao postojeći.'
    });
    loadDiv.remove();
    const odgovor = res.ok ? (res.data||res.msg||'Odgovor primljen.') : (res.error||'Greška pri obradi.');
    const botDiv = document.createElement('div');
    botDiv.className = 'ai-b b';
    botDiv.style.whiteSpace = 'pre-wrap';
    botDiv.textContent = odgovor;
    msgs.appendChild(botDiv);
    _ai_history.push({role:'assistant', content:odgovor});
  } catch(e) {
    loadDiv.remove();
    const errDiv = document.createElement('div');
    errDiv.className = 'ai-b b';
    errDiv.style.color = '#f85149';
    errDiv.textContent = 'Greška: ' + e.message + ' · Provjeri da li je AI Chat akcija implementirana u Apps Script.';
    msgs.appendChild(errDiv);
  }
  msgs.scrollTop = msgs.scrollHeight;
}

async function aktivirajVer(id) {
  if (!confirm('Aktivirati ovu verziju? Sve ostale verzije bit će deaktivirane.')) return;
  const res = await API.aktivirajVerziju(id);
  if (res.ok) { toast('Verzija aktivirana!','success'); await renderAI(); }
  else toast(res.error,'error');
}

function openDodajVer() {
  document.getElementById('modal-content').innerHTML = `
    <div class="modal-title">Dodaj novu verziju</div>
    <div class="form-group" style="margin-bottom:10px"><label>Naziv verzije *</label>
      <input type="text" id="ver-naziv" placeholder="npr. v2.1"></div>
    <div class="form-group" style="margin-bottom:10px"><label>Opis</label>
      <textarea id="ver-opis" placeholder="Što je novo u ovoj verziji..."></textarea></div>
    <div class="modal-footer">
      <button class="btn btn-secondary" onclick="closeModal()">Odustani</button>
      <button class="btn btn-primary" onclick="spremiVer()">Dodaj verziju</button>
    </div>`;
  openModal();
}

async function spremiVer() {
  const naziv = document.getElementById('ver-naziv').value.trim();
  const opis  = document.getElementById('ver-opis').value.trim();
  if (!naziv) { toast('Naziv je obavezan!','error'); return; }
  const res = await API.addVerzija({naziv, opis});
  if (res.ok) { toast(res.msg,'success'); closeModal(); await renderAI(); }
  else toast(res.error,'error');
}

// ═══════════════════════════════════════════════════════════════════
// POSTAVKE
// ═══════════════════════════════════════════════════════════════════
function renderPostavke() {
  const user = AUTH.getUser();
  document.getElementById('main-content').innerHTML = `
  <div style="font-size:17px;font-weight:800;margin-bottom:14px">⚙️ Postavke</div>
  <div class="g2">
    <div class="card">
      <div class="card-title">🔒 Promjena lozinke</div>
      <div class="form-group" style="margin-bottom:10px"><label>Stara lozinka</label>
        <input type="password" id="set-stara"></div>
      <div class="form-group" style="margin-bottom:10px"><label>Nova lozinka</label>
        <input type="password" id="set-nova"></div>
      <div class="form-group" style="margin-bottom:14px"><label>Potvrdi novu lozinku</label>
        <input type="password" id="set-nova2"></div>
      <button class="btn btn-primary" onclick="promijeniLozinku()">Promijeni lozinku</button>
    </div>
    <div class="card">
      <div class="card-title">ℹ️ Informacije o aplikaciji</div>
      <div style="font-size:12px;color:#7d8590;line-height:2.2">
        <div>Aplikacija: <b style="color:#e6edf3">weberp-bj v2.0</b></div>
        <div>Korisnik: <b style="color:#e6edf3">${user?.USERNAME}</b></div>
        <div>Ime: <b style="color:#e6edf3">${user?.IME_PREZIME||'—'}</b></div>
        <div>Uloga: <b style="color:#58a6ff">${user?.ULOGA}</b></div>
        <div>Email: <b style="color:#e6edf3">${user?.EMAIL||'—'}</b></div>
        <div>Baza: <b style="color:#e6edf3">Google Sheets</b></div>
        <div>Backend: <b style="color:#e6edf3">Google Apps Script</b></div>
      </div>
      <div style="margin-top:12px">
        <button class="btn btn-secondary btn-sm" onclick="location.reload()">🔄 Osvježi aplikaciju</button>
      </div>
    </div>
  </div>`;
}

async function promijeniLozinku() {
  const stara = document.getElementById('set-stara').value;
  const nova  = document.getElementById('set-nova').value;
  const nova2 = document.getElementById('set-nova2').value;
  if (nova !== nova2) { toast('Nove lozinke se ne podudaraju!','error'); return; }
  if (nova.length < 8) { toast('Lozinka mora imati min. 8 znakova!','error'); return; }
  const res = await API.promijeniLozinku(stara, nova);
  if (res.ok) toast('Lozinka promijenjena!','success');
  else toast(res.error,'error');
}
