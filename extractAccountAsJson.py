
import re
import sys
import os
input_text = sys.stdin.read()
json_regex = r'\{\s*\"accountId\":\s*\".*?\",\s*\"publicKey\":\s*\".*?\",\s*\"balance\":\s*\d+\s*\}'
json_match = re.search(json_regex, input_text)

if json_match:
    json_block = json_match.group(0)
    print(json_block)
