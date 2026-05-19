'use client';
import { useState } from 'react';
import StapGezin from '@/components/StapGezin';
import StapInkomsten from '@/components/StapInkomsten';
import StapPensioen from '@/components/StapPensioen';
import PensioenCalculator from '@/components/PensioenCalculator';

export default function Home() {
  const [stap, setStap] = useState(1);
  const [gezin, setGezin] = useState({ klant: { voornaam: '', achternaam: '', geboortedatum: '' }, partner: null, kinderen: [] });
  const [inkomsten, setInkomsten] = useState({ klantInkomsten: [], partnerInkomsten: [] });
  const [pensioen, setPensioen] = useState({ klantPensioenen: [], partnerPensioenen: [] });

  function stapGezinKlaar(data) { setGezin(data); setStap(2); }
  function stapInkomstenKlaar(data) { setInkomsten(data); setStap(3); }
  function stapPensioenKlaar(data) { setPensioen(data); setStap(4); }

  return (
    <main style={{ minHeight: '100vh', background: '#F7F5F0', fontFamily: 'Lato, sans-serif' }}>
      <nav style={{ height: '68px', background: '#2A3933', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 56px', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
          <img src="/Logo_frinn_kleur.svg" alt="Frinn" style={{ height: '68px', width: 'auto', objectFit: 'contain' }} />
          <span style={{ fontSize: '18px', fontWeight: '700', color: '#FFFFFF', fontFamily: 'Lato, sans-serif', letterSpacing: '0.01em', position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}>
            Pensioen planning
          </span>
        </div>
      </nav>

      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '3rem 1.5rem' }}>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '2rem' }}>
          {[1, 2, 3, 4].map(n => (
            <div key={n} style={{ width: '8px', height: '8px', borderRadius: '50%', background: stap === n ? '#2A3933' : 'rgba(42,57,51,0.2)' }} />
          ))}
        </div>

        {stap === 1 && (
          <StapGezin
            beginWaarden={gezin}
            onVolgende={stapGezinKlaar}
          />
        )}
        {stap === 2 && (
          <StapInkomsten
            gezin={gezin}
            beginWaarden={inkomsten}
            onVolgende={stapInkomstenKlaar}
            onVorige={() => setStap(1)}
          />
        )}
        {stap === 3 && (
          <StapPensioen
            gezin={gezin}
            beginWaarden={pensioen}
            onVolgende={stapPensioenKlaar}
            onVorige={() => setStap(2)}
          />
        )}
        {stap === 4 && (
          <PensioenCalculator
            gezin={gezin}
            inkomsten={inkomsten}
            pensioen={pensioen}
          />
        )}
      </div>
    </main>
  );
}