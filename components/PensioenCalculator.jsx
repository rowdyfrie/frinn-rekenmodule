'use client';
import { useState } from 'react';

export default function PensioenCalculator() {
  const [form, setForm] = useState({
    leeftijd: 35,
    pensioenleeftijd: 67,
    inkomen: 75000,
    gewenst: 3000,
    opbouw: 5000,
    lijfrente: 20000,
  });
  const [resultaat, setResultaat] = useState(null);

  function update(e) {
    setForm({ ...form, [e.target.name]: parseFloat(e.target.value) });
  }

  function bereken() {
    const { leeftijd, pensioenleeftijd, gewenst, opbouw, lijfrente } = form;
    const jaren = pensioenleeftijd - leeftijd;
    const rendement = 0.04;
    const duur = 87 - pensioenleeftijd;
    const aow = 1400;
    const opbouwBij = opbouw * ((Math.pow(1 + rendement, jaren) - 1) / rendement);
    const lijfrenteBij = lijfrente * Math.pow(1 + rendement, jaren);
    const totaal = opbouwBij + lijfrenteBij;
    const maand = totaal / (duur * 12) + aow;
    const verschil = maand - gewenst;
    setResultaat({ maand: Math.round(maand), verschil: Math.round(verschil) });
  }

  const velden = [
    { name: 'leeftijd', label: 'Huidige leeftijd', euro: false },
    { name: 'pensioenleeftijd', label: 'Gewenste pensioenleeftijd', euro: false },
    { name: 'inkomen', label: 'Bruto jaarinkomen', euro: true },
    { name: 'gewenst', label: 'Gewenst netto maandinkomen', euro: true },
    { name: 'opbouw', label: 'Pensioenopbouw werkgever (jaarlijks)', euro: true },
    { name: 'lijfrente', label: 'Lijfrente / eigen spaarpot (totaal)', euro: true },
  ];

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
        {velden.map(v => (
          <div key={v.name}>
            <label style={{ fontSize: '13px', color: '#888', display: 'block', marginBottom: '4px' }}>
              {v.label}
            </label>
            <div style={{ position: 'relative' }}>
              {v.euro && <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '13px', color: '#888' }}>€</span>}
              <input
                type="number"
                name={v.name}
                value={form[v.name]}
                onChange={update}
                style={{ width: '100%', paddingLeft: v.euro ? '24px' : '10px', paddingRight: '10px', height: '36px', border: '0.5px solid #ccc', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
              />
            </div>
          </div>
        ))}
      </div>

      <button onClick={bereken} style={{ width: '100%', padding: '10px', fontSize: '14px', fontWeight: '500', border: '0.5px solid #ccc', borderRadius: '8px', background: 'transparent', cursor: 'pointer', marginBottom: '20px' }}>
        Bereken pensioen
      </button>

      {resultaat && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
          <div style={{ background: '#f5f5f3', borderRadius: '8px', padding: '14px' }}>
            <div style={{ fontSize: '12px', color: '#888', marginBottom: '4px' }}>Verwacht maandinkomen</div>
            <div style={{ fontSize: '20px', fontWeight: '500' }}>€ {resultaat.maand.toLocaleString('nl-NL')}</div>
          </div>
          <div style={{ background: '#f5f5f3', borderRadius: '8px', padding: '14px' }}>
            <div style={{ fontSize: '12px', color: '#888', marginBottom: '4px' }}>Gewenst maandinkomen</div>
            <div style={{ fontSize: '20px', fontWeight: '500' }}>€ {form.gewenst.toLocaleString('nl-NL')}</div>
          </div>
          <div style={{ background: '#f5f5f3', borderRadius: '8px', padding: '14px' }}>
            <div style={{ fontSize: '12px', color: '#888', marginBottom: '4px' }}>Tekort / overschot</div>
            <div style={{ fontSize: '20px', fontWeight: '500', color: resultaat.verschil >= 0 ? '#1D9E75' : '#E24B4A' }}>
              {resultaat.verschil >= 0 ? '+' : ''}€ {resultaat.verschil.toLocaleString('nl-NL')}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}