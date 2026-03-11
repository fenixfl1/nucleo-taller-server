import json
import re
import sys
from datetime import datetime, timedelta
from pathlib import Path
from zipfile import ZipFile
from xml.etree import ElementTree as ET

NS = {
    "main": "http://schemas.openxmlformats.org/spreadsheetml/2006/main",
    "rel": "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
}

CONTACT_SHEET = "CONTACTOS"
ARTICLE_SHEET = "PRECIOS RC"
WORK_ORDER_SHEET = "TRABAJOS"

HEADER_SKIP = {"NOMBRE", "NUMERO", "NOTA", "CLIENTES"}
ARTICLE_ENGINE_MARKERS = {"V4", "V6", "V8", "L3", "L4", "L5", "L6"}
WORK_ORDER_HEADER_ROW = {"B": "NO", "C": "DETALLE DEL TRABAJO", "D": "VEHICULO", "E": "CLIENTE"}
WORK_ORDER_SUBHEADER_ROW = {"H": "EFECTIVO / CREDITO", "K": "DESMONTE"}
WORK_ORDER_STOP_MARKERS = {"TOTAL", "CODIGO"}
WORK_ORDER_REQUIRED_COLUMNS = ("C", "D", "E")


def normalize_spaces(value):
    return re.sub(r"\s+", " ", str(value or "")).strip()


def extract_cell_ref(cell_ref):
    match = re.match(r"([A-Z]+)(\d+)", cell_ref or "")
    if not match:
        return "", 0
    return match.group(1), int(match.group(2))


def to_year(value):
    numeric = int(value)
    if len(value) == 4:
        return numeric
    if numeric <= 30:
        return 2000 + numeric
    if numeric >= 80:
        return 1900 + numeric
    return None


def parse_year_token(token):
    value = normalize_spaces(token).upper()
    match = re.match(r"^(\d{2,4})-(\d{2,4})$", value)
    if not match:
        return None, None, False
    return to_year(match.group(1)), to_year(match.group(2)), True


def is_engine_token(token):
    value = normalize_spaces(token).upper()
    if not value:
        return False
    if value in ARTICLE_ENGINE_MARKERS:
        return True
    if re.match(r"^\d+(\.\d+)?(\/\d+(\.\d+)?)+$", value):
        return True
    if re.match(r"^\d+(\.\d+)?$", value):
        return True
    return False


def extract_phone_candidates(*sources):
    values = []
    for source in sources:
        text = normalize_spaces(source)
        if not text:
            continue
        values.extend(re.findall(r"\d[\d\-\s/()]{6,}\d", text))

    phones = []
    seen = set()
    for value in values:
        for piece in re.split(r"/", value):
            digits = re.sub(r"\D", "", piece)
            if len(digits) not in (10, 11):
                continue
            if len(digits) == 11 and digits.startswith("1"):
                digits = digits[1:]
            if len(digits) != 10 or digits in seen:
                continue
            seen.add(digits)
            phones.append(f"{digits[:3]}-{digits[3:6]}-{digits[6:]}")
    return phones


def parse_decimal(value):
    text = normalize_spaces(value)
    if not text:
        return None

    normalized = text.replace(",", "").replace("%", "")
    try:
        return round(float(normalized), 2)
    except Exception:
        return None


def parse_yes_no(value):
    text = normalize_spaces(value).upper()
    if text == "SI":
        return True
    if text == "NO":
        return False
    return None


def parse_excel_date(value):
    text = normalize_spaces(value)
    if not text or text in {"0", "0.0"}:
        return None

    numeric = parse_decimal(text)
    if numeric is not None and 20000 <= numeric <= 70000:
        base = datetime(1899, 12, 30)
        try:
            return (base + timedelta(days=float(numeric))).date().isoformat()
        except Exception:
            return None

    for fmt in ("%d/%m/%Y", "%d-%m-%Y", "%m/%d/%Y", "%Y-%m-%d"):
        try:
            return datetime.strptime(text, fmt).date().isoformat()
        except Exception:
            continue

    return None


def decode_workbook(path):
    workbook = {}

    with ZipFile(path) as package:
        workbook_xml = ET.fromstring(package.read("xl/workbook.xml"))
        rels_xml = ET.fromstring(package.read("xl/_rels/workbook.xml.rels"))
        relationships = {
            rel.attrib["Id"]: rel.attrib["Target"] for rel in rels_xml
        }

        shared_strings = []
        if "xl/sharedStrings.xml" in package.namelist():
            shared_xml = ET.fromstring(package.read("xl/sharedStrings.xml"))
            for item in shared_xml.findall("main:si", NS):
                text = "".join(node.text or "" for node in item.iterfind(".//main:t", NS))
                shared_strings.append(text)

        sheets_node = workbook_xml.find("main:sheets", NS)
        for sheet in sheets_node:
            name = sheet.attrib["name"]
            rel_id = sheet.attrib["{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id"]
            target = "xl/" + relationships[rel_id]
            xml = ET.fromstring(package.read(target))
            rows = []
            for row in xml.find("main:sheetData", NS).findall("main:row", NS):
                item = {"row": int(row.attrib.get("r", "0")), "cells": {}}
                for cell in row.findall("main:c", NS):
                    col, _ = extract_cell_ref(cell.attrib.get("r", ""))
                    cell_type = cell.attrib.get("t")
                    value_node = cell.find("main:v", NS)
                    inline_node = cell.find("main:is", NS)
                    value = None
                    if value_node is not None:
                        value = value_node.text
                        if cell_type == "s":
                            try:
                                value = shared_strings[int(value)]
                            except Exception:
                                pass
                    elif inline_node is not None:
                        value = "".join(
                            node.text or "" for node in inline_node.iterfind(".//main:t", NS)
                        )
                    item["cells"][col] = value
                rows.append(item)
            workbook[name] = rows
    return workbook


def extract_contacts(rows):
    contacts = []
    for row in rows:
        if row["row"] < 2:
            continue
        name = normalize_spaces(row["cells"].get("A"))
        phone = normalize_spaces(row["cells"].get("B"))
        note = normalize_spaces(row["cells"].get("C"))
        if not name or name.upper() in HEADER_SKIP:
            continue
        phones = extract_phone_candidates(phone, note)
        contacts.append({
            "name": name,
            "phones": phones,
            "note": note,
            "source_row": row["row"],
        })
    return contacts


def extract_article_compatibilities(description):
    text = normalize_spaces(description).upper()
    if not text:
        return []

    parts = text.split()
    if len(parts) < 2:
        return []

    brand = parts[0]
    tail = parts[1:]
    year_from = None
    year_to = None
    year_hint = None
    engine_tokens = []

    while tail:
        candidate = tail[-1]
        parsed_from, parsed_to, is_yearish = parse_year_token(candidate)
        if is_yearish:
            year_from = parsed_from
            year_to = parsed_to
            year_hint = candidate
            tail.pop()
            continue
        if is_engine_token(candidate) or candidate in {"VALEO", "DENSO"}:
            engine_tokens.insert(0, candidate)
            tail.pop()
            continue
        break

    raw_models = " ".join(tail).strip()
    if not raw_models:
        raw_models = " ".join(parts[1:]).strip()

    model_candidates = []
    for item in raw_models.split("/"):
        model = normalize_spaces(item)
        if model:
            model_candidates.append(model)

    if not model_candidates and raw_models:
        model_candidates = [raw_models]

    compatibilities = []
    seen = set()
    for model in model_candidates:
        key = (brand, model, year_from, year_to, " ".join(engine_tokens))
        if key in seen:
            continue
        seen.add(key)
        notes = []
        if year_hint and (year_from is None or year_to is None):
            notes.append(f"Rango original: {year_hint}")
        compatibilities.append({
            "brand": brand,
            "model": model,
            "year_from": year_from,
            "year_to": year_to,
            "engine": " ".join(engine_tokens) or None,
            "notes": " | ".join(notes) or None,
        })
    return compatibilities


def extract_articles(rows):
    articles = []
    for row in rows:
        if row["row"] < 2:
            continue
        code_and_name = normalize_spaces(row["cells"].get("A"))
        cost = normalize_spaces(row["cells"].get("B"))
        if not code_and_name:
            continue

        match = re.match(r"^([A-Z]{2,}\d+)\s+(.*)$", code_and_name.upper())
        if not match:
            continue

        code = match.group(1).strip()
        description = normalize_spaces(match.group(2))
        if not description:
            continue

        numeric_cost = None
        if cost:
            normalized = cost.replace(",", "")
            try:
                numeric_cost = float(normalized)
            except Exception:
                numeric_cost = None

        articles.append({
            "code": code,
            "name": description,
            "cost_reference": numeric_cost,
            "compatibilities": extract_article_compatibilities(description),
            "source_row": row["row"],
        })
    return articles


def is_work_order_header(row):
    return all(
        normalize_spaces(row["cells"].get(column)).upper() == expected
        for column, expected in WORK_ORDER_HEADER_ROW.items()
    )


def is_work_order_subheader(row):
    return all(
        normalize_spaces(row["cells"].get(column)).upper() == expected
        for column, expected in WORK_ORDER_SUBHEADER_ROW.items()
    )


def has_positive_amount(*values):
    for value in values:
        numeric = parse_decimal(value)
        if numeric is not None and numeric > 0:
            return True
    return False


def extract_work_orders(rows):
    work_orders = []
    in_work_order_block = False
    skip_subheader = False

    for row in rows:
        cells = row["cells"]
        code = normalize_spaces(cells.get("B")).upper()

        if is_work_order_header(row):
            in_work_order_block = True
            skip_subheader = True
            continue

        if not in_work_order_block:
            continue

        if skip_subheader and is_work_order_subheader(row):
            skip_subheader = False
            continue

        if code in WORK_ORDER_STOP_MARKERS or is_work_order_header(row):
            in_work_order_block = False
            skip_subheader = False
            continue

        detail = normalize_spaces(cells.get("C"))
        vehicle = normalize_spaces(cells.get("D"))
        customer = normalize_spaces(cells.get("E"))
        payment_method = normalize_spaces(cells.get("H"))

        if not any(normalize_spaces(cells.get(column)) for column in WORK_ORDER_REQUIRED_COLUMNS):
            continue

        if not customer or not vehicle:
            continue

        if not (
            detail
            or has_positive_amount(
                cells.get("G"),
                cells.get("K"),
                cells.get("L"),
                cells.get("M"),
                cells.get("N"),
                cells.get("O"),
                cells.get("P"),
                cells.get("Q"),
                cells.get("R"),
                cells.get("S"),
                cells.get("U"),
            )
            or payment_method
        ):
            continue

        work_orders.append(
            {
                "source_row": row["row"],
                "legacy_no": normalize_spaces(cells.get("B")) or None,
                "opened_at": parse_excel_date(cells.get("A")),
                "detail": detail or None,
                "vehicle": vehicle or None,
                "customer": customer or None,
                "phones": extract_phone_candidates(cells.get("F")),
                "price": parse_decimal(cells.get("G")),
                "payment_method": payment_method or None,
                "requires_disassembly": parse_yes_no(cells.get("I")),
                "has_itbis": parse_yes_no(cells.get("J")),
                "desmont_amount": parse_decimal(cells.get("K")),
                "itbis_amount": parse_decimal(cells.get("L")),
                "piece_amount": parse_decimal(cells.get("M")),
                "other_discounts_amount": parse_decimal(cells.get("N")),
                "operation_cost_amount": parse_decimal(cells.get("O")),
                "coolant_amount": parse_decimal(cells.get("P")),
                "tapon_amount": parse_decimal(cells.get("Q")),
                "other_services_amount": parse_decimal(cells.get("R")),
                "technician_amount": parse_decimal(cells.get("S")),
                "technician_percent": parse_decimal(cells.get("T")),
                "total_rdb_amount": parse_decimal(cells.get("U")),
                "total_rdb_percent": parse_decimal(cells.get("V")),
            }
        )

    return work_orders


def main():
    if len(sys.argv) < 2:
        raise SystemExit("Usage: extract_excel_workbook.py <workbook_path>")

    workbook_path = Path(sys.argv[1]).expanduser().resolve()
    if not workbook_path.exists():
        raise SystemExit(f"Workbook not found: {workbook_path}")

    workbook = decode_workbook(workbook_path)
    payload = {
        "file": str(workbook_path),
        "contacts": extract_contacts(workbook.get(CONTACT_SHEET, [])),
        "articles": extract_articles(workbook.get(ARTICLE_SHEET, [])),
        "work_orders": extract_work_orders(workbook.get(WORK_ORDER_SHEET, [])),
    }
    print(json.dumps(payload, ensure_ascii=True))


if __name__ == "__main__":
    main()
