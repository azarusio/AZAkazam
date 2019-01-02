const YAML        = require('yaml')
var fs            = require('fs');
var eosMonger     = require('./helper/eosmonger')

var args = process.argv.slice(2)
if(args)
  var params = YAML.parse(fs.readFileSync(args[0], 'utf8'))
else
  var params = YAML.parse(fs.readFileSync("templates/default.yml", 'utf8'))
params.root_path = process.cwd()

monger = new eosMonger(params)
monger.build_deploy_test().then(r=>{
  console.log("SUCCESS")
}).catch(e=>{
  console.log(e)
}).finally(() => {
  filename = params["root_path"]+"/"+Date.now()+".yml"
  fs.writeFileSync(filename, YAML.stringify(params), 'utf8')
  console.log("Updated file saved as "+filename)
})

//TODO save yawn