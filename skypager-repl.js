module.exports = function(repl) {
  repl.context.runner = require('./lib')
}
