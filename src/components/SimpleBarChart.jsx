export default function SimpleBarChart({ data }) {
  const max = Math.max(...data.map((item) => item.value), 1);

  return (
    <div className="card chart-card">
      <h3>Top engajamento</h3>
      <div className="bars">
        {data.map((item) => (
          <div key={item.label} className="bar-row">
            <span>{item.label}</span>
            <div className="bar-track">
              <div className="bar" style={{ width: `${(item.value / max) * 100}%` }} />
            </div>
            <strong>{item.value}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}
