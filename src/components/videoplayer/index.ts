
import { getFileExtensionFromUrl } from '../../utils/helpers'
import { IClientRegistry } from '../clientsregistry'
import { IVideoClient } from '../clientsregistry/videoclient'
import StateManager from '../statemanager'


export interface IVideoPlayer {
  load(url: string): void
  reportStateChanges: (state: string) => void
  onVideoStateChange: (cb: (state: string) => void) => void
  setVideoClientRegistry: (registry: IClientRegistry) => void
  reportStatus: () => void
}

class VideoPlayer implements IVideoPlayer {

  videoEl: HTMLVideoElement
  stateManager: StateManager
  
  videoStateChangesCbs: Array<(state: string) => void> = []
  
  currentUrl: string
  currentVideoClient: IVideoClient

  constructor(selector: string, private registry: IClientRegistry = window.broit.VideoClientRegistry, private logger = console) {
    this.videoEl = document.querySelector(selector)

    if(this.videoEl?.tagName !== 'VIDEO') {
      this.logger.debug('Wrong video tag')
      return
    }

    this.stateManager = new StateManager(this.videoEl)
    this.attachEventListeners()
    this.applyWorkarounds()
    if(this.videoEl.currentSrc !== '') this.load(this.videoEl.currentSrc)
  }

  applyWorkarounds() {
    //ios workaround for autoplay
    this.videoEl.playsInline = true
  }

  load(url: string) {
    if(!url || this.currentUrl === url) return
    this.currentUrl = url
    const fileExt = getFileExtensionFromUrl(this.currentUrl)
    this.currentVideoClient = this.registry.findClientByExt(fileExt)
    if(!this.currentVideoClient) {
      this.currentVideoClient = this.registry.getDefaultClient()
      if(!this.currentVideoClient) {
        this.logger.debug('No default video client presented')
        return
      }
    }
    this.currentVideoClient.init(this.videoEl, url)
  }

  attachEventListeners() {
    this.stateManager.addEventListener('changestate', (e: CustomEvent) => {
      this.reportStateChanges(e.detail)
    })
  }

  removeEventListeners() {
    this.stateManager.removeEventListeners()
  }

  reportStatus() {
    this.logger.log(this.stateManager.currentState)
  }

  reportStateChanges(state: string) {
    this.videoStateChangesCbs.forEach(cb => cb(state))
  }

  onVideoStateChange(cb: (state: string) => void): void {
    this.videoStateChangesCbs.push(cb)
  }

  setVideoClientRegistry(registry: IClientRegistry) {
    this.registry = registry
  }

  destroy() {
    this.removeEventListeners()
    this.videoStateChangesCbs = []
  }

}

export default VideoPlayer
