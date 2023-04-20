
const Hls = window.Hls

import { VideoClient } from "../videoclient";

class HlsClient extends VideoClient {
  registeredFileExtensions = ['m3u8'];
  
  client: typeof Hls

  constructor() {
    super()
  }

  init(video: HTMLVideoElement, url: string) {
    super.init(video, url)

    if (this.videoEl.canPlayType('application/vnd.apple.mpegurl')) {
      this.videoEl.src = this.currentUrl;

      this.autoplay === true && this.videoEl.addEventListener('loadedmetadata', () => {
        this.play()
      }, { once: true })
      //
      // If no native HLS support, check if HLS.js is supported
      //
    } else if (Hls.isSupported()) {
      if(this.client) this.destroy()
      this.client = new Hls();
      this.client.loadSource(this.currentUrl);
      this.client.attachMedia(this.videoEl);

      this.autoplay === true && this.client.once(Hls.Events.MANIFEST_PARSED, () => {
        this.play()
      });
  
      if(this.autoplay) this.play()
    } else {
      this.logger.debug('Error initializing HLS support')
    }
    
  }

  destroy() {
    this.client.destroy()
  }
  
}

export default HlsClient