const blessed = require('blessed')

class PluginList extends blessed.list {
  constructor (mainTitle, main) {
    super({
      mouse: true,
      keys: true,
      top: 5,
      items: [
        'logs'
      ],
      style: {
        selected: {
          bg: 'green',
          fg: 'black'
        }
      }
    })

    this.on('select', (item, index) => {
      main
        .hideAll()
        .showChild(index)
      mainTitle.setTitle(item.getContent())
      this.screen.render()
    })
  }
}

module.exports = PluginList
