import defaults from 'lodash/defaults'
import ansi from 'ansi-html-stream'
import { spawn, exec } from 'child-process-promise'
import { defineHiddenProperty } from './utils/props'
import { createWriteStream } from 'fs'

export class ProcessRunner {
  constructor (command, options = {}) {
    const hide = defineHiddenProperty(this)

    hide('command', command)
    hide('options', options)
  }
}

export function runProcess(command, options = {}) {
  const [cmd, ...args] = command.split(' ')

  const stream = ansi({chunked: true})
  const runner = spawn(cmd, args)
  const child = runner.childProcess
  const output = createWriteStream(`${ child.pid }.html`)


  child.stdout.pipe(stream)
  child.stderr.pipe(stream)

  stream.pipe(output, {end: false})
  stream.once('end', () => output.end('</pre>\n'))
  output.write('<pre class="process-runner">\n')

  return runner.then(() => ({
    pid: child.pid,
    output: child.stdout.toString()
  }))
}

export default ProcessRunner
