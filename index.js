const mc = require('minecraft-protocol')
const jsonConfig = require('./config.json')
const defaultConfig = {
  host: 'localhost',
  port: '25565',
  online: false,
  server_port: '25566',
  version: '1.12.2',
  dump: [],
  dump_all: false,
  dump_blacklist: []
}
const config = Object.assign(defaultConfig, jsonConfig)

const printAndExit = m => process.exit(console.log(m) || 1)
const DCHandler = require('./src/DCHandler')
const PacketHandler = require('./src/PacketHandler')
const RawPacketHandler = require('./src/RawPacketHandler')

if (!config.host) printAndExit('Host missing!')
if (!config.server_port) printAndExit('Server port missing!')

console.log(`Server running on port ${config.server_port}!
Host: ${config.host}
Port: ${config.port}
Dump: ${config.dump_all ? `all except ${config.dump_blacklist.join(', ')}` : config.dump.join(', ')}
Version: ${config.version}`)

const srv = mc.createServer({
  'online-mode': config.online,
  port: config.server_port,
  keepAlive: false,
  version: config.version
})

srv.on('login', client => {
  client.print = function (message) { console.log(message, '(' + this.socket.remoteAddress + ')') }
  client.ended = false

  client.print('Incoming connection from ' + client.username, client.addr)

  const targetClient = mc.createClient({
    host: config.host,
    port: config.port,
    version: config.version,
    username: client.username,
    keepAlive: false
  })
  targetClient.ended = false

  const dcHandler = new DCHandler(client, targetClient)
  client.on('end', () => dcHandler.handle('client', 'closed'))
  client.on('error', err => dcHandler.handle('client', 'error', err))
  targetClient.on('end', () => dcHandler.handle('server', 'closed'))
  targetClient.on('error', err => dcHandler.handle('server', 'error', err))

  const packetHandler = new PacketHandler(client, targetClient, config)
  targetClient.on('packet', (packet, meta) => packetHandler.handle(packet, meta, true))
  client.on('packet', (packet, meta) => packetHandler.handle(packet, meta, false))

  const rawPacketHandler = new RawPacketHandler(client, targetClient)
  targetClient.on('raw', (buffer, meta) => rawPacketHandler.handle(buffer, meta, true))
  client.on('raw', (buffer, meta) => rawPacketHandler.handle(buffer, meta, false))
})
