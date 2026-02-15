import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function LoginPage({ onLogin }) {
  const navigate = useNavigate();
  const [username, setUsername] = useState('123');
  const [password, setPassword] = useState('123');
  const [error, setError] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    const ok = onLogin({ username, password });
    if (ok) {
      navigate('/dashboard');
    } else {
      setError('Credenciais inválidas. Use 123 / 123.');
    }
  };

  return (
    <main className="center-screen">
      <form className="card login-card" onSubmit={handleSubmit}>
        <h1>BI Zap Dashboard</h1>
        <p>Login rápido (quick wins): 123 / 123</p>

        <label htmlFor="username">Usuário</label>
        <input id="username" value={username} onChange={(e) => setUsername(e.target.value)} />

        <label htmlFor="password">Senha</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error && <span className="error">{error}</span>}

        <button type="submit">Entrar</button>
      </form>
    </main>
  );
}
