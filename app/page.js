'use client';
import { useState } from 'react';
import StapGezin from '@/components/StapGezin';
import PensioenCalculator from '@/components/PensioenCalculator';

export default function Home() {
  const [stap, setStap] = useState(1);
  const [gezin, setGezin] = useState(null);

  function stapGezinKlaar(data) {
    setGezin(data);
    setStap(2);
  }

  return (
    <main style={{ minHeight: '100vh', background: '#F7F5F0', fontFamily: 'Lato, sans-serif' }}>
      <nav style={{ height: '68px', background: 'rgba(248,245,239,0.95)', borderBottom: '1px solid rgba(42,57,51,0.1)', display: 'flex', alignItems: 'center', padding: '0 32px' }}>
        <span style={{ fontFamily: 'Lato, sans-serif', fontWeight: '900', fontSize: '18px', color: '#2A3933', letterSpacing: '-0.5px' }}>frinn</span>
        <span style={{ marginLeft: '12px', fontSize: '13px', color: '#8a8a82', fontWeight: '300' }}>Pensioen planning</span>
      </nav>

      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '3rem 1.5rem' }}>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '2rem' }}>
          {[1, 2].map(n => (
            <div key={n} style={{ width: '8px', height: '8px', borderRadius: '50%', background: stap === n ? '#2A3933' : 'rgba(42,57,51,0.2)' }} />
          ))}
        </div>

        {stap === 1 && <StapGezin onVolgende={stapGezinKlaar} />}
        {stap === 2 && <PensioenCalculator gezin={gezin} />}
      </div>
    </main>
  );
}