import { MediaElementEvent, NetworkState, ReadyState, VIDEOSTATE } from "../../utils/constants"

type ConsoleLike = Pick<Console, 'log' | 'debug' | 'warn'>



type StateManagerOptions = {
  logger?: ConsoleLike
  currentState?: VIDEOSTATE
  reportOnInit?: boolean
}

export default class StateManager extends EventTarget {
  logger
  #currentState: VIDEOSTATE
  prevState: VIDEOSTATE = VIDEOSTATE.UNKNOWN
  abortController: AbortController
  reportOnInit = true

  private defaultEventOps = {}

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
    return this.#currentState;
  }

  set currentState(state: VIDEOSTATE) {
    if(this.#currentState === state) return
    this.#currentState = state
    this.dispatchEvent(new CustomEvent('changestate', { detail: state }))
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

  private seeking() {
    this.videoEl.addEventListener(MediaElementEvent.SEEKING, () => {
      // Workaround when video is ended and user clicked 'play' button
      // so seeking event fires and then playing the video
      if(this.currentState === VIDEOSTATE.ENDED) {
        this.prevState = VIDEOSTATE.PLAYING
      } else {
        this.prevState = this.currentState
      }
      this.currentState = VIDEOSTATE.SEEKING
    }, this.defaultEventOps)

    this.videoEl.addEventListener(MediaElementEvent.SEEKED, () => {
      this.currentState = this.prevState
    }, this.defaultEventOps)
  }

  private ended() {
    this.videoEl.addEventListener(MediaElementEvent.ENDED, () => {
      this.currentState = VIDEOSTATE.ENDED
    }, this.defaultEventOps)
  }

  private paused() {
    this.videoEl.addEventListener(MediaElementEvent.PAUSE, () => {
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

  // private buffering() {
  //   this.videoEl.addEventListener(MediaElementEvent.WAITING, () => {
  //     const bufferingStartTime = +(new Date)
  //     this.prevState = this.currentState
  //     this.currentState = VIDEOSTATE.BUFFERING
  //     this.videoEl.addEventListener(MediaElementEvent.PLAYING, () => {
  //       const bufferingFinishTime = +(new Date) - bufferingStartTime
  //       // this.currentState = +bufferingFinishTime
  //       console.log(bufferingFinishTime)
  //       this.currentState = VIDEOSTATE.PLAYING
  //     }, { ...this.defaultEventOps, once: true})
  //   }, this.defaultEventOps)
  // }

  addEventListeners() {
    this.seeking()
    
    this.ended()

    this.paused()

    this.playing()

    this.loadingAndReady()

    // this.buffering()
  }

  removeEventListeners() {
    this.abortController.abort()
  }


  destroy() {
    this.removeEventListeners()
  }
}
