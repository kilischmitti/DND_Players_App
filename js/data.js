/* Daten für Electrognomus Wizbolt.
   Quellen: Charakterbogen (Goodnotes-PDF), Dice Ex Screenshots, deine Zaubertexte.
   Hausregeln stehen in `house`-Feldern und sind getrennt vom Regeltext. */

window.WIZ_DEFAULT_CHAR = {
  version: 1,
  name: 'Electrognomus Wizbolt',
  player: 'Kilian',
  race: 'Felsgnom',
  klass: 'Magier (Hervorrufung)',
  background: 'Weiser (Forschungsreisender)',
  level: 5,
  xp: 2275,
  abilities: { STR: 8, DEX: 10, CON: 14, INT: 18, WIS: 14, CHA: 12 },
  // Rettungswurf-Übung: Magier (Int, Wei)
  saveProf: { STR: false, DEX: false, CON: false, INT: true, WIS: true, CHA: false },
  // Übung in Fertigkeiten: Weiser (Arkane Kunde, Geschichte) + Magier (Motiv erkennen, Nachforschungen)
  skillProf: { arcana: true, history: true, insight: true, investigation: true },
  hpMax: 32,
  speed: '7,5 m',
  baseAC: 10,
  mageArmorAC: 13,
  hitDie: 6,
  hitDiceMax: 5,
  slotsMax: { 1: 4, 2: 3, 3: 2, 4: 0, 5: 0 },   // Stufe 5, laut Bogen und Dice Ex
  prepMax: null    // null = Int-Mod + Stufe
};

window.WIZ_DEFAULT_STATE = {
  hp: 27,
  temp: 0,
  hitDice: 5,
  slotsUsed: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  death: { s: 0, f: 0 },
  lastBackup: null,
  inspiration: false,
  mageArmor: false,
  recoveryUsed: false,
  concentration: null,
  prepared: {},
  notes: [],
  settings: { spellDamageBonus: 4, damageBonusOn: true }
};

window.WIZ_ABILITIES = [
  { id: 'STR', name: 'Stärke', short: 'Stä' },
  { id: 'DEX', name: 'Geschicklichkeit', short: 'Ges' },
  { id: 'CON', name: 'Konstitution', short: 'Kon' },
  { id: 'INT', name: 'Intelligenz', short: 'Int' },
  { id: 'WIS', name: 'Weisheit', short: 'Wei' },
  { id: 'CHA', name: 'Charisma', short: 'Cha' }
];

window.WIZ_SKILLS = [
  { id: 'acrobatics', name: 'Akrobatik', abil: 'DEX' },
  { id: 'arcana', name: 'Arkane Kunde', abil: 'INT' },
  { id: 'athletics', name: 'Athletik', abil: 'STR' },
  { id: 'performance', name: 'Auftreten', abil: 'CHA' },
  { id: 'intimidation', name: 'Einschüchtern', abil: 'CHA' },
  { id: 'sleight', name: 'Fingerfertigkeit', abil: 'DEX' },
  { id: 'history', name: 'Geschichte', abil: 'INT' },
  { id: 'medicine', name: 'Heilkunde', abil: 'WIS' },
  { id: 'stealth', name: 'Heimlichkeit', abil: 'DEX' },
  { id: 'animal', name: 'Mit Tieren umgehen', abil: 'WIS' },
  { id: 'insight', name: 'Motiv erkennen', abil: 'WIS' },
  { id: 'investigation', name: 'Nachforschungen', abil: 'INT' },
  { id: 'nature', name: 'Naturkunde', abil: 'INT' },
  { id: 'religion', name: 'Religion', abil: 'INT' },
  { id: 'deception', name: 'Täuschen', abil: 'CHA' },
  { id: 'survival', name: 'Überlebenskunst', abil: 'WIS' },
  { id: 'persuasion', name: 'Überzeugen', abil: 'CHA' },
  { id: 'perception', name: 'Wahrnehmung', abil: 'WIS' }
];

/* Waffen aus Seite 2 des Bogens. Berechnung nach 5e: Attributsmodifikator + Übungsbonus (falls geübt). */
window.WIZ_WEAPONS = [
  { id: 'dagger', name: 'Dolch', abil: 'DEX', prof: true, dice: '1d4', type: 'Stich', range: '6 / 18 m', note: 'Finesse, Wurfwaffe' },
  { id: 'sling', name: 'Schleuder', abil: 'DEX', prof: true, dice: '1d4', type: 'Wucht', range: '9 / 36 m', note: 'Fernkampf, Munition' },
  { id: 'staff', name: 'Kampfstab', abil: 'STR', prof: true, dice: '1d6', type: 'Wucht', range: 'Nahkampf', note: 'Vielseitig: beidhändig 1W8' },
  { id: 'javelin', name: 'Wurfspeer', abil: 'STR', prof: false, dice: '1d6', type: 'Stich', range: '9 m', note: 'nicht geübt' },
  { id: 'club', name: 'Dornenknüppel', abil: 'STR', prof: false, dice: '1d4', type: 'Wucht', range: 'Nahkampf', note: 'nicht geübt' },
  { id: 'handaxe', name: 'Streithacke', abil: 'STR', prof: false, dice: '1d6', type: 'Wucht', range: 'Nahkampf', note: 'nicht geübt' }
];

/* ---------------- Zauber ----------------
   roll-Einträge:
     { kind:'attack' }                              Zauberangriff d20 + Angriffsbonus
     { kind:'dmg', label, dice, type, cantrip:true, up:'1d6', bonus:true }
     { kind:'heal', label, dice, up }                Heilung (+ Zauberattribut)
     { kind:'darts', per:'1d4+1', type }             Magisches Geschoss: Pfeile = 3 + (Platz-1)
     { kind:'save', abil:'GES', half:true }          nur Anzeige: SG + Rettungswurf der Ziele
     { kind:'sum', label, dice, up }                 reiner Wurf (Schlaf)
*/
window.WIZ_SPELLS = [
  /* ===== Zaubertricks ===== */
  {
    id: 'kaeltestrahl', name: 'Kältestrahl', level: 0, school: 'Hervorrufung',
    time: '1 Aktion', range: '18 Meter', duration: 'Unmittelbar', conc: false, ritual: false,
    comp: 'V, G', classes: '',
    text: 'Ein eisiger Strahl blau-weißen Lichts schießt auf eine Kreatur in Reichweite. Führe einen Fernkampf-Zauberangriff gegen das Ziel aus. Bei einem Treffer erleidet es 1W8 Kälteschaden und seine Bewegungsrate ist bis zum Beginn deines nächsten Zugs um drei Meter verringert.',
    higher: 'Der Schaden des Zaubers steigt um je 1W8, wenn du die 5. Stufe (2W8), die 11. Stufe (3W8) und die 17. Stufe (4W8) erreichst.',
    house: 'Bene hat festgelegt: Strahlbreite 30 cm.',
    roll: [{ kind: 'attack' }, { kind: 'dmg', label: 'Schaden', dice: '1d8', type: 'Kälte', cantrip: true, bonus: true }]
  },
  {
    id: 'schockgriff', name: 'Schockgriff', level: 0, school: 'Hervorrufung',
    time: '1 Aktion', range: 'Berührung', duration: 'Unmittelbar', conc: false, ritual: false,
    comp: 'V, G', classes: 'Zauberer, Magier',
    text: 'Ein Blitz springt von deiner Hand auf eine Kreatur über, die du zu berühren versuchst, und versetzt ihr einen elektrischen Schlag. Führe einen Nahkampf-Zauberangriff gegen das Ziel aus. Du bist beim Angriffswurf im Vorteil, wenn das Ziel eine Rüstung aus Metall trägt. Bei einem Treffer erleidet das Ziel 1W8 Blitzschaden und kann erst zu Beginn seines nächsten Zugs Reaktionen ausführen.',
    higher: 'Der Schaden des Zaubers steigt um je 1W8, wenn du die 5. Stufe (2W8), die 11. Stufe (3W8) und die 17. Stufe (4W8) erreichst.',
    roll: [{ kind: 'attack' }, { kind: 'dmg', label: 'Schaden', dice: '1d8', type: 'Blitz', cantrip: true, bonus: true }]
  },
  {
    id: 'magierhand', name: 'Magierhand', level: 0, school: 'Beschwörung',
    time: '1 Aktion', range: '9 Meter', duration: '1 Minute', conc: false, ritual: false,
    comp: 'V, G', classes: '',
    text: 'Eine spektrale, schwebende Hand erscheint in Reichweite an einem Punkt deiner Wahl. Die Hand bleibt während der Wirkungsdauer bestehen, oder bis du sie als Aktion beendest. Die Hand verschwindet, wenn sie mehr als neun Meter von dir entfernt ist oder falls du den Zauber erneut wirkst.\n\nDu kannst eine Aktion verwenden, um die Hand zu kontrollieren. Damit kannst du mit Gegenständen interagieren, unverschlossene Türen oder Behälter öffnen, Gegenstände in einem Behälter verstauen oder daraus hervorholen oder den Inhalt einer Phiole ausgießen. Wann immer du sie kontrollierst, kannst du sie um bis zu neun Meter bewegen.\n\nDie Hand kann nicht angreifen, keine magischen Gegenstände aktivieren und nicht mehr als 5 Kilogramm Gewicht tragen.',
    roll: []
  },
  {
    id: 'ausbessern', name: 'Ausbessern', level: 0, school: 'Verwandlungsmagie',
    time: '1 Minute', range: 'Berührung', duration: 'Unmittelbar', conc: false, ritual: false,
    comp: 'V, G, M (zwei Magnetsteine)', classes: '',
    text: 'Dieser Zauber repariert eine Bruchstelle oder einen Riss in einem Gegenstand, den du berührst, beispielsweise ein zerbrochenes Kettenglied, einen in zwei Hälften zerbrochenen Schlüssel, einen zerrissenen Umhang oder einen leckenden Weinschlauch. Solange der Riss oder die Bruchstelle in keiner Abmessung größer als 30 Zentimeter ist, ist nicht mehr zu erkennen, dass der Gegenstand beschädigt war.\n\nDieser Zauber kann die physische Form eines magischen Gegenstands oder Konstrukts reparieren, jedoch nicht dessen Magie wiederherstellen.',
    source: 'Felsgnom-Tüftler',
    roll: []
  },
  {
    id: 'feuerpfeil', name: 'Feuerpfeil', level: 0, school: 'Hervorrufung',
    time: '1 Aktion', range: '36 Meter', duration: 'Unmittelbar', conc: false, ritual: false,
    comp: 'V, G', classes: 'Zauberer, Magier',
    text: 'Du schleuderst einen Funkenwirbel auf eine Kreatur oder einen Gegenstand in Reichweite. Führe einen Fernkampf-Zauberangriff gegen das Ziel aus. Bei einem Treffer erleidet das Ziel 1W10 Feuerschaden.\n\nDer Zauber entzündet bei einem Treffer brennbare Gegenstände, die nicht getragen werden.',
    higher: 'Der Schaden dieses Zaubers wird jeweils um 1W10 erhöht, wenn du die 5. Stufe (2W10), die 11. Stufe (3W10) und die 17. Stufe (4W10) erreichst.',
    roll: [{ kind: 'attack' }, { kind: 'dmg', label: 'Schaden', dice: '1d10', type: 'Feuer', cantrip: true, bonus: true }]
  },
  {
    id: 'taschenspielerei', name: 'Taschenspielerei', level: 0, school: 'Verwandlungsmagie',
    time: '1 Aktion', range: '3 Meter', duration: 'Bis zu 1 Stunde', conc: false, ritual: false,
    comp: 'V, G', classes: 'Barde, Zauberer, Hexenmeister, Magier',
    text: 'Dies ist ein einfacher Zaubertrick, den Zauberlehrlinge zum Üben verwenden. Du erzeugst einen der folgenden magischen Effekte in Reichweite:\n\n• Du erzeugst einen unmittelbaren, harmlosen sensorischen Effekt, etwa einen Funkenregen, einen Windstoß, eine leise Melodie oder einen merkwürdigen Geruch.\n• Du entzündest oder löschst unmittelbar eine Kerze, eine Fackel oder ein kleines Lagerfeuer.\n• Du kannst unmittelbar einen Gegenstand, der nicht größer als ein Würfel mit 30 Zentimetern Kantenlänge ist, säubern oder verschmutzen.\n• Du kannst nichtlebendes Material, das nicht größer als ein Würfel mit 30 Zentimetern Kantenlänge ist, abkühlen, erhitzen oder würzen. Dies hält eine Stunde lang an.\n• Du lässt einen Farbfleck, ein Mal oder ein Symbol eine Stunde lang auf einem Gegenstand oder einer Oberfläche erscheinen.\n• Du erzeugst ein nichtmagisches Schmuckstück oder ein illusorisches Bild, das in deine Hand passt und das bis zum Ende deines nächsten Zuges erhalten bleibt.\n\nWirkst du diesen Zauber mehrmals, können bis zu drei der langfristigen Effekte gleichzeitig aktiv sein. Du kannst einen solchen Effekt als Aktion beenden.',
    source: 'Felsgnom-Tüftler',
    roll: []
  },
  {
    id: 'verschonung', name: 'Verschonung der Sterbenden', level: 0, school: 'Nekromantie',
    time: '1 Aktion', range: 'Berührung', duration: 'Unmittelbar', conc: false, ritual: false,
    comp: 'V, G', classes: 'Kleriker',
    text: 'Du berührst eine lebende Kreatur, die 0 Trefferpunkte hat. Die Kreatur wird stabil. Dieser Zauber wirkt nicht auf Untote oder Konstrukte.',
    source: 'Eigenwahl',
    roll: []
  },
  {
    id: 'heilige-flamme', name: 'Heilige Flamme', level: 0, school: 'Hervorrufung',
    time: '1 Aktion', range: '18 Meter', duration: 'Unmittelbar', conc: false, ritual: false,
    comp: 'V, G', classes: 'Kleriker',
    text: 'Ein Strahl aus gleißenden Flammen schießt auf eine Kreatur in Reichweite herab, die du sehen kannst. Das Ziel muss einen Geschicklichkeitsrettungswurf bestehen, oder es erleidet 1W8 gleißenden Schaden. Deckung bietet dem Ziel bei diesem Rettungswurf keine Vorteile.',
    higher: 'Der Schaden des Zaubers steigt um je 1W8, wenn du die 5. Stufe (2W8), die 11. Stufe (3W8) und die 17. Stufe (4W8) erreichst.',
    source: 'Eigenwahl',
    roll: [{ kind: 'save', abil: 'DEX', half: false }, { kind: 'dmg', label: 'Schaden', dice: '1d8', type: 'Gleißend', cantrip: true, bonus: true }]
  },

  /* ===== Grad 1 ===== */
  {
    id: 'magisches-geschoss', name: 'Magisches Geschoss', level: 1, school: 'Hervorrufung',
    time: '1 Aktion', range: '36 Meter', duration: 'Unmittelbar', conc: false, ritual: false,
    comp: 'V, G', classes: '',
    text: 'Du erschaffst drei leuchtende Wurfpfeile aus magischer Energie. Jeder Pfeil trifft eine Kreatur deiner Wahl in Reichweite, die du sehen kannst. Ein Pfeil fügt seinem Ziel 1W4+1 Energieschaden zu. Die Wurfpfeile treffen alle gleichzeitig und du kannst bestimmen, ob sie dieselbe oder verschiedene Kreaturen treffen.',
    higher: 'Wirkst du diesen Zauber, indem du einen Zauberplatz des 2. Grades oder höher nutzt, wird pro Grad über dem 1. ein weiterer Pfeil erschaffen.',
    roll: [{ kind: 'darts', per: '1d4+1', type: 'Energie', bonus: true }]
  },
  {
    id: 'hexenpfeil', name: 'Hexenpfeil', level: 1, school: 'Hervorrufung',
    time: '1 Aktion', range: '9 Meter', duration: 'Konzentration, bis zu 1 Minute', conc: true, ritual: false,
    comp: 'V, G, M (ein Zweig von einem Baum, der vom Blitz getroffen wurde)', classes: 'Zauberer, Hexenmeister, Magier',
    text: 'Ein Strahl knisternder, blauer Energie schießt auf eine Kreatur in Reichweite zu und erschafft einen anhaltenden Bogen aus Blitzen zwischen dir und dem Ziel. Lege einen Fernkampf-Zauberangriff gegen diese Kreatur ab. Bei einem Treffer erleidet sie 1W12 Blitzschaden, und du kannst für die Wirkungsdauer in jedem deiner Züge deine Aktion verwenden, um dem Ziel automatisch 1W12 Blitzschaden zuzufügen. Der Zauber endet, wenn du deine Aktion verwendest, um etwas anderes zu tun. Der Zauber endet auch, wenn sich das Ziel jemals vollständig außerhalb der Reichweite des Zaubers befindet oder vollständige Deckung vor dir hat.',
    higher: 'Wenn du diesen Zauber mit einem Zauberplatz des 2. Grades oder höher wirkst, dann steigt der Schaden für jeden Zauberplatz-Grad über dem ersten um 1W12.',
    roll: [{ kind: 'attack' }, { kind: 'dmg', label: 'Schaden (Treffer)', dice: '1d12', type: 'Blitz', up: '1d12', bonus: true }, { kind: 'dmg', label: 'Folgeschaden (pro Zug)', dice: '1d12', type: 'Blitz', up: '1d12', bonus: true, later: true }]
  },
  {
    id: 'brennende-haende', name: 'Brennende Hände', level: 1, school: 'Hervorrufung',
    time: '1 Aktion', range: 'Selbst (4,5 Meter Kegel)', duration: 'Unmittelbar', conc: false, ritual: false,
    comp: 'V, G', classes: '',
    text: 'Du streckst deine Hände mit sich berührenden Daumen und gespreizten Fingern aus und eine dünne Flammenwand schießt aus deinen Fingerspitzen hervor. Kreaturen innerhalb eines Kegels von 4,5 Metern müssen einen Geschicklichkeitsrettungswurf ausführen. Scheitert der Wurf, erleiden sie 3W6 Feuerschaden, anderenfalls die Hälfte.\n\nDas Feuer entzündet brennbare Gegenstände in der Umgebung, die nicht getragen werden.',
    higher: 'Wirkst du diesen Zauber, indem du einen Zauberplatz des 2. Grades oder höher nutzt, steigt der Schaden für jeden Grad über dem 1. um 1W6.',
    roll: [{ kind: 'save', abil: 'DEX', half: true }, { kind: 'dmg', label: 'Schaden', dice: '3d6', type: 'Feuer', up: '1d6', bonus: true }]
  },
  {
    id: 'sprachen-verstehen', name: 'Sprachen verstehen', level: 1, school: 'Erkenntnismagie',
    time: '1 Aktion', range: 'Selbst', duration: '1 Stunde', conc: false, ritual: true,
    comp: 'V, G, M (eine Prise Ruß und Salz)', classes: '',
    text: 'Für die Wirkungsdauer verstehst du die wörtliche Bedeutung jeder gesprochenen Sprache, die du hörst. Außerdem verstehst du jede Schriftsprache, die du liest, sofern du die Oberfläche berührst, auf der die Worte geschrieben stehen. Eine Seite Text zu lesen dauert etwa eine Minute.\n\nDieser Zauber entschlüsselt weder Geheimbotschaften in Texten noch Glyphen wie arkane Siegel, die nicht Teil der geschriebenen Sprache sind.',
    roll: []
  },
  {
    id: 'magie-entdecken', name: 'Magie entdecken', level: 1, school: 'Erkenntnismagie',
    time: '1 Aktion', range: 'Selbst', duration: 'Konzentration, bis zu 10 Minuten', conc: true, ritual: true,
    comp: 'V, G', classes: '',
    text: 'Während der Wirkungsdauer nimmst du die Gegenwart von Magie im Abstand von bis zu neun Metern von dir wahr. Wenn du auf diese Weise Magie wahrnimmst, kannst du deine Aktion verwenden, um schwache Auren um sichtbare magische Kreaturen oder Objekte sowie ihre magische Schule zu erkennen, falls vorhanden.\n\nDieser Zauber durchdringt die meisten Barrieren, wird aber von 30 Zentimetern Stein, 2,5 Zentimetern gewöhnlichem Metall, dünnem Bleiblech sowie von einem Meter Holz oder Erde blockiert.',
    roll: []
  },
  {
    id: 'schlaf', name: 'Schlaf', level: 1, school: 'Verzauberung',
    time: '1 Aktion', range: '27 Meter', duration: '1 Minute', conc: false, ritual: false,
    comp: 'V, G, M (eine Prise feinen Sand, Rosenblütenblätter oder eine Grille)', classes: '',
    text: 'Dieser Zauber versetzt Kreaturen in einen magischen Schlaf. Würfle mit fünf W8. Die Summe gibt an, auf wie viele Trefferpunkte an Kreaturen dieser Zauber wirken kann. Kreaturen im Abstand von bis zu sechs Metern um einen Punkt deiner Wahl in Reichweite sind in aufsteigender Reihenfolge ihrer aktuellen Trefferpunkte betroffen (bewusstlose Kreaturen werden ignoriert).\n\nBeginnend mit der Kreatur mit den niedrigsten aktuellen Trefferpunkten verliert jede Kreatur, auf die der Zauber wirkt, das Bewusstsein. Dieser Zustand hält an, bis die Wirkungsdauer endet, der Schlafende Schaden erleidet oder jemand den Schlafenden mit einer Aktion aufweckt. Subtrahiere die Trefferpunkte jeder Kreatur von der Summe, bevor du zur Kreatur mit den nächstniedrigsten Trefferpunkten übergehst. Die Trefferpunkte einer Kreatur müssen kleiner oder gleich der verbleibenden Summe sein, damit der Zauber auf die Kreatur wirkt.\n\nDer Zauber wirkt nicht auf Untote und Kreaturen, die nicht bezaubert werden können.',
    higher: 'Wirkst du diesen Zauber, indem du einen Zauberplatz des 2. Grades oder höher nutzt, würfle für jeden Grad über dem 1. zusätzlich mit zwei W8.',
    roll: [{ kind: 'sum', label: 'Trefferpunkte-Summe', dice: '5d8', up: '2d8' }]
  },
  {
    id: 'donnerwoge', name: 'Donnerwoge', level: 1, school: 'Hervorrufung',
    time: '1 Aktion', range: 'Selbst (4,5 Meter Würfel)', duration: 'Unmittelbar', conc: false, ritual: false,
    comp: 'V, G', classes: 'Barde, Druide, Zauberer, Magier',
    text: 'Eine Woge donnernder Energie bricht aus dir heraus. Alle Kreaturen in einem Würfel mit einer Kantenlänge von 4,5 Metern, der von dir ausgeht, müssen einen Konstitutionsrettungswurf ausführen. Scheitert der Wurf, erleidet eine Kreatur 2W8 Schallschaden und wird drei Meter von dir weggestoßen. Bei einem erfolgreichen Rettungswurf erleidet die Kreatur halb so viel Schaden und wird nicht weggestoßen.\n\nAußerdem werden ungesicherte Objekte, die sich vollständig im Wirkungsbereich befinden, durch den Effekt des Zaubers automatisch drei Meter von dir weggestoßen. Der Zauber bewirkt einen donnernden Knall, der 90 Meter weit zu hören ist.',
    higher: 'Wirkst du diesen Zauber, indem du einen Zauberplatz des 2. Grades oder höher nutzt, erhöht sich der Schaden für jeden Grad über dem 1. um 1W8.',
    roll: [{ kind: 'save', abil: 'CON', half: true }, { kind: 'dmg', label: 'Schaden', dice: '2d8', type: 'Schall', up: '1d8', bonus: true }]
  },
  {
    id: 'magierruestung', name: 'Magierrüstung', level: 1, school: 'Bannmagie',
    time: '1 Aktion', range: 'Berührung', duration: '8 Stunden', conc: false, ritual: false,
    comp: 'V, G, M (ein Stück gegerbtes Leder)', classes: 'Zauberer, Magier',
    text: 'Du berührst eine willige Kreatur, die keine Rüstung trägt. Sie wird von einer schützenden magischen Energie umgeben, bis der Zauber endet. Die Basis-Rüstungsklasse des Ziels beträgt 13 + sein Geschicklichkeitsmodifikator. Der Zauber endet vorzeitig, wenn das Ziel eine Rüstung anlegt oder du den Zauber als Aktion beendest.',
    roll: [], effect: 'mageArmor'
  },
  {
    id: 'schwebende-scheibe', name: 'Schwebende Scheibe', level: 1, school: 'Beschwörung',
    time: '1 Aktion', range: '9 Meter', duration: '1 Stunde', conc: false, ritual: true,
    comp: 'V, G, M (ein Tropfen Quecksilber)', classes: 'Magier',
    text: 'Dieser Zauber erschafft eine kreisförmige, waagrechte Fläche aus Energie mit 90 Zentimetern Durchmesser und 2,5 Zentimetern Dicke. Sie schwebt an einer freien Stelle deiner Wahl in Reichweite, die du sehen kannst, 90 Zentimeter über dem Boden. Die Scheibe bleibt für die Wirkungsdauer bestehen und kann bis zu 250 Kilogramm tragen. Lastet mehr Gewicht auf ihr, endet der Zauber, und alles auf der Scheibe fällt zu Boden.\n\nDie Scheibe ist unbeweglich, wenn du dich im Abstand von bis zu sechs Metern von ihr befindest. Entfernst du dich mehr als sechs Meter von ihr, folgt dir die Scheibe, so dass sie im Abstand von bis zu sechs Metern von dir bleibt. Sie kann sich über unebenes Gelände, Treppen, Abhänge und dergleichen bewegen, kann jedoch keinen Höhenunterschied von drei Metern oder mehr überwinden. Beispielsweise kann die Scheibe nicht über eine drei Meter tiefe Grube hinwegschweben oder eine derartige Grube verlassen, falls sie in ihr erschaffen wurde.\n\nEntfernst du dich mehr als 30 Meter von der Scheibe (meist, weil sie sich nicht um ein Hindernis bewegen kann, um dir zu folgen), endet der Zauber.',
    roll: []
  },
  {
    id: 'katapult', name: 'Katapult', level: 1, school: 'Verwandlungsmagie',
    time: '1 Aktion', range: '45 Meter', duration: 'Unmittelbar', conc: false, ritual: false,
    comp: 'V', classes: 'Zauberer, Magier',
    text: 'Wähle einen Gegenstand mit einem Gewicht von 0,5 bis 2,5 Kilogramm in Reichweite, der nicht getragen wird. Der Gegenstand fliegt in einer geraden Linie bis zu 27 Meter in eine von dir gewählte Richtung, bevor er zu Boden fällt, wobei er vorzeitig stoppt, wenn er auf eine feste Oberfläche trifft. Wenn der Gegenstand eine Kreatur treffen würde, muss diese Kreatur einen Rettungswurf auf Geschicklichkeit machen. Bei einem misslungenen Rettungswurf trifft der Gegenstand das Ziel und hört auf, sich zu bewegen. In beiden Fällen erleiden sowohl das Objekt als auch die Kreatur oder die feste Oberfläche 3W8 Wuchtschaden.',
    higher: 'Wenn du diesen Zauber mit einem Zauberplatz des 2. Grades oder höher wirkst, erhöht sich das maximale Gewicht von Objekten, auf die du mit diesem Zauber zielen kannst, um 2,5 Kilogramm und der Schaden um 1W8 für jeden Grad über dem 1.',
    roll: [{ kind: 'save', abil: 'DEX', half: false }, { kind: 'dmg', label: 'Schaden', dice: '3d8', type: 'Wucht', up: '1d8', bonus: true }]
  },
  {
    id: 'wunden-heilen', name: 'Wunden heilen', level: 1, school: 'Hervorrufung',
    time: '1 Aktion', range: 'Berührung', duration: 'Unmittelbar', conc: false, ritual: false,
    comp: 'V, G', classes: 'Barde, Kleriker, Druide, Paladin, Waldläufer',
    text: 'Eine Kreatur, die du berührst, gewinnt Trefferpunkte in Höhe von 1W8 + deinem Attributsmodifikator im Zauberwirken zurück. Dieser Zauber wirkt nicht auf Untote oder Konstrukte.',
    higher: 'Wirkst du diesen Zauber, indem du einen Zauberplatz des 2. Grades oder höher nutzt, steigt die Heilung für jeden Grad über dem 1. um 1W8.',
    source: 'Eigenwahl',
    roll: [{ kind: 'heal', label: 'Heilung', dice: '1d8', up: '1d8' }]
  },

  /* ===== Grad 2 ===== */
  {
    id: 'windstoss', name: 'Windstoß', level: 2, school: 'Hervorrufung',
    time: '1 Aktion', range: 'Selbst (18 Meter Gerade)', duration: 'Konzentration, bis zu 1 Minute', conc: true, ritual: false,
    comp: 'V, G, M (Samen einer Hülsenfrucht)', classes: 'Zauberer, Magier, Druide',
    text: 'Für die Wirkungsdauer weht ein starker Wind von dir ausgehend in einer Linie mit 18 Metern Länge und drei Metern Breite in eine Richtung deiner Wahl. Jede Kreatur, die ihren Zug innerhalb der Linie beginnt, muss einen Stärkerettungswurf bestehen, oder sie wird 4,5 Meter entlang der Linie von dir weggestoßen.\n\nJede Kreatur innerhalb der Linie muss für jeden Meter, den sie sich auf dich zu bewegt, zwei Meter Bewegungsrate verwenden.\n\nDer Windstoß zerstreut Gas oder Dampf und löscht Kerzen, Fackeln und ähnliche ungeschützte Flammen in seinem Bereich. Geschützte Flammen, wie die von Laternen, flackern wild und haben eine Chance von 50 Prozent, gelöscht zu werden.\n\nAls Bonusaktion kannst du in jedem deiner Züge vor Ablauf der Wirkungsdauer die Richtung ändern, in die der Wind weht.',
    roll: [{ kind: 'save', abil: 'STR', half: false }]
  },
  {
    id: 'seiltrick', name: 'Seiltrick', level: 2, school: 'Verwandlungsmagie',
    time: '1 Aktion', range: 'Berührung', duration: '1 Stunde', conc: false, ritual: false,
    comp: 'V, G, M (Maisextraktpulver und eine gedrehte Pergamentschleife)', classes: 'Magier',
    text: 'Du berührst ein bis zu 18 Meter langes Seil.\n\nEin Seilende erhebt sich dann in die Luft, bis das gesamte Seil senkrecht zum Boden in der Luft hängt. Am oberen Ende des Seils öffnet sich ein unsichtbarer Eingang zu einem extradimensionalen Raum, der bis zum Ende der Wirkungsdauer bestehen bleibt.\n\nKreaturen können diesen Raum erreichen, indem sie das Seil entlang nach oben klettern. Der Raum fasst bis zu acht maximal mittelgroße Kreaturen. Das Seil kann in den Raum gezogen werden, wodurch es von außen nicht mehr zu sehen ist.\n\nAngriffe und Zauber können den extradimensionalen Raum weder von innen noch von außen durchdringen. Kreaturen im Raum können jedoch wie durch ein Fenster mit einer Größe von 0,9 Metern mal 1,5 Metern nach draußen sehen, das um das Seil zentriert ist.\n\nAlles im extradimensionalen Raum fällt heraus, wenn der Zauber endet.',
    roll: []
  },
  {
    id: 'saeurepfeil', name: 'Säurepfeil', level: 2, school: 'Hervorrufung',
    time: '1 Aktion', range: '27 Meter', duration: 'Unmittelbar', conc: false, ritual: false,
    comp: 'V, G, M (ein zerstoßenes Rhabarberblatt und der Magen einer Natter)', classes: 'Magier',
    text: 'Ein schimmernder grüner Pfeil schießt auf ein Ziel in Reichweite und explodiert in einem Sprühregen aus Säure. Führe einen Fernkampf-Zauberangriff gegen das Ziel aus. Bei einem Treffer erleidet das Ziel sofort 4W4 Säureschaden und 2W4 Säureschaden am Ende seines nächsten Zugs. Verfehlst du, spritzt genug Säure auf das Ziel, um die Hälfte des anfänglichen Schadens zu verursachen. Das Ziel erleidet am Ende seines nächsten Zugs keinen Schaden.',
    higher: 'Wirkst du diesen Zauber, indem du einen Zauberplatz des 3. Grades oder höher nutzt, steigt der Schaden (sowohl der anfängliche als auch der spätere) für jeden Grad über dem 2. um 1W4.',
    roll: [{ kind: 'attack' }, { kind: 'dmg', label: 'Sofortschaden (Treffer)', dice: '4d4', type: 'Säure', up: '1d4', bonus: true }, { kind: 'dmg', label: 'Folgeschaden (Ende des nächsten Zugs)', dice: '2d4', type: 'Säure', up: '1d4', bonus: true, later: true }]
  },
  {
    id: 'zerbersten', name: 'Zerbersten', level: 2, school: 'Hervorrufung',
    time: '1 Aktion', range: '18 Meter', duration: 'Unmittelbar', conc: false, ritual: false,
    comp: 'V, G, M (ein Chip aus Glimmer)', classes: 'Zauberer, Hexenmeister, Magier',
    text: 'Von einem Punkt deiner Wahl in Reichweite geht ein schmerzhaft lautes Klingelgeräusch aus. Alle Kreaturen im Radius von drei Metern um diesen Punkt müssen einen Konstitutionsrettungswurf ausführen. Scheitert der Wurf, erleiden sie 3W8 Schallschaden, anderenfalls die Hälfte. Kreaturen aus anorganischem Material wie Stein, Kristall oder Metall sind beim Rettungswurf im Nachteil.\n\nNichtmagische Objekte, die nicht getragen werden, erleiden innerhalb des Bereichs den gleichen Schaden.',
    higher: 'Wirkst du diesen Zauber, indem du einen Zauberplatz des 3. Grades oder höher nutzt, steigt der Schaden für jeden Grad über dem 2. um 1W8.',
    house: 'Bene legt fest: 45 Meter weit zu hören.',
    roll: [{ kind: 'save', abil: 'CON', half: true }, { kind: 'dmg', label: 'Schaden', dice: '3d8', type: 'Schall', up: '1d8', bonus: true }]
  },
  {
    id: 'gestalt-veraendern', name: 'Gestalt verändern', level: 2, school: 'Verwandlungsmagie',
    time: '1 Aktion', range: 'Selbst', duration: 'Konzentration, bis zu 1 Stunde', conc: true, ritual: false,
    comp: 'V, G', classes: 'Zauberer, Magier',
    text: 'Du nimmst eine andere Gestalt an. Wenn du den Zauber wirkst, wähle eine der folgenden Optionen aus. Deren Effekt hält für die Wirkungsdauer des Zaubers an. Solange der Zauber anhält, kannst du als Aktion eine Option beenden, um die Vorzüge einer anderen zu erhalten.\n\nAquatische Anpassung: Du passt deinen Körper an eine aquatische Umgebung an. Dir wachsen Kiemen und Schwimmhäute zwischen den Fingern. Du kannst unter Wasser atmen und erhältst eine Schwimmbewegungsrate, die deiner Schrittbewegungsrate entspricht.\n\nAussehen ändern: Du veränderst dein Aussehen. Du bestimmst, wie du aussiehst: Größe, Gewicht, Gesichtszüge, Klang deiner Stimme, Haarlänge, Haarfarbe, sowie etwaige besondere Merkmale. Du kannst dich als Mitglied eines anderen Volks ausgeben, wobei deine Werte unverändert bleiben. Du kannst nicht als Kreatur einer anderen Größenkategorie erscheinen. Deine Grundform bleibt ebenfalls gleich: Als Zweibeiner kannst du dich mit diesem Zauber beispielsweise nicht in einen Vierbeiner verwandeln. Während der Wirkungsdauer kannst du deine Aktion jederzeit verwenden, um dein Aussehen erneut zu verändern.\n\nNatürliche Waffen: Dir wachsen Klauen, Fangzähne, Stacheln, Hörner oder andere natürliche Waffen deiner Wahl. Deine waffenlosen Angriffe verursachen 1W6 Wucht-, Stich- oder Hiebschaden, je nachdem, welche natürliche Waffe du gewählt hast. Du bist zudem in waffenlosen Angriffen geübt. Die natürliche Waffe ist magisch und du erhältst einen Bonus von +1 auf alle Angriffs- und Schadenswürfe, die du mit ihr ausführst.',
    roll: []
  },
  {
    id: 'person-festhalten', name: 'Person festhalten', level: 2, school: 'Verzauberung',
    time: '1 Aktion', range: '18 Meter', duration: 'Konzentration, bis zu 1 Minute', conc: true, ritual: true,
    comp: 'V, G, M (ein kleines, gerades Stück Eisen)', classes: 'Barde, Kleriker, Druide, Zauberer, Hexenmeister, Magier',
    text: 'Wähle einen Humanoiden in Reichweite, den du sehen kannst. Das Ziel muss einen Weisheitsrettungswurf ausführen oder es wird für die Wirkungsdauer gelähmt. Am Ende jedes seiner Züge kann das Ziel einen weiteren Weisheitsrettungswurf ausführen. Bei einem Erfolg endet die Wirkung des Zaubers auf das Ziel.',
    higher: 'Wirkst du diesen Zauber, indem du einen Zauberplatz des 3. Grades oder höher nutzt, kannst du für jeden Grad über dem 2. einen zusätzlichen Humanoiden als Ziel wählen. Deine humanoiden Ziele, die du festhältst, dürfen nicht mehr als neun Meter voneinander entfernt sein.',
    roll: [{ kind: 'save', abil: 'WIS', half: false }]
  },

  /* ===== Grad 3 ===== */
  {
    id: 'hast', name: 'Hast', level: 3, school: 'Verwandlungsmagie',
    time: '1 Aktion', range: '9 Meter', duration: 'Konzentration, bis zu 1 Minute', conc: true, ritual: false,
    comp: 'V, G, M (eine Späne der Süßholzwurzel)', classes: 'Zauberer, Magier',
    text: 'Wähle eine bereitwillige Kreatur in Reichweite, die du sehen kannst. Bis der Zauber endet, wird die Bewegungsrate des Ziels verdoppelt, es erhält einen Bonus von +2 auf seine RK, ist bei Rettungswürfen auf Geschicklichkeit im Vorteil und kann in jedem seiner Züge eine zusätzliche Aktion ausführen. Diese Aktion darf nur für Folgendes eingesetzt werden: Angriff (nur ein Waffenangriff), Gegenstand benutzen, Rückzug, Spurt, Verstecken.\n\nWenn der Zauber endet, kann das Ziel bis zum Ende seines nächsten Zugs keine Aktion ausführen und sich nicht bewegen, weil es von einer Welle der Erschöpfung ergriffen wird.',
    roll: []
  },
  {
    id: 'blitz', name: 'Blitz', level: 3, school: 'Hervorrufung',
    time: '1 Aktion', range: 'Selbst (30 Meter Gerade)', duration: 'Unmittelbar', conc: false, ritual: false,
    comp: 'V, G, M (ein Stückchen Fell und eine Stange aus Bernstein, Kristall oder Glas)', classes: 'Zauberer, Magier',
    text: 'Du schleuderst einen Blitz von dir ausgehend in einer 30 Meter langen und 1,5 Meter breiten Linie in eine Richtung deiner Wahl. Alle Kreaturen innerhalb der Linie müssen einen Geschicklichkeitsrettungswurf ausführen. Scheitert der Wurf, erleidet eine Kreatur 8W6 Blitzschaden, anderenfalls die Hälfte.\n\nDer Blitz entzündet brennbare Gegenstände im Wirkungsbereich, die nicht getragen werden.',
    higher: 'Wirkst du diesen Zauber, indem du einen Zauberplatz des 4. Grades oder höher nutzt, steigt der Schaden für jeden Grad über dem 3. um 1W6.',
    roll: [{ kind: 'save', abil: 'DEX', half: true }, { kind: 'dmg', label: 'Schaden', dice: '8d6', type: 'Blitz', up: '1d6', bonus: true }]
  }
];

/* ---------------- Merkmale ---------------- */
window.WIZ_FEATURES = [
  {
    group: 'Klasse: Magier',
    items: [
      { name: 'Zaubertricks', text: 'Auf der 1. Stufe beherrschst du drei beliebige Zaubertricks aus der Zauberliste des Magiers. Weitere deiner Wahl lernst du auf höheren Stufen, so wie es in der Spalte für bekannte Zaubertricks in der Aufstiegstabelle des Magiers angegeben ist.' },
      { name: 'Zauberbuch', text: 'Auf Stufe 1 besitzt du ein Zauberbuch, das sechs Magierzauber des 1. Grades umfasst. In diesem hältst du alle dir bekannten Magierzauber fest, außer Zaubertricks, diese wirkst du aus dem Gedächtnis.\n\nEinen Zauber in das Buch kopieren: Wenn du einen Magierzauber des 1. oder eines höheren Grades findest, kannst du ihn deinem Zauberbuch hinzufügen, falls er einem Grad entspricht, den du bereits vorbereiten kannst. Außerdem musst du Zeit aufbringen, um ihn zu entschlüsseln und zu kopieren. Für jeden Grad des Zaubers nimmt dieser Prozess 2 Stunden in Anspruch und kostet 50 GM.\n\nDas Zauberbuch ersetzen: Du kannst einen Zauber von deinem eigenen Buch in ein anderes übertragen. Du musst lediglich 1 Stunde und 10 GM pro Grad des zu kopierenden Zaubers aufwenden. Wenn du dein Zauberbuch verlierst, kannst du diese Methode verwenden, um deine vorbereiteten Sprüche in ein neues Buch zu übertragen. Die übrigen verlorenen Zauber musst du dir jedoch auf herkömmliche Weise wiederbeschaffen.' },
      { name: 'Zauberplätze', text: 'Wenn ein Charakter einen Zauber wirkt, verbraucht er einen Zauberplatz, der dem Grad des Zaubers entspricht oder höher ist. Ein Zauber des 1. Grades passt in einen Platz jeder Größe, aber ein Zauber des 3. Grades passt nur in einen Zauberplatz des 3. Grades. Eine lange Rast stellt alle verbrauchten Zauberplätze wieder her.' },
      { name: 'Rituale', text: 'Bestimmte Zauber haben das spezielle Kennwort Ritual. Solche Zauber können nach den normalen Regeln zum Zauberwirken oder mit den Regeln für das Wirken eines Rituals gewirkt werden. Die Ritualversion dauert 10 Minuten länger als normal. Der Magier muss den Zauber nur in seinem Zauberbuch haben.' },
      { name: 'Arkane Erholung', text: 'Du hast gelernt, etwas deiner magischen Energie zurückzugewinnen, indem du dein Zauberbuch studierst. Einmal pro Tag kannst du dir im Rahmen einer kurzen Rast eine gewisse Anzahl verbrauchter Zauberplätze aussuchen, die du wiedererlangst. Die Zauberplätze dürfen zusammengenommen höchstens eine Gradzahl besitzen, die kleiner oder gleich der Hälfte deiner Stufe als Magier ist (abgerundet). Darüber hinaus darf keiner der Zauberplätze Grad 6 oder höher sein.', action: 'recovery' },
      { name: 'Arkane Tradition: Hervorrufung', text: 'Beim Erreichen der 2. Stufe suchst du dir eine Arkane Tradition aus. Deine Wahl verleiht dir auf der 2., 6., 10. und 14. Stufe jeweils ein Merkmal.' },
      { name: 'Zauber formen (Hervorrufung, ab Stufe 2)', text: 'Du hast die Effekte deiner Hervorrufungszauber so unter Kontrolle, dass du Bereiche in ihnen formen kannst, in denen man vor ihren Auswirkungen sicher ist. Wenn du einen Hervorrufungszauber wirkst, der andere Kreaturen betrifft, die du sehen kannst, darfst du eine Anzahl dieser Kreaturen bestimmen, die 1 + dem Grad des Zaubers entspricht. Die ausgewählten Kreaturen schaffen ihren Rettungswurf gegen deinen Zauber automatisch und erleiden keinen Schaden, auch wenn sie normalerweise bei einem gelungenen Rettungswurf die Hälfte des Schadens erleiden würden.' }
    ]
  },
  {
    group: 'Volk: Felsgnom',
    items: [
      { name: 'Attributswerte-Erhöhung', text: 'Intelligenz +2, Konstitution +1.' },
      { name: 'Allgemein', text: 'Alter: 350 bis 500 Jahre. Gesinnung: meistens rechtschaffen gut. Größe: klein (90 bis 120 cm). Geschwindigkeit: 25 Fuß (ca. 7,5 Meter). Sprachen: Gemeinsprache, Gnomisch.' },
      { name: 'Dunkelsicht', text: '60 Fuß (ca. 18 Meter), nur Grauwerte.' },
      { name: 'Gnomische Gerissenheit', text: 'Vorteil bei Intelligenz-, Weisheits- und Charisma-Rettungswürfen gegen Magie.' },
      { name: 'Felsgnom-Tüftler', text: 'Du kennst den Zaubertrick Ausbessern und kannst kleine mechanische Geräte herstellen.\n\nTüftler: Du bist geübt im Umgang mit Handwerkszeug (Tüftlerwerkzeug). Wendest du sowohl 1 Stunde Zeit als auch 10 GM an Material auf, kannst du mit diesem Werkzeug ein winziges aufziehbares Gerät konstruieren (RK 5, TP 1). Dieses wird nach 24 Stunden aufhören zu funktionieren (außer du wendest 1 Stunde Arbeitszeit auf, um es funktionstüchtig zu halten). Alternativ kannst du eine Aktion nutzen, um es zu demontieren. Beim Demontieren gewinnst du die Materialien zurück, die zur Herstellung nötig waren. Du kannst bis zu drei aktive Geräte gleichzeitig besitzen. Wähle bei der Herstellung aus folgenden Möglichkeiten:\n\nAufziehspielzeug: Dein aufziehbares Spielzeug kann ein Tier, Monster oder eine Person darstellen, wie etwa einen Frosch, eine Maus, einen Vogel, einen Drachen oder einen Soldaten. Wird es auf den Boden gesetzt, bewegt sich das Spielzeug in jedem deiner Züge 1,50 m in eine zufällige Richtung. Dabei macht es passende Geräusche zu der Kreatur, die es darstellt.\n\nAnzünder: Das Gerät erzeugt eine kleine Flamme, mit der man eine Kerze, eine Fackel oder ein Lagerfeuer entzünden kann. Das Gerät zu verwenden, kostet dich eine Aktion.\n\nSpieluhr: Wird die Spieluhr geöffnet, ertönt ein Lied in moderater Lautstärke. Die Musik endet mit dem Lied oder wenn man das Gerät wieder schließt.' },
      { name: 'Artefaktkunde', text: 'Immer wenn du einen Wurf auf Intelligenz (Geschichte) ablegst, der mit magischen Gegenständen, alchemistischen Gegenständen oder technischen Gerätschaften zu tun hat, darfst du den doppelten Übungsbonus anstatt des einfachen zum Wurf addieren.' }
    ]
  },
  {
    group: 'Hintergrund und Talente',
    items: [
      { name: 'Forscher (Hintergrund: Weiser)', text: 'Gelingt es dir nicht, dir Wissen anzueignen oder dich an Wissen zu erinnern, weißt du meist, wo und von wem du die benötigte Information bekommen kannst. In der Regel erhältst du diese aus einer Bibliothek, einer Schreibwerkstatt, einer Universität, von einem Kollegen oder einer anderen gelehrten Person oder Kreatur. Dein SL kann bestimmen, dass das Wissen, nach dem du suchst, an einem nahezu unerreichbaren Ort versteckt wurde oder es einfach nicht gefunden werden kann. Die tiefsten Geheimnisse des Multiversums ans Licht zu bringen, kann ein Abenteuer oder sogar eine ganze Kampagne erfordern.' },
      { name: 'Scharfer Verstand (Stufe 4)', text: 'Du bist außergewöhnlich gut darin, dir Zeiten, Richtungen und Einzelheiten einzuprägen, und erhältst folgende Vorzüge:\n\n• Erhöhe deine Intelligenz um 1 Punkt, bis zu einem maximalen Attribut von 20.\n• Du weißt immer, wo Norden ist.\n• Du weißt immer, wie viele Stunden es zum nächsten Sonnenauf- oder -untergang sind.\n• Du kannst dich genau an alles erinnern, was du im vergangenen Monat gesehen und gehört hast.', house: 'Ergänzung von Bene: Ich weiß in Städten und Gegenden immer, wo die Bibliothek, Tavernen, Rüstungsläden, Handwerkereien und Unterkünfte sind, egal ob sich die Stadt umbaut oder nicht.' },
      { name: 'Eingeweihter der Magie (Heilkunft, 2024-Regeln)', text: 'Auf deinem Bogen als Talent notiert. Eine Beschreibung hast du mir nicht geschickt.' },
      { name: 'Unverwüstliches Zauberbuch (wundersamer Gegenstand, gewöhnlich)', text: 'Dieses Zauberbuch, mit allem was auf seinen Seiten geschrieben wurde, kann nicht durch Feuer oder das Eintauchen in Wasser beschädigt werden. Zusätzlich verfällt das Zauberbuch nicht durch Alterung.' }
    ]
  }
];
