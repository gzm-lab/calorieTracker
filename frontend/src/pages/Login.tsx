import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/auth/jwt/login', {
        method: 'POST',
        body: new URLSearchParams({
          username: email,
          password,
        }),
      });
      if (!response.ok) {
        const errorText = await response.text();
        setError(`Erreur ${response.status}: ${errorText || 'Identifiants invalides'}`);
        setLoading(false);
        return;
      }
      const data = await response.json();
      login(data.access_token);
      navigate('/chat');
    } catch (err) {
      setError("Erreur de connexion au serveur");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-2">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 flex flex-col items-center">
        <h2 className="text-3xl font-extrabold mb-6 text-center text-blue-700">Connexion</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
            required
            autoComplete="username"
          />
          <input
            type="password"
            placeholder="Mot de passe"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
            required
            autoComplete="current-password"
          />
          <button
            type="submit"
            className="px-4 py-3 rounded-lg bg-blue-700 text-white font-semibold hover:bg-blue-800 transition text-base"
            disabled={loading}
          >
            {loading ? 'Connexion…' : 'Se connecter'}
          </button>
          {error && <div className="text-red-600 text-sm text-center">{error}</div>}
        </form>
      </div>
    </div>
  );
} 