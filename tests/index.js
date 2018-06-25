var Repo = require('../repo')
var DPack = require('..')
var test = require('tape')

test('create a dPack in memory', function (t) {
  t.plan(7)
  var dpack = new DPack()
  t.equals(dpack.repos.length, 0, 'has zero repos before adding')
  dpack.add(function (repo) {
    t.equals(dpack.repos.length, 1, 'has one repo after adding')
    t.ok(repo.key, 'repo ready and has a key')
    t.equals(repo.key.length, 32, 'has key with proper length')
    t.equals(repo.vault.key, repo.key, 'key is the vault key')
    repo.on('close', function () {
    })
  })
  dpack.on('repo', function (repo) {
    t.ok(repo, 'emits the repo event')
    t.equals(repo.key.length, 32, 'repo key is there')
    dpack.close()
  })
  dpack.on('close', function () {
    t.end()
  })
})
