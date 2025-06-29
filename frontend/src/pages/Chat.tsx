import { useState, useRef, useEffect } from 'react';
import { Heading, Card, Button, Flex } from '@radix-ui/themes';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';

export default function Chat() {
  const [messages, setMessages] = useState([
    { type: 'ai', text: 'Bonjour ! Je suis votre assistant nutritionnel.' }
  ]);
  const [input, setInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const navigate = useNavigate();
  const { jwt } = useAuth();

  // Macros state (formulaire)
  const [macros, setMacros] = useState({
    calories: '',
    proteins: '',
    carbohydrates: '',
    fats: '',
    fiber: '',
    meal_type: 'breakfast',
    name: '',
    description: '',
  });

  // Sélecteur de date
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // États pour les repas de l'API
  const [meals, setMeals] = useState<any[]>([]);
  const [loadingMeals, setLoadingMeals] = useState(false);
  const [errorMeals, setErrorMeals] = useState<string | null>(null);

  // Totaux dynamiques pour la journée
  const [dailyTotals, setDailyTotals] = useState({
    calories: 0,
    proteins: 0,
    carbohydrates: 0,
    fats: 0,
    fiber: 0
  });

  const [addStatus, setAddStatus] = useState<'idle' | 'loading' | 'success' | 'error'>("idle");
  const [addError, setAddError] = useState<string | null>(null);

  useEffect(() => {
    // Scroll to bottom on new message
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [input]);

  // Fonction pour récupérer les repas de la date sélectionnée
  const fetchMealsForDate = async (date: string) => {
    console.log('🔍 fetchMealsForDate appelé avec:', { date, jwt: jwt ? 'présent' : 'absent' });
    
    if (!jwt) {
      console.log('❌ JWT manquant, arrêt de la récupération');
      return;
    }
    
    setLoadingMeals(true);
    setErrorMeals(null);
    
    try {
      console.log('📡 Appel API vers:', `http://localhost:8000/meals/?date_filter=${date}`);
      const response = await fetch(`http://localhost:8000/meals/?date_filter=${date}`, {
        headers: {
          'Authorization': `Bearer ${jwt}`,
        },
      });
      
      console.log('📊 Réponse API:', { status: response.status, ok: response.ok });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.log('❌ Erreur API:', errorText);
        throw new Error(`Erreur ${response.status}: ${errorText || 'Erreur lors de la récupération des repas'}`);
      }
      
      const data = await response.json();
      console.log('✅ Données reçues:', data);
      setMeals(data);
      
      // Calculer les totaux de la journée
      const totals = data.reduce((acc: any, meal: any) => ({
        calories: acc.calories + (meal.calories || 0),
        proteins: acc.proteins + (meal.proteins || 0),
        carbohydrates: acc.carbohydrates + (meal.carbohydrates || 0),
        fats: acc.fats + (meal.fats || 0),
        fiber: acc.fiber + (meal.fiber || 0),
      }), { calories: 0, proteins: 0, carbohydrates: 0, fats: 0, fiber: 0 });
      
      console.log('📊 Totaux calculés:', totals);
      setDailyTotals(totals);
      
    } catch (error: any) {
      console.error('❌ Erreur complète:', error);
      setErrorMeals(error.message || 'Erreur inconnue');
    } finally {
      setLoadingMeals(false);
    }
  };

  // Effet pour récupérer les repas quand la date change
  useEffect(() => {
    console.log('🔄 Effet déclenché:', { jwt: jwt ? 'présent' : 'absent', selectedDate });
    if (jwt && selectedDate) {
      console.log('✅ Conditions remplies, appel de fetchMealsForDate');
      fetchMealsForDate(selectedDate);
    } else {
      console.log('❌ Conditions non remplies:', { jwt: !!jwt, selectedDate: !!selectedDate });
    }
  }, [jwt, selectedDate]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    setMessages((msgs) => [
      ...msgs,
      { type: 'user', text: input }
    ]);
    setInput('');
    setTimeout(() => {
      setMessages((msgs) => [
        ...msgs,
        { type: 'ai', text: 'coucou' }
      ]);
    }, 400);
  };

  const handleMacroChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setMacros((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddMacros = async () => {
    // Validation simple
    if (!macros.calories || !macros.proteins || !macros.carbohydrates || !macros.fats || !macros.fiber || !macros.meal_type) {
      setAddStatus('error');
      setAddError('Tous les champs macros et le type de repas sont obligatoires.');
      return;
    }
    setAddStatus('loading');
    setAddError(null);
    try {
      const res = await fetch('http://localhost:8000/meals/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jwt}`,
        },
        body: JSON.stringify({
          calories: parseFloat(macros.calories),
          proteins: parseFloat(macros.proteins),
          carbohydrates: parseFloat(macros.carbohydrates),
          fats: parseFloat(macros.fats),
          fiber: parseFloat(macros.fiber),
          meal_type: macros.meal_type,
          name: macros.name || macros.meal_type,
          description: macros.description,
          date: new Date(selectedDate).toISOString(),
        })
      });
      if (!res.ok) {
        const errorText = await res.text();
        setAddStatus('error');
        setAddError(errorText || 'Erreur lors de l’ajout du repas');
        return;
      }
      setAddStatus('success');
      setAddError(null);
      setMacros({ calories: '', proteins: '', carbohydrates: '', fats: '', fiber: '', meal_type: 'breakfast', name: '', description: '' });
      // Rafraîchir la liste des repas
      fetchMealsForDate(selectedDate);
    } catch (e: any) {
      setAddStatus('error');
      setAddError(e.message || 'Erreur inconnue');
    }
  };

  // Style unifié pour les inputs macros
  const macroInputStyle = {
    width: '100%',
    border: 'none',
    outline: 'none',
    borderRadius: 999,
    background: '#f8fafc',
    fontSize: 16,
    color: '#1e293b',
    padding: '12px 20px',
    marginBottom: 12,
    fontFamily: 'inherit',
    boxShadow: '0 1px 4px #0001',
    minWidth: 0,
    maxWidth: '100%',
    boxSizing: 'border-box' as const,
  };

  return (
    <div style={{
      width: '100vw',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'flex-start',
      background: '#f8fafc',
      paddingTop: 96,
      fontFamily: 'inherit',
    }}>
      <Card style={{ padding: 32, borderRadius: 16, boxShadow: '0 2px 16px #0001', marginBottom: 32, fontFamily: 'inherit' }}>
        <Heading as="h1" size="8" align="center" style={{ color: '#2563eb', fontFamily: 'inherit' }}>
          CalorieTrack
        </Heading>
      </Card>
      <Card style={{
        width: '100%',
        maxWidth: 800,
        minHeight: 400,
        display: 'flex',
        flexDirection: 'column',
        padding: 32,
        borderRadius: 16,
        boxShadow: '0 2px 16px #0001',
        marginLeft: 8,
        marginRight: 8,
        fontFamily: 'inherit',
        marginBottom: 32
      }}>
        <div style={{
          flex: 1,
          overflowY: 'auto',
          marginBottom: 16,
          padding: '0 8px',
          maxHeight: 320,
          fontFamily: 'inherit',
        }}>
          {messages.map((msg, i) => (
            <div key={i} style={{
              display: 'flex',
              justifyContent: msg.type === 'user' ? 'flex-end' : 'flex-start',
              marginBottom: 8,
              fontFamily: 'inherit',
            }}>
              <div style={{
                background: msg.type === 'user' ? '#2563eb' : '#f1f5f9',
                color: msg.type === 'user' ? 'white' : '#1e293b',
                borderRadius: 16,
                padding: '8px 16px',
                maxWidth: 520,
                fontSize: 15,
                boxShadow: '0 1px 4px #0001',
                wordBreak: 'break-word',
                fontFamily: 'inherit',
              }}>
                {msg.text}
              </div>
            </div>
          ))}
          
          {/* Affichage des repas de la date sélectionnée */}
          {loadingMeals && (
            <div style={{
              display: 'flex',
              justifyContent: 'flex-start',
              marginBottom: 8,
              fontFamily: 'inherit',
            }}>
              <div style={{
                background: '#f1f5f9',
                color: '#1e293b',
                borderRadius: 16,
                padding: '8px 16px',
                maxWidth: 520,
                fontSize: 15,
                boxShadow: '0 1px 4px #0001',
                fontFamily: 'inherit',
              }}>
                Chargement des repas...
              </div>
            </div>
          )}
          
          {errorMeals && (
            <div style={{
              display: 'flex',
              justifyContent: 'flex-start',
              marginBottom: 8,
              fontFamily: 'inherit',
            }}>
              <div style={{
                background: '#fef2f2',
                color: '#dc2626',
                borderRadius: 16,
                padding: '8px 16px',
                maxWidth: 520,
                fontSize: 15,
                boxShadow: '0 1px 4px #0001',
                fontFamily: 'inherit',
              }}>
                Erreur: {errorMeals}
              </div>
            </div>
          )}
          
          {!loadingMeals && !errorMeals && meals.length > 0 && (
            <div style={{
              display: 'flex',
              justifyContent: 'flex-start',
              marginBottom: 8,
              fontFamily: 'inherit',
            }}>
              <div style={{
                background: '#f0f9ff',
                color: '#1e293b',
                borderRadius: 16,
                padding: '16px',
                maxWidth: 520,
                fontSize: 15,
                boxShadow: '0 1px 4px #0001',
                fontFamily: 'inherit',
              }}>
                <div style={{ fontWeight: 600, marginBottom: 8, color: '#2563eb' }}>
                  📅 Repas du {new Date(selectedDate).toLocaleDateString('fr-FR')}
                </div>
                {meals.map((meal, index) => (
                  <div key={index} style={{ 
                    marginBottom: 8, 
                    padding: '8px 12px', 
                    background: 'white', 
                    borderRadius: 8,
                    border: '1px solid #e2e8f0'
                  }}>
                    <div style={{ fontWeight: 600, color: '#374151' }}>
                      {meal.name} ({meal.meal_type})
                      </div>
                    <div style={{ fontSize: 14, color: '#6b7280', marginBottom: 4 }}>
                      {meal.description}
                    </div>
                    <div style={{ fontSize: 13, color: '#059669' }}>
                      {meal.calories} kcal | {meal.proteins}g protéines | {meal.carbohydrates}g glucides | {meal.fats}g lipides | {meal.fiber}g fibres
                </div>
                </div>
                ))}
              </div>
            </div>
          )}
          
          {!loadingMeals && !errorMeals && meals.length === 0 && (
            <div style={{
              display: 'flex',
              justifyContent: 'flex-start',
              marginBottom: 8,
              fontFamily: 'inherit',
            }}>
              <div style={{
                background: '#f1f5f9',
                color: '#6b7280',
                borderRadius: 16,
                padding: '8px 16px',
                maxWidth: 520,
                fontSize: 15,
                boxShadow: '0 1px 4px #0001',
                fontFamily: 'inherit',
              }}>
                Aucun repas enregistré pour cette date
              </div>
            </div>
          )}
          
          <div ref={chatEndRef} />
        </div>
        <form onSubmit={handleSend} style={{
          display: 'flex',
          gap: 0,
          background: '#fff',
          borderRadius: 999,
          boxShadow: '0 1px 6px #0001',
          padding: 4,
          alignItems: 'flex-end',
          fontFamily: 'inherit',
        }}>
          <textarea
            ref={textareaRef}
            placeholder="Écrire un message..."
            value={input}
            onChange={e => setInput(e.target.value)}
            rows={1}
            style={{
              flex: 1,
              resize: 'none',
              border: 'none',
              outline: 'none',
              borderTopLeftRadius: 999,
              borderBottomLeftRadius: 999,
              borderTopRightRadius: 0,
              borderBottomRightRadius: 0,
              background: 'transparent',
              fontSize: 17,
              color: '#1e293b',
              padding: '12px 20px',
              minHeight: 48,
              maxHeight: 120,
              lineHeight: 1.4,
              overflowY: 'auto',
              fontFamily: 'inherit',
            }}
          />
          <Button
            type="submit"
            variant="solid"
            color="blue"
            size="3"
            style={{
              borderTopLeftRadius: 0,
              borderBottomLeftRadius: 0,
              borderTopRightRadius: 999,
              borderBottomRightRadius: 999,
              marginLeft: -2,
              minWidth: 100,
              fontSize: 17,
              alignSelf: 'stretch',
              fontFamily: 'inherit',
            }}
          >
            Envoyer
          </Button>
        </form>
      </Card>
      {/* Bloc Macros + Totaux */}
      <Card style={{
        width: '100%',
        maxWidth: 800,
        marginLeft: 8,
        marginRight: 8,
        marginBottom: 32,
        padding: 32,
        borderRadius: 16,
        boxShadow: '0 2px 16px #0001',
        fontFamily: 'inherit',
      }}>
        <Flex direction={{ initial: 'column', md: 'row' }} gap="6" align="stretch" justify="between" style={{ flexWrap: 'wrap' }}>
          {/* Formulaire macros */}
          <div style={{ flex: 1, minWidth: 0, maxWidth: '100%' }}>
            {/* Sélecteur de date */}
            <div style={{ marginBottom: 24 }}>
              <h3 style={{ fontWeight: 600, fontSize: 16, marginBottom: 12, color: '#374151' }}>Sélectionner une date</h3>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                    <input
                      type="date"
                      value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  style={{
                    ...macroInputStyle,
                    marginBottom: 0,
                    flex: 1,
                    minWidth: 200,
                    maxWidth: 300
                  }}
                />
                  <Button 
                  color="blue" 
                    variant="soft" 
                    size="2"
                  style={{ 
                    borderRadius: 999, 
                    fontFamily: 'inherit',
                    whiteSpace: 'nowrap'
                  }}
                    onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
                >
                  Aujourd'hui
                </Button>
              </div>
                </div>
            
            <h2 style={{ fontWeight: 600, fontSize: 20, marginBottom: 16, color: '#2563eb' }}>Saisir mes macros</h2>
            <form style={{ display: 'flex', flexDirection: 'column', gap: 0, width: '100%' }} onSubmit={e => { e.preventDefault(); handleAddMacros(); }}>
              <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
                <select
                  name="meal_type"
                  value={macros.meal_type}
                  onChange={handleMacroChange}
                  style={{ ...macroInputStyle, minWidth: 120, maxWidth: 180 }}
                  required
                >
                  <option value="breakfast">Petit déjeuner</option>
                  <option value="lunch">Déjeuner</option>
                  <option value="dinner">Dîner</option>
                  <option value="autre">Autre</option>
                </select>
                <input
                  name="name"
                  type="text"
                  placeholder="Nom du repas (optionnel)"
                  value={macros.name}
                  onChange={handleMacroChange}
                  style={{ ...macroInputStyle, minWidth: 120, maxWidth: 220 }}
                />
              </div>
              <input
                name="description"
                type="text"
                placeholder="Description (optionnel)"
                value={macros.description}
                onChange={handleMacroChange}
                style={{ ...macroInputStyle, marginBottom: 20 }}
              />
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', width: '100%' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                      <input
                    name="calories"
                        type="number"
                placeholder="Calories"
                value={macros.calories}
                onChange={handleMacroChange}
                style={{ ...macroInputStyle, marginBottom: 20 }}
              />
                      <input
                    name="proteins"
                        type="number"
                    placeholder="Protéines (g)"
                    value={macros.proteins}
                    onChange={handleMacroChange}
                    style={macroInputStyle}
                  />
                      <input
                    name="carbohydrates"
                        type="number"
                    placeholder="Glucides (g)"
                    value={macros.carbohydrates}
                    onChange={handleMacroChange}
                    style={macroInputStyle}
                      />
                    </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                      <input
                    name="fats"
                        type="number"
                    placeholder="Lipides (g)"
                    value={macros.fats}
                    onChange={handleMacroChange}
                    style={macroInputStyle}
                  />
                      <input
                    name="fiber"
                        type="number"
                    placeholder="Fibres (g)"
                    value={macros.fiber}
                    onChange={handleMacroChange}
                    style={macroInputStyle}
                      />
                    </div>
                  </div>
              <Button type="submit" color="green" variant="solid" size="3" style={{ marginTop: 16, borderRadius: 999, fontFamily: 'inherit' }} disabled={addStatus === 'loading'}>
                {addStatus === 'loading' ? 'Ajout…' : 'Ajouter'}
              </Button>
              {addStatus === 'success' && (
                <div style={{ color: '#059669', marginTop: 8, fontWeight: 500 }}>Repas ajouté !</div>
              )}
              {addStatus === 'error' && addError && (
                <div style={{ color: '#dc2626', marginTop: 8, fontWeight: 500 }}>{addError}</div>
              )}
            </form>
          </div>
          {/* Totaux du jour */}
          <div style={{ flex: 1, minWidth: 0, maxWidth: '100%' }}>
            <h2 style={{ fontWeight: 600, fontSize: 20, marginBottom: 16, color: '#2563eb' }}>Total de la journée</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input readOnly value={dailyTotals.calories + ' kcal'} style={macroInputStyle} />
              <input readOnly value={dailyTotals.proteins + ' g protéines'} style={macroInputStyle} />
              <input readOnly value={dailyTotals.carbohydrates + ' g glucides'} style={macroInputStyle} />
              <input readOnly value={dailyTotals.fats + ' g lipides'} style={macroInputStyle} />
              <input readOnly value={dailyTotals.fiber + ' g fibres'} style={macroInputStyle} />
                  </div>
                </div>
        </Flex>
        <div style={{ textAlign: 'center', marginTop: 32 }}>
          <Button color="blue" size="4" variant="soft" style={{ borderRadius: 999, fontFamily: 'inherit' }} onClick={() => navigate('/dashboard')}>
            Voir les dashboards
          </Button>
        </div>
      </Card>
    </div>
  );
} 
