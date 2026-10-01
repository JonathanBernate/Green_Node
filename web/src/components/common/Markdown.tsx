import React from 'react';

/** Render mínimo y seguro de Markdown (títulos, listas, tablas, citas, negrita/cursiva). No interpreta HTML. */
function inline(text: string): React.ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g).map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) return <strong key={i}>{part.slice(2, -2)}</strong>;
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) return <em key={i}>{part.slice(1, -1)}</em>;
    return part;
  });
}

const cells = (row: string) => row.trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim());
const BLOCK_START = /^(#{2,4}\s|\||>|\s*[-*]\s|\s*\d+\.\s)/;

export function Markdown({ source }: { source: string }) {
  const lines = source.split('\n');
  const out: React.ReactNode[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { i += 1; continue; }

    const h = /^(#{2,4})\s+(.*)$/.exec(line);
    if (h) {
      out.push(React.createElement(`h${h[1].length + 1}`, { key: i, className: 'md-h' }, inline(h[2])));
      i += 1;
    } else if (line.trim().startsWith('|')) {
      const rows: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) { rows.push(lines[i]); i += 1; }
      const [head, , ...body] = rows;
      out.push(
        <div className="md-table-wrap" key={i}>
          <table className="md-table">
            <thead><tr>{cells(head).map((c, k) => <th key={k}>{inline(c)}</th>)}</tr></thead>
            <tbody>{body.map((r, k) => <tr key={k}>{cells(r).map((c, m) => <td key={m}>{inline(c)}</td>)}</tr>)}</tbody>
          </table>
        </div>,
      );
    } else if (/^\s*[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) { items.push(lines[i].replace(/^\s*[-*]\s+/, '')); i += 1; }
      out.push(<ul className="md-list" key={i}>{items.map((t, k) => <li key={k}>{inline(t)}</li>)}</ul>);
    } else if (/^\s*\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) { items.push(lines[i].replace(/^\s*\d+\.\s+/, '')); i += 1; }
      out.push(<ol className="md-list" key={i}>{items.map((t, k) => <li key={k}>{inline(t)}</li>)}</ol>);
    } else if (line.startsWith('>')) {
      const q: string[] = [];
      while (i < lines.length && lines[i].startsWith('>')) { q.push(lines[i].replace(/^>\s?/, '')); i += 1; }
      out.push(<blockquote className="md-quote" key={i}>{inline(q.join(' '))}</blockquote>);
    } else {
      const p: string[] = [];
      while (i < lines.length && lines[i].trim() && (p.length === 0 || !BLOCK_START.test(lines[i]))) { p.push(lines[i]); i += 1; }
      out.push(<p className="md-p" key={i}>{inline(p.join(' '))}</p>);
    }
  }
  return <div className="markdown">{out}</div>;
}
