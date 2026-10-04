import { Modal } from '../components/common/Modal';
import { TERMS_SECTIONS, TERMS_UPDATED } from '../content/terms';

/** Términos y condiciones en modal. Se abre sobre el login/registro sin iniciar sesión (se cierra con ✕, Esc o "Entendido"). */
export function TermsScreen({ onBack }: { onBack: () => void }) {
  const jump = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    document.getElementById(`t-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <Modal title="Términos y condiciones" onClose={onBack} className="terms-modal">
      <div className="terms-scroll">
        <p className="legal-updated">Última actualización: {TERMS_UPDATED}</p>
        <p className="legal-intro">
          Lee con atención estas condiciones antes de usar GreenNode. Aquí explicamos qué ofrece la aplicación,
          cómo tratamos tus datos y qué esperamos de ti.
        </p>

        <div className="legal-layout">
          <nav className="legal-toc" aria-label="Contenido">
            <b>Contenido</b>
            <ol>
              {TERMS_SECTIONS.map((s) => (
                <li key={s.id}><a href={`#t-${s.id}`} onClick={jump(s.id)}>{s.title}</a></li>
              ))}
            </ol>
          </nav>

          <div className="legal-body">
            {TERMS_SECTIONS.map((s, i) => (
              <section key={s.id} id={`t-${s.id}`} aria-labelledby={`h-${s.id}`}>
                <h2 id={`h-${s.id}`}><span>{i + 1}</span>{s.title}</h2>
                {groupParagraphs(s.body).map((g, k) =>
                  g.list ? (
                    <ul key={k}>{g.items.map((it) => <li key={it}>{it}</li>)}</ul>
                  ) : (
                    <p key={k}>{g.items[0]}</p>
                  ),
                )}
              </section>
            ))}
            <p className="legal-end">Al usar GreenNode confirmas que has leído y aceptas estos términos.</p>
            <button type="button" className="btn btn-primary btn-large legal-ok" onClick={onBack}>Entendido</button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

/** Agrupa los "• ..." consecutivos en una lista. */
export function groupParagraphs(body: string[]): { list: boolean; items: string[] }[] {
  const out: { list: boolean; items: string[] }[] = [];
  for (const line of body) {
    const isItem = line.startsWith('• ');
    const text = isItem ? line.slice(2) : line;
    const last = out[out.length - 1];
    if (isItem && last?.list) last.items.push(text);
    else out.push({ list: isItem, items: [text] });
  }
  return out;
}
