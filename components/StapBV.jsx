'use client';
import { useState } from 'react';
import { VPB_SCHIJVEN } from '@/lib/constants';

const inputStijl = { width: '100%', boxSizing: 'border-box', height: '42px', border: '1px solid rgba(42,57,51,0.2)', borderRadius: '100px', padding: '0 16px', fontSize: '14px', fontFamily: 'Lato, sans-serif', color: '#4a4a45', background: '#FFFFFF', outline: 'none' };
const labelStijl = { fontSize: '13px', fontWeight: '300', color: '#8a8a82', display: 'block', marginBottom: '6px', fontFamily: 'Lato, sans-serif' };
const sectieStijl = { fontSize: '11px', fontWeight: '700', letterSpacing: '0.08em', color: '#2A3933', textTransform: 'uppercase', margin: '0 0 14px 0' };
const kaartStijl = { background: '#FFFFFF', borderRadius: '20px', padding: '28px', border: '1px solid rgba(42,57,51,0.1)', marginBottom: '12px' };
const rij2 = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' };

function berekenVpb(winst) {
  if (winst <= 0) return 0;
  let belasting = 0, vorig = 0;
  for (const schijf of VPB_SCHIJVEN) {
    if (winst <= vorig) break;
    belasting += (Math.min(winst, schijf.grens) - vorig) * schijf.tarief;
    vorig = schijf.grens;
  }
  return belasting;
}

function fmtEuro(n) {
  return '€ ' + Math.round(n).toLocaleString('nl-NL');
}
const rij3 = { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '12px' };

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

function ToevoegenKnop({ label, onClick }) {
  return (
    <button onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: '1px solid rgba(42,57,51,0.2)', borderRadius: '100px', padding: '8px 16px', fontSize: '13px', fontWeight: '700', color: '#2A3933', cursor: 'pointer', fontFamily: 'Lato, sans-serif', marginTop: '4px' }}>
      + {label}
    </button>
  );
}

export default function StapBV({ beginWaarden, onVolgende, onVorige }) {
  const [bvAanwezig, setBvAanwezig] = useState(beginWaarden?.bvAanwezig || 'nee');
  const [bvs, setBvs] = useState(beginWaarden?.bvs || []);

  function voegBvToe() {
    setBvs(prev => [...prev, { id: Date.now(), naam: '', winst: '', vermogen: [], dividend: [] }]);
  }
  function verwijderBv(id) { setBvs(prev => prev.filter(b => b.id !== id)); }
  function updateBv(id, veld, waarde) { setBvs(prev => prev.map(b => b.id === id ? { ...b, [veld]: waarde } : b)); }

  function voegVermogenToe(bvId) {
    setBvs(prev => prev.map(b => b.id === bvId ? {
      ...b,
      vermogen: [...b.vermogen, { id: Date.now(), type: 'spaargeld', waarde: '', jaarlijksBedrag: '', rendement: '', huurinkomsten: '', kosten: '', waardestijging: '5' }],
    } : b));
  }
  function verwijderVermogen(bvId, vId) { setBvs(prev => prev.map(b => b.id === bvId ? { ...b, vermogen: b.vermogen.filter(v => v.id !== vId) } : b)); }
  function updateVermogen(bvId, vId, veld, waarde) { setBvs(prev => prev.map(b => b.id === bvId ? { ...b, vermogen: b.vermogen.map(v => v.id === vId ? { ...v, [veld]: waarde } : v) } : b)); }

  function voegDividendToe(bvId) {
    setBvs(prev => prev.map(b => b.id === bvId ? { ...b, dividend: [...b.dividend, { id: Date.now(), bedrag: '' }] } : b));
  }
  function verwijderDividend(bvId, dId) { setBvs(prev => prev.map(b => b.id === bvId ? { ...b, dividend: b.dividend.filter(d => d.id !== dId) } : b)); }
  function updateDividend(bvId, dId, waarde) { setBvs(prev => prev.map(b => b.id === bvId ? { ...b, dividend: b.dividend.map(d => d.id === dId ? { ...d, bedrag: waarde } : d) } : b)); }

  return (
    <div>
      <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#2A3933', marginBottom: '2rem', letterSpacing: '-0.5px', fontFamily: 'Lato, sans-serif' }}>
        BV planning.
      </h2>

      <div style={kaartStijl}>
        <label style={labelStijl}>BV aanwezig</label>
        <ToggleJaNee value={bvAanwezig} onChange={setBvAanwezig} />
      </div>

      {bvAanwezig === 'ja' && (
        <>
          {bvs.map((bv, index) => (
            <div key={bv.id} style={kaartStijl}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <p style={{ ...sectieStijl, margin: 0 }}>{bv.naam || `BV ${index + 1}`}</p>
                <button onClick={() => verwijderBv(bv.id)} style={{ background: 'none', border: 'none', color: '#cc4444', cursor: 'pointer', fontSize: '18px', lineHeight: 1 }}>×</button>
              </div>

              <div style={rij2}>
                <div>
                  <label style={labelStijl}>Naam BV</label>
                  <input style={inputStijl} type="text" placeholder="bijv. Holding BV" value={bv.naam} onChange={e => updateBv(bv.id, 'naam', e.target.value)} />
                </div>
                <div>
                  <label style={labelStijl}>Jaarlijkse winst voor Vpb</label>
                  <EuroInput value={bv.winst} onChange={e => updateBv(bv.id, 'winst', e.target.value)} />
                </div>
              </div>

              {/* Winst na Vpb */}
              {(parseFloat(bv.winst) || 0) > 0 && (() => {
                const winst = parseFloat(bv.winst);
                const vpb = berekenVpb(winst);
                return (
                  <div style={{ background: '#F7F5F0', borderRadius: '12px', padding: '12px 16px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', color: '#8a8a82', fontFamily: 'Lato, sans-serif' }}>Winst na Vpb ({fmtEuro(vpb)} belasting)</span>
                    <span style={{ fontSize: '16px', fontWeight: '700', color: '#2A3933', fontFamily: 'Lato, sans-serif' }}>{fmtEuro(winst - vpb)}</span>
                  </div>
                );
              })()}

              {/* Vermogensbestanddelen */}
              <div style={{ borderTop: '1px solid rgba(42,57,51,0.08)', paddingTop: '16px', marginTop: '4px' }}>
                <p style={sectieStijl}>Vermogensbestanddelen</p>
                {bv.vermogen.map((v, vi) => (
                  <div key={v.id} style={{ background: '#F7F5F0', borderRadius: '12px', padding: '16px', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <span style={{ fontSize: '13px', fontWeight: '700', color: '#2A3933' }}>Vermogen {vi + 1}</span>
                      <button onClick={() => verwijderVermogen(bv.id, v.id)} style={{ background: 'none', border: 'none', color: '#cc4444', cursor: 'pointer', fontSize: '18px', lineHeight: 1 }}>×</button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
                      {[
                        { value: 'spaargeld', label: 'Spaargeld / Beleggingen' },
                        { value: 'onroerend_goed', label: 'Onroerend goed' },
                      ].map(opt => (
                        <button key={opt.value} onClick={() => updateVermogen(bv.id, v.id, 'type', opt.value)} style={{ height: '42px', border: '1px solid rgba(42,57,51,0.2)', borderRadius: '100px', fontSize: '13px', fontFamily: 'Lato, sans-serif', fontWeight: v.type === opt.value ? '700' : '400', background: v.type === opt.value ? '#2A3933' : '#FFFFFF', color: v.type === opt.value ? '#FFFFFF' : '#4a4a45', cursor: 'pointer' }}>
                          {opt.label}
                        </button>
                      ))}
                    </div>

                    {v.type === 'spaargeld' && (
                      <div style={rij3}>
                        <div>
                          <label style={labelStijl}>Huidige waarde</label>
                          <EuroInput value={v.waarde} onChange={e => updateVermogen(bv.id, v.id, 'waarde', e.target.value)} />
                        </div>
                        <div>
                          <label style={labelStijl}>Jaarlijks bedrag</label>
                          <EuroInput value={v.jaarlijksBedrag} onChange={e => updateVermogen(bv.id, v.id, 'jaarlijksBedrag', e.target.value)} />
                        </div>
                        <div>
                          <label style={labelStijl}>Verwacht rendement (%)</label>
                          <input style={inputStijl} type="number" step="0.1" placeholder="0.0" value={v.rendement} onChange={e => updateVermogen(bv.id, v.id, 'rendement', e.target.value)} />
                        </div>
                      </div>
                    )}

                    {v.type === 'onroerend_goed' && (
                      <>
                        <div style={rij2}>
                          <div>
                            <label style={labelStijl}>Huidige waarde</label>
                            <EuroInput value={v.waarde} onChange={e => updateVermogen(bv.id, v.id, 'waarde', e.target.value)} />
                          </div>
                          <div>
                            <label style={labelStijl}>Waardestijging per jaar (%)</label>
                            <input style={inputStijl} type="number" step="0.1" placeholder="5.0" value={v.waardestijging} onChange={e => updateVermogen(bv.id, v.id, 'waardestijging', e.target.value)} />
                          </div>
                        </div>
                        <div style={rij2}>
                          <div>
                            <label style={labelStijl}>Maandelijkse huurinkomsten</label>
                            <EuroInput value={v.huurinkomsten} onChange={e => updateVermogen(bv.id, v.id, 'huurinkomsten', e.target.value)} />
                          </div>
                          <div>
                            <label style={labelStijl}>Maandelijkse kosten</label>
                            <EuroInput value={v.kosten} onChange={e => updateVermogen(bv.id, v.id, 'kosten', e.target.value)} />
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ))}
                <ToevoegenKnop label="Vermogen toevoegen" onClick={() => voegVermogenToe(bv.id)} />
              </div>

              {/* Dividenduitkering */}
              <div style={{ borderTop: '1px solid rgba(42,57,51,0.08)', paddingTop: '16px', marginTop: '16px' }}>
                <p style={sectieStijl}>Dividenduitkering vóór pensioendatum</p>
                {bv.dividend.map((d, di) => (
                  <div key={d.id} style={{ background: '#F7F5F0', borderRadius: '12px', padding: '16px', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <span style={{ fontSize: '13px', fontWeight: '700', color: '#2A3933' }}>Dividenduitkering {di + 1}</span>
                      <button onClick={() => verwijderDividend(bv.id, d.id)} style={{ background: 'none', border: 'none', color: '#cc4444', cursor: 'pointer', fontSize: '18px', lineHeight: 1 }}>×</button>
                    </div>
                    <div>
                      <label style={labelStijl}>Jaarlijks dividendbedrag</label>
                      <EuroInput value={d.bedrag} onChange={e => updateDividend(bv.id, d.id, e.target.value)} />
                    </div>
                  </div>
                ))}
                <ToevoegenKnop label="Dividenduitkering toevoegen" onClick={() => voegDividendToe(bv.id)} />
              </div>
            </div>
          ))}
          <div style={{ marginBottom: '12px' }}>
            <ToevoegenKnop label="BV toevoegen" onClick={voegBvToe} />
          </div>
        </>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '8px' }}>
        <button onClick={onVorige} style={{ width: '100%', padding: '14px 28px', fontSize: '15px', fontWeight: '700', background: 'transparent', color: '#2A3933', border: '1px solid rgba(42,57,51,0.2)', borderRadius: '100px', cursor: 'pointer', fontFamily: 'Lato, sans-serif' }}>
          ← Vorige
        </button>
        <button onClick={() => onVolgende({ bvAanwezig, bvs })} style={{ width: '100%', padding: '14px 28px', fontSize: '15px', fontWeight: '700', background: '#2A3933', color: '#FFFFFF', border: 'none', borderRadius: '100px', cursor: 'pointer', fontFamily: 'Lato, sans-serif' }}>
          Volgende →
        </button>
      </div>
    </div>
  );
}
