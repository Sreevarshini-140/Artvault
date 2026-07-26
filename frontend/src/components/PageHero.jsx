export default function PageHero({ eyebrow, title, text, children }) {
  return <section className="page-hero container">
    <span className="eyebrow">{eyebrow}</span>
    <h1>{title}</h1>
    {text && <p>{text}</p>}
    {children}
  </section>;
}
