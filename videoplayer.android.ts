
import * as common from "./videoplayer-common";
import * as videoSource from "./video-source/video-source";
import * as utils from "tns-core-modules/utils/utils";
import * as timer from "tns-core-modules/timer";

export * from "./videoplayer-common";

declare const android: any, java: any;

const STATE_IDLE: number = 0;
const STATE_PLAYING: number = 1;
const STATE_PAUSED: number = 2;
const SURFACE_WAITING: number = 0;
const SURFACE_READY: number = 1;

export class Video extends common.Video {
  private _textureView: any; /// android.widget.VideoView
  public nativeView: any; /// android.widget.VideoView
  private videoWidth;
  private videoHeight;
  private _src;
  private _headers: java.util.Map<string, string>;
  private playState;
  private mediaState;
  private textureSurface;
  private mediaPlayer;
  private audioSession;
  private mediaController;
  private preSeekTime;
  private currentBufferPercentage;
  private _playbackTimeObserver;
  private _playbackTimeObserverActive: boolean;

  constructor() {
    super();
    this.nativeView = null;
    this.videoWidth = 0;
    this.videoHeight = 0;

    this._src = null;
    this._headers = null;

    this.playState = STATE_IDLE;
    this.mediaState = SURFACE_WAITING;
    this.textureSurface = null;
    this.mediaPlayer = null;
    this.audioSession = null;
    this.mediaController = null;
    this.preSeekTime = -1;
    this.currentBufferPercentage = 0;
  }

  get android(): any {
    return this.nativeView;
  }

  [common.headersProperty.setNative](value) {
    this._setHeader(value ? value : null);
  }

  [common.videoSourceProperty.setNative](value) {
    this._setNativeVideo(value ? value.android : null);
  }

  public createNativeView(): any {
    let that = new WeakRef(this);

    this.nativeView = new android.view.TextureView(this._context);
    this.nativeView.setFocusable(true);
    this.nativeView.setFocusableInTouchMode(true);
    this.nativeView.requestFocus();
    this.nativeView.setOnTouchListener(
      new android.view.View.OnTouchListener({
        get owner(): Video {
          return that.get();
        },
        onTouch: function(/* view, event */) {
          this.owner.toggleMediaControllerVisibility();
          return false;
        }
      })
    );

    this.nativeView.setSurfaceTextureListener(
      new android.view.TextureView.SurfaceTextureListener({
        get owner(): Video {
          return that.get();
        },
        onSurfaceTextureSizeChanged: function(surface, width, height) {
          console.log("SurfaceTexutureSizeChange", width, height);
          // do nothing
        },

        onSurfaceTextureAvailable: function(surface /*, width, height */) {
          this.owner.textureSurface = new android.view.Surface(surface);
          this.owner.mediaState = SURFACE_WAITING;
          this.owner._openVideo();
        },

        onSurfaceTextureDestroyed: function(/* surface */) {
          // after we return from this we can't use the surface any more
          if (this.owner.textureSurface !== null) {
            this.owner.textureSurface.release();
            this.owner.textureSurface = null;
          }
          if (this.owner.mediaController !== null) {
            this.owner.mediaController.hide();
          }
          this.owner.release();

          return true;
        },

        onSurfaceTextureUpdated: function(/* surface */) {
          // do nothing
        }
      })
    );

    return this.nativeView;
  }

  public toggleMediaControllerVisibility(): void {
    if (!this.mediaController) {
      return;
    }
    if (this.mediaController.isShowing()) {
      this.mediaController.hide();
    } else {
      this.mediaController.show();
    }
  }

  private _setupMediaPlayerListeners(): void {
    let that = new WeakRef(this);
    this.mediaPlayer.setOnPreparedListener(
      new android.media.MediaPlayer.OnPreparedListener({
        get owner(): Video {
          return that.get();
        },
        onPrepared: function(mp) {
          if (this.owner) {
            if (this.owner.muted === true) {
              mp.setVolume(0, 0);
            }

            if (this.owner.mediaController != null) {
              this.owner.mediaController.setEnabled(true);
            }

            if (this.owner.preSeekTime > 0) {
              mp.seekTo(this.owner.preSeekTime);
            }
            this.owner.preSeekTime = -1;

            this.owner.videoWidth = mp.getVideoWidth();
            this.owner.videoHeight = mp.getVideoHeight();

            this.owner.mediaState = SURFACE_READY;

            if (this.owner.fill !== true) {
              this.owner._setupAspectRatio();
            }

            if (this.owner.videoWidth !== 0 && this.owner.videoHeight !== 0) {
              this.owner.nativeView
                .getSurfaceTexture()
                .setDefaultBufferSize(
                  this.owner.videoWidth,
                  this.owner.videoHeight
                );
            }

            if (
              this.owner.autoplay === true ||
              this.owner.playState === STATE_PLAYING
            ) {
              this.owner.play();
            }

            this.owner._emit(common.Video.playbackReadyEvent);
            if (this.owner.loop === true) {
              mp.setLooping(true);
            }
          }
        }
      })
    );

    this.mediaPlayer.setOnSeekCompleteListener(
      new android.media.MediaPlayer.OnSeekCompleteListener({
        get owner(): Video {
          return that.get();
        },
        onSeekComplete: function(/* mediaPlayer */) {
          if (this.owner) {
            this.owner._emit(common.Video.seekToTimeCompleteEvent);
          }
        }
      })
    );

    this.mediaPlayer.setOnVideoSizeChangedListener(
      new android.media.MediaPlayer.OnVideoSizeChangedListener({
        get owner(): Video {
          return that.get();
        },
        onVideoSizeChanged: function(mediaPlayer /*, width, height */) {
          if (this.owner) {
            this.owner.videoWidth = mediaPlayer.getVideoWidth();
            this.owner.videoHeight = mediaPlayer.getVideoHeight();
            if (this.owner.videoWidth !== 0 && this.owner.videoHeight !== 0) {
              this.owner.nativeView
                .getSurfaceTexture()
                .setDefaultBufferSize(
                  this.owner.videoWidth,
                  this.owner.videoHeight
                );
              if (this.owner.fill !== true) {
                this.owner._setupAspectRatio();
              }
            }
          }
        }
      })
    );

    this.mediaPlayer.setOnCompletionListener(
      new android.media.MediaPlayer.OnCompletionListener({
        get owner(): Video {
          return that.get();
        },
        onCompletion: function(/* mp */) {
          if (this.owner) {
            this.owner._removePlaybackTimeObserver();
            this.owner._emit(common.Video.finishedEvent);
          }
        }
      })
    );

    this.mediaPlayer.setOnBufferingUpdateListener(
      new android.media.MediaPlayer.OnBufferingUpdateListener({
        get owner(): Video {
          return that.get();
        },
        onBufferingUpdate: function(mediaPlayer, percent) {
          this.owner.currentBufferPercentage = percent;
        }
      })
    );
    this.currentBufferPercentage = 0;
  }

  private _setupMediaController(): void {
    let that = new WeakRef(this);
    if (this.controls !== false || this.controls === undefined) {
      if (this.mediaController == null) {
        this.mediaController = new android.widget.MediaController(
          this._context
        );
      } else {
        // Already setup
        return;
      }
      let mediaPlayerControl = new android.widget.MediaController
        .MediaPlayerControl({
        get owner(): Video {
          return that.get();
        },
        canPause: function() {
          return true;
        },
        canSeekBackward: function() {
          return true;
        },
        canSeekForward: function() {
          return true;
        },
        getAudioSessionId: function() {
          return this.owner.audioSession;
        },
        getBufferPercentage: function() {
          return this.owner.currentBufferPercentage;
        },
        getCurrentPosition: function() {
          return this.owner.getCurrentTime();
        },
        getDuration: function() {
          return this.owner.getDuration();
        },
        isPlaying: function() {
          return this.owner.isPlaying();
        },
        pause: function() {
          this.owner.pause();
        },
        seekTo: function(v) {
          this.owner.seekToTime(v);
        },
        start: function() {
          this.owner.play();
        }
      });

      this.mediaController.setMediaPlayer(mediaPlayerControl);
      this.mediaController.setAnchorView(this.nativeView);
      this.mediaController.setEnabled(true);
    }
  }

  private _setupAspectRatio(): void {
    /* console.log("!!!!Sizes are", this. videoHeight, "x", this. videoWidth);
         console.log("!!!!CSizes are", this.height, "x", this.width);
         console.dump(this._getCurrentLayoutBounds()); */

    let viewWidth = this.nativeView.getWidth();
    let viewHeight = this.nativeView.getHeight();
    let aspectRatio = this.videoHeight / this.videoWidth;
    // console.log("W/H", viewHeight, "x", viewWidth, "x", aspectRatio);

    let newWidth;
    let newHeight;
    if (viewHeight > viewWidth * aspectRatio) {
      // limited by narrow width; restrict height
      newWidth = viewWidth;
      newHeight = viewWidth * aspectRatio;
    } else {
      // limited by short height; restrict width
      newWidth = viewHeight / aspectRatio;
      newHeight = viewHeight;
    }

    let xoff = (viewWidth - newWidth) / 2;
    let yoff = (viewHeight - newHeight) / 2;

    let txform = new android.graphics.Matrix();
    this.nativeView.getTransform(txform);
    txform.setScale(newWidth / viewWidth, newHeight / viewHeight);
    txform.postTranslate(xoff, yoff);
    this.nativeView.setTransform(txform);
  }

  private _openVideo(): void {
    if (
      this._src === null ||
      this.textureSurface === null ||
      (this._src !== null &&
        typeof this._src === "string" &&
        this._src.length === 0)
    ) {
      // we have to protect In case something else calls this before we are ready
      // the Surface event will then call this when we are ready...
      return;
    }
    console.log("Openvideo", this._src);

    // clear any old stuff
    this.release();

    let am = utils.ad
      .getApplicationContext()
      .getSystemService(android.content.Context.AUDIO_SERVICE);
    am.requestAudioFocus(
      null,
      android.media.AudioManager.STREAM_MUSIC,
      android.media.AudioManager.AUDIOFOCUS_GAIN
    );

    try {
      this.mediaPlayer = new android.media.MediaPlayer();

      if (this.audioSession !== null) {
        this.mediaPlayer.setAudioSessionId(this.audioSession);
      } else {
        this.audioSession = this.mediaPlayer.getAudioSessionId();
      }

      this._setupMediaPlayerListeners();

      if (!this._headers || this._headers.size() === 0) {
        this.mediaPlayer.setDataSource(
          /* utils.ad.getApplicationContext(),*/ this._src
        );
      } else {
        let videoUri = android.net.Uri.parse(this._src);
        this.mediaPlayer.setDataSource(
          utils.ad.getApplicationContext(),
          videoUri,
          this._headers
        );
      }
      this.mediaPlayer.setSurface(this.textureSurface);
      this.mediaPlayer.setAudioStreamType(
        android.media.AudioManager.STREAM_MUSIC
      );
      this.mediaPlayer.setScreenOnWhilePlaying(true);
      this.mediaPlayer.prepareAsync();

      this._setupMediaController();
    } catch (ex) {
      console.log("Error:", ex, ex.stack);
    }
}
	
	private _setPlaybackParams(playbackParams: android.media.PlaybackParams): void {
		this.mediaPlayer.setPlaybackParams(playbackParams);
	}
	
	public setPlaybackSpeed(speedMultiplier: number): void{
        let playbackParams = this.mediaPlayer.getPlaybackParams();
        playbackParams = playbackParams.setSpeed(speedMultiplier);
		this._setPlaybackParams(playbackParams);
	}

  public _setNativeVideo(nativeVideo: any): void {
    this._src = nativeVideo;
    this._openVideo();
  }

  public _setHeader(headers: Map<string, string>): void {
    if (headers && headers.size > 0) {
      this._headers = new java.util.HashMap();
      headers.forEach((value: string, key: string) => {
        this._headers.put(key, value);
      });
    }
    if (this._src) {
      this._openVideo();
    }
  }

	private _setPlaybackParams(playbackParams: android.media.PlaybackParams): void {
		this.mediaPlayer.setPlaybackParams(playbackParams);
	}
	
	public setPlaybackSpeed(speedMultiplier: number): void{
		this._setPlaybackParams(this.mediaPlayer.getPlaybackParams().setSpeed(speedMultiplier));
	}

  public setNativeSource(nativePlayerSrc: string): void {
    this._src = nativePlayerSrc;
    this._openVideo();
  }

  public play(): void {
    this.playState = STATE_PLAYING;
    if (this.mediaState === SURFACE_WAITING) {
      this._openVideo();
    } else {
      if (this.observeCurrentTime && !this._playbackTimeObserverActive) {
        this._addPlaybackTimeObserver();
      }
      this.mediaPlayer.start();
    }
  }

  public pause(): void {
    this.playState = STATE_PAUSED;
    this.mediaPlayer.pause();
    this._removePlaybackTimeObserver();
  }

  public mute(mute: boolean): void {
    if (this.mediaPlayer) {
      if (mute === true) {
        this.mediaPlayer.setVolume(0, 0);
      } else if (mute === false) {
        this.mediaPlayer.setVolume(1, 1);
      }
    }
  }

  public stop(): void {
    this.mediaPlayer.stop();
    this._removePlaybackTimeObserver();
    this.playState = STATE_IDLE;
    this.release();
  }

  public seekToTime(ms: number): void {
    if (!this.mediaPlayer) {
      this.preSeekTime = ms;
      return;
    } else {
      this.preSeekTime = -1;
    }
    this.mediaPlayer.seekTo(ms);
  }

  public isPlaying(): boolean {
    if (!this.mediaPlayer) {
      return false;
    }
    return this.mediaPlayer.isPlaying();
  }

  public getDuration(): number {
    if (
      !this.mediaPlayer ||
      this.mediaState === SURFACE_WAITING ||
      this.playState === STATE_IDLE
    ) {
      return 0;
    }
    return this.mediaPlayer.getDuration();
  }

  public getCurrentTime(): number {
    if (!this.mediaPlayer) {
      return 0;
    }
    return this.mediaPlayer.getCurrentPosition();
  }

  public setVolume(volume: number) {
    this.mediaPlayer.setVolume(volume, volume);
  }

  public destroy() {
    this.release();
    this.src = null;
    this.nativeView = null;
    this.mediaPlayer = null;
    this.mediaController = null;
  }

  private release(): void {
    if (this.mediaPlayer !== null) {
      this.mediaState = SURFACE_WAITING;
      this.mediaPlayer.reset();
      this.mediaPlayer.release();
      this.mediaPlayer = null;
      if (this._playbackTimeObserverActive) {
        this._removePlaybackTimeObserver();
      }
      let am = utils.ad
        .getApplicationContext()
        .getSystemService(android.content.Context.AUDIO_SERVICE);
      am.abandonAudioFocus(null);
    }
  }

  public suspendEvent(): void {
    this.release();
  }

  public resumeEvent(): void {
    this._openVideo();
  }

  private _addPlaybackTimeObserver() {
    this._playbackTimeObserverActive = true;
    this._playbackTimeObserver = timer.setInterval(() => {
      if (this.mediaPlayer.isPlaying) {
        let _milliseconds = this.mediaPlayer.getCurrentPosition();
        this.notify({
          eventName: common.Video.currentTimeUpdatedEvent,
          object: this,
          position: _milliseconds
        });
      }
    }, 500);
  }

  private _removePlaybackTimeObserver() {
    if (this._playbackTimeObserverActive) {
      // one last emit of the most up-to-date time index
      if (this.mediaPlayer !== null) {
        let _milliseconds = this.mediaPlayer.getCurrentPosition();
        this._emit(common.Video.currentTimeUpdatedEvent);
      }

      timer.clearInterval(this._playbackTimeObserver);
      this._playbackTimeObserverActive = false;
    }
  }
}
