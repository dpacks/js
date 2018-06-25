var test = require('tape')
var DPack = require('..')

test('replicate a dPack', function (t) {
  var dpack = new DPack()
  t.equals(dpack.repos.length, 0, 'has zero repos before adding')
  var key = window.location.hash.replace('#', '')
  if (!key.length) key = null

  dpack.add(key, function (repo) {
    var url = window.location.host + '/#' + repo.key.toString('hex')
    document.querySelector('body').innerHTML = `<a href="${url}" target="_blank">${url}</a>`
    var therepo = dpack.get(repo.key)
    t.equals(therepo.key, repo.key, 'get works')
    t.equals(dpack.repos.length, 1, 'fork has one repo after adding')
    if (repo.vault.owner) {
      console.log('writing to dPack')
      var writer = repo.vault.createFileWriteStream('hello.txt')
      writer.write('world')
      writer.end()
      t.end()
    } else {
      console.log('reading from dPack')
      repo.vault.content.get(0, function () {
        // force the updating of content
        t.equals(repo.vault.content.bytes, 5, 'have same size')
        t.end()

      })
    }
  })
})
