# Skypager Process Runner

This project lets you run commands in an asynchronous way while streaming the output of these commands as HTML which 
displays colorized terminal output.  It is used internally skypager to capture the result of build processes and other such things

## Installation

```
npm install skypager-process-runner
```

## Usage

```
import ProcessRunner from 'skypager-process-runner'

const commandGenerator = (packageName) => `npm install ${packageName} --save --color always`

// this will control the name of the html file, and where the file is stored
const options = { group: 'package-installer', outputFolder: './logs/commands' }

// the runner lets you run the command repeatedly, storing the results of each run
// in its own file
const runner = new ProcessRunner(commandGenerator, options)

// npm install skypager-project --save --color always
runner.run('skypager-project').then(report => report)
```

The resulting report of each command run contains metadata that can be used for whatever purposes.
