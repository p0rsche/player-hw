// in real-world, should be fetched remotely and injected in Playlist object

type PlaylistOption = {title: string, url: string}
type JsonPlaylist = PlaylistOption[]
// helper class to build playlist from JSON-schema
class Playlist {
  container: HTMLElement
  selectEl: HTMLSelectElement

  videoChangeCbs:Array<((title: string, url: string) => void)> = []

  elemId: 'homework-playlist'

  constructor(private playlist: JsonPlaylist = [], private logger = console) {
    this.callListeners = this.callListeners.bind(this)
  }

  loadPlaylist(playlist: JsonPlaylist = []) {
    this.playlist = playlist
  }

  render(selector: string) {
    try {
      const el = document.querySelector(selector) as HTMLElement
      if(!el) throw new DOMException('Element not found')

      this.container = el

      this.createDropdown()
      this.attach()
      this.attachEventListeners()
    } catch (e) {
      this.logger.debug(e.message)
    }
    return this
  }

  addPlaylistOption(option: PlaylistOption) {
    const { title, url } = option

    this.selectEl.appendChild(this.createDropdownOption(title, url))
  }

  onVideoChange(cb: (title: string, url: string) => void): void {
    this.videoChangeCbs.push(cb)
  }

  private createDropdown(): void {
    this.selectEl = document.createElement('select')
    this.selectEl.id = this.elemId

    const emptyOption = this.createDropdownOption('Please select video', '')
    this.selectEl.appendChild(emptyOption)

    this.playlist.forEach(el => this.selectEl.appendChild(this.createDropdownOption(el.title, el.url)))
  }

  private createDropdownOption(text: string, value: string): HTMLOptionElement {
    const option = document.createElement('option')
    option.value = value
    option.text = text

    return option
  }

  private attach() {
    this.container.appendChild(this.selectEl)
  }

  private attachEventListeners() {
    this.selectEl.addEventListener('change', this.callListeners)
  }

  private callListeners(e: Event) {
    const {text, value} = e.target as HTMLOptionElement

    this.videoChangeCbs.forEach(cb => cb(text, value))
  }

  removeEventListeners() {
    this.selectEl.removeEventListener('change', this.callListeners)
  }

  destroy() {
    this.removeEventListeners()
    this.selectEl.remove()
    this.selectEl = null
    this.container = null
    this.videoChangeCbs = []
  }
}

export default Playlist