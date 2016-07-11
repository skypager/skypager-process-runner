import ProcessRunner from '../src'
import { readFile, exists } from 'fs'

describe('The Process Runner', function() {
  before(function() {
    this.runner = new ProcessRunner(
      ((uniqueParam) => `touch tmp/${ uniqueParam }.log`),
      { outputFolder: 'tmp' }
    )
  })

  it('Has a function which returns a command', function() {
    this.runner.should.have.property('command').that.is.a('function')
    this.runner.command('whatup-boo').should.contain('whatup-boo')
  })

  it('counts errors', function() {
    this.runner.errorCount.should.equal(0)
  })

  it('tracks process state for long running processes', function(done) {
    const monitor = new ProcessRunner('sleep 4', {
      outputFolder: 'tmp',
      group: 'watcher',
      id: 'shit'
    })

    monitor.runAsync((result, data) => {
      done()
    })
    .then((result) => {
      result.should.have.property('pid').that.is.a('number')
      monitor.running.should.not.be.empty
      setTimeout(() => {
        process.kill(result.pid)
      }, 1000)
    })
    .catch((error) => [console.log('error', error), done('fuck')])
  })

  it('stores the output as html', function(done) {
    this.runner.outputFolder.should.equal('tmp')
    this.runner.run(1)
    .then((result) => {
      readFile(result.outputPath, (err, contents) => {
        should.not.exist(err)
        contents.toString().should.match(/pre/)
        done()
      })
    })
    .catch((e) => done(e))
  })

  it('returns a report about the output', function(done) {
    this.runner.run(1)
    .then((result) => {
      result.should.have.property('pid')
      result.should.have.property('outputPath')
      result.should.have.property('getProcess').that.is.a('function')

      exists(result.outputPath, (result) => result.should.equal(true) && done())
    })
    .catch((e) => done(e))
  })

  it('Returns a unique id on demand', function() {
    const test = Object.keys({
      [this.runner.id]: this.runner.counter += 1,
      [this.runner.id]: this.runner.counter += 1,
      [this.runner.id]: this.runner.counter += 1,
    })

    test.length.should.equal(3)
  })

  it('has an output path', function() {
    this.runner.should.have.property('outputPath').that.match(/\.html$/)
  })
})
