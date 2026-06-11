import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  WidthType, AlignmentType, BorderStyle, ShadingType, Header, Footer,
  PageNumber, ImageRun, VerticalAlign, TableLayoutType,
  HorizontalPositionRelativeFrom, VerticalPositionRelativeFrom, TextWrappingType,
  LineRuleType,
} from 'docx';

// ── Kleuren ────────────────────────────────────────────────────────
const GROEN       = '2A3933';
const LIMOEN      = 'C8E86A';
const LIMOEN_LICHT = 'EBF5D0';  // lichte accent voor totaalrijen
const ACHTERGROND = 'F7F5F0';
const TEKST       = '2C2C2C';
const ROOD        = 'C0392B';
const GRIJS       = 'E8E4DC';
const WIT         = 'FFFFFF';
const LABEL_KLEUR = '7A8B84';  // gedempte kleur voor labels in contactkaart

// ── Adviseur ───────────────────────────────────────────────────────
const ADVISEUR = {
  naam:     'Rowdy Frie',
  functie:  'Financieel adviseur',
  telefoon: '06-46103079',
  email:    'info@frinn.nl',
  website:  'frinn.nl',
};

// ── Hulpfuncties ───────────────────────────────────────────────────
function fmtEuro(n) {
  const abs = Math.abs(Math.round(n || 0));
  return '€ ' + abs.toLocaleString('nl-NL');
}

function fmtEuroLabel(n) {
  if (n < 0) return fmtEuro(Math.abs(n)) + ' overschot';
  return fmtEuro(n);
}

const MAANDEN_NL = ['januari','februari','maart','april','mei','juni','juli','augustus','september','oktober','november','december'];

function fmtGebDatum(str) {
  if (!str) return '—';
  const d = new Date(str);
  if (isNaN(d)) return str;
  return `${d.getDate()} ${MAANDEN_NL[d.getMonth()]} ${d.getFullYear()}`;
}

function fmtJaar(jaar) {
  return String(jaar || '—');
}

function leegelijn() {
  return new Paragraph({ text: '', spacing: { after: 80 } });
}

function alinea(tekst, opties = {}) {
  return new Paragraph({
    children: [new TextRun({
      text: tekst,
      font: 'Lato',
      size: opties.size || 22,
      color: opties.kleur || TEKST,
      bold: opties.bold || false,
      italics: opties.italics || false,
    })],
    alignment: opties.uitlijning || AlignmentType.LEFT,
    spacing: { after: opties.spaceAfter ?? 120, before: opties.spaceBefore ?? 0 },
  });
}

function sectietitel(tekst, pageBreak = false) {
  return new Paragraph({
    children: [new TextRun({ text: tekst, font: 'Lato', size: 28, bold: true, color: GROEN })],
    spacing: { before: pageBreak ? 0 : 300, after: 160 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: GROEN } },
    pageBreakBefore: pageBreak,
  });
}

function subtitel(tekst, pageBreak = false) {
  return new Paragraph({
    children: [new TextRun({ text: tekst, font: 'Lato', size: 24, bold: true, color: GROEN })],
    spacing: { before: pageBreak ? 0 : 200, after: 120 },
    pageBreakBefore: pageBreak,
  });
}

function tekstRegel(label, waarde, opties = {}) {
  return new Paragraph({
    children: [
      new TextRun({ text: label + ': ', font: 'Lato', size: 22, color: TEKST }),
      new TextRun({ text: waarde, font: 'Lato', size: 22, bold: true, color: opties.kleur || TEKST }),
    ],
    spacing: { after: 80 },
  });
}

// ── Tabel helpers ──────────────────────────────────────────────────
function cel(tekst, { breedte, uitlijning, achtergrond, vetgedrukt, kleur, noBorder, italics, bottomBorder } = {}) {
  const geen = { style: BorderStyle.NONE, size: 0 };
  const borders = (noBorder || bottomBorder) ? {
    top:    geen,
    bottom: bottomBorder ? { style: BorderStyle.SINGLE, size: 4, color: GROEN } : geen,
    left:   geen,
    right:  geen,
  } : undefined;

  return new TableCell({
    children: [new Paragraph({
      children: [new TextRun({
        text: String(tekst ?? ''),
        font: 'Lato',
        size: 20,
        bold: vetgedrukt || false,
        italics: italics || false,
        color: kleur || TEKST,
      })],
      alignment: uitlijning || AlignmentType.LEFT,
      spacing: { after: 0 },
    })],
    width: breedte ? { size: breedte, type: WidthType.DXA } : undefined,
    shading: achtergrond ? { type: ShadingType.CLEAR, color: 'auto', fill: achtergrond } : undefined,
    verticalAlign: VerticalAlign.CENTER,
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    ...(borders ? { borders } : {}),
  });
}

const GEEN_RAND = {
  top:     { style: BorderStyle.NONE, size: 0 },
  bottom:  { style: BorderStyle.NONE, size: 0 },
  left:    { style: BorderStyle.NONE, size: 0 },
  right:   { style: BorderStyle.NONE, size: 0 },
  insideH: { style: BorderStyle.NONE, size: 0 },
  insideV: { style: BorderStyle.NONE, size: 0 },
};

function maakTabel(headers, rijen, breedtes) {
  const headerRij = new TableRow({
    children: headers.map((h, i) => cel(h, {
      breedte: breedtes[i],
      achtergrond: GROEN,
      vetgedrukt: true,
      kleur: WIT,
      uitlijning: i > 0 ? AlignmentType.RIGHT : AlignmentType.LEFT,
    })),
    tableHeader: true,
  });

  const dataRijen = rijen.map((rij, ri) => {
    const isAccent = !!rij._accent;
    return new TableRow({
      children: rij.map((v, ci) => cel(v, {
        breedte: breedtes[ci],
        achtergrond: isAccent ? LIMOEN_LICHT : WIT,
        uitlijning: ci > 0 ? AlignmentType.RIGHT : AlignmentType.LEFT,
        vetgedrukt: isAccent || rij._vet || false,
        kleur: TEKST,
      })),
    });
  });

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    rows: [headerRij, ...dataRijen],
    borders: GEEN_RAND,
  });
}

// Kaartentabel: limoengroene titelbalk + ondersteuning voor _accent, _overspanning, _contactStijl rijen
function maakKaartTabel(titel, rijen, breedtes) {
  const aantalKolommen = breedtes.length;
  const celRand = {
    top: { style: BorderStyle.NONE, size: 0 }, bottom: { style: BorderStyle.NONE, size: 0 },
    left: { style: BorderStyle.NONE, size: 0 }, right: { style: BorderStyle.NONE, size: 0 },
  };

  const titelRij = new TableRow({
    children: [new TableCell({
      children: [new Paragraph({
        children: [new TextRun({ text: titel, font: 'Lato', size: 22, bold: true, color: TEKST })],
        spacing: { after: 0 },
      })],
      columnSpan: aantalKolommen,
      shading: { type: ShadingType.CLEAR, color: 'auto', fill: LIMOEN },
      verticalAlign: VerticalAlign.CENTER,
      margins: { top: 110, bottom: 110, left: 140, right: 140 },
      borders: celRand,
    })],
  });

  const dataRijen = rijen.map((rij, ri) => {
    const isLaatste = ri === rijen.length - 1;
    const geen = { style: BorderStyle.NONE, size: 0 };
    const sluitRand = {
      top: geen, left: geen, right: geen,
      bottom: isLaatste ? { style: BorderStyle.SINGLE, size: 4, color: GROEN } : geen,
    };

    // Volledige breedte rij (bijv. toelichting, fiscale werking)
    if (rij._overspanning) {
      return new TableRow({
        children: [new TableCell({
          children: [new Paragraph({
            children: [new TextRun({
              text: String(rij[0] ?? ''),
              font: 'Lato', size: 19, italics: true, color: LABEL_KLEUR,
            })],
            spacing: { after: 0 },
          })],
          columnSpan: aantalKolommen,
          shading: { type: ShadingType.CLEAR, color: 'auto', fill: GRIJS },
          verticalAlign: VerticalAlign.CENTER,
          margins: { top: 80, bottom: 80, left: 140, right: 140 },
          borders: sluitRand,
        })],
      });
    }

    // Aanbieder naam: volledige breedte, vet, rechts uitgelijnd
    if (rij._aanbiederStijl) {
      return new TableRow({
        children: [new TableCell({
          children: [new Paragraph({
            children: [new TextRun({ text: String(rij[0] ?? ''), font: 'Lato', size: 22, bold: true, color: TEKST })],
            alignment: AlignmentType.LEFT,
            spacing: { after: 0 },
          })],
          columnSpan: aantalKolommen,
          shading: { type: ShadingType.CLEAR, color: 'auto', fill: WIT },
          verticalAlign: VerticalAlign.CENTER,
          margins: { top: 80, bottom: 80, left: 140, right: 140 },
          borders: sluitRand,
        })],
      });
    }

    const isAccent  = !!rij._accent;
    const isContact = !!rij._contactStijl;
    const achtergrond = isAccent ? LIMOEN_LICHT : WIT;

    return new TableRow({
      children: rij.map((v, ci) => cel(v, {
        breedte: breedtes[ci],
        achtergrond,
        uitlijning: ci > 0 ? AlignmentType.RIGHT : AlignmentType.LEFT,
        vetgedrukt: isAccent || (isContact && ci > 0),
        kleur: TEKST,
        noBorder: !isLaatste,
        bottomBorder: isLaatste,
      })),
    });
  });

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    rows: [titelRij, ...dataRijen],
    borders: GEEN_RAND,
  });
}

// Contactkaart: geen header, labels gedempte kleur, waarden vet groen
function maakContactKaart(rijen, breedtes) {
  const dataRijen = rijen.map((rij, ri) =>
    new TableRow({
      children: rij.map((v, ci) => cel(v, {
        breedte: breedtes[ci],
        achtergrond: WIT,
        uitlijning: ci > 0 ? AlignmentType.RIGHT : AlignmentType.LEFT,
        vetgedrukt: ci > 0,
        kleur: TEKST,
      })),
    })
  );

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    rows: dataRijen,
    borders: GEEN_RAND,
  });
}

// ── Horizontale barchart (verschil per jaar) ───────────────────────
function maakGrafiekTabel(grafiekData, pensioenjaar) {
  if (!grafiekData || grafiekData.length === 0) return [];

  const MAX_RIJEN = 30;
  const totaalJaren = grafiekData.length;
  const stap = totaalJaren > MAX_RIJEN ? Math.ceil(totaalJaren / MAX_RIJEN) : 1;
  const gefilterd = grafiekData.filter((_, i) => i % stap === 0 || grafiekData[i].jaar === pensioenjaar);

  const maxAbs = Math.max(...gefilterd.map(d => Math.abs(d.verschil)), 1);
  const BAR_MAX = 4800; // DXA
  const JAAR_W  = 700;
  const VAL_W   = 1100;

  const rijen = gefilterd.map(d => {
    const barBreedte = Math.round((Math.abs(d.verschil) / maxAbs) * BAR_MAX);
    const restBreedte = BAR_MAX - barBreedte;
    const kleur = d.verschil >= 0 ? LIMOEN : ROOD;
    const isPensioenjaar = d.jaar === pensioenjaar;

    return new TableRow({
      children: [
        // Jaar label
        new TableCell({
          children: [new Paragraph({
            children: [new TextRun({
              text: String(d.jaar),
              font: 'Lato',
              size: isPensioenjaar ? 18 : 16,
              bold: isPensioenjaar,
              color: TEKST,
            })],
            spacing: { after: 0 },
          })],
          width: { size: JAAR_W, type: WidthType.DXA },
          verticalAlign: VerticalAlign.CENTER,
          margins: { top: 40, bottom: 40, left: 80, right: 80 },
          borders: {
            top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE },
            left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE },
          },
        }),
        // Bar cel
        new TableCell({
          children: [new Paragraph({ text: '', spacing: { after: 0 } })],
          width: { size: barBreedte || 60, type: WidthType.DXA },
          shading: { type: ShadingType.CLEAR, color: 'auto', fill: kleur },
          borders: {
            top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE },
            left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE },
          },
        }),
        // Lege rest
        new TableCell({
          children: [new Paragraph({ text: '', spacing: { after: 0 } })],
          width: { size: restBreedte || 60, type: WidthType.DXA },
          shading: { type: ShadingType.CLEAR, color: 'auto', fill: ACHTERGROND },
          borders: {
            top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE },
            left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE },
          },
        }),
        // Waarde label
        new TableCell({
          children: [new Paragraph({
            children: [new TextRun({
              text: (d.verschil >= 0 ? '+' : '-') + ' ' + fmtEuro(Math.abs(d.verschil)) + '/mnd',
              font: 'Lato',
              size: 16,
              color: TEKST,
            })],
            alignment: AlignmentType.RIGHT,
            spacing: { after: 0 },
          })],
          width: { size: VAL_W, type: WidthType.DXA },
          verticalAlign: VerticalAlign.CENTER,
          margins: { top: 40, bottom: 40, left: 80, right: 80 },
          borders: {
            top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE },
            left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE },
          },
        }),
      ],
    });
  });

  const grafiekTabel = new Table({
    width: { size: JAAR_W + BAR_MAX + VAL_W, type: WidthType.DXA },
    layout: TableLayoutType.FIXED,
    rows: rijen,
    borders: {
      top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE },
      left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE },
      insideH: { style: BorderStyle.NONE }, insideV: { style: BorderStyle.NONE },
    },
  });

  return [
    alinea('Groen = overschot, rood = tekort (per maand)', { size: 18, kleur: LABEL_KLEUR, italics: true }),
    leegelijn(),
    grafiekTabel,
  ];
}

// ── Sectie 1 — Inleiding ──────────────────────────────────────────
function maakSectie1(d) {
  const naam = d.gezin?.klant?.voornaam || '';
  const heeftPartner = !!d.gezin?.partner;
  const partnerNaam = d.gezin?.partner?.voornaam || '';
  const pensioenjaar = fmtJaar(d.klantPensioenJaar);

  // Bepaal dominante inkomensvorm van de klant
  const klantInkomsten = d.inkomsten?.klantInkomsten || [];
  const hoofdType = ['dga', 'ondernemer', 'loon'].find(t => klantInkomsten.some(i => i.type === t)) || 'loon';

  // Alinea 1: contextblok op basis van inkomensvorm
  let alinea1Tekst;
  if (hoofdType === 'dga') {
    alinea1Tekst =
      `Als DGA bouw je je pensioen niet automatisch op via een werkgever. Jij hebt zelf de regie over wat je opzij zet voor later, via je eigen BV of privé. Dat biedt flexibiliteit, maar vraagt ook om een bewuste keuze. Met je beoogde pensioendatum in ${pensioenjaar} is dit het juiste moment om inzichtelijk te maken waar je staat.`;
  } else if (hoofdType === 'ondernemer') {
    alinea1Tekst =
      `Je werkt als ondernemer en hebt je tot nu toe vooral gefocust op je werk. Pensioen stond daarbij op de achtergrond, iets wat veel ZZP'ers herkennen. Toch is je pensioendatum in ${pensioenjaar} minder ver weg dan het lijkt, en is het goed om nu te weten wat je nog kunt opbouwen.`;
  } else {
    alinea1Tekst =
      `Je werkt als werknemer en bouwt via je werkgever al een deel van je pensioen op. Toch is het verstandig om te weten of dat genoeg is. Met je beoogde pensioendatum in ${pensioenjaar} brengen we in dit rapport in beeld wat je kunt verwachten en wat er eventueel nog nodig is.`;
  }

  // Alinea 2: vaste gesprekstekst
  const alinea2Tekst =
    `Tijdens ons gesprek hebben we stilgestaan bij de vraag: wat heb je straks eigenlijk nodig, en wat staat daar al tegenover? Dit rapport geeft je inzicht in je huidige pensioensituatie en laat zien waar een pensioengat ontstaat tussen wat er binnenkomt en wat je nodig hebt.`;

  // Alinea 3: structuur van het rapport
  const alinea3Tekst =
    `We beginnen met je huidige situatie en inkomen, gevolgd door je pensioendoelstelling. Daarna brengen we het pensioengat in beeld en werken we de oplossingen uit die het beste bij jouw situatie passen. We sluiten af met ons concrete advies en een aantal aandachtspunten die relevant zijn voor jouw situatie.`;

  return [
    sectietitel('Inleiding'),
    ...(naam ? [alinea(`Beste ${heeftPartner && partnerNaam ? `${naam} en ${partnerNaam}` : naam},`, { spaceAfter: 80 })] : []),
    alinea(alinea1Tekst, { spaceAfter: 160 }),
    alinea(alinea2Tekst, { spaceAfter: 160 }),
    alinea(alinea3Tekst, { spaceAfter: 120 }),
  ];
}

// ── Sectie 2 — Jouw pensioendoelstelling ─────────────────────────
function maakSectie2(d) {
  const huidigJaarData = (d.grafiekData || []).find(r => r.jaar < d.klantPensioenJaar) || (d.grafiekData || [])[0] || null;
  const vrijBesteedbaar = huidigJaarData ? Math.round(huidigJaarData.vrijBesteedbaar) : 0;
  const heeftKinderen = (d.gezin?.kinderen || []).length > 0;
  const eerderDanAow = d.klantPensioenJaar < d.klantAowJaar;
  const afb = d.grafiekAfbeeldingen || {};
  const heeftPartner = !!d.gezin?.partner;

  const klantNaam = d.gezin?.klant?.voornaam || 'Klant';
  const partnerNaam = d.gezin?.partner?.voornaam || 'Partner';
  const pensioenjaar = fmtJaar(d.klantPensioenJaar);
  const aowJaar = fmtJaar(d.klantAowJaar);

  // Pensioeninkomen op pensioendatum: gebruik jaar ná pensioendatum voor stabiel jaarinkomen
  const pensioenjaarData =
    (d.grafiekData || []).find(r => r.jaar === d.klantPensioenJaar + 1) ||
    (d.grafiekData || []).find(r => r.jaar === d.klantPensioenJaar);
  const pensioenInkomenMaand = pensioenjaarData ? Math.round(pensioenjaarData.inkomen) : 0;

  // Pensioeninkomsten per categorie — gebruik detail van het eerste volle pensioenjaar
  const pensioenDetail = pensioenjaarData?.detail || {};
  const aowKlant = heeftPartner ? 13466 : 20930; // jaarlijks, altijd tonen
  const klantLijfrente = pensioenDetail.klantLijfrenteUitkering || 0;
  const partnerLijfrente = pensioenDetail.partnerLijfrenteUitkering || 0;
  const spaarBeleggenUitkering = pensioenDetail.spaarUitkering || 0;
  const bvNetto = Math.max(0, (pensioenDetail.bvBrutoDividend || 0) - (pensioenDetail.bvBox2 || 0));

  const rijen = [];

  rijen.push([`AOW ${klantNaam}`, fmtEuro(aowKlant / 12)]);
  for (const p of (d.pensioen?.klantPensioenen || []))
    if (parseFloat(p.bedrag) > 0)
      rijen.push([p.aanbieder || 'Pensioen', fmtEuro(parseFloat(p.bedrag))]);
  if (klantLijfrente > 0)
    rijen.push([`Lijfrente uitkering ${klantNaam}`, fmtEuro(klantLijfrente / 12)]);

  if (heeftPartner) {
    rijen.push([`AOW ${partnerNaam}`, fmtEuro(13466 / 12)]);
    for (const p of (d.pensioen?.partnerPensioenen || []))
      if (parseFloat(p.bedrag) > 0)
        rijen.push([`${p.aanbieder || 'Pensioen'} (${partnerNaam})`, fmtEuro(parseFloat(p.bedrag))]);
    if (partnerLijfrente > 0)
      rijen.push([`Lijfrente uitkering ${partnerNaam}`, fmtEuro(partnerLijfrente / 12)]);
  }

  if (spaarBeleggenUitkering > 0)
    rijen.push(['Uitkering sparen / beleggen', fmtEuro(spaarBeleggenUitkering / 12)]);
  if (bvNetto > 0)
    rijen.push(['Uitkering BV (netto)', fmtEuro(bvNetto / 12)]);

  const totaalRij = ['Totaal pensioeninkomen', fmtEuro(pensioenInkomenMaand)];
  totaalRij._accent = true;
  rijen.push(totaalRij);

  rijen.push(['Gewenste pensioendatum', pensioenjaar]);
  rijen.push(['AOW-leeftijd', aowJaar]);
  if (heeftPartner && d.partnerAowJaar)
    rijen.push([`AOW-leeftijd ${partnerNaam}`, fmtJaar(d.partnerAowJaar)]);

  const blokken = [sectietitel('Jouw pensioendoelstelling', true)];

  // Blok 1 — inleidende tekst
  blokken.push(alinea(
    `Op basis van je huidige situatie gaan we ervan uit dat je stopt met werken in ${pensioenjaar}. ` +
    `Vanaf dat moment valt je inkomen weg en is de vraag: wat komt er dan binnen, en is dat genoeg?`,
    { spaceAfter: 140 }
  ));

  blokken.push(maakTabel(['Doelstelling', 'Waarde'], rijen, [5000, 2600]));
  blokken.push(leegelijn());

  if (eerderDanAow) {
    blokken.push(alinea(
      `Je wilt eerder stoppen met werken dan je AOW-leeftijd van ${aowJaar}. ` +
      `In de periode van je pensioendatum tot aan je AOW ontvang je nog geen AOW-uitkering. ` +
      `Dit heeft invloed op het benodigde kapitaal dat je moet opbouwen.`,
      { spaceAfter: 160 }
    ));
  }

  if (heeftKinderen) {
    blokken.push(subtitel('Extra doelstelling'));
    blokken.push(alinea(
      `Je hebt kinderen. Naast je eigen pensioenplanning is het verstandig om ook na te denken over ` +
      `financiële zekerheid voor je gezin bij overlijden of arbeidsongeschiktheid. ` +
      `Dit onderwerp bespreken we verder in de aandachtspunten.`,
      { spaceAfter: 120 }
    ));
  }

  // Blok 2 — pensioengat of overschot
  if (d.heeftTekort) {
    blokken.push(alinea(
      `Je hebt straks een pensioeninkomen van ${fmtEuro(pensioenInkomenMaand)} per maand. ` +
      `Om je huidige vrij besteedbaar inkomen van ${fmtEuro(vrijBesteedbaar)} per maand aan te houden, ` +
      `heb je op je pensioendatum een extra opgebouwd kapitaal nodig van ${fmtEuro(d.pensioengat)}. ` +
      `In de volgende secties kijken we naar de oplossingen om dit pensioengat te dichten.`,
      { spaceAfter: 160 }
    ));
  } else {
    blokken.push(alinea(
      `Op basis van de berekening heb je op je pensioendatum voldoende inkomen om je huidige vrij besteedbaar inkomen aan te houden. ` +
      `Er is daarmee geen pensioengat. ` +
      `We kijken verderop in dit rapport naar wat er met het overschot mogelijk is.`,
      { spaceAfter: 160 }
    ));
  }

  // Grafiek tekort/overschot per jaar
  if (afb.tekortOverschot) {
    blokken.push(alinea('Groen = overschot, rood = tekort (verschil vrij besteedbaar vs. benodigd inkomen).', { size: 18, kleur: LABEL_KLEUR, italics: true, spaceAfter: 80 }));
    const p = afbeeldingParagraaf(afb.tekortOverschot, 680, 240);
    if (p) blokken.push(p);
  } else {
    blokken.push(...maakGrafiekTabel(d.grafiekData, d.klantPensioenJaar));
  }

  return blokken;
}

// ── Sectie 3 — Jouw situatie ──────────────────────────────────────
function maakSectie3(d) {
  const heeftPartner = !!d.gezin?.partner;
  const heeftWoning = (parseFloat(d.woning?.woningwaarde) || 0) > 0;
  const heeftBV = d.bv?.bvAanwezig === 'ja';
  const huidigJaarData = (d.grafiekData || []).find(r => r.detail) || null;
  const detail = huidigJaarData?.detail || {};
  const afb = d.grafiekAfbeeldingen || {};

  const klantNaam = d.gezin?.klant?.voornaam || 'Klant';
  const partnerNaam = d.gezin?.partner?.voornaam || 'Partner';
  const vrijBesteedbaar = huidigJaarData ? Math.round(huidigJaarData.vrijBesteedbaar) : 0;

  const blokken = [sectietitel('Jouw situatie', true)];

  // ── 3a Inkomen en uitgaven
  blokken.push(subtitel('Inkomen en uitgaven'));
  blokken.push(alinea(
    `Hieronder zie je een overzicht van je huidige inkomen en vaste uitgaven. ` +
    `Je vrij besteedbaar inkomen van ${fmtEuro(vrijBesteedbaar)} per maand vormt het uitgangspunt voor je pensioenplanning. ` +
    `Dit is het bedrag dat we als streefinkomen meenemen voor na je pensionering.`,
    { spaceAfter: 140 }
  ));

  const inkomstenRijen = [];
  if (d.klantBrutoArbeid > 0)
    inkomstenRijen.push([`Bruto arbeidsinkomen ${klantNaam}`, fmtEuro(d.klantBrutoArbeid / 12)]);
  if (heeftPartner && d.partnerBrutoArbeid > 0)
    inkomstenRijen.push([`Bruto arbeidsinkomen ${partnerNaam}`, fmtEuro(d.partnerBrutoArbeid / 12)]);

  const nettoMaand = huidigJaarData ? huidigJaarData.inkomen : 0;
  if (nettoMaand > 0)
    inkomstenRijen.push(['Netto inkomen (gecombineerd)', fmtEuro(nettoMaand)]);

  if ((detail.hypotheeklasten || 0) > 0)
    inkomstenRijen.push(['Hypotheeklasten', fmtEuro(detail.hypotheeklasten / 12)]);
  if ((detail.lijfrenteInleg || 0) > 0)
    inkomstenRijen.push(['Lijfrente inleg', fmtEuro(detail.lijfrenteInleg / 12)]);

  const totaalUitgaven = huidigJaarData ? huidigJaarData.uitgaven : 0;
  if (totaalUitgaven > 0)
    inkomstenRijen.push(['Totaal vaste uitgaven', fmtEuro(totaalUitgaven)]);

  inkomstenRijen.push(['Vrij besteedbaar', fmtEuro(vrijBesteedbaar)]);

  blokken.push(maakTabel(['Omschrijving', 'Per maand'], inkomstenRijen, [5000, 2600]));
  blokken.push(leegelijn());

  if (afb.inkomenUitgaven) {
    blokken.push(alinea('Donkergroen = netto inkomen, limoen = veranderende uitgaven, rode lijn = benodigd inkomen.', { size: 18, kleur: LABEL_KLEUR, italics: true, spaceAfter: 80 }));
    const p = afbeeldingParagraaf(afb.inkomenUitgaven, 680, 320);
    if (p) blokken.push(p);
    blokken.push(leegelijn());
  }

  // ── 3b BV situatie
  if (heeftBV) {
    blokken.push(subtitel('BV-situatie'));
    for (const bvItem of (d.bv?.bvs || [])) {
      blokken.push(alinea(bvItem.naam || 'BV', { bold: true, spaceAfter: 80 }));
      const bvRijen = [];
      if (bvItem.winst) bvRijen.push(['Jaarlijkse winst voor Vpb', fmtEuro(parseFloat(bvItem.winst)) + '/jr']);
      for (const div of (bvItem.dividend || []))
        bvRijen.push(['Jaarlijkse dividenduitkering', fmtEuro(parseFloat(div.bedrag)) + '/jr']);
      for (const v of (bvItem.vermogen || [])) {
        if (v.type === 'spaargeld')
          bvRijen.push([`Spaargeld/beleggingen`, `${fmtEuro(parseFloat(v.waarde) || 0)} (${v.rendement || 0}% rendement)`]);
        if (v.type === 'onroerend_goed')
          bvRijen.push([`Onroerend goed`, `${fmtEuro(parseFloat(v.waarde) || 0)}`]);
      }
      if (bvRijen.length > 0) blokken.push(maakTabel(['Omschrijving', 'Waarde'], bvRijen, [5000, 2600]));
      blokken.push(leegelijn());
    }
  }

  // ── 3c Pensioenopbouw
  blokken.push(subtitel('Pensioenopbouw'));

  const heeftKlantPensioenOpbouw = (d.pensioen?.klantPensioenen || []).some(p => parseFloat(p.bedrag) > 0);
  const heeftPartnerPensioenOpbouw = heeftPartner && (d.pensioen?.partnerPensioenen || []).some(p => parseFloat(p.bedrag) > 0);

  if (heeftKlantPensioenOpbouw || heeftPartnerPensioenOpbouw) {
    blokken.push(alinea(
      `Dit is wat je tot nu toe hebt opgebouwd via eerdere dienstverbanden of regelingen. ` +
      `Deze bedragen komen bovenop je AOW en vormen samen je startpunt voor de pensioenberekening.`,
      { spaceAfter: 140 }
    ));
  } else {
    blokken.push(alinea(
      `Buiten je AOW heb je op dit moment nog geen pensioen opgebouwd via een werkgever of eerdere regeling. ` +
      `Je AOW vormt daarmee het enige vaste inkomen vanaf je pensioendatum.`,
      { spaceAfter: 140 }
    ));
  }

  function maakPensioenBlok(naam, pensioenen, aowBedrag, lijfrenteBedrag, aowJaar) {
    const rijen = [];
    rijen.push([`AOW ${naam} (${fmtJaar(aowJaar)})`, fmtEuro(aowBedrag / 12), fmtJaar(aowJaar)]);
    for (const p of pensioenen) {
      rijen.push([
        p.aanbieder || 'Pensioen',
        fmtEuro(parseFloat(p.bedrag) || 0),
        `leeftijd ${p.jaren || ''}`,
      ]);
    }
    if (lijfrenteBedrag > 0)
      rijen.push(['Lijfrente uitkering (schatting)', fmtEuro(lijfrenteBedrag / 12), '—']);
    const totaal = (aowBedrag / 12) + pensioenen.reduce((s, p) => s + (parseFloat(p.bedrag) || 0), 0) + lijfrenteBedrag / 12;
    rijen.push(['Totaal pensioeninkomen', fmtEuro(totaal), '']);
    return rijen;
  }

  const aowKlant = d.klantBrutoArbeid > 0 ? (heeftPartner ? 13466 : 20930) : 0;
  const klantLijfrente = (detail.klantLijfrenteUitkering || 0);
  const klantPensioenRijen = maakPensioenBlok(
    klantNaam, d.pensioen?.klantPensioenen || [], aowKlant, klantLijfrente, d.klantAowJaar
  );
  blokken.push(alinea(klantNaam, { bold: true, spaceAfter: 80 }));
  blokken.push(maakTabel(['Omschrijving', 'Per maand', 'Vanaf'], klantPensioenRijen, [3500, 1800, 2300]));
  blokken.push(leegelijn());

  if (heeftPartner) {
    const aowPartner = 13466;
    const partnerLijfrente = (detail.partnerLijfrenteUitkering || 0);
    const partnerPensioenRijen = maakPensioenBlok(
      partnerNaam, d.pensioen?.partnerPensioenen || [], aowPartner, partnerLijfrente, d.partnerAowJaar
    );
    blokken.push(alinea(partnerNaam, { bold: true, spaceAfter: 80 }));
    blokken.push(maakTabel(['Omschrijving', 'Per maand', 'Vanaf'], partnerPensioenRijen, [3500, 1800, 2300]));
    blokken.push(leegelijn());
  }

  // ── 3d Vermogen en bezittingen
  const sparenTotaal  = (d.uitgaven?.sparen    || []).reduce((s, x) => s + (parseFloat(x.waarde) || 0), 0);
  const beleggenTotaal = (d.uitgaven?.beleggen  || []).reduce((s, x) => s + (parseFloat(x.waarde) || 0), 0);
  const lijfrenteTotaal = (d.uitgaven?.lijfrentes || []).reduce((s, x) => s + (parseFloat(x.waarde) || 0), 0);
  const woningwaarde   = parseFloat(d.woning?.woningwaarde) || 0;
  const hypotheekschuld = (d.woning?.leningdelen || []).reduce((s, l) => s + (parseFloat(l.schuld) || 0), 0);
  const overwaarde     = Math.max(0, woningwaarde - hypotheekschuld);

  const beschikbaarPosten = [];
  if (sparenTotaal   > 0) beschikbaarPosten.push(`spaargeld van ${fmtEuro(sparenTotaal)}`);
  if (beleggenTotaal > 0) beschikbaarPosten.push(`beleggingen van ${fmtEuro(beleggenTotaal)}`);
  if (lijfrenteTotaal > 0) beschikbaarPosten.push(`een lopende lijfrente van ${fmtEuro(lijfrenteTotaal)}`);

  const heeftVermogen = beschikbaarPosten.length > 0 || (heeftWoning && overwaarde > 0);

  if (heeftVermogen) {
    blokken.push(subtitel('Vermogen en bezittingen'));

    function lijstJoinen(items) {
      if (items.length <= 1) return items[0] || '';
      return items.slice(0, -1).join(', ') + ' en ' + items[items.length - 1];
    }

    const zinnen = [];
    if (beschikbaarPosten.length > 0) {
      zinnen.push(
        `Naast je pensioenopbouw heb je op dit moment ${lijstJoinen(beschikbaarPosten)} beschikbaar. ` +
        `Dit kapitaal kan worden ingezet als onderdeel van je pensioenoplossing en komt verderop in dit rapport terug.`
      );
    }
    if (heeftWoning && overwaarde > 0) {
      zinnen.push(
        `Je hebt daarnaast een overwaarde op je woning van ${fmtEuro(overwaarde)}. ` +
        `Dit vermogen is op dit moment niet liquide beschikbaar voor je pensioenopbouw en laten we daarom buiten de berekening.`
      );
    }
    blokken.push(alinea(zinnen.join(' '), { spaceAfter: 140 }));

    const spaaarRijen = (d.uitgaven?.sparen || []).map((s, i) => [
      `Spaarrekening ${i + 1}`,
      fmtEuro(parseFloat(s.waarde) || 0),
      fmtEuro(parseFloat(s.inleg) || 0),
      `${s.rendement || 0}%`,
    ]);
    const beleggenRijen = (d.uitgaven?.beleggen || []).map((b, i) => [
      `Beleggingsrekening ${i + 1}`,
      fmtEuro(parseFloat(b.waarde) || 0),
      fmtEuro(parseFloat(b.inleg) || 0),
      `${b.rendement || 0}%`,
    ]);
    const lijfrenteRijen = (d.uitgaven?.lijfrentes || []).map((l, i) => [
      `Lijfrente ${i + 1} (${l.voor === 'partner' ? partnerNaam : klantNaam})`,
      fmtEuro(parseFloat(l.waarde) || 0),
      fmtEuro(parseFloat(l.inleg) || 0),
      `${l.rendement || 0}%`,
    ]);

    const allVermogenRijen = [...spaaarRijen, ...beleggenRijen, ...lijfrenteRijen];
    if (allVermogenRijen.length > 0) {
      blokken.push(maakTabel(
        ['Omschrijving', 'Huidige waarde', 'Inleg', 'Rendement'],
        allVermogenRijen,
        [3200, 1800, 1500, 1100]
      ));
      blokken.push(leegelijn());
    }

    if (heeftWoning) {
      blokken.push(maakTabel(
        ['Woning', 'Bedrag'],
        [
          ['Marktwaarde woning', fmtEuro(woningwaarde)],
          ['Hypotheekschuld', fmtEuro(hypotheekschuld)],
          ['Overwaarde', fmtEuro(overwaarde)],
        ],
        [5000, 2600]
      ));
    }
  }

  return blokken;
}

// ── Sectie 4 — Het pensioengat ────────────────────────────────────
function maakSectie4(d) {
  const huidigJaarData = (d.grafiekData || []).find(r => r.jaar < d.klantPensioenJaar) || (d.grafiekData || [])[0] || null;
  const vrijBesteedbaar = huidigJaarData ? Math.round(huidigJaarData.vrijBesteedbaar) : 0;
  const afb = d.grafiekAfbeeldingen || {};
  const pensioenjaar = fmtJaar(d.klantPensioenJaar);

  const blokken = [sectietitel('Het pensioengat', true)];

  if (d.heeftTekort) {
    blokken.push(alinea(
      `Om je vrij besteedbaar inkomen van ${fmtEuro(vrijBesteedbaar)} per maand aan te houden vanaf ${pensioenjaar}, ` +
      `heb je op je pensioendatum een extra opgebouwd kapitaal nodig van ${fmtEuro(d.pensioengat)}. ` +
      `Dit is het pensioengat dat we met de oplossingen in dit rapport willen dichten.`,
      { spaceAfter: 200 }
    ));
  } else {
    blokken.push(alinea(
      `Op basis van je huidige pensioenopbouw heb je vanaf ${pensioenjaar} een overschot. ` +
      `Je verwachte pensioeninkomen is voldoende om je vrij besteedbaar inkomen van ` +
      `${fmtEuro(vrijBesteedbaar)} per maand aan te houden. ` +
      `In de volgende sectie kijken we hoe je dit overschot optimaal kunt benutten.`,
      { spaceAfter: 200 }
    ));
  }

  // Vermogensopbouw grafiek
  if (afb.vermogen) {
    blokken.push(subtitel('Vermogensopbouw'));

    // Categoriekaarten op pensioendatum (zelfde indeling als grafiekstap tool)
    const vp = d.vermogenPensioen;
    if (vp) {
      const heeftBvVermogen = (d.bv?.bvAanwezig === 'ja') && (vp.bv > 0);
      const vermogenRijen = [
        ...(vp.sparen    > 0 ? [['Sparen',           fmtEuro(vp.sparen)]]    : []),
        ...(vp.beleggen  > 0 ? [['Beleggen',          fmtEuro(vp.beleggen)]]  : []),
        ...(vp.lijfrente > 0 ? [['Lijfrente',          fmtEuro(vp.lijfrente)]] : []),
        ...(heeftBvVermogen  ? [['Vermogen BV',        fmtEuro(vp.bv)]]        : []),
        ...(vp.overwaarde > 0 ? [['Overwaarde woning', fmtEuro(vp.overwaarde)]] : []),
      ];
      if (vermogenRijen.length > 0) {
        const totaalRij = ['Totaal vermogen op pensioendatum', fmtEuro(vp.totaal)];
        totaalRij._accent = true;
        vermogenRijen.push(totaalRij);
        blokken.push(maakTabel(['Categorie', 'Waarde'], vermogenRijen, [5000, 2600]));
        blokken.push(leegelijn());
      }
    }

    blokken.push(alinea('Vermogensontwikkeling per categorie (sparen, beleggen, lijfrente, BV, overwaarde woning).', { size: 18, kleur: LABEL_KLEUR, italics: true, spaceAfter: 80 }));
    const p = afbeeldingParagraaf(afb.vermogen, 680, 280);
    if (p) blokken.push(p);
  }

  return blokken;
}

// ── Sectie 5 — Mogelijke oplossingen ──────────────────────────────
function maakSectie5(d) {
  const naam = d.gezin?.klant?.voornaam || '';

  const blokken = [sectietitel('Mogelijke oplossingen', true)];

  const volgorde = Object.entries(d.oplOrder || {})
    .sort((a, b) => a[1] - b[1])
    .map(([k]) => k)
    .filter(k => d.oplossingen?.[k] != null);

  const namenMap = {
    sparen: 'Sparen',
    beleggen: 'Beleggen',
    lijfrenteKlant: `Lijfrente beleggen ${d.gezin?.klant?.voornaam || ''}`,
    lijfrentePartner: `Lijfrente beleggen ${d.gezin?.partner?.voornaam || ''}`,
    bv: 'Vermogen opbouwen in BV',
  };

  const introTeksten = {
    lijfrenteKlant:   'Met lijfrente beleggen leg je maandelijks in en profiteer je direct van belastingteruggaaf via de jaarruimte. Het vermogen is niet vrij opneembaar, maar groeit fiscaal voordelig aan tot je pensioendatum.',
    lijfrentePartner: 'Met lijfrente beleggen leg je maandelijks in en profiteer je direct van belastingteruggaaf via de jaarruimte. Het vermogen is niet vrij opneembaar, maar groeit fiscaal voordelig aan tot je pensioendatum.',
    bv:               'Beleggen vanuit je BV betekent dat je vermogen opbouwt binnen je eigen vennootschap. Dit biedt flexibiliteit via dividenduitkeringen en voorkomt dat je vermogen in box 3 valt.',
    beleggen:         'Vrij beleggen in box 3 geeft je volledige flexibiliteit over je vermogen. Het nadeel is dat je jaarlijks box 3 belasting betaalt over het opgebouwde vermogen, wat het rendement drukt ten opzichte van de andere oplossingen.',
    sparen:           'Sparen geeft zekerheid en volledige flexibiliteit, maar levert op de lange termijn minder op dan beleggen door het lagere verwachte rendement. Het is geschikt als aanvulling voor wie minder risico wil nemen.',
  };

  // Blok 1 — Inleidende tekst
  const aantalTekst = volgorde.length === 1 ? 'één oplossing' : `${volgorde.length} oplossingen`;
  blokken.push(alinea(
    `Op basis van je situatie hebben we ${aantalTekst} uitgewerkt om het pensioengat te dichten. ` +
    `De oplossingen zijn gerangschikt van meest naar minst fiscaal voordelig.`,
    { spaceAfter: 160 }
  ));

  // Blok 2 — Per oplossing
  for (const sleutel of volgorde) {
    const opl = d.oplossingen[sleutel];
    if (!opl) continue;

    // Onderdeel A — Inleidende tekst per type
    const introTekst = introTeksten[sleutel];
    if (introTekst) blokken.push(alinea(introTekst, { spaceAfter: 120 }));

    // Onderdeel B — Tabel
    const kaartRijen = [];

    if (opl.fiscaleWerking) {
      const r = [opl.fiscaleWerking]; r._overspanning = true;
      kaartRijen.push(r);
    }

    kaartRijen.push(['Verwacht rendement', `${opl.rendement}%`]);

    if (sleutel === 'lijfrenteKlant' || sleutel === 'lijfrentePartner') {
      kaartRijen.push(['Bruto maandinleg', fmtEuro(opl.maandbedrag)]);
      kaartRijen.push(['Belastingvoordeel inleg', `${opl.belastingvoordeel}%`]);
      kaartRijen.push(['Netto maandinleg', fmtEuro(opl.nettoMaandbedrag)]);
      kaartRijen.push(['Bruto eindkapitaal', fmtEuro(opl.eindvermogenBruto)]);
      kaartRijen.push([`Box 1 tarief uitkering`, `${opl.uitkeringstarief}%`]);
      if (opl.jaarruimte) kaartRijen.push(['Jaarruimte', fmtEuro(opl.jaarruimte) + '/jr']);
      const r = ['Netto eindkapitaal', fmtEuro(opl.eindvermogen)]; r._accent = true;
      kaartRijen.push(r);
    } else if (sleutel === 'bv') {
      kaartRijen.push(['Bruto maandinleg', fmtEuro(opl.maandbedrag)]);
      kaartRijen.push(['Vpb (19%)', fmtEuro(opl.brutoBedrag - opl.nettoNaVpb) + '/jr']);
      kaartRijen.push(['Netto na Vpb', fmtEuro(opl.nettoNaVpb) + '/jr']);
      const r = ['Eindkapitaal (voor box 2)', fmtEuro(opl.eindvermogen)]; r._accent = true;
      kaartRijen.push(r);
    } else {
      kaartRijen.push(['Maandinleg', fmtEuro(opl.maandbedrag)]);
      kaartRijen.push(['Netto rendement (na box 3)', `${opl.nettoRendement?.toFixed(2)}%`]);
      const r = ['Eindkapitaal op pensioendatum', fmtEuro(opl.eindvermogen)]; r._accent = true;
      kaartRijen.push(r);
    }

    blokken.push(maakKaartTabel(namenMap[sleutel] || sleutel, kaartRijen, [5000, 2600]));

    // Onderdeel C — Aanbiedertekst (alleen als aanbieder is ingevuld)
    if (opl.aanbieder) {
      blokken.push(alinea(opl.aanbieder, { bold: true, spaceAfter: 40 }));
      if (opl.aanbiederToelichting)
        blokken.push(alinea(opl.aanbiederToelichting, { italics: true, spaceAfter: 120 }));
    }

    blokken.push(leegelijn());
  }

  // Blok 3 — Totaaloverzicht
  if (volgorde.length > 0) {
    blokken.push(subtitel('Totaaloverzicht oplossingen'));
    blokken.push(alinea(
      `Onderstaand zie je wat de gekozen oplossingen samen opleveren op je pensioendatum en in hoeverre het pensioengat hiermee gedicht wordt.`,
      { spaceAfter: 120 }
    ));

    const totaalRijen = volgorde.map(k => {
      const opl = d.oplossingen[k];
      return [namenMap[k] || k, fmtEuro(opl.eindvermogen)];
    });
    const totaalRij = ['Totaal opgebouwd kapitaal', fmtEuro(d.oplTotaalEindvermogen)];
    totaalRij._accent = true;
    totaalRijen.push(totaalRij);
    if (d.oplResterendTekort > 0)
      totaalRijen.push(['Resterend tekort', fmtEuro(d.oplResterendTekort)]);

    blokken.push(maakTabel(['Oplossing', 'Eindkapitaal'], totaalRijen, [5000, 2600]));
    blokken.push(alinea(
      `Met de bovenstaande oplossingen wordt ${d.oplOpgelostPct}% van het benodigde kapitaal opgebouwd.`,
      { spaceAfter: 120 }
    ));
  }

  return blokken;
}

// ── Sectie 6 — Ons advies ─────────────────────────────────────────
function maakSectie6(d) {
  const naam = d.gezin?.klant?.voornaam || '';
  const horizon = Math.max(1, d.klantPensioenJaar - new Date().getFullYear());

  const volgorde = Object.entries(d.oplOrder || {})
    .sort((a, b) => a[1] - b[1])
    .map(([k]) => k)
    .filter(k => d.oplossingen?.[k] != null);

  const blokken = [sectietitel('Ons advies', true)];

  // Blok 1 — Inleidende tekst
  blokken.push(alinea(
    `Op basis van je situatie en de uitgewerkte oplossingen komen we tot het volgende advies. ` +
    `We lichten hieronder toe waarom deze keuze het beste bij je situatie past.`,
    { spaceAfter: 200 }
  ));

  // Blok 2 — Motivatietekst per oplossingstype
  const heeftLijfrente = volgorde.includes('lijfrenteKlant') || volgorde.includes('lijfrentePartner');

  if (heeftLijfrente)
    blokken.push(alinea(
      `Lijfrente beleggen is fiscaal de meest voordelige route omdat je direct profiteert van belastingteruggaaf op je inleg via de jaarruimte. ` +
      `Het vermogen staat wel geblokkeerd tot je pensioendatum, maar daar staat een aanzienlijk fiscaal voordeel tegenover. ` +
      `Met een opbouwperiode van ${horizon} jaar profiteer je bovendien maximaal van samengesteld rendement, wat het verschil met sparen alleen maar groter maakt. ` +
      `De inleg is flexibel: je bent niet verplicht om maandelijks hetzelfde bedrag in te leggen en kunt dit aanpassen als je situatie wijzigt.`,
      { spaceAfter: 160 }
    ));

  if (volgorde.includes('bv'))
    blokken.push(alinea(
      `Beleggen vanuit je BV voorkomt box 3 belasting en sluit aan bij je situatie als DGA. ` +
      `Vermogen dat binnen de BV blijft renderen wordt pas belast op het moment van uitkering via dividend, wat fiscaal gunstig uitpakt over een langere periode. ` +
      `Met een opbouwperiode van ${horizon} jaar geeft dit de tijd om het vermogen substantieel te laten groeien. ` +
      `Je bent niet verplicht om een vast bedrag in te leggen en kunt de inleg aanpassen aan de resultaten van je bedrijf.`,
      { spaceAfter: 160 }
    ));

  if (volgorde.includes('beleggen'))
    blokken.push(alinea(
      `Vrij beleggen geeft je de volledige flexibiliteit om je vermogen op te nemen wanneer dat nodig is. ` +
      `Het nadeel is dat je jaarlijks box 3 belasting betaalt over het opgebouwde vermogen, wat het rendement drukt ten opzichte van de andere oplossingen. ` +
      `Over een langere opbouwperiode van ${horizon} jaar weegt het verwachte rendement van beleggen echter nog altijd ruimschoots op tegen sparen. ` +
      `Je bent niet verplicht om maandelijks in te leggen en kunt de inleg op ieder moment aanpassen.`,
      { spaceAfter: 160 }
    ));

  if (volgorde.includes('sparen'))
    blokken.push(alinea(
      `Sparen geeft zekerheid en volledige flexibiliteit over je vermogen. ` +
      `Het verwachte rendement ligt lager dan bij beleggen, waardoor sparen over een langere opbouwperiode minder kapitaal oplevert. ` +
      `Het is daarom het meest geschikt als risicoloze aanvulling op de andere oplossingen. ` +
      `Ook hier ben je niet verplicht om maandelijks een vast bedrag in te leggen.`,
      { spaceAfter: 160 }
    ));

  if (volgorde.length > 1)
    blokken.push(alinea(
      `De combinatie van deze oplossingen zorgt voor een evenwicht tussen fiscaal voordeel en flexibiliteit.`,
      { spaceAfter: 200 }
    ));

  // Blok 3 — Resterend tekort (alleen als pensioengat niet volledig gedicht)
  if (d.oplResterendTekort > 0)
    blokken.push(alinea(
      `Met de gekozen oplossingen wordt een groot deel van het pensioengat gedicht. ` +
      `Er resteert nog een tekort van ${fmtEuro(d.oplResterendTekort)}. ` +
      `We bespreken dit samen en bekijken of bijsturing mogelijk is, bijvoorbeeld door de inleg te verhogen of de planning aan te passen.`,
      { spaceAfter: 200 }
    ));

  return blokken;
}

// ── Sectie 7 — Aandachtspunten ───────────────────────────────────
function maakSectie7(d) {
  const klantInkomsten = d.inkomsten?.klantInkomsten || [];
  const hoofdType = ['dga', 'ondernemer', 'loon'].find(t => klantInkomsten.some(i => i.type === t)) || 'loon';
  const isWerknemer = hoofdType === 'loon';
  const isZzpOfDga  = hoofdType === 'ondernemer' || hoofdType === 'dga';

  const blokken = [sectietitel('Aandachtspunten', true)];

  // Inleidende tekst
  blokken.push(alinea(
    `Naast je pensioenplanning zijn er een aantal onderwerpen die we in dit gesprek niet volledig hebben uitgewerkt, ` +
    `maar die wel relevant zijn voor jouw financiële situatie. We lichten ze hieronder kort toe.`,
    { spaceAfter: 160 }
  ));

  const aandachtspunten = [
    {
      titel: 'Arbeidsongeschiktheid',
      tekst: isWerknemer
        ? `Als werknemer ben je via je werkgever verzekerd via de WIA. De uitkering kan lager zijn dan je huidige inkomen. Controleer of je werkgever een aanvullende verzekering aanbiedt en of dit voldoende is voor jouw situatie.`
        : hoofdType === 'ondernemer'
          ? `Als ZZP'er ben je niet automatisch verzekerd bij arbeidsongeschiktheid. Je bent zelf verantwoordelijk voor een voorziening. Een arbeidsongeschiktheidsverzekering kan je inkomen beschermen als je tijdelijk of langdurig niet kunt werken.`
          : `Als DGA ben je niet automatisch verzekerd via de WIA. Je kunt jezelf verzekeren via een arbeidsongeschiktheidsverzekering of een voorziening treffen vanuit je BV. Controleer of je huidige dekking voldoende is.`,
    },
    {
      titel: 'Werkloosheid',
      tekst: isWerknemer
        ? `Als werknemer heb je bij ontslag recht op een WW-uitkering. De duur en hoogte zijn afhankelijk van je arbeidsverleden. Controleer of dit voldoende is als buffer en of een aanvullende voorziening gewenst is.`
        : `Als ${hoofdType === 'ondernemer' ? "ZZP'er" : 'DGA'} heb je geen recht op een WW-uitkering bij het wegvallen van je inkomen. Het is daarom belangrijk om een voldoende buffer aan te houden voor het geval je tijdelijk zonder inkomen zit.`,
    },
    {
      titel: 'Overlijden',
      tekst: isWerknemer
        ? `Via je pensioenfonds heb je mogelijk een nabestaandenpensioen opgebouwd. Controleer of dit voldoende is voor je partner en eventuele kinderen. Een aanvullende overlijdensrisicoverzekering kan het verschil maken.`
        : `Als ${hoofdType === 'ondernemer' ? "ZZP'er" : 'DGA'} bouw je vaak geen nabestaandenpensioen op via een pensioenfonds. Controleer of je partner en eventuele kinderen voldoende beschermd zijn bij overlijden. Een overlijdensrisicoverzekering kan hier uitkomst bieden.`,
    },
    {
      titel: 'Scheiding',
      tekst: `Bij een scheiding worden pensioenrechten in veel gevallen gedeeld op basis van de Wet verevening pensioenrechten bij scheiding. Dit kan grote gevolgen hebben voor je pensioenopbouw. Laat je hierover tijdig adviseren als je situatie verandert.`,
    },
  ];

  for (const ap of aandachtspunten) {
    blokken.push(alinea(ap.titel, { bold: true, spaceAfter: 60 }));
    blokken.push(alinea(ap.tekst, { spaceAfter: 160 }));
  }

  // Slottekst
  blokken.push(alinea(
    `Heb je vragen over een van deze onderwerpen? Bespreek ze gerust met ons. ` +
    `Je situatie verandert door de jaren heen en daarom plannen we periodiek een moment in ` +
    `om je pensioenplanning opnieuw te bekijken en waar nodig bij te stellen.`,
    { spaceAfter: 120 }
  ));

  return blokken;
}

// ── Sectie 8 — Disclaimer ─────────────────────────────────────────
function maakDisclaimer() {
  return [
    sectietitel('Disclaimer'),
    alinea(
      'Deze rapportage is een momentopname van jouw financiële situatie en is zorgvuldig opgesteld door Frinn op basis van door jou aangeleverde gegevens.',
      { size: 20, kleur: LABEL_KLEUR, spaceAfter: 120 }
    ),
    alinea(
      'Jouw situatie kan in de toekomst wijzigen door veranderingen in je leven, zoals ander werk, verhuizen, kinderen of scheiding, en door wijzigingen in wet- en regelgeving of ontwikkelingen in de markt zoals rente, inflatie en belastingtarieven. De gehanteerde rendementen zijn aannames en geen garanties. Aan deze rapportage kunnen dan ook geen rechten worden ontleend.',
      { size: 20, kleur: LABEL_KLEUR, spaceAfter: 0 }
    ),
  ];
}

// ── Header en footer ───────────────────────────────────────────────
function maakHeader() {
  return new Header({ children: [new Paragraph({ text: '' })] });
}

function maakFooter(klantNamen = '') {
  return new Footer({
    children: [
      new Paragraph({
        children: [
          new TextRun({ text: 'Frinn', font: 'Lato', size: 18, color: GROEN }),
          new TextRun({ text: '\t', font: 'Lato', size: 18 }),
          new TextRun({ text: klantNamen, font: 'Lato', size: 18, color: GROEN }),
          new TextRun({ text: '\t', font: 'Lato', size: 18 }),
          new TextRun({ children: [PageNumber.CURRENT], font: 'Lato', size: 18, color: GROEN }),
        ],
        tabStops: [
          { type: 'center', position: 4513 },
          { type: 'right', position: 9026 },
        ],
        spacing: { before: 0 },
      }),
    ],
  });
}

// ── Canvas-afbeelding als ImageRun op paginabreedte ───────────────
// canvasBreedtePx / canvasHoogtePx = originele canvas afmetingen
// doelBreedtePt = gewenste breedte in punten in het document (default ~440pt ≈ pagina vol)
// Volledige tekstbreedte A4 met 1-inch marges: (11906 - 2×1440) DXA / 1440 * 100 DPI ≈ 626 px
const VOLLEDIGE_BREEDTE = 626;

function afbeeldingRun(data, canvasBreedtePx, canvasHoogtePx, doelBreedte = VOLLEDIGE_BREEDTE) {
  if (!data) return null;
  const ratio = canvasHoogtePx / canvasBreedtePx;
  return new ImageRun({
    data,
    type: 'png',
    transformation: { width: doelBreedte, height: Math.round(doelBreedte * ratio) },
  });
}

function afbeeldingParagraaf(data, canvasBreedtePx, canvasHoogtePx) {
  const run = afbeeldingRun(data, canvasBreedtePx, canvasHoogtePx);
  if (!run) return null;
  return new Paragraph({ children: [run], spacing: { after: 160 } });
}

// ── SVG naar PNG converteren via Canvas (browser-side) ────────────
async function svgNaarPng(svgText, breedte, hoogte) {
  return new Promise((resolve) => {
    try {
      const blob = new Blob([svgText], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = breedte;
        canvas.height = hoogte;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, breedte, hoogte);
        URL.revokeObjectURL(url);
        canvas.toBlob(b => {
          if (b) b.arrayBuffer().then(resolve).catch(() => resolve(null));
          else resolve(null);
        }, 'image/png');
      };
      img.onerror = () => { URL.revokeObjectURL(url); resolve(null); };
      img.src = url;
    } catch {
      resolve(null);
    }
  });
}

// ── Cover afbeelding laden en verduisteren via Canvas ─────────────
async function coverAfbeeldingLaden(overlayAlpha = 0.4) {
  return new Promise(async (resolve) => {
    try {
      const resp = await fetch('/cover.jpg');
      if (!resp.ok) { resolve(null); return; }
      const blob = await resp.blob();
      const objectUrl = URL.createObjectURL(blob);
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        ctx.fillStyle = `rgba(0,0,0,${overlayAlpha})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(objectUrl);
        canvas.toBlob(b => {
          if (b) b.arrayBuffer().then(resolve).catch(() => resolve(null));
          else resolve(null);
        }, 'image/jpeg', 0.9);
      };
      img.onerror = () => { URL.revokeObjectURL(objectUrl); resolve(null); };
      img.src = objectUrl;
    } catch { resolve(null); }
  });
}

// ── Voorpagina sectie ──────────────────────────────────────────────
function maakVoorpaginaSection(d, coverData, logoData) {
  const klantNaam  = [d.gezin?.klant?.voornaam,   d.gezin?.klant?.achternaam].filter(Boolean).join(' ');
  const partnerNaam = d.gezin?.partner
    ? [d.gezin.partner.voornaam, d.gezin.partner.achternaam].filter(Boolean).join(' ')
    : null;
  const namenRegel = partnerNaam ? `${klantNaam} & ${partnerNaam}` : klantNaam;
  const datum = new Date().toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' });

  const children = [];

  const enkelvoud = { line: 240, lineRule: LineRuleType.AUTO };

  // Achtergrondafbeelding: volledige pagina, achter tekst, verduisterd
  if (coverData) {
    children.push(new Paragraph({
      children: [new ImageRun({
        data: coverData,
        type: 'jpeg',
        transformation: { width: 827, height: 1169 },
        floating: {
          horizontalPosition: { relative: HorizontalPositionRelativeFrom.PAGE, offset: 0 },
          verticalPosition:   { relative: VerticalPositionRelativeFrom.PAGE,   offset: 0 },
          behindDocument: true,
          allowOverlap: true,
          wrap: { type: TextWrappingType.NONE },
        },
      })],
      spacing: { after: 0, ...enkelvoud },
    }));
  }

  // Verticale ruimte — titel op ~55% van de pagina
  children.push(new Paragraph({ text: '', spacing: { before: 5800, after: 0, ...enkelvoud } }));

  // Titel
  children.push(new Paragraph({
    children: [new TextRun({ text: 'Pensioen planning', font: 'Lato', size: 96, bold: true, color: WIT })],
    alignment: AlignmentType.CENTER,
    spacing: { after: 240, ...enkelvoud },
  }));

  // Naam klant(en)
  if (namenRegel) {
    children.push(new Paragraph({
      children: [new TextRun({ text: namenRegel, font: 'Lato', size: 56, color: WIT })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 0, ...enkelvoud },
    }));
  }

  // Ruimte naar onderkant pagina, daarna logo links en datum rechts
  children.push(new Paragraph({ text: '', spacing: { before: 3900, after: 0, ...enkelvoud } }));

  // Logo links, datum rechts — paragraph met tab stop (geen tabel = geen rand)
  children.push(new Paragraph({
    children: [
      ...(logoData
        ? [new ImageRun({ data: logoData, transformation: { width: 100, height: 69 }, type: 'png' })]
        : [new TextRun({ text: 'Frinn', font: 'Lato', size: 20, bold: true, color: WIT })]),
      new TextRun({ text: '\t', font: 'Lato', size: 20 }),
      new TextRun({ text: datum, font: 'Lato', size: 20, color: WIT }),
    ],
    tabStops: [{ type: 'right', position: 9026 }],
    spacing: { after: 0, ...enkelvoud },
  }));

  return {
    properties: {
      page: {
        size: { width: 11906, height: 16838 },
        margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 },
      },
    },
    headers: { default: new Header({ children: [new Paragraph({ text: '' })] }) },
    footers: { default: new Footer({ children: [new Paragraph({ text: '' })] }) },
    children,
  };
}

// ── Hoofdfunctie ───────────────────────────────────────────────────
export async function generateRapport(exportData) {
  let logoData = null;
  try {
    const resp = await fetch('/logo_frinn_kleur.svg');
    if (resp.ok) {
      const svgText = await resp.text();
      logoData = await svgNaarPng(svgText, 200, 137); // 319×219 → schaal naar 200×137
    }
  } catch {}

  let coverData = null;
  try { coverData = await coverAfbeeldingLaden(0.4); } catch {}

  const klantNamen = [
    [exportData.gezin?.klant?.voornaam, exportData.gezin?.klant?.achternaam].filter(Boolean).join(' '),
    exportData.gezin?.partner
      ? [exportData.gezin.partner.voornaam, exportData.gezin.partner.achternaam].filter(Boolean).join(' ')
      : '',
  ].filter(Boolean).join(' & ');

  const header = maakHeader();
  const footer = maakFooter(klantNamen);

  const secties = [
    ...maakSectie1(exportData),   // 1. Inleiding
    ...maakSectie3(exportData),   // 2. Jouw situatie
    ...maakSectie2(exportData),   // 3. Jouw pensioendoelstelling
    ...maakSectie4(exportData),   // 4. Het pensioengat
    ...maakSectie5(exportData),   // 5. Mogelijke oplossingen
    ...maakSectie6(exportData),   // 6. Ons advies
    ...maakSectie7(exportData),   // 7. Aandachtspunten
    ...maakDisclaimer(),          // 8. Disclaimer
  ];

  const doc = new Document({
    background: { color: ACHTERGROND },
    styles: {
      default: {
        document: {
          run: { font: 'Lato', size: 22, color: TEKST },
          paragraph: { spacing: { line: 276, lineRule: LineRuleType.AUTO } },
        },
      },
    },
    sections: [
      maakVoorpaginaSection(exportData, coverData, logoData),
      {
        properties: {
          page: {
            size: { width: 11906, height: 16838 },
            margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 },
          },
        },
        headers: { default: header },
        footers: { default: footer },
        children: secties,
      },
    ],
  });

  return Packer.toBlob(doc);
}
