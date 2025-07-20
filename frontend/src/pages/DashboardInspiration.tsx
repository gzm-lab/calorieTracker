import { useState } from 'react';

const macroOptions = [
  { value: 'calories', label: 'Calories', icon: '🔥', color: '#6366f1', bg: '#eef2ff' },
  { value: 'proteins', label: 'Protéines', icon: '🥩', color: '#10b981', bg: '#ecfdf5' },
  { value: 'carbohydrates', label: 'Glucides', icon: '🍞', color: '#f59e42', bg: '#fff7ed' },
  { value: 'fats', label: 'Lipides', icon: '🥑', color: '#eab308', bg: '#fefce8' },
  { value: 'fiber', label: 'Fibres', icon: '🥕', color: '#a21caf', bg: '#f3e8ff' },
];

const fakeDay = {
  calories: 1870,
  proteins: 102,
  carbohydrates: 220,
  fats: 68,
  fiber: 28,
};
const goals = {
  calories: 2000,
  proteins: 120,
  carbohydrates: 250,
  fats: 70,
  fiber: 30,
};

export default function DashboardInspiration() {
  const [selected, setSelected] = useState('calories');
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #6366f1 0%, #a21caf 100%)',
      padding: 0,
      margin: 0,
      fontFamily: 'Inter, sans-serif',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
    }}>
      <div style={{ maxWidth: 480, width: '100%', margin: '0 auto', padding: '32px 12px 24px 12px' }}>
        {/* En-tête */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h1 style={{ color: 'white', fontWeight: 800, fontSize: 32, letterSpacing: -1, marginBottom: 8 }}>Suivi nutrition</h1>
          <div style={{ color: '#c7d2fe', fontSize: 17, fontWeight: 500 }}>Objectif : rester motivé chaque jour !</div>
        </div>
        {/* Mosaïque macros */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 18,
          marginBottom: 32,
        }}>
          {macroOptions.map(opt => {
            const value = fakeDay[opt.value as keyof typeof fakeDay];
            const goal = goals[opt.value as keyof typeof goals];
            const percent = Math.min((value / goal) * 100, 100);
            return (
              <div key={opt.value} style={{
                background: opt.bg,
                borderRadius: 24,
                boxShadow: '0 4px 24px #0001',
                padding: 20,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                minWidth: 0,
                cursor: 'pointer',
                border: selected === opt.value ? `2.5px solid ${opt.color}` : '2.5px solid transparent',
                transition: 'border 0.2s',
              }} onClick={() => setSelected(opt.value)}>
                <span style={{ fontSize: 36, marginBottom: 8 }}>{opt.icon}</span>
                <div style={{ fontWeight: 700, fontSize: 18, color: opt.color, marginBottom: 2 }}>{opt.label}</div>
                <div style={{ fontWeight: 800, fontSize: 28, color: '#1e293b', marginBottom: 4 }}>{value} <span style={{ fontWeight: 500, fontSize: 15, color: '#64748b' }}>{opt.value === 'calories' ? 'kcal' : 'g'}</span></div>
                <div style={{ width: '100%', height: 10, background: '#e5e7eb', borderRadius: 8, overflow: 'hidden', marginBottom: 6 }}>
                  <div style={{
                    width: percent + '%',
                    height: '100%',
                    background: `linear-gradient(90deg, ${opt.color} 60%, #fff 100%)`,
                    borderRadius: 8,
                    transition: 'width 0.7s cubic-bezier(.4,2,.6,1)',
                  }} />
                </div>
                <div style={{ fontSize: 13, color: '#64748b', fontWeight: 500 }}>{value} / {goal} {opt.value === 'calories' ? 'kcal' : 'g'}</div>
              </div>
            );
          })}
        </div>
        {/* Bloc motivation */}
        <div style={{
          background: 'rgba(255,255,255,0.95)',
          borderRadius: 20,
          boxShadow: '0 2px 16px #0001',
          padding: 24,
          textAlign: 'center',
          color: '#6366f1',
          fontWeight: 700,
          fontSize: 20,
          marginBottom: 16,
        }}>
          {selected === 'calories' && '🔥 Tu es à ' + fakeDay.calories + ' kcal aujourd’hui, continue comme ça !'}
          {selected === 'proteins' && '🥩 Les protéines sont la clé de la forme !'}
          {selected === 'carbohydrates' && '🍞 Les glucides te donnent de l’énergie !'}
          {selected === 'fats' && '🥑 Les bons lipides sont essentiels !'}
          {selected === 'fiber' && '🥕 Les fibres, c’est la santé !'}
        </div>
        {/* Footer */}
        <div style={{ textAlign: 'center', color: '#c7d2fe', fontSize: 14, marginTop: 32 }}>
          Prototype UI inspiration — <span style={{ fontWeight: 600 }}>CalorieTrack</span>
        </div>
      </div>
    </div>
  );
} 