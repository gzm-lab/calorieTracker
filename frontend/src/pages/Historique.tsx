import { useState, useEffect } from 'react';
import { useAuth } from '../auth';

interface DailyStats {
  date: string;
  total_calories: number;
  total_proteins: number;
  total_carbohydrates: number;
  total_fats: number;
  total_fiber: number;
  meal_count: number;
}

export default function Historique() {
  const { jwt } = useAuth();
  const [stats, setStats] = useState<DailyStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (jwt) {
      fetchDailyStats();
    }
  }, [jwt, selectedDate]);

  const fetchDailyStats = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/meals/stats/daily?date_filter=${selectedDate}`, {
        headers: {
          'Authorization': `Bearer ${jwt}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCalorieProgress = () => {
    if (!stats) return 0;
    // Objectif calorique moyen (à personnaliser)
    const dailyGoal = 2000;
    return Math.min((stats.total_calories / dailyGoal) * 100, 100);
  };

  const getMacroProgress = (current: number, goal: number) => {
    return Math.min((current / goal) * 100, 100);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8 text-center">Statistiques Quotidiennes</h1>
      
      {/* Sélecteur de date */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Sélectionner une date</h2>
          <button
            onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            Aujourd'hui
          </button>
        </div>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement des statistiques...</p>
        </div>
      ) : stats ? (
        <div className="space-y-6">
          {/* Résumé des calories */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Calories ({stats.date})</h2>
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">
                {stats.total_calories}
              </div>
              <div className="text-sm text-gray-600 mb-4">calories consommées</div>
              
              {/* Barre de progression */}
              <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
                <div 
                  className="bg-blue-600 h-4 rounded-full transition-all duration-300"
                  style={{ width: `${getCalorieProgress()}%` }}
                ></div>
              </div>
              <div className="text-sm text-gray-500">
                {getCalorieProgress().toFixed(1)}% de l'objectif quotidien (2000 cal)
              </div>
            </div>
          </div>

          {/* Macronutriments */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Macronutriments</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Protéines */}
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600 mb-1">
                  {stats.total_proteins}g
                </div>
                <div className="text-sm text-gray-600 mb-2">Protéines</div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full"
                    style={{ width: `${getMacroProgress(stats.total_proteins, 150)}%` }}
                  ></div>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {getMacroProgress(stats.total_proteins, 150).toFixed(1)}% de l'objectif
                </div>
              </div>

              {/* Glucides */}
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600 mb-1">
                  {stats.total_carbohydrates}g
                </div>
                <div className="text-sm text-gray-600 mb-2">Glucides</div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-yellow-600 h-2 rounded-full"
                    style={{ width: `${getMacroProgress(stats.total_carbohydrates, 250)}%` }}
                  ></div>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {getMacroProgress(stats.total_carbohydrates, 250).toFixed(1)}% de l'objectif
                </div>
              </div>

              {/* Lipides */}
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600 mb-1">
                  {stats.total_fats}g
                </div>
                <div className="text-sm text-gray-600 mb-2">Lipides</div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-red-600 h-2 rounded-full"
                    style={{ width: `${getMacroProgress(stats.total_fats, 65)}%` }}
                  ></div>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {getMacroProgress(stats.total_fats, 65).toFixed(1)}% de l'objectif
                </div>
              </div>

              {/* Fibres */}
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600 mb-1">
                  {stats.total_fiber}g
                </div>
                <div className="text-sm text-gray-600 mb-2">Fibres</div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-purple-600 h-2 rounded-full"
                    style={{ width: `${getMacroProgress(stats.total_fiber, 25)}%` }}
                  ></div>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {getMacroProgress(stats.total_fiber, 25).toFixed(1)}% de l'objectif
                </div>
              </div>
            </div>
          </div>

          {/* Résumé */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Résumé de la journée</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{stats.meal_count}</div>
                <div className="text-sm text-gray-600">Repas enregistrés</div>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {stats.total_calories > 0 ? (stats.total_calories / stats.meal_count).toFixed(0) : 0}
                </div>
                <div className="text-sm text-gray-600">Calories moyennes par repas</div>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {stats.total_proteins + stats.total_carbohydrates + stats.total_fats}g
                </div>
                <div className="text-sm text-gray-600">Total macronutriments</div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-lg p-6 text-center">
          <p className="text-gray-500">Aucune donnée pour cette date</p>
        </div>
      )}
    </div>
  );
} 