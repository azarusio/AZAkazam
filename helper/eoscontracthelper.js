function eosTest(params){
  const ecc       = require('eosjs-ecc')
  const uuidv4    = require('uuid/v4');
  const request   = require("request");
  const util      = require('util')
  const fs        = require('fs')
  const eosjs     = require('eosjs')
  const fetch     = require('node-fetch')
  const { TextDecoder, TextEncoder } = require('text-encoding')
  const JsSignatureProvider = require('eosjs/dist/eosjs-jssig').default;


  this.getPrivateKey = function(authorization){
    [account, permission] = authorization.split("@")
    if(permission && account){
      var owner_key_name = params.accounts[account].permissions[permission].value
      return params.wallet.keys[owner_key_name].private
    }else{
      throw new Error(`Could not resolve a key for authorizatios "${authorization}"`)
    }
  }
  this.sendAction = async function(contract, action, parameters, authorization, privateKey){
    [account, permission] = authorization.split("@")
    var signatureProvider = new JsSignatureProvider([privateKey])
    var rpc = new eosjs.JsonRpc(params.nodeos_endpoint, { 
      fetch 
    });
    var api = new eosjs.Api({ 
      rpc, 
      signatureProvider, 
      textDecoder: new TextDecoder(), 
      textEncoder: new TextEncoder() 
    }); 

    var transaction_data = {
      actions: [{
        account: params.contracts[contract].account,
        name: action,
        authorization: [{
          actor: account,
          permission: permission
        }],
        data: parameters
      }]
    }

    tx = await api.transact( 
      transaction_data, {
      blocksBehind: 3,
      expireSeconds: 30,
      broadcast: true
    })
    return tx
  }

  this.getTable =  async function(contract, table ){
    var options = { 
      method: 'POST',
      url: params.nodeos_endpoint+'/v1/chain/get_table_by_scope',
      body: { code: params.contracts[contract].account, table: table },
      json: true
    };

    var table_info = await new Promise((resolve, reject) =>{
      //console.log("requesting: "+ JSON.stringify(options))
      request(options, function (error, response, body) {
      if(error){
        console.log(util.inspect(error, {showHidden: true, depth: null}))
        reject(error)
      }
      else
        if(body && body.rows && body.rows.length == 1)
          resolve(body.rows[0])
        else
          reject(`Could not find table ${table} on account ${params.contracts[contract].account} for contract ${contract}`)
      })
    })


    var options = { method: 'POST',
      url: params.nodeos_endpoint+'/v1/chain/get_table_rows',
      body: { json: true, scope: table_info.scope ,  code: params.contracts[contract].account, table: table },
      json: true
    };
    //console.log("requesting: "+ JSON.stringify(options))
    var table_data = await new Promise((resolve, reject) =>{
      request(options, function (error, response, body) {
        if(error){
          console.log(util.inspect(error, {showHidden: true, depth: null}))
          reject(error)
        }
        else
          resolve(body)
      })
    })
    return table_data
  }
  
  this.logTX = function(tx){
    var util = require('util')
    console.log(util.inspect(tx, {showHidden: true, depth: null}))
  }
}
module.exports = eosTest