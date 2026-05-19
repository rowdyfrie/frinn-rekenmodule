'use client';
import { useState } from 'react';

const inputStijl = { width: '100%', boxSizing: 'border-box', height: '42px', border: '1px solid rgba(42,57,51,0.2)', borderRadius: '100px', padding: '0 16px', fontSize: '14px', fontFamily: 'Lato, sans-serif', color: '#4a4a45', background: '#FFFFFF', outline: 'none' };
const labelStijl = { fontSize: '13px', fontWeight: '300', color: '#8a8a82', display: 'block', marginBottom: '6px', fontFamily: 'Lato, sans-serif' };
const sectieStijl = { fontSize: '11px', fontWeight: '700', letterSpacing: '0.08em', color: '#2A3933', textTransform: 'uppercase', marginBottom: '14px' };
const kaartStijl = { background: '#FFFFFF', borderRadius: '20px', padding: '28px', border: '1px solid rgba(42,57,51,0.1)', marginBottom: '12px' };

export default function StapGezin({ onVolgende }) {
  const [klant, setKlant] = useState({ naam: '', geboortedatum: '' });
  const [partner, setPartner] = useState(null);
  const [kinderen, setKinderen] = useState([]);

  function voegKindToe() {
    setKinderen([...kinderen, { id: Date.now(), naam: '', geboortedatum: '' }]);
  }

  function verwijderKind(id) {
    setKinderen(kinderen.filter(k => k.id !== id));
  }

  function updateKind(id, veld, waarde) {
    setKinderen(kinderen.map(k => k.id === id ? { ...k, [veld]: waarde } : k));
  }

  function volgende() {
    if (!klant.naam) { alert('Vul minimaal de naam van de klant in.'); return; }
    onVolgende({ klant, partner, kinderen });
  }

  return (
    <div>
      <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#2A3933', marginBottom: '0.4rem', letterSpacing: '-0.5px', fontFamily: 'Lato, sans-serif' }}>Wie is de klant?</h2>
      <p style={{ fontSize: '14px', color: '#8a8a82', marginBottom: '2rem', fontWeight: '300' }}>Vul de persoonsgegevens in om te beginnen.</p>

      <div style={kaartStijl}>
        <p style={sectieStijl}>Klant</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label style={labelStijl}>Naam</label>
            <input style={inputStijl} type="text" placeholder="Volledige naam" value={klant.naam} onChange={e => setKlant({ ...klant, naam: e.target.value })} />
          </div>
          <div>
            <label style={labelStijl}>Geboortedatum</label>
            <input style={{ ...inputStijl, borderRadius: '12px' }} type="date" value={klant.geboortedatum} onChange={e => setKlant({ ...klant, geboortedatum: e.target.value })} />
          </div>
        </div>
      </div>

      <div style={kaartStijl}>
        <p style={sectieStijl}>Partner</p>
        {!partner ? (
          <button onClick={() => setPartner({ naam: '', geboortedatum: '' })} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: '1px solid rgba(42,57,51,0.2)', borderRadius: '100px', padding: '8px 16px', fontSize: '13px', fontWeight: '700', color: '#2A3933', cursor: 'pointer', fontFamily: 'Lato, sans-serif' }}>
            + Partner toevoegen
          </button>
        ) : (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <div>
                <label style={labelStijl}>Naam partner</label>
                <input style={inputStijl} type="text" placeholder="Volledige naam" value={partner.naam} onChange={e => setPartner({ ...partner, naam: e.target.value })} />
              </div>
              <div>
                <label style={labelStijl}>Geboortedatum partner</label>
                <input style={{ ...inputStijl, borderRadius: '12px' }} type="date" value={partner.geboortedatum} onChange={e => setPartner({ ...partner, geboortedatum: e.target.value })} />
              </div>
            </div>
            <button onClick={() => setPartner(null)} style={{ background: 'none', border: 'none', fontSize: '13px', color: '#8a8a82', cursor: 'pointer', fontFamily: 'Lato, sans-serif', padding: 0 }}>
              × Partner verwijderen
            </button>
          </div>
        )}
      </div>

      <div style={kaartStijl}>
        <p style={sectieStijl}>Kinderen</p>
        {kinderen.map((kind, index) => (
          <div key={kind.id} style={{ background: '#F7F5F0', borderRadius: '12px', padding: '16px', marginBottom: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontSize: '13px', fontWeight: '700', color: '#2A3933' }}>Kind {index + 1}</span>
              <button onClick={() => verwijderKind(kind.id)} style={{ background: 'none', border: 'none', color: '#8a8a82', cursor: 'pointer', fontSize: '18px', lineHeight: 1 }}>×</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={labelStijl}>Naam</label>
                <input style={inputStijl} type="text" placeholder="Volledige naam" value={kind.naam} onChange={e => updateKind(kind.id, 'naam', e.target.value)} />
              </div>
              <div>
                <label style={labelStijl}>Geboortedatum</label>
                <input style={{ ...inputStijl, borderRadius: '12px' }} type="date" value={kind.geboortedatum} onChange={e => updateKind(kind.id, 'geboortedatum', e.target.value)} />
              </div>
            </div>
          </div>
        ))}
        <button onClick={voegKindToe} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: '1px solid rgba(42,57,51,0.2)', borderRadius: '100px', padding: '8px 16px', fontSize: '13px', fontWeight: '700', color: '#2A3933', cursor: 'pointer', fontFamily: 'Lato, sans-serif' }}>
          + Kind toevoegen
        </button>
      </div>

      <button onClick={volgende} style={{ width: '100%', padding: '14px 28px', fontSize: '15px', fontWeight: '700', background: '#c8e86a', color: '#2A3933', border: 'none', borderRadius: '100px', cursor: 'pointer', fontFamily: 'Lato, sans-serif', letterSpacing: '-0.2px' }}>
        Volgende →
      </button>
    </div>
  );
}