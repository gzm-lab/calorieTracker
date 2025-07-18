import { useState, useEffect } from 'react';
import { Button, Flex, Card } from '@radix-ui/themes';
import { useNavigate } from 'react-router-dom';
import { VictoryChart, VictoryBar, VictoryAxis, VictoryTheme, VictoryLine } from 'victory';
import { useAuth } from '../auth';
import * as AlertDialog from '@radix-ui/react-alert-dialog';

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
  const { jwt, logout } = useAuth();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

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
        if (res.status === 401) {
          setShowLogoutDialog(true);
          return;
        }
        if (!res.ok) throw new Error('Erreur lors de la récupération des repas');
        const data = await res.json();
        setMeals(data);
      } catch (e: any) {
        if (e.message && e.message.includes('401')) {
          setShowLogoutDialog(true);
        } else {
          setError(e.message || 'Erreur inconnue');
        }
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
    <>
      <AlertDialog.Root open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialog.Portal>
          <AlertDialog.Overlay className="fixed inset-0 bg-black/40 z-50" />
          <AlertDialog.Content className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-xl p-8 max-w-sm w-full flex flex-col items-center">
            <AlertDialog.Title className="text-xl font-bold mb-2 text-red-600">Session expirée</AlertDialog.Title>
            <AlertDialog.Description className="mb-6 text-gray-700 text-center">
              Votre session a expiré ou vous n'êtes plus authentifié.<br />Veuillez vous reconnecter.
            </AlertDialog.Description>
            <AlertDialog.Action asChild>
              <button
                className="px-6 py-3 rounded-lg bg-blue-700 text-white font-semibold hover:bg-blue-800 transition text-base w-full"
                onClick={() => {
                  logout();
                  setShowLogoutDialog(false);
                  window.location.href = '/login';
                }}
              >
                Se déconnecter
              </button>
            </AlertDialog.Action>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>
      <div style={{ width: '100%', minHeight: '100vh', background: '#f8fafc', padding: '0 8px', margin: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', overflowY: 'auto' }}>
        {/* Bouton retour sticky */}
        <div style={{ position: 'sticky', top: 0, left: 0, zIndex: 10, background: 'rgba(248,250,252,0.95)', width: '100%', padding: 12, marginBottom: 8 }}>
          <Button color="blue" variant="soft" size="3" style={{ borderRadius: 999 }} onClick={() => navigate('/chat')}>
            Retour
          </Button>
        </div>
        {/* Filtres macros scrollables */}
        <div style={{ width: '100%', overflowX: 'auto', margin: '0 auto 16px auto', paddingBottom: 4 }}>
          <Flex gap="3" wrap="nowrap" justify="center" style={{ minWidth: 320 }}>
            {macroOptions.map(opt => (
              <Button
                key={opt.value}
                variant={macro === opt.value ? "solid" : "soft"}
                color={macro === opt.value ? "blue" : "gray"}
                size="3"
                style={{ borderRadius: 999, minWidth: 110, fontWeight: macro === opt.value ? 600 : 400, boxShadow: '0 1px 4px #0001', margin: 2, padding: '8px 18px', fontSize: 15 }}
                onClick={() => setMacro(opt.value)}
              >
                {opt.label}
              </Button>
            ))}
          </Flex>
        </div>
        {/* Bloc Graphe + Légende */}
        <Card style={{ width: '100%', maxWidth: 500, margin: '0 auto', borderRadius: 20, boxShadow: '0 2px 24px #0002', padding: 16, background: 'var(--color-panel-solid)', minHeight: 180, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', marginBottom: 22 }}>
          <div style={{ width: '100%', height: 180 }}>
            {loading ? (
              <div style={{ textAlign: 'center', marginTop: 40, fontSize: 18, color: '#2563eb' }}>Chargement…</div>
            ) : error ? (
              <div style={{ textAlign: 'center', marginTop: 40, fontSize: 18, color: 'red' }}>{error}</div>
            ) : data.length === 0 ? (
              <div style={{ textAlign: 'center', marginTop: 40, fontSize: 18, color: '#2563eb' }}>Aucune donnée à afficher</div>
            ) : (
              <VictoryChart
                theme={VictoryTheme.material}
                domainPadding={20}
                width={window.innerWidth < 600 ? 320 : 400}
                height={window.innerWidth < 600 ? 140 : 180}
                padding={{ left: 40, right: 20, top: 20, bottom: 50 }}
              >
                <VictoryAxis
                  tickValues={data.map((d, _i) => d.x)}
                  tickFormat={(_t, i) => xTickValues[i]}
                  style={{
                    tickLabels: { fontSize: 10, angle: 40, padding: 10, fill: '#64748b' },
                    grid: { stroke: 'none' },
                    axis: { stroke: '#64748b', strokeWidth: 1 }
                  }}
                />
                <VictoryAxis
                  dependentAxis
                  style={{
                    tickLabels: { fontSize: 10, fill: '#64748b' },
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
                      width: 8,
                      opacity: 0.85,
                    },
                  }}
                  barWidth={window.innerWidth < 600 ? 8 : 10}
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
          {/* Légende compacte sous le graphe */}
          <div style={{ width: '100%', marginTop: 8, display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap', fontSize: 12, color: '#2563eb' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ display: 'inline-block', width: 18, height: 2, background: '#2563eb', borderRadius: 2, marginRight: 4, borderBottom: '1.5px dashed #2563eb' }}></span>
              Moyenne all time
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ display: 'inline-block', width: 18, height: 2, background: '#60a5fa', borderRadius: 2, marginRight: 4, borderBottom: '1.5px dashed #60a5fa' }}></span>
              Moyenne 30j
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ display: 'inline-block', width: 18, height: 2, background: '#93c5fd', borderRadius: 2, marginRight: 4, borderBottom: '1.5px dashed #93c5fd' }}></span>
              Moyenne 7j
            </span>
          </div>
        </Card>
        {/* Bloc Moyennes */}
        <Card style={{ width: '100%', maxWidth: 500, margin: '0 auto', borderRadius: 16, boxShadow: '0 1px 8px #0001', padding: 16, background: 'white', marginBottom: 32, textAlign: 'center', fontSize: 16, color: '#2563eb', fontWeight: 500 }}>
          Moyenne all time : <span style={{ color: '#2563eb' }}>{allTimeAvg.toFixed(1)}</span> &nbsp;|&nbsp;
          Moyenne 30j : <span style={{ color: '#2563eb' }}>{avg30.toFixed(1)}</span> &nbsp;|&nbsp;
          Moyenne 7j : <span style={{ color: '#2563eb' }}>{avg7.toFixed(1)}</span>
        </Card>
      </div>
    </>
  );
} 