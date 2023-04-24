/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
var __webpack_exports__ = {};

;// CONCATENATED MODULE: ./src/components/playlist/index.ts
// in real-world, should be fetched remotely and injected in Playlist object
// helper class to build playlist from JSON-schema
var Playlist = /** @class */ (function () {
    function Playlist(playlist, logger) {
        if (playlist === void 0) { playlist = []; }
        if (logger === void 0) { logger = console; }
        this.playlist = playlist;
        this.logger = logger;
        this.videoChangeCbs = [];
        this.callListeners = this.callListeners.bind(this);
    }
    Playlist.prototype.loadPlaylist = function (playlist) {
        if (playlist === void 0) { playlist = []; }
        this.playlist = playlist;
    };
    Playlist.prototype.render = function (selector) {
        try {
            var el = document.querySelector(selector);
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
    };
    Playlist.prototype.addPlaylistOption = function (option) {
        var title = option.title, url = option.url;
        this.selectEl.appendChild(this.createDropdownOption(title, url));
    };
    Playlist.prototype.onVideoChange = function (cb) {
        this.videoChangeCbs.push(cb);
    };
    Playlist.prototype.createDropdown = function () {
        var _this = this;
        this.selectEl = document.createElement('select');
        this.selectEl.id = this.elemId;
        var emptyOption = this.createDropdownOption('Please select video', '');
        this.selectEl.appendChild(emptyOption);
        this.playlist.forEach(function (el) { return _this.selectEl.appendChild(_this.createDropdownOption(el.title, el.url)); });
    };
    Playlist.prototype.createDropdownOption = function (text, value) {
        var option = document.createElement('option');
        option.value = value;
        option.text = text;
        return option;
    };
    Playlist.prototype.attach = function () {
        this.container.appendChild(this.selectEl);
    };
    Playlist.prototype.attachEventListeners = function () {
        this.selectEl.addEventListener('change', this.callListeners);
    };
    Playlist.prototype.callListeners = function (e) {
        var _a = e.target, text = _a.text, value = _a.value;
        this.videoChangeCbs.forEach(function (cb) { return cb(text, value); });
    };
    Playlist.prototype.removeEventListeners = function () {
        this.selectEl.removeEventListener('change', this.callListeners);
    };
    Playlist.prototype.destroy = function () {
        this.removeEventListeners();
        this.selectEl.remove();
        this.selectEl = null;
        this.container = null;
        this.videoChangeCbs = [];
    };
    return Playlist;
}());
/* harmony default export */ const playlist = (Playlist);

;// CONCATENATED MODULE: ./src/utils/helpers.ts
var debug = console.debug;
var assert = console.assert;
var log = console.log;
var getFileExtensionFromUrl = function (url) {
    var fileName = url.split('/').pop();
    var fileExt = fileName === null || fileName === void 0 ? void 0 : fileName.split('.').pop();
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
var videoTypesByExt = {
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
var __extends = (undefined && undefined.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __assign = (undefined && undefined.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};

var StateManager = /** @class */ (function (_super) {
    __extends(StateManager, _super);
    function StateManager(videoEl, options) {
        if (options === void 0) { options = {}; }
        var _this = _super.call(this) || this;
        _this.videoEl = videoEl;
        _this.prevState = VIDEOSTATE.UNKNOWN;
        _this.reportOnInit = true;
        _this.isAlreadyBuffering = false;
        _this.isAlreadySeeking = false;
        _this.defaultEventOps = {};
        _this.bufferingStartTime = 0;
        _this.bufferingEndTime = 0;
        var _a = options.logger, logger = _a === void 0 ? console : _a, _b = options.currentState, currentState = _b === void 0 ? null : _b;
        _this.logger = logger;
        _this.currentState = currentState;
        _this.abortController = new AbortController();
        _this.defaultEventOps = { signal: _this.abortController.signal };
        _this.detectInitialState();
        if (_this.reportOnInit) {
            _this.logger.log(_this.currentState);
        }
        _this.addEventListeners();
        return _this;
    }
    Object.defineProperty(StateManager.prototype, "currentState", {
        get: function () {
            return this._currentState;
        },
        set: function (state) {
            if (this.currentState === state)
                return;
            this._currentState = state;
            var detail = state;
            if (state === VIDEOSTATE.BUFFERING_ENDED) {
                var diff = this.calculateTimingDiff();
                detail = "".concat(detail, " in ").concat(diff, "s");
            }
            this.dispatchEvent(new CustomEvent('changestate', { detail: detail }));
        },
        enumerable: false,
        configurable: true
    });
    StateManager.prototype.detectInitialState = function () {
        //simple initial state detector - should be improved
        var _a = this.videoEl, currentSrc = _a.currentSrc, networkState = _a.networkState, readyState = _a.readyState;
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
    };
    StateManager.prototype.calculateTimingDiff = function () {
        return (this.bufferingEndTime - this.bufferingStartTime) / 1000;
    };
    StateManager.prototype.seeking = function () {
        var _this = this;
        this.videoEl.addEventListener(MediaElementEvent.SEEKING, function () {
            // Workaround when video is ended and user clicked 'play' button
            // so seeking event fires and then playing the video
            if (_this.currentState === VIDEOSTATE.ENDED) {
                _this.prevState = VIDEOSTATE.PLAYING;
            }
            else {
                _this.prevState = _this.currentState;
            }
            _this.isAlreadySeeking = true;
            _this.currentState = VIDEOSTATE.SEEKING;
        }, this.defaultEventOps);
        this.videoEl.addEventListener(MediaElementEvent.SEEKED, function () {
            if (_this.isAlreadySeeking) {
                _this.isAlreadySeeking = false;
                if (_this.currentState === VIDEOSTATE.BUFFERING_STARTED) {
                    _this.isAlreadyBuffering = false;
                    _this.bufferingEndTime = Date.now();
                    _this.currentState = VIDEOSTATE.BUFFERING_ENDED;
                    _this.currentState = _this.prevState;
                }
                else {
                    _this.currentState = _this.prevState;
                }
            }
        }, __assign({}, this.defaultEventOps));
    };
    StateManager.prototype.ended = function () {
        var _this = this;
        this.videoEl.addEventListener(MediaElementEvent.ENDED, function () {
            _this.currentState = VIDEOSTATE.ENDED;
        }, this.defaultEventOps);
    };
    StateManager.prototype.paused = function () {
        var _this = this;
        this.videoEl.addEventListener(MediaElementEvent.PAUSE, function () {
            //do not report PAUSED event when buffering
            if (_this.currentState === VIDEOSTATE.BUFFERING_STARTED)
                return;
            // do not report PAUSED event when seeking
            if (_this.videoEl.seeking === true)
                return;
            // do not report PAUSED event just before ENDED (this is by spec, but we need better UX without polluting console)
            if (_this.videoEl.ended === true)
                return;
            _this.currentState = VIDEOSTATE.PAUSED;
        }, this.defaultEventOps);
    };
    StateManager.prototype.playing = function () {
        var _this = this;
        this.videoEl.addEventListener(MediaElementEvent.PLAYING, function () {
            _this.currentState = VIDEOSTATE.PLAYING;
        }, this.defaultEventOps);
    };
    StateManager.prototype.loadingAndReady = function () {
        var _this = this;
        // LOADING -> READY (when src attr provided in html), works for all except iOS Safari 
        this.videoEl.addEventListener(MediaElementEvent.EMPTIED, function () {
            _this.currentState = VIDEOSTATE.LOADING;
            _this.videoEl.addEventListener(MediaElementEvent.CANPLAY, function () {
                _this.currentState = VIDEOSTATE.READY;
            }, __assign(__assign({}, _this.defaultEventOps), { once: true }));
        }, this.defaultEventOps);
        // LOADING -> READY (when changed src programmatically), works for all except Chrome and iOS Safari 
        this.videoEl.addEventListener(MediaElementEvent.LOADSTART, function () {
            _this.currentState = VIDEOSTATE.LOADING;
            _this.videoEl.addEventListener(MediaElementEvent.CANPLAY, function () {
                _this.currentState = VIDEOSTATE.READY;
            }, __assign(__assign({}, _this.defaultEventOps), { once: true }));
            //ios workaround
            _this.videoEl.addEventListener(MediaElementEvent.SUSPEND, function () {
                _this.videoEl.addEventListener(MediaElementEvent.LOADEDMETADATA, function () {
                    _this.currentState = VIDEOSTATE.READY;
                }, __assign(__assign({}, _this.defaultEventOps), { once: true }));
            }, __assign(__assign({}, _this.defaultEventOps), { once: true }));
        }, this.defaultEventOps);
    };
    StateManager.prototype.buffering = function () {
        var _this = this;
        this.videoEl.addEventListener(MediaElementEvent.WAITING, function () {
            if (_this.isAlreadyBuffering) {
                _this.currentState = VIDEOSTATE.BUFFERING_INTERRUPTED;
                _this.bufferingStartTime = Date.now();
            }
            else {
                _this.isAlreadyBuffering = true;
                _this.bufferingStartTime = Date.now();
            }
            _this.currentState = VIDEOSTATE.BUFFERING_STARTED;
        }, this.defaultEventOps);
        this.videoEl.addEventListener(MediaElementEvent.CANPLAY, function () {
            if (!_this.isAlreadyBuffering)
                return; // react only if there are buffering event
            _this.isAlreadyBuffering = false;
            _this.bufferingEndTime = Date.now();
            _this.currentState = VIDEOSTATE.BUFFERING_ENDED;
        }, __assign({}, this.defaultEventOps));
    };
    StateManager.prototype.addEventListeners = function () {
        this.buffering();
        this.seeking();
        this.playing();
        this.loadingAndReady();
        this.ended();
        this.paused();
    };
    StateManager.prototype.removeEventListeners = function () {
        this.abortController.abort();
    };
    StateManager.prototype.destroy = function () {
        this.removeEventListeners();
    };
    return StateManager;
}(EventTarget));
/* harmony default export */ const statemanager = (StateManager);

;// CONCATENATED MODULE: ./src/components/videoplayer/index.ts


var VideoPlayer = /** @class */ (function () {
    function VideoPlayer(selector, registry, logger) {
        if (registry === void 0) { registry = window.broit.VideoClientRegistry; }
        if (logger === void 0) { logger = console; }
        var _a;
        this.registry = registry;
        this.logger = logger;
        this.videoStateChangesCbs = [];
        this.videoEl = document.querySelector(selector);
        if (((_a = this.videoEl) === null || _a === void 0 ? void 0 : _a.tagName) !== 'VIDEO') {
            this.logger.debug('Wrong video tag');
            return;
        }
        this.stateManager = new statemanager(this.videoEl);
        this.attachEventListeners();
        this.applyWorkarounds();
        if (this.videoEl.currentSrc !== '')
            this.load(this.videoEl.currentSrc);
    }
    VideoPlayer.prototype.applyWorkarounds = function () {
        //ios workaround for autoplay
        this.videoEl.playsInline = true;
    };
    VideoPlayer.prototype.load = function (url) {
        if (!url || this.currentUrl === url)
            return;
        this.currentUrl = url;
        var fileExt = getFileExtensionFromUrl(this.currentUrl);
        this.currentVideoClient = this.registry.findClientByExt(fileExt);
        if (!this.currentVideoClient) {
            this.currentVideoClient = this.registry.getDefaultClient();
            if (!this.currentVideoClient) {
                this.logger.debug('No default video client presented');
                return;
            }
        }
        this.currentVideoClient.init(this.videoEl, url);
    };
    VideoPlayer.prototype.attachEventListeners = function () {
        var _this = this;
        this.stateManager.addEventListener('changestate', function (e) {
            _this.reportStateChanges(e.detail);
        });
    };
    VideoPlayer.prototype.removeEventListeners = function () {
        this.stateManager.removeEventListeners();
    };
    VideoPlayer.prototype.reportStatus = function () {
        this.logger.log(this.stateManager.currentState);
    };
    VideoPlayer.prototype.reportStateChanges = function (state) {
        this.videoStateChangesCbs.forEach(function (cb) { return cb(state); });
    };
    VideoPlayer.prototype.onVideoStateChange = function (cb) {
        this.videoStateChangesCbs.push(cb);
    };
    VideoPlayer.prototype.setVideoClientRegistry = function (registry) {
        this.registry = registry;
    };
    VideoPlayer.prototype.destroy = function () {
        this.removeEventListeners();
        this.videoStateChangesCbs = [];
    };
    return VideoPlayer;
}());
/* harmony default export */ const videoplayer = (VideoPlayer);

;// CONCATENATED MODULE: ./src/components/clientsregistry/index.ts

var VideoClientRegistry = /** @class */ (function () {
    function VideoClientRegistry() {
        this.registeredClients = new Set();
    }
    VideoClientRegistry.prototype.register = function (client) {
        if (client.isDefault()) {
            if (this.defaultClient) {
                debug('Default client is already registered');
                return;
            }
            this.defaultClient = client;
        }
        this.registeredClients.add(client);
        return this;
    };
    VideoClientRegistry.prototype.unregister = function (client) {
        this.defaultClient = null;
        this.registeredClients.delete(client);
        return this;
    };
    VideoClientRegistry.prototype.getDefaultClient = function () {
        return this.defaultClient;
    };
    VideoClientRegistry.prototype.findClientByExt = function (ext) {
        var foundClient;
        try {
            this.registeredClients.forEach(function (client) {
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
    };
    VideoClientRegistry.prototype.destroy = function () {
        this.registeredClients = null;
        this.defaultClient = null;
    };
    return VideoClientRegistry;
}());
/* harmony default export */ const clientsregistry = (VideoClientRegistry);

;// CONCATENATED MODULE: ./src/components/clientsregistry/videoclient.ts
var VideoClient = /** @class */ (function () {
    function VideoClient(logger) {
        if (logger === void 0) { logger = console; }
        this.registeredFileExtensions = [];
        this.autoplay = true;
        this.default = false;
        this.logger = logger;
    }
    VideoClient.prototype.play = function () {
        var _this = this;
        try {
            var promise = this.videoEl.play();
            if (promise !== undefined) {
                promise.then(function () {
                    // Autoplay started!
                }).catch(function () {
                    // Autoplay not allowed!
                    // Mute video and try to play again
                    _this.videoEl.muted = true;
                    _this.videoEl.play();
                });
            }
        }
        catch (e) {
            this.logger.debug(e);
        }
    };
    VideoClient.prototype.isDefault = function () {
        return this.default;
    };
    VideoClient.prototype.init = function (video, url) {
        this.videoEl = video;
        this.currentUrl = url;
    };
    VideoClient.prototype.supports = function (ext) {
        return this.registeredFileExtensions.some(function (e) { return e === ext; });
    };
    VideoClient.prototype.destroy = function () {
        this.client = null;
        this.videoEl = null;
        this.currentUrl = null;
    };
    return VideoClient;
}());


;// CONCATENATED MODULE: ./src/components/clientsregistry/clients/dash.ts
var dash_extends = (undefined && undefined.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var dashjs = window.dashjs;

var DashClient = /** @class */ (function (_super) {
    dash_extends(DashClient, _super);
    function DashClient() {
        var _this = _super.call(this) || this;
        _this.registeredFileExtensions = ['mpd'];
        return _this;
    }
    DashClient.prototype.init = function (video, url) {
        _super.prototype.init.call(this, video, url);
        this.client = dashjs.MediaPlayer().create();
        this.client.initialize(this.videoEl, this.currentUrl, this.autoplay);
        this.client.updateSettings({ 'debug': { 'logLevel': 0 } });
        this.setupEventListeners();
        if (this.autoplay)
            this.play();
    };
    DashClient.prototype.setupEventListeners = function () {
        var _this = this;
        this.client.on(dashjs.MediaPlayer.events['STREAM_INITIALIZED'], function () {
            _this.client.setTextTrack(-1); //turn off captions by default
        });
    };
    DashClient.prototype.destroy = function () {
        var _a;
        (_a = this.client) === null || _a === void 0 ? void 0 : _a.reset();
    };
    return DashClient;
}(VideoClient));
/* harmony default export */ const dash = (DashClient);

;// CONCATENATED MODULE: ./src/components/clientsregistry/clients/hls.ts
var hls_extends = (undefined && undefined.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var Hls = window.Hls;

var HlsClient = /** @class */ (function (_super) {
    hls_extends(HlsClient, _super);
    function HlsClient() {
        var _this = _super.call(this) || this;
        _this.registeredFileExtensions = ['m3u8'];
        return _this;
    }
    HlsClient.prototype.init = function (video, url) {
        var _this = this;
        _super.prototype.init.call(this, video, url);
        if (this.videoEl.canPlayType('application/vnd.apple.mpegurl')) {
            this.videoEl.src = this.currentUrl;
            this.autoplay === true && this.videoEl.addEventListener('loadedmetadata', function () {
                _this.play();
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
            this.autoplay === true && this.client.once(Hls.Events.MANIFEST_PARSED, function () {
                _this.play();
            });
            if (this.autoplay)
                this.play();
        }
        else {
            this.logger.debug('Error initializing HLS support');
        }
    };
    HlsClient.prototype.destroy = function () {
        this.client.destroy();
    };
    return HlsClient;
}(VideoClient));
/* harmony default export */ const hls = (HlsClient);

;// CONCATENATED MODULE: ./src/components/clientsregistry/clients/mp4.ts
var mp4_extends = (undefined && undefined.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();

var Mp4Client = /** @class */ (function (_super) {
    mp4_extends(Mp4Client, _super);
    function Mp4Client() {
        var _this = _super.call(this) || this;
        _this.registeredFileExtensions = ['mp4'];
        _this.default = true;
        return _this;
    }
    Mp4Client.prototype.init = function (video, url) {
        _super.prototype.init.call(this, video, url);
        this.videoEl.src = url;
        if (this.autoplay)
            this.play();
    };
    return Mp4Client;
}(VideoClient));
/* harmony default export */ const mp4 = (Mp4Client);

;// CONCATENATED MODULE: ./src/components/clientsregistry/clients/index.ts





;// CONCATENATED MODULE: ./src/playlist.json
const src_playlist_namespaceObject = JSON.parse('[{"title":"Angel One","url":"https://storage.googleapis.com/shaka-demo-assets/angel-one/dash.mpd"},{"title":"Big Buck Bunny: Dark Truths","url":"https://storage.googleapis.com/shaka-demo-assets/bbb-dark-truths-hls/hls.m3u8"},{"title":"Sintel","url":"https://media.w3.org/2010/05/sintel/trailer.mp4"}]');
;// CONCATENATED MODULE: ./src/index.ts






var registry = new clientsregistry()
    .register(new hls())
    .register(new dash())
    .register(new mp4());
var src_playlist = new playlist(src_playlist_namespaceObject); //in real world, playlist usually will be fetched remotely
// as per task, we need VideoPlayer to be constructed with selector and has the load method.
// unfortunately, I had to add one more global dependency to track video client libraries
// but this can be changed
window.broit = {
    Playlist: src_playlist,
    VideoPlayer: videoplayer,
    VideoClientRegistry: registry,
};

/******/ })()
;