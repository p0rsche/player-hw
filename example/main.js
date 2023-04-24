/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
var __webpack_exports__ = {};

;// CONCATENATED MODULE: ./src/components/playlist/index.ts
// in real-world, should be fetched remotely and injected in Playlist object
// helper class to build playlist from JSON-schema
class Playlist {
    constructor(playlist = [], logger = console) {
        this.playlist = playlist;
        this.logger = logger;
        this.videoChangeCbs = [];
        this.callListeners = this.callListeners.bind(this);
    }
    loadPlaylist(playlist = []) {
        this.playlist = playlist;
    }
    render(selector) {
        try {
            const el = document.querySelector(selector);
            if (!el)
                throw new DOMException('Element not found');
            this.container = el;
            this.createDropdown();
            this.attach();
            this.attachEventListeners();
        }
        catch (e) {
            this.logger.debug(e.message);
        }
        return this;
    }
    addPlaylistOption(option) {
        const { title, url } = option;
        this.selectEl.appendChild(this.createDropdownOption(title, url));
    }
    onVideoChange(cb) {
        this.videoChangeCbs.push(cb);
    }
    createDropdown() {
        this.selectEl = document.createElement('select');
        this.selectEl.id = this.elemId;
        const emptyOption = this.createDropdownOption('Please select video', '');
        this.selectEl.appendChild(emptyOption);
        this.playlist.forEach(el => this.selectEl.appendChild(this.createDropdownOption(el.title, el.url)));
    }
    createDropdownOption(text, value) {
        const option = document.createElement('option');
        option.value = value;
        option.text = text;
        return option;
    }
    attach() {
        this.container.appendChild(this.selectEl);
    }
    attachEventListeners() {
        this.selectEl.addEventListener('change', this.callListeners);
    }
    callListeners(e) {
        const { text, value } = e.target;
        this.videoChangeCbs.forEach(cb => cb(text, value));
    }
    removeEventListeners() {
        this.selectEl.removeEventListener('change', this.callListeners);
    }
    destroy() {
        this.removeEventListeners();
        this.selectEl.remove();
        this.selectEl = null;
        this.container = null;
        this.videoChangeCbs = [];
    }
}
/* harmony default export */ const playlist = (Playlist);

;// CONCATENATED MODULE: ./src/utils/helpers.ts
const debug = console.debug;
const assert = console.assert;
const log = console.log;
const getFileExtensionFromUrl = (url) => {
    const fileName = url.split('/').pop();
    const fileExt = fileName === null || fileName === void 0 ? void 0 : fileName.split('.').pop();
    return fileExt !== null && fileExt !== void 0 ? fileExt : '';
};

;// CONCATENATED MODULE: ./src/utils/constants.ts
var VIDEOSTATE;
(function (VIDEOSTATE) {
    VIDEOSTATE["IDLE"] = "IDLE";
    VIDEOSTATE["LOADING"] = "LOADING";
    VIDEOSTATE["READY"] = "READY";
    VIDEOSTATE["PLAYING"] = "PLAYING";
    VIDEOSTATE["PAUSED"] = "PAUSED";
    VIDEOSTATE["SEEKING"] = "SEEKING";
    VIDEOSTATE["BUFFERING_STARTED"] = "BUFFERING_STARTED";
    VIDEOSTATE["BUFFERING_ENDED"] = "BUFFERING_ENDED";
    VIDEOSTATE["BUFFERING_INTERRUPTED"] = "BUFFERING_INTERRUPTED";
    VIDEOSTATE["ENDED"] = "ENDED";
    VIDEOSTATE["UNKNOWN"] = "UNKNOWN";
})(VIDEOSTATE || (VIDEOSTATE = {}));
var VIDEOTYPE;
(function (VIDEOTYPE) {
    VIDEOTYPE["MP4"] = "MP4";
    VIDEOTYPE["DASH"] = "DASH";
    VIDEOTYPE["HLS"] = "HLS";
})(VIDEOTYPE || (VIDEOTYPE = {}));
const videoTypesByExt = {
    'mp4': VIDEOTYPE.MP4,
    'm3u8': VIDEOTYPE.HLS,
    'mpd': VIDEOTYPE.DASH
};
var NetworkState;
(function (NetworkState) {
    NetworkState[NetworkState["NETWORK_EMPTY"] = 0] = "NETWORK_EMPTY";
    NetworkState[NetworkState["NETWORK_IDLE"] = 1] = "NETWORK_IDLE";
    NetworkState[NetworkState["NETWORK_LOADING"] = 2] = "NETWORK_LOADING";
    NetworkState[NetworkState["NETWORK_NO_SOURCE"] = 3] = "NETWORK_NO_SOURCE";
})(NetworkState || (NetworkState = {}));
var ReadyState;
(function (ReadyState) {
    ReadyState[ReadyState["HAVE_NOTHING"] = 0] = "HAVE_NOTHING";
    ReadyState[ReadyState["HAVE_METADATA"] = 1] = "HAVE_METADATA";
    ReadyState[ReadyState["HAVE_CURRENT_DATA"] = 2] = "HAVE_CURRENT_DATA";
    ReadyState[ReadyState["HAVE_FUTURE_DATA"] = 3] = "HAVE_FUTURE_DATA";
    ReadyState[ReadyState["HAVE_ENOUGH_DATA"] = 4] = "HAVE_ENOUGH_DATA";
})(ReadyState || (ReadyState = {}));
var MediaElementEvent;
(function (MediaElementEvent) {
    MediaElementEvent["SEEKING"] = "seeking";
    MediaElementEvent["SEEKED"] = "seeked";
    MediaElementEvent["ENDED"] = "ended";
    MediaElementEvent["PAUSE"] = "pause";
    MediaElementEvent["PLAYING"] = "playing";
    MediaElementEvent["EMPTIED"] = "emptied";
    MediaElementEvent["CANPLAY"] = "canplay";
    MediaElementEvent["LOADSTART"] = "loadstart";
    MediaElementEvent["SUSPEND"] = "suspend";
    MediaElementEvent["DURATIONCHANGE"] = "durationchange";
    MediaElementEvent["LOADEDMETADATA"] = "loadedmetadata";
    MediaElementEvent["PROGRESS"] = "progress";
    MediaElementEvent["WAITING"] = "waiting";
})(MediaElementEvent || (MediaElementEvent = {}));

;// CONCATENATED MODULE: ./src/components/statemanager/index.ts

class StateManager extends EventTarget {
    constructor(videoEl, options = {}) {
        super();
        this.videoEl = videoEl;
        this.prevState = VIDEOSTATE.UNKNOWN;
        this.isAlreadyBuffering = false;
        this.isAlreadySeeking = false;
        this.defaultEventOps = {};
        this.bufferingStartTime = 0;
        this.bufferingEndTime = 0;
        const { logger = console, currentState = null } = options;
        this.logger = logger;
        this.currentState = currentState;
        this.abortController = new AbortController();
        this.defaultEventOps = { signal: this.abortController.signal };
        this.detectInitialState();
        this.addEventListeners();
    }
    get currentState() {
        return this._currentState;
    }
    set currentState(state) {
        if (this.currentState === state)
            return;
        this._currentState = state;
        let detail = state;
        if (state === VIDEOSTATE.BUFFERING_ENDED) {
            const diff = this.calculateTimingDiff();
            detail = `${detail} in ${diff}s`;
        }
        this.dispatchEvent(new CustomEvent('changestate', { detail }));
    }
    detectInitialState() {
        //simple initial state detector - should be improved
        const { currentSrc, networkState, readyState } = this.videoEl;
        if (currentSrc) {
            switch (networkState) {
                case NetworkState.NETWORK_LOADING:
                case NetworkState.NETWORK_NO_SOURCE:
                    this.currentState = VIDEOSTATE.LOADING;
                    break;
                case NetworkState.NETWORK_IDLE:
                    this.currentState = VIDEOSTATE.READY;
            }
        }
        else if (!currentSrc || (networkState === NetworkState.NETWORK_EMPTY && readyState === ReadyState.HAVE_NOTHING)) {
            this.currentState = VIDEOSTATE.IDLE;
        }
    }
    calculateTimingDiff() {
        return (this.bufferingEndTime - this.bufferingStartTime) / 1000;
    }
    seeking() {
        this.videoEl.addEventListener(MediaElementEvent.SEEKING, () => {
            // Workaround when video is ended and user clicked 'play' button
            // so seeking event fires and then playing the video
            if (this.currentState === VIDEOSTATE.ENDED) {
                this.prevState = VIDEOSTATE.PLAYING;
            }
            else {
                this.prevState = this.currentState;
            }
            this.isAlreadySeeking = true;
            this.currentState = VIDEOSTATE.SEEKING;
        }, this.defaultEventOps);
        this.videoEl.addEventListener(MediaElementEvent.SEEKED, () => {
            if (this.isAlreadySeeking) {
                this.isAlreadySeeking = false;
                if (this.currentState === VIDEOSTATE.BUFFERING_STARTED) {
                    this.isAlreadyBuffering = false;
                    this.bufferingEndTime = Date.now();
                    this.currentState = VIDEOSTATE.BUFFERING_ENDED;
                    this.currentState = this.prevState;
                }
                else {
                    this.currentState = this.prevState;
                }
            }
        }, Object.assign({}, this.defaultEventOps));
    }
    ended() {
        this.videoEl.addEventListener(MediaElementEvent.ENDED, () => {
            this.currentState = VIDEOSTATE.ENDED;
        }, this.defaultEventOps);
    }
    paused() {
        this.videoEl.addEventListener(MediaElementEvent.PAUSE, () => {
            //do not report PAUSED event when buffering
            if (this.currentState === VIDEOSTATE.BUFFERING_STARTED)
                return;
            // do not report PAUSED event when seeking
            if (this.videoEl.seeking === true)
                return;
            // do not report PAUSED event just before ENDED (this is by spec, but we need better UX without polluting console)
            if (this.videoEl.ended === true)
                return;
            this.currentState = VIDEOSTATE.PAUSED;
        }, this.defaultEventOps);
    }
    playing() {
        this.videoEl.addEventListener(MediaElementEvent.PLAYING, () => {
            this.currentState = VIDEOSTATE.PLAYING;
        }, this.defaultEventOps);
    }
    loadingAndReady() {
        // LOADING -> READY (when src attr provided in html), works for all except iOS Safari 
        this.videoEl.addEventListener(MediaElementEvent.EMPTIED, () => {
            this.currentState = VIDEOSTATE.LOADING;
            this.videoEl.addEventListener(MediaElementEvent.CANPLAY, () => {
                this.currentState = VIDEOSTATE.READY;
            }, Object.assign(Object.assign({}, this.defaultEventOps), { once: true }));
        }, this.defaultEventOps);
        // LOADING -> READY (when changed src programmatically), works for all except Chrome and iOS Safari 
        this.videoEl.addEventListener(MediaElementEvent.LOADSTART, () => {
            this.currentState = VIDEOSTATE.LOADING;
            this.videoEl.addEventListener(MediaElementEvent.CANPLAY, () => {
                this.currentState = VIDEOSTATE.READY;
            }, Object.assign(Object.assign({}, this.defaultEventOps), { once: true }));
            //ios workaround
            this.videoEl.addEventListener(MediaElementEvent.SUSPEND, () => {
                this.videoEl.addEventListener(MediaElementEvent.LOADEDMETADATA, () => {
                    this.currentState = VIDEOSTATE.READY;
                }, Object.assign(Object.assign({}, this.defaultEventOps), { once: true }));
            }, Object.assign(Object.assign({}, this.defaultEventOps), { once: true }));
        }, this.defaultEventOps);
    }
    buffering() {
        this.videoEl.addEventListener(MediaElementEvent.WAITING, () => {
            if (this.isAlreadyBuffering) {
                this.currentState = VIDEOSTATE.BUFFERING_INTERRUPTED;
                this.bufferingStartTime = Date.now();
            }
            else {
                this.isAlreadyBuffering = true;
                this.bufferingStartTime = Date.now();
            }
            this.currentState = VIDEOSTATE.BUFFERING_STARTED;
        }, this.defaultEventOps);
        this.videoEl.addEventListener(MediaElementEvent.CANPLAY, () => {
            if (!this.isAlreadyBuffering)
                return; // react only if there are buffering event
            this.isAlreadyBuffering = false;
            this.bufferingEndTime = Date.now();
            this.currentState = VIDEOSTATE.BUFFERING_ENDED;
        }, Object.assign({}, this.defaultEventOps));
    }
    addEventListeners() {
        this.buffering();
        this.seeking();
        this.playing();
        this.loadingAndReady();
        this.ended();
        this.paused();
    }
    removeEventListeners() {
        this.abortController.abort();
    }
    destroy() {
        this.removeEventListeners();
    }
}

;// CONCATENATED MODULE: ./src/components/videoplayer/index.ts


class VideoPlayer {
    constructor(selector, registry = window.broit.VideoClientRegistry, logger = console) {
        var _a;
        this.registry = registry;
        this.logger = logger;
        this.videoStateChangesCbs = [];
        this.initialStatusSent = false;
        this.videoEl = document.querySelector(selector);
        if (((_a = this.videoEl) === null || _a === void 0 ? void 0 : _a.tagName) !== 'VIDEO') {
            this.logger.debug('Wrong video tag');
            return;
        }
        this.stateManager = new StateManager(this.videoEl);
        this.attachEventListeners();
        this.applyWorkarounds();
        if (this.videoEl.currentSrc !== '')
            this.load(this.videoEl.currentSrc);
    }
    applyWorkarounds() {
        //ios workaround for autoplay
        this.videoEl.playsInline = true;
    }
    load(url) {
        if (!url || this.currentUrl === url)
            return;
        this.currentUrl = url;
        const fileExt = getFileExtensionFromUrl(this.currentUrl);
        this.currentVideoClient = this.registry.findClientByExt(fileExt);
        if (!this.currentVideoClient) {
            this.currentVideoClient = this.registry.getDefaultClient();
            if (!this.currentVideoClient) {
                this.logger.debug('No default video client presented');
                return;
            }
        }
        this.currentVideoClient.init(this.videoEl, url);
    }
    attachEventListeners() {
        this.stateManager.addEventListener('changestate', (e) => {
            this.reportStateChanges(e.detail);
        });
    }
    removeEventListeners() {
        this.stateManager.removeEventListeners();
    }
    reportStatus() {
        this.logger.log(this.stateManager.currentState);
    }
    reportStateChanges(state) {
        this.videoStateChangesCbs.forEach(cb => cb(state));
    }
    onVideoStateChange(cb) {
        if (!this.initialStatusSent) {
            cb(this.stateManager.currentState);
            this.initialStatusSent = true;
        }
        this.videoStateChangesCbs.push(cb);
    }
    setVideoClientRegistry(registry) {
        this.registry = registry;
    }
    destroy() {
        this.removeEventListeners();
        this.videoStateChangesCbs = [];
    }
}
/* harmony default export */ const videoplayer = (VideoPlayer);

;// CONCATENATED MODULE: ./src/components/stateupdater/index.ts
class StateUpdater {
    constructor(selector, options = {}) {
        this.stack = [];
        this.el = document.querySelector(selector);
        const { maxEntries = 5, } = options;
        this.maxEntries = maxEntries;
        this.stack.length = maxEntries;
    }
    render(status) {
        this.updateStatus(status);
        this.renderStatuses();
    }
    updateStatus(status) {
        this.stack.unshift(status);
        this.stack.length = this.maxEntries;
    }
    renderStatuses() {
        const list = document.createElement('ul');
        for (let i = 0, len = this.stack.length; i < len; i++) {
            if (!this.stack[i])
                continue;
            const li = document.createElement('li');
            li.textContent = this.stack[i];
            list.prepend(li);
        }
        this.el.replaceChildren(list);
    }
}

;// CONCATENATED MODULE: ./src/components/clientsregistry/index.ts

class VideoClientRegistry {
    constructor() {
        this.registeredClients = new Set();
    }
    register(client) {
        if (client.isDefault()) {
            if (this.defaultClient) {
                debug('Default client is already registered');
                return;
            }
            this.defaultClient = client;
        }
        this.registeredClients.add(client);
        return this;
    }
    unregister(client) {
        this.defaultClient = null;
        this.registeredClients.delete(client);
        return this;
    }
    getDefaultClient() {
        return this.defaultClient;
    }
    findClientByExt(ext) {
        let foundClient;
        try {
            this.registeredClients.forEach(client => {
                if (client.supports(ext)) {
                    foundClient = client;
                    throw new Error(); // throwing just to short-circuit and exit from forEach
                    //we could use iterator, but need to set TS target other than es5
                }
            });
        }
        catch (e) {
            // just chillin
        }
        return foundClient;
    }
    destroy() {
        this.registeredClients = null;
        this.defaultClient = null;
    }
}

;// CONCATENATED MODULE: ./src/components/clientsregistry/videoclient.ts
class VideoClient {
    constructor(logger = console) {
        this.registeredFileExtensions = [];
        this.autoplay = true;
        this.default = false;
        this.logger = logger;
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
        }
        catch (e) {
            this.logger.debug(e);
        }
    }
    isDefault() {
        return this.default;
    }
    init(video, url) {
        this.videoEl = video;
        this.currentUrl = url;
    }
    supports(ext) {
        return this.registeredFileExtensions.some(e => e === ext);
    }
    destroy() {
        this.client = null;
        this.videoEl = null;
        this.currentUrl = null;
    }
}

;// CONCATENATED MODULE: ./src/components/clientsregistry/clients/dash.ts
const dashjs = window.dashjs;

class DashClient extends VideoClient {
    constructor() {
        super();
        this.registeredFileExtensions = ['mpd'];
    }
    init(video, url) {
        super.init(video, url);
        this.client = dashjs.MediaPlayer().create();
        this.client.initialize(this.videoEl, this.currentUrl, this.autoplay);
        this.client.updateSettings({ 'debug': { 'logLevel': 0 } });
        this.setupEventListeners();
        if (this.autoplay)
            this.play();
    }
    setupEventListeners() {
        this.client.on(dashjs.MediaPlayer.events['STREAM_INITIALIZED'], () => {
            this.client.setTextTrack(-1); //turn off captions by default
        });
    }
    destroy() {
        var _a;
        (_a = this.client) === null || _a === void 0 ? void 0 : _a.reset();
    }
}
/* harmony default export */ const dash = (DashClient);

;// CONCATENATED MODULE: ./src/components/clientsregistry/clients/hls.ts
const Hls = window.Hls;

class HlsClient extends VideoClient {
    constructor() {
        super();
        this.registeredFileExtensions = ['m3u8'];
    }
    init(video, url) {
        super.init(video, url);
        if (this.videoEl.canPlayType('application/vnd.apple.mpegurl')) {
            this.videoEl.src = this.currentUrl;
            this.autoplay === true && this.videoEl.addEventListener('loadedmetadata', () => {
                this.play();
            }, { once: true });
            //
            // If no native HLS support, check if HLS.js is supported
            //
        }
        else if (Hls.isSupported()) {
            if (this.client)
                this.destroy();
            this.client = new Hls();
            this.client.loadSource(this.currentUrl);
            this.client.attachMedia(this.videoEl);
            this.autoplay === true && this.client.once(Hls.Events.MANIFEST_PARSED, () => {
                this.play();
            });
            if (this.autoplay)
                this.play();
        }
        else {
            this.logger.debug('Error initializing HLS support');
        }
    }
    destroy() {
        this.client.destroy();
    }
}
/* harmony default export */ const hls = (HlsClient);

;// CONCATENATED MODULE: ./src/components/clientsregistry/clients/mp4.ts

class Mp4Client extends VideoClient {
    constructor() {
        super();
        this.registeredFileExtensions = ['mp4'];
        this.default = true;
    }
    init(video, url) {
        super.init(video, url);
        this.videoEl.src = url;
        if (this.autoplay)
            this.play();
    }
}
/* harmony default export */ const mp4 = (Mp4Client);

;// CONCATENATED MODULE: ./src/components/clientsregistry/clients/index.ts





;// CONCATENATED MODULE: ./src/playlist.json
const src_playlist_namespaceObject = JSON.parse('[{"title":"Angel One","url":"https://storage.googleapis.com/shaka-demo-assets/angel-one/dash.mpd"},{"title":"Big Buck Bunny: Dark Truths","url":"https://storage.googleapis.com/shaka-demo-assets/bbb-dark-truths-hls/hls.m3u8"},{"title":"Sintel","url":"https://media.w3.org/2010/05/sintel/trailer.mp4"}]');
;// CONCATENATED MODULE: ./src/index.ts







const registry = new VideoClientRegistry()
    .register(new hls())
    .register(new dash())
    .register(new mp4());
const src_playlist = new playlist(src_playlist_namespaceObject); //in real world, playlist usually will be fetched remotely
// as per task, we need VideoPlayer to be constructed with selector and has the load method.
// unfortunately, I had to add one more global dependency to track video client libraries
// but this can be changed
window.broit = {
    Playlist: src_playlist,
    VideoPlayer: videoplayer,
    VideoClientRegistry: registry,
    StateUpdater: StateUpdater,
};

/******/ })()
;