// Spielt alle Fälle in beiden Regelwerken und beiden Rollen automatisch fehlerfrei durch
// und prüft Medikamentenwahl, Wissen und den Bearbeitungsmodus.
// Voraussetzung: python3 scripts/build.py   Aufruf: node tests/play.js
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const DIST = path.join(__dirname, '..', 'dist');
const TYPES = { html: 'text/html', js: 'text/javascript', css: 'text/css', json: 'application/json', webmanifest: 'application/manifest+json', svg: 'image/svg+xml', png: 'image/png' };

(async () => {
  if (!fs.existsSync(path.join(DIST, 'index.html'))) { console.error('dist/ fehlt – zuerst python3 scripts/build.py'); process.exit(1); }
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push(m.text()); });
  await page.route('**/*', r => {
    const u = new URL(r.request().url());
    if (u.host !== 'app.test') return r.fulfill({ status: 204, body: '' });
    const f = path.join(DIST, u.pathname === '/' ? 'index.html' : decodeURIComponent(u.pathname));
    if (!f.startsWith(DIST) || !fs.existsSync(f)) return r.fulfill({ status: 404, body: '' });
    return r.fulfill({ contentType: TYPES[f.split('.').pop()] || 'application/octet-stream', body: fs.readFileSync(f) });
  });
  await page.goto('http://app.test/');
  await page.waitForFunction(() => typeof dbState !== 'undefined' && dbState === 'ready' && wState === 'ready', null, { timeout: 10000 });

  const result = await page.evaluate(async () => {
    const out = [];
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    const answerOpen = () => {
      if (!M.q) return false;
      const ok = M.q.opts.find(o => o.ok);
      [...document.querySelectorAll('#qslot .opt')].find(x => x.textContent === ok.t).click();
      document.querySelector('#qnext').click(); return true;
    };
    for (const reg of ['sh', 'saa']) {
      if (REGION !== reg) setRegion(reg);
      for (const role of ['rs', 'ns']) {
        if (ROLE !== role) setRole(role);
        for (const cs of CASES) {
          M = { cs }; startMission(cs);
          let guard = 0;
          while (!M.ended && !document.querySelector('#mission').hidden && guard++ < 60) {
            const P = curP(); const pi = M.pi;
            for (const a of P.actions.filter(a => a.typ === 'pflicht' || a.typ === 'sinnvoll')) {
              if (M.done[pi + ':' + a.id]) continue;
              if (a.med && a.mittel.length) {
                const m = a.mittel.find(x => x.d !== '*');
                if (!m || !medKeys().includes(m.w) || !medDoses(m.w).includes(m.d)) { out.push({ reg, role, id: cs.id, err: 'Medikament nicht wählbar ' + a.id }); continue; }
                document.querySelector('#medslot .medopen').click();
                document.querySelector(`#medslot [data-medk="${m.w}"]`).click();
                document.querySelector(`#medslot [data-medd="${M.med.opts.indexOf(m.d)}"]`).click();
                if (!M.done[pi + ':' + a.id]) out.push({ reg, role, id: cs.id, err: 'Medikament nicht zugeordnet ' + a.id });
              } else doAction(a);
              while (answerOpen()) {}
            }
            leavePhase(); while (answerOpen()) {}
            if (M.pi === pi && !M.ended && !document.querySelector('#mission').hidden) { out.push({ reg, role, id: cs.id, err: 'Phase hängt ' + P.ph }); break; }
          }
          const bad = M.ended ? 'beendet: ' + M.ended.titel : (M.mistakes || M.missed || M.gross) ? `Fehler m${M.mistakes} v${M.missed} g${M.gross}` : '';
          out.push({ reg, role, id: cs.id, ok: !bad, bad });
          document.querySelector('#debrief').hidden = true; document.querySelector('#crit').hidden = true;
          await sleep(0);
        }
      }
    }
    // Medikamente: falsche Dosis und fehlende Indikation zählen als Fehler
    setRegion('sh'); setRole('ns');
    { const cs = CASES.find(c => c.id === 'lungenembolie'); M = { cs }; startMission(cs); M.pi = 3; renderPhase();
      giveMed('heparin', '25.000 I.E. i.v.'); giveMed('ondansetron', '4 mg i.v.'); giveMed('heparin', '5.000 I.E. i.v.');
      out.push({ check: 'Medikamente', ok: M.mistakes === 2 && !!M.done['3:e_heparin'] }); stopECG(); document.querySelector('#mission').hidden = true; }
    // Automatische Bewertung: Tourniquet beim Krampfanfall ist falsch
    { const cs = CASES.find(c => c.id === 'status-epilepticus'); const a = cs.phases[0].actions.find(a => a.id === 'tourniquet');
      out.push({ check: 'Auto-Bewertung', ok: a.typ === 'falsch' && a.auto }); }
    // Wissen je Regelwerk
    setRegion('sh'); showView('wissen');
    const h3 = () => [...document.querySelectorAll('#wissen-body .wcard h3')].map(h => h.textContent);
    const sh = h3(); setRegion('saa'); const saa = h3();
    out.push({ check: 'Wissen', ok: sh.includes('Metamizol') && !sh.includes('Fentanyl') && saa.includes('Fentanyl') && !saa.includes('Metamizol') });
    // Bearbeitungsmodus: lokale Änderung, Zähler, Verwerfen
    Store.setEditing(true); CAN_EDIT = true;
    await Store.collection('wissen').doc('test-eintrag').set({ kategorie: 'Sonstiges', titel: 'Testeintrag' });
    const n1 = Store.pending(); Store.discardChanges(); const n2 = Store.pending(); Store.setEditing(false);
    out.push({ check: 'Bearbeitungsmodus', ok: n1 === 1 && n2 === 0 });
    return out;
  });
  const runs = result.filter(r => r.id), checks = result.filter(r => r.check);
  const fails = runs.filter(r => !r.ok);
  console.log(`Durchläufe: ${runs.length}, fehlgeschlagen: ${fails.length}`);
  fails.forEach(f => console.log('  FEHLER', f.reg, f.role, f.id, f.bad || f.err));
  checks.forEach(c => console.log(`${c.ok ? 'ok    ' : 'FEHLER'} ${c.check}`));
  console.log('JS-Fehler:', errors.length ? errors.slice(0, 10) : 'keine');
  await browser.close();
  process.exit(fails.length || checks.some(c => !c.ok) || errors.length ? 1 : 0);
})();
