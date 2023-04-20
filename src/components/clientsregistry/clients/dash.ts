import { VideoClient } from "../videoclient";
import Dash from 'dashjs'

class DashClient extends VideoClient {
  registeredFileExtensions = ['mpd'];

  client: Dash.MediaPlayerClass

  constructor() {
    super()
  }

  init(video: HTMLVideoElement, url: string) {
    super.init(video, url)

    this.client = Dash.MediaPlayer().create()
    this.client.initialize(this.videoEl, this.currentUrl, this.autoplay)
    this.client.updateSettings({ 'debug': { 'logLevel': 0 }});

    this.setupEventListeners()
    if(this.autoplay) this.play()
  }

  setupEventListeners() {
    this.client.on(Dash.MediaPlayer.events['STREAM_INITIALIZED'], () => {
      this.client.setTextTrack(-1) //turn of captions by default
    })
  }

  destroy() {
    this.client?.reset()
  }
}

export default DashClient