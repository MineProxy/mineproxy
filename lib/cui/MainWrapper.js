const blessed = require('blessed')

class MainWrapper extends blessed.box {
  constructor (mainTitle, main) {
    super({
      left: '25%',
      width: '50%',
      children: [ mainTitle, main ]
    })
  }
}

module.exports = MainWrapper
