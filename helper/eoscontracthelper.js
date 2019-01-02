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
    [permission, account] = authorization.split("@")
    if(permission && account){
      var owner_key_name = params.accounts[account].permissions[permission].value
      return params.wallet.keys[owner_key_name].private
    }else{
      throw new Error(`Could not resolve a key for authorizatios "${authorization}"`)
    }
  }
  this.sendAction = async function(contract, action, parameters, authorization, privateKey){
    [permission, account] = authorization.split("@")
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

  this.logTX = function(tx){
    var util = require('util')
    console.log(util.inspect(tx, {showHidden: true, depth: null}))
  }
}
module.exports = eosTest