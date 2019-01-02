describe('Hello contract', function() {
  describe('Say Hi', function() {
    it('Azarusiocorp should be able to say hi to Bob', function(done) {
      global.EOSContract.sendAction(
      'hello', 
      'hi', 
      {user: "bob"}, 
      "active@azarusiocorp", 
      global.EOSContract.getPrivateKey("active@azarusiocorp")
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
