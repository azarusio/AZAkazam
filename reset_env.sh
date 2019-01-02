#!/bin/sh
docker stop eosio
docker rm -f eosio

docker pull eosio/eos:v1.5.0

echo "> Starting a fresh nodeos"
if grep -q Microsoft /proc/version; then
  dir="$(where.exe README.md  | sed 's=\\=\\\\=g'| sed 's/README.md/\src\:\/home\/src/' | sed 's/\r//')"
  echo "Ubuntu on Windows: $dir"
else
  dir="`pwd`/src:/home/src"
  echo "native Linux: $dir"
fi


docker run --name eosio \
  --publish 7777:7777 \
  --publish 127.0.0.1:5555:5555 \
  --volume "${dir}" \
  --detach \
  eosio/eos:v1.5.0 \
  /bin/bash -c \
  "keosd --http-server-address=0.0.0.0:5555 & exec nodeos -e -p eosio --plugin eosio::producer_plugin --plugin eosio::chain_api_plugin --plugin eosio::history_plugin --plugin eosio::history_api_plugin --plugin eosio::http_plugin -d /mnt/dev/data --config-dir /mnt/dev/config --http-server-address=0.0.0.0:7777 --access-control-allow-origin=* --contracts-console --http-validate-host=false --filter-on='*'"