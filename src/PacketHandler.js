const states = require('minecraft-protocol').states
let config

class PacketHandler {
  constructor (client, targetClient, _config) {
    this.client = client
    this.targetClient = targetClient
    config = _config
  }
  handle (data, meta, isIncoming) {
    if (this.targetClient.state !== states.PLAY || meta.state !== states.PLAY) return
    // if should dump, dump
    if (shouldDump(meta.name)) {
      console.log(`client${isIncoming ? '<-' : '->'}server: ${meta.name}: ${JSON.stringify(data)}`)
    }
    if (isIncoming) {
      if (!this.client.ended) {
        this.client.write(meta.name, data)
        if (meta.name === 'set_compression') this.client.compressionThreshold = data.threshold
      }
    } else {
      if (!this.targetClient.ended) this.targetClient.write(meta.name, data)
    }
  }
}

module.exports = PacketHandler

function shouldDump (name) {
  if (config.dump_all && (!Array.isArray(config.dump_blacklist) || !config.dump_blacklist.includes(name))) return true
  if (Array.isArray(config.dump) && config.dump.includes(name)) return true
  return false
}
