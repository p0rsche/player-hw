import Playlist from './components/playlist'
import VideoPlayer from './components/videoplayer'
import VideoClientRegistry, { IClientRegistry } from './components/clientsregistry';
import { DashClient, HlsClient, Mp4Client } from './components/clientsregistry/clients';

import '../assets/styles/styles.scss'
import jsonPlaylist from './playlist.json'

declare global {
  interface Window {
    Hls: unknown
    Dash: unknown
    Mp4: unknown
    broit: {
      Playlist: Playlist,
      VideoPlayer: typeof VideoPlayer,
      VideoClientRegistry: IClientRegistry
    }
  }
}

const registry = new VideoClientRegistry()
  .register(new HlsClient())
  .register(new DashClient())
  .register(new Mp4Client())

const playlist = new Playlist(jsonPlaylist) //in real world, playlist usually will be fetched remotely

// as per task, we need VideoPlayer to be constructed with selector and has the load method.
// unfortunately, I had to add one more global dependency to track video client libraries
// but this can be changed
window.broit = {
  Playlist: playlist,
  VideoPlayer,
  VideoClientRegistry: registry,
}