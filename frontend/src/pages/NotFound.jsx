import { Link } from "react-router-dom";
export default function NotFound(){return <section className="empty-page"><span className="eyebrow">404</span><h1>This gallery does not exist.</h1><p>The page may have moved or the link may be incorrect.</p><Link className="btn" to="/">Return home</Link></section>}
