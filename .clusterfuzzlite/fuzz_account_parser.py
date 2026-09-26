"""Exercise arbitrary CLI output and generated valid account blocks."""
import json
import sys

import atheris

with atheris.instrument_imports():
    from extractAccountAsJson import extract_account_json


@atheris.instrument_func
def test_one_input(data):
    text = data.decode("utf-8", errors="replace")
    result = extract_account_json(text)
    if result is not None:
        assert result in text
        assert extract_account_json(result) == result

    # Structured inputs ensure mutations reach successful extraction as well.
    account = {
        "accountId": "0.0." + str(len(data)),
        "publicKey": data.hex(),
        "balance": int.from_bytes(data[:8], "big"),
    }
    block = json.dumps(account)
    # A log line cannot contain a competing account block.
    noise = text.replace("{", "[").replace("}", "]")
    assert extract_account_json(noise + "\n" + block + "\n" + noise) == block
    assert extract_account_json(block + "\n" + block) == block


if __name__ == "__main__":
    atheris.Setup(sys.argv, test_one_input)
    atheris.Fuzz()
