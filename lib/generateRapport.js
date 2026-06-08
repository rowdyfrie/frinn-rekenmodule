import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  WidthType, AlignmentType, BorderStyle, ShadingType, Header, Footer,
  PageNumber, ImageRun, VerticalAlign, TableLayoutType,
} from 'docx';

// ── Kleuren ────────────────────────────────────────────────────────
const GROEN      = '1B4D3E';
const LIMOEN     = 'A8C94A';
const ACHTERGROND = 'F9F6F0';
const TEKST      = '2C2C2C';
const ROOD       = 'C0392B';
const GRIJS      = 'E8E4DC';
const WIT        = 'FFFFFF';

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

function sectietitel(tekst) {
  return new Paragraph({
    children: [new TextRun({ text: tekst, font: 'Lato', size: 28, bold: true, color: GROEN })],
    spacing: { before: 300, after: 160 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: LIMOEN } },
  });
}

function subtitel(tekst) {
  return new Paragraph({
    children: [new TextRun({ text: tekst, font: 'Lato', size: 24, bold: true, color: GROEN })],
    spacing: { before: 200, after: 120 },
  });
}

function tekstRegel(label, waarde, opties = {}) {
  return new Paragraph({
    children: [
      new TextRun({ text: label + ': ', font: 'Lato', size: 22, color: TEKST }),
      new TextRun({ text: waarde, font: 'Lato', size: 22, bold: true, color: opties.kleur || GROEN }),
    ],
    spacing: { after: 80 },
  });
}

// ── Tabel helpers ──────────────────────────────────────────────────
function cel(tekst, { breedte, uitlijning, achtergrond, vetgedrukt, kleur, noBorder } = {}) {
  const borders = noBorder ? {
    top:    { style: BorderStyle.NONE, size: 0 },
    bottom: { style: BorderStyle.NONE, size: 0 },
    left:   { style: BorderStyle.NONE, size: 0 },
    right:  { style: BorderStyle.NONE, size: 0 },
  } : undefined;

  return new TableCell({
    children: [new Paragraph({
      children: [new TextRun({
        text: String(tekst ?? ''),
        font: 'Lato',
        size: 20,
        bold: vetgedrukt || false,
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

  const dataRijen = rijen.map((rij, ri) =>
    new TableRow({
      children: rij.map((v, ci) => cel(v, {
        breedte: breedtes[ci],
        achtergrond: ri % 2 === 0 ? WIT : GRIJS,
        uitlijning: ci > 0 ? AlignmentType.RIGHT : AlignmentType.LEFT,
        vetgedrukt: rij._vet || false,
      })),
    })
  );

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    rows: [headerRij, ...dataRijen],
    borders: {
      top:           { style: BorderStyle.NONE },
      bottom:        { style: BorderStyle.NONE },
      left:          { style: BorderStyle.NONE },
      right:         { style: BorderStyle.NONE },
      insideH:       { style: BorderStyle.NONE },
      insideV:       { style: BorderStyle.NONE },
    },
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
              color: isPensioenjaar ? GROEN : TEKST,
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
              color: d.verschil >= 0 ? GROEN : ROOD,
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
    alinea('Groen = overschot, rood = tekort (per maand)', { size: 18, kleur: '888888', italics: true }),
    leegelijn(),
    grafiekTabel,
  ];
}

// ── Sectie 1 — Samenvatting ────────────────────────────────────────
function maakSectie1(d) {
  const huidigJaarData = (d.grafiekData || []).find(r => r.detail) || null;
  const nettoMaand = huidigJaarData ? Math.round(huidigJaarData.inkomen) : Math.round(d.klantBrutoArbeid / 12 * 0.75);
  const vrijBesteedbaar = huidigJaarData ? Math.round(huidigJaarData.vrijBesteedbaar) : nettoMaand;
  const heeftPartner = !!d.gezin?.partner;
  const naam = d.gezin?.klant?.voornaam || 'je';

  const tabelRijen = [
    ['Vrij besteedbaar inkomen nu', fmtEuro(vrijBesteedbaar) + '/mnd'],
    ['Pensioendatum', fmtJaar(d.klantPensioenJaar)],
    ['Pensioentekort / overschot', fmtEuroLabel(d.pensioengat)],
  ];

  return [
    sectietitel('Samenvatting'),
    alinea(
      `Fijn dat je de tijd neemt om samen met ons naar jouw financiële toekomst te kijken. ` +
      `In dit rapport vind je een overzicht van jouw huidige situatie, wat er speelt richting jouw pensioen ` +
      `en welke stappen wij adviseren. We bespreken dit rapport samen, gebruik het gerust als leidraad tijdens ons gesprek.`,
      { spaceAfter: 160 }
    ),
    maakTabel(
      ['Overzicht', 'Bedrag / jaar'],
      tabelRijen,
      [5000, 2600]
    ),
    leegelijn(),
    alinea(
      `In dit rapport kijken we samen naar de mogelijke oplossingen en adviseren we wat het beste bij jouw situatie past.`,
      { spaceAfter: 120 }
    ),
    alinea(
      `Heb je naar aanleiding van dit rapport vragen? Neem gerust contact met ons op.`,
      { spaceAfter: 160 }
    ),
    maakTabel(
      ['Jouw adviseur', ''],
      [
        ['Naam',        ADVISEUR.naam],
        ['Functie',     ADVISEUR.functie],
        ['Telefoon',    ADVISEUR.telefoon],
        ['E-mail',      ADVISEUR.email],
        ['Website',     ADVISEUR.website],
      ],
      [3000, 4600]
    ),
  ];
}

// ── Sectie 2 — Jouw doelstelling ──────────────────────────────────
function maakSectie2(d) {
  const huidigJaarData = (d.grafiekData || []).find(r => r.detail) || null;
  const vrijBesteedbaar = huidigJaarData ? Math.round(huidigJaarData.vrijBesteedbaar) : 0;
  const heeftKinderen = (d.gezin?.kinderen || []).length > 0;
  const eerderDanAow = d.klantPensioenJaar < d.klantAowJaar;

  const rijen = [
    ['Vrij besteedbaar inkomen (maand)', fmtEuro(vrijBesteedbaar) + '/mnd'],
    ['Gewenste pensioendatum', fmtJaar(d.klantPensioenJaar)],
    ['AOW-leeftijd', fmtJaar(d.klantAowJaar)],
  ];
  if (d.gezin?.partner && d.partnerAowJaar) {
    rijen.push([`AOW-leeftijd ${d.gezin.partner.voornaam}`, fmtJaar(d.partnerAowJaar)]);
  }

  const blokken = [
    sectietitel('Jouw doelstelling'),
    alinea(
      `Jouw huidige vrij besteedbaar inkomen van ${fmtEuro(vrijBesteedbaar)} per maand vormt het uitgangspunt voor de pensioenplanning. ` +
      `Doel is om dit bedrag ook na jouw pensioendatum te kunnen aanhouden.`,
      { spaceAfter: 160 }
    ),
    maakTabel(['Doelstelling', 'Waarde'], rijen, [5000, 2600]),
    leegelijn(),
  ];

  if (eerderDanAow) {
    blokken.push(alinea(
      `Je wilt eerder stoppen met werken dan jouw AOW-leeftijd van ${d.klantAowJaar}. ` +
      `In de periode van jouw pensioendatum tot aan jouw AOW ontvang je nog geen AOW-uitkering. ` +
      `Dit heeft invloed op het benodigde kapitaal dat je moet opbouwen.`,
      { spaceAfter: 160 }
    ));
  }

  if (heeftKinderen) {
    blokken.push(subtitel('Extra doelstelling'));
    blokken.push(alinea(
      `Je hebt kinderen. Naast jouw eigen pensioenplanning is het verstandig om ook na te denken over ` +
      `financiële zekerheid voor jouw gezin bij overlijden of arbeidsongeschiktheid. ` +
      `Dit onderwerp bespreken we verder in sectie 7.`,
      { spaceAfter: 120 }
    ));
  }

  return blokken;
}

// ── Sectie 3 — Jouw huidige situatie ──────────────────────────────
function maakSectie3(d) {
  const heeftPartner = !!d.gezin?.partner;
  const heeftWoning = (parseFloat(d.woning?.woningwaarde) || 0) > 0;
  const heeftBV = d.bv?.bvAanwezig === 'ja';
  const huidigJaarData = (d.grafiekData || []).find(r => r.detail) || null;
  const detail = huidigJaarData?.detail || {};

  const klantNaam = d.gezin?.klant?.voornaam || 'Klant';
  const partnerNaam = d.gezin?.partner?.voornaam || 'Partner';

  const blokken = [sectietitel('Jouw huidige situatie')];

  // ── 3a Inkomen en uitgaven
  blokken.push(subtitel('Inkomen en uitgaven'));

  const inkomstenRijen = [];
  if (d.klantBrutoArbeid > 0)
    inkomstenRijen.push([`Bruto arbeidsinkomen ${klantNaam}`, fmtEuro(d.klantBrutoArbeid / 12) + '/mnd']);
  if (heeftPartner && d.partnerBrutoArbeid > 0)
    inkomstenRijen.push([`Bruto arbeidsinkomen ${partnerNaam}`, fmtEuro(d.partnerBrutoArbeid / 12) + '/mnd']);

  const nettoMaand = huidigJaarData ? huidigJaarData.inkomen : 0;
  if (nettoMaand > 0)
    inkomstenRijen.push(['Netto inkomen (gecombineerd)', fmtEuro(nettoMaand) + '/mnd']);

  if ((detail.hypotheeklasten || 0) > 0)
    inkomstenRijen.push(['Hypotheeklasten', fmtEuro(detail.hypotheeklasten / 12) + '/mnd']);
  if ((detail.lijfrenteInleg || 0) > 0)
    inkomstenRijen.push(['Lijfrente inleg', fmtEuro(detail.lijfrenteInleg / 12) + '/mnd']);

  const totaalUitgaven = huidigJaarData ? huidigJaarData.uitgaven : 0;
  if (totaalUitgaven > 0)
    inkomstenRijen.push(['Totaal vaste uitgaven', fmtEuro(totaalUitgaven) + '/mnd']);

  const vrijBesteedbaar = huidigJaarData ? huidigJaarData.vrijBesteedbaar : 0;
  inkomstenRijen.push(['Vrij besteedbaar', fmtEuro(vrijBesteedbaar) + '/mnd']);

  blokken.push(maakTabel(['Omschrijving', 'Per maand'], inkomstenRijen, [5000, 2600]));
  blokken.push(leegelijn());

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

  function maakPensioenBlok(naam, pensioenen, aowBedrag, lijfrenteBedrag, aowJaar) {
    const rijen = [];
    rijen.push([`AOW ${naam} (${fmtJaar(aowJaar)})`, fmtEuro(aowBedrag / 12) + '/mnd', fmtJaar(aowJaar)]);
    for (const p of pensioenen) {
      rijen.push([
        p.aanbieder || 'Pensioen',
        fmtEuro(parseFloat(p.bedrag) || 0) + '/mnd',
        `leeftijd ${p.jaren || ''}`,
      ]);
    }
    if (lijfrenteBedrag > 0)
      rijen.push(['Lijfrente uitkering (schatting)', fmtEuro(lijfrenteBedrag / 12) + '/mnd', '—']);
    const totaal = (aowBedrag / 12) + pensioenen.reduce((s, p) => s + (parseFloat(p.bedrag) || 0), 0) + lijfrenteBedrag / 12;
    rijen.push(['Totaal pensioeninkomen', fmtEuro(totaal) + '/mnd', '']);
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
  blokken.push(subtitel('Vermogen en bezittingen'));

  const spaaarRijen = (d.uitgaven?.sparen || []).map((s, i) => [
    `Spaarrekening ${i + 1}`,
    fmtEuro(parseFloat(s.waarde) || 0),
    fmtEuro(parseFloat(s.inleg) || 0) + '/mnd',
    `${s.rendement || 0}%`,
  ]);
  const beleggenRijen = (d.uitgaven?.beleggen || []).map((b, i) => [
    `Beleggingsrekening ${i + 1}`,
    fmtEuro(parseFloat(b.waarde) || 0),
    fmtEuro(parseFloat(b.inleg) || 0) + '/mnd',
    `${b.rendement || 0}%`,
  ]);
  const lijfrenteRijen = (d.uitgaven?.lijfrentes || []).map((l, i) => [
    `Lijfrente ${i + 1} (${l.voor === 'partner' ? partnerNaam : klantNaam})`,
    fmtEuro(parseFloat(l.waarde) || 0),
    fmtEuro(parseFloat(l.inleg) || 0) + '/mnd',
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
    const woningwaarde = parseFloat(d.woning?.woningwaarde) || 0;
    const hypotheekschuld = (d.woning?.leningdelen || []).reduce((s, l) => s + (parseFloat(l.schuld) || 0), 0);
    const overwaarde = Math.max(0, woningwaarde - hypotheekschuld);
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

  return blokken;
}

// ── Sectie 4 — Pensioentekort of overschot ────────────────────────
function maakSectie4(d) {
  const huidigJaarData = (d.grafiekData || []).find(r => r.detail) || null;
  const vrijBesteedbaar = huidigJaarData ? Math.round(huidigJaarData.vrijBesteedbaar) : 0;
  const afb = d.grafiekAfbeeldingen || {};

  const blokken = [sectietitel(d.heeftTekort ? 'Jouw pensioentekort' : 'Jouw pensioonoverschot')];

  if (d.heeftTekort) {
    blokken.push(alinea(
      `Om jouw vrij besteedbaar inkomen van ${fmtEuro(vrijBesteedbaar)} per maand aan te houden ` +
      `vanaf ${d.klantPensioenJaar} tot ${d.eindJaarBerekening} heb je op jouw pensioendatum ` +
      `een extra opgebouwd kapitaal nodig van ${fmtEuro(d.pensioengat)}. ` +
      `In de volgende sectie kijken we naar de mogelijke oplossingen om dit kapitaal op te bouwen.`,
      { spaceAfter: 200 }
    ));
  } else {
    blokken.push(alinea(
      `Op basis van jouw huidige pensioenopbouw heb je vanaf ${d.klantPensioenJaar} een overschot. ` +
      `Jouw verwachte pensioeninkomen is voldoende om jouw vrij besteedbaar inkomen van ` +
      `${fmtEuro(Math.abs(vrijBesteedbaar))} per maand aan te houden. ` +
      `In de volgende sectie kijken we hoe je dit overschot optimaal kunt benutten.`,
      { spaceAfter: 200 }
    ));
  }

  // Inkomen en uitgaven grafiek
  if (afb.inkomenUitgaven) {
    blokken.push(subtitel('Inkomsten en uitgaven per jaar'));
    blokken.push(alinea('Donkergroen = netto inkomen, limoen = vaste uitgaven, rode lijn = benodigd inkomen.', { size: 18, kleur: '888888', italics: true, spaceAfter: 80 }));
    const p = afbeeldingParagraaf(afb.inkomenUitgaven, 680, 320);
    if (p) blokken.push(p);
  }

  // Tekort / overschot grafiek
  if (afb.tekortOverschot) {
    blokken.push(subtitel('Tekort en overschot per jaar'));
    blokken.push(alinea('Groen = overschot, rood = tekort (verschil vrij besteedbaar vs. benodigd inkomen).', { size: 18, kleur: '888888', italics: true, spaceAfter: 80 }));
    const p = afbeeldingParagraaf(afb.tekortOverschot, 680, 240);
    if (p) blokken.push(p);
  } else {
    // Fallback: tabelgrafiek als canvas niet beschikbaar is
    blokken.push(subtitel('Overschot en tekort per jaar'));
    blokken.push(...maakGrafiekTabel(d.grafiekData, d.klantPensioenJaar));
  }

  // Vermogensopbouw grafiek
  if (afb.vermogen) {
    blokken.push(subtitel('Vermogensopbouw'));
    blokken.push(alinea('Vermogensontwikkeling per categorie (sparen, beleggen, lijfrente, BV, overwaarde woning).', { size: 18, kleur: '888888', italics: true, spaceAfter: 80 }));
    const p = afbeeldingParagraaf(afb.vermogen, 680, 280);
    if (p) blokken.push(p);
  }

  return blokken;
}

// ── Sectie 5 — Mogelijke oplossingen ──────────────────────────────
function maakSectie5(d) {
  const blokken = [sectietitel('Mogelijke oplossingen')];

  blokken.push(alinea(
    `Op basis van jouw situatie hebben we de volgende oplossingen uitgewerkt. ` +
    `De oplossingen zijn gerangschikt van meest naar minst fiscaal voordelig, ` +
    `rekening houdend met het benodigde netto maandbedrag.`,
    { spaceAfter: 160 }
  ));

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

  for (const sleutel of volgorde) {
    const opl = d.oplossingen[sleutel];
    if (!opl) continue;

    blokken.push(subtitel(namenMap[sleutel] || sleutel));
    blokken.push(alinea(opl.fiscaleWerking, { italics: true, spaceAfter: 120 }));

    const rijen = [
      ['Verwacht rendement', `${opl.rendement}%`],
    ];

    if (sleutel === 'lijfrenteKlant' || sleutel === 'lijfrentePartner') {
      rijen.push(['Bruto maandinleg', fmtEuro(opl.maandbedrag) + '/mnd']);
      rijen.push(['Belastingvoordeel inleg', `${opl.belastingvoordeel}%`]);
      rijen.push(['Netto maandinleg', fmtEuro(opl.nettoMaandbedrag) + '/mnd']);
      rijen.push(['Bruto eindkapitaal', fmtEuro(opl.eindvermogenBruto)]);
      rijen.push([`Box 1 tarief uitkering`, `${opl.uitkeringstarief}%`]);
      rijen.push(['Netto eindkapitaal op pensioendatum', fmtEuro(opl.eindvermogen)]);
      if (opl.jaarruimte) rijen.push(['Jaarruimte', fmtEuro(opl.jaarruimte) + '/jr']);
    } else if (sleutel === 'bv') {
      rijen.push(['Bruto maandinleg', fmtEuro(opl.maandbedrag) + '/mnd']);
      rijen.push(['Vpb (19%)', fmtEuro(opl.brutoBedrag - opl.nettoNaVpb) + '/jr']);
      rijen.push(['Netto na Vpb', fmtEuro(opl.nettoNaVpb) + '/jr']);
      rijen.push(['Eindkapitaal (voor box 2)', fmtEuro(opl.eindvermogen)]);
    } else {
      rijen.push(['Maandinleg', fmtEuro(opl.maandbedrag) + '/mnd']);
      rijen.push(['Netto rendement (na box 3)', `${opl.nettoRendement?.toFixed(2)}%`]);
      rijen.push(['Eindkapitaal op pensioendatum', fmtEuro(opl.eindvermogen)]);
    }

    blokken.push(maakTabel(['Omschrijving', 'Waarde'], rijen, [5000, 2600]));
    blokken.push(leegelijn());
  }

  // Totaaloverzicht
  if (volgorde.length > 0) {
    blokken.push(subtitel('Totaaloverzicht oplossingen'));
    const totaalRijen = volgorde
      .map(k => {
        const opl = d.oplossingen[k];
        return [namenMap[k] || k, fmtEuro(opl.eindvermogen)];
      });
    totaalRijen.push(['Totaal opgebouwd kapitaal', fmtEuro(d.oplTotaalEindvermogen)]);
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
  const blokken = [sectietitel('Ons advies')];

  blokken.push(alinea(
    `Op basis van de mogelijke oplossingen stellen we hieronder de aanpak voor die het beste past bij jouw situatie. ` +
    `Dit kan één oplossing zijn of een combinatie van meerdere opties.`,
    { spaceAfter: 160 }
  ));

  const volgorde = Object.entries(d.oplOrder || {})
    .sort((a, b) => a[1] - b[1])
    .map(([k]) => k)
    .filter(k => d.oplossingen?.[k] != null);

  const namenMap = {
    sparen: 'Sparen',
    beleggen: 'Beleggen',
    lijfrenteKlant: `Lijfrente ${d.gezin?.klant?.voornaam || ''}`,
    lijfrentePartner: `Lijfrente ${d.gezin?.partner?.voornaam || ''}`,
    bv: 'Vermogen in BV',
  };

  let totaalNettoMaand = 0;

  for (const sleutel of volgorde) {
    const opl = d.oplossingen[sleutel];
    if (!opl) continue;

    blokken.push(subtitel(namenMap[sleutel] || sleutel));

    const aanbiederRijen = [
      ['Aanbieder', '[Naam aanbieder]'],
      ['Toelichting', '[Toelichting aanbieder]'],
    ];

    if (sleutel === 'lijfrenteKlant' || sleutel === 'lijfrentePartner') {
      aanbiederRijen.push(['Bruto maandinleg', fmtEuro(opl.maandbedrag) + '/mnd']);
      aanbiederRijen.push(['Netto maandinleg', fmtEuro(opl.nettoMaandbedrag) + '/mnd']);
      aanbiederRijen.push(['Fiscaal voordeel inleg', `${opl.belastingvoordeel}%`]);
      aanbiederRijen.push(['Eindkapitaal (netto)', fmtEuro(opl.eindvermogen)]);
      totaalNettoMaand += opl.nettoMaandbedrag || 0;
    } else if (sleutel === 'bv') {
      aanbiederRijen.push(['Bruto maandinleg', fmtEuro(opl.maandbedrag) + '/mnd']);
      aanbiederRijen.push(['Netto na Vpb', fmtEuro(opl.nettoNaVpb / 12) + '/mnd']);
      aanbiederRijen.push(['Eindkapitaal (voor box 2)', fmtEuro(opl.eindvermogen)]);
      totaalNettoMaand += (opl.nettoNaVpb / 12) || 0;
    } else {
      aanbiederRijen.push(['Maandinleg', fmtEuro(opl.maandbedrag) + '/mnd']);
      aanbiederRijen.push(['Eindkapitaal', fmtEuro(opl.eindvermogen)]);
      totaalNettoMaand += opl.maandbedrag || 0;
    }

    blokken.push(maakTabel(['Omschrijving', 'Waarde'], aanbiederRijen, [5000, 2600]));
    blokken.push(leegelijn());
  }

  if (totaalNettoMaand > 0) {
    blokken.push(alinea(
      `Totale netto maandinleg voor alle geadviseerde oplossingen: ${fmtEuro(totaalNettoMaand)}/mnd.`,
      { bold: true, spaceAfter: 160 }
    ));
  }

  // Motivatie bouwstenen
  blokken.push(subtitel('Motivatie advies'));
  blokken.push(alinea('[Verwijder de bouwstenen die niet van toepassing zijn]', { italics: true, kleur: '888888', spaceAfter: 120 }));

  const bouwstenen = [
    { label: 'Fiscaal voordeel', tekst: `Door gebruik te maken van de jaarruimte kun je de inleg aftrekken van je belastbaar inkomen. Dit levert een direct belastingvoordeel op van ${volgorde.includes('lijfrenteKlant') ? d.oplossingen.lijfrenteKlant?.belastingvoordeel + '%' : '—'}.` },
    { label: 'Flexibiliteit', tekst: 'De gekozen oplossing biedt flexibiliteit in de hoogte van de inleg. Je kunt het bedrag naar boven of beneden aanpassen als jouw situatie wijzigt.' },
    { label: 'Rendement', tekst: 'Beleggen geeft op de lange termijn historisch gezien een hoger rendement dan sparen. Dat maakt het geschikt voor een langere opbouwperiode.' },
    ...(d.bv?.bvAanwezig === 'ja' ? [{ label: 'BV-voordeel', tekst: 'Vermogen opgebouwd in de BV valt buiten box 3 en wordt niet belast met het fictief rendement. Dat maakt het op de lange termijn aantrekkelijk.' }] : []),
    { label: 'Horizon', tekst: `Met een opbouwperiode van circa ${d.klantPensioenJaar - new Date().getFullYear()} jaar is er voldoende tijd om risico te spreiden en te profiteren van samengesteld rendement.` },
    ...(d.oplResterendTekort > 0 ? [{ label: 'Niet volledig haalbaar', tekst: `Een deel van het pensioentekort (${fmtEuro(d.oplResterendTekort)}) kan met de gekozen oplossingen nog niet worden opgelost binnen het huidige budget. We bespreken alternatieven of bijstellingen.` }] : []),
    { label: 'Bewuste keuze gedeeltelijke oplossing', tekst: 'Je hebt er bewust voor gekozen om het tekort gedeeltelijk op te lossen. We evalueren dit jaarlijks en passen het plan aan als jouw situatie verandert.' },
  ];

  for (const b of bouwstenen) {
    blokken.push(alinea(b.label + ':', { bold: true, spaceAfter: 40 }));
    blokken.push(alinea(b.tekst, { spaceAfter: 120 }));
  }

  return blokken;
}

// ── Sectie 7 — Aandachtspunten buiten scope ───────────────────────
function maakSectie7(d) {
  const isDGA = d.bv?.bvAanwezig === 'ja';
  const naam = d.gezin?.klant?.voornaam || 'je';

  const blokken = [sectietitel('Aandachtspunten buiten scope')];

  blokken.push(alinea(
    `Naast jouw pensioenplanning zijn er onderwerpen die we in dit gesprek niet volledig hebben uitgewerkt, ` +
    `maar die wel relevant zijn voor jouw financiële situatie. We lichten ze hieronder kort toe.`,
    { spaceAfter: 160 }
  ));

  const aandachtspunten = [
    {
      titel: 'Arbeidsongeschiktheid',
      tekst: isDGA
        ? `Als DGA heb je via jouw BV geen automatische WIA-dekking. Als je door ziekte of een ongeluk niet meer kunt werken, valt jouw inkomen weg. Het is verstandig om na te denken over een arbeidsongeschiktheidsverzekering die aansluit bij jouw situatie als ondernemer.`
        : `Als werknemer ben je via jouw werkgever verzekerd via de WIA. Het uitkeringspercentage en de hoogte van de uitkering kunnen lager zijn dan jouw huidige inkomen. Controleer of jouw werkgever een aanvullende verzekering aanbiedt.`,
    },
    {
      titel: 'Werkloosheid',
      tekst: isDGA
        ? `Als DGA heb je in de meeste gevallen geen recht op een WW-uitkering. Bij het stoppen van jouw BV of bij een faillissement is er geen automatisch vangnet. Het is belangrijk om een buffer op te bouwen voor dit scenario.`
        : `Als werknemer heb je bij ontslag recht op een WW-uitkering. De duur en hoogte zijn afhankelijk van jouw arbeidsverleden. Controleer of dit voldoende is als buffer en of een aanvullende voorziening gewenst is.`,
    },
    {
      titel: 'Overlijden',
      tekst: isDGA
        ? `Bij jouw overlijden als DGA stopt jouw inkomen direct. Via de BV is er geen automatische nabestaandenuitkering. Zorg dat jouw partner en eventuele kinderen voldoende zijn verzekerd via een overlijdensrisicoverzekering of nabestaandenpensioen.`
        : `Via jouw pensioenfonds heb je mogelijk een nabestaandenpensioen opgebouwd. Controleer of dit voldoende is voor jouw partner en kinderen. Een aanvullende overlijdensrisicoverzekering kan het verschil maken.`,
    },
    {
      titel: 'Scheiding',
      tekst: `Bij een scheiding worden pensioenrechten in veel gevallen gedeeld op basis van de Wet verevening pensioenrechten bij scheiding. Dit kan grote gevolgen hebben voor jouw pensioenopbouw. Laat je hierover tijdig adviseren als jouw situatie verandert.`,
    },
  ];

  for (const ap of aandachtspunten) {
    blokken.push(alinea(ap.titel, { bold: true, spaceAfter: 60 }));
    blokken.push(alinea(ap.tekst, { spaceAfter: 160 }));
  }

  blokken.push(alinea(
    `Heb je vragen over een van deze onderwerpen? Bespreek ze gerust met ons. ` +
    `Jouw situatie verandert door de jaren heen en daarom plannen we jaarlijks een moment in ` +
    `om jouw pensioenplanning opnieuw te bekijken en waar nodig bij te stellen. ` +
    `Zo blijft jouw plan altijd actueel en passend bij jouw situatie.`,
    { spaceAfter: 120 }
  ));

  return blokken;
}

// ── Header en footer ───────────────────────────────────────────────
function maakHeader(logoData) {
  const children = [];

  if (logoData) {
    children.push(new Paragraph({
      children: [new ImageRun({
        data: logoData,
        transformation: { width: 100, height: 34 },
        type: 'png',
      })],
      spacing: { after: 40 },
    }));
  }

  children.push(new Paragraph({
    children: [new TextRun({ text: 'Frinn Financieel Advies  |  Pensioenplanning', font: 'Lato', size: 18, color: GROEN })],
    border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: LIMOEN } },
    spacing: { after: 0 },
  }));

  return new Header({ children });
}

function maakFooter() {
  return new Footer({
    children: [
      new Paragraph({
        children: [
          new TextRun({ text: 'info@frinn.nl  |  frinn.nl', font: 'Lato', size: 16, color: '888888' }),
          new TextRun({ text: '\t', font: 'Lato', size: 16 }),
          new TextRun({ children: [PageNumber.CURRENT], font: 'Lato', size: 16, color: '888888' }),
        ],
        border: { top: { style: BorderStyle.SINGLE, size: 4, color: LIMOEN } },
        tabStops: [{ type: 'right', position: 9360 }],
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

// ── Hoofdfunctie ───────────────────────────────────────────────────
export async function generateRapport(exportData) {
  // Logo ophalen en omzetten naar PNG (docx v9 ondersteunt SVG alleen met PNG-fallback)
  let logoData = null;
  try {
    const resp = await fetch('/logo_frinn_kleur.svg');
    if (resp.ok) {
      const svgText = await resp.text();
      logoData = await svgNaarPng(svgText, 200, 68);
    }
  } catch {
    // Logo niet beschikbaar, gaat door zonder
  }

  const header = maakHeader(logoData);
  const footer = maakFooter();

  const secties = [
    ...maakSectie1(exportData),
    ...maakSectie2(exportData),
    ...maakSectie3(exportData),
    ...maakSectie4(exportData),
    ...maakSectie5(exportData),
    ...maakSectie6(exportData),
    ...maakSectie7(exportData),
  ];

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: { font: 'Lato', size: 22, color: TEKST },
        },
      },
    },
    sections: [{
      properties: {
        page: {
          size: { width: 11906, height: 16838 },
          margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 },
        },
      },
      headers: { default: header },
      footers: { default: footer },
      children: secties,
    }],
  });

  return Packer.toBlob(doc);
}
