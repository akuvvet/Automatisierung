from flask import Flask, request, send_file, jsonify
from flask_cors import CORS
from datetime import datetime
from io import BytesIO
import pandas as pd


def process_excel(file):
    df = pd.read_excel(file, header=None)
    data_rows = []
    for index, row in df.iterrows():
        if index >= 3:
            art_no = row[1] if pd.notna(row[1]) else None
            art_name = row[3] if pd.notna(row[3]) else None
            koli = row[10] if pd.notna(row[10]) else 0
            menge = row[13] if pd.notna(row[13]) else 0
            if (
                art_no and str(art_no).strip()
                and str(art_no).strip().lower() not in ['artikel', 'lagerbuch', 'lagerbuchkonto', '']
                and (not art_name or str(art_name).strip().lower() not in ['lagerbuch', 'artikel', ''])
                and not any(x in str(art_no).lower() for x in ['sayfa', 'toplam', 'seite'])
                and not any(x in str(art_name).lower() for x in ['lagerbuch', 'artikel', 'konto'])
            ):
                try:
                    koli_val = float(koli)
                    menge_val = float(menge)
                    data_rows.append({
                        'art_no': str(art_no).strip(),
                        'art_name': str(art_name).strip() if art_name else '',
                        'koli': koli_val,
                        'menge': menge_val,
                        'order': index
                    })
                except (ValueError, TypeError):
                    continue
    grouped_data = {}
    for item in data_rows:
        art_no = item['art_no']
        if art_no not in grouped_data:
            grouped_data[art_no] = item
        else:
            grouped_data[art_no]['koli'] += item['koli']
            grouped_data[art_no]['menge'] += item['menge']
    result = sorted(grouped_data.values(), key=lambda x: x['order'])
    return result


def create_pdf(data, output_buffer: BytesIO):
    from reportlab.lib.pagesizes import letter
    from reportlab.pdfgen import canvas

    c = canvas.Canvas(output_buffer, pagesize=letter)
    width, height = letter

    rows_per_column = 55
    line_height = 12
    top_margin = 50
    bottom_margin = 20
    col_width = (width - 60) / 2

    today = datetime.today().strftime('%d.%m.%Y')
    current_page = 1
    total_items = len(data)
    total_pages = (total_items + (rows_per_column * 2) - 1) // (rows_per_column * 2)

    def draw_header(page_num):
        c.setFont("Helvetica-Bold", 14)
        c.drawString(40, height - 30, f"{today}")
        c.drawRightString(width - 40, height - 30, f"Seite {page_num} von {total_pages}")
        c.setFont("Helvetica-Bold", 12)
        c.drawCentredString(width / 2, height - 30, "KLEES LAGERBUCH")
        for x_offset in [0, col_width]:
            header_y = height - top_margin
            c.drawString(40 + x_offset, header_y, "A.No")
            c.drawString(78 + x_offset, header_y, "Artikel")
            c.drawRightString(260 + x_offset, header_y, "Kolli")
            c.drawRightString(300 + x_offset, header_y, "Menge")
            c.drawRightString(220 + x_offset, header_y, "Bestand")
        c.line(40, height - top_margin - 5, width - 40, height - top_margin - 5)
        c.setLineWidth(1.5)
        c.line(40 + col_width - 5, height - top_margin, 40 + col_width - 5, bottom_margin)

    y_positions = [height - top_margin - 20] * 2
    col_index = 0  # 0 = left, 1 = right

    draw_header(current_page)

    for item in data:
        if y_positions[col_index] < bottom_margin:
            if col_index == 0:
                col_index = 1
            else:
                c.showPage()
                current_page += 1
                draw_header(current_page)
                y_positions = [height - top_margin - 20] * 2
                col_index = 0
        x_offset = 0 if col_index == 0 else col_width
        y_pos = y_positions[col_index]
        c.setFont("Helvetica", 9)
        c.drawString(40 + x_offset, y_pos, str(item['art_no'])[:6])
        art_name_short = (item['art_name'] or '')[:20]
        c.drawString(78 + x_offset, y_pos, art_name_short)
        c.setFont("Helvetica-Bold", 10)
        c.drawRightString(260 + x_offset, y_pos, f"{item['koli']:.1f}")
        c.setFont("Helvetica", 9)
        c.drawRightString(300 + x_offset, y_pos, f"{item['menge']:.1f}")
        c.setFont("Helvetica", 9)
        c.drawRightString(220 + x_offset, y_pos, "")
        c.setLineWidth(0.2)
        c.line(40 + x_offset, y_pos - 3, 320 + x_offset, y_pos - 3)
        y_positions[col_index] -= 12

    c.save()


app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": ["http://localhost:5173", "http://127.0.0.1:5173"], "supports_credentials": False}})


@app.get("/health")
def health():
    return jsonify({"ok": True, "service": "klees-xlsx-to-pdf"}), 200


@app.post("/upload")
def upload():
    uploaded_file = request.files.get("file")
    if not uploaded_file or uploaded_file.filename == "":
        return "Keine Datei hochgeladen.", 400
    file_bytes = uploaded_file.read()
    excel_stream = BytesIO(file_bytes)
    data = process_excel(excel_stream)
    pdf_buffer = BytesIO()
    create_pdf(data, pdf_buffer)
    pdf_buffer.seek(0)
    now = datetime.now()
    filename = f"lagerbuch_{now.strftime('%Y%m%d_%H%M%S')}.pdf"
    return send_file(pdf_buffer, mimetype="application/pdf", as_attachment=True, download_name=filename)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5006)



