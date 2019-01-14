const blessed = require('blessed')

class ScrollableBox extends blessed.box {
  constructor (options = {}) {
    super({
      ...options,
      content: '',
      scrollable: true,
      alwaysScroll: true,
      keys: true,
      vi: true,
      scrollbar: {
        style: {
          bg: 'yellow'
        }
      }
    })
    this.on('keypress', (ch, key) => {
      switch (key.name) {
        case 'pageup': this.scroll(-this.height); break
        case 'pagedown': this.scroll(this.height); break
        case 'home': this.setScrollPerc(0); break
        case 'end': this.setScrollPerc(100); break
      }
      this.screen.render()
    })
    this.key(['pageup', 'pagedown'], () => {
      this.pushLine(this.height)
      this.screen.render()
    })
    this.on('click', () => this.focus())
  }

  print (message) {
    if (typeof message !== 'string') message = require('util').inspect(message)
    let oldPerc = this.getScrollPerc()
    this.pushLine(message)
    if (oldPerc === 100) this.setScrollPerc(100)
  }
}

module.exports = ScrollableBox
