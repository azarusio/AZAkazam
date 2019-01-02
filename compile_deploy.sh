#!/bin/sh
cd src
eosio-cpp -o hello.wasm hello.cpp --abigen
cleos wallet create --file my_keys