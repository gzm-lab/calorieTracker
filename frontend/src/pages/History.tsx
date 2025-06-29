import { useAuth } from '../auth';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function History() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) return null;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h2 className="text-2xl font-bold mb-4">Historique</h2>
      <p>Affichage de l'historique à venir…</p>
    </div>
  );
} 