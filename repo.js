var inherits = require('util').inherits
var dWebChannel = require('@dwcore/channel')
var events = require('events')
var flock = require('@flockcore/wrtc')
var dWebTower = require('@dwebs/tower')
var ddrive = require('@ddrive/core')
var memdb = require('memdb')

module.exports = Repo

/**
 * A dPack repository is a dDrive with some default settings.
 * @param {string} key    The key
 * @param {Object} opts   Options to use in the vault instance
 */
function Repo (key, opts) {
  if (!(this instanceof Repo)) return new Repo(key, opts)
  var self = this
  events.EventEmitter.call(this)
  this.opts = opts || {}
  this.db = this.opts.db || memdb()
  this.drive = ddrive(this.db)
  this.vault = this.drive.createVault(key, this.opts)
  this.key = this.vault.key.toString('hex')
  this.privateKey = this.vault.privateKey
  var dwtower = dWebTower('dpack-' + this.vault.key.toString('hex'), opts.dwtower || 'https://tower.dwebs.io')
  this.flock = this.flock || flock(dwtower)
  self.join()
  this._open(key)
}

inherits(Repo, events.EventEmitter)

Repo.prototype._open = function () {
  var self = this
  this.vault.open(function () {
    self.emit('ready')
  })
}

/**
 * Joins the flock for the given repo.
 * @param  {Repo}   repo
 */
Repo.prototype.join =
Repo.prototype.resume = function () {
  this.flock.on('peer', this._replicate.bind(this))
}

/**
 * Internal function for replicating the vault to the flock
 * @param  {[type]} peer A webrtc-flock peer
 */
Repo.prototype._replicate = function (conn) {
  var peer = this.vault.replicate({
    upload: true,
    download: true
  })
  dWebChannel(conn, peer, conn)
}

/**
 * Leaves the flock for the given repo.
 * @param  {Repo}   repo
 */
Repo.prototype.leave =
Repo.prototype.pause = function () {
  this.flock.removeListener('peer', this._replicate)
}

Repo.prototype.destroy =
Repo.prototype.close = function () {
  var self = this
  self.flock.close(function () {
    self.vault.close(function () {
      self.db.close(function () {
        self.emit('close')
      })
    })
  })
}
