export default function StatCard({ label, value, note }) {
  return <article className="stat-card"><span>{label}</span><strong>{value}</strong>{note && <small>{note}</small>}</article>;
}
