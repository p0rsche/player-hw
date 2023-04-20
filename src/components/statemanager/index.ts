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

  private latestEventType = ''

  constructor(private videoEl: HTMLVideoElement, options: StateManagerOptions = {}) {
    super()
    const { logger = console, currentState = null} = options
    this.logger = logger
    this.currentState = currentState
    this.abortController = new AbortController()
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

  addEventListeners() {
    const opts = { signal: this.abortController.signal }
    const once = { once: true }
    
    this.videoEl.addEventListener(MediaElementEvent.SEEKING, () => {
      // Workaround when video is ended and user clicked 'play' button
      // so seeking event fires and then playing the video
      if(this.currentState === VIDEOSTATE.ENDED) {
        this.prevState = VIDEOSTATE.PLAYING
      } else {
        this.prevState = this.currentState
      }
      this.currentState = VIDEOSTATE.SEEKING
    }, opts)

    this.videoEl.addEventListener(MediaElementEvent.SEEKED, () => {
      this.currentState = this.prevState
    }, opts)

    this.videoEl.addEventListener(MediaElementEvent.ENDED, () => {
      this.currentState = VIDEOSTATE.ENDED
    }, opts)

    this.videoEl.addEventListener(MediaElementEvent.PAUSE, () => {
      // do not report PAUSED event when seeking
      if(this.videoEl.seeking === true) return
      // do not report PAUSED event just before ENDED (this is by spec, but we need better UX without polluting console)
      if(this.videoEl.ended === true) return
      
      this.currentState = VIDEOSTATE.PAUSED
    }, opts)

    this.videoEl.addEventListener(MediaElementEvent.PLAYING, () => {
      this.currentState = VIDEOSTATE.PLAYING
    }, opts)
    // LOADING -> READY (when src attr provided in html), works for all except iOS Safari 
    this.videoEl.addEventListener(MediaElementEvent.EMPTIED, () => {
      this.currentState = VIDEOSTATE.LOADING
      this.videoEl.addEventListener(MediaElementEvent.CANPLAY, () => {
        this.currentState = VIDEOSTATE.READY
      }, { ...opts, ...once })
    }, opts)

    // LOADING -> READY (when changed src programmatically), works for all except Chrome and iOS Safari 
    this.videoEl.addEventListener(MediaElementEvent.LOADSTART, () => {
      this.currentState = VIDEOSTATE.LOADING

      this.videoEl.addEventListener(MediaElementEvent.CANPLAY, () => {
        this.currentState = VIDEOSTATE.READY
      }, { ...opts, ...once })

      //ios workaround
      this.videoEl.addEventListener(MediaElementEvent.SUSPEND, () => {
        this.videoEl.addEventListener(MediaElementEvent.LOADEDMETADATA, () => {
          this.currentState = VIDEOSTATE.READY
        }, { ...opts, ...once })
      }, { ...opts, ...once })

    }, opts)

    this.applyIOSWorkarounds()

    // const events = [
    //   'loadstart', 'durationchange', 'loadedmetadata', 'loadeddata', 'canplay', 'canplaythrough', 
    //   'suspend', 'ended', 'emptied', 'stalled', 'play', 'playing', 'timeupdate', 'pause',
    //   'seeking', 'seeked', 'progress', 'waiting',
    // ]

    // events.forEach(eventName => {
    //   this.videoEl.addEventListener(eventName, e => {
    //     console.log(e.type)
    //   }, opts)
    // })
  }

  applyIOSWorkarounds() {
    // const opts = { once: true, signal: this.abortController.signal }
    // this.videoEl.addEventListener(MediaElementEvent.LOADSTART, () => {
    //   this.videoEl.addEventListener(MediaElementEvent.SUSPEND, () => {
    //     this.videoEl.addEventListener(MediaElementEvent.DURATIONCHANGE, () => {
    //       this.videoEl.addEventListener(MediaElementEvent.LOADEDMETADATA, () => {
    //         //READY!
    //       }, opts)
    //     }, { signal: this.abortController.signal })
    //   }, opts)
    // }, { signal: this.abortController.signal })
  }

  removeEventListeners() {
    this.abortController.abort()
  }


  destroy() {
    this.removeEventListeners()
  }
}

/**
 * on load
 * 
 * Chrome -> 'IDLE' -> loadstart? -> durationchange -> loadedmetadata -> loadeddata -> canplay -> canplaythrough -> suspend?
 * FF -> 'IDLE' -> loadstart -> suspend? -> durationchange -> loadedmetadata -> suspend? -> loadeddata -> canplay
 * Safari -> 'IDLE' -> loadstart -> durationchange -> loadedmetadata -> loadeddata -> canplay -> canplaythrough
 * Edge -> 'IDLE' -> loadstart -> durationchange -> loadedmetadata -> loadeddata -> canplay -> canplaythrough -> suspend
 * Opera -> 'IDLE' -> loadstart -> durationchange -> loadedmetadata -> loadeddata -> canplay -> canplaythrough
 * iOS Safari -> 'IDLE' -> loadstart -> suspend -> durationchange -> loadedmetadata (maybe check status )
 * Android Chrome -> 'IDLE' -> loadstart -> durationchange -> loadedmetadata -> loadeddata -> canplay -> canplaythrough -> suspend?
 * 
 */

/**
 * On source update
 * Chrome -> 'LOADING' -> emptied -> timeupdate -> loadstart -> durationchange -> loadedmetadata -> loadeddata -> canplay -> canplaythrough -> suspend?
 * FF -> 'LOADING' -> emptied -> loadstart -> suspend -> durationchange -> loadedmetadata -> suspend? -> loadeddata -> canplay
 * Safari -> 'LOADING' -> emptied -> loadstart -> durationchange -> loadedmetadata -> loadeddata -> canplay -> canplaythrough -> stalled?
 * Edge -> 'LOADING' -> emptied -> timeupdate -> loadstart -> durationchange -> loadedmetadata -> canplay -> canplaythrough -> suspend
 * Opera -> 'LOADING' -> emptied -> timeupdate -> loadstart -> durationchange -> loadedmetadata -> loadeddata -> canplay -> canplaythrough -> suspend?
 * iOS Safari -> 'LOADING' -> emptied -> loadstart -> suspend -> durationchange -> loadedmetadata
 * Android Chrome -> 'LOADING' -> emptied -> timeupdate -> loadstart -> durationchange -> loadedmetadata -> loadeddata -> canplay -> canplaythrough -> suspend?
 * 
 */

/**
 * Continuously seeking by clicking on timeline and moving on is out of bounds since it needs more granular control and differs in desktop and mobile browsers
 */