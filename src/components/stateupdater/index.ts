// helper class for showing state updates in browser
type StateUpdaterOptions = {
  maxEntries?: number
}

export default class StateUpdater {
  el: HTMLElement

  private maxEntries

  private stack: string[] = []

  constructor(selector: string, options: StateUpdaterOptions = {}) {
    this.el = document.querySelector(selector)

    const {
      maxEntries = 5,
    } = options
    this.maxEntries = maxEntries
    this.stack.length = maxEntries
  }

  render(status: string) {
    this.updateStatus(status)
    this.renderStatuses()
  }

  updateStatus(status: string) {
    this.stack.unshift(status)
    this.stack.length = this.maxEntries
  }

  renderStatuses() {
    const list = document.createElement('ul')
    for(let i = 0, len = this.stack.length; i < len; i++) {
      if(!this.stack[i]) continue
      const li = document.createElement('li')
      li.textContent = this.stack[i]
      list.prepend(li)
    }
    this.el.replaceChildren(list)
  }
}