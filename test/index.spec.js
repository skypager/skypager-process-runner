import Collection from '../src'

describe('Asset Collections', function() {
  it('has a root', function() {
    const collection = Collection.create(process.cwd())
    collection.should.have.property('root').that.equals(process.cwd())
  })

  it('resolves files relative to itself', function(done) {
    const collection = Collection.create(process.cwd())

    collection.resolveAsync('.', './src/index', function(err,result){
      done()
    })
  })
})
