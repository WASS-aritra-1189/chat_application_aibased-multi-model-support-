import { useState, useEffect } from 'react';
import { getDashboardStats } from '../utils/api';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, Area, AreaChart,
} from 'recharts';

const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6'];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={tooltipStyle}>
      {label && <p style={{ color: '#64748b', fontSize: '11px', marginBottom: '6px' }}>{label}</p>}
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color || '#e2e8f0', fontSize: '13px', fontWeight: 600 }}>
          {p.name}: {typeof p.value === 'number' ? p.value.toLocaleString() : p.value}
        </p>
      ))}
    </div>
  );
};

const tooltipStyle = {
  background: '#0c1220', border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '10px', padding: '10px 14px', boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
};

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const load = () => {
    setLoading(true);
    getDashboardStats()
      .then(r => { setStats(r.data); setLastRefresh(new Date()); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  if (loading) return (
    <div style={styles.loadingScreen}>
      <div style={styles.loadingIcon}>✦</div>
      <p style={styles.loadingText}>Loading dashboard...</p>
    </div>
  );

  if (!stats) return (
    <div style={styles.loadingScreen}>
      <p style={styles.loadingText}>No data available yet. Send some messages first.</p>
    </div>
  );

  const errorData = stats.errorRate.map(e => ({ name: e._id, value: e.count }));
  const providerData = stats.providerBreakdown.map(p => ({
    name: p._id, requests: p.count, latency: Math.round(p.avgLatency || 0),
  }));
  const throughputData = stats.throughput.map(t => ({
    time: t._id?.slice(11, 16) || t._id,
    requests: t.count,
  }));

  const totalRequests = stats.errorRate.reduce((s, e) => s + e.count, 0);
  const errorCount = stats.errorRate.find(e => e._id === 'error')?.count || 0;
  const errorPct = totalRequests ? ((errorCount / totalRequests) * 100).toFixed(1) : '0.0';

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.pageHeader}>
        <div>
          <h2 style={styles.pageTitle}>Inference Dashboard</h2>
          <p style={styles.pageSubtitle}>Last updated {lastRefresh.toLocaleTimeString()}</p>
        </div>
        <button style={styles.refreshBtn} onClick={load}>↻ Refresh</button>
      </div>

      {/* Stat Cards */}
      <div style={styles.cards}>
        <StatCard label="Avg Latency" value={`${Math.round(stats.latency.avgLatency || 0)}ms`} icon="⚡" color="#6366f1" sub="response time" />
        <StatCard label="P95 Latency" value={`${Math.round(stats.latency.p95 || 0)}ms`} icon="📈" color="#f59e0b" sub="95th percentile" />
        <StatCard label="P99 Latency" value={`${Math.round(stats.latency.p99 || 0)}ms`} icon="🎯" color="#ef4444" sub="99th percentile" />
        <StatCard label="Total Requests" value={totalRequests.toLocaleString()} icon="🔢" color="#22c55e" sub={`${errorPct}% error rate`} />
        <StatCard label="Total Tokens" value={(stats.tokens.totalTokens || 0).toLocaleString()} icon="🪙" color="#8b5cf6" sub="all time" />
        <StatCard label="Prompt Tokens" value={(stats.tokens.totalPromptTokens || 0).toLocaleString()} icon="📝" color="#06b6d4" sub="input" />
      </div>

      {/* Charts Row 1 */}
      <div style={styles.chartsRow}>
        <ChartCard title="Throughput" subtitle="Requests per hour" wide>
          {throughputData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={throughputData}>
                <defs>
                  <linearGradient id="throughputGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="time" tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="requests" stroke="#6366f1" strokeWidth={2} fill="url(#throughputGrad)" dot={false} name="Requests" />
              </AreaChart>
            </ResponsiveContainer>
          ) : <EmptyChart />}
        </ChartCard>

        <ChartCard title="Request Status" subtitle="Success vs errors">
          {errorData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={errorData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3}>
                  {errorData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="none" />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  formatter={(v) => <span style={{ color: '#94a3b8', fontSize: '12px' }}>{v}</span>}
                  iconType="circle" iconSize={8}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : <EmptyChart />}
        </ChartCard>
      </div>

      {/* Charts Row 2 */}
      <div style={styles.chartsRow}>
        <ChartCard title="Provider Breakdown" subtitle="Requests & avg latency per provider" wide>
          {providerData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={providerData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="name" tick={{ fill: '#475569', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend formatter={(v) => <span style={{ color: '#94a3b8', fontSize: '12px' }}>{v}</span>} iconType="circle" iconSize={8} />
                <Bar dataKey="requests" fill="#6366f1" radius={[4, 4, 0, 0]} name="Requests" />
                <Bar dataKey="latency" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Avg Latency (ms)" />
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyChart />}
        </ChartCard>

        <ChartCard title="Token Usage" subtitle="Prompt vs completion tokens">
          {stats.tokens.totalTokens > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Prompt', value: stats.tokens.totalPromptTokens || 0 },
                    { name: 'Completion', value: stats.tokens.totalCompletionTokens || 0 },
                  ]}
                  dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3}
                >
                  <Cell fill="#6366f1" stroke="none" />
                  <Cell fill="#22c55e" stroke="none" />
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend formatter={(v) => <span style={{ color: '#94a3b8', fontSize: '12px' }}>{v}</span>} iconType="circle" iconSize={8} />
              </PieChart>
            </ResponsiveContainer>
          ) : <EmptyChart />}
        </ChartCard>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, color, sub }) {
  return (
    <div style={styles.card}>
      <div style={styles.cardTop}>
        <div style={{ ...styles.cardIcon, background: `${color}18`, color }}>
          {icon}
        </div>
        <span style={styles.cardLabel}>{label}</span>
      </div>
      <span style={styles.cardValue}>{value}</span>
      <span style={styles.cardSub}>{sub}</span>
    </div>
  );
}

function ChartCard({ title, subtitle, children, wide }) {
  return (
    <div style={{ ...styles.chartCard, ...(wide ? styles.chartCardWide : {}) }}>
      <div style={styles.chartHeader}>
        <p style={styles.chartTitle}>{title}</p>
        <p style={styles.chartSubtitle}>{subtitle}</p>
      </div>
      {children}
    </div>
  );
}

function EmptyChart() {
  return (
    <div style={styles.emptyChart}>
      <p style={styles.emptyChartText}>No data yet</p>
    </div>
  );
}

const styles = {
  container: { padding: '28px', overflowY: 'auto', height: '100%', background: '#080d14' },

  loadingScreen: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '16px' },
  loadingIcon: { fontSize: '32px', color: '#6366f1', animation: 'pulse 1.5s ease infinite' },
  loadingText: { color: '#475569', fontSize: '14px' },

  pageHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' },
  pageTitle: { color: '#f1f5f9', fontSize: '22px', fontWeight: 700, letterSpacing: '-0.4px' },
  pageSubtitle: { color: '#334155', fontSize: '12px', marginTop: '4px' },
  refreshBtn: {
    padding: '8px 16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)',
    background: 'rgba(255,255,255,0.04)', color: '#64748b', cursor: 'pointer',
    fontSize: '13px', fontWeight: 500,
  },

  cards: { display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '12px', marginBottom: '20px' },
  card: {
    background: '#0c1220', borderRadius: '12px', padding: '16px',
    border: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', gap: '6px',
  },
  cardTop: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' },
  cardIcon: { width: '28px', height: '28px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' },
  cardLabel: { color: '#475569', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' },
  cardValue: { color: '#f1f5f9', fontSize: '22px', fontWeight: 700, letterSpacing: '-0.5px' },
  cardSub: { color: '#334155', fontSize: '11px' },

  chartsRow: { display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px', marginBottom: '16px' },
  chartCard: {
    background: '#0c1220', borderRadius: '14px', padding: '20px',
    border: '1px solid rgba(255,255,255,0.06)',
  },
  chartCardWide: {},
  chartHeader: { marginBottom: '16px' },
  chartTitle: { color: '#e2e8f0', fontSize: '14px', fontWeight: 600 },
  chartSubtitle: { color: '#334155', fontSize: '11px', marginTop: '3px' },
  emptyChart: { height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  emptyChartText: { color: '#1e293b', fontSize: '13px' },
};
