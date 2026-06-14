import unittest
import sys
from pathlib import Path
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parent))
from parser import excel_engine_for, parse_rows, read_excel


class ParserTests(unittest.TestCase):
    def test_classifies_and_hashes_rows(self):
        rows = [
            {"일자": "2026-06-07", "거래처명": "한빛마트", "구분": "거래처계", "매출액": 1000, "외상잔액": 3000},
            {"일자": "2026-06-07", "거래처명": "한빛마트", "상품명": "왕만두", "수량": 1, "단가": 1000, "매출액": 1000},
            {"일자": "2026-06-07", "거래처명": "한빛마트", "구분": "입금", "입금액": 700, "입금할인": 50},
        ]

        parsed = parse_rows(rows, "A", "2026-06-30")

        self.assertEqual(parsed[0].row_type, "customer_total")
        self.assertEqual(parsed[1].row_type, "item_detail")
        self.assertEqual(parsed[2].receipt_amount + parsed[2].receipt_discount, 750)
        self.assertTrue(parsed[0].identity_hash)
        self.assertTrue(parsed[0].content_hash)

    def test_selects_xlrd_for_legacy_xls_workbooks(self):
        self.assertEqual(excel_engine_for(Path("ledger.XLS")), "xlrd")

    def test_selects_openpyxl_for_xlsx_workbooks(self):
        self.assertEqual(excel_engine_for(Path("ledger.xlsx")), "openpyxl")

    @patch("pandas.read_excel")
    def test_reads_legacy_xls_with_xlrd_engine(self, read_excel_mock):
        import pandas as pd

        read_excel_mock.return_value = pd.DataFrame([{"row_type": "customer_total"}])

        rows = read_excel(Path("ledger.XLS"))

        self.assertEqual(rows, [{"row_type": "customer_total"}])
        self.assertEqual(read_excel_mock.call_args.kwargs["engine"], "xlrd")


if __name__ == "__main__":
    unittest.main()
