import { useEffect, useMemo, useState, useCallback } from 'react';
import { supabase } from './supabaseClient';

const FONT_IMPORT = `@import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;700&family=Inter:wght@400;500&family=JetBrains+Mono:wght@500&display=swap');`;

const CORES = {
  fundo: '#0A0E13',
  painel: '#151C24',
  painelBorda: '#232E3A',
  texto: '#EDEFF2',
  textoFraco: '#8FA3B8',
  laranja: '#E8A33D',
  laranjaEscuro: '#D97B2A',
  verde: '#3E8E5C',
  verdeClaro: '#7CC98C',
  amarelo: '#E0B23D',
  vermelho: '#C0392B',
  vermelhoClaro: '#E8927A',
  azul: '#3D7FE0',
  rosa: '#D6407A',
};

const CORES_BARRA = [CORES.laranjaEscuro, CORES.verde, CORES.azul, CORES.rosa, CORES.amarelo, CORES.vermelho];

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(typeof window !== 'undefined' && window.innerWidth >= 900);
  useEffect(() => {
    const onResize = () => setIsDesktop(window.innerWidth >= 900);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return isDesktop;
}

function segundaFeira(ref) {
  const d = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate());
  const diaSemana = (d.getDay() + 6) % 7; // 0 = segunda
  d.setDate(d.getDate() - diaSemana);
  return d;
}
function domingoFeira(ref) {
  const seg = segundaFeira(ref);
  const d = new Date(seg);
  d.setDate(d.getDate() + 6);
  return d;
}
function maxData(a, b) { return a > b ? a : b; }
function minData(a, b) { return a < b ? a : b; }
function pad2(n) { return String(n).padStart(2, '0'); }

function toISODate(d) { return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`; }
function primeiroDiaMes(ref) { return new Date(ref.getFullYear(), ref.getMonth(), 1); }
function ultimoDiaMes(ref) { return new Date(ref.getFullYear(), ref.getMonth() + 1, 0); }
function contarDiasUteis(inicio, fim) {
  let count = 0;
  const d = new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate());
  const limite = new Date(fim.getFullYear(), fim.getMonth(), fim.getDate());
  while (d <= limite) {
    const wd = d.getDay();
    if (wd !== 0 && wd !== 6) count++;
    d.setDate(d.getDate() + 1);
  }
  return count;
}
function fmtPts(n) {
  return (Math.round((n || 0) * 10) / 10).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}
function fmtInt(n) { return Math.round(n || 0).toLocaleString('pt-BR'); }
const MESES = ['JANEIRO', 'FEVEREIRO', 'MARÇO', 'ABRIL', 'MAIO', 'JUNHO', 'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO'];

function iniciais(nome) {
  if (!nome) return '?';
  const partes = nome.trim().split(/\s+/);
  return ((partes[0]?.[0] || '') + (partes[1]?.[0] || '')).toUpperCase();
}

// ---------------------------------------------------------------
// Velocímetro (gauge) — anel de 0 até 2× a meta diária, dividido
// em duas metades iguais: amarelo (abaixo da meta) e verde (na
// meta ou acima). A meta fica exatamente no meio do mostrador.
// ---------------------------------------------------------------
function polar(cx, cy, r, angDeg) {
  const rad = (angDeg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}
function arco(cx, cy, r, angIni, angFim) {
  const p1 = polar(cx, cy, r, angIni);
  const p2 = polar(cx, cy, r, angFim);
  const large = angFim - angIni <= 180 ? 0 : 1;
  return `M ${p1.x} ${p1.y} A ${r} ${r} 0 ${large} 1 ${p2.x} ${p2.y}`;
}

function Velocimetro({ valor, meta }) {
  const gaugeMax = meta > 0 ? meta * 2 : 16;
  const valorParaAngulo = (v) => 180 + (Math.max(0, Math.min(gaugeMax, v)) / gaugeMax) * 180;
  const zonas = [
    { de: 0, ate: meta > 0 ? meta : gaugeMax / 2, cor: CORES.amarelo },
    { de: meta > 0 ? meta : gaugeMax / 2, ate: gaugeMax, cor: CORES.verde },
  ];
  const cx = 150, cy = 158, r = 106;
  const anguloPonteiro = valorParaAngulo(valor);
  const pontaPonteiro = polar(cx, cy, r - 24, anguloPonteiro);
  const p0 = polar(cx, cy, r + 30, 180);
  const pMeta = polar(cx, cy, r + 30, valorParaAngulo(meta > 0 ? meta : gaugeMax / 2));
  const pMax = polar(cx, cy, r + 30, 360);
  const passoTraco = gaugeMax / 10; // divide o anel em 10 blocos (a cada 1,98 quando a meta é 9,9)
  const tracos = Array.from({ length: 9 }, (_, idx) => (idx + 1) * passoTraco);
  const tracosPrincipais = [0, meta > 0 ? meta : gaugeMax / 2, gaugeMax];
  return (
    <svg viewBox="0 0 300 200" style={{ width: '100%', maxWidth: 320, display: 'block', margin: '0 auto' }}>
      {zonas.map((z, i) => (
        <path key={i} d={arco(cx, cy, r, valorParaAngulo(z.de), valorParaAngulo(z.ate))}
          stroke={z.cor} strokeWidth={20} fill="none" strokeLinecap="butt" opacity={0.92} />
      ))}
      {tracos.map((v, i) => {
        const ang = valorParaAngulo(v);
        const p1 = polar(cx, cy, r - 11, ang);
        const p2 = polar(cx, cy, r + 11, ang);
        return <line key={i} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="#FFFFFF" strokeWidth={2.5} />;
      })}
      {tracosPrincipais.map((v, i) => {
        const ang = valorParaAngulo(v);
        const p1 = polar(cx, cy, r - 14, ang);
        const p2 = polar(cx, cy, r + 15, ang);
        return <line key={`p${i}`} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="#FFFFFF" strokeWidth={3} strokeLinecap="round" />;
      })}
      <text x={p0.x} y={p0.y + 4} fill={CORES.textoFraco} fontSize="13" fontWeight="700" textAnchor="middle" fontFamily="'JetBrains Mono', monospace">0</text>
      <text x={pMeta.x} y={pMeta.y - 6} fill={CORES.texto} fontSize="14" fontWeight="700" textAnchor="middle" fontFamily="'JetBrains Mono', monospace">{fmtPts(meta > 0 ? meta : gaugeMax / 2)}</text>
      <text x={pMax.x} y={pMax.y + 4} fill={CORES.textoFraco} fontSize="13" fontWeight="700" textAnchor="middle" fontFamily="'JetBrains Mono', monospace">{fmtPts(gaugeMax)}</text>
      <circle cx={cx} cy={cy} r={8} fill={CORES.texto} />
      <line x1={cx} y1={cy} x2={pontaPonteiro.x} y2={pontaPonteiro.y} stroke={CORES.texto} strokeWidth={4} strokeLinecap="round" />
    </svg>
  );
}

// ---------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------
export default function Dashboard() {
  const isDesktop = useIsDesktop();

  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState(null);
  const [meta, setMeta] = useState({ meta_pontos_diaria: 0, quantidade_montadores: 0 });
  const [modelosCadastro, setModelosCadastro] = useState([]);
  const [montadoresCadastro, setMontadoresCadastro] = useState([]);
  const [deparaMontador, setDeparaMontador] = useState([]);
  const [apontamentos, setApontamentos] = useState([]);
  const [filtro, setFiltro] = useState(null);
  const [periodo, setPeriodo] = useState('mes');
  const [qrUrl, setQrUrl] = useState('');

  const carregar = useCallback(async () => {
    setErro('');
    const hoje = new Date();
    const inicioMes = primeiroDiaMes(hoje);
    const fimMes = ultimoDiaMes(hoje);
    try {
      const [metaRes, modelosRes, montadoresRes, deparaRes, apontRes] = await Promise.all([
        supabase.from('metas_dashboard').select('meta_pontos_diaria, quantidade_montadores').eq('id', 1).single(),
        supabase.from('cadastros').select('valor, pontos').eq('tipo', 'modelo'),
        supabase.from('cadastros').select('valor, foto_url').eq('tipo', 'nome_montador'),
        supabase.from('de_para_montador').select('variante, nome_oficial'),
        supabase.from('dashboard_apontamentos').select('data, nome_montador, modelo, status, tipo_servico, historico_manutencao')
          .gte('data', toISODate(inicioMes)).lte('data', toISODate(fimMes)),
      ]);
      if (metaRes.data) setMeta(metaRes.data);
      setModelosCadastro(modelosRes.data || []);
      setMontadoresCadastro(montadoresRes.data || []);
      setDeparaMontador(deparaRes.data || []);
      setApontamentos(apontRes.data || []);
      setUltimaAtualizacao(new Date());
    } catch (e) {
      setErro('Não foi possível carregar os dados: ' + (e?.message || String(e)));
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar();
    const intervalo = setInterval(carregar, 90000);
    return () => clearInterval(intervalo);
  }, [carregar]);

  useEffect(() => {
    const url = window.location.origin + window.location.pathname + '#dashboard';
    setQrUrl(url);
  }, []);

  const dados = useMemo(() => {
    const hoje = new Date();
    const inicioMes = primeiroDiaMes(hoje);
    const fimMes = ultimoDiaMes(hoje);

    // limites do período escolhido, sempre "presos" dentro do mês corrente
    // (o app não acumula de um mês para o outro)
    let inicioPeriodo, fimPeriodo;
    if (periodo === 'dia') {
      inicioPeriodo = hoje; fimPeriodo = hoje;
    } else if (periodo === 'semana') {
      inicioPeriodo = maxData(segundaFeira(hoje), inicioMes);
      fimPeriodo = minData(domingoFeira(hoje), fimMes);
    } else {
      inicioPeriodo = inicioMes; fimPeriodo = fimMes;
    }
    const diasUteisDecorridos = Math.max(1, contarDiasUteis(inicioPeriodo, minData(hoje, fimPeriodo)));
    const diasUteisPeriodo = Math.max(1, contarDiasUteis(inicioPeriodo, fimPeriodo));

    const pontosPorModelo = {};
    modelosCadastro.forEach((m) => { pontosPorModelo[m.valor] = Number(m.pontos) || 0; });

    const fotoPorMontador = {};
    montadoresCadastro.forEach((m) => { fotoPorMontador[m.valor] = m.foto_url || null; });

    const mapaDePara = {};
    deparaMontador.forEach((d) => { mapaDePara[(d.variante || '').trim().toUpperCase()] = d.nome_oficial; });
    function resolverNomeMontador(nome) {
      if (!nome) return nome;
      const chave = nome.trim().toUpperCase();
      return mapaDePara[chave] || nome;
    }

    const inicioISO = toISODate(inicioPeriodo);
    const fimISO = toISODate(fimPeriodo);
    const registros = apontamentos
      .filter((a) => a.data >= inicioISO && a.data <= fimISO)
      .map((a) => ({ ...a, nome_montador: resolverNomeMontador(a.nome_montador), pontos: pontosPorModelo[a.modelo] || 0 }));

    // por montador
    const mapaMontadores = {};
    const nomesConhecidos = new Set(montadoresCadastro.map((m) => m.valor));
    registros.forEach((r) => { if (r.nome_montador) nomesConhecidos.add(r.nome_montador); });
    nomesConhecidos.forEach((nome) => { mapaMontadores[nome] = { nome, pontos: 0, unidades: 0, foto: fotoPorMontador[nome] || null }; });
    registros.forEach((r) => {
      if (!r.nome_montador) return;
      if (!mapaMontadores[r.nome_montador]) mapaMontadores[r.nome_montador] = { nome: r.nome_montador, pontos: 0, unidades: 0, foto: fotoPorMontador[r.nome_montador] || null };
      mapaMontadores[r.nome_montador].pontos += r.pontos;
      mapaMontadores[r.nome_montador].unidades += 1;
    });
    const listaMontadores = Object.values(mapaMontadores).sort((a, b) => b.pontos - a.pontos);

    const metaDiaria = Number(meta.meta_pontos_diaria) || 0;
    const qtdMontadores = Number(meta.quantidade_montadores) || 0;

    const totalGlobalEquipe = registros.reduce((s, r) => s + r.pontos, 0);
    const totalUnidadesEquipe = registros.length;
    const pontuacaoAcumuladaEquipe = metaDiaria * qtdMontadores * diasUteisDecorridos;
    const pontuacaoPlanejadaEquipe = metaDiaria * qtdMontadores * diasUteisPeriodo;

    function contagemModelos(lista) {
      const mapa = {};
      lista.forEach((r) => {
        if (!r.modelo) return;
        if (!mapa[r.modelo]) mapa[r.modelo] = { modelo: r.modelo, unidades: 0 };
        mapa[r.modelo].unidades += 1;
      });
      return Object.values(mapa).sort((a, b) => b.unidades - a.unidades);
    }

    // Classifica cada apontamento pela origem/resultado dele:
    // - "Criados diretamente na Manutenção": nasceram no Apontamento já
    //   como serviço de Manutenção (tipo_servico = 'Manutenção').
    // - "Enviados para Manutenção": nasceram como Montagem, foram para a
    //   Inspeção e ela mandou para manutenção (status atual = 'manutencao'
    //   ou já passaram por lá pelo menos uma vez).
    // - "Aprovados diretamente pela Inspeção": nasceram como Montagem e
    //   a Inspeção aprovou sem nunca precisar de manutenção.
    // - "Aguardando inspeção": ainda não foram inspecionados.
    function classificarProducao(lista) {
      let aprovadosInspecao = 0, enviadosManutencao = 0, criadosManutencao = 0, aguardandoInspecao = 0;
      lista.forEach((r) => {
        const jaPassouPorManutencao = Array.isArray(r.historico_manutencao) && r.historico_manutencao.length > 0;
        if (r.tipo_servico === 'Manutenção') {
          criadosManutencao += 1;
        } else if (r.status === 'manutencao' || jaPassouPorManutencao) {
          enviadosManutencao += 1;
        } else if (['aprovado', 'reservado_expedicao', 'expedido'].includes(r.status)) {
          aprovadosInspecao += 1;
        } else {
          aguardandoInspecao += 1;
        }
      });
      return { aprovadosInspecao, enviadosManutencao, criadosManutencao, aguardandoInspecao };
    }

    // visão filtrada (por montador) ou visão da equipe toda
    const registrosFiltrados = filtro ? registros.filter((r) => r.nome_montador === filtro) : registros;
    const totalPontosView = filtro ? (mapaMontadores[filtro]?.pontos || 0) : totalGlobalEquipe;
    const totalUnidadesView = filtro ? (mapaMontadores[filtro]?.unidades || 0) : totalUnidadesEquipe;
    const pontuacaoAcumuladaView = filtro ? metaDiaria * diasUteisDecorridos : pontuacaoAcumuladaEquipe;
    const pontuacaoPlanejadaView = filtro ? metaDiaria * diasUteisPeriodo : pontuacaoPlanejadaEquipe;
    const mediaDiariaView = totalPontosView / diasUteisDecorridos;
    const modelosView = contagemModelos(registrosFiltrados);
    const maxUnidadesModelo = Math.max(1, ...modelosView.map((m) => m.unidades));
    const maxPontosMontador = Math.max(1, ...listaMontadores.map((m) => m.pontos));
    const classificacaoView = classificarProducao(registrosFiltrados);

    const percentualMeta = pontuacaoAcumuladaView > 0 ? ((totalPontosView / pontuacaoAcumuladaView) * 100 - 100) : 0;

    return {
      hoje, inicioPeriodo, fimPeriodo, diasUteisDecorridos, diasUteisPeriodo, metaDiaria, qtdMontadores,
      listaMontadores, maxPontosMontador,
      totalPontosView, totalUnidadesView, pontuacaoAcumuladaView, pontuacaoPlanejadaView,
      mediaDiariaView, modelosView, maxUnidadesModelo, percentualMeta, classificacaoView,
    };
  }, [apontamentos, modelosCadastro, montadoresCadastro, deparaMontador, meta, filtro, periodo]);

  const panel = { background: CORES.painel, border: `1px solid ${CORES.painelBorda}`, borderRadius: 16, padding: '18px 18px' };
  const label = { fontSize: 11, letterSpacing: '0.05em', color: CORES.textoFraco, textTransform: 'uppercase', fontFamily: "'Inter', sans-serif", margin: 0 };
  const h1 = { fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, letterSpacing: '0.02em', margin: 0, textTransform: 'uppercase', color: CORES.texto };
  const mono = { fontFamily: "'JetBrains Mono', monospace" };

  if (carregando) {
    return (
      <div style={{ minHeight: '100vh', background: CORES.fundo, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <style>{FONT_IMPORT}</style>
        <p style={{ color: CORES.textoFraco, fontFamily: "'Inter', sans-serif", fontSize: 14 }}>Carregando dashboard...</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: CORES.fundo, padding: '20px 14px 40px', fontFamily: "'Inter', sans-serif", color: CORES.texto }}>
      <style>{FONT_IMPORT}{`
        * { box-sizing: border-box; }
        body { margin: 0; }
        .barra-montador { cursor: pointer; transition: transform 0.12s ease, background 0.15s ease; }
        .barra-montador:hover { background: rgba(255,255,255,0.03); }
        .barra-montador:active { transform: scale(0.99); }
        .fill-bar { transition: width 0.5s cubic-bezier(.2,.8,.3,1); }
      `}</style>

      <div style={{ maxWidth: 560, margin: '0 auto' }}>
        {/* Cabeçalho */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 14 }}>
          <div>
            <h1 style={{ ...h1, fontSize: isDesktop ? 34 : 26 }}>Dashboard de Produção</h1>
            <p style={{ color: CORES.textoFraco, fontSize: 13, margin: '4px 0 0' }}>
              {MESES[dados.hoje.getMonth()]} / {dados.hoje.getFullYear()} · dados não acumulam de um mês para o outro
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ color: CORES.textoFraco, fontSize: 12 }}>
              Atualizado às {ultimaAtualizacao ? ultimaAtualizacao.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
            </span>
            <button onClick={carregar} style={{ background: CORES.painel, border: `1px solid ${CORES.painelBorda}`, borderRadius: 8, color: CORES.laranja, padding: '8px 12px', fontSize: 12, cursor: 'pointer' }}>↻ Atualizar</button>
          </div>
        </div>

        {/* Seletor de período — Dia / Semana / Mês */}
        <div style={{ display: 'flex', background: CORES.painel, border: `1px solid ${CORES.painelBorda}`, borderRadius: 10, padding: 4, gap: 4, marginBottom: 14 }}>
          {[['dia', 'Dia'], ['semana', 'Semana'], ['mes', 'Mês']].map(([valor, rotulo]) => (
            <button key={valor} onClick={() => setPeriodo(valor)}
              style={{
                flex: 1, padding: '9px 0', borderRadius: 7, border: 'none', cursor: 'pointer',
                fontSize: 12.5, fontWeight: 700, letterSpacing: '0.02em', textTransform: 'uppercase',
                fontFamily: "'Barlow Condensed', sans-serif",
                background: periodo === valor ? CORES.laranjaEscuro : 'transparent',
                color: periodo === valor ? '#1F1300' : CORES.textoFraco,
                transition: 'background 0.15s ease, color 0.15s ease',
              }}>
              {rotulo}
            </button>
          ))}
        </div>

        {erro && <div style={{ ...panel, borderColor: CORES.vermelho, color: CORES.vermelhoClaro, marginBottom: 14, fontSize: 13 }}>{erro}</div>}

        {filtro && (
          <div style={{ ...panel, marginBottom: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderColor: CORES.laranja, background: 'rgba(232,163,61,0.08)' }}>
            <span style={{ fontSize: 13 }}>Filtrando por: <strong style={{ color: CORES.laranja }}>{filtro}</strong> — todos os cartões abaixo mostram a produção individual dele.</span>
            <button onClick={() => setFiltro(null)} style={{ background: 'none', border: `1px solid ${CORES.laranja}`, color: CORES.laranja, borderRadius: 8, padding: '6px 12px', fontSize: 12, cursor: 'pointer' }}>Voltar para a equipe ✕</button>
          </div>
        )}

        {/* Linha 1 — 4 cartões */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
          <div style={panel}>
            <p style={label}>{filtro ? 'Total do montador' : 'Total global da equipe'}</p>
            <p style={{ ...mono, fontSize: 30, color: CORES.laranja, margin: '6px 0 0' }}>{fmtPts(dados.totalPontosView)} <span style={{ fontSize: 14, color: CORES.textoFraco }}>pts</span></p>
          </div>
          <div style={panel}>
            <p style={label}>Pontuação acumulada</p>
            <p style={{ ...mono, fontSize: 30, color: CORES.azul, margin: '6px 0 0' }}>{fmtPts(dados.pontuacaoAcumuladaView)} <span style={{ fontSize: 14, color: CORES.textoFraco }}>pts</span></p>
            <p style={{ fontSize: 11, color: CORES.textoFraco, margin: '4px 0 0' }}>previsão até hoje ({dados.diasUteisDecorridos}dº útil)</p>
          </div>
          <div style={panel}>
            <p style={label}>Pontuação planejada {periodo === 'dia' ? 'no dia' : periodo === 'semana' ? 'na semana' : 'no mês'}</p>
            <p style={{ ...mono, fontSize: 30, color: CORES.verdeClaro, margin: '6px 0 0' }}>{fmtPts(dados.pontuacaoPlanejadaView)} <span style={{ fontSize: 14, color: CORES.textoFraco }}>pts</span></p>
            <p style={{ fontSize: 11, color: CORES.textoFraco, margin: '4px 0 0' }}>meta fixa do período ({dados.diasUteisPeriodo} dias úteis)</p>
          </div>
          <div style={panel}>
            <p style={label}>Unidades produzidas</p>
            <p style={{ ...mono, fontSize: 30, color: CORES.texto, margin: '6px 0 0' }}>{fmtInt(dados.totalUnidadesView)}</p>
          </div>
        </div>


        {/* Linha 2 — pontuação individual (largura total) */}
        <div style={{ ...panel, marginBottom: 14 }}>
          <p style={{ ...label, marginBottom: 12 }}>Pontuação individual por montador</p>
          {dados.listaMontadores.length === 0 && <p style={{ color: CORES.textoFraco, fontSize: 13 }}>Nenhum montador cadastrado ainda.</p>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {dados.listaMontadores.map((m, i) => {
              const cor = CORES_BARRA[i % CORES_BARRA.length];
              const larguraPerc = Math.max(4, (m.pontos / dados.maxPontosMontador) * 100);
              const selecionado = filtro === m.nome;
              return (
                <div key={m.nome} className="barra-montador" onClick={() => setFiltro(selecionado ? null : m.nome)}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 10px', borderRadius: 10, border: selecionado ? `1px solid ${CORES.laranja}` : '1px solid transparent', background: selecionado ? 'rgba(232,163,61,0.08)' : 'transparent' }}>
                  {m.foto ? (
                    <img src={m.foto} alt={m.nome} style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                  ) : (
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: cor, color: '#12181F', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>{iniciais(m.nome)}</div>
                  )}
                  <span style={{ fontSize: 12.5, minWidth: 82, flexShrink: 0 }}>{m.nome}</span>
                  <div style={{ flex: 1, background: '#232E3A', borderRadius: 6, height: 12, overflow: 'hidden' }}>
                    <div className="fill-bar" style={{ width: `${larguraPerc}%`, height: '100%', background: cor, borderRadius: 6 }} />
                  </div>
                  <span style={{ ...mono, fontSize: 14, color: cor, minWidth: 68, textAlign: 'right', flexShrink: 0 }}>{fmtPts(m.pontos)} pts</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Linha 2.5 — classificação da produção */}
        <div style={{ ...panel, marginBottom: 14 }}>
          <p style={{ ...label, marginBottom: 4 }}>Classificação da produção</p>
          <p style={{ fontSize: 12, color: CORES.textoFraco, margin: '0 0 12px' }}>
            Dos {fmtInt(dados.totalUnidadesView)} montados, quantos vieram de cada caminho:
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { rotulo: 'Aprovados diretamente pela Inspeção', valor: dados.classificacaoView.aprovadosInspecao, cor: CORES.verde },
              { rotulo: 'Enviados para Manutenção (pela Inspeção)', valor: dados.classificacaoView.enviadosManutencao, cor: CORES.amarelo },
              { rotulo: 'Criados diretamente na Manutenção', valor: dados.classificacaoView.criadosManutencao, cor: CORES.azul },
              ...(dados.classificacaoView.aguardandoInspecao > 0 ? [{ rotulo: 'Aguardando inspeção', valor: dados.classificacaoView.aguardandoInspecao, cor: CORES.textoFraco }] : []),
            ].map((item) => {
              const perc = dados.totalUnidadesView > 0 ? (item.valor / dados.totalUnidadesView) * 100 : 0;
              return (
                <div key={item.rotulo}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 4 }}>
                    <span>{item.rotulo}</span>
                    <span style={{ ...mono, color: item.cor }}>{fmtInt(item.valor)} <span style={{ color: CORES.textoFraco }}>({fmtPts(perc)}%)</span></span>
                  </div>
                  <div style={{ background: '#232E3A', borderRadius: 6, height: 9, overflow: 'hidden' }}>
                    <div className="fill-bar" style={{ width: `${perc}%`, height: '100%', background: item.cor, borderRadius: 6 }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Linha 3 — modelos + velocímetro */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 14, marginBottom: 14 }}>
          <div style={panel}>
            <p style={{ ...label, marginBottom: 12 }}>Quantidade de modelos montados</p>
            {dados.modelosView.length === 0 && <p style={{ color: CORES.textoFraco, fontSize: 13 }}>Nenhum apontamento neste mês ainda.</p>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {dados.modelosView.map((mo, i) => {
                const cor = CORES_BARRA[i % CORES_BARRA.length];
                const larguraPerc = Math.max(4, (mo.unidades / dados.maxUnidadesModelo) * 100);
                return (
                  <div key={mo.modelo} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 13, minWidth: 90, flexShrink: 0 }}>{mo.modelo}</span>
                    <div style={{ flex: 1, background: '#232E3A', borderRadius: 6, height: 10, overflow: 'hidden' }}>
                      <div className="fill-bar" style={{ width: `${larguraPerc}%`, height: '100%', background: cor, borderRadius: 6 }} />
                    </div>
                    <span style={{ ...mono, fontSize: 14, color: cor, minWidth: 34, textAlign: 'right', flexShrink: 0 }}>{fmtInt(mo.unidades)}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ ...panel, textAlign: 'center' }}>
            <p style={{ ...label, marginBottom: 4 }}>Velocímetro — média diária de pontos</p>
            <Velocimetro valor={dados.mediaDiariaView} meta={dados.metaDiaria} />
            <p style={{ ...mono, fontSize: 26, color: CORES.texto, margin: '-6px 0 0' }}>{fmtPts(dados.mediaDiariaView)} <span style={{ fontSize: 13, color: CORES.textoFraco }}>pts/dia</span></p>
            <p style={{ fontSize: 11, color: CORES.textoFraco, margin: '2px 0 12px' }}>amarelo = abaixo da meta · verde = na meta ou acima ({fmtPts(dados.metaDiaria)} pts/dia)</p>
            <div style={{ background: dados.mediaDiariaView >= dados.metaDiaria ? 'rgba(62,142,92,0.14)' : 'rgba(192,57,43,0.14)', border: `1px solid ${dados.mediaDiariaView >= dados.metaDiaria ? CORES.verde : CORES.vermelho}`, borderRadius: 10, padding: '10px 12px', fontSize: 12, textAlign: 'left' }}>
              {dados.mediaDiariaView >= dados.metaDiaria ? (
                <span style={{ color: CORES.verdeClaro }}>▲ Desempenho acima da meta! {dados.percentualMeta >= 0 ? '+' : ''}{fmtPts(dados.percentualMeta)}% em relação à previsão acumulada.</span>
              ) : (
                <span style={{ color: CORES.vermelhoClaro }}>▼ Abaixo da meta diária. {fmtPts(dados.percentualMeta)}% em relação à previsão acumulada.</span>
              )}
            </div>
          </div>
        </div>

        {/* QR Code */}
        <div style={{ ...panel, display: 'flex', gap: 18, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ background: '#FFFFFF', padding: 8, borderRadius: 10, flexShrink: 0 }}>
            {qrUrl && <img src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(qrUrl)}`} alt="QR code do dashboard" width={180} height={180} />}
            <p style={{ textAlign: 'center', fontSize: 10, color: '#333', margin: '4px 0 0', fontFamily: "'Inter', sans-serif" }}>QR CODE</p>
          </div>
          <div style={{ flex: 1, minWidth: 220 }}>
            <p style={{ ...h1, fontSize: 16, color: CORES.laranja }}>Aponte a câmera do celular para o chão de fábrica</p>
            <p style={{ color: CORES.textoFraco, fontSize: 13, margin: '6px 0' }}>Escaneie o QR code para abrir este dashboard em qualquer celular ou computador, sem precisar de login. Ideal para fixar na linha de produção.</p>
            {qrUrl && (
              <a href={`https://api.qrserver.com/v1/create-qr-code/?size=600x600&data=${encodeURIComponent(qrUrl)}`} target="_blank" rel="noreferrer"
                style={{ display: 'inline-block', marginTop: 6, fontSize: 12, color: CORES.laranja, border: `1px solid ${CORES.laranja}`, borderRadius: 8, padding: '8px 14px', textDecoration: 'none' }}>
                Abrir QR em alta resolução para imprimir
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
