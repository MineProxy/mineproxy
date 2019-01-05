const fs = require('fs')

const defaultConfig = {
  host: 'localhost',
  port: '25565',
  online: false,
  server_port: '25566',
  version: '1.12.2',
  plugins: []
}

module.exports = () => ({ ...defaultConfig, ...getConfig() })

function getConfig () {
  let config
  if (fs.existsSync('./config.json')) {
    try {
      config = require('./config.json')
      return { ...defaultConfig, ...config }
    } catch (err) {}
  }
  if (process.argv[2] && process.argv[2].endsWith('.json') && fs.existsSync(process.argv[2])) {
    try {
      config = require(process.argv[2])
      return { ...defaultConfig, ...config }
    } catch (err) {}
  }
  console.log('Configuration file not found!')
  process.exit(1)
}
