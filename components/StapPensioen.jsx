'use client';
import { useState } from 'react';

const inputStijl = { width: '100%', boxSizing: 'border-box', height: '42px', border: '1px solid rgba(42,57,51,0.2)', borderRadius: '100px', padding: '0 16px', fontSize: '14px', fontFamily: 'Lato, sans-serif', color: '#4a4a45', background: '#FFFFFF', outline: 'none' };
const labelStijl = { fontSize: '13px', fontWeight: '300', color: '#8a8a82', display: 'block', marginBottom: '6px', fontFamily: 'Lato, sans-serif' };
const sectieStijl = { fontSize: '11px', fontWeight: '700', letterSpacing: '0.08em', color: '#2A3933', textTransform: 'uppercase', marginBottom: '14px', margin: '0 0 14px 0' };
const kaartStijl = { background: '#FFFFFF', borderRadius: '20px', padding: '28px', border: '1px solid rgba(42,57,51,0.1)', marginBottom: '12px' };

function berekenAowLeeftijd(geboortedatum) {
  if (!geboortedatum) return { jaren: 67, maanden: 0 };
  const d = new Date(geboortedatum);
  const tabel = [
    { van: '1956-06-01', tot: '1957-02-28', jaren: 66, maanden: 10 },
    { van: '1957-03-01', tot: '1960-12-31', jaren: 67, maanden: 0 },
    { van: '1961-01-01', tot: '1964-09-30', jaren: 67, maanden: 3 },
    { van: '1964-10-01', tot: '1966-09-30', jaren: 67, maanden: 3 },
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

function PensioenBlok({ naam, geboortedatum, heeftPartner, pensioenen, setPensioenen }) {
  const aowLeeftijd = berekenAowLeeftijd(geboortedatum);
  const [aowMetPartner, setAowMetPartner] = useState(heeftPartner);

  const aowBedrag = aowMetPartner
    ? Math.round((1122.12 + 76.10) * 12)
    : Math.round((1637.57 + 106.55) * 12);

  function voegToe() {
    setPensioenen([...pensioenen, { id: Date.now(), aanbieder: '', bedrag: '', jaren: 67, maanden: 0 }]);
  }

  function verwijder(id) {
    setPensioenen(pensioenen.filter(p => p.id !== id));
  }

  function update(id, veld, waarde) {
    setPensioenen(pensioenen.map(p => p.id === id ? { ...p, [veld]: waarde } : p));
  }

  return (
    <div style={kaartStijl}>
      <p style={sectieStijl}>{naam}</p>

      <div style={{ background: '#F7F5F0', borderRadius: '12px', padding: '16px', marginBottom: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <span style={{ fontSize: '13px', fontWeight: '700', color: '#2A3933' }}>AOW</span>
          <span style={{ fontSize: '12px', color: '#8a8a82', fontFamily: 'Lato, sans-serif' }}>Automatisch ingevuld</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
          <div>
            <label style={labelStijl}>Bruto jaarbedrag</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', fontSize: '13px', color: '#8a8a82', pointerEvents: 'none' }}>€</span>
              <input style={{ ...inputStijl, paddingLeft: '28px' }} type="number" defaultValue={aowBedrag} key={aowBedrag} />
            </div>
          </div>
          <div>
            <label style={labelStijl}>Ingangsdatum AOW</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div style={{ position: 'relative' }}>
                <input style={{ ...inputStijl, paddingRight: '40px' }} type="number" defaultValue={aowLeeftijd.jaren} min="60" max="75" />
                <span style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '12px', color: '#8a8a82', pointerEvents: 'none' }}>jr</span>
              </div>
              <div style={{ position: 'relative' }}>
                <input style={{ ...inputStijl, paddingRight: '40px' }} type="number" defaultValue={aowLeeftijd.maanden} min="0" max="11" />
                <span style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '12px', color: '#8a8a82', pointerEvents: 'none' }}>mnd</span>
              </div>
            </div>
          </div>
        </div>

        <div>
          <label style={labelStijl}>AOW-situatie</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {[
              { waarde: false, label: 'Zonder partner' },
              { waarde: true, label: 'Met partner' },
            ].map(opt => (
              <button
                key={String(opt.waarde)}
                onClick={() => setAowMetPartner(opt.waarde)}
                style={{
                  height: '42px',
                  border: '1px solid rgba(42,57,51,0.2)',
                  borderRadius: '100px',
                  fontSize: '13px',
                  fontFamily: 'Lato, sans-serif',
                  fontWeight: aowMetPartner === opt.waarde ? '700' : '400',
                  background: aowMetPartner === opt.waarde ? '#2A3933' : '#FFFFFF',
                  color: aowMetPartner === opt.waarde ? '#FFFFFF' : '#4a4a45',
                  cursor: 'pointer',
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {pensioenen.map((pensioen, index) => (
        <div key={pensioen.id} style={{ background: '#F7F5F0', borderRadius: '12px', padding: '16px', marginBottom: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '13px', fontWeight: '700', color: '#2A3933' }}>Pensioen {index + 1}</span>
            <button onClick={() => verwijder(pensioen.id)} style={{ background: 'none', border: 'none', color: '#cc4444', cursor: 'pointer', fontSize: '18px', lineHeight: 1 }}>×</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label style={labelStijl}>Aanbieder</label>
              <input style={inputStijl} type="text" placeholder="bijv. ABP, Nationale-Nederlanden" value={pensioen.aanbieder} onChange={e => update(pensioen.id, 'aanbieder', e.target.value)} />
            </div>
            <div>
              <label style={labelStijl}>Bruto jaarbedrag</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', fontSize: '13px', color: '#8a8a82', pointerEvents: 'none' }}>€</span>
                <input style={{ ...inputStijl, paddingLeft: '28px' }} type="number" placeholder="0" value={pensioen.bedrag} onChange={e => update(pensioen.id, 'bedrag', e.target.value)} />
              </div>
            </div>
          </div>
          <div>
            <label style={labelStijl}>Pensioenleeftijd</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div style={{ position: 'relative' }}>
                <input style={{ ...inputStijl, paddingRight: '40px' }} type="number" placeholder="67" value={pensioen.jaren} min="55" max="75" onChange={e => update(pensioen.id, 'jaren', parseInt(e.target.value))} />
                <span style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '12px', color: '#8a8a82', pointerEvents: 'none' }}>jr</span>
              </div>
              <div style={{ position: 'relative' }}>
                <input style={{ ...inputStijl, paddingRight: '40px' }} type="number" placeholder="0" value={pensioen.maanden} min="0" max="11" onChange={e => update(pensioen.id, 'maanden', parseInt(e.target.value))} />
                <span style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '12px', color: '#8a8a82', pointerEvents: 'none' }}>mnd</span>
              </div>
            </div>
          </div>
        </div>
      ))}

      <button onClick={voegToe} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: '1px solid rgba(42,57,51,0.2)', borderRadius: '100px', padding: '8px 16px', fontSize: '13px', fontWeight: '700', color: '#2A3933', cursor: 'pointer', fontFamily: 'Lato, sans-serif', marginTop: '4px' }}>
        + Pensioen toevoegen
      </button>
    </div>
  );
}

export default function StapPensioen({ gezin, beginWaarden, onVolgende, onVorige }) {
  const heeftPartner = !!gezin?.partner;
  const [klantPensioenen, setKlantPensioenen] = useState(beginWaarden?.klantPensioenen || []);
  const [partnerPensioenen, setPartnerPensioenen] = useState(beginWaarden?.partnerPensioenen || []);

  const klantNaam = gezin?.klant?.voornaam || 'Klant';
  const partnerNaam = gezin?.partner?.voornaam || 'Partner';

  function volgende() {
    onVolgende({ klantPensioenen, partnerPensioenen });
  }

  return (
    <div>
      <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#2A3933', marginBottom: '2rem', letterSpacing: '-0.5px', fontFamily: 'Lato, sans-serif' }}>
        Vul de verwachte pensioeninkomsten in.
      </h2>

      <PensioenBlok
        naam={klantNaam}
        geboortedatum={gezin?.klant?.geboortedatum}
        heeftPartner={heeftPartner}
        pensioenen={klantPensioenen}
        setPensioenen={setKlantPensioenen}
      />

      {heeftPartner && (
        <PensioenBlok
          naam={partnerNaam}
          geboortedatum={gezin?.partner?.geboortedatum}
          heeftPartner={heeftPartner}
          pensioenen={partnerPensioenen}
          setPensioenen={setPartnerPensioenen}
        />
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '8px' }}>
        <button onClick={onVorige} style={{ width: '100%', padding: '14px 28px', fontSize: '15px', fontWeight: '700', background: 'transparent', color: '#2A3933', border: '1px solid rgba(42,57,51,0.2)', borderRadius: '100px', cursor: 'pointer', fontFamily: 'Lato, sans-serif' }}>
          ← Vorige
        </button>
        <button onClick={volgende} style={{ width: '100%', padding: '14px 28px', fontSize: '15px', fontWeight: '700', background: '#2A3933', color: '#FFFFFF', border: 'none', borderRadius: '100px', cursor: 'pointer', fontFamily: 'Lato, sans-serif' }}>
          Volgende →
        </button>
      </div>
    </div>
  );
}