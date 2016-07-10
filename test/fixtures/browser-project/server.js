#!/usr/bin/env node

require('../../../node_modules/babel-register')({
  presets:[
    require.resolve('../../../node_modules/babel-preset-skypager'),
  ],
})

const feathers = require('feathers');
const hooks = require('feathers-hooks')
const bodyParser = require('body-parser')
const socketio = require('feathers-socketio')
const rest = require('feathers-rest')
const authentication = require('feathers-authentication')
const join = require('path').resolve
const lodash = require('lodash')

function createApp (options) {
  options = options || {}

  const app = feathers()
  app.bundle = bundle
  options.projects = options.projects || {
    'test-project': {
      id: 'test-project',
      name: 'Test Project',
    },
  }

  app
    .use(bodyParser.urlencoded({extended: true}))
    .use(bodyParser.json())
    .configure(rest())
    .configure(socketio())
    .configure(hooks())

  app.service('/api/projects', {
    find() {
      return Promise.resolve(lodash.values(options.projects))
    },
    get (id) {
      return Promise.resolve(lodash.get(options.projects, id,   {}))
    },
  })

  return app
}

module.exports = createApp

if (process.env.START_SERVER) {
  (() => {
    const app = createApp()
    app.listen(process.env.PORT || 9002, (err) => {
      if (err) {
        throw(err)
      }

      console.log('Started server on port ', process.env.PORT || 9002)
    })
  })()
}
