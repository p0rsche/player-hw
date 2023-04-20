export interface IVideoClient {
  default: boolean
  registeredFileExtensions: string[]
  autoplay: boolean
  init?: (videoNode: HTMLVideoElement, videoSrc: string) => void
  isDefault: () => boolean
  supports: (ext: string) => boolean
  destroy?: () => void
}

export class VideoClient implements IVideoClient {
  registeredFileExtensions:string[] = [];

  autoplay = true

  client: unknown
  videoEl: HTMLVideoElement
  currentUrl: string

  logger

  default = false

  constructor(logger = console){
    this.logger = logger
  }

  play() {
    try {
      const promise = this.videoEl.play();

      if (promise !== undefined) {
        promise.then(() => {
          // Autoplay started!
        }).catch(() => {
          // Autoplay not allowed!
          // Mute video and try to play again
          this.videoEl.muted = true;
          this.videoEl.play();
        });
      }
    } catch (e) {
      this.logger.debug(e)
    }
  }

  isDefault() {
    return this.default
  }

  init(video: HTMLVideoElement, url: string) {
    this.videoEl = video
    this.currentUrl = url
  }

  supports(ext: string) {
    return this.registeredFileExtensions.some(e => e === ext)
  }

  destroy() {
    this.client = null
    this.videoEl = null
    this.currentUrl = null
  }
}
