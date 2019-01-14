const blessed = require('blessed')

class OnlineList extends blessed.box {
  constructor () {
    super({
      left: '75%',
      width: '25%',
      height: '100%',
      border: {
        type: 'line'
      },
      content: 'Online players:\n'
    })
  }
}

module.exports = OnlineList
