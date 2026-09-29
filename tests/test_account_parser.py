import subprocess
import sys
import unittest
from pathlib import Path

from extractAccountAsJson import extract_account_json

ROOT = Path(__file__).resolve().parents[1]
BLOCK = '{"accountId": "0.0.123", "publicKey": "abcd", "balance": 100}'


class AccountParserTests(unittest.TestCase):
    def test_cli_contract(self):
        for text, expected in [("log\n" + BLOCK + "\ndone", BLOCK + "\n"),
                               ("no account here", "")]:
            with self.subTest(text=text):
                result = subprocess.run(
                    [sys.executable, str(ROOT / "extractAccountAsJson.py")],
                    input=text, text=True, capture_output=True, check=True,
                )
                self.assertEqual(result.stdout, expected)
                self.assertEqual(result.stderr, "")

    def test_first_account(self):
        self.assertEqual(extract_account_json(BLOCK + BLOCK.replace("123", "456")), BLOCK)

    def test_multiline(self):
        block = BLOCK.replace(", ", ",\n  ")
        self.assertEqual(extract_account_json(block), block)

    def test_missing_or_truncated_account(self):
        for text in ("", "{}", BLOCK[:-1], '{"accountId": "0.0.1"}'):
            with self.subTest(text=text):
                self.assertIsNone(extract_account_json(text))
