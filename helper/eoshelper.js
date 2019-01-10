
function eosHelper(params){
  const ecc       = require('eosjs-ecc')
  const uuidv4    = require('uuid/v4');
  const request   = require("request");
  const util      = require('util')
  const fs        = require('fs')
  const eosjs     = require('eosjs')
  const fetch     = require('node-fetch')
  const { TextDecoder, TextEncoder } = require('text-encoding')
  const JsSignatureProvider = require('eosjs/dist/eosjs-jssig').default;


  generateKey = function(){
    return new Promise(function(resolve, reject){
      ecc.seedPrivate(uuidv4())
      ecc.randomKey().then(privateKey => {
        //console.log('Private Key:\t', privateKey) // wif
        //console.log('Public Key:\t', ecc.privateToPublic(privateKey)) // EOSkey...
        resolve({public: ecc.privateToPublic(privateKey), private: privateKey})
      }).catch(e=>reject(e))
    })     
  }

  this.processWallet = async function(){
    if(params.wallet.type == "file"){
      for(role of Object.keys(params.wallet.keys)){
        if(params.wallet.keys[role] && params.wallet.keys[role].private)
          params.wallet.keys[role].public = ecc.privateToPublic(params.wallet.keys[role].private)
        else{
          params.wallet.keys[role] = await generateKey()
        }
        console.log(`key role ${role}: ${params.wallet.keys[role].public} / ${params.wallet.keys[role].private}`)
      }
    }
  }

  updateAccounts = async function(account){
    //user Owner auth
    if(params.accounts[account].permissions.owner.type == "key")
      var owner_key_name = params.accounts[account].permissions.owner.value
    console.log("Using key: "+owner_key_name)
    if(params.wallet.keys[owner_key_name] && params.wallet.keys[owner_key_name].private){
      console.log("using key: "+params.wallet.keys[owner_key_name].private)
      var signatureProvider = new JsSignatureProvider([params.wallet.keys[owner_key_name].private])
    }else{
      throw new Error(`Can't update account's permissions for ${account} - missing the owner private key`)
    }
    for(permission of Object.keys(params.accounts[account].permissions).filter(e => e!="owner")){
      if(params.accounts[account].permissions[permission].updated && params.accounts[account].permissions[permission].updated == true){
        console.log(`Permission ${permission} for account ${account} already set, skipping`)
        continue;
      }
      var transaction_data = {
        actions: [{
          account: 'eosio',
          name: 'updateauth',
          authorization: [{
            actor: account,
            permission: 'owner'
          }],
          data: {
            account: account,
            permission: permission,
            parent: params.accounts[account].permissions[permission].parent,
            auth: {
              threshold: 1,
              keys: [],
              accounts: [],
              waits: []
            }
          }
        }]
      }
      if (params.accounts[account].permissions[permission].type == "key"){
        transaction_data.actions[0].data.auth.keys=[{
          key: params.wallet.keys[params.accounts[account].permissions[permission].value].public,
          weight: 1
        }]
      }else if(params.accounts[account].permissions[permission].type == "account"){
        [actor, perm] =  params.accounts[account].permissions[permission].value.split("@")
        transaction_data.actions[0].data.auth.accounts= [
          {permission:{actor: actor,permission: perm}, weight: 1}
        ]
      }
      var rpc = new eosjs.JsonRpc(params.nodeos_endpoint, { 
        fetch 
      });
      var api = new eosjs.Api({ 
        rpc, 
        signatureProvider, 
        textDecoder: new TextDecoder(), 
        textEncoder: new TextEncoder() 
      }); 
      //console.log(util.inspect(transaction_data, {showHidden: true, depth: null}))
  
      tx = await api.transact( 
        transaction_data, {
        blocksBehind: 3,
        expireSeconds: 30,
        broadcast: true
      })
      params.accounts[account].permissions[permission].updated = true
      console.log(`Permission ${permission} for account ${account} set`)
    }
    
    return `Permissions set for account ${account}`
  }

  createAccounts = function(account){
    if(params.wallet.keys.eosio){
      console.log("using key: "+params.wallet.keys.eosio.private)
      var signatureProvider = new JsSignatureProvider([params.wallet.keys.eosio.private])
    }else{
      throw new Error("Can't create a new account - missing the key to eosio account")
    }

    return new Promise(async function(resolve, reject){
      try{
        var transaction_data = {
          actions: [{
            account: 'eosio',
            name: 'newaccount',
            authorization: [{
              actor: "eosio",
              permission: 'owner'
            }],
            data: {
              creator: "eosio",
              name: account,
              owner: {
                threshold: 1,
                keys:[
                  {key: params.wallet.keys[params.accounts[account].permissions["owner"].value].public,
                  weight: 1}
                ],
                accounts: [],
                waits: []
              },
              active: {
                threshold: 1,
                keys:[
                  {key: params.wallet.keys[params.accounts[account].permissions["active"].value].public,
                  weight: 1}
                ],
                accounts: [],
                waits: []
              }
            }
          }]
        }
      
        //console.log(util.inspect(transaction_data, {showHidden: false, depth: null}))
        var rpc = new eosjs.JsonRpc(params.nodeos_endpoint, { 
          fetch 
        });
        var api = new eosjs.Api({ 
          rpc, 
          signatureProvider, 
          textDecoder: new TextDecoder(), 
          textEncoder: new TextEncoder() 
        }); 
        tx = await api.transact( 
          transaction_data, {
          blocksBehind: 3,
          expireSeconds: 30,
          broadcast: true
        })
        console.log(`Account ${account} created`)
        resolve(tx)
      }catch(e){
        reject(e)
      }
    })
  }


  function accountExists(accountName){
    return new Promise((resolve, reject) => { 
      var options = { method: 'POST',
        url: params.nodeos_endpoint+'/v1/chain/get_account',
        body: { account_name: accountName },
        json: true };
      request(options, function (error, response, body) {
        if(error)
          reject(error)
        if(response.body.code == 500) //account does not exist - responds 500
          resolve(false) 
        else
          resolve(true)
      })

    })
  }

  this.processAccounts = async function(){
    for(account of Object.keys(params.accounts)){
      new_account = !await accountExists(account)
      if( new_account)
        res = await createAccounts(account)
      
      res = await updateAccounts(account)
    }
  }

  this.deployContracts = async function(){
    const { Serialize } = require(`eosjs`)
    const buffer = new Serialize.SerialBuffer({
        textEncoder: new TextEncoder() ,
        textDecoder: new TextDecoder(),
    })
    for(contract of Object.keys(params.contracts)){

      var contract_info = params.contracts[contract]

      //
      //setup keys
      //
      var role = params.accounts[contract_info.account].permissions[contract_info.permission].value
      console.log(`using role ${role} and key ${params.wallet.keys[role].private}`)
      var signatureProvider = new JsSignatureProvider([params.wallet.keys[role].private])

      var rpc = new eosjs.JsonRpc(params.nodeos_endpoint, { 
        fetch 
      });
      var api = new eosjs.Api({ 
        rpc, 
        signatureProvider, 
        textDecoder: new TextDecoder(), 
        textEncoder: new TextEncoder() 
      }); 
      
      //
      //create transacction
      //
      var Wasm;
      var Abi;

      //get abi hex
      const buffer = new eosjs.Serialize.SerialBuffer({
        textEncoder: api.textEncoder,
        textDecoder: api.textDecoder,
      });

      //get wasm
      Wasm = fs.
        readFileSync(`${params.root_path}/src/${contract}/${contract}.wasm`).
        toString("hex");

      var  abi = fs.readFileSync(`${params.root_path}/src/${contract}/${contract}.abi`, "utf-8");
      abi = JSON.parse(abi);
      var  abiDefinition = api.abiTypes.get('abi_def');
      abi = abiDefinition.fields.reduce(
          (acc, {name: fieldName}) => Object.assign(acc, {[fieldName]: acc[fieldName] || []}),
          abi,
      );
      abiDefinition.serialize(buffer, abi);
      Abi = Buffer.from(buffer.asUint8Array()).toString(`hex`);

      var transaction_data = {
        actions: [{
            account: 'eosio',
            name: 'setcode',
            authorization: [{
                actor: contract_info.account,
                permission: contract_info.permission,
            }],
            data: {
                account: contract_info.account,
                vmtype: 0,
                vmversion: 0,
                code: Wasm
            },
        },
            {
                account: 'eosio',
                name: 'setabi',
                authorization: [{
                    actor: contract_info.account,
                    permission: contract_info.permission,
                }],
                data: {
                    account: contract_info.account,
                    abi: Abi
                },
            }

        ]
      }
      //console.log(util.inspect(transaction_data, {showHidden: false, depth: null}))

      try{
        var tx = await api.transact(transaction_data, {
            blocksBehind: 3,
            expireSeconds: 30,
            broadcast: true
        });
        console.log(`contract ${contract} deployed to account ${contract_info.account} using permission ${contract_info.permission}`)
      }catch(e){
        if(e.json.error.name == "set_exact_code")
          console.log(`contract ${contract} wasm hasn't changed - no update`)
        else
          throw new Error(e)
      }
    }
  }

  this.linkAuths = async function(){
    for(account of Object.keys(params.accounts)){
      for(permission of Object.keys(params.accounts[account].permissions)){
        if(params.accounts[account].permissions[permission].authorize){

          var role = params.accounts[account].permissions.owner.value
          console.log(`using role ${role} and key ${params.wallet.keys[role].private}`)
          var signatureProvider = new JsSignatureProvider([params.wallet.keys[role].private])        
          var rpc = new eosjs.JsonRpc(params.nodeos_endpoint, { 
            fetch 
          });
          var api = new eosjs.Api({ 
            rpc, 
            signatureProvider, 
            textDecoder: new TextDecoder(), 
            textEncoder: new TextEncoder() 
          }); 

          for(functions of params.accounts[account].permissions[permission].authorize){
            [code, type] =  functions.split("::")

            var transaction_data = {
              actions: [{
                  account: 'eosio',
                  name: 'linkauth',
                  authorization: [{
                      actor: account,
                      permission: "owner",
                  }],
                  data: {
                      account: account,
                      code: params.contracts[code].account,
                      type: type,
                      requirement: permission
                  },
              }]
            }
  
            //console.log(util.inspect(transaction_data, {showHidden: false, depth: null}))
            try{
              var tx = await api.transact(transaction_data, {
                  blocksBehind: 3,
                  expireSeconds: 30,
                  broadcast: true
              });
              //console.log(util.inspect(tx, {showHidden: false, depth: null}))
              console.log(`linked permission ${permission} from account ${account} to function ${type} contract ${code}`)
            }catch(e){
              if(e.json.error.name == "action_validate_exception")
                console.log(`link for   permission ${permission} from account ${account} to function ${type} contract ${code} hasn't changed - no update`)
              else{
                console.log(util.inspect(transaction_data, {showHidden: false, depth: null}))
                console.log(util.inspect(e, {showHidden: false, depth: null}))
                throw new Error(e)
              }
            }
          }
        }
      }
    }
  }



  this.runTests = function(){
    var Mocha = require('mocha'),
    fs = require('fs'),
    path = require('path');
    global.eosparams = params // maxing params global
    // Instantiate a Mocha instance.
    var mocha = new Mocha();

    var testDir = `${params.root_path}/tests`
    filename = `${params.root_path}/tests/param.js`
    fs.writeFileSync(filename, `
    beforeEach(function() {
      global.params = JSON.parse('${JSON.stringify(params)}');
      global.EOSContractHelper = require("../helper/eoscontracthelper")
      global.EOSContract = new EOSContractHelper(global.params)
    });
    `, 'utf8')

    // Add each .js file to the mocha instance
    fs.readdirSync(testDir).filter(function(file) {
        // Only keep the .js files
        return file.substr(-3) === '.js';

    }).forEach(function(file) {
        mocha.addFile(
            path.join(testDir, file)
        );
    });
    // Run the tests.
    mocha.run(function(failures) {
      process.exitCode = failures ? 1 : 0;  // exit with non-zero status if there were failures
    });
  }
}

module.exports = eosHelper;