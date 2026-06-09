from __future__ import annotations

import argparse
import hashlib
import json
from dataclasses import dataclass, asdict
from pathlib import Path
from typing import Any


ROW_TYPES = {"item_detail", "customer_total", "daily_total", "grand_total", "receipt", "unknown"}


def stable_hash(value: Any) -> str:
    payload = json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


def number(value: Any) -> float:
    if value is None or value == "":
        return 0.0
    if isinstance(value, (int, float)):
        return float(value)
    cleaned = str(value).replace(",", "").replace("원", "").strip()
    try:
        return float(cleaned)
    except ValueError:
        return 0.0


def text(row: dict[str, Any], *keys: str) -> str:
    for key in keys:
        value = row.get(key)
        if value is not None and str(value).strip():
            return str(value).strip()
    return ""


def classify(row: dict[str, Any]) -> str:
    label = text(row, "구분", "row_type", "품명", "상품명")
    if "총계" in label or "grand" in label.lower():
        return "grand_total"
    if "일계" in label or "daily" in label.lower():
        return "daily_total"
    if "거래처계" in label or "거래처합계" in label or "customer_total" in label.lower():
        return "customer_total"
    if "입금" in label or "회입" in label or "receipt" in label.lower():
        return "receipt"
    if text(row, "상품명", "품명", "product_name") and (
        number(row.get("수량")) or number(row.get("단가")) or number(row.get("매출액"))
    ):
        return "item_detail"
    return "unknown"


@dataclass
class ParsedRow:
    row_index: int
    row_type: str
    part_code: str
    ledger_date: str
    customer_name: str | None
    product_name: str | None
    quantity: float
    unit_price: float
    sales_amount: float
    receipt_amount: float
    receipt_discount: float
    ar_balance: float | None
    identity_hash: str
    content_hash: str
    raw_row_json: dict[str, Any]
    errors: list[str]


def parse_rows(rows: list[dict[str, Any]], part_code: str, fallback_date: str) -> list[ParsedRow]:
    parsed: list[ParsedRow] = []
    for index, row in enumerate(rows, start=1):
        row_type = classify(row)
        ledger_date = text(row, "일자", "날짜", "date") or fallback_date
        customer_name = text(row, "거래처명", "customer_name", "거래처") or None
        product_name = text(row, "상품명", "품명", "product_name") or None
        ar_raw = row.get("외상잔액", row.get("잔액", row.get("ar_balance")))
        ar_balance = number(ar_raw) if ar_raw not in (None, "") else None
        errors: list[str] = []
        if row_type == "unknown":
            errors.append("분류할 수 없는 행입니다.")
        if row_type in {"item_detail", "customer_total", "receipt"} and not customer_name:
            errors.append("거래처명이 필요합니다.")

        identity_payload = {
            "part_code": part_code,
            "ledger_date": ledger_date,
            "row_type": row_type,
            "customer_name": customer_name,
            "product_name": product_name,
            "row_index": index if row_type == "unknown" else None,
        }
        values = {
            "quantity": number(row.get("수량", row.get("quantity"))),
            "unit_price": number(row.get("단가", row.get("unit_price"))),
            "sales_amount": number(row.get("매출액", row.get("금액", row.get("sales_amount")))),
            "receipt_amount": number(row.get("입금액", row.get("회입액", row.get("receipt_amount")))),
            "receipt_discount": number(row.get("입금할인", row.get("회입할인", row.get("receipt_discount")))),
        }
        content_payload = {**identity_payload, **values, "ar_balance": ar_balance, "raw_row_json": row}
        parsed.append(
            ParsedRow(
                row_index=index,
                row_type=row_type,
                part_code=part_code,
                ledger_date=ledger_date,
                customer_name=customer_name,
                product_name=product_name,
                ar_balance=ar_balance,
                identity_hash=stable_hash(identity_payload),
                content_hash=stable_hash(content_payload),
                raw_row_json=row,
                errors=errors,
                **values,
            )
        )
    return parsed


def read_excel(path: Path) -> list[dict[str, Any]]:
    import pandas as pd

    frame = pd.read_excel(path, dtype=object)
    frame = frame.where(pd.notnull(frame), None)
    return frame.to_dict(orient="records")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("file")
    parser.add_argument("--part-code", required=True)
    parser.add_argument("--period-end", required=True)
    args = parser.parse_args()

    rows = read_excel(Path(args.file))
    parsed = parse_rows(rows, args.part_code, args.period_end)
    print(json.dumps([asdict(row) for row in parsed], ensure_ascii=False))


if __name__ == "__main__":
    main()
