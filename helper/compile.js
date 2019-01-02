const util = require('util');
const exec = util.promisify(require('child_process').exec);

const { hashElement } = require('folder-hash');
 
const options = {
    folders: { exclude: ['.*', 'node_modules', 'test_coverage'] },
    files: { include: ['*.cpp', '*.hpp'] }
};

function eosCompile(params){
  this.compile = async function(){
    for(contract of Object.keys(params.contracts)){
      var folder_hash = (await hashElement(`${params.root_path}/src/${contract}`, options)).hash
      if(params.contracts[contract].compiled_hash && params.contracts[contract].compiled_hash == folder_hash){
        console.log(`${stdout}\nCOMPILED: "${contract}" - already compiled, skipping`)
      }else{
        var command = `cd ${params.root_path}/src/${contract} && eosio-cpp -o ${contract}.wasm ${contract}.cpp --abigen`
        console.log("Executing: "+command)
        var { stdout, stderr } = await exec(command);
        if(stderr)
          throw new Error(stderr)
        console.log(`${stdout}\nCOMPILED: "${contract}" success`)
        params.contracts[contract].compiled_hash = (await hashElement(`${params.root_path}/src/${contract}`, options)).hash
      }
    }
    return(true)
  }
}

module.exports = eosCompile;