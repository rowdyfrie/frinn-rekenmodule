'use client';
import { useState, useEffect, useRef } from 'react';
import {
  AOW_ALLEENSTAAND_JAAR, AOW_PARTNER_JAAR,
  BOX1_VOOR_AOW, BOX1_NA_AOW, BOX2_SCHIJVEN, VPB_SCHIJVEN,
  BOX3_VRIJSTELLING_PERSOON, BOX3_TARIEF, BOX3_FICTIEF_RENDEMENT_SPAREN, BOX3_FICTIEF_RENDEMENT_BELEGGEN,
  AHK_MAX, AHK_AFBOUW_START, AHK_AFBOUW_EIND, AHK_AFBOUW_TARIEF,
  ARBEIDSKORTING_MAX, ARBEIDSKORTING_OPBOUW_1_TARIEF, ARBEIDSKORTING_OPBOUW_1_GRENS,
  ARBEIDSKORTING_OPBOUW_2_TARIEF, ARBEIDSKORTING_OPBOUW_2_GRENS,
  ARBEIDSKORTING_AFBOUW_TARIEF, ARBEIDSKORTING_AFBOUW_GRENS,
  OUDERENKORTING_MAX, OUDERENKORTING_AFBOUW_START, OUDERENKORTING_AFBOUW_EIND, OUDERENKORTING_AFBOUW_TARIEF,
  ALLEENSTAANDE_OUDERENKORTING, IACK_MAX, IACK_DREMPEL, IACK_TARIEF,
  AOW_LEEFTIJD_TABEL, WONINGWAARDE_STIJGING, EWF_TARIEF_LAAG, EWF_GRENS, EWF_TARIEF_HOOG, INFLATIE,
} from '@/lib/constants';

const inputStijl = { width: '100%', boxSizing: 'border-box', height: '42px', border: '1px solid rgba(42,57,51,0.2)', borderRadius: '100px', padding: '0 16px', fontSize: '14px', fontFamily: 'Lato, sans-serif', color: '#4a4a45', background: '#FFFFFF', outline: 'none' };
const labelStijl = { fontSize: '13px', fontWeight: '300', color: '#8a8a82', display: 'block', marginBottom: '6px', fontFamily: 'Lato, sans-serif' };
const kaartStijl = { background: '#FFFFFF', borderRadius: '20px', padding: '28px', border: '1px solid rgba(42,57,51,0.1)', marginBottom: '12px' };

function berekenAowLeeftijd(geboortedatum) {
  if (!geboortedatum) return { jaren: 67, maanden: 0 };
  const d = new Date(geboortedatum);
  for (const rij of AOW_LEEFTIJD_TABEL) {
    if (d >= new Date(rij.van) && d <= new Date(rij.tot)) return { jaren: rij.jaren, maanden: rij.maanden };
  }
  return { jaren: 70, maanden: 0 };
}

function berekenAowDatum(geboortedatum, aow) {
  if (!geboortedatum || !aow) return '—';
  const d = new Date(geboortedatum);
  d.setFullYear(d.getFullYear() + aow.jaren);
  d.setMonth(d.getMonth() + aow.maanden);
  return d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' });
}

function leeftijdNaarJaar(geboortedatum, leeftijdJaren, leeftijdMaanden = 0) {
  if (!geboortedatum) return new Date().getFullYear() + leeftijdJaren;
  const d = new Date(geboortedatum);
  return d.getFullYear() + leeftijdJaren + (leeftijdMaanden >= 6 ? 1 : 0);
}

function berekenVpb(winst) {
  if (winst <= 0) return 0;
  let belasting = 0, vorig = 0;
  for (const schijf of VPB_SCHIJVEN) {
    if (winst <= vorig) break;
    belasting += (Math.min(winst, schijf.grens) - vorig) * schijf.tarief;
    vorig = schijf.grens;
  }
  return belasting;
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

function margTarief(bruto, naAow) {
  const schijven = naAow ? BOX1_NA_AOW : BOX1_VOOR_AOW;
  for (const schijf of schijven) {
    if (bruto <= schijf.grens) return schijf.tarief;
  }
  return schijven[schijven.length - 1].tarief;
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

function berekenEindwaarde(huidigeWaarde, maandInleg, rendementPct, aantalMaanden) {
  const r = (rendementPct || 4) / 100 / 12;
  const wv = (huidigeWaarde || 0) * Math.pow(1 + r, aantalMaanden);
  if (r === 0) return wv + (maandInleg || 0) * aantalMaanden;
  return wv + (maandInleg || 0) * ((Math.pow(1 + r, aantalMaanden) - 1) / r);
}

function berekenRenteJaar(schuld, rentePct, type, jarenVerstreken, einddatum) {
  const nu = new Date();
  const eind = new Date(einddatum);
  const totaalMaanden = Math.round((eind - nu) / (1000 * 60 * 60 * 24 * 30.44));
  const r = rentePct / 100 / 12;
  if (type === 'aflossingsvrij') return schuld * rentePct / 100;
  if (type === 'lineair') {
    const maandAflossing = schuld / totaalMaanden;
    const schuldNu = Math.max(0, schuld - maandAflossing * jarenVerstreken * 12);
    return schuldNu * rentePct / 100;
  }
  if (type === 'annuitair') {
    if (r === 0) return 0;
    const annuiteit = berekenAnnuiteit(schuld, rentePct, totaalMaanden);
    let s = schuld;
    for (let m = 0; m < jarenVerstreken * 12; m++) {
      const ri = s * r;
      s = Math.max(0, s - (annuiteit - ri));
    }
    let rente = 0;
    for (let m = 0; m < 12; m++) {
      const ri = s * r;
      rente += ri;
      s = Math.max(0, s - (annuiteit - ri));
    }
    return rente;
  }
  return 0;
}

function fmtEuro(n) {
  const abs = Math.abs(Math.round(n));
  return (n < 0 ? '- ' : '') + '€ ' + abs.toLocaleString('nl-NL');
}

function berekenAlgemeneHeffingskorting(verzamelinkomen) {
  if (verzamelinkomen <= AHK_AFBOUW_START) return AHK_MAX;
  if (verzamelinkomen >= AHK_AFBOUW_EIND) return 0;
  return Math.max(0, AHK_MAX - (verzamelinkomen - AHK_AFBOUW_START) * AHK_AFBOUW_TARIEF);
}

function berekenArbeidskorting(arbeidsinkomen) {
  if (arbeidsinkomen <= 0) return 0;
  if (arbeidsinkomen >= ARBEIDSKORTING_AFBOUW_GRENS) return 0;
  let korting;
  if (arbeidsinkomen <= ARBEIDSKORTING_OPBOUW_1_GRENS) {
    korting = arbeidsinkomen * ARBEIDSKORTING_OPBOUW_1_TARIEF;
  } else if (arbeidsinkomen <= ARBEIDSKORTING_OPBOUW_2_GRENS) {
    korting = ARBEIDSKORTING_OPBOUW_1_GRENS * ARBEIDSKORTING_OPBOUW_1_TARIEF + (arbeidsinkomen - ARBEIDSKORTING_OPBOUW_1_GRENS) * ARBEIDSKORTING_OPBOUW_2_TARIEF;
  } else {
    korting = Math.min(ARBEIDSKORTING_MAX, ARBEIDSKORTING_OPBOUW_1_GRENS * ARBEIDSKORTING_OPBOUW_1_TARIEF + (ARBEIDSKORTING_OPBOUW_2_GRENS - ARBEIDSKORTING_OPBOUW_1_GRENS) * ARBEIDSKORTING_OPBOUW_2_TARIEF);
    korting = Math.max(0, korting - (arbeidsinkomen - ARBEIDSKORTING_OPBOUW_2_GRENS) * ARBEIDSKORTING_AFBOUW_TARIEF);
  }
  return korting;
}

function berekenOuderenkorting(verzamelinkomen) {
  if (verzamelinkomen <= OUDERENKORTING_AFBOUW_START) return OUDERENKORTING_MAX;
  if (verzamelinkomen >= OUDERENKORTING_AFBOUW_EIND) return 0;
  return Math.max(0, OUDERENKORTING_MAX - (verzamelinkomen - OUDERENKORTING_AFBOUW_START) * OUDERENKORTING_AFBOUW_TARIEF);
}

export default function StapGrafiek({ gezin, inkomsten, pensioen, bv, uitgaven, woning, onVorige, onVolgende }) {
  const canvasRef = useRef(null);
  const canvasTekortRef = useRef(null);
  const canvasVermogenRef = useRef(null);
  const [tooltip, setTooltip] = useState(null);
  const [vermogenTooltip, setVermogenTooltip] = useState(null);
  const nu = new Date();
  const huidigJaar = nu.getFullYear();

  const klantGebDatum = gezin?.klant?.geboortedatum;
  const partnerGebDatum = gezin?.partner?.geboortedatum;
  const heeftPartner = !!gezin?.partner;

  const klantAow = berekenAowLeeftijd(klantGebDatum);
  const partnerAow = heeftPartner ? berekenAowLeeftijd(partnerGebDatum) : null;

  const klantAowJaar = leeftijdNaarJaar(klantGebDatum, klantAow.jaren, klantAow.maanden);
  const partnerAowJaar = heeftPartner ? leeftijdNaarJaar(partnerGebDatum, partnerAow.jaren, partnerAow.maanden) : null;
  const jongsteAowJaar = heeftPartner ? Math.max(klantAowJaar, partnerAowJaar) : klantAowJaar;
  const eindJaar = jongsteAowJaar + 20;

  const [inflatie, setInflatie] = useState('nee');
  const [klantPensioenDatum, setKlantPensioenDatum] = useState('');
  const [partnerPensioenDatum, setPartnerPensioenDatum] = useState('');
  const [toonOverwaarde, setToonOverwaarde] = useState('ja');

  const klantPensioenJaar = klantPensioenDatum ? new Date(klantPensioenDatum).getFullYear() : klantAowJaar;
  const partnerPensioenJaar = partnerPensioenDatum ? new Date(partnerPensioenDatum).getFullYear() : (heeftPartner ? partnerAowJaar : null);
  const inflatieR = inflatie === 'ja' ? INFLATIE : 0;

  const jaren = Array.from({ length: eindJaar - huidigJaar + 1 }, (_, i) => huidigJaar + i);

  function berekenAccountWaarde(startWaarde, maandInleg, rendement, pensioengat, jaar) {
    const jarenVerstreken = jaar - huidigJaar;
    if (pensioengat !== 'ja' || jaar <= klantPensioenJaar) {
      return Math.max(0, berekenEindwaarde(startWaarde, maandInleg, rendement, jarenVerstreken * 12));
    }
    const maandenOpbouw = (klantPensioenJaar - huidigJaar) * 12;
    const waardeOpPensioen = berekenEindwaarde(startWaarde, maandInleg, rendement, maandenOpbouw);
    const uitkeringsEind = jongsteAowJaar + 20;
    const uitkeringsMaanden = (uitkeringsEind - klantPensioenJaar) * 12;
    if (uitkeringsMaanden <= 0) return 0;
    const maandUitkering = berekenAnnuiteit(waardeOpPensioen, 4, uitkeringsMaanden);
    const maandenUitkering = (jaar - klantPensioenJaar) * 12;
    return Math.max(0, berekenEindwaarde(waardeOpPensioen, -maandUitkering, 4, maandenUitkering));
  }

  const wozWaardeNu = parseFloat(woning?.woningwaarde) || 0;
  const forfaitPct = wozWaardeNu <= 0 ? 0
    : wozWaardeNu <= EWF_GRENS ? EWF_TARIEF_LAAG
    : (EWF_GRENS * EWF_TARIEF_LAAG + (wozWaardeNu - EWF_GRENS) * EWF_TARIEF_HOOG) / wozWaardeNu;

  function berekenNettoInkomenJaar(jaar) {
    const naAowKlant = jaar >= klantAowJaar;
    const naAowPartner = heeftPartner ? jaar >= partnerAowJaar : false;
    const jarenVerstreken = jaar - huidigJaar;

    let klantArbeid = 0;
    if (jaar < klantPensioenJaar) {
      const factor = Math.pow(1 + inflatieR, jarenVerstreken);
      klantArbeid = (inkomsten?.klantInkomsten || []).reduce((s, i) => s + (parseFloat(i.bedrag) || 0), 0) * factor;
    }
    let partnerArbeid = 0;
    if (heeftPartner && jaar < partnerPensioenJaar) {
      const factor = Math.pow(1 + inflatieR, jarenVerstreken);
      partnerArbeid = (inkomsten?.partnerInkomsten || []).reduce((s, i) => s + (parseFloat(i.bedrag) || 0), 0) * factor;
    }

    let klantPrivatePensioen = 0;
    let partnerPrivatePensioen = 0;
    for (const p of (pensioen?.klantPensioenen || [])) {
      const ingangJaar = leeftijdNaarJaar(klantGebDatum, p.jaren || 67, p.maanden || 0);
      if (jaar >= ingangJaar) klantPrivatePensioen += (parseFloat(p.bedrag) || 0);
    }
    for (const p of (pensioen?.partnerPensioenen || [])) {
      const ingangJaar = leeftijdNaarJaar(partnerGebDatum, p.jaren || 67, p.maanden || 0);
      if (jaar >= ingangJaar) partnerPrivatePensioen += (parseFloat(p.bedrag) || 0);
    }

    const aowJarenVerstreken = Math.max(0, jaar - klantAowJaar);
    const aowInflatieFactor = inflatie === 'ja' ? Math.pow(1 + INFLATIE, aowJarenVerstreken) : 1;
    const klantAowBedrag = jaar >= klantAowJaar ? (heeftPartner ? AOW_PARTNER_JAAR : AOW_ALLEENSTAAND_JAAR) * aowInflatieFactor : 0;
    let partnerAowBedrag = 0;
    if (heeftPartner && jaar >= partnerAowJaar) {
      const partnerAowJV = Math.max(0, jaar - partnerAowJaar);
      const partnerAowFactor = inflatie === 'ja' ? Math.pow(1 + INFLATIE, partnerAowJV) : 1;
      partnerAowBedrag = AOW_PARTNER_JAAR * partnerAowFactor;
    }

    let klantLijfrenteUitkering = 0;
    let partnerLijfrenteUitkering = 0;
    for (const l of (uitgaven?.lijfrentes || [])) {
      const pensioenJaar = l.voor === 'partner' ? partnerPensioenJaar : klantPensioenJaar;
      const aowJaar = l.voor === 'partner' ? partnerAowJaar : klantAowJaar;
      const uitkeringsEind = (aowJaar || klantAowJaar) + 20;
      if (jaar >= pensioenJaar && jaar <= uitkeringsEind) {
        const maandenOpbouw = (pensioenJaar - huidigJaar) * 12;
        const eindwaarde = berekenEindwaarde(parseFloat(l.waarde) || 0, parseFloat(l.inleg) || 0, parseFloat(l.rendement) || 4, maandenOpbouw);
        const uitkeringsMaanden = (uitkeringsEind - pensioenJaar) * 12;
        const jaarUitkering = berekenAnnuiteit(eindwaarde, 4, uitkeringsMaanden) * 12;
        if (l.voor === 'partner') partnerLijfrenteUitkering += jaarUitkering;
        else klantLijfrenteUitkering += jaarUitkering;
      }
    }

    let spaarUitkering = 0;
    for (const s of [...(uitgaven?.sparen || []), ...(uitgaven?.beleggen || [])]) {
      if (s.pensioengat !== 'ja') continue;
      const uitkeringsEind = jongsteAowJaar + 20;
      if (jaar >= klantPensioenJaar && jaar <= uitkeringsEind) {
        const maandenOpbouw = (klantPensioenJaar - huidigJaar) * 12;
        const eindwaarde = berekenEindwaarde(parseFloat(s.waarde) || 0, parseFloat(s.inleg) || 0, parseFloat(s.rendement) || 4, maandenOpbouw);
        const uitkeringsMaanden = (uitkeringsEind - klantPensioenJaar) * 12;
        spaarUitkering += berekenAnnuiteit(eindwaarde, 4, uitkeringsMaanden) * 12;
      }
    }

    let lijfrenteAftrek = 0;
    for (const l of (uitgaven?.lijfrentes || [])) {
      const pensioenJaar = l.voor === 'partner' ? partnerPensioenJaar : klantPensioenJaar;
      if (jaar < pensioenJaar) {
        const jaarInleg = (parseFloat(l.inleg) || 0) * 12;
        const brutoVoorAftrek = l.voor === 'partner' ? partnerArbeid : klantArbeid;
        const naAowVoorAftrek = l.voor === 'partner' ? naAowPartner : naAowKlant;
        lijfrenteAftrek += jaarInleg * margTarief(brutoVoorAftrek, naAowVoorAftrek);
      }
    }

    let hraVoordeel = 0;
    const hoogsteInkomen = Math.max(klantArbeid, partnerArbeid);
    const naAowHoogste = klantArbeid >= partnerArbeid ? naAowKlant : naAowPartner;
    for (const l of (woning?.leningdelen || [])) {
      if (l.hra !== 'ja' || !l.einddatum) continue;
      const einddatum = new Date(l.einddatum);
      if (einddatum.getFullYear() <= jaar) continue;
      const rente = berekenRenteJaar(parseFloat(l.schuld) || 0, parseFloat(l.rente) || 0, l.type, jarenVerstreken, l.einddatum);
      const tarief = Math.min(margTarief(hoogsteInkomen, naAowHoogste), 0.3756);
      hraVoordeel += rente * tarief;
    }

    const klantPensioenInkomen = klantPrivatePensioen + klantAowBedrag;
    const partnerPensioenInkomen = partnerPrivatePensioen + partnerAowBedrag;
    const woningGroeiR = (parseFloat(woning?.waardestijging) / 100) || WONINGWAARDE_STIJGING;
    const woningwaardeJaar = (parseFloat(woning?.woningwaarde) || 0) * Math.pow(1 + woningGroeiR, jarenVerstreken);
    const eigenwoningForfait = woningwaardeJaar * forfaitPct;
    const klantBruto = klantArbeid + klantPensioenInkomen + klantLijfrenteUitkering;
    const partnerBruto = partnerArbeid + partnerPensioenInkomen + partnerLijfrenteUitkering;
    // BV Box 2
    let bvBrutoDividend = 0;
    let bvBox2 = 0;
    if (bv?.bvAanwezig === 'ja') {
      const inflatieFactorBV = Math.pow(1 + inflatieR, jarenVerstreken);
      if (jaar < klantPensioenJaar) {
        for (const b of (bv?.bvs || [])) {
          for (const d of (b.dividend || [])) {
            bvBrutoDividend += (parseFloat(d.bedrag) || 0) * inflatieFactorBV;
          }
        }
        bvBox2 = berekenBox2(bvBrutoDividend);
      } else {
        const uitkeringsEind = jongsteAowJaar + 20;
        if (jaar <= uitkeringsEind) {
          const pensioenMaanden = (klantPensioenJaar - huidigJaar) * 12;
          let totalBVVermogen = 0;
          for (const b of (bv?.bvs || [])) {
            for (const v of (b.vermogen || [])) {
              if (v.type === 'spaargeld') {
                totalBVVermogen += berekenEindwaarde(parseFloat(v.waarde) || 0, (parseFloat(v.jaarlijksBedrag) || 0) / 12, parseFloat(v.rendement) || 4, pensioenMaanden);
              } else if (v.type === 'onroerend_goed') {
                const nettoHuur = (parseFloat(v.huurinkomsten) || 0) - (parseFloat(v.kosten) || 0);
                totalBVVermogen += berekenEindwaarde(parseFloat(v.waarde) || 0, nettoHuur, parseFloat(v.waardestijging) || 5, pensioenMaanden);
              }
            }
          }
          const uitkeringsMaanden = (uitkeringsEind - klantPensioenJaar) * 12;
          if (uitkeringsMaanden > 0 && totalBVVermogen > 0) {
            const jaarUitkering = berekenAnnuiteit(totalBVVermogen, 4, uitkeringsMaanden) * 12;
            const vpb = berekenVpb(jaarUitkering);
            bvBrutoDividend = jaarUitkering - vpb;
            bvBox2 = berekenBox2(bvBrutoDividend);
          }
        }
      }
    }

    // Box 3 grondslag (nodig voor verzamelinkomen vóór belastingberekening)
    let spaarVermogen = 0;
    let beleggenVermogen = 0;
    for (const s of (uitgaven?.sparen || [])) {
      spaarVermogen += berekenAccountWaarde(parseFloat(s.waarde) || 0, parseFloat(s.inleg) || 0, parseFloat(s.rendement) || 4, s.pensioengat, jaar);
    }
    for (const b of (uitgaven?.beleggen || [])) {
      beleggenVermogen += berekenAccountWaarde(parseFloat(b.waarde) || 0, parseFloat(b.inleg) || 0, parseFloat(b.rendement) || 4, b.pensioengat, jaar);
    }
    const totaalVermogen = spaarVermogen + beleggenVermogen;
    const vrijstelling = heeftPartner ? BOX3_VRIJSTELLING_PERSOON * 2 : BOX3_VRIJSTELLING_PERSOON;
    const box3Grondslag = Math.max(0, totaalVermogen - vrijstelling);
    let box3Belasting = 0;
    if (box3Grondslag > 0) {
      const spaarFractie = totaalVermogen > 0 ? spaarVermogen / totaalVermogen : 0;
      const fictiefRendement = box3Grondslag * spaarFractie * BOX3_FICTIEF_RENDEMENT_SPAREN + box3Grondslag * (1 - spaarFractie) * BOX3_FICTIEF_RENDEMENT_BELEGGEN;
      box3Belasting = fictiefRendement * BOX3_TARIEF;
    }

    // Verzamelinkomen per persoon (Box 1 + Box 2 + Box 3 grondslag)
    const klantBox3Grondslag = heeftPartner ? box3Grondslag / 2 : box3Grondslag;
    const partnerBox3Grondslag = heeftPartner ? box3Grondslag / 2 : 0;
    const klantVerzamelinkomen = klantBruto + bvBrutoDividend + klantBox3Grondslag;
    const partnerVerzamelinkomen = heeftPartner ? partnerBruto + partnerBox3Grondslag : 0;

    // Box 1 belasting (voor kortingen)
    let klantBelasting = berekenBox1Belasting(klantBruto, naAowKlant);
    let partnerBelasting = heeftPartner ? berekenBox1Belasting(partnerBruto, naAowPartner) : 0;

    // Heffingskortingen
    const klantWerkt = jaar < klantPensioenJaar;
    const partnerWerkt = heeftPartner && jaar < partnerPensioenJaar;
    const kindJongerDan12 = (gezin?.kinderen || []).some(k => {
      if (!k.geboortedatum) return false;
      return (jaar - new Date(k.geboortedatum).getFullYear()) < 12;
    });
    // IACK: alleen voor werkende ouder met inkomen > €6.073, alleen voor de laagst verdienende
    const klantIACKBasis = (kindJongerDan12 && klantWerkt && klantArbeid > IACK_DREMPEL)
      ? Math.min(IACK_MAX, (klantArbeid - IACK_DREMPEL) * IACK_TARIEF) : 0;
    const partnerIACKBasis = (kindJongerDan12 && partnerWerkt && partnerArbeid > IACK_DREMPEL)
      ? Math.min(IACK_MAX, (partnerArbeid - IACK_DREMPEL) * IACK_TARIEF) : 0;
    const klantIACK = (!heeftPartner || klantArbeid <= partnerArbeid) ? klantIACKBasis : 0;
    const partnerIACK = (heeftPartner && partnerArbeid < klantArbeid) ? partnerIACKBasis : 0;

    const klantKortingen = berekenAlgemeneHeffingskorting(klantVerzamelinkomen)
      + (klantWerkt ? berekenArbeidskorting(klantArbeid) : 0)
      + (naAowKlant ? berekenOuderenkorting(klantVerzamelinkomen) : 0)
      + (!heeftPartner && naAowKlant ? ALLEENSTAANDE_OUDERENKORTING : 0)
      + klantIACK;
    const partnerKortingen = heeftPartner
      ? berekenAlgemeneHeffingskorting(partnerVerzamelinkomen)
        + (partnerWerkt ? berekenArbeidskorting(partnerArbeid) : 0)
        + (naAowPartner ? berekenOuderenkorting(partnerVerzamelinkomen) : 0)
        + partnerIACK
      : 0;

    const eigenwoningForfaitBelasting = eigenwoningForfait * margTarief(klantBruto, naAowKlant);
    const klantBelastingNaKortingen = Math.max(0, klantBelasting - klantKortingen - hraVoordeel);
    klantBelasting = klantBelastingNaKortingen + eigenwoningForfaitBelasting;
    partnerBelasting = Math.max(0, partnerBelasting - partnerKortingen);

    const bvNettoInkomen = bvBrutoDividend - bvBox2;
    const totaalNetto = (klantBruto - klantBelasting) + (partnerBruto - partnerBelasting) + spaarUitkering + lijfrenteAftrek + bvNettoInkomen;

    let hypotheeklasten = 0;
    let lijfrenteInleg = 0;
    let spaarInleg = 0;
    let beleggenInleg = 0;
    let overigeUitgaven = 0;

    for (const l of (woning?.leningdelen || [])) {
      if (!l.einddatum) continue;
      const einddatum = new Date(l.einddatum);
      if (einddatum.getFullYear() <= jaar) continue;
      const totaalMaanden = Math.round((einddatum - nu) / (1000 * 60 * 60 * 24 * 30.44));
      const r = (parseFloat(l.rente) || 0) / 100 / 12;
      const schuld = parseFloat(l.schuld) || 0;
      let maandlast = 0;
      if (l.type === 'aflossingsvrij') maandlast = schuld * r;
      else if (l.type === 'lineair') {
        const maandAflossing = schuld / totaalMaanden;
        const schuldNu = Math.max(0, schuld - maandAflossing * jarenVerstreken * 12);
        maandlast = maandAflossing + schuldNu * r;
      } else if (l.type === 'annuitair') {
        maandlast = berekenAnnuiteit(schuld, parseFloat(l.rente) || 0, totaalMaanden);
      }
      hypotheeklasten += maandlast * 12;
    }
    for (const l of (uitgaven?.lijfrentes || [])) {
      const pensioenJaar = l.voor === 'partner' ? partnerPensioenJaar : klantPensioenJaar;
      if (jaar < pensioenJaar) lijfrenteInleg += (parseFloat(l.inleg) || 0) * 12;
    }
    for (const s of (uitgaven?.sparen || [])) {
      if (jaar < klantPensioenJaar) spaarInleg += (parseFloat(s.inleg) || 0) * 12;
    }
    for (const b of (uitgaven?.beleggen || [])) {
      if (jaar < klantPensioenJaar) beleggenInleg += (parseFloat(b.inleg) || 0) * 12;
    }
    for (const o of (uitgaven?.overig || [])) {
      if (!o.einddatum || new Date(o.einddatum).getFullYear() > jaar) {
        overigeUitgaven += (parseFloat(o.bedrag) || 0) * 12;
      }
    }

    const totaalUitgaven = hypotheeklasten + lijfrenteInleg + spaarInleg + beleggenInleg + overigeUitgaven + box3Belasting;

    return {
      totaalNetto,
      totaalUitgaven,
      detail: {
        klantArbeid, partnerArbeid,
        eigenwoningForfaitBelasting,
        klantPrivatePensioen, partnerPrivatePensioen,
        klantAowBedrag, partnerAowBedrag,
        klantLijfrenteUitkering, partnerLijfrenteUitkering,
        spaarUitkering, hraVoordeel, lijfrenteAftrek,
        klantBelasting: klantBelastingNaKortingen, partnerBelasting,
        bvBrutoDividend, bvBox2,
        hypotheeklasten, lijfrenteInleg, spaarInleg, beleggenInleg, overigeUitgaven, box3Belasting,
      },
    };
  }

  function berekenBenodigdInkomen(jaar) {
    const jarenVerstreken = jaar - huidigJaar;
    const jaar1 = berekenNettoInkomenJaar(huidigJaar);
    const startBedrag = Math.max(0, jaar1.totaalNetto - jaar1.totaalUitgaven);
    return Math.max(0, Math.round((startBedrag * Math.pow(1 + inflatieR, jarenVerstreken)) / 12));
  }

  function faseVanJaar(jaar) {
    if (jaar < jongsteAowJaar) return 1;
    return 3;
  }

  const faseNamen = { 1: 'Opbouw', 3: 'Pensioen' };

  const data = jaren.map(j => {
    const { totaalNetto, totaalUitgaven, detail } = berekenNettoInkomenJaar(j);
    const inkomen = Math.max(0, Math.round(totaalNetto / 12));
    const uitgavenMaand = Math.max(0, Math.round(totaalUitgaven / 12));
    const benodigdInkomen = berekenBenodigdInkomen(j);
    const vrijBesteedbaar = Math.max(0, inkomen - uitgavenMaand);
    const verschil = vrijBesteedbaar - benodigdInkomen;
    return { jaar: j, inkomen, uitgaven: uitgavenMaand, benodigdInkomen, vrijBesteedbaar, verschil, fase: faseVanJaar(j), detail };
  });

  function getHoveredIndex(e, canvasEl) {
    const rect = canvasEl.getBoundingClientRect();
    const scaleX = canvasEl.width / rect.width;
    const mouseX = (e.clientX - rect.left) * scaleX;
    const grafiekW = canvasEl.width - 70 - 20;
    const i = Math.floor((mouseX - 70) / (grafiekW / data.length));
    return i >= 0 && i < data.length ? i : -1;
  }

  function handleCanvasClick(e, ref) {
    const i = getHoveredIndex(e, ref.current);
    if (i < 0) return;
    const showLeft = e.clientX > window.innerWidth * 0.6;
    setTooltip({ x: e.clientX, y: e.clientY, showLeft, d: data[i] });
  }

  const maxWaarde = Math.max(...data.map(d => Math.max(d.inkomen, d.benodigdInkomen)), 1);
  const maxVerschil = Math.max(...data.map(d => Math.abs(d.verschil)), 1);

  const totalen = [1, 3].map(fase => {
    const faseData = data.filter(d => d.fase === fase);
    const som = faseData.reduce((s, d) => s + d.verschil * 12, 0);
    return { fase, som, aantalJaren: faseData.length };
  });
  const totaalSom = totalen.reduce((s, t) => s + t.som, 0);

  const discontovoet = inflatie === 'ja' ? INFLATIE : 0;

  const vroegstePensioenJaar = heeftPartner
    ? Math.min(klantPensioenJaar, partnerPensioenJaar)
    : klantPensioenJaar;

  const tijdelijkTekort = (() => {
    const voorPensioen = data.filter(d => d.jaar < vroegstePensioenJaar);
    const tekortJaren = voorPensioen.filter(d => d.verschil < 0);
    if (tekortJaren.length === 0) return null;
    const eersteJaar = tekortJaren[0].jaar;
    const laasteJaar = tekortJaren[tekortJaren.length - 1].jaar;
    const heeftLaterOverschot = voorPensioen.some(d => d.jaar > eersteJaar && d.verschil > 0);
    if (!heeftLaterOverschot) return null;
    return {
      eersteJaar,
      laasteJaar,
      hoogsteTekort: Math.max(...tekortJaren.map(d => Math.abs(d.verschil))),
    };
  })();
  const maandenTotPensioen = Math.max(1, (vroegstePensioenJaar - huidigJaar) * 12);

  const pensioengat = -data.reduce((som, d) => {
    const jaarVerschil = d.verschil * 12;
    const n = d.jaar < klantPensioenJaar
      ? klantPensioenJaar - d.jaar
      : d.jaar - klantPensioenJaar;
    const factor = Math.pow(1 + discontovoet, n) || 1;
    const gecorrigeerd = d.jaar < klantPensioenJaar
      ? jaarVerschil * factor
      : jaarVerschil / factor;
    return som + gecorrigeerd;
  }, 0);

  const vermogenJaren = Array.from({ length: eindJaar - huidigJaar + 1 }, (_, i) => huidigJaar + i);
  const mndTotPensioen = Math.max(0, (klantPensioenJaar - huidigJaar) * 12);

  let bvPotOpPensioen = 0;
  if (bv?.bvAanwezig === 'ja') {
    for (const b of (bv?.bvs || [])) {
      for (const v of (b.vermogen || [])) {
        if (v.type === 'spaargeld') {
          bvPotOpPensioen += berekenEindwaarde(parseFloat(v.waarde) || 0, (parseFloat(v.jaarlijksBedrag) || 0) / 12, parseFloat(v.rendement) || 4, mndTotPensioen);
        } else if (v.type === 'onroerend_goed') {
          const nettoHuur = (parseFloat(v.huurinkomsten) || 0) - (parseFloat(v.kosten) || 0);
          bvPotOpPensioen += berekenEindwaarde(parseFloat(v.waarde) || 0, nettoHuur, parseFloat(v.waardestijging) || 5, mndTotPensioen);
        }
      }
    }
  }
  const bvUitkeringsMaanden = Math.max(1, (jongsteAowJaar + 20 - klantPensioenJaar) * 12);
  const bvMaandUitkering = bvPotOpPensioen > 0 ? berekenAnnuiteit(bvPotOpPensioen, 4, bvUitkeringsMaanden) : 0;

  const vermogenData = vermogenJaren.map(jaar => {
    const maanden = (jaar - huidigJaar) * 12;
    const naPensioen = jaar > klantPensioenJaar;
    const maandenNaPensioen = naPensioen ? (jaar - klantPensioenJaar) * 12 : 0;

    const sparen = (uitgaven?.sparen || []).reduce((s, item) => {
      const r = parseFloat(item.rendement) || 4;
      const w = parseFloat(item.waarde) || 0;
      const inleg = parseFloat(item.inleg) || 0;
      if (item.pensioengat === 'ja') return s + berekenAccountWaarde(w, inleg, r, 'ja', jaar);
      if (!naPensioen) return s + berekenEindwaarde(w, inleg, r, maanden);
      return s + berekenEindwaarde(berekenEindwaarde(w, inleg, r, mndTotPensioen), 0, r, maandenNaPensioen);
    }, 0);

    const beleggen = (uitgaven?.beleggen || []).reduce((s, item) => {
      const r = parseFloat(item.rendement) || 4;
      const w = parseFloat(item.waarde) || 0;
      const inleg = parseFloat(item.inleg) || 0;
      if (item.pensioengat === 'ja') return s + berekenAccountWaarde(w, inleg, r, 'ja', jaar);
      if (!naPensioen) return s + berekenEindwaarde(w, inleg, r, maanden);
      return s + berekenEindwaarde(berekenEindwaarde(w, inleg, r, mndTotPensioen), 0, r, maandenNaPensioen);
    }, 0);

    const lijfrente = (uitgaven?.lijfrentes || []).reduce((s, l) => {
      const r = parseFloat(l.rendement) || 4;
      const w = parseFloat(l.waarde) || 0;
      const inleg = parseFloat(l.inleg) || 0;
      if (!naPensioen) return s + berekenEindwaarde(w, inleg, r, maanden);
      const pot = berekenEindwaarde(w, inleg, r, mndTotPensioen);
      const uitkMaanden = Math.max(1, (klantAowJaar + 20 - klantPensioenJaar) * 12);
      const maandUitkering = berekenAnnuiteit(pot, 4, uitkMaanden);
      return s + Math.max(0, berekenEindwaarde(pot, -maandUitkering, 4, maandenNaPensioen));
    }, 0);

    let bvVermogen = 0;
    if (bv?.bvAanwezig === 'ja') {
      if (naPensioen) {
        bvVermogen = Math.max(0, berekenEindwaarde(bvPotOpPensioen, -bvMaandUitkering, 4, maandenNaPensioen));
      } else {
        for (const b of (bv?.bvs || [])) {
          for (const v of (b.vermogen || [])) {
            if (v.type === 'spaargeld') {
              bvVermogen += berekenEindwaarde(parseFloat(v.waarde) || 0, (parseFloat(v.jaarlijksBedrag) || 0) / 12, parseFloat(v.rendement) || 4, maanden);
            } else if (v.type === 'onroerend_goed') {
              const nettoHuur = (parseFloat(v.huurinkomsten) || 0) - (parseFloat(v.kosten) || 0);
              bvVermogen += berekenEindwaarde(parseFloat(v.waarde) || 0, nettoHuur, parseFloat(v.waardestijging) || 5, maanden);
            }
          }
        }
      }
    }

    const woningGroei = (parseFloat(woning?.waardestijging) || 5.7) / 100;
    const woningwaardeJaar = (parseFloat(woning?.woningwaarde) || 0) * Math.pow(1 + woningGroei, maanden / 12);
    let totaleRestSchuld = 0;
    for (const l of (woning?.leningdelen || [])) {
      const schuld = parseFloat(l.schuld) || 0;
      if (!schuld || !l.einddatum) continue;
      const eind = new Date(l.einddatum);
      const totaalMnd = Math.max(1, Math.round((eind - nu) / (1000 * 60 * 60 * 24 * 30.44)));
      if (maanden >= totaalMnd) continue;
      const r = (parseFloat(l.rente) || 0) / 100 / 12;
      if (l.type === 'aflossingsvrij') {
        totaleRestSchuld += schuld;
      } else if (l.type === 'lineair') {
        totaleRestSchuld += Math.max(0, schuld - (schuld / totaalMnd) * maanden);
      } else {
        if (r === 0) {
          totaleRestSchuld += Math.max(0, schuld - (schuld / totaalMnd) * maanden);
        } else {
          const fn = Math.pow(1 + r, totaalMnd);
          const fk = Math.pow(1 + r, maanden);
          totaleRestSchuld += Math.max(0, schuld * (fn - fk) / (fn - 1));
        }
      }
    }
    const overwaarde = Math.max(0, woningwaardeJaar - totaleRestSchuld);

    const totaal = sparen + beleggen + lijfrente + bvVermogen + overwaarde;
    return { jaar, sparen, beleggen, lijfrente, bv: bvVermogen, overwaarde, woningwaardeJaar, totaleRestSchuld, totaal };
  });

  const vermogenPensioen = vermogenData.find(d => d.jaar === klantPensioenJaar)
    || (vermogenData.length > 0 ? vermogenData[0] : { sparen: 0, beleggen: 0, lijfrente: 0, bv: 0, overwaarde: 0, woningwaardeJaar: 0, totaleRestSchuld: 0, totaal: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;
    const padding = { top: 20, right: 20, bottom: 40, left: 70 };
    const grafiekH = H - padding.top - padding.bottom;
    const grafiekW = W - padding.left - padding.right;
    const barWidth = Math.max(4, grafiekW / data.length - 2);

    ctx.clearRect(0, 0, W, H);

    ctx.strokeStyle = 'rgba(42,57,51,0.08)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const y = padding.top + grafiekH - (i / 5) * grafiekH;
      ctx.beginPath(); ctx.moveTo(padding.left, y); ctx.lineTo(W - padding.right, y); ctx.stroke();
      ctx.fillStyle = '#8a8a82';
      ctx.font = '11px Lato, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText('€ ' + Math.round(maxWaarde * i / 5).toLocaleString('nl-NL'), padding.left - 6, y + 4);
    }

    data.forEach((d, i) => {
      const x = padding.left + i * (grafiekW / data.length) + (grafiekW / data.length - barWidth) / 2;
      const inkomstenH = (d.inkomen / maxWaarde) * grafiekH;
      const uitgavenH = Math.min((d.uitgaven / maxWaarde) * grafiekH, inkomstenH);
      const y = padding.top + grafiekH - inkomstenH;

      if (inkomstenH > 0) {
        ctx.fillStyle = '#2A3933';
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, inkomstenH, [3, 3, 0, 0]);
        ctx.fill();
      }
      if (uitgavenH > 0) {
        ctx.fillStyle = '#c8e86a';
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, uitgavenH, [3, 3, 0, 0]);
        ctx.fill();
      }
      if (i % 5 === 0 || data.length <= 15) {
        ctx.fillStyle = '#8a8a82';
        ctx.font = '11px Lato, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(d.jaar, x + barWidth / 2, H - padding.bottom + 16);
      }
    });

    ctx.strokeStyle = '#cc4444';
    ctx.lineWidth = 3;
    ctx.setLineDash([]);
    ctx.beginPath();
    data.forEach((d, i) => {
      const x = padding.left + i * (grafiekW / data.length) + (grafiekW / data.length) / 2;
      const y = padding.top + grafiekH - (d.benodigdInkomen / maxWaarde) * grafiekH;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.stroke();

    const mijlpalen = [
      { jaar: klantPensioenJaar, kleur: '#2A3933' },
      ...(heeftPartner ? [{ jaar: partnerPensioenJaar, kleur: '#56705f' }] : []),
    ];
    mijlpalen.forEach(m => {
      const i = data.findIndex(d => d.jaar === m.jaar);
      if (i < 0) return;
      const x = padding.left + i * (grafiekW / data.length) + (grafiekW / data.length) / 2;
      ctx.strokeStyle = m.kleur;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 3]);
      ctx.beginPath(); ctx.moveTo(x, padding.top); ctx.lineTo(x, padding.top + grafiekH); ctx.stroke();
      ctx.setLineDash([]);
    });
  }, [data, maxWaarde, klantPensioenJaar, partnerPensioenJaar, klantAowJaar, partnerAowJaar]);

  useEffect(() => {
    const canvas = canvasTekortRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;
    const padding = { top: 20, right: 20, bottom: 40, left: 70 };
    const grafiekH = H - padding.top - padding.bottom;
    const grafiekW = W - padding.left - padding.right;
    const barWidth = Math.max(4, grafiekW / data.length - 2);
    const nulY = padding.top + grafiekH / 2;

    ctx.clearRect(0, 0, W, H);

    ctx.strokeStyle = 'rgba(42,57,51,0.08)';
    ctx.lineWidth = 1;
    for (let i = -2; i <= 2; i++) {
      const y = nulY - (i / 2) * (grafiekH / 2);
      ctx.beginPath(); ctx.moveTo(padding.left, y); ctx.lineTo(W - padding.right, y); ctx.stroke();
      if (i !== 0) {
        ctx.fillStyle = '#8a8a82';
        ctx.font = '11px Lato, sans-serif';
        ctx.textAlign = 'right';
        const val = Math.round(maxVerschil * i / 2);
        ctx.fillText('€ ' + Math.abs(val).toLocaleString('nl-NL'), padding.left - 6, y + 4);
      }
    }

    ctx.strokeStyle = 'rgba(42,57,51,0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(padding.left, nulY); ctx.lineTo(W - padding.right, nulY); ctx.stroke();

    data.forEach((d, i) => {
      const x = padding.left + i * (grafiekW / data.length) + (grafiekW / data.length - barWidth) / 2;
      const h = (Math.abs(d.verschil) / maxVerschil) * (grafiekH / 2);

      if (d.verschil >= 0) {
        ctx.fillStyle = '#c8e86a';
        ctx.beginPath();
        ctx.roundRect(x, nulY - h, barWidth, h, [3, 3, 0, 0]);
        ctx.fill();
      } else {
        ctx.fillStyle = '#e05252';
        ctx.beginPath();
        ctx.roundRect(x, nulY, barWidth, h, [0, 0, 3, 3]);
        ctx.fill();
      }

      if (i % 5 === 0 || data.length <= 15) {
        ctx.fillStyle = '#8a8a82';
        ctx.font = '11px Lato, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(d.jaar, x + barWidth / 2, H - padding.bottom + 16);
      }
    });
  }, [data, maxVerschil]);

  useEffect(() => {
    const canvas = canvasVermogenRef.current;
    if (!canvas || vermogenData.length === 0) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;
    const padding = { top: 20, right: 20, bottom: 40, left: 80 };
    const grafiekH = H - padding.top - padding.bottom;
    const grafiekW = W - padding.left - padding.right;
    const barWidth = Math.max(4, grafiekW / vermogenData.length - 2);
    const maxVermogen = Math.max(...vermogenData.map(d => toonOverwaarde === 'ja' ? d.totaal : d.totaal - d.overwaarde), 1);

    ctx.clearRect(0, 0, W, H);

    ctx.strokeStyle = 'rgba(42,57,51,0.08)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = padding.top + grafiekH - (i / 4) * grafiekH;
      ctx.beginPath(); ctx.moveTo(padding.left, y); ctx.lineTo(W - padding.right, y); ctx.stroke();
      ctx.fillStyle = '#8a8a82';
      ctx.font = '11px Lato, sans-serif';
      ctx.textAlign = 'right';
      const val = maxVermogen * i / 4;
      const label = val >= 1000000 ? `€ ${(val / 1000000).toFixed(1)}M` : `€ ${Math.round(val / 1000)}k`;
      ctx.fillText(label, padding.left - 6, y + 4);
    }

    const segmenten = [
      { key: 'sparen', kleur: '#2A3933' },
      { key: 'beleggen', kleur: '#c8e86a' },
      { key: 'lijfrente', kleur: '#56705f' },
      { key: 'bv', kleur: '#a8c94a' },
      ...(toonOverwaarde === 'ja' ? [{ key: 'overwaarde', kleur: '#3d5248' }] : []),
    ];

    vermogenData.forEach((d, i) => {
      const x = padding.left + i * (grafiekW / vermogenData.length) + (grafiekW / vermogenData.length - barWidth) / 2;
      let yBase = padding.top + grafiekH;

      for (const seg of segmenten) {
        const waarde = d[seg.key];
        if (waarde <= 0) continue;
        const h = (waarde / maxVermogen) * grafiekH;
        ctx.fillStyle = seg.kleur;
        ctx.fillRect(x, yBase - h, barWidth, h);
        yBase -= h;
      }

      if (i % 5 === 0 || vermogenData.length <= 15) {
        ctx.fillStyle = '#8a8a82';
        ctx.font = '11px Lato, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(d.jaar, x + barWidth / 2, H - padding.bottom + 16);
      }
    });

    const pensioenIdx = vermogenData.findIndex(d => d.jaar === klantPensioenJaar);
    if (pensioenIdx >= 0) {
      const x = padding.left + pensioenIdx * (grafiekW / vermogenData.length) + (grafiekW / vermogenData.length) / 2;
      ctx.strokeStyle = '#2A3933';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 3]);
      ctx.beginPath(); ctx.moveTo(x, padding.top); ctx.lineTo(x, padding.top + grafiekH); ctx.stroke();
      ctx.setLineDash([]);
    }
  }, [vermogenData, klantPensioenJaar, toonOverwaarde]);

  return (
    <div>
      <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#2A3933', marginBottom: '2rem', letterSpacing: '-0.5px', fontFamily: 'Lato, sans-serif' }}>
        Overzicht inkomsten en uitgaven.
      </h2>

      <div style={kaartStijl}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px', marginBottom: '20px' }}>
          <div>
            <label style={labelStijl}>Inflatie meenemen (2,7%)</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {['ja', 'nee'].map(opt => (
                <button key={opt} onClick={() => setInflatie(opt)} style={{ height: '42px', border: '1px solid rgba(42,57,51,0.2)', borderRadius: '100px', fontSize: '14px', fontFamily: 'Lato, sans-serif', fontWeight: inflatie === opt ? '700' : '400', background: inflatie === opt ? '#2A3933' : '#FFFFFF', color: inflatie === opt ? '#FFFFFF' : '#4a4a45', cursor: 'pointer' }}>
                  {opt.charAt(0).toUpperCase() + opt.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: heeftPartner ? '1fr 1fr' : '1fr', gap: '12px' }}>
            <div>
              <label style={labelStijl}>Gewenste pensioendatum {gezin?.klant?.voornaam}</label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input style={{ ...inputStijl, borderRadius: '12px', flex: 1 }} type="date" value={klantPensioenDatum} onChange={e => setKlantPensioenDatum(e.target.value)} />
                <span style={{ fontSize: '12px', color: '#8a8a82', whiteSpace: 'nowrap' }}>AOW: {berekenAowDatum(klantGebDatum, klantAow)}</span>
              </div>
            </div>
            {heeftPartner && (
              <div>
                <label style={labelStijl}>Gewenste pensioendatum {gezin?.partner?.voornaam}</label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input style={{ ...inputStijl, borderRadius: '12px', flex: 1 }} type="date" value={partnerPensioenDatum} onChange={e => setPartnerPensioenDatum(e.target.value)} />
                  <span style={{ fontSize: '12px', color: '#8a8a82', whiteSpace: 'nowrap' }}>AOW: {berekenAowDatum(partnerGebDatum, partnerAow)}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '16px', marginBottom: '12px', flexWrap: 'wrap' }}>
          {[
            { kleur: '#2A3933', label: 'Vrij besteedbaar' },
            { kleur: '#c8e86a', label: 'Veranderende uitgaven' },
            { kleur: '#cc4444', label: 'Benodigd inkomen', lijn: true },
            { kleur: '#2A3933', label: `Pensioen/AOW ${gezin?.klant?.voornaam || ''}`, streep: true },
            ...(heeftPartner ? [{ kleur: '#56705f', label: `Pensioen/AOW ${gezin?.partner?.voornaam || ''}`, streep: true }] : []),
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {item.streep ? <div style={{ width: '2px', height: '12px', background: item.kleur }} />
                : item.lijn ? <div style={{ width: '16px', height: '2px', background: item.kleur }} />
                : <div style={{ width: '12px', height: '12px', borderRadius: '2px', background: item.kleur }} />}
              <span style={{ fontSize: '12px', color: '#8a8a82' }}>{item.label}</span>
            </div>
          ))}
        </div>

        <canvas
          ref={canvasRef}
          width={680}
          height={320}
          style={{ width: '100%', height: 'auto', display: 'block', cursor: 'pointer' }}
          onClick={e => handleCanvasClick(e, canvasRef)}
        />
      </div>

      <div style={kaartStijl}>
        <p style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '0.08em', color: '#2A3933', textTransform: 'uppercase', marginBottom: '14px', margin: '0 0 14px 0' }}>Tekort / overschot per jaar</p>

        <div style={{ display: 'flex', gap: '16px', marginBottom: '12px' }}>
          {[
            { kleur: '#c8e86a', label: 'Overschot' },
            { kleur: '#e05252', label: 'Tekort' },
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '2px', background: item.kleur, border: item.border ? '1px solid #cc4444' : 'none' }} />
              <span style={{ fontSize: '12px', color: '#8a8a82' }}>{item.label}</span>
            </div>
          ))}
        </div>

        <canvas
          ref={canvasTekortRef}
          width={680}
          height={240}
          style={{ width: '100%', height: 'auto', display: 'block', marginBottom: '20px', cursor: 'pointer' }}
          onClick={e => handleCanvasClick(e, canvasTekortRef)}
        />

        {tijdelijkTekort && (
          <div style={{ background: '#f9e9e9', borderRadius: '12px', padding: '14px 16px', marginBottom: '16px' }}>
            <p style={{ fontSize: '13px', color: '#cc4444', margin: 0, fontFamily: 'Lato, sans-serif', lineHeight: 1.5 }}>
              <strong>Let op:</strong> in de jaren {tijdelijkTekort.eersteJaar} tot {tijdelijkTekort.laasteJaar} ontstaat een tijdelijk tekort van maximaal {fmtEuro(tijdelijkTekort.hoogsteTekort)} per maand. Dit tekort verdwijnt later door hogere inkomsten, maar vraagt wel om een oplossing voor de korte termijn.
            </p>
          </div>
        )}

        <div style={{ borderTop: '1px solid rgba(42,57,51,0.08)', paddingTop: '16px' }}>
          <p style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '0.08em', color: '#2A3933', textTransform: 'uppercase', marginBottom: '12px' }}>Totaaloverzicht</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
            {totalen.map(t => (
              <div key={t.fase} style={{ background: '#F7F5F0', borderRadius: '12px', padding: '14px' }}>
                <div style={{ fontSize: '12px', color: '#8a8a82', marginBottom: '4px' }}>{faseNamen[t.fase]}</div>
                <div style={{ fontSize: '16px', fontWeight: '700', color: t.som >= 0 ? '#2A3933' : '#cc4444' }}>{fmtEuro(t.som)}</div>
              </div>
            ))}
            <div style={{ background: '#2A3933', borderRadius: '12px', padding: '14px' }}>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '4px' }}>Totaal</div>
              <div style={{ fontSize: '16px', fontWeight: '700', color: totaalSom >= 0 ? '#c8e86a' : '#e05252' }}>{fmtEuro(totaalSom)}</div>
            </div>
          </div>
        </div>
      </div>

      {vermogenData.length > 0 && (
        <div style={kaartStijl}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
            <div>
              <p style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '0.08em', color: '#2A3933', textTransform: 'uppercase', margin: '0 0 4px 0' }}>Vermogensoverzicht</p>
              <p style={{ fontSize: '12px', color: '#8a8a82', margin: 0, fontFamily: 'Lato, sans-serif' }}>Bedragen op pensioendatum ({klantPensioenJaar})</p>
            </div>
            {(parseFloat(woning?.woningwaarde) || 0) > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                <span style={{ fontSize: '12px', color: '#8a8a82', fontFamily: 'Lato, sans-serif' }}>Overwaarde tonen</span>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {['ja', 'nee'].map(opt => (
                    <button key={opt} onClick={() => setToonOverwaarde(opt)} style={{ height: '30px', padding: '0 12px', border: '1px solid rgba(42,57,51,0.2)', borderRadius: '100px', fontSize: '12px', fontFamily: 'Lato, sans-serif', fontWeight: toonOverwaarde === opt ? '700' : '400', background: toonOverwaarde === opt ? '#2A3933' : '#FFFFFF', color: toonOverwaarde === opt ? '#FFFFFF' : '#4a4a45', cursor: 'pointer' }}>
                      {opt.charAt(0).toUpperCase() + opt.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
            {[
              { label: 'Sparen', kleur: '#2A3933', waarde: vermogenPensioen.sparen },
              { label: 'Beleggen', kleur: '#c8e86a', waarde: vermogenPensioen.beleggen },
              { label: 'Lijfrente', kleur: '#56705f', waarde: vermogenPensioen.lijfrente },
              ...(bv?.bvAanwezig === 'ja' ? [{ label: 'Vermogen BV', kleur: '#a8c94a', waarde: vermogenPensioen.bv }] : []),
              ...(toonOverwaarde === 'ja' && vermogenPensioen.overwaarde > 0 ? [{ label: 'Overwaarde woning', kleur: '#3d5248', waarde: vermogenPensioen.overwaarde }] : []),
            ].filter(item => item.waarde > 0).map((item, i) => (
              <div key={i} style={{ background: '#F7F5F0', borderRadius: '12px', padding: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: item.kleur, flexShrink: 0 }} />
                  <span style={{ fontSize: '12px', color: '#8a8a82' }}>{item.label}</span>
                </div>
                <div style={{ fontSize: '16px', fontWeight: '700', color: '#2A3933' }}>{fmtEuro(item.waarde)}</div>
              </div>
            ))}
            <div style={{ background: '#2A3933', borderRadius: '12px', padding: '14px' }}>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '4px' }}>Totaal vermogen</div>
              <div style={{ fontSize: '16px', fontWeight: '700', color: '#c8e86a' }}>{fmtEuro(toonOverwaarde === 'ja' ? vermogenPensioen.totaal : vermogenPensioen.totaal - vermogenPensioen.overwaarde)}</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '16px', marginBottom: '12px', flexWrap: 'wrap' }}>
            {[
              { kleur: '#2A3933', label: 'Sparen' },
              { kleur: '#c8e86a', label: 'Beleggen' },
              { kleur: '#56705f', label: 'Lijfrente' },
              ...(bv?.bvAanwezig === 'ja' ? [{ kleur: '#a8c94a', label: 'BV' }] : []),
              ...(toonOverwaarde === 'ja' && (parseFloat(woning?.woningwaarde) || 0) > 0 ? [{ kleur: '#3d5248', label: 'Woning' }] : []),
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '2px', background: item.kleur }} />
                <span style={{ fontSize: '12px', color: '#8a8a82' }}>{item.label}</span>
              </div>
            ))}
          </div>

          <canvas
            ref={canvasVermogenRef}
            width={680}
            height={280}
            style={{ width: '100%', height: 'auto', display: 'block', cursor: 'pointer' }}
            onClick={e => {
              const canvas = canvasVermogenRef.current;
              const rect = canvas.getBoundingClientRect();
              const scaleX = canvas.width / rect.width;
              const mouseX = (e.clientX - rect.left) * scaleX;
              const grafiekW = canvas.width - 80 - 20;
              const i = Math.floor((mouseX - 80) / (grafiekW / vermogenData.length));
              if (i >= 0 && i < vermogenData.length) {
                setVermogenTooltip({ d: vermogenData[i] });
              }
            }}
          />
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '8px' }}>
        <button onClick={onVorige} style={{ width: '100%', padding: '14px 28px', fontSize: '15px', fontWeight: '700', background: 'transparent', color: '#2A3933', border: '1px solid rgba(42,57,51,0.2)', borderRadius: '100px', cursor: 'pointer', fontFamily: 'Lato, sans-serif' }}>
          ← Vorige
        </button>
        <button onClick={async () => {
            async function canvasToPng(ref) {
              if (!ref?.current) return null;
              return new Promise(resolve => {
                ref.current.toBlob(blob => {
                  if (blob) blob.arrayBuffer().then(resolve).catch(() => resolve(null));
                  else resolve(null);
                }, 'image/png');
              });
            }
            const [inkomenUitgaven, tekortOverschot, vermogen] = await Promise.all([
              canvasToPng(canvasRef),
              canvasToPng(canvasTekortRef),
              canvasToPng(canvasVermogenRef),
            ]);
            onVolgende({
              pensioengat,
              klantPensioenJaar,
              grafiekData: data.map(d => ({
                jaar: d.jaar,
                inkomen: d.inkomen,
                uitgaven: d.uitgaven,
                benodigdInkomen: d.benodigdInkomen,
                vrijBesteedbaar: d.vrijBesteedbaar,
                verschil: d.verschil,
                ...(d.jaar === huidigJaar || d.jaar === klantPensioenJaar + 1 || d.jaar === klantPensioenJaar ? { detail: d.detail } : {}),
              })),
              grafiekAfbeeldingen: { inkomenUitgaven, tekortOverschot, vermogen },
              vermogenPensioen,
            });
          }} style={{ width: '100%', padding: '14px 28px', fontSize: '15px', fontWeight: '700', background: '#2A3933', color: '#FFFFFF', border: 'none', borderRadius: '100px', cursor: 'pointer', fontFamily: 'Lato, sans-serif' }}>
          Volgende →
        </button>
      </div>

      {vermogenTooltip && (
        <div
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: '#FFFFFF',
            border: '1px solid rgba(42,57,51,0.12)',
            borderRadius: '16px',
            padding: '16px',
            boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
            zIndex: 1000,
            width: '280px',
            fontFamily: 'Lato, sans-serif',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', borderBottom: '1px solid rgba(42,57,51,0.08)', paddingBottom: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: '700', color: '#2A3933' }}>Vermogen {vermogenTooltip.d.jaar}</span>
            <button onClick={() => setVermogenTooltip(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', lineHeight: 1, color: '#8a8a82', padding: '0 0 0 8px' }}>×</button>
          </div>
          {[
            { label: 'Sparen', kleur: '#2A3933', waarde: vermogenTooltip.d.sparen },
            { label: 'Beleggen', kleur: '#c8e86a', waarde: vermogenTooltip.d.beleggen },
            { label: 'Lijfrente', kleur: '#56705f', waarde: vermogenTooltip.d.lijfrente },
            ...(bv?.bvAanwezig === 'ja' ? [{ label: 'BV', kleur: '#a8c94a', waarde: vermogenTooltip.d.bv }] : []),
          ].filter(item => item.waarde > 0).map((item, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', marginBottom: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: item.kleur, flexShrink: 0 }} />
                <span style={{ fontSize: '12px', color: '#8a8a82' }}>{item.label}</span>
              </div>
              <span style={{ fontSize: '12px', fontWeight: '600', color: '#2A3933' }}>{fmtEuro(item.waarde)}</span>
            </div>
          ))}
          {toonOverwaarde === 'ja' && vermogenTooltip.d.overwaarde > 0 && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', marginBottom: '2px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#3d5248', flexShrink: 0 }} />
                  <span style={{ fontSize: '12px', color: '#8a8a82' }}>Overwaarde woning</span>
                </div>
                <span style={{ fontSize: '12px', fontWeight: '600', color: '#2A3933' }}>{fmtEuro(vermogenTooltip.d.overwaarde)}</span>
              </div>
              <div style={{ paddingLeft: '14px', marginBottom: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', marginBottom: '1px' }}>
                  <span style={{ fontSize: '11px', color: '#8a8a82' }}>Woningwaarde</span>
                  <span style={{ fontSize: '11px', color: '#8a8a82' }}>{fmtEuro(vermogenTooltip.d.woningwaardeJaar)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                  <span style={{ fontSize: '11px', color: '#8a8a82' }}>Resterende schuld</span>
                  <span style={{ fontSize: '11px', color: '#8a8a82' }}>- {fmtEuro(vermogenTooltip.d.totaleRestSchuld)}</span>
                </div>
              </div>
            </>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', marginTop: '6px', paddingTop: '6px', borderTop: '1px solid rgba(42,57,51,0.08)' }}>
            <span style={{ fontSize: '12px', fontWeight: '700', color: '#2A3933' }}>Totaal</span>
            <span style={{ fontSize: '12px', fontWeight: '700', color: '#2A3933' }}>{fmtEuro(toonOverwaarde === 'ja' ? vermogenTooltip.d.totaal : vermogenTooltip.d.totaal - vermogenTooltip.d.overwaarde)}</span>
          </div>
        </div>
      )}

      {tooltip && (
        <div
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: '#FFFFFF',
            border: '1px solid rgba(42,57,51,0.12)',
            borderRadius: '16px',
            padding: '16px',
            boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
            zIndex: 1000,
            width: '340px',
            pointerEvents: 'auto',
            fontFamily: 'Lato, sans-serif',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', borderBottom: '1px solid rgba(42,57,51,0.08)', paddingBottom: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: '700', color: '#2A3933' }}>{tooltip.d.jaar}</span>
            <button onClick={() => setTooltip(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', lineHeight: 1, color: '#8a8a82', padding: '0 0 0 8px' }}>×</button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '6px' }}>
            <div style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '0.06em', color: '#8a8a82', textTransform: 'uppercase' }}>Inkomsten</div>
            <div style={{ fontSize: '11px', color: '#8a8a82' }}>Per maand</div>
          </div>
          {[
            // Klant
            tooltip.d.detail.klantArbeid > 0 && { label: `Bruto inkomen ${gezin?.klant?.voornaam || 'klant'}`, waarde: tooltip.d.detail.klantArbeid },
            tooltip.d.detail.klantPrivatePensioen > 0 && { label: `Pensioen ${gezin?.klant?.voornaam || 'klant'}`, waarde: tooltip.d.detail.klantPrivatePensioen },
            tooltip.d.detail.klantAowBedrag > 0 && { label: `AOW ${gezin?.klant?.voornaam || 'klant'}`, waarde: tooltip.d.detail.klantAowBedrag },
            tooltip.d.detail.klantLijfrenteUitkering > 0 && { label: `Lijfrente ${gezin?.klant?.voornaam || 'klant'}`, waarde: tooltip.d.detail.klantLijfrenteUitkering },
            // Partner
            heeftPartner && tooltip.d.detail.partnerArbeid > 0 && { label: `Bruto inkomen ${gezin?.partner?.voornaam || 'partner'}`, waarde: tooltip.d.detail.partnerArbeid },
            heeftPartner && tooltip.d.detail.partnerPrivatePensioen > 0 && { label: `Pensioen ${gezin?.partner?.voornaam || 'partner'}`, waarde: tooltip.d.detail.partnerPrivatePensioen },
            heeftPartner && tooltip.d.detail.partnerAowBedrag > 0 && { label: `AOW ${gezin?.partner?.voornaam || 'partner'}`, waarde: tooltip.d.detail.partnerAowBedrag },
            heeftPartner && tooltip.d.detail.partnerLijfrenteUitkering > 0 && { label: `Lijfrente ${gezin?.partner?.voornaam || 'partner'}`, waarde: tooltip.d.detail.partnerLijfrenteUitkering },
            // Belasting
            (tooltip.d.detail.klantBelasting + tooltip.d.detail.partnerBelasting) > 0 && { label: 'Inkomstenbelasting', waarde: -(tooltip.d.detail.klantBelasting + tooltip.d.detail.partnerBelasting), negatief: true },
            tooltip.d.detail.eigenwoningForfaitBelasting > 0 && { label: 'Eigenwoning forfait', waarde: -tooltip.d.detail.eigenwoningForfaitBelasting, negatief: true },
            tooltip.d.detail.hraVoordeel > 0 && { label: 'Hypotheekrenteaftrek', waarde: tooltip.d.detail.hraVoordeel },
            // Correcties en uitkeringen
            tooltip.d.detail.lijfrenteAftrek > 0 && { label: 'Lijfrente aftrek', waarde: tooltip.d.detail.lijfrenteAftrek },
            tooltip.d.detail.spaarUitkering > 0 && { label: 'Spaaruitkering', waarde: tooltip.d.detail.spaarUitkering },
            // BV
            tooltip.d.detail.bvBrutoDividend > 0 && { label: tooltip.d.jaar < klantPensioenJaar ? 'Dividend BV' : 'Uitkering BV', waarde: tooltip.d.detail.bvBrutoDividend },
            tooltip.d.detail.bvBox2 > 0 && { label: 'Dividendbelasting', waarde: -tooltip.d.detail.bvBox2, negatief: true },
          ].filter(Boolean).map((rij, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', marginBottom: '3px' }}>
              <span style={{ fontSize: '12px', color: '#8a8a82' }}>{rij.label}</span>
              <span style={{ fontSize: '12px', fontWeight: '600', color: rij.negatief ? '#cc4444' : '#2A3933' }}>
                {rij.negatief ? '- ' : ''}{fmtEuro(Math.abs(Math.round(rij.waarde / 12)))}
              </span>
            </div>
          ))}

          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', marginTop: '6px', paddingTop: '6px', borderTop: '1px solid rgba(42,57,51,0.08)', marginBottom: '10px' }}>
            <span style={{ fontSize: '12px', fontWeight: '700', color: '#2A3933' }}>Netto inkomen</span>
            <span style={{ fontSize: '12px', fontWeight: '700', color: '#2A3933' }}>{fmtEuro(tooltip.d.inkomen)}</span>
          </div>

          {(tooltip.d.detail.hypotheeklasten + tooltip.d.detail.lijfrenteInleg + tooltip.d.detail.spaarInleg + tooltip.d.detail.beleggenInleg + tooltip.d.detail.overigeUitgaven + tooltip.d.detail.box3Belasting) > 0 && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '6px' }}>
                <div style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '0.06em', color: '#8a8a82', textTransform: 'uppercase' }}>Uitgaven</div>
                <div style={{ fontSize: '11px', color: '#8a8a82' }}>Per maand</div>
              </div>
              {[
                tooltip.d.detail.hypotheeklasten > 0 && { label: 'Hypotheeklasten', waarde: tooltip.d.detail.hypotheeklasten },
                tooltip.d.detail.lijfrenteInleg > 0 && { label: 'Lijfrente inleg', waarde: tooltip.d.detail.lijfrenteInleg },
                tooltip.d.detail.spaarInleg > 0 && { label: 'Spaar inleg', waarde: tooltip.d.detail.spaarInleg },
                tooltip.d.detail.beleggenInleg > 0 && { label: 'Beleg inleg', waarde: tooltip.d.detail.beleggenInleg },
                tooltip.d.detail.overigeUitgaven > 0 && { label: 'Overige uitgaven', waarde: tooltip.d.detail.overigeUitgaven },
                tooltip.d.detail.box3Belasting > 0 && { label: 'Box 3 belasting', waarde: tooltip.d.detail.box3Belasting },
              ].filter(Boolean).map((rij, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', marginBottom: '3px' }}>
                  <span style={{ fontSize: '12px', color: '#8a8a82' }}>{rij.label}</span>
                  <span style={{ fontSize: '12px', fontWeight: '600', color: '#2A3933' }}>{fmtEuro(Math.round(rij.waarde / 12))}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', marginTop: '6px', paddingTop: '6px', borderTop: '1px solid rgba(42,57,51,0.08)', marginBottom: '10px' }}>
                <span style={{ fontSize: '12px', fontWeight: '700', color: '#2A3933' }}>Totaal uitgaven</span>
                <span style={{ fontSize: '12px', fontWeight: '700', color: '#2A3933' }}>{fmtEuro(tooltip.d.uitgaven)}</span>
              </div>
            </>
          )}

          <div style={{ marginBottom: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', marginBottom: '3px' }}>
              <span style={{ fontSize: '12px', color: '#8a8a82' }}>Vrij besteedbaar</span>
              <span style={{ fontSize: '12px', fontWeight: '600', color: '#2A3933' }}>{fmtEuro(tooltip.d.vrijBesteedbaar)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
              <span style={{ fontSize: '12px', color: '#8a8a82' }}>Benodigd inkomen</span>
              <span style={{ fontSize: '12px', fontWeight: '600', color: '#cc4444' }}>{fmtEuro(tooltip.d.benodigdInkomen)}</span>
            </div>
          </div>
          <div style={{ background: tooltip.d.verschil >= 0 ? '#c8e86a' : '#e05252', borderRadius: '10px', padding: '10px 12px', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', fontWeight: '700', color: '#2A3933' }}>{tooltip.d.verschil >= 0 ? 'Overschot per maand' : 'Tekort per maand'}</span>
            <span style={{ fontSize: '12px', fontWeight: '700', color: tooltip.d.verschil >= 0 ? '#2A3933' : '#cc4444' }}>{fmtEuro(Math.abs(tooltip.d.verschil))}</span>
          </div>
        </div>
      )}
    </div>
  );
}