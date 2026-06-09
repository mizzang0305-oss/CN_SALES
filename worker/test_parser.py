import unittest
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from parser import parse_rows


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


if __name__ == "__main__":
    unittest.main()
