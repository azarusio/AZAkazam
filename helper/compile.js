const util = require('util');
const exec = util.promisify(require('child_process').exec);

function eosCompile (params) {
  this.compile = async function () {
    for (contract of Object.keys (params.contracts)) {
      var command = `cd ${params.root_path}/src/${contract} && make --quiet`
      console.log ("Executing: "+command)
      var { stdout, stderr } = await exec (command);
      if (stderr)
        throw new Error (stderr)
      console.log (`${stdout}\nCOMPILED: "${contract}" success`)
    }
    return (true)
  }
}

module.exports = eosCompile;
