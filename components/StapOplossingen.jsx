'use client';
import { useState } from 'react';
import { BOX1_VOOR_AOW, BOX1_NA_AOW, WONINGWAARDE_STIJGING } from '@/lib/constants';

const kaartStijl = { background: '#FFFFFF', borderRadius: '20px', padding: '28px', border: '1px solid rgba(42,57,51,0.1)', marginBottom: '12px' };

function berekenEindwaarde(huidigeWaarde, maandInleg, rendementPct, aantalMaanden) {
  const r = (rendementPct || 0) / 100 / 12;
  const wv = (huidigeWaarde || 0) * Math.pow(1 + r, aantalMaanden);
  if (r === 0) return wv + (maandInleg || 0) * aantalMaanden;
  return wv + (maandInleg || 0) * ((Math.pow(1 + r, aantalMaanden) - 1) / r);
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

function fmtEuro(n) {
  const abs = Math.abs(Math.round(n));
  return (n < 0 ? '- ' : '') + '€ ' + abs.toLocaleString('nl-NL');
}

export default function StapOplossingen({ gezin, inkomsten, bv, woning, pensioengat, klantPensioenJaar, onVorige }) {
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

  const klantBrutoArbeid = (inkomsten?.klantInkomsten || []).reduce((s, i) => s + (parseFloat(i.bedrag) || 0), 0);
  const jaarruimte = Math.max(0, 0.30 * (klantBrutoArbeid - 17545));
  const maandMax = jaarruimte / 12;
  const klantMargTarief = margTarief(klantBrutoArbeid, false);
  const partnerBrutoArbeid = (inkomsten?.partnerInkomsten || []).reduce((s, i) => s + (parseFloat(i.bedrag) || 0), 0);
  const partnerJaarruimte = Math.max(0, 0.30 * (partnerBrutoArbeid - 17545));
  const partnerMaandMax = partnerJaarruimte / 12;
  const partnerMargTarief = margTarief(partnerBrutoArbeid, false);
  const oplMaanden = Math.max(1, (klantPensioenJaar - huidigJaar) * 12);

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

  const oplSparenEindvermogen = berekenEindwaarde(0, oplSparenBedrag, oplSparenRendement, oplMaanden);
  const oplBeleggenEindvermogen = berekenEindwaarde(0, oplBeleggenBedrag, oplBeleggenRendement, oplMaanden);
  const oplLijfrenteNettoMaand = oplLijfrenteBedrag * (1 - klantMargTarief);
  const oplLijfrenteEindvermogen = berekenEindwaarde(0, oplLijfrenteBedrag, oplLijfrenteRendement, oplMaanden);
  const oplLijfrentePartnerNettoMaand = oplLijfrentePartnerBedrag * (1 - partnerMargTarief);
  const oplLijfrentePartnerEindvermogen = berekenEindwaarde(0, oplLijfrentePartnerBedrag, oplLijfrentePartnerRendement, oplMaanden);
  const oplBvNettoMaand = oplBvBedrag * (1 - 0.19);
  const oplBvEindvermogen = berekenEindwaarde(0, oplBvNettoMaand, oplBvRendement, oplMaanden);

  function resterendVoor(...uitgesloten) {
    const totaalOverig = [oplSparenEindvermogen, oplBeleggenEindvermogen, oplLijfrenteEindvermogen, oplLijfrentePartnerEindvermogen, oplBvEindvermogen]
      .filter((_, i) => !uitgesloten.includes(i))
      .reduce((s, v) => s + v, 0);
    return Math.max(0, pensioengat - totaalOverig);
  }

  const oplSparenMax = Math.max(10, Math.round(berekenMaandInleg(resterendVoor(0), oplSparenRendement, oplMaanden)));
  const oplBeleggenMax = Math.max(10, Math.round(berekenMaandInleg(resterendVoor(1), oplBeleggenRendement, oplMaanden)));
  const oplLijfrenteMax = Math.min(Math.floor(maandMax), Math.max(10, Math.round(berekenMaandInleg(resterendVoor(2), oplLijfrenteRendement, oplMaanden))));
  const oplLijfrentePartnerMax = Math.min(Math.floor(partnerMaandMax), Math.max(10, Math.round(berekenMaandInleg(resterendVoor(3), oplLijfrentePartnerRendement, oplMaanden))));
  const oplBvMax = Math.max(10, Math.round(berekenMaandInleg(resterendVoor(4), oplBvRendement, oplMaanden) / 0.81));

  const oplTotaalEindvermogen = oplSparenEindvermogen + oplBeleggenEindvermogen + oplLijfrenteEindvermogen + oplLijfrentePartnerEindvermogen + oplBvEindvermogen;
  const oplResterendTekort = Math.max(0, pensioengat - oplTotaalEindvermogen);
  const oplOpgelostPct = pensioengat > 0 ? Math.min(100, Math.round(oplTotaalEindvermogen / pensioengat * 100)) : 100;

  const inkomenNaAftrek = klantBrutoArbeid - oplLijfrenteBedrag * 12;
  const schijfNaAftrek = margTarief(Math.max(0, inkomenNaAftrek), false);
  const toonZelfdeSchijf = oplLijfrenteBedrag > 0 && klantMargTarief > 0 && schijfNaAftrek === klantMargTarief;
  const toonSchijfgrensVoordeel = oplLijfrenteBedrag > 0 && schijfNaAftrek < klantMargTarief;

  const partnerInkomenNaAftrek = partnerBrutoArbeid - oplLijfrentePartnerBedrag * 12;
  const partnerSchijfNaAftrek = margTarief(Math.max(0, partnerInkomenNaAftrek), false);
  const toonPartnerZelfdeSchijf = oplLijfrentePartnerBedrag > 0 && partnerMargTarief > 0 && partnerSchijfNaAftrek === partnerMargTarief;
  const toonPartnerSchijfgrensVoordeel = oplLijfrentePartnerBedrag > 0 && partnerSchijfNaAftrek < partnerMargTarief;

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
              <p style={{ fontSize: '12px', color: '#2A3933', margin: 0, fontFamily: 'Lato, sans-serif' }}>Uw verwachte inkomsten dekken uw benodigde inkomen tijdens de pensioenfase.</p>
            </div>
          </div>
        </div>
        <button onClick={onVorige} style={{ width: '100%', padding: '14px 28px', fontSize: '15px', fontWeight: '700', background: 'transparent', color: '#2A3933', border: '1px solid rgba(42,57,51,0.2)', borderRadius: '100px', cursor: 'pointer', fontFamily: 'Lato, sans-serif' }}>
          ← Vorige
        </button>
      </div>
    );
  }

  return (
    <div>
      <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#2A3933', marginBottom: '2rem', letterSpacing: '-0.5px', fontFamily: 'Lato, sans-serif' }}>
        Oplossingen voor het pensioentekort.
      </h2>

      {toonWoningSignalering && (
        <div style={{ background: '#FFFFFF', borderRadius: '20px', padding: '28px', border: '1px solid rgba(42,57,51,0.1)', marginBottom: '12px' }}>
          <p style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '0.08em', color: '#2A3933', textTransform: 'uppercase', margin: '0 0 12px 0', fontFamily: 'Lato, sans-serif' }}>
            Aanvullende mogelijkheid
          </p>
          <p style={{ fontSize: '13px', color: '#4a4a45', margin: '0 0 16px 0', fontFamily: 'Lato, sans-serif', lineHeight: 1.6 }}>
            Op uw pensioendatum heeft u een verwachte overwaarde van {fmtEuro(overwaardeOpPensioen)}. Het opnemen van de overwaarde kan een aanvulling zijn op uw pensioeninkomen.
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
          <p style={{ fontSize: '13px', color: '#8a8a82', margin: '0 0 4px 0', fontFamily: 'Lato, sans-serif' }}>Op uw pensioendatum heeft u</p>
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
          <div style={{ background: '#F7F5F0', borderRadius: '16px', padding: '20px' }}>
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: '#fff', borderRadius: '10px' }}>
              <span style={{ fontSize: '12px', color: '#8a8a82' }}>Eindvermogen op pensioendatum</span>
              <span style={{ fontSize: '13px', fontWeight: '700', color: '#2A3933' }}>{fmtEuro(oplSparenEindvermogen)}</span>
            </div>
          </div>

          {/* Kaart 2: Beleggen */}
          <div style={{ background: '#F7F5F0', borderRadius: '16px', padding: '20px' }}>
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: '#fff', borderRadius: '10px' }}>
              <span style={{ fontSize: '12px', color: '#8a8a82' }}>Eindvermogen op pensioendatum</span>
              <span style={{ fontSize: '13px', fontWeight: '700', color: '#2A3933' }}>{fmtEuro(oplBeleggenEindvermogen)}</span>
            </div>
          </div>

          {/* Kaart 3: Lijfrente klant */}
          <div style={{ background: '#F7F5F0', borderRadius: '16px', padding: '20px' }}>
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
                <div style={{ background: '#fff', borderRadius: '10px', padding: '10px 12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '12px', color: '#8a8a82' }}>Belastingvoordeel ({Math.round(klantMargTarief * 100)}%)</span>
                    <span style={{ fontSize: '12px', fontWeight: '600', color: '#2A3933' }}>- {fmtEuro(oplLijfrenteBedrag * klantMargTarief)}/mnd</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '6px', borderTop: '1px solid rgba(42,57,51,0.08)', marginBottom: '6px' }}>
                    <span style={{ fontSize: '12px', color: '#8a8a82' }}>Netto maandinleg</span>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: '#2A3933' }}>{fmtEuro(oplLijfrenteNettoMaand)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '12px', color: '#8a8a82' }}>Eindvermogen op pensioendatum</span>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: '#2A3933' }}>{fmtEuro(oplLijfrenteEindvermogen)}</span>
                  </div>
                </div>
                {toonZelfdeSchijf && <div style={{ marginTop: '8px', background: '#F7F5F0', borderRadius: '10px', padding: '10px 12px', fontSize: '12px', color: '#8a8a82', fontFamily: 'Lato, sans-serif' }}>U blijft in dezelfde belastingschijf. Belastingvoordeel is {Math.round(klantMargTarief * 100)}% over het gehele bedrag.</div>}
                {toonSchijfgrensVoordeel && <div style={{ marginTop: '8px', background: '#c8e86a', borderRadius: '10px', padding: '10px 12px', fontSize: '12px', color: '#2A3933', fontFamily: 'Lato, sans-serif' }}>Uw inleg brengt uw inkomen onder de schijfgrens. Het deel in de hogere schijf ({Math.round(klantMargTarief * 100)}%) levert extra belastingvoordeel op.</div>}
              </>
            ) : (
              <div style={{ background: '#fff', borderRadius: '10px', padding: '12px', fontSize: '13px', color: '#8a8a82', fontFamily: 'Lato, sans-serif' }}>
                Geen jaarruimte beschikbaar. Jaarruimte vereist arbeidsinkomen boven €17.545.
              </div>
            )}
          </div>

          {/* Kaart 3b: Lijfrente partner */}
          {heeftPartner && (
            <div style={{ background: '#F7F5F0', borderRadius: '16px', padding: '20px' }}>
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
                  <div style={{ background: '#fff', borderRadius: '10px', padding: '10px 12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '12px', color: '#8a8a82' }}>Belastingvoordeel ({Math.round(partnerMargTarief * 100)}%)</span>
                      <span style={{ fontSize: '12px', fontWeight: '600', color: '#2A3933' }}>- {fmtEuro(oplLijfrentePartnerBedrag * partnerMargTarief)}/mnd</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '6px', borderTop: '1px solid rgba(42,57,51,0.08)', marginBottom: '6px' }}>
                      <span style={{ fontSize: '12px', color: '#8a8a82' }}>Netto maandinleg</span>
                      <span style={{ fontSize: '13px', fontWeight: '700', color: '#2A3933' }}>{fmtEuro(oplLijfrentePartnerNettoMaand)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '12px', color: '#8a8a82' }}>Eindvermogen op pensioendatum</span>
                      <span style={{ fontSize: '13px', fontWeight: '700', color: '#2A3933' }}>{fmtEuro(oplLijfrentePartnerEindvermogen)}</span>
                    </div>
                  </div>
                  {toonPartnerZelfdeSchijf && <div style={{ marginTop: '8px', background: '#F7F5F0', borderRadius: '10px', padding: '10px 12px', fontSize: '12px', color: '#8a8a82', fontFamily: 'Lato, sans-serif' }}>{gezin?.partner?.voornaam || 'Partner'} blijft in dezelfde belastingschijf. Belastingvoordeel is {Math.round(partnerMargTarief * 100)}% over het gehele bedrag.</div>}
                  {toonPartnerSchijfgrensVoordeel && <div style={{ marginTop: '8px', background: '#c8e86a', borderRadius: '10px', padding: '10px 12px', fontSize: '12px', color: '#2A3933', fontFamily: 'Lato, sans-serif' }}>De inleg brengt het inkomen van {gezin?.partner?.voornaam || 'partner'} onder de schijfgrens. Het deel in de hogere schijf ({Math.round(partnerMargTarief * 100)}%) levert extra belastingvoordeel op.</div>}
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
            <div style={{ background: '#F7F5F0', borderRadius: '16px', padding: '20px' }}>
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
              <div style={{ background: '#fff', borderRadius: '10px', padding: '10px 12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '12px', color: '#8a8a82' }}>Bruto jaarbedrag</span>
                  <span style={{ fontSize: '12px', fontWeight: '600', color: '#2A3933' }}>{fmtEuro(oplBvBedrag * 12)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '12px', color: '#8a8a82' }}>Netto na Vpb (19%)</span>
                  <span style={{ fontSize: '12px', fontWeight: '600', color: '#2A3933' }}>{fmtEuro(oplBvNettoMaand * 12)}/jr</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '6px', borderTop: '1px solid rgba(42,57,51,0.08)' }}>
                  <span style={{ fontSize: '12px', color: '#8a8a82' }}>Eindvermogen op pensioendatum</span>
                  <span style={{ fontSize: '13px', fontWeight: '700', color: '#2A3933' }}>{fmtEuro(oplBvEindvermogen)}</span>
                </div>
              </div>
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

      <button onClick={onVorige} style={{ width: '100%', padding: '14px 28px', fontSize: '15px', fontWeight: '700', background: 'transparent', color: '#2A3933', border: '1px solid rgba(42,57,51,0.2)', borderRadius: '100px', cursor: 'pointer', fontFamily: 'Lato, sans-serif' }}>
        ← Vorige
      </button>
    </div>
  );
}
