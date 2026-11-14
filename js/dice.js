/* Würfel-Engine und Regel-Helfer (ohne Abhängigkeit zum DOM, deshalb in Node testbar). */
(function (root) {
  'use strict';

  /* Gleichverteilte Zufallszahl 1..sides ohne Modulo-Verzerrung. */
  function randInt(sides, rng) {
    if (rng) return 1 + Math.floor(rng() * sides);
    var c = (typeof crypto !== 'undefined' && crypto.getRandomValues) ? crypto : null;
    if (!c) return 1 + Math.floor(Math.random() * sides);
    var max = Math.floor(4294967296 / sides) * sides;
    var buf = new Uint32Array(1);
    do { c.getRandomValues(buf); } while (buf[0] >= max);
    return 1 + (buf[0] % sides);
  }

  /* "2d8+4", "1d20-1", "d6", "5d8" -> { dice:[{n,sides,sign}], mod:int } */
  function parse(formula) {
    var s = String(formula).replace(/\s+/g, '').replace(/[wW]/g, 'd').toLowerCase();
    if (!s) throw new Error('Leere Formel');
    var re = /([+-]?)(\d*)d(\d+)|([+-]?)(\d+)/g, m, pos = 0, dice = [], mod = 0;
    while ((m = re.exec(s)) !== null) {
      if (m.index !== pos) throw new Error('Formel nicht lesbar: ' + formula);
      pos = re.lastIndex;
      if (m[3] !== undefined) {
        var n = m[2] === '' ? 1 : parseInt(m[2], 10), sides = parseInt(m[3], 10);
        if (n < 1 || n > 100 || sides < 2 || sides > 1000) throw new Error('Würfel außerhalb des Bereichs: ' + formula);
        dice.push({ n: n, sides: sides, sign: m[1] === '-' ? -1 : 1 });
      } else {
        var v = parseInt(m[5], 10);
        mod += (m[4] === '-' ? -1 : 1) * v;
      }
    }
    if (pos !== s.length) throw new Error('Formel nicht lesbar: ' + formula);
    return { dice: dice, mod: mod };
  }

  function format(p) {
    var out = p.dice.map(function (d, i) {
      return (d.sign < 0 ? '-' : (i ? '+' : '')) + d.n + 'd' + d.sides;
    }).join('');
    if (p.mod) out += (p.mod > 0 ? '+' : '-') + Math.abs(p.mod);
    return out || '0';
  }

  /* Würfelt eine Formel. extraMod wird zusätzlich addiert. */
  function roll(formula, extraMod, rng) {
    var p = typeof formula === 'string' ? parse(formula) : formula;
    var groups = [], sum = 0;
    p.dice.forEach(function (d) {
      var vals = [];
      for (var i = 0; i < d.n; i++) vals.push(randInt(d.sides, rng));
      var sub = vals.reduce(function (a, b) { return a + b; }, 0);
      sum += d.sign * sub;
      groups.push({ n: d.n, sides: d.sides, sign: d.sign, values: vals, sum: sub });
    });
    var mod = p.mod + (extraMod || 0);
    return { groups: groups, mod: mod, total: sum + mod, formula: format({ dice: p.dice, mod: mod }) };
  }

  /* d20-Wurf mit Modifikator. mode: 'adv' | 'dis' | undefined */
  function d20(mod, mode, rng) {
    var a = randInt(20, rng), b = (mode === 'adv' || mode === 'dis') ? randInt(20, rng) : null;
    var kept = a;
    if (b !== null) kept = mode === 'adv' ? Math.max(a, b) : Math.min(a, b);
    return { rolls: b === null ? [a] : [a, b], kept: kept, mod: mod, total: kept + mod, mode: mode || null, crit: kept === 20, fumble: kept === 1 };
  }

  /* Addiert zwei Würfelformeln gleicher Seitenzahl: ('3d6','1d6',2) -> '5d6' */
  function addDice(base, per, times) {
    var b = parse(base), u = parse(per);
    if (!times) return format(b);
    var bySides = {};
    b.dice.forEach(function (d) { bySides[d.sides] = (bySides[d.sides] || 0) + d.n; });
    u.dice.forEach(function (d) { bySides[d.sides] = (bySides[d.sides] || 0) + d.n * times; });
    var dice = Object.keys(bySides).map(function (k) { return { n: bySides[k], sides: +k, sign: 1 }; });
    return format({ dice: dice, mod: b.mod + u.mod * times });
  }

  /* Zaubertrick-Skalierung: Stufe 5, 11, 17 -> 2, 3, 4 Würfel */
  function cantripTier(level) { return level >= 17 ? 4 : level >= 11 ? 3 : level >= 5 ? 2 : 1; }
  function scaleCantrip(base, level) {
    var p = parse(base), t = cantripTier(level);
    return format({ dice: p.dice.map(function (d) { return { n: d.n * t, sides: d.sides, sign: d.sign }; }), mod: p.mod * t });
  }

  /* Regeln */
  function abilityMod(score) { return Math.floor((score - 10) / 2); }
  function profBonus(level) { return Math.floor((level - 1) / 4) + 2; }
  function signed(n) { return (n >= 0 ? '+' : '−') + Math.abs(n); }

  var api = { randInt: randInt, parse: parse, format: format, roll: roll, d20: d20, addDice: addDice, cantripTier: cantripTier, scaleCantrip: scaleCantrip, abilityMod: abilityMod, profBonus: profBonus, signed: signed };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.WizDice = api;
})(typeof window !== 'undefined' ? window : globalThis);
