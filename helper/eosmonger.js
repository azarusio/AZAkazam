function eosMonger(p){
  const util = require('util')
  this.params = p

  var eosCompile = require('./compile.js')
  compiler = new eosCompile(this.params)

  
  var eosHelper = require('./eoshelper.js')
  eoshelper = new eosHelper(this.params)


  this.build_deploy_test = async function(){
    try{
    
      console.log("\n\x1b[4m%s\x1b[0m", "STEP1: generating keys")
      await eoshelper.processWallet()

      //console.log(util.inspect(this.params.wallet, {showHidden: false, depth: null}))
      console.log("\n\x1b[4m%s\x1b[0m", "STEP2: create users")
      await eoshelper.processAccounts()

      console.log("\n\x1b[4m%s\x1b[0m", "STEP3: compile contracts")
      await compiler.compile();

      console.log("\n\x1b[4m%s\x1b[0m", "STEP4: deploy contracts")
      await eoshelper.deployContracts()
      //TODO post deployment scripts

      console.log("\n\x1b[4m%s\x1b[0m", "STEP5: Link authorizations")
      await eoshelper.linkAuths()

      console.log("\n\x1b[4m%s\x1b[0m", "STEP6: test contracts")
      eoshelper.runTests()
    }catch(e){
      console.log("Test failed with exception:")
      console.dir(e)
      throw new Error(e)
    }
  }
}

module.exports = eosMonger;