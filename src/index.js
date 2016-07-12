import ansi from 'ansi-html-stream'
import { spawn } from 'child-process-promise'
import { defineHiddenProperty } from './utils/props'
import { createWriteStream } from 'fs'
import { join } from 'path'

export class ProcessRunner {
  /**
   * Create a new ProcessRunner for repeatable commands
   *
   * @param {string} command - the full command with args, similar to nodes exec, or a function which returns one
   *                         the function will be called with arguments passed to the run method
   * @param {object} options - the options hash, passed directly to spawn
   * @param {boolean} options.chunked - the resulting html chunks should be contained in its own closing tag
   * @param {string} options.group - the name of the process group, useful to help group output logs
   * @param {string} options.prefix - the prefix for the id, which is used in the output filename
   * @param {stream} options.outputStream - if you don't want to use a file, pass in your own writeable stream
   */
  constructor (command, options = {}) {
    this.processGroup = options.group || options.processGroup || 'processes'
    this.counter = 0

    const hide = defineHiddenProperty(this)

    this.cwd = options.cwd || process.cwd()

    this.command = typeof command === 'function'
      ? command.bind(this)
      : (() => command)

    hide('prefix', options.prefix || `${this.processGroup}-${Math.floor(Date.now() / 100)}`)
    hide('errors', [])
    hide('outputFolder', options.outputFolder || '.')
    hide('args', [command, options])
    hide('ansi', ansi({chunked: options.chunked !== false && !process.env.DISABLE_ANSI_HTML_CHUNKING}))
    hide('outputStream', (() => options.outputStream || createWriteStream(this.outputPath)), true)
    hide('running', {})
  }

  get outputPath() {
    return join(this.outputFolder, `${this.id}.html`)
  }

  get id() {
    return `${this.prefix}-${this.counter}`
  }

  get errorCount() {
    return this.errors.length
  }

  runAsync(commandArgs, callback) {
    if (typeof commandArgs === 'function' && !callback) {
      callback = commandArgs
      commandArgs = undefined
    }

    const outputPath = this.outputPath
    const cmd = this.command(commandArgs)

    const state = this.running[outputPath] = {
      cmd
    }

    this.counter += 1

    return runProcessAsync(cmd, {
      cwd: this.cwd,
      outputPath,
      outputStream: this.outputStream,
      id: this.id,
      cmd,
      onExit: (code) => {
        state.exitCode = code

        if (code !== 0 || code !== null) {
          this.errors.push({
            message: 'Process exited with non-zero code',
            code,
            cmd,
            outputPath
          })
          callback && callback(code)
        } else {
          state.success = true
          delete state[outputPath]
          callback && callback(code)
        }
      },
      onError: (error) => {
        state.success = false
        state.errorMessage = error && error.message

        this.errors.push({
          message: error && error.message,
          cmd,
          outputPath
        })
      }
    }).then(childProcess => {
      state.pid = childProcess.pid
      return childProcess
    })
  }

  run(commandArgs) {
    const cmd = this.command(commandArgs)
    const outputPath = this.outputPath
    const runner = runProcess(cmd, {
      cwd: this.cwd,
      outputPath,
      outputStream: this.outputStream,
      id: this.id,
    })

    this.counter += 1
    return runner
      .then((results) => {
        this.pid = results.pid
        return results
      })
      .catch(error => {
        this.errors.push(cmd)
        throw(error)
      })
  }
}

export default ProcessRunner

export function runProcessAsync(command, options = {}) {
  const [cmd, ...args] = command.split(' ')

  const spawn = require('child_process').spawn
    , ansi = require('ansi-html-stream')
    , fs = require('fs')

  const child = spawn(cmd, args, {
    cwd: process.cwd(),
    ...options
  })

  const outputPath = options.outputPath || `${ child.pid }.html`

  var stream = ansi({ chunked: options.chunked !== false })
    , file = options.outputStream || fs.createWriteStream(outputPath, 'utf8')

  child.stdout.pipe(stream)
  child.stderr.pipe(stream)

  stream.pipe(file, { end: false })

  stream.once('end', function() {
    file.end('</pre>\n')
  })

  file.write(`<pre class='${cmd}' id='${options.id || outputPath}'>\n`);

  if (options.onExit) { child.once('exit', (code) => options.onExit(code)) }

  return new Promise((resolve,reject) => {
    child.on('error', (error) => {
      options.onError && options.onError(error)
      reject(error)
    })

    resolve(child)
  })
}

/**
 * Spawn a process and stream colorized output to an ansi-html-stream
 *
 * @param {string} command - a string containing the full command with arguments, like normal exec
 * @param {object} options - an object containing standard spawn options
 * @param {path} options.outputPath - override the output path, which by default will be the process.pid
 * @param {function} options.onError - invoke this function when the child process errors
 * @param {function} options.onExit - invoke this function when the child process exits
 */
export function runProcess(command, options = {}) {
  const [cmd, ...args] = command.split(' ')

  const stream = ansi({chunked: true})
  const runner = spawn(cmd, args)
  const child = runner.childProcess
  const outputPath = options.outputPath || `${ child.pid }.html`
  const output = options.outputStream || createWriteStream(outputPath, 'utf8')

  child.stdout.pipe(stream)
  child.stderr.pipe(stream)

  stream.pipe(output, {end: false})
  stream.once('end', () => output.end('</pre>\n'))
  output.write('<pre class="process-runner">\n')

  if (typeof options.onError === 'function') {
    child.once('error', (...args) => options.onError(...args))
  }

  if (typeof options.onExit === 'function') {
    child.once('exit', (...args) => options.onExit(...args))
  }

  return runner.then((result) => ({
    pid: child.pid,
    code: result.code,
    outputPath,
    id: options.id,
    getProcess: (() => child),
    getRunner: (() => runner),
    getOutputStream: (() => output),
  }))
}

export default ProcessRunner
/**
 * @return {[ProcessRunner]}         [creates a new process runner]
 */
export function create(command, options) {
  return new ProcessRunner(command, options)
}
