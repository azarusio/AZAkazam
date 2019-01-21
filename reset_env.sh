#!/bin/sh

#******************************************************************************#
#       Script variables                                                       #
#******************************************************************************#
ConfigDIR="/tmp/config"
DataDIR="/tmp/data"
LogFile="/tmp/nodeos.log"

#******************************************************************************#
#       Show script info when launched                                         #
#******************************************************************************#
InfoMessage() {

	# Show status message to a user
	echo "> Starting a fresh nodeos"

	# Check if we use virtual Ubuntu machine on Windows
	if grep -q Microsoft /proc/version; then

		# Set correct directory for Windows
		dir="$(where.exe README.md  | sed 's=\\=\\\\=g'| sed 's/README.md/\src\:\/home\/src/' | sed 's/\r//')"
		echo "Ubuntu on Windows: $dir"
	else

		# Set correct directory for Linux
		dir="`pwd`/src:/home/src"
		echo "Native Linux: $dir"
	fi
}

#******************************************************************************#
#       Remove data and config files are used by local nodeos                  #
#******************************************************************************#
RemoveLocalFiles() {
	rm -fr $ConfigDIR
	rm -fr $DataDIR
	rm -f $LogFile
}

#******************************************************************************#
#       Run local instance of keosd and nodeos                                 #
#******************************************************************************#
RunLocal() {

	# Kill already running keosd
	pkill keosd

	# Kill already running nodeos
	pkill nodeos

	# Remove local files before go further
	RemoveLocalFiles

	# Start a new instance of keosd
	keosd --http-server-address=0.0.0.0:5555 &

	# Start a new instance of nodeos
	nodeos -e -p eosio \
	--plugin eosio::producer_plugin \
	--plugin eosio::chain_api_plugin \
	--plugin eosio::http_plugin \
	--plugin eosio::history_plugin \
	--plugin eosio::history_api_plugin \
	--config-dir $ConfigDIR \
	--data-dir $DataDIR \
	--access-control-allow-origin=* \
	--contracts-console \
	--http-validate-host=false \
	--http-server-address=0.0.0.0:7777 \
	--filter-on='*' >> $LogFile 2>&1 &
}

#******************************************************************************#
#       Run docker instance of keosd and nodeos                                #
#******************************************************************************#
RunDocked() {

	# Stop running eosio docker container
	docker stop eosio

	# Remove eosio docker container
	docker rm -f eosio

	# Pull eosio image or a repository from a registry
	docker pull eosio/eos:v1.5.0

	# Run keosd and nodeos inside the docker environment
	docker run --name eosio \
	  --publish 7777:7777 \
	  --volume "${dir}" \
	  --detach \
	  eosio/eos:v1.5.0 \
	  /bin/bash -c \
	  "keosd --http-server-address=0.0.0.0:5555 & exec nodeos -e -p eosio --plugin eosio::producer_plugin --plugin eosio::chain_api_plugin --plugin eosio::history_plugin --plugin eosio::history_api_plugin --plugin eosio::http_plugin -d /mnt/dev/data --config-dir /mnt/dev/config --http-server-address=0.0.0.0:7777 --access-control-allow-origin=* --contracts-console --http-validate-host=false --filter-on='*'"
}

#******************************************************************************#
#       Script main section                                                    #
#******************************************************************************#

# Show program info message
InfoMessage

# Restart keosd and nodeos using local instance or docked instance
case $1 in
	-l) RunLocal ;;
	-d) RunDocked ;;
esac
