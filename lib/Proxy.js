const mc = require('minecraft-protocol')
const blessed = require('blessed')

const {
  ScrollableBox,
  InfoBox,
  PluginList,
  Navbar,
  MainTitle,
  MainContainer,
  MainWrapper,
  OnlineList
} = require('./cui')
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

  setupScreen () {
    this.screen = blessed.screen({ smartCSR: true })
    this.screen.title = 'MineProxy v' + require('../package.json').version
    const info = new InfoBox(this.config)
    const mainTitle = new MainTitle()
    const logs = new ScrollableBox()
    const main = new MainContainer(logs)
    const plugins = new PluginList(mainTitle, main)
    const navbar = new Navbar(info, plugins)
    this.log = message => {
      logs.print(message)
      this.screen.render()
    }
    const online = new OnlineList()
    this.screen.append(navbar)
    this.screen.append(new MainWrapper(mainTitle, main))
    this.screen.append(online)
    this.screen.key(['q', 'C-c'], () => {
      process.exit(0)
    })
    plugins.focus()
    this.screen.render()

    return { plugins, main, online }
  }

  start () {
    const { plugins, main, online } = this.setupScreen()
    this.plugins = this.config.plugins
      .map(plugin => require(plugin))
      .map(plugin => {
        this.config[plugin.name] = { ...plugin.defaultConfig, ...(this.config[plugin.name] || {}) }
        plugins.addItem(plugin.name)
        const display = new ScrollableBox()
        main.addDisplay(display)
        plugin.display = display
        return plugin
      })
    this.plugins.forEach(plugin => plugin.init({
      config: JSON.parse(JSON.stringify(this.config)),
      display: plugin.display,
      log: message => {
        let oldPerc = plugin.display.getScrollPerc()
        plugin.display.pushLine(message)
        if (oldPerc === 100) plugin.display.setScrollPerc(100)
        this.screen.render()
      },
      register: (type, handler) => {
        if (!this.handlers[type]) return this.log('Wrong packet type: ' + type)
        this.handlers[type].push(handler)
      },
      unregister: (type, handler) => {
        if (!this.handlers[type]) return this.log('Wrong packet type: ' + type)
        const handlers = this.handlers[type]
        const index = handlers.indexOf(handler)
        if (index === -1) throw new Error(`Plugin ${plugin.name} tried to unregister unknown ${type} handler!`)
        handlers.splice(index, 1)
      }
    }))
    main.children[0].show()
    this.screen.render()

    const proxy = mc.createServer({
      'online-mode': this.config.online,
      port: this.config.server_port,
      keepAlive: false,
      version: this.config.version
    })

    proxy.on('login', client => {
      client.ended = false

      online.insertBottom(client.username)
      this.log(`Incoming connection from ${client.username} (${client.socket.remoteAddress})`)

      const server = mc.createClient({
        host: this.config.host,
        port: this.config.port,
        version: this.config.version,
        username: client.username,
        keepAlive: false
      })
      server.ended = false

      const removeFromOnlineList = () => {
        const idx = online.getLines().findIndex(line => line === client.username)
        online.deleteLine(idx)
        this.screen.render()
      }

      const handleClientDisconnect = cause => {
        client.ended = true
        if (!server.ended) {
          for (const handler of this.handlers.clientDisconnect) handler(cause, client, server)
          removeFromOnlineList()
          server.end(cause || 'Disconnected')
        }
      }
      const handleServerDisconnect = cause => {
        server.ended = true
        if (!client.ended) {
          for (const handler of this.handlers.serverDisconnect) handler(cause, client, server)
          removeFromOnlineList()
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
