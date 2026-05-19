import PensioenCalculator from '@/components/PensioenCalculator';

export default function Home() {
  return (
    <main style={{ maxWidth: '720px', margin: '0 auto', padding: '2rem 1rem' }}>
      <h1 style={{ fontSize: '22px', fontWeight: '500', marginBottom: '0.5rem' }}>
        Pensioen planning
      </h1>
      <p style={{ fontSize: '14px', color: '#888', marginBottom: '2rem' }}>
        Frinn — financieel advies
      </p>
      <PensioenCalculator />
    </main>
  );
}