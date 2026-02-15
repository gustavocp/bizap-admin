export default function MetricCard({ title, value, subtitle }) {
  return (
    <article className="card metric-card">
      <h3>{title}</h3>
      <p className="metric-value">{value}</p>
      {subtitle ? <small>{subtitle}</small> : null}
    </article>
  );
}
