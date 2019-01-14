const blessed = require('blessed')

class Navbar extends blessed.box {
  constructor (info, plugins) {
    super({
      left: '0',
      width: '25%',
      height: '100%',
      border: {
        type: 'line'
      },
      children: [ info, plugins ]
    })
  }
}

module.exports = Navbar
