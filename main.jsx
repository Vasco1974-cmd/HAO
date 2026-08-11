import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import Dashboard from './Dashboard.jsx';

// O Dashboard de Produção é público (sem login) e vive em '#dashboard'.
// Isso funciona em qualquer hospedagem estática (Vercel, etc.) sem precisar
// configurar rewrites no servidor, porque tudo acontece no navegador.
function rotaAtual() {
  return window.location.hash.replace('#', '').split('?')[0];
}

function Root() {
  const [rota, setRota] = React.useState(rotaAtual());
  React.useEffect(() => {
    const onHashChange = () => setRota(rotaAtual());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);
  return rota === 'dashboard' ? <Dashboard /> : <App />;
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
