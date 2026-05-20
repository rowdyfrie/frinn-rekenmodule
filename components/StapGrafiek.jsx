'use client';
import { useState, useEffect, useRef } from 'react';

const inputStijl = { width: '100%', boxSizing: 'border-box', height: '42px', border: '1px solid rgba(42,57,51,0.2)', borderRadius: '100px', padding: '0 16px', fontSize: '14px', fontFamily: 'Lato, sans-serif', color: '#4a4a45', background: '#FFFFFF', outline: 'none' };
const labelStijl = { fontSize: '13px', fontWeight: '300', color: '#8a8a82', display: 'block', marginBottom: '6px', fontFamily: 'Lato, sans-serif' };
const kaartStijl = { background: '#FFFFFF', borderRadius: '20px', padding: '28px', border: '1px solid rgba(42,57,51,0.1)', marginBottom: '12px' };

function berekenAowLeeftijd(geboortedatum) {
  if (!geboortedatum) return { jaren: 67, maanden: 0 };
  const d = new Date(geboortedatum);
  const tabel = [
    { van: '1956-06-01', tot: '1957-02-28', jaren: 66, maanden: 10 },
    { van: '1957-03-01', tot: '1960-12-31', jaren: 67, maanden: 0 },
    { van: '1961-01-01', tot: '1966-09-30', jaren: 67, maanden: 3 },
    { van: '1966-10-01', tot: '1970-06-30', jaren: 67, maanden: 6 },
    { van: '1970-07-01', tot: '1973-03-31', jaren: 67, maanden: 9 },
    { van: '1973-04-01', tot: '1975-12-31', jaren: 68, maanden: 0 },
    { van: '1976-01-01', tot: '1978-09-30', jaren: 68, maanden: 3 },
    { van: '1978-10-01', tot: '1982-06-30', jaren: 68, maanden: 6 },
    { van: '1982-07-01', tot: '1985-03-31', jaren: 68, maanden: 9 },
    { van: '1985-04-01', tot: '1988-12-31', jaren: 69, maanden: 0 },
    { van: '1989-01-01', tot: '1991-09-30', jaren: 69, maanden: 3 },
    { van: '1991-10-01', tot: '1995-06-30', jaren: 69, maanden: 6 },
    { van: '1995-07-01', tot: '1999-03-31', jaren: 69, maanden: 9 },
    { van: '1999-04-01', tot: '2000-12-31', jaren: 70, maanden: 0 },
  ];
  for (const rij of tabel) {
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

function berekenBox1Belasting(bruto, naAow) {
  if (bruto <= 0) return 0;
  const schijven = naAow
    ? [{ grens: 38883, tarief: 0.1785 }, { grens: 78426, tarief: 0.3756 }, { grens: Infinity, tarief: 0.495 }]
    : [{ grens: 38883, tarief: 0.3575 }, { grens: 78426, tarief: 0.3756 }, { grens: Infinity, tarief: 0.495 }];
  let belasting = 0;
  let vorig = 0;
  for (const schijf of schijven) {
    if (bruto <= vorig) break;
    const inSchijf = Math.min(bruto, schijf.grens) - vorig;
    belasting += inSchijf * schijf.tarief;
    vorig = schijf.grens;
  }
  return belasting;
}

function margTarief(bruto, naAow) {
  if (naAow) {
    if (bruto <= 38883) return 0.1785;
    if (bruto <= 78426) return 0.3756;
    return 0.495;
  }
  if (bruto <= 38883) return 0.3575;
  if (bruto <= 78426) return 0.3756;
  return 0.495;
}

function berekenAnnuiteit(waarde, rendementPct, aantalMaanden) {
  if (!waarde || waarde <= 0 || aantalMaanden <= 0) return 0;
  const r = (rendementPct || 4) / 100 / 12;
  if (r === 0) return waarde / aantalMaanden;
  return waarde * (r * Math.pow(1 + r, aantalMaanden)) / (Math.pow(1 + r, aantalMaanden) - 1);
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

export default function StapGrafiek({ gezin, inkomsten, pensioen, uitgaven, onVorige }) {
  const canvasRef = useRef(null);
  const canvasTekortRef = useRef(null);
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

  const klantPensioenJaar = klantPensioenDatum ? new Date(klantPensioenDatum).getFullYear() : klantAowJaar;
  const partnerPensioenJaar = partnerPensioenDatum ? new Date(partnerPensioenDatum).getFullYear() : (heeftPartner ? partnerAowJaar : null);
  const inflatieR = inflatie === 'ja' ? 0.027 : 0;

  const jaren = Array.from({ length: eindJaar - huidigJaar + 1 }, (_, i) => huidigJaar + i);

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

    let klantPensioenInkomen = 0;
    let partnerPensioenInkomen = 0;
    for (const p of (pensioen?.klantPensioenen || [])) {
      const ingangJaar = leeftijdNaarJaar(klantGebDatum, p.jaren || 67, p.maanden || 0);
      if (jaar >= ingangJaar) klantPensioenInkomen += (parseFloat(p.bedrag) || 0);
    }
    for (const p of (pensioen?.partnerPensioenen || [])) {
      const ingangJaar = leeftijdNaarJaar(partnerGebDatum, p.jaren || 67, p.maanden || 0);
      if (jaar >= ingangJaar) partnerPensioenInkomen += (parseFloat(p.bedrag) || 0);
    }

    const aowJarenVerstreken = Math.max(0, jaar - klantAowJaar);
    const aowInflatieFactor = inflatie === 'ja' ? Math.pow(1.027, aowJarenVerstreken) : 1;
    if (jaar >= klantAowJaar) klantPensioenInkomen += (heeftPartner ? (1122.12 + 76.10) * 12 : (1637.57 + 106.55) * 12) * aowInflatieFactor;
    if (heeftPartner && jaar >= partnerAowJaar) {
      const partnerAowJarenVerstreken = Math.max(0, jaar - partnerAowJaar);
      const partnerAowFactor = inflatie === 'ja' ? Math.pow(1.027, partnerAowJarenVerstreken) : 1;
      partnerPensioenInkomen += (1122.12 + 76.10) * 12 * partnerAowFactor;
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
    for (const s of (uitgaven?.spaaren || [])) {
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
    for (const l of (uitgaven?.leningdelen || [])) {
      if (l.hra !== 'ja' || !l.einddatum) continue;
      const einddatum = new Date(l.einddatum);
      if (einddatum.getFullYear() <= jaar) continue;
      const rente = berekenRenteJaar(parseFloat(l.schuld) || 0, parseFloat(l.rente) || 0, l.type, jarenVerstreken, l.einddatum);
      const tarief = Math.min(margTarief(hoogsteInkomen, naAowHoogste), 0.3756);
      hraVoordeel += rente * tarief;
    }

    const klantBruto = klantArbeid + klantPensioenInkomen + klantLijfrenteUitkering;
    const partnerBruto = partnerArbeid + partnerPensioenInkomen + partnerLijfrenteUitkering;
    const klantBelasting = berekenBox1Belasting(klantBruto, naAowKlant);
    const partnerBelasting = heeftPartner ? berekenBox1Belasting(partnerBruto, naAowPartner) : 0;
    const totaalNetto = (klantBruto - klantBelasting) + (partnerBruto - partnerBelasting) + spaarUitkering + hraVoordeel + lijfrenteAftrek;

    let totaalUitgaven = 0;
    for (const l of (uitgaven?.leningdelen || [])) {
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
      totaalUitgaven += maandlast * 12;
    }
    for (const l of (uitgaven?.lijfrentes || [])) {
      const pensioenJaar = l.voor === 'partner' ? partnerPensioenJaar : klantPensioenJaar;
      if (jaar < pensioenJaar) totaalUitgaven += (parseFloat(l.inleg) || 0) * 12;
    }
    for (const s of (uitgaven?.spaaren || [])) {
      if (jaar < klantPensioenJaar) totaalUitgaven += (parseFloat(s.inleg) || 0) * 12;
    }
    for (const o of (uitgaven?.overig || [])) {
      if (!o.einddatum || new Date(o.einddatum).getFullYear() > jaar) {
        totaalUitgaven += (parseFloat(o.bedrag) || 0) * 12;
      }
    }

    return { totaalNetto, totaalUitgaven };
  }

  function berekenBenodigdInkomen(jaar) {
    const jarenVerstreken = jaar - huidigJaar;
    const jaar1 = berekenNettoInkomenJaar(huidigJaar);
    let startBedrag = jaar1.totaalNetto - jaar1.totaalUitgaven;
    for (const l of (uitgaven?.lijfrentes || [])) startBedrag -= (parseFloat(l.inleg) || 0) * 12;
    for (const s of (uitgaven?.spaaren || [])) startBedrag -= (parseFloat(s.inleg) || 0) * 12;
    startBedrag = Math.max(0, startBedrag);
    return Math.max(0, Math.round((startBedrag * Math.pow(1 + inflatieR, jarenVerstreken)) / 12));
  }

  function faseVanJaar(jaar) {
    if (jaar < jongsteAowJaar) return 1;
    return 3;
  }

  const faseNamen = { 1: 'Opbouw', 3: 'Pensioen' };

  const data = jaren.map(j => {
    const { totaalNetto, totaalUitgaven } = berekenNettoInkomenJaar(j);
    const inkomen = Math.max(0, Math.round(totaalNetto / 12));
    const uitgavenMaand = Math.max(0, Math.round(totaalUitgaven / 12));
    const benodigdInkomen = berekenBenodigdInkomen(j);
    const vrijBesteedbaar = Math.max(0, inkomen - uitgavenMaand);
    const verschil = vrijBesteedbaar - benodigdInkomen;
    return { jaar: j, inkomen, uitgaven: uitgavenMaand, benodigdInkomen, vrijBesteedbaar, verschil, fase: faseVanJaar(j) };
  });

  const maxWaarde = Math.max(...data.map(d => Math.max(d.inkomen, d.benodigdInkomen)), 1);
  const maxVerschil = Math.max(...data.map(d => Math.abs(d.verschil)), 1);

  const totalen = [1, 3].map(fase => {
    const faseData = data.filter(d => d.fase === fase);
    const som = faseData.reduce((s, d) => s + d.verschil * 12, 0);
    return { fase, som, aantalJaren: faseData.length };
  });
  const totaalSom = totalen.reduce((s, t) => s + t.som, 0);

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
    ctx.lineWidth = 2;
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
        ctx.fillStyle = '#f9e9e9';
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
            { kleur: '#c8e86a', label: 'Uitgaven' },
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

        <canvas ref={canvasRef} width={680} height={320} style={{ width: '100%', height: 'auto', display: 'block' }} />
      </div>

      <div style={kaartStijl}>
        <p style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '0.08em', color: '#2A3933', textTransform: 'uppercase', marginBottom: '14px', margin: '0 0 14px 0' }}>Tekort / overschot per jaar</p>

        <div style={{ display: 'flex', gap: '16px', marginBottom: '12px' }}>
          {[
            { kleur: '#c8e86a', label: 'Overschot' },
            { kleur: '#f9e9e9', label: 'Tekort', border: true },
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '2px', background: item.kleur, border: item.border ? '1px solid #cc4444' : 'none' }} />
              <span style={{ fontSize: '12px', color: '#8a8a82' }}>{item.label}</span>
            </div>
          ))}
        </div>

        <canvas ref={canvasTekortRef} width={680} height={240} style={{ width: '100%', height: 'auto', display: 'block', marginBottom: '20px' }} />

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
              <div style={{ fontSize: '16px', fontWeight: '700', color: totaalSom >= 0 ? '#c8e86a' : '#f9e9e9' }}>{fmtEuro(totaalSom)}</div>
            </div>
          </div>
        </div>
      </div>

      <button onClick={onVorige} style={{ width: '100%', padding: '14px 28px', fontSize: '15px', fontWeight: '700', background: 'transparent', color: '#2A3933', border: '1px solid rgba(42,57,51,0.2)', borderRadius: '100px', cursor: 'pointer', fontFamily: 'Lato, sans-serif' }}>
        ← Vorige
      </button>
    </div>
  );
}