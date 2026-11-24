"""Extract the first account block from Solo CLI output."""

import re
import sys

JSON_REGEX = r'\{\s*\"accountId\":\s*\".*?\",\s*\"publicKey\":\s*\".*?\",\s*\"balance\":\s*\d+\s*\}'


def extract_account_json(input_text):
    """Return the matching account block, or None when absent."""
    match = re.search(JSON_REGEX, input_text)
    return match.group(0) if match else None


def main():
    result = extract_account_json(sys.stdin.read())
    if result is not None:
        print(result)


if __name__ == "__main__":
    main()
