const mc = require('minecraft-protocol')

const PacketHandler = require('./PacketHandler')

class Proxy {
  constructor (config) {
    this.config = config
    this.handlers = {
      clientPacket: [],
      serverPacket: [],
      clientDisconnect: [],
      serverDisconnect: [],
      login: [],
      command: []
    }
  }

  start () {
    console.log(`Server running on port ${this.config.server_port}!
Host: ${this.config.host}
Port: ${this.config.port}
Version: ${this.config.version}`)
    this.config.plugins
      .map(plugin => require(plugin))
      .map(plugin => {
        this.config[plugin.name] = { ...plugin.defaultConfig, ...(this.config[plugin.name] || {}) }
        return plugin
      })
      .forEach(plugin => plugin.init({
        config: JSON.parse(JSON.stringify(this.config)),
        register: (type, handler) => {
          if (!this.handlers[type]) return console.warn('Wrong packet type: ' + type)
          this.handlers[type].push(handler)
        },
        unregister: (type, handler) => {
          if (!this.handlers[type]) return console.warn('Wrong packet type: ' + type)
          const handlers = this.handlers[type]
          const index = handlers.indexOf(handler)
          if (index === -1) throw new Error(`Plugin ${plugin.name} tried to unregister unknown ${type} handler!`)
          handlers.splice(index, 1)
        }
      }))

    const proxy = mc.createServer({
      'online-mode': this.config.online,
      port: this.config.server_port,
      keepAlive: false,
      version: this.config.version
    })

    proxy.on('login', client => {
      client.print = message => console.log(message, '(' + client.socket.remoteAddress + ')')
      client.ended = false

      client.print('Incoming connection from ' + client.username, client.addr)

      const server = mc.createClient({
        host: this.config.host,
        port: this.config.port,
        version: this.config.version,
        username: client.username,
        keepAlive: false
      })
      server.ended = false

      const handleClientDisconnect = cause => {
        client.ended = true
        if (!server.ended) {
          for (const handler of this.handlers.clientDisconnect) handler(cause, client, server)
          server.end(cause || 'Disconnected')
        }
      }
      const handleServerDisconnect = cause => {
        server.ended = true
        if (!client.ended) {
          for (const handler of this.handlers.serverDisconnect) handler(cause, client, server)
          client.end(cause || 'Disconnected')
        }
      }

      client.on('end', handleClientDisconnect)
      client.on('error', handleClientDisconnect)
      server.on('end', handleServerDisconnect)
      server.on('disconnect', data => handleServerDisconnect(JSON.parse(data.reason).text))
      server.on('error', handleServerDisconnect)

      const packetHandler = new PacketHandler(this, client, server)
      server.once('packet', () => {
        for (const handler of this.handlers.login) handler(client, server)
      })
      server.on('packet', (data, meta) => packetHandler.handle(data, meta, true))
      client.on('packet', (data, meta) => packetHandler.handle(data, meta, false))
    })
  }
}

module.exports = Proxy
