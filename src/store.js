/* Datenzugriff von Wachenalarm.
 *
 * Die App spricht nur mit window.Store. Heute: statische Inhalte aus data/*.json
 * plus lokale Entwürfe im Browser (Bearbeitungsmodus). Später kann hier ein
 * Server-Backend (z. B. Supabase) dieselbe Schnittstelle erfüllen:
 *
 *   Store.collection(name).onSnapshot(cb, onError)  → cb({docs:[{id, data()}]})
 *   Store.collection(name).doc(id).set(data) / .delete()
 *   Store.canEdit()            → Promise<boolean>
 *   Store.pending()            → Anzahl lokaler Änderungen
 *   Store.exportChanges()      → lädt die Änderungen als JSON herunter
 *   Store.discardChanges()     → verwirft lokale Änderungen
 */
(function () {
  const DRAFT_KEY = 'wachenalarm.entwuerfe';
  const EDIT_KEY = 'wachenalarm.bearbeiten';
  const COLS = ['faelle', 'wissen'];
  const base = {};          // name → {id: data} aus data/<name>.json
  const listeners = {};     // name → [{cb, err}]
  const loaded = {};        // name → Promise

  const readDrafts = () => { try { return JSON.parse(localStorage.getItem(DRAFT_KEY)) || {}; } catch (e) { return {}; } };
  const writeDrafts = d => { try { localStorage.setItem(DRAFT_KEY, JSON.stringify(d)); } catch (e) { throw Object.assign(new Error('Speicher voll'), { code: 'quota_exceeded' }); } };
  const clone = o => JSON.parse(JSON.stringify(o));

  function load(name) {
    if (!loaded[name]) {
      loaded[name] = fetch(`data/${name}.json`, { cache: 'no-cache' })
        .then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
        .then(list => { base[name] = {}; list.forEach(d => { base[name][d.id] = d.data; }); });
    }
    return loaded[name];
  }

  function snapshot(name) {
    const merged = Object.assign({}, base[name] || {});
    const dr = readDrafts()[name] || {};
    Object.entries(dr).forEach(([id, v]) => { if (v === null) delete merged[id]; else merged[id] = v; });
    return { docs: Object.entries(merged).map(([id, data]) => ({ id, data: () => clone(data) })) };
  }

  function emit(name) { (listeners[name] || []).forEach(l => { try { l.cb(snapshot(name)); } catch (e) { console.error(e); } }); }

  function writeDraft(name, id, value) {
    const d = readDrafts(); d[name] = d[name] || {};
    const orig = (base[name] || {})[id];
    if (value === null && orig === undefined) delete d[name][id];
    else if (value !== null && orig !== undefined && JSON.stringify(orig) === JSON.stringify(value)) delete d[name][id];
    else d[name][id] = value === null ? null : clone(value);
    writeDrafts(d); emit(name);
  }

  window.Store = {
    collection(name) {
      return {
        onSnapshot(cb, err) {
          (listeners[name] = listeners[name] || []).push({ cb, err });
          load(name).then(() => cb(snapshot(name))).catch(e => { console.error(e); if (err) err(e); });
          return () => { listeners[name] = (listeners[name] || []).filter(l => l.cb !== cb); };
        },
        doc(id) {
          return {
            async set(data) { if (!window.Store.editing()) throw Object.assign(new Error('Nur im Bearbeitungsmodus'), { code: 'invalid_argument' }); writeDraft(name, id, data); },
            async delete() { if (!window.Store.editing()) throw Object.assign(new Error('Nur im Bearbeitungsmodus'), { code: 'invalid_argument' }); writeDraft(name, id, null); }
          };
        }
      };
    },
    editing() { try { return localStorage.getItem(EDIT_KEY) === '1'; } catch (e) { return false; } },
    setEditing(on) { try { localStorage.setItem(EDIT_KEY, on ? '1' : '0'); } catch (e) {} },
    async canEdit() { return this.editing(); },
    pending() { const d = readDrafts(); return COLS.reduce((n, c) => n + Object.keys(d[c] || {}).length, 0); },
    exportChanges() {
      const d = readDrafts(); const out = { erstellt: new Date().toISOString() };
      COLS.forEach(c => { out[c] = d[c] || {}; });
      const blob = new Blob([JSON.stringify(out, null, 1)], { type: 'application/json' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
      a.download = `wachenalarm-aenderungen-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
    },
    discardChanges() { writeDrafts({}); COLS.forEach(emit); }
  };
})();
