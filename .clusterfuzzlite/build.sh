#!/bin/bash
set -eu
cp .clusterfuzzlite/fuzz_account_parser.py ./fuzz_account_parser.py
compile_python_fuzzer fuzz_account_parser.py
zip -j "$OUT/fuzz_account_parser_seed_corpus.zip" .clusterfuzzlite/corpus/*
