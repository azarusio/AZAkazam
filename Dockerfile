FROM eosio/eos:v1.5.0


#RUN echo "deb http://ftp.us.debian.org/debian testing main contrib non-free" >> /etc/apt/sources.list.d/testing.list

RUN apt-get update
#RUN apt-get install -yqq -t testing git build-essential curl
RUN apt-get install -yqq git build-essential curl wget

##
##install python
##
WORKDIR /tmp
RUN curl -sL https://deb.nodesource.com/setup_10.x | bash -
RUN apt-get install -yqq nodejs

RUN wget https://github.com/eosio/eosio.cdt/releases/download/v1.3.2/eosio.cdt-1.3.2.x86_64.deb
RUN apt-get install -yqq ./eosio.cdt-1.3.2.x86_64.deb

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

RUN npm install

# Bundle app source
COPY . .

CMD [ "npm", "run", "localtest" ]