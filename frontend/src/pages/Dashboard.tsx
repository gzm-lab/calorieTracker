import { useState, useEffect } from 'react';
import { Button, Flex, Card } from '@radix-ui/themes';
import { useNavigate } from 'react-router-dom';
import { VictoryChart, VictoryBar, VictoryAxis, VictoryTheme, VictoryLine, VictoryLegend } from 'victory';
import { useAuth } from '../auth';

const macroOptions = [
  { value: 'calories', label: 'Calories' },
  { value: 'proteins', label: 'Protéines' },
  { value: 'carbohydrates', label: 'Glucides' },
  { value: 'fats', label: 'Lipides' },
];

const API_URL = '/api/meals/';

function aggregateMealsByDay(meals: any[]) {
  // Regroupe les repas par date et somme les macros
  const byDay: Record<string, any> = {};
  meals.forEach(m => {
    const date = m.date?.slice(0, 10);
    if (!date) return;
    if (!byDay[date]) {
      byDay[date] = {
        date,
        calories: 0,
        proteins: 0,
        carbohydrates: 0,
        fats: 0,
        fiber: 0,
      };
    }
    byDay[date].calories += m.calories || 0;
    byDay[date].proteins += m.proteins || 0;
    byDay[date].carbohydrates += m.carbohydrates || 0;
    byDay[date].fats += m.fats || 0;
    byDay[date].fiber += m.fiber || 0;
  });
  // Retourne un tableau trié par date croissante
  return Object.values(byDay).sort((a: any, b: any) => a.date.localeCompare(b.date));
}

export default function Dashboard() {
  const [macro, setMacro] = useState('calories');
  const [meals, setMeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { jwt } = useAuth();

  useEffect(() => {
    async function fetchMeals() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(API_URL, {
          headers: {
            'Authorization': `Bearer ${jwt}`,
          },
        });
        if (!res.ok) throw new Error('Erreur lors de la récupération des repas');
        const data = await res.json();
        setMeals(data);
      } catch (e: any) {
        setError(e.message || 'Erreur inconnue');
      } finally {
        setLoading(false);
      }
    }
    if (jwt) fetchMeals();
  }, [jwt]);

  // Agrégation par jour
  const mealsByDay = aggregateMealsByDay(meals);
  // On ne garde que les 30 derniers jours
  const last30Days = mealsByDay.slice(-30);
  // Adapter la donnée pour Victory (x = date, y = macro)
  const data = last30Days.map(d => ({ x: d.date, y: d[macro as keyof typeof mealsByDay[0]] as number }));

  // Calcul des moyennes
  const allValues = data.map(d => d.y);
  const allTimeAvg = allValues.length ? allValues.reduce((a, b) => a + b, 0) / allValues.length : 0;
  const avg30 = allValues.length ? allValues.slice(-30).reduce((a, b) => a + b, 0) / Math.min(30, allValues.length) : 0;
  const avg7 = allValues.length ? allValues.slice(-7).reduce((a, b) => a + b, 0) / Math.min(7, allValues.length) : 0;

  // Pour n'afficher qu'une date sur deux
  const xTickValues = data.map((d, i) => (i % 2 === 0 ? d.x : ''));

  return (
    <div style={{ width: '100vw', height: '100vh', background: 'transparent', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start' }}>
      {/* Bouton retour en haut à gauche */}
      <div style={{ position: 'absolute', top: 24, left: 24, zIndex: 10 }}>
        <Button color="blue" variant="soft" size="3" style={{ borderRadius: 999 }} onClick={() => navigate('/chat')}>
          Retour
        </Button>
      </div>
      <Flex gap="5" wrap="wrap" justify="center" style={{ margin: '32px 0 16px 0' }}>
        {macroOptions.map(opt => (
          <Button
            key={opt.value}
            variant={macro === opt.value ? "solid" : "soft"}
            color={macro === opt.value ? "blue" : "gray"}
            size="3"
            style={{ 
              borderRadius: 999,
              minWidth: 120,
              fontWeight: macro === opt.value ? 600 : 400,
              transition: 'all 0.2s ease',
              margin: 4
            }}
            onClick={() => setMacro(opt.value)}
          >
            {opt.label}
          </Button>
        ))}
      </Flex>
      <Card style={{ width: '100%', maxWidth: 900, margin: '0 auto', borderRadius: 20, boxShadow: '0 2px 24px #0002', padding: 32, background: 'var(--color-panel-solid)', minHeight: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '100%', height: 400 }}>
          {loading ? (
            <div style={{ textAlign: 'center', marginTop: 100, fontSize: 22, color: '#2563eb' }}>Chargement…</div>
          ) : error ? (
            <div style={{ textAlign: 'center', marginTop: 100, fontSize: 22, color: 'red' }}>{error}</div>
          ) : data.length === 0 ? (
            <div style={{ textAlign: 'center', marginTop: 100, fontSize: 22, color: '#2563eb' }}>Aucune donnée à afficher</div>
          ) : (
            <VictoryChart
              theme={VictoryTheme.material}
              domainPadding={20}
              width={800}
              height={400}
            >
              <VictoryAxis
                tickValues={data.map((d, _i) => d.x)}
                tickFormat={(_t, i) => xTickValues[i]}
                style={{
                  tickLabels: { fontSize: 13, angle: 40, padding: 20, fill: '#64748b' },
                  grid: { stroke: 'none' },
                  axis: { stroke: '#64748b', strokeWidth: 1 }
                }}
              />
              <VictoryAxis
                dependentAxis
                style={{
                  tickLabels: { fontSize: 15, fill: '#64748b' },
                  grid: { stroke: 'none' },
                  axis: { stroke: '#64748b', strokeWidth: 1 }
                }}
              />
              <VictoryBar
                data={data}
                style={{
                  data: {
                    fill: '#3b82f6',
                    stroke: '#1e293b',
                    strokeWidth: 1,
                    width: 12,
                    opacity: 0.85,
                  },
                }}
                barWidth={16}
              />
              <VictoryLine
                y={() => allTimeAvg}
                style={{ data: { stroke: '#2563eb', strokeDasharray: '6,6', strokeWidth: 2, opacity: 0.7 } }}
              />
              <VictoryLine
                y={() => avg30}
                style={{ data: { stroke: '#60a5fa', strokeDasharray: '4,4', strokeWidth: 2, opacity: 0.7 } }}
              />
              <VictoryLine
                y={() => avg7}
                style={{ data: { stroke: '#93c5fd', strokeDasharray: '2,6', strokeWidth: 2, opacity: 0.7 } }}
              />
            </VictoryChart>
          )}
        </div>
      </Card>
      {/* Légende sous le graphe */}
      <div style={{ width: 900, margin: '0 auto', marginTop: 8, display: 'flex', justifyContent: 'flex-end' }}>
        <VictoryLegend
          orientation="horizontal"
          gutter={24}
          style={{ labels: { fontSize: 13, fill: '#64748b' } }}
          data={[
            { name: 'Moyenne all time', symbol: { fill: '#2563eb', type: 'minus', strokeDasharray: '6,6' } },
            { name: 'Moyenne 30j', symbol: { fill: '#60a5fa', type: 'minus', strokeDasharray: '4,4' } },
            { name: 'Moyenne 7j', symbol: { fill: '#93c5fd', type: 'minus', strokeDasharray: '2,6' } },
          ]}
        />
      </div>
      {/* Moyennes sous le graphe */}
      <div style={{ marginTop: 24, textAlign: 'center', fontSize: 18, color: '#2563eb', fontWeight: 500 }}>
        Moyenne all time : <span style={{ color: '#2563eb' }}>{allTimeAvg.toFixed(1)}</span> &nbsp;|&nbsp;
        Moyenne 30j : <span style={{ color: '#2563eb' }}>{avg30.toFixed(1)}</span> &nbsp;|&nbsp;
        Moyenne 7j : <span style={{ color: '#2563eb' }}>{avg7.toFixed(1)}</span>
      </div>
    </div>
  );
} 