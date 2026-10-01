# -*- coding: utf-8 -*-
"""Conversor sencillo de Markdown a .docx para las guias de GreenNode."""
import re
import sys

from docx import Document
from docx.shared import Pt, RGBColor


def add_runs_with_bold(paragraph, text):
    for part in re.split(r"(\*\*.+?\*\*)", text):
        if part.startswith("**") and part.endswith("**"):
            paragraph.add_run(part[2:-2]).bold = True
        else:
            paragraph.add_run(part)


def convert(md_path, docx_path):
    with open(md_path, encoding="utf-8") as f:
        lines = f.read().split("\n")

    doc = Document()
    doc.styles["Normal"].font.name = "Calibri"
    doc.styles["Normal"].font.size = Pt(11)

    i = 0
    while i < len(lines):
        line = lines[i]

        if line.strip().startswith("```"):
            i += 1
            code = []
            while i < len(lines) and not lines[i].strip().startswith("```"):
                code.append(lines[i]); i += 1
            p = doc.add_paragraph()
            run = p.add_run("\n".join(code))
            run.font.name = "Consolas"; run.font.size = Pt(9)
            run.font.color.rgb = RGBColor(0x1B, 0x5E, 0x20)
            i += 1
            continue

        if line.strip().startswith("|") and i + 1 < len(lines) and re.match(r"^\s*\|[-:\s|]+\|\s*$", lines[i + 1]):
            header = [c.strip() for c in line.strip().strip("|").split("|")]
            i += 2
            rows = []
            while i < len(lines) and lines[i].strip().startswith("|"):
                rows.append([c.strip() for c in lines[i].strip().strip("|").split("|")]); i += 1
            table = doc.add_table(rows=1, cols=len(header)); table.style = "Light Grid Accent 1"
            for j, h in enumerate(header):
                c = table.rows[0].cells[j]; c.text = ""
                add_runs_with_bold(c.paragraphs[0], h)
                for r in c.paragraphs[0].runs:
                    r.bold = True
            for row in rows:
                cells = table.add_row().cells
                for j, val in enumerate(row):
                    if j < len(cells):
                        cells[j].text = ""; add_runs_with_bold(cells[j].paragraphs[0], val)
            doc.add_paragraph()
            continue

        m = re.match(r"^(#{1,4})\s+(.*)$", line)
        if m:
            doc.add_heading(m.group(2).strip(), level=len(m.group(1))); i += 1; continue

        if line.strip() == "---":
            i += 1; continue

        if line.strip().startswith(">"):
            p = doc.add_paragraph(style="Intense Quote")
            add_runs_with_bold(p, line.strip().lstrip(">").strip()); i += 1; continue

        m = re.match(r"^\s*-\s*\[( |x|X)\]\s+(.*)$", line)
        if m:
            p = doc.add_paragraph(style="List Bullet")
            p.add_run(("[x] " if m.group(1).lower() == "x" else "[ ] ")).bold = True
            add_runs_with_bold(p, m.group(2).strip()); i += 1; continue

        m = re.match(r"^(\s*)-\s+(.*)$", line)
        if m:
            add_runs_with_bold(doc.add_paragraph(style="List Bullet"), m.group(2).strip()); i += 1; continue

        m = re.match(r"^\s*\d+\.\s+(.*)$", line)
        if m:
            add_runs_with_bold(doc.add_paragraph(style="List Number"), m.group(1).strip()); i += 1; continue

        if line.strip() == "":
            i += 1; continue

        add_runs_with_bold(doc.add_paragraph(), line); i += 1

    doc.save(docx_path)
    print(f"Guardado: {docx_path}")


if __name__ == "__main__":
    src = sys.argv[1] if len(sys.argv) > 1 else "../docs/GUIA_PENDIENTES.md"
    dst = sys.argv[2] if len(sys.argv) > 2 else "../docs/GUIA_PENDIENTES.docx"
    convert(src, dst)
