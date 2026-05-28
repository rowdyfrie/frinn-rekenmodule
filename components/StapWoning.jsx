'use client';
import { useState } from 'react';
import { WONINGWAARDE_STIJGING } from '@/lib/constants';

const inputStijl = { width: '100%', boxSizing: 'border-box', height: '42px', border: '1px solid rgba(42,57,51,0.2)', borderRadius: '100px', padding: '0 16px', fontSize: '14px', fontFamily: 'Lato, sans-serif', color: '#4a4a45', background: '#FFFFFF', outline: 'none' };
const selectStijl = { width: '100%', boxSizing: 'border-box', height: '42px', border: '1px solid rgba(42,57,51,0.2)', borderRadius: '100px', padding: '0 16px', fontSize: '14px', fontFamily: 'Lato, sans-serif', color: '#4a4a45', background: '#FFFFFF', outline: 'none', appearance: 'none', cursor: 'pointer' };
const labelStijl = { fontSize: '13px', fontWeight: '300', color: '#8a8a82', display: 'block', marginBottom: '6px', fontFamily: 'Lato, sans-serif' };
const sectieStijl = { fontSize: '11px', fontWeight: '700', letterSpacing: '0.08em', color: '#2A3933', textTransform: 'uppercase', marginBottom: '14px', margin: '0 0 14px 0' };
const kaartStijl = { background: '#FFFFFF', borderRadius: '20px', padding: '28px', border: '1px solid rgba(42,57,51,0.1)', marginBottom: '12px' };
const rij3 = { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '12px' };
const rij2 = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' };

function berekenMaandlast(schuld, rente, einddatum, type) {
  if (!schuld || !rente || !einddatum) return null;
  const nu = new Date();
  const eind = new Date(einddatum);
  const maanden = Math.round((eind - nu) / (1000 * 60 * 60 * 24 * 30.44));
  if (maanden <= 0) return null;
  const r = rente / 100 / 12;
  if (type === 'aflossingsvrij') return schuld * r;
  if (type === 'lineair') return (schuld / maanden) + (schuld * r);
  if (r === 0) return schuld / maanden;
  return schuld * (r * Math.pow(1 + r, maanden)) / (Math.pow(1 + r, maanden) - 1);
}

function fmtEuro(n) {
  return '€ ' + Math.round(n).toLocaleString('nl-NL');
}

function SelectWrapper({ style, children, ...props }) {
  return (
    <div style={{ position: 'relative' }}>
      <select style={style} {...props}>{children}</select>
      <span style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#8a8a82', fontSize: '12px' }}>▾</span>
    </div>
  );
}

function EuroInput({ value, onChange, placeholder }) {
  return (
    <div style={{ position: 'relative' }}>
      <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', fontSize: '13px', color: '#8a8a82', pointerEvents: 'none' }}>€</span>
      <input style={{ ...inputStijl, paddingLeft: '28px' }} type="number" placeholder={placeholder || '0'} value={value} onChange={onChange} />
    </div>
  );
}

function ToggleJaNee({ value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: '8px' }}>
      {['ja', 'nee'].map(opt => (
        <button key={opt} onClick={() => onChange(opt)} style={{ flex: 1, height: '42px', border: '1px solid rgba(42,57,51,0.2)', borderRadius: '100px', fontSize: '14px', fontFamily: 'Lato, sans-serif', fontWeight: value === opt ? '700' : '400', background: value === opt ? '#2A3933' : '#FFFFFF', color: value === opt ? '#FFFFFF' : '#4a4a45', cursor: 'pointer' }}>
          {opt.charAt(0).toUpperCase() + opt.slice(1)}
        </button>
      ))}
    </div>
  );
}

function ItemBlok({ titel, onVerwijder, children }) {
  return (
    <div style={{ background: '#F7F5F0', borderRadius: '12px', padding: '16px', marginBottom: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <span style={{ fontSize: '13px', fontWeight: '700', color: '#2A3933' }}>{titel}</span>
        <button onClick={onVerwijder} style={{ background: 'none', border: 'none', color: '#cc4444', cursor: 'pointer', fontSize: '18px', lineHeight: 1 }}>×</button>
      </div>
      {children}
    </div>
  );
}

function ToevoegenKnop({ label, onClick }) {
  return (
    <button onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: '1px solid rgba(42,57,51,0.2)', borderRadius: '100px', padding: '8px 16px', fontSize: '13px', fontWeight: '700', color: '#2A3933', cursor: 'pointer', fontFamily: 'Lato, sans-serif', marginTop: '4px' }}>
      + {label}
    </button>
  );
}

export default function StapWoning({ beginWaarden, onVolgende, onVorige }) {
  const [heeftWoning, setHeeftWoning] = useState(beginWaarden?.woningwaarde ? 'ja' : 'nee');
  const [woningwaarde, setWoningwaarde] = useState(beginWaarden?.woningwaarde ?? '');
  const [waardestijging, setWaardestijging] = useState(beginWaarden?.waardestijging ?? String(WONINGWAARDE_STIJGING * 100));
  const [leningdelen, setLeningdelen] = useState(beginWaarden?.leningdelen || []);

  const totaleSchuld = leningdelen.reduce((s, l) => s + (parseFloat(l.schuld) || 0), 0);
  const huidigeOverwaarde = Math.max(0, (parseFloat(woningwaarde) || 0) - totaleSchuld);

  function volgende() {
    if (heeftWoning === 'ja' && (!woningwaarde || parseFloat(woningwaarde) <= 0)) {
      alert('Vul de huidige woningwaarde in.');
      return;
    }
    if (heeftWoning === 'nee') {
      onVolgende({ woningwaarde: '', waardestijging: String(WONINGWAARDE_STIJGING * 100), leningdelen: [] });
    } else {
      onVolgende({ woningwaarde, waardestijging, leningdelen });
    }
  }

  function nieuwLeningdeel() {
    setLeningdelen(prev => [...prev, { id: Date.now(), schuld: '', rente: '', einddatum: '', type: 'annuitair', hra: 'nee' }]);
  }
  function verwijderLeningdeel(id) {
    setLeningdelen(prev => prev.filter(l => l.id !== id));
  }
  function updateLeningdeel(id, veld, waarde) {
    setLeningdelen(prev => prev.map(l => l.id === id ? { ...l, [veld]: waarde } : l));
  }

  return (
    <div>
      <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#2A3933', marginBottom: '2rem', letterSpacing: '-0.5px', fontFamily: 'Lato, sans-serif' }}>
        Woninggegevens.
      </h2>

      <div style={kaartStijl}>
        <label style={labelStijl}>Heeft u een eigen woning?</label>
        <ToggleJaNee value={heeftWoning} onChange={setHeeftWoning} />
      </div>

      {heeftWoning === 'ja' && (<>
      <div style={kaartStijl}>
        <p style={sectieStijl}>Woning</p>
        <div style={rij2}>
          <div>
            <label style={labelStijl}>Huidige woningwaarde</label>
            <EuroInput value={woningwaarde} onChange={e => setWoningwaarde(e.target.value)} />
          </div>
          <div>
            <label style={labelStijl}>Verwachte waardestijging per jaar (%)</label>
            <input style={inputStijl} type="number" step="0.1" placeholder="5.7" value={waardestijging} onChange={e => setWaardestijging(e.target.value)} />
          </div>
        </div>
        {(parseFloat(woningwaarde) > 0 || totaleSchuld > 0) && (
          <div style={{ background: '#F7F5F0', borderRadius: '12px', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', color: '#8a8a82', fontFamily: 'Lato, sans-serif' }}>Huidige overwaarde</span>
            <span style={{ fontSize: '16px', fontWeight: '700', color: '#2A3933', fontFamily: 'Lato, sans-serif' }}>{fmtEuro(huidigeOverwaarde)}</span>
          </div>
        )}
      </div>

      <div style={kaartStijl}>
        <p style={sectieStijl}>Hypotheek</p>
        {leningdelen.map((l, index) => {
          const maandlast = berekenMaandlast(parseFloat(l.schuld), parseFloat(l.rente), l.einddatum, l.type);
          return (
            <ItemBlok key={l.id} titel={`Leningdeel ${index + 1}`} onVerwijder={() => verwijderLeningdeel(l.id)}>
              <div style={rij3}>
                <div>
                  <label style={labelStijl}>Huidige schuld</label>
                  <EuroInput value={l.schuld} onChange={e => updateLeningdeel(l.id, 'schuld', e.target.value)} />
                </div>
                <div>
                  <label style={labelStijl}>Rente (%)</label>
                  <input style={inputStijl} type="number" step="0.01" placeholder="0.00" value={l.rente} onChange={e => updateLeningdeel(l.id, 'rente', e.target.value)} />
                </div>
                <div>
                  <label style={labelStijl}>Einddatum lening</label>
                  <input style={{ ...inputStijl, borderRadius: '12px' }} type="date" value={l.einddatum} onChange={e => updateLeningdeel(l.id, 'einddatum', e.target.value)} />
                </div>
              </div>
              <div style={rij2}>
                <div>
                  <label style={labelStijl}>Type lening</label>
                  <SelectWrapper style={selectStijl} value={l.type} onChange={e => updateLeningdeel(l.id, 'type', e.target.value)}>
                    <option value="annuitair">Annuitair</option>
                    <option value="lineair">Lineair</option>
                    <option value="aflossingsvrij">Aflossingsvrij</option>
                  </SelectWrapper>
                </div>
                <div>
                  <label style={labelStijl}>Hypotheekrenteaftrek</label>
                  <ToggleJaNee value={l.hra} onChange={v => updateLeningdeel(l.id, 'hra', v)} />
                </div>
              </div>
              {maandlast !== null && (
                <div style={{ background: '#FFFFFF', borderRadius: '8px', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', color: '#8a8a82', fontFamily: 'Lato, sans-serif' }}>Berekende maandlast</span>
                  <span style={{ fontSize: '16px', fontWeight: '700', color: '#2A3933', fontFamily: 'Lato, sans-serif' }}>{fmtEuro(maandlast)}</span>
                </div>
              )}
            </ItemBlok>
          );
        })}
        <ToevoegenKnop label="Leningdeel toevoegen" onClick={nieuwLeningdeel} />
      </div>
      </>)}

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
