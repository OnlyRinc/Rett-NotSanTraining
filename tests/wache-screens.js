// Screenshots der Wache: jede Etage leer und voll ausgebaut, hell und dunkel, Handybreite 390 px.
// Voraussetzung: python3 scripts/build.py   Aufruf: node tests/wache-screens.js [zielordner]
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const DIST = path.join(__dirname, '..', 'dist');
const OUT = path.resolve(process.argv[2] || path.join(__dirname, '..', 'shots'));
const TYPES = { html: 'text/html', js: 'text/javascript', css: 'text/css', json: 'application/json', webmanifest: 'application/manifest+json', svg: 'image/svg+xml', png: 'image/png' };
const ALL = ['rtw', 'ktw', 'nef', 'rtw2', 'defi', 'rucksack', 'vakuum', 'beatmung', 'desinfektion', 'funk', 'kaffee', 'kueche', 'esstisch', 'tv', 'sofa', 'kicker', 'schulung', 'betten', 'fitness', 'spinde', 'dusche'];

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  for (const scheme of ['light', 'dark']) {
    for (const voll of [false, true]) {
      const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, colorScheme: scheme, reducedMotion: 'reduce', serviceWorkers: 'block' });
      const page = await ctx.newPage();
      await page.route('**/*', r => {
        const u = new URL(r.request().url());
        if (u.host !== 'app.test') return r.fulfill({ status: 204, body: '' });
        const f = path.join(DIST, u.pathname === '/' ? 'index.html' : decodeURIComponent(u.pathname));
        if (!fs.existsSync(f)) return r.fulfill({ status: 404, body: '' });
        return r.fulfill({ contentType: TYPES[f.split('.').pop()] || 'application/octet-stream', body: fs.readFileSync(f) });
      });
      await page.addInitScript(({ voll, ALL }) => {
        localStorage.setItem('wachenalarm.v1', JSON.stringify(voll ? { floors: 3, owned: ALL, coins: 9999, xp: 0 } : { floors: 3, owned: ['rtw'], coins: 0, xp: 0 }));
      }, { voll, ALL });
      await page.goto('http://app.test/');
      await page.waitForTimeout(400);
      for (const fl of [0, 1, 2]) {
        await page.evaluate(fl => { setView(fl); drawScene(performance.now()); }, fl);
        await page.waitForTimeout(150);
        const name = `wache-${['eg', 'og1', 'og2'][fl]}-${voll ? 'voll' : 'leer'}-${scheme === 'dark' ? 'dunkel' : 'hell'}`;
        await page.evaluate(() => { document.querySelector('.tabbar').style.visibility = 'hidden'; document.querySelector('#scene').scrollIntoView({ block: 'center' }); });
        await page.locator('#scene').screenshot({ path: path.join(OUT, name + '.png') });
        // Detailbild: Szene groß gerendert (1200 px breit), ohne Beschriftungen
        const data = await page.evaluate(() => { const c = document.getElementById('wache'), w = c.style.width; c.style.width = '1200px'; fitCanvas(); drawScene(performance.now()); const u = c.toDataURL('image/png'); c.style.width = w; fitCanvas(); drawScene(performance.now()); return u; });
        fs.writeFileSync(path.join(OUT, name + '-gross.png'), Buffer.from(data.split(',')[1], 'base64'));
      }
      await ctx.close();
    }
  }
  await browser.close();
  console.log('Screenshots in', OUT);
})();
