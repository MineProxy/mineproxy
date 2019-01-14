const blessed = require('blessed')

class MainTitle extends blessed.box {
  constructor () {
    super({
      height: 1,
      width: 4,
      left: 'center',
      content: 'logs'
    })
  }

  setTitle (title) {
    this.setContent(title)
    this.width = title.length
  }
}

module.exports = MainTitle
