module.exports = {
  get components() {
    return require.context('./src/components', true, /\w+\/index.js$/)
  },
  get containers() {
    return require.context('./src/containers', true, /\w+\/index.js$/)
  },
  get actions() {
    return require.context('./src/helpers/actions', false, /.js$/)
  },
}
