'use client';
import { useState } from 'react';
import { AANBIEDERS } from '@/lib/aanbieders';
import { BOX1_VOOR_AOW, BOX1_NA_AOW, WONINGWAARDE_STIJGING, BOX3_VRIJSTELLING_PERSOON, BOX3_FICTIEF_RENDEMENT_SPAREN, BOX3_FICTIEF_RENDEMENT_BELEGGEN, BOX3_TARIEF, AOW_LEEFTIJD_TABEL, AOW_PARTNER_JAAR, AOW_ALLEENSTAAND_JAAR,
  AHK_MAX, AHK_AFBOUW_START, AHK_AFBOUW_EIND, AHK_AFBOUW_TARIEF,
  ARBEIDSKORTING_MAX, ARBEIDSKORTING_OPBOUW_1_TARIEF, ARBEIDSKORTING_OPBOUW_1_GRENS,
  ARBEIDSKORTING_OPBOUW_2_TARIEF, ARBEIDSKORTING_OPBOUW_2_GRENS,
  ARBEIDSKORTING_AFBOUW_TARIEF, ARBEIDSKORTING_AFBOUW_GRENS,
  OUDERENKORTING_MAX, OUDERENKORTING_AFBOUW_START, OUDERENKORTING_AFBOUW_EIND, OUDERENKORTING_AFBOUW_TARIEF,
  BOX2_SCHIJVEN,
} from '@/lib/constants';

const kaartStijl = { background: '#FFFFFF', borderRadius: '20px', padding: '28px', border: '1px solid rgba(42,57,51,0.1)', marginBottom: '12px' };

function berekenEindwaarde(huidigeWaarde, maandInleg, rendementPct, aantalMaanden) {
  const r = (rendementPct || 0) / 100 / 12;
  const wv = (huidigeWaarde || 0) * Math.pow(1 + r, aantalMaanden);
  if (r === 0) return wv + (maandInleg || 0) * aantalMaanden;
  return wv + (maandInleg || 0) * ((Math.pow(1 + r, aantalMaanden) - 1) / r);
}

function berekenAnnuiteit(waarde, rendementPct, aantalMaanden) {
  if (!waarde || waarde <= 0 || aantalMaanden <= 0) return 0;
  const r = (rendementPct || 4) / 100 / 12;
  if (r === 0) return waarde / aantalMaanden;
  return waarde * (r * Math.pow(1 + r, aantalMaanden)) / (Math.pow(1 + r, aantalMaanden) - 1);
}

function berekenMaandInleg(doelVermogen, rendementPct, aantalMaanden) {
  if (doelVermogen <= 0 || aantalMaanden <= 0) return 0;
  const r = (rendementPct || 0) / 100 / 12;
  if (r === 0) return doelVermogen / aantalMaanden;
  return doelVermogen * r / (Math.pow(1 + r, aantalMaanden) - 1);
}

function margTarief(bruto, naAow) {
  const schijven = naAow ? BOX1_NA_AOW : BOX1_VOOR_AOW;
  for (const schijf of schijven) {
    if (bruto <= schijf.grens) return schijf.tarief;
  }
  return schijven[schijven.length - 1].tarief;
}

function leeftijdNaarJaar(geboortedatum, jaren, maanden = 0) {
  if (!geboortedatum) return new Date().getFullYear() + jaren;
  return new Date(geboortedatum).getFullYear() + jaren + (maanden >= 6 ? 1 : 0);
}

function fmtEuro(n) {
  const abs = Math.abs(Math.round(n));
  return (n < 0 ? '- ' : '') + '€ ' + abs.toLocaleString('nl-NL');
}

function fmtPct(n) {
  return (Math.round(n * 10) / 10).toFixed(2) + '%';
}

function berekenBox1Belasting(bruto, naAow) {
  if (bruto <= 0) return 0;
  const schijven = naAow ? BOX1_NA_AOW : BOX1_VOOR_AOW;
  let belasting = 0, vorig = 0;
  for (const schijf of schijven) {
    if (bruto <= vorig) break;
    belasting += (Math.min(bruto, schijf.grens) - vorig) * schijf.tarief;
    vorig = schijf.grens;
  }
  return belasting;
}

function berekenAlgemeneHeffingskorting(inkomen) {
  if (inkomen <= AHK_AFBOUW_START) return AHK_MAX;
  if (inkomen >= AHK_AFBOUW_EIND) return 0;
  return Math.max(0, AHK_MAX - (inkomen - AHK_AFBOUW_START) * AHK_AFBOUW_TARIEF);
}

function berekenArbeidskorting(arbeidsinkomen) {
  if (arbeidsinkomen <= 0 || arbeidsinkomen >= ARBEIDSKORTING_AFBOUW_GRENS) return 0;
  if (arbeidsinkomen <= ARBEIDSKORTING_OPBOUW_1_GRENS)
    return arbeidsinkomen * ARBEIDSKORTING_OPBOUW_1_TARIEF;
  if (arbeidsinkomen <= ARBEIDSKORTING_OPBOUW_2_GRENS)
    return ARBEIDSKORTING_OPBOUW_1_GRENS * ARBEIDSKORTING_OPBOUW_1_TARIEF + (arbeidsinkomen - ARBEIDSKORTING_OPBOUW_1_GRENS) * ARBEIDSKORTING_OPBOUW_2_TARIEF;
  const maxAK = Math.min(ARBEIDSKORTING_MAX, ARBEIDSKORTING_OPBOUW_1_GRENS * ARBEIDSKORTING_OPBOUW_1_TARIEF + (ARBEIDSKORTING_OPBOUW_2_GRENS - ARBEIDSKORTING_OPBOUW_1_GRENS) * ARBEIDSKORTING_OPBOUW_2_TARIEF);
  return Math.max(0, maxAK - (arbeidsinkomen - ARBEIDSKORTING_OPBOUW_2_GRENS) * ARBEIDSKORTING_AFBOUW_TARIEF);
}

function berekenOuderenkorting(inkomen) {
  if (inkomen <= OUDERENKORTING_AFBOUW_START) return OUDERENKORTING_MAX;
  if (inkomen >= OUDERENKORTING_AFBOUW_EIND) return 0;
  return Math.max(0, OUDERENKORTING_MAX - (inkomen - OUDERENKORTING_AFBOUW_START) * OUDERENKORTING_AFBOUW_TARIEF);
}

function berekenBox2(dividend) {
  if (dividend <= 0) return 0;
  let belasting = 0, vorig = 0;
  for (const schijf of BOX2_SCHIJVEN) {
    if (dividend <= vorig) break;
    belasting += (Math.min(dividend, schijf.grens) - vorig) * schijf.tarief;
    vorig = schijf.grens;
  }
  return belasting;
}

// Effectieve marginale belastingdruk op extra inkomen van `van` naar `naar`
// inclusief effect op AHK-afbouw, arbeidskorting (alleen bij arbeidsinkomen) en ouderenkorting (na AOW)
function effectiefMargTarief(van, naar, naAow, isArbeidsinkomen = false) {
  const a = Math.max(0, van);
  const b = Math.max(0, naar);
  if (b <= a) return 0;
  const delta = b - a;
  const extraBox1 = berekenBox1Belasting(b, naAow) - berekenBox1Belasting(a, naAow);
  const ahkDaling = berekenAlgemeneHeffingskorting(a) - berekenAlgemeneHeffingskorting(b);
  const akDaling = isArbeidsinkomen ? berekenArbeidskorting(a) - berekenArbeidskorting(b) : 0;
  const ouderenDaling = naAow ? berekenOuderenkorting(a) - berekenOuderenkorting(b) : 0;
  return Math.max(0, Math.min(1, (extraBox1 + ahkDaling + akDaling + ouderenDaling) / delta));
}

export default function StapOplossingen({ gezin, inkomsten, pensioen, uitgaven, bv, woning, pensioengat, klantPensioenJaar, grafiekData, grafiekAfbeeldingen, onVorige, onExport }) {
  const huidigJaar = new Date().getFullYear();
  const heeftPartner = !!gezin?.partner;

  const [oplSparenBedrag, setOplSparenBedrag] = useState(0);
  const [oplSparenRendement, setOplSparenRendement] = useState(1.5);
  const [oplBeleggenBedrag, setOplBeleggenBedrag] = useState(0);
  const [oplBeleggenRendement, setOplBeleggenRendement] = useState(6);
  const [oplLijfrenteBedrag, setOplLijfrenteBedrag] = useState(0);
  const [oplLijfrenteRendement, setOplLijfrenteRendement] = useState(6);
  const [oplLijfrentePartnerBedrag, setOplLijfrentePartnerBedrag] = useState(0);
  const [oplLijfrentePartnerRendement, setOplLijfrentePartnerRendement] = useState(6);
  const [oplBvBedrag, setOplBvBedrag] = useState(0);
  const [oplBvRendement, setOplBvRendement] = useState(6);

  const [oplAanbieders, setOplAanbieders] = useState({
    sparen:           { naam: '', toelichting: '' },
    beleggen:         { naam: '', toelichting: '' },
    lijfrenteKlant:   { naam: '', toelichting: '' },
    lijfrentePartner: { naam: '', toelichting: '' },
    bv:               { naam: '', toelichting: '' },
  });

  // === Inkomsten & jaarruimte ===
  const klantBrutoArbeid = (inkomsten?.klantInkomsten || []).reduce((s, i) => s + (parseFloat(i.bedrag) || 0), 0);
  const jaarruimte = Math.max(0, 0.30 * (klantBrutoArbeid - 17545));
  const bestaandeLijfrenteInlegKlant = (uitgaven?.lijfrentes || [])
    .filter(l => l.voor !== 'partner')
    .reduce((s, l) => s + (parseFloat(l.inleg) || 0), 0);
  const maandMax = Math.max(0, jaarruimte / 12 - bestaandeLijfrenteInlegKlant);
  const klantMargTarief = margTarief(klantBrutoArbeid, false);
  // Effectief inlegtarief incl. AHK- en arbeidskorting-effect (dynamisch met de slider)
  const klantInlegTarief = oplLijfrenteBedrag > 0
    ? effectiefMargTarief(Math.max(0, klantBrutoArbeid - oplLijfrenteBedrag * 12), klantBrutoArbeid, false, true)
    : margTarief(klantBrutoArbeid, false);
  const partnerBrutoArbeid = (inkomsten?.partnerInkomsten || []).reduce((s, i) => s + (parseFloat(i.bedrag) || 0), 0);
  const partnerJaarruimte = Math.max(0, 0.30 * (partnerBrutoArbeid - 17545));
  const bestaandeLijfrenteInlegPartner = (uitgaven?.lijfrentes || [])
    .filter(l => l.voor === 'partner')
    .reduce((s, l) => s + (parseFloat(l.inleg) || 0), 0);
  const partnerMaandMax = Math.max(0, partnerJaarruimte / 12 - bestaandeLijfrenteInlegPartner);
  const partnerMargTarief = margTarief(partnerBrutoArbeid, false);
  const partnerInlegTarief = oplLijfrentePartnerBedrag > 0
    ? effectiefMargTarief(Math.max(0, partnerBrutoArbeid - oplLijfrentePartnerBedrag * 12), partnerBrutoArbeid, false, true)
    : margTarief(partnerBrutoArbeid, false);
  const oplMaanden = Math.max(1, (klantPensioenJaar - huidigJaar) * 12);

  // === AOW en pensioeninkomen klant ===
  const klantGebDatum = gezin?.klant?.geboortedatum;
  const klantAowJaar = (() => {
    if (!klantGebDatum) return huidigJaar + 67;
    const d = new Date(klantGebDatum);
    for (const rij of AOW_LEEFTIJD_TABEL) {
      if (d >= new Date(rij.van) && d <= new Date(rij.tot))
        return leeftijdNaarJaar(klantGebDatum, rij.jaren, rij.maanden);
    }
    return leeftijdNaarJaar(klantGebDatum, 70);
  })();
  const naAow = klantPensioenJaar >= klantAowJaar;
  const aowInkomen = naAow ? (heeftPartner ? AOW_PARTNER_JAAR : AOW_ALLEENSTAAND_JAAR) : 0;
  let bestaandPensioenInkomen = 0;
  for (const p of (pensioen?.klantPensioenen || [])) {
    const ingangJaar = leeftijdNaarJaar(klantGebDatum, p.jaren || 67, p.maanden || 0);
    if (klantPensioenJaar >= ingangJaar) bestaandPensioenInkomen += parseFloat(p.bedrag) || 0;
  }
  let bestaandeLijfrenteUitkering = 0;
  for (const l of (uitgaven?.lijfrentes || [])) {
    if (l.voor === 'partner') continue;
    const pensioenMaanden = Math.max(0, (klantPensioenJaar - huidigJaar) * 12);
    const pot = berekenEindwaarde(parseFloat(l.waarde) || 0, parseFloat(l.inleg) || 0, parseFloat(l.rendement) || 4, pensioenMaanden);
    const uitkMaanden = Math.max(1, (klantAowJaar + 20 - klantPensioenJaar) * 12);
    bestaandeLijfrenteUitkering += berekenAnnuiteit(pot, 4, uitkMaanden) * 12;
  }
  const bestaandInkomenPensioen = aowInkomen + bestaandPensioenInkomen + bestaandeLijfrenteUitkering;
  const uitkeringsDecimaal = margTarief(bestaandInkomenPensioen, naAow);
  const uitkMaandenKlant = Math.max(1, (klantAowJaar + 20 - klantPensioenJaar) * 12);

  // === AOW en pensioeninkomen partner ===
  const partnerGebDatum = gezin?.partner?.geboortedatum;
  const partnerAowJaar = (() => {
    if (!partnerGebDatum) return huidigJaar + 67;
    const d = new Date(partnerGebDatum);
    for (const rij of AOW_LEEFTIJD_TABEL) {
      if (d >= new Date(rij.van) && d <= new Date(rij.tot))
        return leeftijdNaarJaar(partnerGebDatum, rij.jaren, rij.maanden);
    }
    return leeftijdNaarJaar(partnerGebDatum, 70);
  })();
  const naAowPartner = klantPensioenJaar >= partnerAowJaar;
  const aowInkomenPartner = naAowPartner ? AOW_PARTNER_JAAR : 0;
  let bestaandPensioenInkomenPartner = 0;
  for (const p of (pensioen?.partnerPensioenen || [])) {
    const ingangJaar = leeftijdNaarJaar(partnerGebDatum, p.jaren || 67, p.maanden || 0);
    if (klantPensioenJaar >= ingangJaar) bestaandPensioenInkomenPartner += parseFloat(p.bedrag) || 0;
  }
  let bestaandeLijfrenteUitkeringPartner = 0;
  for (const l of (uitgaven?.lijfrentes || [])) {
    if (l.voor !== 'partner') continue;
    const pensioenMaanden = Math.max(0, (klantPensioenJaar - huidigJaar) * 12);
    const pot = berekenEindwaarde(parseFloat(l.waarde) || 0, parseFloat(l.inleg) || 0, parseFloat(l.rendement) || 4, pensioenMaanden);
    const uitkMaanden = Math.max(1, (partnerAowJaar + 20 - klantPensioenJaar) * 12);
    bestaandeLijfrenteUitkeringPartner += berekenAnnuiteit(pot, 4, uitkMaanden) * 12;
  }
  const bestaandInkomenPensioenPartner = aowInkomenPartner + bestaandPensioenInkomenPartner + bestaandeLijfrenteUitkeringPartner;
  const uitkeringsDecimaalPartner = margTarief(bestaandInkomenPensioenPartner, naAowPartner);
  const uitkMaandenPartner = Math.max(1, (partnerAowJaar + 20 - klantPensioenJaar) * 12);

  // === Woning ===
  const woningwaardeNu = parseFloat(woning?.woningwaarde) || 0;
  const waardestijgingPct = parseFloat(woning?.waardestijging) || (WONINGWAARDE_STIJGING * 100);
  const jarenTotPensioen = klantPensioenJaar - huidigJaar;
  const woningwaardePensioen = woningwaardeNu * Math.pow(1 + waardestijgingPct / 100, jarenTotPensioen);
  const nu = new Date();
  let resterendeSchuld = 0;
  for (const l of (woning?.leningdelen || [])) {
    const schuld = parseFloat(l.schuld) || 0;
    if (!schuld || !l.einddatum) continue;
    const eind = new Date(l.einddatum);
    const totaalMnd = Math.max(1, Math.round((eind - nu) / (1000 * 60 * 60 * 24 * 30.44)));
    if (oplMaanden >= totaalMnd) continue;
    const r = (parseFloat(l.rente) || 0) / 100 / 12;
    if (l.type === 'aflossingsvrij') {
      resterendeSchuld += schuld;
    } else if (l.type === 'lineair') {
      resterendeSchuld += Math.max(0, schuld - (schuld / totaalMnd) * oplMaanden);
    } else {
      if (r === 0) {
        resterendeSchuld += Math.max(0, schuld - (schuld / totaalMnd) * oplMaanden);
      } else {
        const fn = Math.pow(1 + r, totaalMnd);
        const fk = Math.pow(1 + r, oplMaanden);
        resterendeSchuld += Math.max(0, schuld * (fn - fk) / (fn - 1));
      }
    }
  }
  const overwaardeOpPensioen = Math.max(0, woningwaardePensioen - resterendeSchuld);
  const toonWoningSignalering = woningwaardeNu > 0 && overwaardeOpPensioen > 0;

  // === Box 3 belastingdruk per categorie ===
  const box3DragSparenPct = BOX3_FICTIEF_RENDEMENT_SPAREN * BOX3_TARIEF * 100;    // ~0.52%/jr
  const box3DragBeleggenPct = BOX3_FICTIEF_RENDEMENT_BELEGGEN * BOX3_TARIEF * 100; // ~2.12%/jr

  // === Actuele box 3 situatie klant (op basis van ingevoerde vermogens) ===
  const huidigSparenVermogen = (uitgaven?.sparen || []).reduce((s, i) => s + (parseFloat(i.waarde) || 0), 0);
  const huidigBeleggenVermogen = (uitgaven?.beleggen || []).reduce((s, i) => s + (parseFloat(i.waarde) || 0), 0);
  const huidigBox3Vermogen = huidigSparenVermogen + huidigBeleggenVermogen;
  const huidigBox3Grondslag = Math.max(0, huidigBox3Vermogen - BOX3_VRIJSTELLING_PERSOON);
  const proportieSparen = huidigBox3Vermogen > 0 ? huidigSparenVermogen / huidigBox3Vermogen : 0;
  const gemFictiefRendement = proportieSparen * BOX3_FICTIEF_RENDEMENT_SPAREN + (1 - proportieSparen) * BOX3_FICTIEF_RENDEMENT_BELEGGEN;
  const jaarlijkseBox3Belasting = huidigBox3Grondslag * gemFictiefRendement * BOX3_TARIEF;
  const toonBox3Situatie = huidigBox3Vermogen > 0;

  // === Oplossings-eindvermogens ===
  // Sparen: box 3 correctie via fictief rendement sparen
  const oplSparenNettoRendement = Math.max(0, oplSparenRendement - box3DragSparenPct);
  const oplSparenBrutoEindvermogen = berekenEindwaarde(0, oplSparenBedrag, oplSparenRendement, oplMaanden);
  const oplSparenEindvermogen = berekenEindwaarde(0, oplSparenBedrag, oplSparenNettoRendement, oplMaanden);

  // Beleggen: box 3 correctie via fictief rendement beleggen
  const oplBeleggenNettoRendement = Math.max(0, oplBeleggenRendement - box3DragBeleggenPct);
  const oplBeleggenEindvermogen = berekenEindwaarde(0, oplBeleggenBedrag, oplBeleggenNettoRendement, oplMaanden);

  // Lijfrente klant — effectief inlegtarief incl. heffingskortingen
  const oplLijfrenteNettoMaand = oplLijfrenteBedrag * (1 - klantInlegTarief);
  const oplLijfrenteEindvermogenBruto = berekenEindwaarde(0, oplLijfrenteBedrag, oplLijfrenteRendement, oplMaanden);
  // Effectief uitkeringstarieff: op basis van bestaand inkomen + de nieuwe bruto jaaruitkering, incl. heffingskortingen
  const oplLijfrenteBrutoJaarPayout = berekenAnnuiteit(oplLijfrenteEindvermogenBruto, 4, uitkMaandenKlant) * 12;
  const uitkeringsDecimaalEffectief = oplLijfrenteBrutoJaarPayout > 0
    ? effectiefMargTarief(bestaandInkomenPensioen, bestaandInkomenPensioen + oplLijfrenteBrutoJaarPayout, naAow)
    : uitkeringsDecimaal;
  const oplLijfrenteEindvermogen = oplLijfrenteEindvermogenBruto * (1 - uitkeringsDecimaalEffectief);

  // Lijfrente partner — effectief inlegtarief incl. heffingskortingen
  const oplLijfrentePartnerNettoMaand = oplLijfrentePartnerBedrag * (1 - partnerInlegTarief);
  const oplLijfrentePartnerEindvermogenBruto = berekenEindwaarde(0, oplLijfrentePartnerBedrag, oplLijfrentePartnerRendement, oplMaanden);
  const oplLijfrentePartnerBrutoJaarPayout = berekenAnnuiteit(oplLijfrentePartnerEindvermogenBruto, 4, uitkMaandenPartner) * 12;
  const uitkeringsDecimaalEffectiefPartner = oplLijfrentePartnerBrutoJaarPayout > 0
    ? effectiefMargTarief(bestaandInkomenPensioenPartner, bestaandInkomenPensioenPartner + oplLijfrentePartnerBrutoJaarPayout, naAowPartner)
    : uitkeringsDecimaalPartner;
  const oplLijfrentePartnerEindvermogen = oplLijfrentePartnerEindvermogenBruto * (1 - uitkeringsDecimaalEffectiefPartner);

  // BV (netto na Vpb 19%, daarna box 2 bij uitkering)
  const oplBvNettoMaand = oplBvBedrag * (1 - 0.19);
  const oplBvEindvermogen = berekenEindwaarde(0, oplBvNettoMaand, oplBvRendement, oplMaanden);
  const oplBvBox2Belasting = berekenBox2(oplBvEindvermogen);
  const oplBvNettoNaBox2 = oplBvEindvermogen - oplBvBox2Belasting;
  const oplBvEffectiefBox2Tarief = oplBvEindvermogen > 0 ? oplBvBox2Belasting / oplBvEindvermogen : 0;

  // === Belastingvoordeel t.o.v. box 3 beleggen (zelfde netto inleg) ===
  // Lijfrente klant: vergelijk netto inleg in box 3 vs. netto eindvermogen lijfrente
  const box3VergelijkLijfrenteKlant = berekenEindwaarde(0, oplLijfrenteNettoMaand, Math.max(0, oplLijfrenteRendement - box3DragBeleggenPct), oplMaanden);
  const lijfrenteMeerwaardeVsBox3Klant = oplLijfrenteEindvermogen - box3VergelijkLijfrenteKlant;

  // Lijfrente partner
  const box3VergelijkLijfrentePartner = berekenEindwaarde(0, oplLijfrentePartnerNettoMaand, Math.max(0, oplLijfrentePartnerRendement - box3DragBeleggenPct), oplMaanden);
  const lijfrenteMeerwaardeVsBox3Partner = oplLijfrentePartnerEindvermogen - box3VergelijkLijfrentePartner;

  // BV: vergelijk netto inleg (na vpb) in box 3 vs. BV netto eindvermogen (na box 2) — eerlijke netto/netto vergelijking
  const box3VergelijkBV = berekenEindwaarde(0, oplBvNettoMaand, Math.max(0, oplBvRendement - box3DragBeleggenPct), oplMaanden);
  const bvMeerwaardeVsBox3 = oplBvNettoNaBox2 - box3VergelijkBV;

  // === Max bedragen per oplossing ===
  function resterendVoor(...uitgesloten) {
    const totaalOverig = [oplSparenEindvermogen, oplBeleggenEindvermogen, oplLijfrenteEindvermogen, oplLijfrentePartnerEindvermogen, oplBvNettoNaBox2]
      .filter((_, i) => !uitgesloten.includes(i))
      .reduce((s, v) => s + v, 0);
    return Math.max(0, pensioengat - totaalOverig);
  }

  const oplSparenMax = Math.max(10, Math.round(berekenMaandInleg(resterendVoor(0), oplSparenNettoRendement, oplMaanden)));
  const oplBeleggenMax = Math.max(10, Math.round(berekenMaandInleg(resterendVoor(1), oplBeleggenNettoRendement, oplMaanden)));
  const lijfrenteBrutoDoelKlant = resterendVoor(2) / Math.max(0.01, 1 - uitkeringsDecimaal);
  const oplLijfrenteMax = Math.min(Math.floor(maandMax), Math.max(10, Math.round(berekenMaandInleg(lijfrenteBrutoDoelKlant, oplLijfrenteRendement, oplMaanden))));
  const lijfrenteBrutoDoelPartner = resterendVoor(3) / Math.max(0.01, 1 - uitkeringsDecimaalPartner);
  const oplLijfrentePartnerMax = Math.min(Math.floor(partnerMaandMax), Math.max(10, Math.round(berekenMaandInleg(lijfrenteBrutoDoelPartner, oplLijfrentePartnerRendement, oplMaanden))));
  const oplBvMax = Math.max(10, Math.round(berekenMaandInleg(resterendVoor(4), oplBvRendement, oplMaanden) / 0.81));

  const oplTotaalEindvermogen = oplSparenEindvermogen + oplBeleggenEindvermogen + oplLijfrenteEindvermogen + oplLijfrentePartnerEindvermogen + oplBvNettoNaBox2;
  const oplResterendTekort = Math.max(0, pensioengat - oplTotaalEindvermogen);
  const oplOpgelostPct = pensioengat > 0 ? Math.min(100, Math.round(oplTotaalEindvermogen / pensioengat * 100)) : 100;

  // ── Exportdata samenstellen ──────────────────────────────────────
  function handleExport() {
    const exportData = {

      // ── 1. Klantgegevens ─────────────────────────────────────────
      gezin,

      // ── 2. Doelstelling ──────────────────────────────────────────
      klantPensioenJaar,
      klantAowJaar,
      partnerAowJaar: heeftPartner ? partnerAowJaar : null,
      eindJaarBerekening: (heeftPartner
        ? Math.max(klantAowJaar, partnerAowJaar)
        : klantAowJaar) + 20,

      // ── 3. Huidige situatie ───────────────────────────────────────
      inkomsten,
      pensioen,
      bv,
      woning,
      uitgaven,

      // Berekende kerngetallen huidige situatie
      klantBrutoArbeid,
      partnerBrutoArbeid: heeftPartner ? partnerBrutoArbeid : null,

      // ── 4. Pensioentekort / overschot ─────────────────────────────
      pensioengat,
      heeftTekort: pensioengat > 0,

      // ── 5. Oplossingen (per optie) ────────────────────────────────
      oplossingen: {
        sparen: oplSparenBedrag > 0 ? {
          maandbedrag: oplSparenBedrag,
          rendement: oplSparenRendement,
          nettoRendement: oplSparenNettoRendement,
          eindvermogen: oplSparenEindvermogen,
          fiscaleWerking: 'Vrij sparen (box 3)',
          box3Druk: box3DragSparenPct,
          aanbieder: oplAanbieders.sparen.naam,
          aanbiederToelichting: oplAanbieders.sparen.toelichting,
        } : null,

        beleggen: oplBeleggenBedrag > 0 ? {
          maandbedrag: oplBeleggenBedrag,
          rendement: oplBeleggenRendement,
          nettoRendement: oplBeleggenNettoRendement,
          eindvermogen: oplBeleggenEindvermogen,
          fiscaleWerking: 'Vrij beleggen (box 3)',
          box3Druk: box3DragBeleggenPct,
          aanbieder: oplAanbieders.beleggen.naam,
          aanbiederToelichting: oplAanbieders.beleggen.toelichting,
        } : null,

        lijfrenteKlant: oplLijfrenteBedrag > 0 ? {
          naam: gezin?.klant?.voornaam || 'Klant',
          maandbedrag: oplLijfrenteBedrag,
          nettoMaandbedrag: oplLijfrenteNettoMaand,
          rendement: oplLijfrenteRendement,
          eindvermogenBruto: oplLijfrenteEindvermogenBruto,
          eindvermogen: oplLijfrenteEindvermogen,
          belastingvoordeel: Math.round(klantInlegTarief * 100),
          uitkeringstarief: Math.round(uitkeringsDecimaalEffectief * 1000) / 10,
          jaarruimte: jaarruimte,
          maandMax: maandMax,
          fiscaleWerking: `Lijfrente — inleg aftrekbaar (${Math.round(klantInlegTarief * 100)}%), uitkering belast (${Math.round(uitkeringsDecimaalEffectief * 1000) / 10}%)`,
          aanbieder: oplAanbieders.lijfrenteKlant.naam,
          aanbiederToelichting: oplAanbieders.lijfrenteKlant.toelichting,
        } : null,

        lijfrentePartner: (heeftPartner && oplLijfrentePartnerBedrag > 0) ? {
          naam: gezin?.partner?.voornaam || 'Partner',
          maandbedrag: oplLijfrentePartnerBedrag,
          nettoMaandbedrag: oplLijfrentePartnerNettoMaand,
          rendement: oplLijfrentePartnerRendement,
          eindvermogenBruto: oplLijfrentePartnerEindvermogenBruto,
          eindvermogen: oplLijfrentePartnerEindvermogen,
          belastingvoordeel: Math.round(partnerInlegTarief * 100),
          uitkeringstarief: Math.round(uitkeringsDecimaalEffectiefPartner * 1000) / 10,
          jaarruimte: partnerJaarruimte,
          maandMax: partnerMaandMax,
          fiscaleWerking: `Lijfrente — inleg aftrekbaar (${Math.round(partnerInlegTarief * 100)}%), uitkering belast (${Math.round(uitkeringsDecimaalEffectiefPartner * 1000) / 10}%)`,
          aanbieder: oplAanbieders.lijfrentePartner.naam,
          aanbiederToelichting: oplAanbieders.lijfrentePartner.toelichting,
        } : null,

        bv: (bv?.bvAanwezig === 'ja' && oplBvBedrag > 0) ? {
          maandbedrag: oplBvBedrag,
          brutoBedrag: oplBvBedrag * 12,
          nettoNaVpb: oplBvNettoMaand * 12,
          rendement: oplBvRendement,
          eindvermogen: oplBvEindvermogen,
          box2Belasting: oplBvBox2Belasting,
          effectiefBox2Tarief: Math.round(oplBvEffectiefBox2Tarief * 100),
          eindvermogenNettoNaBox2: oplBvNettoNaBox2,
          fiscaleWerking: `Opbouw in BV — Vpb (19%) over winst, box 2 (${Math.round(oplBvEffectiefBox2Tarief * 100)}% effectief) bij uitkering`,
          aanbieder: oplAanbieders.bv.naam,
          aanbiederToelichting: oplAanbieders.bv.toelichting,
        } : null,
      },

      // Volgorde oplossingen (op fiscale efficiëntie)
      oplOrder,

      // Totaaloverzicht
      oplTotaalEindvermogen,
      oplResterendTekort,
      oplOpgelostPct,

      // Jaar-voor-jaar grafiekdata (voor rapport en grafiek)
      grafiekData: grafiekData || [],
      grafiekAfbeeldingen: grafiekAfbeeldingen || {},
    };

    if (onExport) onExport(exportData);
  }

  // === Schijfgrens signalering lijfrente ===
  const inkomenNaAftrek = klantBrutoArbeid - oplLijfrenteBedrag * 12;
  const schijfNaAftrek = margTarief(Math.max(0, inkomenNaAftrek), false);
  const toonZelfdeSchijf = oplLijfrenteBedrag > 0 && klantMargTarief > 0 && schijfNaAftrek === klantMargTarief;
  const toonSchijfgrensVoordeel = oplLijfrenteBedrag > 0 && schijfNaAftrek < klantMargTarief;

  const partnerInkomenNaAftrek = partnerBrutoArbeid - oplLijfrentePartnerBedrag * 12;
  const partnerSchijfNaAftrek = margTarief(Math.max(0, partnerInkomenNaAftrek), false);
  const toonPartnerZelfdeSchijf = oplLijfrentePartnerBedrag > 0 && partnerMargTarief > 0 && partnerSchijfNaAftrek === partnerMargTarief;
  const toonPartnerSchijfgrensVoordeel = oplLijfrentePartnerBedrag > 0 && partnerSchijfNaAftrek < partnerMargTarief;

  // === Sortering op efficiëntie: netto eindvermogen per netto euro inleg (hypothetisch €100 bruto) ===
  const H = 100;
  const scoreSparen = berekenEindwaarde(0, H, oplSparenNettoRendement, oplMaanden) / (H * oplMaanden);
  const scoreBeleggen = berekenEindwaarde(0, H, oplBeleggenNettoRendement, oplMaanden) / (H * oplMaanden);
  const scoreLijfrenteKlant = maandMax > 0
    ? berekenEindwaarde(0, H, oplLijfrenteRendement, oplMaanden) * (1 - uitkeringsDecimaal) / (H * Math.max(0.01, 1 - klantMargTarief) * oplMaanden)
    : -1;
  const scoreLijfrentePartner = heeftPartner && partnerMaandMax > 0
    ? berekenEindwaarde(0, H, oplLijfrentePartnerRendement, oplMaanden) * (1 - uitkeringsDecimaalPartner) / (H * Math.max(0.01, 1 - partnerMargTarief) * oplMaanden)
    : -1;
  const scoreBV = bv?.bvAanwezig === 'ja'
    ? (() => {
        const brutoBV = berekenEindwaarde(0, H * 0.81, oplBvRendement, oplMaanden);
        return (brutoBV - berekenBox2(brutoBV)) / (H * 0.81 * oplMaanden);
      })()
    : -1;
  const oplOrder = Object.fromEntries(
    [
      { key: 'sparen', score: scoreSparen },
      { key: 'beleggen', score: scoreBeleggen },
      { key: 'lijfrenteKlant', score: scoreLijfrenteKlant },
      { key: 'lijfrentePartner', score: scoreLijfrentePartner },
      { key: 'bv', score: scoreBV },
    ]
    .sort((a, b) => b.score - a.score)
    .map((item, idx) => [item.key, idx])
  );

  function kiesAanbieder(type, naam) {
    const aanbiedersCategorie = { lijfrenteKlant: 'lijfrente', lijfrentePartner: 'lijfrente' }[type] ?? type;
    const aanbieder = (AANBIEDERS[aanbiedersCategorie] || []).find(a => a.naam === naam);
    setOplAanbieders(prev => ({
      ...prev,
      [type]: { naam, toelichting: aanbieder?.toelichting ?? '' },
    }));
  }

  function AanbiederSelector({ type, bedrag }) {
    if (!bedrag || bedrag <= 0) return null;
    const { naam, toelichting } = oplAanbieders[type];
    // lijfrenteKlant en lijfrentePartner vallen beide onder de 'lijfrente' categorie in AANBIEDERS
    const aanbiedersCategorie = { lijfrenteKlant: 'lijfrente', lijfrentePartner: 'lijfrente' }[type] ?? type;
    const lijst = AANBIEDERS[aanbiedersCategorie] || [];
    if (lijst.length === 0) return null;
    return (
      <div style={{ marginBottom: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
          <span style={{ fontSize: '12px', color: '#8a8a82', fontFamily: 'Lato, sans-serif' }}>Aanbieder</span>
          <div style={{ position: 'relative' }}>
            <select
              value={naam}
              onChange={e => kiesAanbieder(type, e.target.value)}
              style={{ height: '30px', border: '1px solid rgba(42,57,51,0.2)', borderRadius: '100px',
                       padding: '0 28px 0 12px', fontSize: '12px', fontFamily: 'Lato, sans-serif',
                       background: '#fff', color: naam ? '#2A3933' : '#8a8a82', outline: 'none',
                       cursor: 'pointer', appearance: 'none' }}
            >
              <option value="">— Kies aanbieder —</option>
              {lijst.map(a => <option key={a.naam} value={a.naam}>{a.naam}</option>)}
            </select>
            <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                           pointerEvents: 'none', fontSize: '10px', color: '#8a8a82' }}>▾</span>
          </div>
        </div>
        {naam && toelichting && (
          <p style={{ fontSize: '12px', color: '#4a4a45', fontFamily: 'Lato, sans-serif',
                      lineHeight: 1.5, margin: '0', padding: '8px 12px',
                      background: '#FFFFFF', borderRadius: '10px',
                      border: '1px solid rgba(42,57,51,0.1)' }}>
            {toelichting}
          </p>
        )}
      </div>
    );
  }

  function RendementInput({ value, onChange }) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span style={{ fontSize: '12px', color: '#8a8a82' }}>Rendement</span>
        <input type="number" step="0.1" value={value} onChange={e => onChange(parseFloat(e.target.value) || 0)} style={{ width: '52px', height: '30px', border: '1px solid rgba(42,57,51,0.2)', borderRadius: '100px', padding: '0 8px', fontSize: '12px', fontFamily: 'Lato, sans-serif', textAlign: 'center', outline: 'none', background: '#fff' }} />
        <span style={{ fontSize: '12px', color: '#8a8a82' }}>%</span>
      </div>
    );
  }

  function VoortgangsBalk({ value, max }) {
    return (
      <div style={{ marginBottom: '12px' }}>
        <div style={{ background: 'rgba(42,57,51,0.1)', borderRadius: '100px', height: '8px', overflow: 'hidden' }}>
          <div style={{ width: `${Math.min(100, max > 0 ? value / max * 100 : 0)}%`, height: '100%', background: '#c8e86a', borderRadius: '100px', transition: 'width 0.15s ease' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
          <span style={{ fontSize: '11px', color: '#8a8a82' }}>€ 0</span>
          <span style={{ fontSize: '11px', color: '#8a8a82' }}>{fmtEuro(max)}</span>
        </div>
      </div>
    );
  }

  // Herbruikbaar blok voor belastingvoordeel vergelijking
  function VoordeeBlok({ vergelijkBedrag, meerwaardeVsBox3, nettoMaand, label, box2Noot }) {
    if (meerwaardeVsBox3 === 0 && vergelijkBedrag === 0) return null;
    return (
      <div style={{ marginTop: '8px', background: '#eef7e0', borderRadius: '10px', padding: '10px 12px', border: '1px solid rgba(200,232,106,0.5)' }}>
        <p style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '0.06em', color: '#2A3933', textTransform: 'uppercase', margin: '0 0 8px 0', fontFamily: 'Lato, sans-serif' }}>
          Voordeel t.o.v. privé beleggen (box 3)
        </p>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
          <span style={{ fontSize: '12px', color: '#4a4a45', fontFamily: 'Lato, sans-serif' }}>Zelfde netto inleg ({fmtEuro(nettoMaand)}/mnd) in box 3</span>
          <span style={{ fontSize: '12px', color: '#2A3933', fontFamily: 'Lato, sans-serif' }}>{fmtEuro(vergelijkBedrag)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '6px', borderTop: '1px solid rgba(42,57,51,0.1)', marginTop: '2px' }}>
          <span style={{ fontSize: '12px', fontWeight: '700', color: '#2A3933', fontFamily: 'Lato, sans-serif' }}>{label}</span>
          <span style={{ fontSize: '13px', fontWeight: '700', color: meerwaardeVsBox3 >= 0 ? '#27613a' : '#cc4444', fontFamily: 'Lato, sans-serif' }}>
            {meerwaardeVsBox3 >= 0 ? '+ ' : ''}{fmtEuro(meerwaardeVsBox3)}
          </span>
        </div>
        {box2Noot && (
          <p style={{ fontSize: '11px', color: '#8a8a82', margin: '6px 0 0 0', lineHeight: 1.5, fontFamily: 'Lato, sans-serif' }}>
            Let op: bij uitkering uit de BV betaal je nog dividendbelasting (box 2, 26,9%).
          </p>
        )}
      </div>
    );
  }

  if (pensioengat <= 0) {
    return (
      <div>
        <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#2A3933', marginBottom: '2rem', letterSpacing: '-0.5px', fontFamily: 'Lato, sans-serif' }}>
          Oplossingen voor het pensioentekort.
        </h2>
        <div style={{ ...kaartStijl, background: '#c8e86a' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#2A3933', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <div style={{ width: '10px', height: '6px', borderLeft: '2px solid #c8e86a', borderBottom: '2px solid #c8e86a', transform: 'rotate(-45deg) translateY(-2px)' }} />
            </div>
            <div>
              <p style={{ fontSize: '14px', fontWeight: '700', color: '#2A3933', margin: '0 0 2px 0', fontFamily: 'Lato, sans-serif' }}>Er is geen pensioentekort gevonden</p>
              <p style={{ fontSize: '12px', color: '#2A3933', margin: 0, fontFamily: 'Lato, sans-serif' }}>Jouw verwachte inkomsten dekken jouw benodigde inkomen tijdens de pensioenfase.</p>
            </div>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '8px' }}>
          <button onClick={onVorige} style={{ width: '100%', padding: '14px 28px', fontSize: '15px', fontWeight: '700', background: 'transparent', color: '#2A3933', border: '1px solid rgba(42,57,51,0.2)', borderRadius: '100px', cursor: 'pointer', fontFamily: 'Lato, sans-serif' }}>
            ← Vorige
          </button>
          <button onClick={handleExport} style={{ width: '100%', padding: '14px 28px', fontSize: '15px', fontWeight: '700', background: '#2A3933', color: '#FFFFFF', border: 'none', borderRadius: '100px', cursor: 'pointer', fontFamily: 'Lato, sans-serif' }}>
            Rapport genereren →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#2A3933', marginBottom: '2rem', letterSpacing: '-0.5px', fontFamily: 'Lato, sans-serif' }}>
        Oplossingen voor het pensioentekort.
      </h2>

      {/* Actuele box 3 situatie */}
      {toonBox3Situatie && (
        <div style={{ ...kaartStijl, background: '#F7F5F0' }}>
          <p style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '0.08em', color: '#2A3933', textTransform: 'uppercase', margin: '0 0 12px 0', fontFamily: 'Lato, sans-serif' }}>
            Actuele box 3 situatie
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '10px' }}>
            {huidigSparenVermogen > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '13px', color: '#4a4a45', fontFamily: 'Lato, sans-serif' }}>Sparen (fictief rendement {fmtPct(BOX3_FICTIEF_RENDEMENT_SPAREN * 100)})</span>
                <span style={{ fontSize: '13px', color: '#2A3933', fontFamily: 'Lato, sans-serif' }}>{fmtEuro(huidigSparenVermogen)}</span>
              </div>
            )}
            {huidigBeleggenVermogen > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '13px', color: '#4a4a45', fontFamily: 'Lato, sans-serif' }}>Beleggen (fictief rendement {fmtPct(BOX3_FICTIEF_RENDEMENT_BELEGGEN * 100)})</span>
                <span style={{ fontSize: '13px', color: '#2A3933', fontFamily: 'Lato, sans-serif' }}>{fmtEuro(huidigBeleggenVermogen)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '13px', color: '#8a8a82', fontFamily: 'Lato, sans-serif' }}>Vrijstelling{heeftPartner ? ' per persoon' : ''}</span>
              <span style={{ fontSize: '13px', color: '#8a8a82', fontFamily: 'Lato, sans-serif' }}>- {fmtEuro(BOX3_VRIJSTELLING_PERSOON)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px solid rgba(42,57,51,0.1)', marginTop: '2px' }}>
              <span style={{ fontSize: '13px', fontWeight: '700', color: '#2A3933', fontFamily: 'Lato, sans-serif' }}>Belastbare grondslag</span>
              <span style={{ fontSize: '13px', fontWeight: '700', color: huidigBox3Grondslag > 0 ? '#cc4444' : '#27613a', fontFamily: 'Lato, sans-serif' }}>{fmtEuro(huidigBox3Grondslag)}</span>
            </div>
          </div>
          {huidigBox3Grondslag > 0 && (
            <div style={{ background: '#fff', borderRadius: '10px', padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', color: '#8a8a82', fontFamily: 'Lato, sans-serif' }}>Geschatte box 3 belasting per jaar</span>
              <span style={{ fontSize: '13px', fontWeight: '700', color: '#cc4444', fontFamily: 'Lato, sans-serif' }}>{fmtEuro(jaarlijkseBox3Belasting)}/jr</span>
            </div>
          )}
        </div>
      )}

      {/* Woningoverwaarde signalering */}
      {toonWoningSignalering && (
        <div style={{ background: '#FFFFFF', borderRadius: '20px', padding: '28px', border: '1px solid rgba(42,57,51,0.1)', marginBottom: '12px' }}>
          <p style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '0.08em', color: '#2A3933', textTransform: 'uppercase', margin: '0 0 12px 0', fontFamily: 'Lato, sans-serif' }}>
            Aanvullende mogelijkheid
          </p>
          <p style={{ fontSize: '13px', color: '#4a4a45', margin: '0 0 16px 0', fontFamily: 'Lato, sans-serif', lineHeight: 1.6 }}>
            Op jouw pensioendatum heb je een verwachte overwaarde van {fmtEuro(overwaardeOpPensioen)}. Het opnemen van de overwaarde kan een aanvulling zijn op jouw pensioeninkomen.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '13px', color: '#8a8a82', fontFamily: 'Lato, sans-serif' }}>Woningwaarde op pensioendatum</span>
              <span style={{ fontSize: '13px', color: '#2A3933', fontFamily: 'Lato, sans-serif' }}>{fmtEuro(woningwaardePensioen)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '13px', color: '#8a8a82', fontFamily: 'Lato, sans-serif' }}>Verwachte resterende hypotheekschuld</span>
              <span style={{ fontSize: '13px', color: '#2A3933', fontFamily: 'Lato, sans-serif' }}>{fmtEuro(resterendeSchuld)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '10px', borderTop: '1px solid rgba(42,57,51,0.1)', marginTop: '4px' }}>
              <span style={{ fontSize: '13px', color: '#8a8a82', fontFamily: 'Lato, sans-serif' }}>Verwachte overwaarde</span>
              <span style={{ fontSize: '13px', fontWeight: '700', color: '#2A3933', fontFamily: 'Lato, sans-serif' }}>{fmtEuro(overwaardeOpPensioen)}</span>
            </div>
          </div>
        </div>
      )}

      <div style={kaartStijl}>
        <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#2A3933', margin: '0 0 6px 0', fontFamily: 'Lato, sans-serif', letterSpacing: '-0.3px' }}>
          Oplossing voor het pensioentekort
        </h3>
        <p style={{ fontSize: '13px', color: '#8a8a82', margin: '0 0 20px 0', fontFamily: 'Lato, sans-serif' }}>
          Verdeel het benodigde maandbedrag over de onderstaande oplossingen. Het resterende tekort wordt automatisch bijgewerkt.
        </p>

        <div style={{ marginBottom: '16px' }}>
          <p style={{ fontSize: '13px', color: '#8a8a82', margin: '0 0 4px 0', fontFamily: 'Lato, sans-serif' }}>Op jouw pensioendatum heb je</p>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '32px', fontWeight: '700', color: '#cc4444', fontFamily: 'Lato, sans-serif', letterSpacing: '-1px' }}>{fmtEuro(pensioengat)}</span>
            <span style={{ fontSize: '13px', color: '#8a8a82' }}>extra vermogen nodig.</span>
          </div>
        </div>

        <div style={{ background: 'rgba(42,57,51,0.1)', borderRadius: '100px', height: '8px', marginBottom: '24px', overflow: 'hidden' }}>
          <div style={{ width: `${oplOpgelostPct}%`, height: '100%', background: '#c8e86a', borderRadius: '100px', transition: 'width 0.2s ease' }} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>

          {/* Kaart 1: Sparen */}
          <div style={{ background: '#F7F5F0', borderRadius: '16px', padding: '20px', order: oplOrder.sparen }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#2A3933', flexShrink: 0 }} />
                <span style={{ fontSize: '14px', fontWeight: '700', color: '#2A3933', fontFamily: 'Lato, sans-serif' }}>Sparen</span>
              </div>
              <RendementInput value={oplSparenRendement} onChange={setOplSparenRendement} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', color: '#8a8a82' }}>Maandbedrag</span>
              <input type="number" min="0" max={oplSparenMax} step="10" value={oplSparenBedrag} onChange={e => setOplSparenBedrag(Math.min(oplSparenMax, Math.max(0, Number(e.target.value))))} style={{ width: '100px', height: '30px', border: '1px solid rgba(42,57,51,0.2)', borderRadius: '100px', padding: '0 12px', fontSize: '13px', fontFamily: 'Lato, sans-serif', textAlign: 'right', outline: 'none', background: '#fff' }} />
            </div>
            <VoortgangsBalk value={oplSparenBedrag} max={oplSparenMax} />
            <AanbiederSelector type="sparen" bedrag={oplSparenBedrag} />
            <div style={{ background: '#fff', borderRadius: '10px', padding: '10px 12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontSize: '12px', color: '#8a8a82' }}>Box 3 belastingdruk ({fmtPct(box3DragSparenPct)}/jr)</span>
                <span style={{ fontSize: '12px', fontWeight: '600', color: '#cc4444' }}>- {fmtEuro(oplSparenBrutoEindvermogen - oplSparenEindvermogen)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '6px', borderTop: '1px solid rgba(42,57,51,0.08)' }}>
                <span style={{ fontSize: '12px', color: '#8a8a82' }}>Netto eindvermogen op pensioendatum</span>
                <span style={{ fontSize: '13px', fontWeight: '700', color: '#2A3933' }}>{fmtEuro(oplSparenEindvermogen)}</span>
              </div>
            </div>
          </div>

          {/* Kaart 2: Beleggen */}
          <div style={{ background: '#F7F5F0', borderRadius: '16px', padding: '20px', order: oplOrder.beleggen }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#c8e86a', flexShrink: 0 }} />
                <span style={{ fontSize: '14px', fontWeight: '700', color: '#2A3933', fontFamily: 'Lato, sans-serif' }}>Beleggen</span>
              </div>
              <RendementInput value={oplBeleggenRendement} onChange={setOplBeleggenRendement} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', color: '#8a8a82' }}>Maandbedrag</span>
              <input type="number" min="0" max={oplBeleggenMax} step="10" value={oplBeleggenBedrag} onChange={e => setOplBeleggenBedrag(Math.min(oplBeleggenMax, Math.max(0, Number(e.target.value))))} style={{ width: '100px', height: '30px', border: '1px solid rgba(42,57,51,0.2)', borderRadius: '100px', padding: '0 12px', fontSize: '13px', fontFamily: 'Lato, sans-serif', textAlign: 'right', outline: 'none', background: '#fff' }} />
            </div>
            <VoortgangsBalk value={oplBeleggenBedrag} max={oplBeleggenMax} />
            <AanbiederSelector type="beleggen" bedrag={oplBeleggenBedrag} />
            <div style={{ background: '#fff', borderRadius: '10px', padding: '10px 12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontSize: '12px', color: '#8a8a82' }}>Box 3 belastingdruk ({fmtPct(box3DragBeleggenPct)}/jr)</span>
                <span style={{ fontSize: '12px', fontWeight: '600', color: '#cc4444' }}>- {fmtEuro(berekenEindwaarde(0, oplBeleggenBedrag, oplBeleggenRendement, oplMaanden) - oplBeleggenEindvermogen)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '6px', borderTop: '1px solid rgba(42,57,51,0.08)' }}>
                <span style={{ fontSize: '12px', color: '#8a8a82' }}>Netto eindvermogen op pensioendatum</span>
                <span style={{ fontSize: '13px', fontWeight: '700', color: '#2A3933' }}>{fmtEuro(oplBeleggenEindvermogen)}</span>
              </div>
            </div>
          </div>

          {/* Kaart 3: Lijfrente klant */}
          <div style={{ background: '#F7F5F0', borderRadius: '16px', padding: '20px', order: oplOrder.lijfrenteKlant }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#56705f', flexShrink: 0 }} />
                <span style={{ fontSize: '14px', fontWeight: '700', color: '#2A3933', fontFamily: 'Lato, sans-serif' }}>Lijfrente beleggen {gezin?.klant?.voornaam || ''}</span>
              </div>
              <RendementInput value={oplLijfrenteRendement} onChange={setOplLijfrenteRendement} />
            </div>
            {maandMax > 0 ? (
              <>
                <div style={{ fontSize: '12px', color: '#8a8a82', marginBottom: '10px' }}>
                  Jaarruimte: {fmtEuro(jaarruimte)} · Maximum {fmtEuro(Math.floor(maandMax))}/mnd
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '12px', color: '#8a8a82' }}>Bruto maandbedrag</span>
                  <input type="number" min="0" max={oplLijfrenteMax} step="10" value={oplLijfrenteBedrag} onChange={e => setOplLijfrenteBedrag(Math.min(oplLijfrenteMax, Math.max(0, Number(e.target.value))))} style={{ width: '100px', height: '30px', border: '1px solid rgba(42,57,51,0.2)', borderRadius: '100px', padding: '0 12px', fontSize: '13px', fontFamily: 'Lato, sans-serif', textAlign: 'right', outline: 'none', background: '#fff' }} />
                </div>
                <VoortgangsBalk value={oplLijfrenteBedrag} max={oplLijfrenteMax} />
                <AanbiederSelector type="lijfrenteKlant" bedrag={oplLijfrenteBedrag} />
                <div style={{ background: '#fff', borderRadius: '10px', padding: '10px 12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '12px', color: '#8a8a82' }}>Belastingvoordeel inleg ({Math.round(klantInlegTarief * 100)}% effectief)</span>
                    <span style={{ fontSize: '12px', fontWeight: '600', color: '#27613a' }}>- {fmtEuro(oplLijfrenteBedrag * klantInlegTarief)}/mnd</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '6px', borderTop: '1px solid rgba(42,57,51,0.08)', marginBottom: '6px' }}>
                    <span style={{ fontSize: '12px', color: '#8a8a82' }}>Netto maandinleg</span>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: '#2A3933' }}>{fmtEuro(oplLijfrenteNettoMaand)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '12px', color: '#8a8a82' }}>Bruto eindvermogen</span>
                    <span style={{ fontSize: '12px', color: '#2A3933' }}>{fmtEuro(oplLijfrenteEindvermogenBruto)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                    <span style={{ fontSize: '12px', color: '#8a8a82' }}>Effectief tarief uitkering (incl. heffingskortingen)</span>
                    <span style={{ fontSize: '12px', fontWeight: '600', color: '#cc4444' }}>{Math.round(uitkeringsDecimaalEffectief * 1000) / 10}%</span>
                  </div>
                  <div style={{ fontSize: '11px', color: '#8a8a82', marginBottom: '4px', lineHeight: 1.5 }}>
                    {naAow ? 'Na AOW' : 'Vóór AOW'}{aowInkomen > 0 ? ` · AOW ${fmtEuro(Math.round(aowInkomen))}` : ''}{bestaandPensioenInkomen > 0 ? ` + pensioen ${fmtEuro(Math.round(bestaandPensioenInkomen))}` : ''}{bestaandeLijfrenteUitkering > 0 ? ` + bestaande lijfrente ${fmtEuro(Math.round(bestaandeLijfrenteUitkering))}` : ''}{oplLijfrenteBrutoJaarPayout > 0 ? ` + nieuwe uitkering ${fmtEuro(Math.round(oplLijfrenteBrutoJaarPayout))}` : ''} = {fmtEuro(Math.round(bestaandInkomenPensioen + oplLijfrenteBrutoJaarPayout))}/jr
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '6px', borderTop: '1px solid rgba(42,57,51,0.08)' }}>
                    <span style={{ fontSize: '12px', color: '#8a8a82' }}>Netto eindvermogen op pensioendatum</span>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: '#2A3933' }}>{fmtEuro(oplLijfrenteEindvermogen)}</span>
                  </div>
                </div>
                {toonZelfdeSchijf && <div style={{ marginTop: '8px', background: '#F7F5F0', borderRadius: '10px', padding: '10px 12px', fontSize: '12px', color: '#8a8a82', fontFamily: 'Lato, sans-serif' }}>Je blijft in dezelfde belastingschijf. Belastingvoordeel is {Math.round(klantMargTarief * 100)}% over het gehele bedrag.</div>}
                {toonSchijfgrensVoordeel && <div style={{ marginTop: '8px', background: '#c8e86a', borderRadius: '10px', padding: '10px 12px', fontSize: '12px', color: '#2A3933', fontFamily: 'Lato, sans-serif' }}>Jouw inleg brengt jouw inkomen onder de schijfgrens. Het deel in de hogere schijf ({Math.round(klantMargTarief * 100)}%) levert extra belastingvoordeel op.</div>}
                {oplLijfrenteBedrag > 0 && (
                  <VoordeeBlok
                    vergelijkBedrag={box3VergelijkLijfrenteKlant}
                    meerwaardeVsBox3={lijfrenteMeerwaardeVsBox3Klant}
                    nettoMaand={oplLijfrenteNettoMaand}
                    label="Belastingvoordeel lijfrente"
                  />
                )}
              </>
            ) : (
              <div style={{ background: '#fff', borderRadius: '10px', padding: '12px', fontSize: '13px', color: '#8a8a82', fontFamily: 'Lato, sans-serif' }}>
                Geen jaarruimte beschikbaar. Jaarruimte vereist arbeidsinkomen boven €17.545.
              </div>
            )}
          </div>

          {/* Kaart 3b: Lijfrente partner */}
          {heeftPartner && (
            <div style={{ background: '#F7F5F0', borderRadius: '16px', padding: '20px', order: oplOrder.lijfrentePartner }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#56705f', flexShrink: 0 }} />
                  <span style={{ fontSize: '14px', fontWeight: '700', color: '#2A3933', fontFamily: 'Lato, sans-serif' }}>Lijfrente beleggen {gezin?.partner?.voornaam || 'partner'}</span>
                </div>
                <RendementInput value={oplLijfrentePartnerRendement} onChange={setOplLijfrentePartnerRendement} />
              </div>
              {partnerMaandMax > 0 ? (
                <>
                  <div style={{ fontSize: '12px', color: '#8a8a82', marginBottom: '10px' }}>
                    Jaarruimte: {fmtEuro(partnerJaarruimte)} · Maximum {fmtEuro(Math.floor(partnerMaandMax))}/mnd
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '12px', color: '#8a8a82' }}>Bruto maandbedrag</span>
                    <input type="number" min="0" max={oplLijfrentePartnerMax} step="10" value={oplLijfrentePartnerBedrag} onChange={e => setOplLijfrentePartnerBedrag(Math.min(oplLijfrentePartnerMax, Math.max(0, Number(e.target.value))))} style={{ width: '100px', height: '30px', border: '1px solid rgba(42,57,51,0.2)', borderRadius: '100px', padding: '0 12px', fontSize: '13px', fontFamily: 'Lato, sans-serif', textAlign: 'right', outline: 'none', background: '#fff' }} />
                  </div>
                  <VoortgangsBalk value={oplLijfrentePartnerBedrag} max={oplLijfrentePartnerMax} />
                  <AanbiederSelector type="lijfrentePartner" bedrag={oplLijfrentePartnerBedrag} />
                  <div style={{ background: '#fff', borderRadius: '10px', padding: '10px 12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '12px', color: '#8a8a82' }}>Belastingvoordeel inleg ({Math.round(partnerInlegTarief * 100)}% effectief)</span>
                      <span style={{ fontSize: '12px', fontWeight: '600', color: '#27613a' }}>- {fmtEuro(oplLijfrentePartnerBedrag * partnerInlegTarief)}/mnd</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '6px', borderTop: '1px solid rgba(42,57,51,0.08)', marginBottom: '6px' }}>
                      <span style={{ fontSize: '12px', color: '#8a8a82' }}>Netto maandinleg</span>
                      <span style={{ fontSize: '13px', fontWeight: '700', color: '#2A3933' }}>{fmtEuro(oplLijfrentePartnerNettoMaand)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '12px', color: '#8a8a82' }}>Bruto eindvermogen</span>
                      <span style={{ fontSize: '12px', color: '#2A3933' }}>{fmtEuro(oplLijfrentePartnerEindvermogenBruto)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                      <span style={{ fontSize: '12px', color: '#8a8a82' }}>Effectief tarief uitkering (incl. heffingskortingen)</span>
                      <span style={{ fontSize: '12px', fontWeight: '600', color: '#cc4444' }}>{Math.round(uitkeringsDecimaalEffectiefPartner * 1000) / 10}%</span>
                    </div>
                    <div style={{ fontSize: '11px', color: '#8a8a82', marginBottom: '4px', lineHeight: 1.5 }}>
                      {naAowPartner ? 'Na AOW' : 'Vóór AOW'}{aowInkomenPartner > 0 ? ` · AOW ${fmtEuro(Math.round(aowInkomenPartner))}` : ''}{bestaandPensioenInkomenPartner > 0 ? ` + pensioen ${fmtEuro(Math.round(bestaandPensioenInkomenPartner))}` : ''}{bestaandeLijfrenteUitkeringPartner > 0 ? ` + bestaande lijfrente ${fmtEuro(Math.round(bestaandeLijfrenteUitkeringPartner))}` : ''}{oplLijfrentePartnerBrutoJaarPayout > 0 ? ` + nieuwe uitkering ${fmtEuro(Math.round(oplLijfrentePartnerBrutoJaarPayout))}` : ''} = {fmtEuro(Math.round(bestaandInkomenPensioenPartner + oplLijfrentePartnerBrutoJaarPayout))}/jr
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '6px', borderTop: '1px solid rgba(42,57,51,0.08)' }}>
                      <span style={{ fontSize: '12px', color: '#8a8a82' }}>Netto eindvermogen op pensioendatum</span>
                      <span style={{ fontSize: '13px', fontWeight: '700', color: '#2A3933' }}>{fmtEuro(oplLijfrentePartnerEindvermogen)}</span>
                    </div>
                  </div>
                  {toonPartnerZelfdeSchijf && <div style={{ marginTop: '8px', background: '#F7F5F0', borderRadius: '10px', padding: '10px 12px', fontSize: '12px', color: '#8a8a82', fontFamily: 'Lato, sans-serif' }}>{gezin?.partner?.voornaam || 'Partner'} blijft in dezelfde belastingschijf. Belastingvoordeel is {Math.round(partnerMargTarief * 100)}% over het gehele bedrag.</div>}
                  {toonPartnerSchijfgrensVoordeel && <div style={{ marginTop: '8px', background: '#c8e86a', borderRadius: '10px', padding: '10px 12px', fontSize: '12px', color: '#2A3933', fontFamily: 'Lato, sans-serif' }}>De inleg brengt het inkomen van {gezin?.partner?.voornaam || 'partner'} onder de schijfgrens. Het deel in de hogere schijf ({Math.round(partnerMargTarief * 100)}%) levert extra belastingvoordeel op.</div>}
                  {oplLijfrentePartnerBedrag > 0 && (
                    <VoordeeBlok
                      vergelijkBedrag={box3VergelijkLijfrentePartner}
                      meerwaardeVsBox3={lijfrenteMeerwaardeVsBox3Partner}
                      nettoMaand={oplLijfrentePartnerNettoMaand}
                      label="Belastingvoordeel lijfrente"
                    />
                  )}
                </>
              ) : (
                <div style={{ background: '#fff', borderRadius: '10px', padding: '12px', fontSize: '13px', color: '#8a8a82', fontFamily: 'Lato, sans-serif' }}>
                  Geen jaarruimte beschikbaar. Jaarruimte vereist arbeidsinkomen boven €17.545.
                </div>
              )}
            </div>
          )}

          {/* Kaart 4: Vermogen in BV */}
          {bv?.bvAanwezig === 'ja' && (
            <div style={{ background: '#F7F5F0', borderRadius: '16px', padding: '20px', order: oplOrder.bv }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#8a8a82', flexShrink: 0 }} />
                  <span style={{ fontSize: '14px', fontWeight: '700', color: '#2A3933', fontFamily: 'Lato, sans-serif' }}>Vermogen in BV</span>
                </div>
                <RendementInput value={oplBvRendement} onChange={setOplBvRendement} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', color: '#8a8a82' }}>Bruto maandbedrag</span>
                <input type="number" min="0" max={oplBvMax} step="10" value={oplBvBedrag} onChange={e => setOplBvBedrag(Math.min(oplBvMax, Math.max(0, Number(e.target.value))))} style={{ width: '100px', height: '30px', border: '1px solid rgba(42,57,51,0.2)', borderRadius: '100px', padding: '0 12px', fontSize: '13px', fontFamily: 'Lato, sans-serif', textAlign: 'right', outline: 'none', background: '#fff' }} />
              </div>
              <VoortgangsBalk value={oplBvBedrag} max={oplBvMax} />
              <AanbiederSelector type="bv" bedrag={oplBvBedrag} />
              <div style={{ background: '#fff', borderRadius: '10px', padding: '10px 12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '12px', color: '#8a8a82' }}>Bruto jaarbedrag</span>
                  <span style={{ fontSize: '12px', fontWeight: '600', color: '#2A3933' }}>{fmtEuro(oplBvBedrag * 12)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '12px', color: '#8a8a82' }}>Netto na Vpb (19%)</span>
                  <span style={{ fontSize: '12px', fontWeight: '600', color: '#2A3933' }}>{fmtEuro(oplBvNettoMaand * 12)}/jr</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '6px', borderTop: '1px solid rgba(42,57,51,0.08)', marginBottom: '4px' }}>
                  <span style={{ fontSize: '12px', color: '#8a8a82' }}>Opgebouwd eindvermogen in BV</span>
                  <span style={{ fontSize: '12px', color: '#2A3933' }}>{fmtEuro(oplBvEindvermogen)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '12px', color: '#8a8a82' }}>Box 2 belasting bij uitkering ({Math.round(oplBvEffectiefBox2Tarief * 100)}% effectief)</span>
                  <span style={{ fontSize: '12px', fontWeight: '600', color: '#cc4444' }}>- {fmtEuro(oplBvBox2Belasting)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '6px', borderTop: '1px solid rgba(42,57,51,0.08)' }}>
                  <span style={{ fontSize: '12px', color: '#8a8a82' }}>Netto eindvermogen op pensioendatum</span>
                  <span style={{ fontSize: '13px', fontWeight: '700', color: '#2A3933' }}>{fmtEuro(oplBvNettoNaBox2)}</span>
                </div>
              </div>
              {oplBvBedrag > 0 && (
                <VoordeeBlok
                  vergelijkBedrag={box3VergelijkBV}
                  meerwaardeVsBox3={bvMeerwaardeVsBox3}
                  nettoMaand={oplBvNettoMaand}
                  label="Meerwaarde BV vs. box 3 (netto/netto)"
                />
              )}
            </div>
          )}
        </div>

        {/* Resterende tekort */}
        <div style={{ background: oplResterendTekort === 0 ? '#c8e86a' : '#f9e9e9', borderRadius: '16px', padding: '20px' }}>
          {oplResterendTekort === 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#2A3933', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <div style={{ width: '10px', height: '6px', borderLeft: '2px solid #c8e86a', borderBottom: '2px solid #c8e86a', transform: 'rotate(-45deg) translateY(-2px)' }} />
              </div>
              <div>
                <p style={{ fontSize: '14px', fontWeight: '700', color: '#2A3933', margin: '0 0 2px 0', fontFamily: 'Lato, sans-serif' }}>Het pensioentekort is volledig opgelost</p>
                <p style={{ fontSize: '12px', color: '#2A3933', margin: 0, fontFamily: 'Lato, sans-serif' }}>Alle {fmtEuro(pensioengat)} op pensioendatum is gedekt door de oplossingen.</p>
              </div>
            </div>
          ) : (
            <>
              <p style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '0.08em', color: '#cc4444', textTransform: 'uppercase', margin: '0 0 8px 0', fontFamily: 'Lato, sans-serif' }}>Nog op te lossen</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '4px' }}>
                <span style={{ fontSize: '28px', fontWeight: '700', color: '#cc4444', fontFamily: 'Lato, sans-serif', letterSpacing: '-0.5px' }}>{fmtEuro(oplResterendTekort)}</span>
                <span style={{ fontSize: '13px', color: '#cc4444' }}>{100 - oplOpgelostPct}% van het totale pensioengat</span>
              </div>
              <p style={{ fontSize: '12px', color: '#8a8a82', margin: 0, fontFamily: 'Lato, sans-serif' }}>op pensioendatum</p>
            </>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '8px' }}>
        <button onClick={onVorige} style={{ width: '100%', padding: '14px 28px', fontSize: '15px', fontWeight: '700', background: 'transparent', color: '#2A3933', border: '1px solid rgba(42,57,51,0.2)', borderRadius: '100px', cursor: 'pointer', fontFamily: 'Lato, sans-serif' }}>
          ← Vorige
        </button>
        <button onClick={handleExport} style={{ width: '100%', padding: '14px 28px', fontSize: '15px', fontWeight: '700', background: '#2A3933', color: '#FFFFFF', border: 'none', borderRadius: '100px', cursor: 'pointer', fontFamily: 'Lato, sans-serif' }}>
          Rapport genereren →
        </button>
      </div>
    </div>
  );
}
