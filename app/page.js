'use client';
import { useState, useEffect, useRef } from 'react';
import { generateRapport } from '@/lib/generateRapport';
import StapGezin from '@/components/StapGezin';
import StapInkomsten from '@/components/StapInkomsten';
import StapPensioen from '@/components/StapPensioen';
import StapWoning from '@/components/StapWoning';
import StapBV from '@/components/StapBV';
import StapUitgaven from '@/components/StapUitgaven';
import StapGrafiek from '@/components/StapGrafiek';
import StapOplossingen from '@/components/StapOplossingen';

const AUTOSAVE_KEY = 'frinn_autosave';

const DEFAULT_STATE = {
  stap: 1,
  gezin: { klant: { voornaam: '', achternaam: '', geboortedatum: '' }, partner: null, kinderen: [] },
  inkomsten: { klantInkomsten: [], partnerInkomsten: [] },
  pensioen: { klantPensioenen: [], partnerPensioenen: [] },
  woning: { woningwaarde: '', waardestijging: '5.7', leningdelen: [] },
  bv: { bvAanwezig: 'nee', bvs: [] },
  uitgaven: { sparen: [], beleggen: [], lijfrentes: [], overig: [] },
  grafiek: { pensioengat: 0, klantPensioenJaar: new Date().getFullYear(), grafiekData: [], grafiekAfbeeldingen: {} },
};

export default function Home() {
  const [stap, setStap] = useState(DEFAULT_STATE.stap);
  const [gezin, setGezin] = useState(DEFAULT_STATE.gezin);
  const [inkomsten, setInkomsten] = useState(DEFAULT_STATE.inkomsten);
  const [pensioen, setPensioen] = useState(DEFAULT_STATE.pensioen);
  const [woning, setWoning] = useState(DEFAULT_STATE.woning);
  const [bv, setBv] = useState(DEFAULT_STATE.bv);
  const [uitgaven, setUitgaven] = useState(DEFAULT_STATE.uitgaven);
  const [grafiek, setGrafiek] = useState(DEFAULT_STATE.grafiek);
  const [bevestigNieuw, setBevestigNieuw] = useState(false);

  const bestandInput = useRef(null);

  // Herstel auto-save bij eerste load
  useEffect(() => {
    try {
      const opgeslagen = localStorage.getItem(AUTOSAVE_KEY);
      if (opgeslagen) {
        const data = JSON.parse(opgeslagen);
        if (data.stap) setStap(data.stap);
        if (data.gezin) setGezin(data.gezin);
        if (data.inkomsten) setInkomsten(data.inkomsten);
        if (data.pensioen) setPensioen(data.pensioen);
        if (data.woning) setWoning(data.woning);
        if (data.bv) setBv(data.bv);
        if (data.uitgaven) setUitgaven(data.uitgaven);
        if (data.grafiek) setGrafiek(data.grafiek);
      }
    } catch { /* corrupte data negeren */ }
  }, []);

  // Auto-save bij elke state-wijziging
  useEffect(() => {
    try {
      const snapshot = { stap, gezin, inkomsten, pensioen, woning, bv, uitgaven, grafiek };
      localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(snapshot));
    } catch { /* localStorage vol of niet beschikbaar */ }
  }, [stap, gezin, inkomsten, pensioen, woning, bv, uitgaven, grafiek]);

  function laadState(data) {
    setStap(data.stap ?? 1);
    setGezin(data.gezin ?? DEFAULT_STATE.gezin);
    setInkomsten(data.inkomsten ?? DEFAULT_STATE.inkomsten);
    setPensioen(data.pensioen ?? DEFAULT_STATE.pensioen);
    setWoning(data.woning ?? DEFAULT_STATE.woning);
    setBv(data.bv ?? DEFAULT_STATE.bv);
    setUitgaven(data.uitgaven ?? DEFAULT_STATE.uitgaven);
    setGrafiek(data.grafiek ?? DEFAULT_STATE.grafiek);
  }

  function slaOp() {
    const snapshot = { stap, gezin, inkomsten, pensioen, woning, bv, uitgaven, grafiek };
    const naam = gezin.klant?.achternaam || 'casus';
    const datum = new Date().toLocaleDateString('nl-NL').replace(/\//g, '-');
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Frinn_${naam}_${datum}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function laadBestand(e) {
    const bestand = e.target.files?.[0];
    if (!bestand) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        laadState(data);
      } catch { alert('Dit bestand kon niet worden geladen.'); }
    };
    reader.readAsText(bestand);
    e.target.value = '';
  }

  function nieuweCasus() {
    laadState(DEFAULT_STATE);
    setBevestigNieuw(false);
  }

  function stapGezinKlaar(data) { setGezin(data); setStap(2); }
  function stapInkomstenKlaar(data) { setInkomsten(data); setStap(3); }
  function stapPensioenKlaar(data) { setPensioen(data); setStap(4); }
  function stapWoningKlaar(data) { setWoning(data); setStap(5); }
  function stapBVKlaar(data) { setBv(data); setStap(6); }
  function stapUitgavenKlaar(data) { setUitgaven(data); setStap(7); }
  function stapGrafiekKlaar(data) { setGrafiek(data); setStap(8); }

  const knopStijl = {
    display: 'flex', alignItems: 'center', gap: '6px',
    padding: '6px 14px', borderRadius: '100px', border: '1px solid rgba(255,255,255,0.25)',
    background: 'transparent', color: '#fff', fontSize: '13px', fontFamily: 'Lato, sans-serif',
    cursor: 'pointer', fontWeight: '500',
  };

  return (
    <main style={{ minHeight: '100vh', background: '#F7F5F0', fontFamily: 'Lato, sans-serif' }}>
      <nav style={{ height: '68px', background: '#2A3933', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 56px', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
          <img src="/logo_frinn_kleur.svg" alt="Frinn" style={{ height: '68px', width: 'auto', objectFit: 'contain' }} />
          <span style={{ fontSize: '18px', fontWeight: '700', color: '#FFFFFF', fontFamily: 'Lato, sans-serif', letterSpacing: '0.01em', position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}>
            Pensioen planning
          </span>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button style={knopStijl} onClick={() => setBevestigNieuw(true)} title="Nieuwe casus">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
              Nieuw
            </button>
            <button style={knopStijl} onClick={() => bestandInput.current?.click()} title="Casus laden">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              Laden
            </button>
            <button style={knopStijl} onClick={slaOp} title="Casus opslaan">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Opslaan
            </button>
            <input ref={bestandInput} type="file" accept=".json" style={{ display: 'none' }} onChange={laadBestand} />
          </div>
        </div>
      </nav>

      {/* Bevestigingsdialoog nieuwe casus */}
      {bevestigNieuw && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '32px', maxWidth: '400px', width: '100%', margin: '0 24px' }}>
            <p style={{ fontSize: '16px', fontWeight: '700', color: '#2A3933', marginBottom: '8px', fontFamily: 'Lato, sans-serif' }}>Nieuwe casus starten?</p>
            <p style={{ fontSize: '14px', color: '#4a4a45', marginBottom: '24px', fontFamily: 'Lato, sans-serif', lineHeight: 1.5 }}>
              Alle ingevulde gegevens worden gewist. Sla de huidige casus eerst op als je die wilt bewaren.
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setBevestigNieuw(false)} style={{ flex: 1, padding: '10px', borderRadius: '100px', border: '1px solid rgba(42,57,51,0.2)', background: '#fff', color: '#2A3933', fontSize: '14px', fontFamily: 'Lato, sans-serif', cursor: 'pointer', fontWeight: '600' }}>
                Annuleren
              </button>
              <button onClick={nieuweCasus} style={{ flex: 1, padding: '10px', borderRadius: '100px', border: 'none', background: '#2A3933', color: '#fff', fontSize: '14px', fontFamily: 'Lato, sans-serif', cursor: 'pointer', fontWeight: '600' }}>
                Nieuwe casus
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '3rem 1.5rem' }}>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '2rem' }}>
          {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
            <div key={n} style={{ width: '8px', height: '8px', borderRadius: '50%', background: stap === n ? '#2A3933' : 'rgba(42,57,51,0.2)' }} />
          ))}
        </div>

        {stap === 1 && <StapGezin beginWaarden={gezin} onVolgende={stapGezinKlaar} />}
        {stap === 2 && <StapInkomsten gezin={gezin} beginWaarden={inkomsten} onVolgende={stapInkomstenKlaar} onVorige={() => setStap(1)} />}
        {stap === 3 && <StapPensioen gezin={gezin} beginWaarden={pensioen} onVolgende={stapPensioenKlaar} onVorige={() => setStap(2)} />}
        {stap === 4 && <StapWoning beginWaarden={woning} onVolgende={stapWoningKlaar} onVorige={() => setStap(3)} />}
        {stap === 5 && <StapBV beginWaarden={bv} onVolgende={stapBVKlaar} onVorige={() => setStap(4)} />}
        {stap === 6 && <StapUitgaven gezin={gezin} beginWaarden={uitgaven} onVolgende={stapUitgavenKlaar} onVorige={() => setStap(5)} />}
        {stap === 7 && <StapGrafiek gezin={gezin} inkomsten={inkomsten} pensioen={pensioen} woning={woning} bv={bv} uitgaven={uitgaven} onVorige={() => setStap(6)} onVolgende={stapGrafiekKlaar} />}
        {stap === 8 && <StapOplossingen gezin={gezin} inkomsten={inkomsten} pensioen={pensioen} uitgaven={uitgaven} bv={bv} woning={woning} pensioengat={grafiek.pensioengat} klantPensioenJaar={grafiek.klantPensioenJaar} grafiekData={grafiek.grafiekData} grafiekAfbeeldingen={grafiek.grafiekAfbeeldingen} vermogenPensioen={grafiek.vermogenPensioen} onVorige={() => setStap(7)} onExport={async (exportData) => {
          const blob = await generateRapport(exportData);
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `Pensioenplanning_${exportData.gezin.klant.achternaam || 'klant'}_${exportData.klantPensioenJaar}.docx`;
          a.click();
          URL.revokeObjectURL(url);
        }} />}
      </div>
    </main>
  );
}
