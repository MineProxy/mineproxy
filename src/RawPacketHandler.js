const states = require('minecraft-protocol').states
const bufferEqual = require('buffer-equal')

class RawPacketHandler {
  constructor (client, targetClient) {
    this.client = client
    this.targetClient = targetClient
  }

  error (meta, buffer, packetBuff, isIncoming) {
    console.log(`client${isIncoming ? '<-' : '->'}server: Error in packet ${meta.state}.${meta.name}
    ${buffer.toString('hex')}
    ${packetBuff.toString('hex')}
    ${buffer.length}
    ${packetBuff.length}`)
  }

  handle (buffer, meta, isIncoming) {
    console.dir(meta, { colors: true })
    const source = isIncoming ? this.client : this.targetClient
    const destination = isIncoming ? this.targetClient : this.client

    if (source.state !== states.PLAY || meta.state !== states.PLAY) return
    var packetData = destination.deserializer.parsePacketBuffer(buffer).data.params
    var packetBuff = source.serializer.createPacketBuffer({name: meta.name, params: packetData})
    if (!bufferEqual(buffer, packetBuff)) this.error(meta, buffer, packetBuff, isIncoming)
  }
}

module.exports = RawPacketHandler
