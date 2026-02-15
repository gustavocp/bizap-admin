import { useEffect, useMemo, useState } from 'react';
import MetricCard from './MetricCard';
import SimpleBarChart from './SimpleBarChart';
import { supabase } from '../lib/supabase';
import { improveReply, summarizeMessages } from '../lib/ai';

const mockGroups = [
  { id: 'g1', name: 'Vendas' },
  { id: 'g2', name: 'Marketing' },
  { id: 'g3', name: 'Operações' },
];

const now = new Date();
const oneDayMs = 24 * 60 * 60 * 1000;

function countMessagesByPeriod(messages, days) {
  const threshold = new Date(now.getTime() - oneDayMs * days);
  return messages.filter((msg) => new Date(msg.created_at) >= threshold).length;
}

function getIdleHours(messages) {
  if (messages.length < 2) return 0;
  const sorted = [...messages].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  let idleMs = 0;
  for (let i = 1; i < sorted.length; i += 1) {
    const diff = new Date(sorted[i].created_at) - new Date(sorted[i - 1].created_at);
    if (diff > 60 * 60 * 1000) idleMs += diff;
  }
  return Math.round(idleMs / (1000 * 60 * 60));
}

function getMostEngaged(messages, days) {
  const threshold = new Date(now.getTime() - oneDayMs * days);
  const bucket = messages
    .filter((msg) => new Date(msg.created_at) >= threshold)
    .reduce((acc, msg) => {
      const key = msg.sender || 'Desconhecido';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

  const [sender, total] = Object.entries(bucket).sort((a, b) => b[1] - a[1])[0] || ['N/A', 0];
  return { sender, total };
}

export default function DashboardPage({ onLogout }) {
  const [groups, setGroups] = useState(mockGroups);
  const [selectedGroupId, setSelectedGroupId] = useState(mockGroups[0].id);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState('');
  const [replyDraft, setReplyDraft] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  const selectedGroup = useMemo(
    () => groups.find((group) => group.id === selectedGroupId) || groups[0],
    [groups, selectedGroupId],
  );

  useEffect(() => {
    async function loadGroups() {
      if (!supabase) return;
      const { data } = await supabase.from('groups').select('id,name').order('name');
      if (Array.isArray(data) && data.length) {
        setGroups(data);
        setSelectedGroupId(data[0].id);
      }
    }

    loadGroups();
  }, []);

  useEffect(() => {
    let active = true;

    async function loadMessages() {
      setLoading(true);
      if (!supabase || !selectedGroupId) {
        setMessages([]);
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from('messages')
        .select('id,group_id,sender,text,created_at,is_favorite')
        .eq('group_id', selectedGroupId)
        .order('created_at', { ascending: false })
        .limit(200);

      if (active) {
        setMessages(data || []);
        setLoading(false);
      }
    }

    loadMessages();

    if (!supabase || !selectedGroupId) return () => {};

    const channel = supabase
      .channel(`messages-${selectedGroupId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages', filter: `group_id=eq.${selectedGroupId}` },
        (payload) => {
          setMessages((prev) => {
            if (payload.eventType === 'INSERT') return [payload.new, ...prev];
            if (payload.eventType === 'UPDATE')
              return prev.map((msg) => (msg.id === payload.new.id ? payload.new : msg));
            if (payload.eventType === 'DELETE') return prev.filter((msg) => msg.id !== payload.old.id);
            return prev;
          });
        },
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [selectedGroupId]);

  const dayEngaged = getMostEngaged(messages, 1);
  const weekEngaged = getMostEngaged(messages, 7);
  const monthEngaged = getMostEngaged(messages, 30);
  const idleHours = getIdleHours(messages);

  const chartData = Object.entries(
    messages.reduce((acc, msg) => {
      acc[msg.sender || 'Desconhecido'] = (acc[msg.sender || 'Desconhecido'] || 0) + 1;
      return acc;
    }, {}),
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([label, value]) => ({ label, value }));

  const handleFavoriteToggle = async (message) => {
    setMessages((prev) =>
      prev.map((msg) => (msg.id === message.id ? { ...msg, is_favorite: !msg.is_favorite } : msg)),
    );

    if (!supabase) return;
    await supabase.from('messages').update({ is_favorite: !message.is_favorite }).eq('id', message.id);
  };

  const handleSummary = async () => {
    setAiLoading(true);
    const todaysMessages = messages.filter(
      (msg) => new Date(msg.created_at) >= new Date(Date.now() - oneDayMs),
    );
    const aiSummary = await summarizeMessages(todaysMessages, selectedGroup?.name || 'Grupo');
    setSummary(aiSummary);
    setAiLoading(false);
  };

  const handleImproveReply = async () => {
    if (!replyDraft.trim()) return;
    setAiLoading(true);
    const improved = await improveReply(replyDraft);
    setReplyDraft(improved);
    setAiLoading(false);
  };

  return (
    <main className="dashboard">
      <header className="topbar card">
        <div>
          <h1>BI Zap Dashboard</h1>
          <p>Monitore grupos, engajamento e mensagens em tempo real.</p>
        </div>
        <div className="topbar-actions">
          <select value={selectedGroupId} onChange={(e) => setSelectedGroupId(e.target.value)}>
            {groups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </select>
          <button onClick={onLogout}>Sair</button>
        </div>
      </header>

      <section className="metrics-grid">
        <MetricCard title="Mais engajado (dia)" value={dayEngaged.sender} subtitle={`${dayEngaged.total} msgs`} />
        <MetricCard
          title="Mais engajado (semana)"
          value={weekEngaged.sender}
          subtitle={`${weekEngaged.total} msgs`}
        />
        <MetricCard
          title="Mais engajado (mês)"
          value={monthEngaged.sender}
          subtitle={`${monthEngaged.total} msgs`}
        />
        <MetricCard title="Tempo ocioso do grupo" value={`${idleHours}h`} subtitle="gaps > 1h" />
      </section>

      <section className="content-grid">
        <SimpleBarChart data={chartData.length ? chartData : [{ label: 'Sem dados', value: 0 }]} />

        <div className="card ai-card">
          <h3>Resumo do dia com IA</h3>
          <button onClick={handleSummary} disabled={aiLoading}>
            {aiLoading ? 'Gerando...' : 'Resumir mensagens de hoje'}
          </button>
          <p>{summary || 'Clique para gerar o resumo diário.'}</p>

          <h3>Resposta rápida com IA</h3>
          <textarea
            rows={5}
            value={replyDraft}
            onChange={(e) => setReplyDraft(e.target.value)}
            placeholder="Escreva a resposta inicial..."
          />
          <button onClick={handleImproveReply} disabled={aiLoading}>
            {aiLoading ? 'Melhorando...' : 'Melhorar texto com IA'}
          </button>
        </div>
      </section>

      <section className="card messages-card">
        <h3>Mensagens em tempo real {selectedGroup ? `- ${selectedGroup.name}` : ''}</h3>
        {loading ? <p>Carregando mensagens...</p> : null}
        <ul>
          {messages.map((msg) => (
            <li key={msg.id}>
              <div>
                <strong>{msg.sender || 'Desconhecido'}</strong>
                <p>{msg.text}</p>
                <small>{new Date(msg.created_at).toLocaleString('pt-BR')}</small>
              </div>
              <button onClick={() => handleFavoriteToggle(msg)}>
                {msg.is_favorite ? '★ Favorito' : '☆ Favoritar'}
              </button>
            </li>
          ))}
        </ul>
        {!loading && messages.length === 0 ? <p>Sem mensagens para este grupo.</p> : null}
        <p className="hint">
          Dados esperados em Supabase: tabelas <code>groups</code> e <code>messages</code>.
        </p>
      </section>

      <footer>
        <small>
          Mensagens hoje: {countMessagesByPeriod(messages, 1)} | Últimos 7 dias:{' '}
          {countMessagesByPeriod(messages, 7)}
        </small>
      </footer>
    </main>
  );
}
