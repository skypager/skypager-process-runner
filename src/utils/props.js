/**
 * Returns a function that can be used to create hidden property values
 * on the target object.  This is just a convenience wrapper around
 * Object.defineProperty that makes it less verbose to use
*/
export function defineHiddenProperty(instance, configurable = true) {
  return function(property, value, getter = false) {
    let type = getter ? 'get' : 'value'

    value = getter && typeof value !== 'function'
      ? () => value
      : value

    Object.defineProperty(instance, property, {
      configurable,
      enumerable: false,
      [type]: value,
    })
  }
}

export function hideProperties (obj, ...args) {
  let props = args.length === 2 ? {[args[0]]:args[1]} : args[0]

  keys(props).forEach(prop => {
    let value = props[prop]

    defineProperty(obj, prop, {
      enumerable: false,
      get: function() {
        return typeof value === 'function' ? value.call(obj) : value
      },
    })
  })
}
