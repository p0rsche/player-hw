const dashjs = window.dashjs

import { VideoClient } from "../videoclient";

class DashClient extends VideoClient {
  registeredFileExtensions = ['mpd'];

  client: typeof dashjs.MediaPlayerClass

  constructor() {
    super()
  }

  init(video: HTMLVideoElement, url: string) {
    super.init(video, url)

    this.client = dashjs.MediaPlayer().create()
    this.client.initialize(this.videoEl, this.currentUrl, this.autoplay)
    this.client.updateSettings({ 'debug': { 'logLevel': 0 }});

    this.setupEventListeners()
    if(this.autoplay) this.play()
  }

  setupEventListeners() {
    this.client.on(dashjs.MediaPlayer.events['STREAM_INITIALIZED'], () => {
      this.client.setTextTrack(-1) //turn of captions by default
    })
  }

  destroy() {
    this.client?.reset()
  }
}

export default DashClient