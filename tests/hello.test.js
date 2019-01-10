describe('Hello contract', function() {
  describe('Say Hi', function() {
    it('Useraccnt@active should be able to say hi to Bob', function(done) {
      global.EOSContract.sendAction(
      'hello', 
      'hi', 
      {user: "bob"}, 
      "useraccnt@active", 
      global.EOSContract.getPrivateKey("useraccnt@active")
      ).then(r => {
        if(r.processed.action_traces[0].console.match("Hello, bob")){
          done()
        }else{
          global.EOSContract.logTX(r)
          throw new Error("Fail")
        }
      }).catch(err => done(err))
    });
    it('oracleaccnt@oracle should be able to say hi to Bob', function(done) {
      global.EOSContract.sendAction(
      'hello', 
      'hi', 
      {user: "bob"}, 
      "oracleaccnt@oracle", 
      global.EOSContract.getPrivateKey("oracleaccnt@oracle")
      ).then(r => {
        if(r.processed.action_traces[0].console.match("Hello, bob")){
          done()
        }else{
          global.EOSContract.logTX(r)
          throw new Error("Fail")
        }
      }).catch(err => done(err))
    });
  });
});
