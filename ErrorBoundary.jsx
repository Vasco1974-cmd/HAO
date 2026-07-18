import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('Erro capturado pelo ErrorBoundary:', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#12181F',
          color: '#EDEFF2',
          fontFamily: 'sans-serif',
          padding: '2rem',
          textAlign: 'center',
        }}>
          <div style={{ maxWidth: 420 }}>
            <h1 style={{ fontSize: 20, marginBottom: 12 }}>Algo deu errado ao carregar o app</h1>
            <p style={{ color: '#8FA3B8', fontSize: 14, marginBottom: 16 }}>
              {this.state.error?.message || 'Erro desconhecido.'}
            </p>
            <p style={{ color: '#8FA3B8', fontSize: 12 }}>
              Se você é o administrador: verifique se as variáveis VITE_SUPABASE_URL e
              VITE_SUPABASE_ANON_KEY estão configuradas no Vercel e se um redeploy foi feito
              depois de configurá-las.
            </p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
