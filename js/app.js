/* Wizbolt, Spielerbegleiter. Reines JavaScript ohne Abhängigkeiten, speichert lokal im Browser. */
(function () {
  'use strict';
  var D = window.WizDice;
  var KEY = 'wizbolt-v1';
  var CHAR, ST;
  var ui = { tab: 'held', filter: 'all', q: '', open: null, castLvl: {}, mode: null, crit: false, history: [], drawer: false, concPrompt: null, last: null };

  /* ---------- Hilfsfunktionen ---------- */
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function merge(base, over) {
    if (!over || typeof over !== 'object') return base;
    Object.keys(over).forEach(function (k) {
      var v = over[k];
      if (v && typeof v === 'object' && !Array.isArray(v) && base[k] && typeof base[k] === 'object' && !Array.isArray(base[k])) merge(base[k], v);
      else base[k] = v;
    });
    return base;
  }
  function h(tag, props, kids) {
    var el = document.createElement(tag);
    if (props) Object.keys(props).forEach(function (k) {
      var v = props[k];
      if (v === null || v === undefined || v === false) return;
      if (k === 'class') el.className = v;
      else if (k === 'text') el.textContent = v;
      else if (k.slice(0, 2) === 'on') el.addEventListener(k.slice(2), v);
      else if (k === 'checked' || k === 'value' || k === 'disabled') el[k] = v;
      else el.setAttribute(k, v === true ? '' : v);
    });
    (kids || []).forEach(function (c) {
      if (c === null || c === undefined || c === false) return;
      el.appendChild(typeof c === 'string' || typeof c === 'number' ? document.createTextNode(String(c)) : c);
    });
    return el;
  }
  var sg = D.signed;
  function $(id) { return document.getElementById(id); }

  /* ---------- Speicher ---------- */
  function load() {
    CHAR = clone(window.WIZ_DEFAULT_CHAR); ST = clone(window.WIZ_DEFAULT_STATE);
    try {
      var raw = localStorage.getItem(KEY);
      if (raw) { var o = JSON.parse(raw); merge(CHAR, o.char); merge(ST, o.state); }
    } catch (e) { /* kaputte Daten ignorieren, Standard bleibt */ }
  }
  var saveTimer = null, saveFailed = false;
  function save() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(function () {
      try { localStorage.setItem(KEY, JSON.stringify({ char: CHAR, state: ST })); saveFailed = false; }
      catch (e) { if (!saveFailed) toast('Speichern nicht möglich. Exportiere deine Daten unter „Daten“.'); saveFailed = true; }
    }, 150);
  }

  /* ---------- Abgeleitete Werte ---------- */
  function pb() { return D.profBonus(CHAR.level); }
  function mod(a) { return D.abilityMod(CHAR.abilities[a]); }
  function saveBonus(a) { return mod(a) + (CHAR.saveProf[a] ? pb() : 0); }
  function skillBonus(s) { return mod(s.abil) + (CHAR.skillProf[s.id] ? pb() : 0); }
  function spellMod() { return mod('INT'); }
  function spellAtk() { return pb() + spellMod(); }
  function spellDC() { return 8 + pb() + spellMod(); }
  function armor() { return ST.mageArmor ? CHAR.mageArmorAC + mod('DEX') : CHAR.baseAC; }
  function prepMax() { return CHAR.prepMax !== null && CHAR.prepMax !== undefined && CHAR.prepMax !== '' ? +CHAR.prepMax : Math.max(1, spellMod() + CHAR.level); }
  function prepCount() { return window.WIZ_SPELLS.filter(function (s) { return s.level > 0 && ST.prepared[s.id]; }).length; }
  function dmgBonus() { return ST.settings.damageBonusOn ? (+ST.settings.spellDamageBonus || 0) : 0; }
  function abilShort(id) { return window.WIZ_ABILITIES.filter(function (a) { return a.id === id; })[0].short; }
  function slotsLeft(l) { return Math.max(0, (CHAR.slotsMax[l] || 0) - (ST.slotsUsed[l] || 0)); }
  function maxSlotLevel() { return [5, 4, 3, 2, 1].filter(function (l) { return CHAR.slotsMax[l] > 0; })[0] || 0; }

  /* ---------- Rückmeldung ---------- */
  var toastTimer;
  function toast(msg) {
    var old = document.querySelector('.toast'); if (old) old.remove();
    var t = h('div', { class: 'toast', role: 'status', text: msg }); document.body.appendChild(t);
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { t.remove(); }, 3200);
  }
  function modal(title, body) {
    var bg = h('div', { class: 'modal-bg', onclick: function (e) { if (e.target === bg) bg.remove(); } });
    var m = h('div', { class: 'modal', role: 'dialog', 'aria-label': title }, [h('h2', { text: title }), body]);
    bg.appendChild(m); document.body.appendChild(bg);
    return { close: function () { bg.remove(); } };
  }

  /* ---------- Würfe ---------- */
  function d20text(r) {
    var inner = r.rolls.length === 2 ? r.rolls.join(', ') + ' → ' + r.kept : String(r.kept);
    return 'd20 (' + inner + ')' + (r.mod ? ' ' + sg(r.mod) : '');
  }
  function diceText(r) {
    var parts = r.groups.map(function (g) { return (g.sign < 0 ? '−' : '') + g.n + 'd' + g.sides + ' (' + g.values.join('+') + ')'; });
    return parts.join(' + ') + (r.mod ? ' ' + sg(r.mod) : '');
  }
  function d20Pill(label, bonus, forceMode) {
    var mode = forceMode || ui.mode;
    var r = D.d20(bonus, mode);
    if (!forceMode) ui.mode = null;
    var tag = mode === 'adv' ? ' mit Vorteil' : mode === 'dis' ? ' mit Nachteil' : '';
    return { label: label + tag, value: r.total, detail: d20text(r), tone: r.crit ? 'crit' : r.fumble ? 'fumble' : '', nat: r.crit ? 'Natürliche 20' : r.fumble ? 'Natürliche 1' : '' };
  }
  function dicePill(label, formula, extra, critDouble) {
    var p = D.parse(formula);
    if (critDouble) p = { dice: p.dice.map(function (d) { return { n: d.n * 2, sides: d.sides, sign: d.sign }; }), mod: p.mod };
    var r = D.roll(p, extra);
    return { label: label, value: r.total, detail: diceText(r), tone: critDouble ? 'crit' : '' };
  }
  function showRoll(title, sub, pills) {
    var entry = { title: title, sub: sub || '', pills: pills, ts: new Date() };
    ui.last = entry; ui.history.unshift(entry); if (ui.history.length > 60) ui.history.pop();
    renderTray(true); renderHead();
    if (ui.drawer) renderDrawer();
  }

  function rollCheck(title, bonus, sub, forceMode) { showRoll(title, sub || '', [d20Pill('Wurf', bonus, forceMode)]); }

  /* Würfel eines Zauber-Eintrags */
  function spellDice(sp, r, castLvl) {
    var f = r.dice;
    if (r.cantrip) f = D.scaleCantrip(f, CHAR.level);
    else if (r.up) f = D.addDice(f, r.up, Math.max(0, castLvl - sp.level));
    return f;
  }
  function spellRollPills(sp, r, castLvl) {
    var out = [], crit = ui.crit;
    if (r.kind === 'attack') {
      out.push(d20Pill('Zauberangriff', spellAtk()));
    } else if (r.kind === 'dmg') {
      var f = spellDice(sp, r, castLvl), b = r.bonus ? dmgBonus() : 0;
      out.push(dicePill(r.label + ', ' + r.type, f, b, crit)); ui.crit = false;
    } else if (r.kind === 'heal') {
      out.push(dicePill(r.label, D.addDice(r.dice, r.up, Math.max(0, castLvl - sp.level)), spellMod(), false));
    } else if (r.kind === 'sum') {
      out.push(dicePill(r.label, D.addDice(r.dice, r.up, Math.max(0, castLvl - sp.level)), 0, false));
    } else if (r.kind === 'darts') {
      var n = 3 + Math.max(0, castLvl - 1), total = 0, bonus = r.bonus ? dmgBonus() : 0;
      for (var i = 1; i <= n; i++) { var p = dicePill('Pfeil ' + i, r.per, bonus, crit); total += p.value; out.push(p); }
      ui.crit = false;
      out.push({ label: 'Gesamt, ' + r.type, value: total, detail: n + ' Pfeile', tone: '' });
    } else if (r.kind === 'save') {
      out.push({ label: 'SG ' + spellDC() + ' ' + abilShort(r.abil), value: abilShort(r.abil), detail: r.half ? 'Erfolg: halber Schaden' : 'Erfolg: kein Schaden oder Effekt', tone: 'info' });
    }
    return out;
  }

  /* Zauber wirken: Platz verbrauchen, Konzentration setzen, Würfe ausführen */
  function castSpell(sp, castLvl, ritual) {
    var notes = [];
    if (sp.level > 0 && !ritual) {
      if (slotsLeft(castLvl) < 1) { toast('Kein Zauberplatz Grad ' + castLvl + ' mehr übrig.'); return; }
      ST.slotsUsed[castLvl] = (ST.slotsUsed[castLvl] || 0) + 1;
      ui.flashLvl = castLvl;
    }
    if (sp.conc) {
      if (ST.concentration && ST.concentration !== sp.name) notes.push('Konzentration auf ' + ST.concentration + ' endet.');
      ST.concentration = sp.name;
    }
    if (sp.effect === 'mageArmor') ST.mageArmor = true;
    var pills = [];
    sp.roll.forEach(function (r) { if (!r.later) pills = pills.concat(spellRollPills(sp, r, castLvl)); });
    if (!pills.length) pills.push({ label: ritual ? 'Als Ritual gewirkt' : 'Gewirkt', value: '✓', detail: ritual ? 'Dauert 10 Minuten länger' : '', tone: 'info' });
    var sub = (sp.level > 0 ? (ritual ? 'Ritual, kein Platz verbraucht' : 'Zauberplatz Grad ' + castLvl) : 'Zaubertrick');
    if (sp.level > 0 && !ritual && !ST.prepared[sp.id]) notes.push('Nicht als vorbereitet markiert.');
    showRoll(sp.name, sub, pills);
    if (notes.length) toast(notes.join(' '));
    save(); render();
  }

  /* ---------- Trefferpunkte ---------- */
  function applyDamage(n) {
    n = Math.max(0, Math.floor(+n || 0)); if (!n) return;
    var t = Math.min(ST.temp, n); ST.temp -= t; var rest = n - t;
    var before = ST.hp; ST.hp = Math.max(0, ST.hp - rest);
    if (ST.hp === 0 && before > 0) ST.death = { s: 0, f: 0 };
    ui.concPrompt = ST.concentration ? { dc: Math.max(10, Math.floor(n / 2)), name: ST.concentration } : null;
    save(); render();
  }
  function applyHeal(n) {
    n = Math.max(0, Math.floor(+n || 0)); if (!n) return;
    ST.hp = Math.min(CHAR.hpMax, ST.hp + n); ST.death = { s: 0, f: 0 }; save(); render();
  }
  function useHitDie() {
    if (ST.hitDice < 1) { toast('Keine Trefferwürfel mehr übrig.'); return; }
    ST.hitDice--;
    var r = D.roll('1d' + CHAR.hitDie, mod('CON'));
    var gain = Math.max(0, r.total), real = Math.min(gain, CHAR.hpMax - ST.hp);
    ST.hp += real;
    showRoll('Trefferwürfel', real + ' TP geheilt', [{ label: '1W' + CHAR.hitDie + ' + Kon', value: gain, detail: diceText(r), tone: '' }]);
    save(); render();
  }
  function longRest() {
    ST.hp = CHAR.hpMax; ST.temp = 0; ST.slotsUsed = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    ST.hitDice = Math.min(CHAR.hitDiceMax, ST.hitDice + Math.max(1, Math.floor(CHAR.hitDiceMax / 2)));
    ST.recoveryUsed = false; ST.mageArmor = false; ST.death = { s: 0, f: 0 }; ui.concPrompt = null;
    save(); render(); toast('Lange Rast: TP, Zauberplätze und Arkane Erholung zurückgesetzt.');
  }
  function recoveryModal() {
    if (ST.recoveryUsed) { toast('Arkane Erholung ist heute schon benutzt.'); return; }
    var budget = Math.floor(CHAR.level / 2), picked = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }, used = 0;
    var body = h('div'), m;
    function draw() {
      body.innerHTML = '';
      body.appendChild(h('p', { class: 'muted', text: 'Du darfst Zauberplätze mit zusammen höchstens ' + budget + ' Graden zurückholen, keinen ab Grad 6. Bereits gewählt: ' + used + ' von ' + budget + '.' }));
      var any = false;
      [1, 2, 3, 4, 5].forEach(function (l) {
        var spent = (ST.slotsUsed[l] || 0) - picked[l];
        if (spent > 0 || picked[l] > 0) any = true; else return;
        body.appendChild(h('div', { class: 'btnrow', style: 'margin:8px 0' }, [
          h('span', { text: 'Grad ' + l + ': ' + spent + ' verbraucht', style: 'min-width:170px' }),
          h('button', { class: 'btn sm', disabled: spent < 1 || used + l > budget, text: 'Platz zurückholen', onclick: function () { picked[l]++; used += l; draw(); } }),
          picked[l] ? h('span', { class: 'muted', text: '+' + picked[l] }) : null
        ]));
      });
      if (!any) body.appendChild(h('p', { text: 'Du hast keine verbrauchten Zauberplätze.' }));
      body.appendChild(h('div', { class: 'btnrow', style: 'margin-top:14px' }, [
        h('button', { class: 'btn brass', disabled: !used, text: 'Übernehmen', onclick: function () {
          [1, 2, 3, 4, 5].forEach(function (l) { ST.slotsUsed[l] -= picked[l]; });
          ST.recoveryUsed = true; m.close(); save(); render(); toast('Arkane Erholung benutzt.');
        } }),
        h('button', { class: 'btn ghost', text: 'Abbrechen', onclick: function () { m.close(); } })
      ]));
    }
    m = modal('Arkane Erholung', body); draw();
  }

  /* ---------- Kopfbereich und Wurf-Anzeige ---------- */
  var TABS = [['held', 'Held'], ['zauber', 'Zauber'], ['wuerfel', 'Würfel'], ['merkmale', 'Merkmale'], ['notizen', 'Notizen'], ['daten', 'Daten']];
  function renderHead() {
    var el = $('top'); el.innerHTML = '';
    var modeBtns = [['dis', 'Nachteil'], ['', 'Normal'], ['adv', 'Vorteil']].map(function (m) {
      return h('button', { class: m[0], 'aria-pressed': String((ui.mode || '') === m[0]), text: m[1], onclick: function () { ui.mode = m[0] || null; renderHead(); } });
    });
    var row = h('div', { class: 'top-row' }, [
      h('div', { class: 'ident' }, [
        h('h1', { text: CHAR.name }),
        h('p', { text: CHAR.race + ', ' + CHAR.klass + ', Stufe ' + CHAR.level })
      ]),
      h('div', { class: 'mode', role: 'group', 'aria-label': 'Nächster d20-Wurf' }, modeBtns)
    ]);
    el.appendChild(row);
    if (ST.concentration) el.appendChild(h('div', { class: 'conc' }, [
      h('span', {}, ['Konzentration: ', h('b', { text: ST.concentration })]),
      h('button', { class: 'btn sm ghost', text: 'Beenden', onclick: function () { ST.concentration = null; ui.concPrompt = null; save(); render(); } })
    ]));
    var tabs = h('div', { class: 'tabs', role: 'tablist' }, TABS.map(function (t) {
      return h('button', { role: 'tab', 'aria-selected': String(ui.tab === t[0]), text: t[1], onclick: function () { ui.tab = t[0]; render(); window.scrollTo(0, 0); } });
    }));
    el.appendChild(tabs);
  }
  function pillEl(p, fresh) {
    return h('div', { class: 'pill ' + (p.tone || '') + (fresh ? ' fresh' : ''), title: p.detail || '' }, [
      h('div', { class: 'pv', text: String(p.value) }),
      h('div', { class: 'pl', text: p.nat || p.label })
    ]);
  }
  function renderTray(fresh) {
    var el = $('tray'); el.innerHTML = '';
    var inner = h('div', { class: 'tray-in' });
    if (!ui.last) {
      inner.appendChild(h('div', { class: 'tray-empty', text: 'Tippe auf einen Wert, eine Fertigkeit oder einen Zauber, um zu würfeln.' }));
    } else {
      var e = ui.last;
      inner.appendChild(h('div', { class: 'tray-title' }, [h('b', { text: e.title }), h('span', { text: e.pills.length === 1 ? e.pills[0].detail : e.sub })]));
      inner.appendChild(h('div', { class: 'pills' }, e.pills.map(function (p) { return pillEl(p, fresh); })));
    }
    inner.appendChild(h('button', { class: 'btn ghost', 'aria-expanded': String(ui.drawer), text: ui.drawer ? 'Verlauf zu' : 'Verlauf', onclick: function () { ui.drawer = !ui.drawer; renderDrawer(); renderTray(); } }));
    el.appendChild(inner);
  }
  function renderDrawer() {
    var el = $('drawer'); el.innerHTML = ''; el.hidden = !ui.drawer; if (!ui.drawer) return;
    var list = ui.history.length ? h('ul', { class: 'hist' }, ui.history.map(function (e) {
      return h('li', {}, [
        h('div', {}, [h('b', { text: e.title }), ' ', h('span', { class: 'muted', text: e.sub }), h('div', { class: 'small muted', text: e.pills.map(function (p) { return p.label + ' ' + p.value + (p.detail && p.tone !== 'info' ? ' [' + p.detail + ']' : ''); }).join('; ') })]),
        h('span', { class: 't', text: e.ts.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) })
      ]);
    })) : h('div', { class: 'empty', text: 'Noch keine Würfe.' });
    el.appendChild(h('div', { class: 'in' }, [h('div', { class: 'btnrow', style: 'justify-content:space-between;margin:6px 0' }, [h('h3', { text: 'Verlauf' }), h('button', { class: 'btn sm ghost', text: 'Leeren', onclick: function () { ui.history = []; renderDrawer(); } })]), list]));
  }

  /* ---------- Tab: Held ---------- */
  function statBtn(label, value, onclick, on) {
    return h(onclick ? 'button' : 'div', { class: 'stat' + (on ? ' on' : ''), onclick: onclick }, [h('span', { class: 'v', text: String(value) }), h('span', { class: 'l', text: label })]);
  }
  function pipRow(kind, n, set) {
    return h('span', { class: 'pips' }, [0, 1, 2].map(function (i) {
      return h('button', { class: 'pip ' + kind + (i < n ? ' on' : ''), 'aria-label': (kind === 's' ? 'Erfolg ' : 'Fehlschlag ') + (i + 1), 'aria-pressed': String(i < n), onclick: function () { set(i < n ? i : i + 1); } });
    }));
  }
  function renderHeld(root) {
    var pct = Math.max(0, Math.min(100, ST.hp / CHAR.hpMax * 100));
    var qty = h('input', { type: 'number', inputmode: 'numeric', min: '0', id: 'hpamt', placeholder: 'Menge', 'aria-label': 'Menge für Schaden oder Heilung' });
    var val = function () { return +qty.value || 0; };
    var hpPanel = h('section', { class: 'panel', 'aria-label': 'Trefferpunkte' }, [
      h('div', { class: 'hp' }, [
        h('div', {}, [
          h('div', { class: 'hp-num' }, [String(ST.hp), h('small', { text: ' / ' + CHAR.hpMax })]),
          h('div', { class: 'bar' + (pct < 30 ? ' low' : '') }, [h('i', { style: 'width:' + pct + '%' })]),
          h('div', { class: 'muted small', text: 'Temporäre TP: ' + ST.temp })
        ]),
        h('div', {}, [
          h('div', { class: 'hp-ctl' }, [
            h('button', { class: 'btn', text: '−5', onclick: function () { applyDamage(5); } }),
            h('button', { class: 'btn', text: '−1', onclick: function () { applyDamage(1); } }),
            h('button', { class: 'btn', text: '+1', onclick: function () { applyHeal(1); } }),
            h('button', { class: 'btn', text: '+5', onclick: function () { applyHeal(5); } }),
            qty,
            h('button', { class: 'btn danger', text: 'Schaden', onclick: function () { applyDamage(val()); } }),
            h('button', { class: 'btn brass', text: 'Heilung', onclick: function () { applyHeal(val()); } }),
            h('button', { class: 'btn', text: 'Temp. TP', onclick: function () { ST.temp = Math.max(ST.temp, val()); save(); render(); } })
          ]),
          ui.concPrompt && ST.concentration ? h('div', { class: 'alert' }, [
            h('div', { text: 'Du bist auf ' + ui.concPrompt.name + ' konzentriert. Konstitutionsrettungswurf gegen SG ' + ui.concPrompt.dc + '.' }),
            h('div', { class: 'btnrow', style: 'margin-top:8px' }, [
              h('button', { class: 'btn spark sm', text: 'Wurf Kon ' + sg(saveBonus('CON')), onclick: function () {
                var p = d20Pill('Konzentration', saveBonus('CON')); p.detail += ' gegen SG ' + ui.concPrompt.dc + ': ' + (p.value >= ui.concPrompt.dc ? 'gehalten' : 'verloren');
                if (p.value < ui.concPrompt.dc) { ST.concentration = null; ui.concPrompt = null; save(); }
                showRoll('Konzentration', '', [p]); render();
              } }),
              h('button', { class: 'btn sm ghost', text: 'Ignorieren', onclick: function () { ui.concPrompt = null; render(); } })
            ])
          ]) : null,
          ST.hp === 0 ? h('div', { class: 'alert warn' }, [
            h('div', { text: 'Bewusstlos. Todesrettungswürfe (ab 10 Erfolg):' }),
            h('div', { class: 'btnrow', style: 'margin-top:8px' }, [
              h('span', { text: 'Erfolge ' }), pipRow('s', ST.death.s, function (n) { ST.death.s = n; save(); render(); }),
              h('span', { text: ' Fehlschläge ' }), pipRow('f', ST.death.f, function (n) { ST.death.f = n; save(); render(); }),
              h('button', { class: 'btn sm brass', text: 'Wurf', onclick: function () {
                var p = d20Pill('Todesrettungswurf', 0);
                if (p.value === 20) { ST.hp = 1; ST.death = { s: 0, f: 0 }; }
                else if (p.value === 1) ST.death.f = Math.min(3, ST.death.f + 2);
                else if (p.value >= 10) ST.death.s = Math.min(3, ST.death.s + 1); else ST.death.f = Math.min(3, ST.death.f + 1);
                showRoll('Todesrettungswurf', p.value === 20 ? 'Wieder bei 1 TP' : p.value >= 10 ? 'Erfolg' : 'Fehlschlag', [p]); save(); render();
              } })
            ])
          ]) : null
        ])
      ]),
      h('div', { class: 'btnrow', style: 'margin-top:12px;border-top:1px solid var(--line);padding-top:12px' }, [
        h('span', { class: 'muted', text: 'Trefferwürfel ' + ST.hitDice + ' / ' + CHAR.hitDiceMax + ' (W' + CHAR.hitDie + ')' }),
        h('button', { class: 'btn sm', text: 'Trefferwürfel nutzen', onclick: useHitDie }),
        h('button', { class: 'btn sm', disabled: ST.recoveryUsed, text: ST.recoveryUsed ? 'Arkane Erholung benutzt' : 'Arkane Erholung', onclick: recoveryModal }),
        h('button', { class: 'btn sm danger', text: 'Lange Rast', onclick: function () {
          var m = modal('Lange Rast', h('div', {}, [h('p', { text: 'Setzt TP, Zauberplätze und Arkane Erholung zurück, holt die Hälfte deiner Trefferwürfel zurück und beendet Magierrüstung.' }), h('div', { class: 'btnrow' }, [h('button', { class: 'btn brass', text: 'Lange Rast machen', onclick: function () { m.close(); longRest(); } }), h('button', { class: 'btn ghost', text: 'Abbrechen', onclick: function () { m.close(); } })])]));
        } })
      ])
    ]);
    root.appendChild(hpPanel);

    root.appendChild(h('div', { class: 'grid vitals', style: 'margin-top:16px' }, [
      statBtn('Rüstungsklasse' + (ST.mageArmor ? ' (Magierrüstung)' : ''), armor(), function () { ST.mageArmor = !ST.mageArmor; save(); render(); toast(ST.mageArmor ? 'Magierrüstung aktiv: RK ' + (CHAR.mageArmorAC + mod('DEX')) : 'Magierrüstung beendet: RK ' + CHAR.baseAC); }, ST.mageArmor),
      statBtn('Initiative würfeln', sg(mod('DEX')), function () { rollCheck('Initiative', mod('DEX')); }),
      statBtn('Bewegungsrate', CHAR.speed),
      statBtn('Übungsbonus', sg(pb())),
      statBtn('Zauber-SG', spellDC()),
      statBtn('Zauberangriff würfeln', sg(spellAtk()), function () { rollCheck('Zauberangriff', spellAtk()); }),
      statBtn('Passive Wahrnehmung', 10 + skillBonus(window.WIZ_SKILLS.filter(function (s) { return s.id === 'perception'; })[0])),
      statBtn('Inspiration', ST.inspiration ? 'Ja' : 'Nein', function () { ST.inspiration = !ST.inspiration; save(); render(); }, ST.inspiration)
    ]));

    var ab = h('div', { class: 'grid abilities' }, window.WIZ_ABILITIES.map(function (a) {
      var m = mod(a.id), sv = saveBonus(a.id);
      var acts = [
        h('button', { onclick: function () { rollCheck(a.name + ', Probe', m); } }, [h('span', { text: 'Probe' }), h('b', { class: 'num', text: sg(m) })]),
        h('button', { onclick: function () { rollCheck(a.name + ', Rettungswurf', sv); } }, [h('span', {}, [h('i', { class: 'prof' + (CHAR.saveProf[a.id] ? ' on' : '') }), 'Rettung']), h('b', { class: 'num', text: sg(sv) })])
      ];
      if (['INT', 'WIS', 'CHA'].indexOf(a.id) >= 0) acts.push(h('button', { class: 'gg', onclick: function () { rollCheck(a.name + ', Rettungswurf gegen Magie', sv, 'Gnomische Gerissenheit: Vorteil', 'adv'); } }, [h('span', { text: 'Rettung gegen Magie (Vorteil)' }), h('b', { class: 'num', text: sg(sv) })]));
      return h('div', { class: 'abil' }, [
        h('div', { class: 'head' }, [h('b', { text: a.name })]),
        h('div', { class: 'big' }, [h('span', { class: 'm', text: sg(m) }), h('span', { class: 's', text: CHAR.abilities[a.id] })]),
        h('div', { class: 'acts' }, acts)
      ]);
    }));
    root.appendChild(ab);

    var skills = h('ul', { class: 'rows' }, window.WIZ_SKILLS.map(function (s) {
      var b = skillBonus(s), line = [h('button', { class: 'rowbtn', onclick: function () { rollCheck(s.name, b, abilShort(s.abil)); } }, [
        h('i', { class: 'prof' + (CHAR.skillProf[s.id] ? ' on' : ''), 'aria-label': CHAR.skillProf[s.id] ? 'geübt' : 'nicht geübt' }),
        h('span', { class: 'nm', text: s.name + ' (' + abilShort(s.abil) + ')' }), h('span', { class: 'bv', text: sg(b) })
      ])];
      if (s.id === 'history') line.push(h('button', { class: 'tag', title: 'Artefaktkunde: doppelter Übungsbonus bei magischen, alchemistischen oder technischen Gegenständen', text: 'Artefakt ' + sg(b + pb()), onclick: function () { rollCheck('Geschichte, Artefaktkunde', b + pb(), 'doppelter Übungsbonus'); } }));
      return h('li', {}, line);
    }));
    var weapons = h('ul', { class: 'rows' }, window.WIZ_WEAPONS.map(function (w) {
      var m = mod(w.abil), atk = m + (w.prof ? pb() : 0);
      return h('li', { style: 'flex-wrap:wrap' }, [
        h('button', { class: 'rowbtn', onclick: function () { rollCheck(w.name + ', Angriff', atk, w.range); } }, [h('span', { class: 'nm' }, [w.name, h('span', { class: 'muted small', text: '  ' + w.range + (w.note ? ', ' + w.note : '') })]), h('span', { class: 'bv', text: sg(atk) })]),
        h('button', { class: 'tag', text: w.dice.replace('d', 'W') + sg(m).replace('+0', '') + ' ' + w.type, onclick: function () { var p = dicePill('Schaden, ' + w.type, w.dice, m, ui.crit); ui.crit = false; showRoll(w.name, 'Schaden', [p]); } })
      ]);
    }));
    root.appendChild(h('div', { class: 'grid two' }, [
      h('section', { class: 'panel' }, [h('h2', { text: 'Fertigkeiten' }), skills]),
      h('section', { class: 'panel' }, [h('h2', { text: 'Waffen' }), weapons,
        h('label', { class: 'crit' }, [h('input', { type: 'checkbox', checked: ui.crit, onchange: function (e) { ui.crit = e.target.checked; } }), 'Nächster Schaden kritisch (Würfel verdoppelt)'])])
    ]));
  }

  /* ---------- Tab: Zauber ---------- */
  function gems(l) {
    var max = CHAR.slotsMax[l] || 0, row = [];
    for (var i = 0; i < max; i++) {
      (function (i) {
        var spent = i >= max - (ST.slotsUsed[l] || 0);
        row.push(h('button', { class: 'gem' + (spent ? ' spent' : '') + (ui.flashLvl === l && i === max - (ST.slotsUsed[l] || 0) ? ' flash' : ''), 'aria-label': 'Zauberplatz Grad ' + l + ', ' + (spent ? 'verbraucht' : 'verfügbar'), 'aria-pressed': String(!spent),
          onclick: function () { ST.slotsUsed[l] = spent ? Math.max(0, (ST.slotsUsed[l] || 0) - 1) : Math.min(max, (ST.slotsUsed[l] || 0) + 1); ui.flashLvl = spent ? null : l; save(); render(); } }));
      })(i);
    }
    return h('div', { class: 'gems' }, row);
  }
  function filterSpell(s) {
    var f = ui.filter;
    if (f === 'c' && s.level !== 0) return false;
    if (/^l\d$/.test(f) && s.level !== +f[1]) return false;
    if (f === 'prep' && !(s.level === 0 || ST.prepared[s.id])) return false;
    if (f === 'rit' && !s.ritual) return false;
    if (f === 'conc' && !s.conc) return false;
    if (ui.q) { var q = ui.q.toLowerCase(); if ((s.name + ' ' + s.school + ' ' + s.text).toLowerCase().indexOf(q) < 0) return false; }
    return true;
  }
  function flavorFor(sp) {
    var F = window.WIZ_FLAVOR || {}, want = sp.name.toLowerCase().replace('person ', 'personen ');
    var k = Object.keys(F).filter(function (x) { return x.toLowerCase() === want || x.toLowerCase() === sp.name.toLowerCase(); })[0];
    return k ? F[k] : null;
  }
  function rollLabel(sp, r, castLvl) {
    if (r.kind === 'attack') return 'Zauberangriff ' + sg(spellAtk());
    if (r.kind === 'dmg') { var f = spellDice(sp, r, castLvl), b = r.bonus ? dmgBonus() : 0; return r.label + ': ' + f.replace(/d/g, 'W') + (b ? '+' + b : '') + ' ' + r.type; }
    if (r.kind === 'heal') return r.label + ': ' + D.addDice(r.dice, r.up, Math.max(0, castLvl - sp.level)).replace(/d/g, 'W') + '+' + spellMod();
    if (r.kind === 'sum') return r.label + ': ' + D.addDice(r.dice, r.up, Math.max(0, castLvl - sp.level)).replace(/d/g, 'W');
    if (r.kind === 'darts') return 'Pfeile: ' + (3 + Math.max(0, castLvl - 1)) + ' × ' + r.per.replace(/d/g, 'W') + (r.bonus && dmgBonus() ? '+' + dmgBonus() : '');
    return '';
  }
  function spellCard(sp) {
    var open = ui.open === sp.id, prepared = sp.level === 0 || ST.prepared[sp.id];
    var head = h('div', { style: 'display:flex;align-items:center' }, [
      h('button', { class: 'spell-h', 'aria-expanded': String(open), onclick: function () { ui.open = open ? null : sp.id; render(); } }, [
        h('span', { class: 'nm' }, [sp.name, h('span', { class: 'sub', text: sp.school + ', ' + sp.time + ', ' + sp.range })]),
        sp.conc ? h('span', { class: 'badge k', text: 'Konzentration' }) : null,
        sp.ritual ? h('span', { class: 'badge r', text: 'Ritual' }) : null,
        sp.source ? h('span', { class: 'badge', text: sp.source }) : null
      ]),
      sp.level > 0 ? h('label', { class: 'prep', title: 'Vorbereitet' }, [h('input', { type: 'checkbox', checked: !!ST.prepared[sp.id], 'aria-label': sp.name + ' vorbereitet', onchange: function (e) { ST.prepared[sp.id] = e.target.checked; save(); render(); } })]) : null
    ]);
    var card = h('article', { class: 'spell' }, [head]);
    if (!open) return card;
    var castLvl = ui.castLvl[sp.id] || sp.level;
    var maxL = maxSlotLevel();
    var pick = [];
    if (sp.level > 0) for (var l = sp.level; l <= maxL; l++) (function (l) {
      pick.push(h('button', { 'aria-pressed': String(castLvl === l), disabled: slotsLeft(l) < 1, text: 'Grad ' + l + ' (' + slotsLeft(l) + ')', onclick: function () { ui.castLvl[sp.id] = l; render(); } }));
    })(l);
    if (sp.level > 0 && slotsLeft(castLvl) < 1) { var alt = []; for (var q = sp.level; q <= maxL; q++) if (slotsLeft(q) > 0) { alt.push(q); } castLvl = alt.length ? alt[0] : castLvl; }
    var canCast = sp.level === 0 || slotsLeft(castLvl) > 0;
    var facts = h('div', { class: 'facts' }, [
      h('div', {}, [h('span', { text: 'Grad: ' }), sp.level === 0 ? 'Zaubertrick' : String(sp.level)]),
      h('div', {}, [h('span', { text: 'Schule: ' }), sp.school]),
      h('div', {}, [h('span', { text: 'Zeitaufwand: ' }), sp.time]),
      h('div', {}, [h('span', { text: 'Reichweite: ' }), sp.range]),
      h('div', {}, [h('span', { text: 'Wirkungsdauer: ' }), sp.duration]),
      h('div', {}, [h('span', { text: 'Komponenten: ' }), sp.comp]),
      sp.classes ? h('div', {}, [h('span', { text: 'Klassen: ' }), sp.classes]) : null,
      h('div', {}, [h('span', { text: 'Ritual: ' }), sp.ritual ? 'Ja' : 'Nein'])
    ]);
    var paras = sp.text.split('\n\n').map(function (t) { return h('p', { text: t }); });
    var fl = flavorFor(sp);
    var sheet = h('div', { class: 'sheet' }, [facts].concat(paras, [
      sp.higher ? h('p', { class: 'hr' }, [h('b', { text: sp.level === 0 ? 'Skalierung: ' : 'Auf höheren Graden: ' }), sp.higher]) : null,
      fl ? h('div', { class: 'words' }, [h('div', {}, [h('b', { text: 'Wirkwort: ' }), fl.verbal]), h('div', {}, [h('b', { text: 'Geste: ' }), fl.gestisch])]) : null,
      sp.house ? h('div', { class: 'house' }, [h('b', { text: 'Hausregel oder Hinweis: ' }), sp.house]) : null
    ]));
    var actions = h('div', { class: 'casting' }, [
      sp.level > 0 ? h('div', { class: 'lvlpick', role: 'group', 'aria-label': 'Zauberplatz wählen' }, pick) : null,
      h('button', { class: 'btn spark', disabled: !canCast, text: sp.level === 0 ? 'Wirken' : 'Wirken mit Grad ' + castLvl, onclick: function () { castSpell(sp, castLvl, false); } }),
      sp.ritual ? h('button', { class: 'btn brass', text: 'Als Ritual wirken', title: 'Kein Zauberplatz, 10 Minuten länger', onclick: function () { castSpell(sp, sp.level, true); } }) : null,
      sp.level > 0 && slotsLeft(castLvl) < 1 ? h('span', { class: 'muted small', text: 'Kein Platz übrig.' }) : null,
      sp.level > 0 && !prepared ? h('span', { class: 'muted small', text: 'Nicht vorbereitet' }) : null
    ]);
    var btns = [];
    var hasDmg = sp.roll.some(function (r) { return r.kind === 'dmg' || r.kind === 'darts'; });
    sp.roll.forEach(function (r) {
      if (r.kind === 'save') { btns.push(h('span', { class: 'save-info', text: 'Ziele: Rettungswurf ' + abilShort(r.abil) + ' gegen SG ' + spellDC() + (r.half ? ', Erfolg halbiert den Schaden' : '') })); return; }
      btns.push(h('button', { class: 'btn sm', text: rollLabel(sp, r, castLvl), onclick: function () { showRoll(sp.name, r.label || 'Wurf', spellRollPills(sp, r, sp.level === 0 ? 0 : castLvl)); render(); } }));
    });
    var rolls = btns.length ? h('div', { class: 'rollbtns' }, btns.concat(hasDmg ? [h('label', { class: 'crit' }, [h('input', { type: 'checkbox', checked: ui.crit, onchange: function (e) { ui.crit = e.target.checked; } }), 'Kritisch (Würfel verdoppelt)'])] : [])) : null;
    card.appendChild(h('div', { class: 'spell-b' }, [sheet, actions, rolls]));
    return card;
  }
  function renderSpells(root) {
    var left = [1, 2, 3, 4, 5].filter(function (l) { return CHAR.slotsMax[l] > 0; });
    var pm = prepMax(), pc = prepCount();
    root.appendChild(h('section', { class: 'panel', 'aria-label': 'Zauberplätze' }, [
      h('div', { class: 'btnrow', style: 'justify-content:space-between;margin-bottom:10px' }, [
        h('h2', { style: 'margin:0', text: 'Zauberplätze' }),
        h('div', { class: 'btnrow' }, [
          h('span', { class: 'badge' + (pc > pm ? ' k' : ' p'), style: pc > pm ? 'color:var(--danger);border-color:var(--danger)' : '', text: 'Vorbereitet ' + pc + ' von ' + pm }),
          h('button', { class: 'btn sm', disabled: ST.recoveryUsed, text: ST.recoveryUsed ? 'Erholung benutzt' : 'Arkane Erholung', onclick: recoveryModal })
        ])
      ]),
      h('div', { class: 'slots' }, left.map(function (l) {
        return h('div', { class: 'slot-row' }, [h('span', { class: 'nm', text: 'Grad ' + l }), gems(l), h('span', { class: 'cnt', text: slotsLeft(l) + '/' + CHAR.slotsMax[l] })]);
      })),
      h('p', { class: 'muted small', style: 'margin:10px 0 0', text: 'Tippe auf einen Edelstein, um einen Platz zu verbrauchen oder zurückzuholen. Setze bei den Zaubern der Grade 1 bis 3 den Haken für „vorbereitet“.' })
    ]));
    var chips = [['all', 'Alle'], ['c', 'Zaubertricks'], ['l1', 'Grad 1'], ['l2', 'Grad 2'], ['l3', 'Grad 3'], ['prep', 'Vorbereitet'], ['rit', 'Rituale'], ['conc', 'Konzentration']];
    root.appendChild(h('div', { class: 'filters' }, chips.map(function (c) {
      return h('button', { class: 'chip', 'aria-pressed': String(ui.filter === c[0]), text: c[1], onclick: function () { ui.filter = c[0]; render(); } });
    }).concat([h('input', { type: 'text', class: 'search', placeholder: 'Zauber suchen', 'aria-label': 'Zauber suchen', value: ui.q, oninput: function (e) { ui.q = e.target.value; var pos = e.target.selectionStart; renderMainKeepSearch(pos); } })])));
    var any = false;
    [0, 1, 2, 3, 4, 5].forEach(function (l) {
      var list = window.WIZ_SPELLS.filter(function (s) { return s.level === l && filterSpell(s); });
      if (!list.length) return; any = true;
      root.appendChild(h('div', { class: 'lvl-h' }, [h('h2', { text: l === 0 ? 'Zaubertricks' : 'Grad ' + l }), h('span', { class: 'muted', text: list.length + (list.length === 1 ? ' Zauber' : ' Zauber') })]));
      list.forEach(function (s) { root.appendChild(spellCard(s)); });
    });
    if (!any) root.appendChild(h('div', { class: 'empty', text: 'Kein Zauber passt zu diesem Filter. Setze den Filter auf „Alle“ oder ändere die Suche.' }));
  }
  function renderMainKeepSearch(pos) {
    render(); var s = document.querySelector('.search'); if (s) { s.focus(); try { s.setSelectionRange(pos, pos); } catch (e) { /* egal */ } }
  }

  /* ---------- Tab: Würfel ---------- */
  var freeCount = 1, freeMod = 0;
  function renderDice(root) {
    var sides = [[2, 'Münze'], [4, ''], [6, ''], [8, ''], [10, ''], [12, ''], [20, ''], [100, 'Prozent']];
    function stepper(label, get, set, min, max) {
      return h('div', { class: 'stepper' }, [h('span', { class: 'muted', text: label }), h('button', { class: 'btn', 'aria-label': label + ' verringern', text: '−', onclick: function () { set(Math.max(min, get() - 1)); render(); } }), h('b', { text: label === 'Bonus' ? sg(get()) : String(get()) }), h('button', { class: 'btn', 'aria-label': label + ' erhöhen', text: '+', onclick: function () { set(Math.min(max, get() + 1)); render(); } })]);
    }
    var input = h('input', { type: 'text', id: 'formula', placeholder: 'z. B. 2d6+3 oder 1W20-1', 'aria-label': 'Würfelformel', inputmode: 'text', onkeydown: function (e) { if (e.key === 'Enter') go(); } });
    function go() {
      try {
        var f = input.value.trim(); if (!f) return;
        var p = D.parse(f), only20 = p.dice.length === 1 && p.dice[0].n === 1 && p.dice[0].sides === 20 && p.dice[0].sign > 0;
        if (only20 && ui.mode) showRoll('Eigener Wurf', f, [d20Pill('d20', p.mod)]);
        else showRoll('Eigener Wurf', f, [dicePill(D.format(p), f, 0, false)]);
      } catch (e) { toast(e.message + '. Beispiel: 2d6+3'); }
    }
    root.appendChild(h('section', { class: 'panel' }, [
      h('div', { class: 'btnrow', style: 'justify-content:space-between;margin-bottom:12px' }, [h('h2', { style: 'margin:0', text: 'Freie Würfel' }), h('div', { class: 'btnrow' }, [stepper('Anzahl', function () { return freeCount; }, function (v) { freeCount = v; }, 1, 20), stepper('Bonus', function () { return freeMod; }, function (v) { freeMod = v; }, -10, 20)])]),
      h('div', { class: 'grid dice-grid' }, sides.map(function (s) {
        return h('button', { class: 'die', onclick: function () {
          var f = freeCount + 'd' + s[0], extra = freeMod;
          if (s[0] === 20 && freeCount === 1) showRoll('1W20', extra ? sg(extra) : '', [d20Pill('d20', extra)]);
          else showRoll(freeCount + 'W' + s[0], extra ? sg(extra) : '', [dicePill(freeCount + 'W' + s[0], f, extra, false)]);
        } }, [h('b', { text: 'W' + s[0] }), h('span', { text: s[1] || ' ' })]);
      })),
      h('div', { class: 'btnrow', style: 'margin-top:16px' }, [h('div', { style: 'flex:1 1 240px' }, [input]), h('button', { class: 'btn brass', text: 'Würfeln', onclick: go })])
    ]));
    root.appendChild(h('section', { class: 'panel' }, [h('h2', { text: 'Zuletzt gewürfelt' }), ui.history.length ? h('ul', { class: 'hist' }, ui.history.slice(0, 12).map(function (e) {
      return h('li', {}, [h('div', {}, [h('b', { text: e.title }), ' ', h('span', { class: 'muted', text: e.sub }), h('div', { class: 'small muted', text: e.pills.map(function (p) { return p.label + ' ' + p.value + (p.detail && p.tone !== 'info' ? ' [' + p.detail + ']' : ''); }).join('; ') })]), h('span', { class: 't', text: e.ts.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) })]);
    })) : h('div', { class: 'empty', text: 'Noch keine Würfe. Tippe auf einen Würfel oder gib oben eine Formel ein.' })]));
  }

  /* ---------- Tab: Merkmale ---------- */
  function renderFeatures(root) {
    window.WIZ_FEATURES.forEach(function (g) {
      root.appendChild(h('h2', { style: 'margin:18px 0 8px', text: g.group }));
      g.items.forEach(function (it) {
        var d = h('details', { class: 'feat' }, [h('summary', { text: it.name }), h('div', { class: 'in' }, [it.text, it.house ? h('div', { class: 'house', text: it.house }) : null, it.action === 'recovery' ? h('div', { style: 'margin-top:10px' }, [h('button', { class: 'btn sm', text: 'Arkane Erholung benutzen', onclick: recoveryModal })]) : null])]);
        root.appendChild(d);
      });
    });
  }

  /* ---------- Tab: Notizen ---------- */
  function renderNotes(root) {
    root.appendChild(h('div', { class: 'btnrow', style: 'justify-content:space-between;margin-bottom:12px' }, [
      h('h2', { style: 'margin:0', text: 'Session-Notizen' }),
      h('button', { class: 'btn brass', text: 'Neue Notiz', onclick: function () {
        ST.notes.unshift({ id: 'n' + Date.now(), title: 'Neue Session', body: '', ts: new Date().toISOString() }); save(); render();
      } })
    ]));
    if (!ST.notes.length) root.appendChild(h('div', { class: 'empty', text: 'Noch keine Notizen. Lege mit „Neue Notiz“ deine erste Session an. Handschrift bleibt in Goodnotes, hier stehen getippte Notizen.' }));
    ST.notes.forEach(function (n) {
      root.appendChild(h('section', { class: 'panel note' }, [
        h('input', { type: 'text', value: n.title, 'aria-label': 'Titel', oninput: function (e) { n.title = e.target.value; save(); } }),
        h('textarea', { 'aria-label': 'Notiz', value: n.body, placeholder: 'Was ist passiert? Namen, Orte, offene Fragen', oninput: function (e) { n.body = e.target.value; save(); } }),
        h('div', { class: 'btnrow', style: 'justify-content:space-between;margin-top:8px' }, [
          h('span', { class: 'muted small', text: 'Angelegt am ' + new Date(n.ts).toLocaleDateString('de-DE') }),
          h('button', { class: 'btn sm danger', text: 'Löschen', onclick: function () {
            var m = modal('Notiz löschen?', h('div', {}, [h('p', { text: '„' + n.title + '“ wird gelöscht. Das lässt sich nicht rückgängig machen.' }), h('div', { class: 'btnrow' }, [h('button', { class: 'btn danger', text: 'Löschen', onclick: function () { ST.notes = ST.notes.filter(function (x) { return x !== n; }); m.close(); save(); render(); } }), h('button', { class: 'btn ghost', text: 'Abbrechen', onclick: function () { m.close(); } })])]));
          } })
        ])
      ]));
    });
  }

  /* ---------- Tab: Daten ---------- */
  function exportJson() {
    var data = JSON.stringify({ app: 'wizbolt', version: 1, exported: new Date().toISOString(), char: CHAR, state: ST }, null, 1);
    var blob = new Blob([data], { type: 'application/json' }), a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = 'wizbolt-backup-' + new Date().toISOString().slice(0, 10) + '.json'; document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
    ST.lastBackup = new Date().toISOString(); save(); render();
  }
  function importJson(text) {
    try {
      var o = JSON.parse(text);
      if (!o || o.app !== 'wizbolt' || !o.char || !o.state) throw new Error('Das ist keine Wizbolt-Sicherung.');
      var c = clone(window.WIZ_DEFAULT_CHAR), s = clone(window.WIZ_DEFAULT_STATE);
      merge(c, o.char); merge(s, o.state); CHAR = c; ST = s; save(); render(); toast('Sicherung geladen.');
    } catch (e) { toast('Import fehlgeschlagen: ' + e.message); }
  }
  function numField(label, get, set, extra) {
    return h('div', { class: 'field' }, [h('label', { text: label }), h('input', Object.assign({ type: 'number', inputmode: 'numeric', value: String(get()), onchange: function (e) { var v = e.target.value === '' ? null : +e.target.value; set(v); save(); render(); } }, extra || {}))]);
  }
  function renderData(root) {
    var fileIn = h('input', { type: 'file', accept: 'application/json,.json', class: 'sr', id: 'impfile', onchange: function (e) { var f = e.target.files[0]; if (!f) return; var rd = new FileReader(); rd.onload = function () { importJson(rd.result); }; rd.readAsText(f); } });
    root.appendChild(h('section', { class: 'panel' }, [
      h('h2', { text: 'Sicherung' }),
      h('p', { class: 'muted', text: 'Deine Daten liegen nur in diesem Browser auf dem iPad. Speichere regelmäßig eine Sicherung, zum Beispiel in Dateien oder iCloud.' }),
      h('div', { class: 'btnrow' }, [
        h('button', { class: 'btn brass', text: 'Sicherung speichern', onclick: exportJson }),
        h('button', { class: 'btn', text: 'Sicherung laden', onclick: function () { fileIn.click(); } }),
        h('button', { class: 'btn', text: 'In Zwischenablage kopieren', onclick: function () { var t = JSON.stringify({ app: 'wizbolt', version: 1, char: CHAR, state: ST }); if (navigator.clipboard) navigator.clipboard.writeText(t).then(function () { toast('Kopiert.'); }, function () { toast('Kopieren nicht erlaubt.'); }); } }),
        fileIn
      ]),
      h('p', { class: 'muted small', style: 'margin-bottom:0', text: ST.lastBackup ? 'Letzte Sicherung: ' + new Date(ST.lastBackup).toLocaleString('de-DE') : 'Noch keine Sicherung gespeichert.' })
    ]));
    var A = window.WIZ_ABILITIES;
    root.appendChild(h('section', { class: 'panel' }, [
      h('h2', { text: 'Charakter anpassen' }),
      h('div', { class: 'grid form' }, [
        h('div', { class: 'field' }, [h('label', { text: 'Name' }), h('input', { type: 'text', value: CHAR.name, onchange: function (e) { CHAR.name = e.target.value; save(); render(); } })]),
        numField('Stufe', function () { return CHAR.level; }, function (v) { CHAR.level = Math.max(1, Math.min(20, v || 1)); }),
        numField('Erfahrungspunkte', function () { return CHAR.xp; }, function (v) { CHAR.xp = v || 0; }),
        numField('TP-Maximum', function () { return CHAR.hpMax; }, function (v) { CHAR.hpMax = Math.max(1, v || 1); ST.hp = Math.min(ST.hp, CHAR.hpMax); }),
        numField('Trefferwürfel gesamt', function () { return CHAR.hitDiceMax; }, function (v) { CHAR.hitDiceMax = Math.max(0, v || 0); ST.hitDice = Math.min(ST.hitDice, CHAR.hitDiceMax); }),
        numField('Grundrüstungsklasse', function () { return CHAR.baseAC; }, function (v) { CHAR.baseAC = v || 10; })
      ].concat(A.map(function (a) { return numField(a.name, function () { return CHAR.abilities[a.id]; }, function (v) { CHAR.abilities[a.id] = Math.max(1, Math.min(30, v || 10)); }); }))),
      h('p', { class: 'muted small', text: 'Übungsbonus, Modifikatoren, Rettungswürfe, Fertigkeiten, Zauber-SG und Angriffsbonus berechnet die App aus Stufe und Attributen.' })
    ]));
    root.appendChild(h('section', { class: 'panel' }, [
      h('h2', { text: 'Zauberplätze und Zauberregeln' }),
      h('div', { class: 'grid form' }, [1, 2, 3, 4, 5].map(function (l) { return numField('Plätze Grad ' + l, function () { return CHAR.slotsMax[l]; }, function (v) { CHAR.slotsMax[l] = Math.max(0, v || 0); ST.slotsUsed[l] = Math.min(ST.slotsUsed[l] || 0, CHAR.slotsMax[l]); }); }).concat([
        numField('Vorbereitbare Zauber', function () { return CHAR.prepMax === null ? '' : CHAR.prepMax; }, function (v) { CHAR.prepMax = v; }, { placeholder: 'Standard ' + Math.max(1, spellMod() + CHAR.level) })
      ])),
      h('div', { style: 'margin-top:12px' }, [
        h('label', { class: 'sw' }, [h('input', { type: 'checkbox', checked: ST.settings.damageBonusOn, onchange: function (e) { ST.settings.damageBonusOn = e.target.checked; save(); render(); } }), 'Hausregel: Zauberattributsbonus auf Zauberschaden']),
        h('div', { class: 'grid form', style: 'max-width:260px;margin-top:6px' }, [numField('Bonus pro Schadenswurf', function () { return ST.settings.spellDamageBonus; }, function (v) { ST.settings.spellDamageBonus = v || 0; })]),
        h('p', { class: 'muted small', text: 'Dein Bogen und Dice Ex rechnen +4 auf den Zauberschaden (zum Beispiel Kältestrahl 2W8+4). Hier lässt sich das ein- und ausschalten.' })
      ])
    ]));
    root.appendChild(h('section', { class: 'panel' }, [
      h('h2', { text: 'Zurücksetzen' }),
      h('div', { class: 'btnrow' }, [h('button', { class: 'btn danger', text: 'Alles auf Anfang', onclick: function () {
        var m = modal('Alles zurücksetzen?', h('div', {}, [h('p', { text: 'Löscht alle lokalen Daten dieser App (Zauberplätze, TP, Notizen, Einstellungen). Speichere vorher eine Sicherung.' }), h('div', { class: 'btnrow' }, [h('button', { class: 'btn danger', text: 'Alles löschen', onclick: function () { localStorage.removeItem(KEY); load(); ui.history = []; ui.last = null; m.close(); render(); renderTray(); } }), h('button', { class: 'btn ghost', text: 'Abbrechen', onclick: function () { m.close(); } })])]));
      } })]),
      h('p', { class: 'muted small', text: 'Wizbolt Version 1, lokale Daten. Regeltexte stammen aus deinen eigenen Notizen.' })
    ]));
  }

  /* ---------- Hauptdarstellung ---------- */
  function render() {
    var y = window.scrollY;
    renderHead();
    var root = h('div'); var main = $('main'); main.innerHTML = '';
    ({ held: renderHeld, zauber: renderSpells, wuerfel: renderDice, merkmale: renderFeatures, notizen: renderNotes, daten: renderData })[ui.tab](root);
    main.appendChild(root);
    window.scrollTo(0, y);
    if (ui.flashLvl) { var fl = ui.flashLvl; setTimeout(function () { if (ui.flashLvl === fl) ui.flashLvl = null; }, 700); }
  }

  function init() {
    load();
    if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(function () {});
    render(); renderTray(); renderDrawer();
    if ('serviceWorker' in navigator && location.protocol.indexOf('http') === 0) navigator.serviceWorker.register('sw.js').catch(function () {});
  }
  window.WizApp = { _state: function () { return { CHAR: CHAR, ST: ST, ui: ui }; } };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
