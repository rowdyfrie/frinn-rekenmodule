'use client';
import { useState } from 'react';
import { generateRapport } from '@/lib/generateRapport';
import StapGezin from '@/components/StapGezin';
import StapInkomsten from '@/components/StapInkomsten';
import StapPensioen from '@/components/StapPensioen';
import StapWoning from '@/components/StapWoning';
import StapBV from '@/components/StapBV';
import StapUitgaven from '@/components/StapUitgaven';
import StapGrafiek from '@/components/StapGrafiek';
import StapOplossingen from '@/components/StapOplossingen';

export default function Home() {
  const [stap, setStap] = useState(1);
  const [gezin, setGezin] = useState({ klant: { voornaam: '', achternaam: '', geboortedatum: '' }, partner: null, kinderen: [] });
  const [inkomsten, setInkomsten] = useState({ klantInkomsten: [], partnerInkomsten: [] });
  const [pensioen, setPensioen] = useState({ klantPensioenen: [], partnerPensioenen: [] });
  const [woning, setWoning] = useState({ woningwaarde: '', waardestijging: '5.7', leningdelen: [] });
  const [bv, setBv] = useState({ bvAanwezig: 'nee', bvs: [] });
  const [uitgaven, setUitgaven] = useState({ sparen: [], beleggen: [], lijfrentes: [], overig: [] });
  const [grafiek, setGrafiek] = useState({ pensioengat: 0, klantPensioenJaar: new Date().getFullYear(), grafiekData: [] });

  function stapGezinKlaar(data) { setGezin(data); setStap(2); }
  function stapInkomstenKlaar(data) { setInkomsten(data); setStap(3); }
  function stapPensioenKlaar(data) { setPensioen(data); setStap(4); }
  function stapWoningKlaar(data) { setWoning(data); setStap(5); }
  function stapBVKlaar(data) { setBv(data); setStap(6); }
  function stapUitgavenKlaar(data) { setUitgaven(data); setStap(7); }
  function stapGrafiekKlaar(data) { setGrafiek(data); setStap(8); }

  return (
    <main style={{ minHeight: '100vh', background: '#F7F5F0', fontFamily: 'Lato, sans-serif' }}>
      <nav style={{ height: '68px', background: '#2A3933', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 56px', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
          <img src="/logo_frinn_kleur.svg" alt="Frinn" style={{ height: '68px', width: 'auto', objectFit: 'contain' }} />
          <span style={{ fontSize: '18px', fontWeight: '700', color: '#FFFFFF', fontFamily: 'Lato, sans-serif', letterSpacing: '0.01em', position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}>
            Pensioen planning
          </span>
        </div>
      </nav>

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
        {stap === 8 && <StapOplossingen gezin={gezin} inkomsten={inkomsten} pensioen={pensioen} uitgaven={uitgaven} bv={bv} woning={woning} pensioengat={grafiek.pensioengat} klantPensioenJaar={grafiek.klantPensioenJaar} grafiekData={grafiek.grafiekData} grafiekAfbeeldingen={grafiek.grafiekAfbeeldingen} onVorige={() => setStap(7)} onExport={async (exportData) => {
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
