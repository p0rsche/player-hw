import { MediaElementEvent, NetworkState, ReadyState, VIDEOSTATE } from "../../utils/constants"

type ConsoleLike = Pick<Console, 'log' | 'debug' | 'warn'>



type StateManagerOptions = {
  logger?: ConsoleLike
  currentState?: VIDEOSTATE
  reportOnInit?: boolean
}

export default class StateManager extends EventTarget {
  logger
  prevState: VIDEOSTATE = VIDEOSTATE.UNKNOWN
  abortController: AbortController
  reportOnInit = true

  private _currentState: VIDEOSTATE
  private isAlreadyBuffering = false
  private isAlreadySeeking = false

  private defaultEventOps = {}
  private bufferingStartTime = 0
  private bufferingEndTime = 0

  constructor(private videoEl: HTMLVideoElement, options: StateManagerOptions = {}) {
    super()
    const { logger = console, currentState = null} = options
    this.logger = logger
    this.currentState = currentState
    this.abortController = new AbortController()
    this.defaultEventOps = { signal: this.abortController.signal }
    this.detectInitialState()
    if(this.reportOnInit) {
      this.logger.log(this.currentState)
    }
    this.addEventListeners()
  }

  get currentState(): VIDEOSTATE {
    return this._currentState;
  }

  set currentState(state: VIDEOSTATE) {
    if(this.currentState === state) return
    this._currentState = state
    let detail: string = state
    if(state === VIDEOSTATE.BUFFERING_ENDED) {
      const diff = this.calculateTimingDiff()
      detail = `${detail} in ${diff}s`
    }
    this.dispatchEvent(new CustomEvent('changestate', { detail }))
  }

  detectInitialState() {
    //simple initial state detector - should be improved
    const { currentSrc, networkState, readyState } = this.videoEl

    if (currentSrc) {
      switch(networkState) {
        case NetworkState.NETWORK_LOADING:
        case NetworkState.NETWORK_NO_SOURCE:
          this.currentState = VIDEOSTATE.LOADING
          break
        case NetworkState.NETWORK_IDLE:
          this.currentState = VIDEOSTATE.READY
      }      
    } else if(!currentSrc || (networkState === NetworkState.NETWORK_EMPTY && readyState === ReadyState.HAVE_NOTHING)) {
      this.currentState = VIDEOSTATE.IDLE
    }
  }

  calculateTimingDiff() {
    return (this.bufferingEndTime - this.bufferingStartTime) / 1000
  }

  private seeking() {
    this.videoEl.addEventListener(MediaElementEvent.SEEKING, () => {
      // Workaround when video is ended and user clicked 'play' button
      // so seeking event fires and then playing the video
      if(this.currentState === VIDEOSTATE.ENDED) {
        this.prevState = VIDEOSTATE.PLAYING
      } else {
        this.prevState = this.currentState
      }
      this.isAlreadySeeking = true
      this.currentState = VIDEOSTATE.SEEKING
    }, this.defaultEventOps)

    this.videoEl.addEventListener(MediaElementEvent.SEEKED, () => {
      if(this.isAlreadySeeking) {
        this.isAlreadySeeking = false
        if(this.currentState === VIDEOSTATE.BUFFERING_STARTED) {
          this.isAlreadyBuffering = false
          this.bufferingEndTime = Date.now()
          this.currentState = VIDEOSTATE.BUFFERING_ENDED
          this.currentState = this.prevState
        } else {
          this.currentState = this.prevState
        }
      }
    }, { ...this.defaultEventOps })
    
  }

  private ended() {
    this.videoEl.addEventListener(MediaElementEvent.ENDED, () => {
      this.currentState = VIDEOSTATE.ENDED
    }, this.defaultEventOps)
  }

  private paused() {
    this.videoEl.addEventListener(MediaElementEvent.PAUSE, () => {
      //do not report PAUSED event when buffering
      if(this.currentState === VIDEOSTATE.BUFFERING_STARTED) return
      // do not report PAUSED event when seeking
      if(this.videoEl.seeking === true) return
      // do not report PAUSED event just before ENDED (this is by spec, but we need better UX without polluting console)
      if(this.videoEl.ended === true) return
      
      this.currentState = VIDEOSTATE.PAUSED
    }, this.defaultEventOps)
  }

  private playing() {
    this.videoEl.addEventListener(MediaElementEvent.PLAYING, () => {
      this.currentState = VIDEOSTATE.PLAYING
    }, this.defaultEventOps)
  }

  private loadingAndReady() {
    // LOADING -> READY (when src attr provided in html), works for all except iOS Safari 
    this.videoEl.addEventListener(MediaElementEvent.EMPTIED, () => {
      this.currentState = VIDEOSTATE.LOADING
      this.videoEl.addEventListener(MediaElementEvent.CANPLAY, () => {
        this.currentState = VIDEOSTATE.READY
      }, { ...this.defaultEventOps, once: true })
    }, this.defaultEventOps)

    // LOADING -> READY (when changed src programmatically), works for all except Chrome and iOS Safari 
    this.videoEl.addEventListener(MediaElementEvent.LOADSTART, () => {
      this.currentState = VIDEOSTATE.LOADING

      this.videoEl.addEventListener(MediaElementEvent.CANPLAY, () => {
        this.currentState = VIDEOSTATE.READY
      }, { ...this.defaultEventOps, once: true })

      //ios workaround
      this.videoEl.addEventListener(MediaElementEvent.SUSPEND, () => {
        this.videoEl.addEventListener(MediaElementEvent.LOADEDMETADATA, () => {
          this.currentState = VIDEOSTATE.READY
        }, { ...this.defaultEventOps, once: true })
      }, { ...this.defaultEventOps, once: true })
    }, this.defaultEventOps)
  }

  private buffering() {
    this.videoEl.addEventListener(MediaElementEvent.WAITING, () => {
      if(this.isAlreadyBuffering) {
        this.currentState = VIDEOSTATE.BUFFERING_INTERRUPTED
        this.bufferingStartTime = Date.now()
      } else {
        this.isAlreadyBuffering = true
        this.bufferingStartTime = Date.now()  
      }
      this.currentState = VIDEOSTATE.BUFFERING_STARTED
    }, this.defaultEventOps)

    this.videoEl.addEventListener(MediaElementEvent.CANPLAY, () => {
      if(!this.isAlreadyBuffering) return // react only if there are buffering event
      this.isAlreadyBuffering = false
      this.bufferingEndTime = Date.now()
      this.currentState = VIDEOSTATE.BUFFERING_ENDED
    }, { ...this.defaultEventOps })
  }

  addEventListeners() {
    this.buffering()

    this.seeking()

    this.playing()

    this.loadingAndReady()
    
    this.ended()

    this.paused()
  }

  removeEventListeners() {
    this.abortController.abort()
  }


  destroy() {
    this.removeEventListeners()
  }
}
