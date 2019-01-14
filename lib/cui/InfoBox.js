const blessed = require('blessed')

class InfoBox extends blessed.list {
  constructor (config) {
    super({
      interactive: false,
      height: 4,
      items: [
        'Server running on port ' + config.server_port,
        `Host: ${config.host}`,
        `Port: ${config.port}`,
        `Version: ${config.version}`
      ]
    })
  }
}

module.exports = InfoBox
