var inherits = require('util').inherits
var xtend = require('xtend')
var events = require('events')

var Repo = require('./repo')

module.exports = DPack

/**
 * The DPack object. Manages multiple repositories in
 * a single revelation-flock instance.
 * @param {Object} opts   Default options to use for the dpack.
 */
function DPack (opts) {
  if (!(this instanceof DPack)) return new DPack(opts)
  events.EventEmitter.call(this)
  var self = this
  this.opts = opts || {}
  this.repos = []
}

inherits(DPack, events.EventEmitter)

/**
 * Returns a repo with the given key. Returns undefined
 * if no repository is found with that key.
 * @param  {string} key      The key of the repo.
 * @return {Repo|undefined}  The repo object with the corresponding key.
 */
DPack.prototype.get = function (key) {
  return this.repos.filter(function (repo) {
    return key.toString('hex') === repo.key.toString('hex')
  })[0]
}

/**
 * Adds a new dpack. Emits a 'repo' event when the undelying vault
 * instance is open.
 * @param {string}   key   The key to the dpack.
 * @param {object}   opts  Options to use when building the dpack.
 * @param {Function} cb    The callback with the repo object (optional).
 */
DPack.prototype.add = function (key, opts, cb) {
  var self = this
  if (self.destroyed) throw new Error('client is destroyed')
  if (typeof opts === 'function') return self.add(key, null, opts)
  if (typeof key === 'function') return self.add(null, null, key)
  if (!opts) opts = {}

  var repo = new Repo(key, xtend(this.opts, opts))
  self.repos.push(repo)

  repo.once('ready', onready)
  repo.once('close', onclose)

  function onready () {
    if (self.destroyed) return
    if (typeof cb === 'function') cb(repo)
    self.emit('repo', repo)
  }

  function onclose () {
    repo.removeListener('ready', onready)
    repo.removeListener('close', onclose)
  }
}

/**
 * Closes the dPack, the flock, and all underlying repo instances.
 */
DPack.prototype.destroy =
DPack.prototype.close = function () {
  while (this.repos.length) {
    var repo = this.repos.pop()
    repo.close()
  }
  this.destroyed = true
  this.emit('close')
}
