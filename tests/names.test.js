import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  parseNoun, parseAdjective, agree, withArticle, phrase, feminize, pluralize, de, fromPlace, inPlace,
  titleCase, generate, toText, CATEGORIES,
} from '../public/noms/names.logic.js';
import * as D from '../public/noms/dictionnaires.js';

test('dictionnaires : au moins 80 éléments par liste de vocabulaire, sans doublon', () => {
  for (const name of ['NOUNS', 'ADJECTIVES', 'FIRST_NAMES', 'INGREDIENTS', 'TECH', 'PLACES', 'MUSIC_STYLES',
    'CREATURE_STARTS', 'CREATURE_ENDS', 'VERBS', 'VILLAIN_TITLES']) {
    const list = D[name];
    assert.ok(list.length >= 80, `${name} : ${list.length} éléments`);
    assert.equal(new Set(list).size, list.length, `${name} contient des doublons`);
  }
});

test('dictionnaires : toutes les entrées sont bien formées', () => {
  for (const e of D.NOUNS) assert.doesNotThrow(() => parseNoun(e), e);
  for (const e of D.TECH) assert.doesNotThrow(() => parseNoun(e), e);
  for (const e of D.VILLAIN_TITLES) assert.doesNotThrow(() => parseNoun(e), e);
  for (const e of D.ADJECTIVES) {
    const a = parseAdjective(e);
    for (const f of [a.m, a.f, a.mp, a.fp]) assert.ok(f && !f.includes('/'), e);
  }
});

test('noms : genre, pluriel, élision, h aspiré', () => {
  assert.deepEqual(parseNoun('m:chou/choux'), { s: 'chou', p: 'choux', g: 'm', elide: false });
  assert.equal(parseNoun('f:autruche').elide, true);
  assert.equal(parseNoun('m:!hamster').elide, false);
  assert.equal(parseNoun('m:!hamster').s, 'hamster');
  assert.equal(parseNoun('f:huître').elide, true);
  assert.equal(pluralize('chameau'), 'chameaux');
  assert.equal(pluralize('ananas'), 'ananas');
  assert.equal(pluralize('pneu'), 'pneus');
  assert.equal(pluralize('cheval'), 'chevaux');
  assert.equal(pluralize('festival'), 'festivals');
});

test('adjectifs : féminin et pluriels réguliers', () => {
  assert.equal(feminize('furieux'), 'furieuse');
  assert.equal(feminize('radioactif'), 'radioactive');
  assert.equal(feminize('cruel'), 'cruelle');
  assert.equal(feminize('ancien'), 'ancienne');
  assert.equal(feminize('mignon'), 'mignonne');
  assert.equal(feminize('violet'), 'violette');
  assert.equal(feminize('timide'), 'timide');
  assert.equal(feminize('doré'), 'dorée');
  assert.deepEqual(parseAdjective('tropical'), { m: 'tropical', f: 'tropicale', mp: 'tropicaux', fp: 'tropicales' });
  assert.deepEqual(parseAdjective('fou/folle/fous/folles'), { m: 'fou', f: 'folle', mp: 'fous', fp: 'folles' });
  assert.deepEqual(parseAdjective('fluo*'), { m: 'fluo', f: 'fluo', mp: 'fluo', fp: 'fluo' });
  assert.equal(agree('discret/discrète', 'f', 'p'), 'discrètes');
  assert.equal(agree('heureux', 'm', 'p'), 'heureux');
});

test('accords complets : articles + nom + adjectif', () => {
  const pingouin = parseNoun('m:pingouin');
  const sardine = parseNoun('f:sardine');
  const ananas = parseNoun('m:ananas');
  const hamster = parseNoun('m:!hamster');
  const radioactif = parseAdjective('radioactif');
  assert.equal(phrase(pingouin, radioactif, 'p'), 'les pingouins radioactifs');
  assert.equal(phrase(sardine, parseAdjective('mélancolique')), 'la sardine mélancolique');
  assert.equal(phrase(sardine, radioactif, 'p', 'indef'), 'des sardines radioactives');
  assert.equal(withArticle(ananas), "l'ananas");
  assert.equal(withArticle(hamster), 'le hamster');
  assert.equal(withArticle(pingouin, 's', 'de'), 'du pingouin');
  assert.equal(withArticle(sardine, 's', 'de'), 'de la sardine');
  assert.equal(withArticle(ananas, 's', 'de'), "de l'ananas");
  assert.equal(withArticle(pingouin, 'p', 'de'), 'des pingouins');
  assert.equal(withArticle(pingouin, 's', 'a'), 'au pingouin');
  assert.equal(withArticle(sardine, 'p', 'a'), 'aux sardines');
  assert.equal(withArticle(ananas, 's', 'indef'), 'un ananas');
  assert.equal(withArticle(sardine, 's', 'indef'), 'une sardine');
});

test('prépositions et villes', () => {
  assert.equal(de('sirop'), 'de sirop');
  assert.equal(de('eau gazeuse'), "d'eau gazeuse");
  assert.equal(de('Angers'), "d'Angers");
  assert.equal(fromPlace('Le Mans'), 'du Mans');
  assert.equal(fromPlace('Les Sables-d\'Olonne'), "des Sables-d'Olonne");
  assert.equal(fromPlace('La Rochelle'), 'de La Rochelle');
  assert.equal(inPlace('Le Havre'), 'au Havre');
  assert.equal(inPlace('Brest'), 'à Brest');
});

test('titleCase', () => {
  assert.equal(titleCase('les pingouins radioactifs'), 'Les Pingouins Radioactifs');
  assert.equal(titleCase("le viking de l'apocalypse"), "Le Viking de l'Apocalypse");
  assert.equal(titleCase("l'ananas du lundi"), "L'Ananas du Lundi");
});

test('graine : même catégorie + même graine → même résultat, insensible à la casse', () => {
  for (const c of CATEGORIES) {
    const out = (seed) => { const r = generate(c.id, seed); return [r.name, r.emoji, r.lines]; };
    assert.deepEqual(out('Léa'), out('léa'));
    assert.deepEqual(out('  Léa '), out('léa'));
  }
  assert.notDeepEqual(generate('rock', 'léa').name + generate('rock', 'léa').lines, generate('rock', 'tom').name + generate('rock', 'tom').lines);
  // Catégories indépendantes : pas la même suite aléatoire
  assert.notEqual(generate('bateau', 'léa').name, generate('cocktail', 'léa').name);
  assert.throws(() => generate('inconnue', 'x'));
});

test('génération massive : aucune valeur manquante ni faute de construction évidente', () => {
  const forbidden = /undefined|\bNaN\b|null|\[object|\bà (le|les) |\bde (le|les) |  /;
  for (const c of CATEGORIES) {
    const names = new Set();
    for (let i = 0; i < 1500; i++) {
      const r = generate(c.id, `seed-${i}`);
      const txt = toText(r);
      assert.ok(!forbidden.test(txt), `${c.id} : ${txt}`);
      assert.ok(r.name.length >= 3 && r.lines.length >= 3, `${c.id} : ${txt}`);
      names.add(r.name);
    }
    assert.ok(names.size > 1000, `${c.id} : seulement ${names.size} noms différents sur 1500`);
  }
});
