'use client';
import { useState } from 'react';

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
  const maandrente = rente / 100 / 12;
  if (type === 'aflossingsvrij') return schuld * maandrente;
  if (type === 'lineair') return (schuld / maanden) + (schuld * maandrente);
  if (type === 'annuitair') {
    if (maandrente === 0) return schuld / maanden;
    return schuld * (maandrente * Math.pow(1 + maandrente, maanden)) / (Math.pow(1 + maandrente, maanden) - 1);
  }
  return null;
}

function fmt(n) {
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
        <button key={opt} onClick={() => onChange(opt)} style={{ flex: 1, height: '42px', border: '1px solid rgba(42,57,51,0.2)', borderRadius: '100px', fontSize: '14px', fontFamily: 'Lato, sans-serif', fontWeight: value === opt ? '700' : '400', background: value === opt ? '#2A3933' : '#FFFFFF', color: value === opt ? '#FFFFFF' : '#4a4a45', cursor: 'pointer', textTransform: 'capitalize' }}>
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

export default function StapUitgaven({ gezin, beginWaarden, onVolgende, onVorige }) {
  const heeftPartner = !!gezin?.partner;
  const klantNaam = gezin?.klant?.voornaam || 'Klant';
  const partnerNaam = gezin?.partner?.voornaam || 'Partner';

  const [leningdelen, setLeningdelen] = useState(beginWaarden?.leningdelen || []);
  const [spaaren, setSpaaren] = useState(beginWaarden?.spaaren || []);
  const [lijfrentes, setLijfrentes] = useState(beginWaarden?.lijfrentes || []);
  const [overig, setOverig] = useState(beginWaarden?.overig || []);

  function nieuw(setter, velden) {
    setter(prev => [...prev, { id: Date.now(), ...velden }]);
  }

  function verwijder(setter, id) {
    setter(prev => prev.filter(i => i.id !== id));
  }

  function update(setter, id, veld, waarde) {
    setter(prev => prev.map(i => i.id === id ? { ...i, [veld]: waarde } : i));
  }

  return (
    <div>
      <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#2A3933', marginBottom: '2rem', letterSpacing: '-0.5px', fontFamily: 'Lato, sans-serif' }}>
        Uitgaven en vermogensopbouw.
      </h2>

      {/* Hypotheek */}
      <div style={kaartStijl}>
        <p style={sectieStijl}>Hypotheek</p>
        {leningdelen.map((l, index) => {
          const maandlast = berekenMaandlast(l.schuld, l.rente, l.einddatum, l.type);
          return (
            <ItemBlok key={l.id} titel={`Leningdeel ${index + 1}`} onVerwijder={() => verwijder(setLeningdelen, l.id)}>
              <div style={rij3}>
                <div>
                  <label style={labelStijl}>Huidige schuld</label>
                  <EuroInput value={l.schuld} onChange={e => update(setLeningdelen, l.id, 'schuld', e.target.value)} />
                </div>
                <div>
                  <label style={labelStijl}>Rente (%)</label>
                  <input style={inputStijl} type="number" step="0.01" placeholder="0.00" value={l.rente} onChange={e => update(setLeningdelen, l.id, 'rente', e.target.value)} />
                </div>
                <div>
                  <label style={labelStijl}>Einddatum lening</label>
                  <input style={{ ...inputStijl, borderRadius: '12px' }} type="date" value={l.einddatum} onChange={e => update(setLeningdelen, l.id, 'einddatum', e.target.value)} />
                </div>
              </div>
              <div style={rij2}>
                <div>
                  <label style={labelStijl}>Type lening</label>
                  <SelectWrapper style={selectStijl} value={l.type} onChange={e => update(setLeningdelen, l.id, 'type', e.target.value)}>
                    <option value="annuitair">Annuitair</option>
                    <option value="lineair">Lineair</option>
                    <option value="aflossingsvrij">Aflossingsvrij</option>
                  </SelectWrapper>
                </div>
                <div>
                  <label style={labelStijl}>Hypotheekrenteaftrek</label>
                  <ToggleJaNee value={l.hra} onChange={v => update(setLeningdelen, l.id, 'hra', v)} />
                </div>
              </div>
              {maandlast && (
                <div style={{ background: '#FFFFFF', borderRadius: '8px', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', color: '#8a8a82', fontFamily: 'Lato, sans-serif' }}>Berekende maandlast</span>
                  <span style={{ fontSize: '16px', fontWeight: '700', color: '#2A3933', fontFamily: 'Lato, sans-serif' }}>{fmt(maandlast)}</span>
                </div>
              )}
            </ItemBlok>
          );
        })}
        <ToevoegenKnop label="Leningdeel toevoegen" onClick={() => nieuw(setLeningdelen, { schuld: '', rente: '', einddatum: '', type: 'annuitair', hra: 'nee' })} />
      </div>

      {/* Sparen en beleggen */}
      <div style={kaartStijl}>
        <p style={sectieStijl}>Sparen en beleggen</p>
        {spaaren.map((s, index) => (
          <ItemBlok key={s.id} titel={`Rekening ${index + 1}`} onVerwijder={() => verwijder(setSpaaren, s.id)}>
            <div style={rij3}>
              <div>
                <label style={labelStijl}>Maandelijkse inleg</label>
                <EuroInput value={s.inleg} onChange={e => update(setSpaaren, s.id, 'inleg', e.target.value)} />
              </div>
              <div>
                <label style={labelStijl}>Huidige waarde</label>
                <EuroInput value={s.waarde} onChange={e => update(setSpaaren, s.id, 'waarde', e.target.value)} />
              </div>
              <div>
                <label style={labelStijl}>Verwacht rendement (%)</label>
                <input style={inputStijl} type="number" step="0.1" placeholder="0.0" value={s.rendement} onChange={e => update(setSpaaren, s.id, 'rendement', e.target.value)} />
              </div>
            </div>
            <div>
              <label style={labelStijl}>Meerekenen om pensioengat te dichten</label>
              <ToggleJaNee value={s.pensioengat} onChange={v => update(setSpaaren, s.id, 'pensioengat', v)} />
            </div>
          </ItemBlok>
        ))}
        <ToevoegenKnop label="Rekening toevoegen" onClick={() => nieuw(setSpaaren, { inleg: '', waarde: '', rendement: '', pensioengat: 'nee' })} />
      </div>

      {/* Lijfrente */}
      <div style={kaartStijl}>
        <p style={sectieStijl}>Lijfrente</p>
        {lijfrentes.map((l, index) => (
          <ItemBlok key={l.id} titel={`Lijfrente ${index + 1}`} onVerwijder={() => verwijder(setLijfrentes, l.id)}>
            <div style={rij3}>
              <div>
                <label style={labelStijl}>Maandelijkse inleg</label>
                <EuroInput value={l.inleg} onChange={e => update(setLijfrentes, l.id, 'inleg', e.target.value)} />
              </div>
              <div>
                <label style={labelStijl}>Huidige waarde</label>
                <EuroInput value={l.waarde} onChange={e => update(setLijfrentes, l.id, 'waarde', e.target.value)} />
              </div>
              <div>
                <label style={labelStijl}>Verwacht rendement (%)</label>
                <input style={inputStijl} type="number" step="0.1" placeholder="0.0" value={l.rendement} onChange={e => update(setLijfrentes, l.id, 'rendement', e.target.value)} />
              </div>
            </div>
            <div>
              <label style={labelStijl}>Voor wie</label>
              <SelectWrapper style={selectStijl} value={l.voor} onChange={e => update(setLijfrentes, l.id, 'voor', e.target.value)}>
                <option value="klant">{klantNaam}</option>
                {heeftPartner && <option value="partner">{partnerNaam}</option>}
              </SelectWrapper>
            </div>
          </ItemBlok>
        ))}
        <ToevoegenKnop label="Lijfrente toevoegen" onClick={() => nieuw(setLijfrentes, { inleg: '', waarde: '', rendement: '', voor: 'klant' })} />
      </div>

      {/* Overig */}
      <div style={kaartStijl}>
        <p style={sectieStijl}>Overig</p>
        {overig.map((o, index) => (
          <ItemBlok key={o.id} titel={`Overige uitgave ${index + 1}`} onVerwijder={() => verwijder(setOverig, o.id)}>
            <div style={rij3}>
              <div>
                <label style={labelStijl}>Omschrijving</label>
                <input style={inputStijl} type="text" placeholder="bijv. studielening" value={o.omschrijving} onChange={e => update(setOverig, o.id, 'omschrijving', e.target.value)} />
              </div>
              <div>
                <label style={labelStijl}>Maandbedrag</label>
                <EuroInput value={o.bedrag} onChange={e => update(setOverig, o.id, 'bedrag', e.target.value)} />
              </div>
              <div>
                <label style={labelStijl}>Einddatum</label>
                <input style={{ ...inputStijl, borderRadius: '12px' }} type="date" value={o.einddatum} onChange={e => update(setOverig, o.id, 'einddatum', e.target.value)} />
              </div>
            </div>
          </ItemBlok>
        ))}
        <ToevoegenKnop label="Uitgave toevoegen" onClick={() => nieuw(setOverig, { omschrijving: '', bedrag: '', einddatum: '' })} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '8px' }}>
        <button onClick={onVorige} style={{ width: '100%', padding: '14px 28px', fontSize: '15px', fontWeight: '700', background: 'transparent', color: '#2A3933', border: '1px solid rgba(42,57,51,0.2)', borderRadius: '100px', cursor: 'pointer', fontFamily: 'Lato, sans-serif' }}>
          ← Vorige
        </button>
        <button onClick={() => onVolgende({ leningdelen, spaaren, lijfrentes, overig })} style={{ width: '100%', padding: '14px 28px', fontSize: '15px', fontWeight: '700', background: '#2A3933', color: '#FFFFFF', border: 'none', borderRadius: '100px', cursor: 'pointer', fontFamily: 'Lato, sans-serif' }}>
          Volgende →
        </button>
      </div>
    </div>
  );
}