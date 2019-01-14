const blessed = require('blessed')

class MainContainer extends blessed.box {
  constructor (logs) {
    super({
      top: 1,
      height: '100%-1',
      border: {
        type: 'line'
      },
      children: [ logs ]
    })
  }

  hideAll () {
    this.children.forEach(child => child.hide())
    return this
  }

  showChild (index) {
    this.children[index].show()
    return this
  }

  addDisplay (display) {
    display.hide()
    this.append(display)
  }
}

module.exports = MainContainer
