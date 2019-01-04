# AZAkazam - A TDD framework for EOS
[![CircleCI](https://circleci.com/gh/azarusio/AZAkazam.svg?style=svg)](https://circleci.com/gh/azarusio/AZAkazam)
-----------------------
AZAkazam is a development, testing and deployment framework for EOS.IO, aiming to make life as an EOS developer easier. With AZAkazam, you get:

* Built-in smart contract compilation, linking, deployment and binary management.
* Automated contract testing with Mocha.
* Configurable build pipeline with support for custom build processes.
* Scriptable deployment & migrations framework.
* Network management for deploying to many public & private networks.
* Instant rebuilding of assets during development.

| ℹ️ **Contributors**: Please see the [Development](#development) section of this README. |
| --- |

-----------------------
## Setup
Start by pulling this repo. You can operate in 2 modes: local or containerized. 
Local is geared towards on-premises development, while dockerized is more aimed at CI.

### Local
If operating locally: 
* You'll need to have the EOSIO.CDT toolkit installed. You can find the setup instructions here: https://developers.eos.io/eosio-home/v1.7.0/docs/installing-the-contract-development-toolkit

* To use the default hello world test template, you'll need a local Nodeos image. 
You can set one up with docker by running it with `./reset_env.sh`

* You'll need node v10 - installation instructions can be found here: https://nodejs.org/en/download/package-manager/
At the root of this repo, run `npm i` to install dependencies

You can then run the tests by calling `npm run test`

### Dockerized
Alternatively, you can compile and run everything out of a docker container:
* Build a new container with your local code by running `docker build -t AZAkazam .`
* Run the tests  with `docker run AZAkazam`

Note that you'll need to rebuild a new container for every code change.

## Configuration
Getting your project up and running is fairly simple - here are the files you'll be interacting with:
*
|-> package.json: you may change the name of the default template there
|-> templates: A directory to save your [deployment templates](#Templates)
|-> src: The directory to save the sources of your smart contracts
|-> tests: The directory to save your Mocha test 

## Templates
The template files are YAML descriptors aimed at managing the deployments of the contracts. The `default.yml` should get your started.
After each run, an updated version of the YAML is saved in the root directory, that way you can restart tests without needing to reset your local nodeos - just run `node deploy.js 15436623.yml` where "15436623" is the latest timestamp.

The file has the following sections:
* header: context about the deployment including the node url
* wallet: all the keys you'll need for the accounts you'll be using. Missing keys are generated automatically and will be appended to the deployment file.
* accounts: all the accounts you'll be using
* contracts: all the contracts you'll be using
* test: the tests to run

## Contracts
Contracts must be located in directory with their names. For instance, EOS.IO hello contract is called `hello` - it's defined as a `class hello : public contract` with files hello.cpp and hello.hpp: you must put everything into "src/hello" and the framework will find it and locate it.

## Tests
Tests come with a handy helper:
`global.EOSContract.getPrivateKey("active@azarusiocorp")` will retrieve the private key for a permission/account
```
 global.EOSContract.sendAction(
      'hello', 
      'hi', 
      {user: "bob"}, 
      "active@azarusiocorp", 
      global.EOSContract.getPrivateKey("active@azarusiocorp")
      )
```
Will Send an action to account "hello", action "hi", with parameters {user: "bob"}, using account "active@azarusiocorp" signed by the key global.EOSContract.getPrivateKey("active@azarusiocorp")


-----------------------
## Development

We welcome pull requests. To get started, just fork this repo, and submit a pull request.


## Contributors
Initially developed by Alex Casassovici <ac@azarus.io> for Azarus https://azarus.io


## License
GPL version 3.0: https://www.gnu.org/licenses/gpl-3.0.en.html
