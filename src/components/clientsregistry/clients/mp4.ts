import { VideoClient } from "../videoclient";

class Mp4Client extends VideoClient {
  registeredFileExtensions = ['mp4'];
  
  default = true

  constructor() {
    super()
  }

  init(video: HTMLVideoElement, url: string) {
    super.init(video, url)
    this.videoEl.src = url

    if(this.autoplay) this.play()
  }
}
export default Mp4Client