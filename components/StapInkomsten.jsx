'use client';
import { useState } from 'react';

const inputStijl = { width: '100%', boxSizing: 'border-box', height: '42px', border: '1px solid rgba(42,57,51,0.2)', borderRadius: '100px', padding: '0 16px', fontSize: '14px', fontFamily: 'Lato, sans-serif', color: '#4a4a45', background: '#FFFFFF', outline: 'none' };
const selectStijl = { width: '100%', boxSizing: 'border-box', height: '42px', border: '1px solid rgba(42,57,51,0.2)', borderRadius: '100px', padding: '0 16px', fontSize: '14px', fontFamily: 'Lato, sans-serif', color: '#4a4a45', background: '#FFFFFF', outline: 'none', appearance: 'none', cursor: 'pointer' };
const labelStijl = { fontSize: '13px', fontWeight: '300', color: '#8a8a82', display: 'block', marginBottom: '6px', fontFamily: 'Lato, sans-serif' };
const sectieStijl = { fontSize: '11px', fontWeight: '700', letterSpacing: '0.08em', color: '#2A3933', textTransform: 'uppercase', marginBottom: '14px', margin: '0 0 14px 0' };
const kaartStijl = { background: '#FFFFFF', borderRadius: '20px', padding: '28px', border: '1px solid rgba(42,57,51,0.1)', marginBottom: '12px' };

const inkomstentypes = {
  loon: { label: 'Loon', veld: 'Bruto jaarsalaris' },
  ondernemer: { label: 'Ondernemer', veld: 'Winst voor ondernemersaftrek' },
  dga: { label: 'DGA', veld: 'DGA-salaris' },
  pensioen: { label: 'Pensioen', veld: 'Jaarlijkse pensioeninkomsten' },
  overig: { label: 'Overig', veld: 'Overige inkomsten' },
};

function InkomstenBlok({ naam, inkomsten, setInkomsten }) {
  function voegToe() {
    setInkomsten([...inkomsten, { id: Date.now(), type: 'loon', bedrag: '' }]);
  }

  function verwijder(id) {
    setInkomsten(inkomsten.filter(i => i.id !== id));
  }

  function updateType(id, type) {
    setInkomsten(inkomsten.map(i => i.id === id ? { ...i, type } : i));
  }

  function updateBedrag(id, bedrag) {
    setInkomsten(inkomsten.map(i => i.id === id ? { ...i, bedrag } : i));
  }

  return (
    <div style={kaartStijl}>
      <p style={sectieStijl}>{naam}</p>
      {inkomsten.map((inkomen, index) => (
        <div key={inkomen.id} style={{ background: '#F7F5F0', borderRadius: '12px', padding: '16px', marginBottom: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '13px', fontWeight: '700', color: '#2A3933' }}>Inkomen {index + 1}</span>
            <button onClick={() => verwijder(inkomen.id)} style={{ background: 'none', border: 'none', color: '#cc4444', cursor: 'pointer', fontSize: '18px', lineHeight: 1 }}>×</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={labelStijl}>Type inkomen</label>
              <div style={{ position: 'relative' }}>
                <select style={selectStijl} value={inkomen.type} onChange={e => updateType(inkomen.id, e.target.value)}>
                  {Object.entries(inkomstentypes).map(([k, v]) => (
                    <option key={k} value={k}>{v.label}</option>
                  ))}
                </select>
                <span style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#8a8a82', fontSize: '12px' }}>▾</span>
              </div>
            </div>
            <div>
              <label style={labelStijl}>{inkomstentypes[inkomen.type].veld}</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', fontSize: '13px', color: '#8a8a82', pointerEvents: 'none' }}>€</span>
                <input style={{ ...inputStijl, paddingLeft: '28px' }} type="number" placeholder="0" value={inkomen.bedrag} onChange={e => updateBedrag(inkomen.id, e.target.value)} />
              </div>
            </div>
          </div>
        </div>
      ))}
      <button onClick={voegToe} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: '1px solid rgba(42,57,51,0.2)', borderRadius: '100px', padding: '8px 16px', fontSize: '13px', fontWeight: '700', color: '#2A3933', cursor: 'pointer', fontFamily: 'Lato, sans-serif', marginTop: '4px' }}>
        + Inkomen toevoegen
      </button>
    </div>
  );
}

export default function StapInkomsten({ gezin, beginWaarden, onVolgende, onVorige }) {
  const [klantInkomsten, setKlantInkomsten] = useState(beginWaarden?.klantInkomsten || []);
  const [partnerInkomsten, setPartnerInkomsten] = useState(beginWaarden?.partnerInkomsten || []);

  const klantNaam = gezin?.klant?.voornaam || 'Klant';
  const partnerNaam = gezin?.partner?.voornaam || 'Partner';

  function volgende() {
    onVolgende({ klantInkomsten, partnerInkomsten });
    
  }

  return (
    <div>
      <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#2A3933', marginBottom: '2rem', letterSpacing: '-0.5px', fontFamily: 'Lato, sans-serif' }}>
        Vul de huidige inkomsten in.
      </h2>

      <InkomstenBlok naam={klantNaam} inkomsten={klantInkomsten} setInkomsten={setKlantInkomsten} />

      {gezin?.partner && (
        <InkomstenBlok naam={partnerNaam} inkomsten={partnerInkomsten} setInkomsten={setPartnerInkomsten} />
      )}

    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '8px' }}>
  <button onClick={() => onVorige()} style={{ width: '100%', padding: '14px 28px', fontSize: '15px', fontWeight: '700', background: 'transparent', color: '#2A3933', border: '1px solid rgba(42,57,51,0.2)', borderRadius: '100px', cursor: 'pointer', fontFamily: 'Lato, sans-serif', letterSpacing: '-0.2px' }}>
    ← Vorige
  </button>
  <button onClick={volgende} style={{ width: '100%', padding: '14px 28px', fontSize: '15px', fontWeight: '700', background: '#2A3933', color: '#FFFFFF', border: 'none', borderRadius: '100px', cursor: 'pointer', fontFamily: 'Lato, sans-serif', letterSpacing: '-0.2px' }}>
    Volgende →
  </button>
</div>
    </div>
  );
}