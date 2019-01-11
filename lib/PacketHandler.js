const states = require('minecraft-protocol').states

class PacketHandler {
  constructor (proxy, client, server) {
    this.proxy = proxy
    this.client = client
    this.server = server
  }
  handle (data, meta, isIncoming) {
    if (this.server.state !== states.PLAY || meta.state !== states.PLAY) return
    if (isIncoming) {
      for (const handler of this.proxy.handlers.serverPacket) {
        if (!handler(meta, data, this.client, this.server)) return
      }
      if (!this.client.ended) {
        this.client.write(meta.name, data)
        if (meta.name === 'set_compression') this.client.compressionThreshold = data.threshold
      }
    } else {
      for (const handler of this.proxy.handlers.clientPacket) {
        if (!handler(meta, data, this.client, this.server)) return
      }
      if (meta.name === 'chat' && data.message.startsWith('/') && /\/(\w+)(.*)/.test(data.message)) {
        let [, command, args] = Array.from(data.message.match(/\/(\w+)(.*)/))
        args = args.trim()
        for (const handler of this.proxy.handlers.command) {
          if (!handler(command, args, this.client, this.server)) return
        }
      }
      if (!this.server.ended) this.server.write(meta.name, data)
    }
  }
}

module.exports = PacketHandler
