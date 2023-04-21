export enum VIDEOSTATE {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  READY = 'READY',
  PLAYING = 'PLAYING',
  PAUSED = 'PAUSED',
  SEEKING = 'SEEKING',
  BUFFERING_STARTED = 'BUFFERING_STARTED',
  BUFFERING_ENDED = 'BUFFERING_ENDED',
  BUFFERING_INTERRUPTED = 'BUFFERING_INTERRUPTED',
  ENDED = 'ENDED',
  UNKNOWN = 'UNKNOWN'
}

export enum VIDEOTYPE {
  MP4 = 'MP4',
  DASH = 'DASH',
  HLS = 'HLS'
}

export const videoTypesByExt = {
  'mp4': VIDEOTYPE.MP4,
  'm3u8': VIDEOTYPE.HLS,
  'mpd': VIDEOTYPE.DASH
}

export enum NetworkState {
  NETWORK_EMPTY = 0,
  NETWORK_IDLE = 1,
  NETWORK_LOADING = 2,
  NETWORK_NO_SOURCE = 3,
}

export enum ReadyState {
  HAVE_NOTHING = 0,
  HAVE_METADATA = 1,
  HAVE_CURRENT_DATA = 2,
  HAVE_FUTURE_DATA = 3,
  HAVE_ENOUGH_DATA = 4,
}

export enum MediaElementEvent {
  SEEKING = 'seeking',
  SEEKED = 'seeked',
  ENDED = 'ended',
  PAUSE = 'pause',
  PLAYING = 'playing',
  EMPTIED = 'emptied',
  CANPLAY = 'canplay',
  LOADSTART = 'loadstart',
  SUSPEND = 'suspend',
  DURATIONCHANGE = 'durationchange',
  LOADEDMETADATA = 'loadedmetadata',
  PROGRESS = 'progress',
  WAITING = 'waiting',
}