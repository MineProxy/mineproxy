const getConfig = require('./getConfig')
const config = getConfig()

const Proxy = require('./lib/Proxy')
new Proxy(config).start()
