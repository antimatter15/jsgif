// Color Cycling in HTML5 Canvas
// BlendShift Technology conceived, designed and coded by Joseph Huckaby
// Copyright (c) 2001-2002, 2010 Joseph Huckaby.
// Released under the LGPL v3.0: http://www.opensource.org/licenses/lgpl-3.0.html

var encoder = new GIFEncoder();
  encoder.setRepeat(0); //auto-loop
  encoder.setDelay(1000/40);
  encoder.start();

FrameCount.visible = false;

var CanvasCycle = {
	
	cookie: new CookieTree(),
	ctx: null,
	imageData: null,
	clock: 0,
	inGame: false,
	bmp: null,
	globalTimeStart: (new Date()).getTime(),
	inited: false,
	optTween: null,
	winSize: null,
	globalBrightness: 1.0,
	lastBrightness: 0,
	sceneIdx: -1,
	highlightColor: -1,
	defaultMaxVolume: 0.5,
	
	settings: {
		showOptions: false,
		targetFPS: 60,
		zoomFull: false,
		blendShiftEnabled: true,
		speedAdjust: 1.0,
		sound: true
	},

	contentSize: {
		width: 640,
		optionsWidth: 0,
		height: 480 + 40,
		scale: 1.0
	},

	init: function() {
		// called when DOM is ready
		if (!this.inited) {
			this.inited = true;
			$('container').style.display = 'block';
			$('d_options').style.display = 'none';
		
			FrameCount.init();
			this.handleResize();
		
			var pal_disp = $('palette_display');
			for (var idx = 0, len = 256; idx < len; idx++) {
				var div = document.createElement('div');
				div._idx = idx;
				div.id = 'pal_' + idx;
				div.className = 'palette_color';
				div.onmouseover = function() { CanvasCycle.highlightColor = this._idx; };
				div.onmouseout = function() { CanvasCycle.highlightColor = -1; };
				pal_disp.appendChild( div );
			}
			var div = document.createElement('div');
			div.className = 'clear';
			pal_disp.appendChild( div );
		
			// pick starting scene
			// var initialSceneIdx = Math.floor( Math.random() * scenes.length );
			var initialSceneIdx = 0;
			
			// populate scene menu
			var html = '';
			html += '<select id="fe_scene" onChange="CanvasCycle.switchScene(this)">';
			for (var idx = 0, len = scenes.length; idx < len; idx++) {
				var scene = scenes[idx];
				html += '<option value="'+scene.name+'" '+((idx == initialSceneIdx) ? ' selected="selected"' : '')+'>'+scene.title+'</option>';
			}
			html += '</select>';
			$('d_scene_selector').innerHTML = html;
			
			// read prefs from cookie
			var prefs = this.cookie.get('settings');
			if (prefs) {
				if (prefs.showOptions) this.toggleOptions();
				this.setRate( prefs.targetFPS );
				this.setZoom( prefs.zoomFull );
				this.setSpeed( prefs.speedAdjust );
				this.setBlendShift( prefs.blendShiftEnabled );
				this.setSound( prefs.sound );
			}
			
			// allow query to control sound
			if (location.href.match(/\bsound\=(\d+)/)) {
				this.setSound( !!parseInt(RegExp.$1, 10) );
			}
		
			this.loadImage( scenes[initialSceneIdx].name );
			this.sceneIdx = initialSceneIdx;
		}
	},

	jumpScene: function(dir) {
		// next or prev scene
		this.sceneIdx += dir;
		if (this.sceneIdx >= scenes.length) this.sceneIdx = 0;
		else if (this.sceneIdx < 0) this.sceneIdx = scenes.length - 1;
		$('fe_scene').selectedIndex = this.sceneIdx;
		this.switchScene( $('fe_scene') );
	},

	switchScene: function(menu) {
		// switch to new scene (grab menu selection)
		this.stopSceneAudio();
		
		var name = menu.options[menu.selectedIndex].value;
		this.sceneIdx = menu.selectedIndex;
		
		if (ua.mobile) {
			// no transitions on mobile devices, just switch as fast as possible
			this.inGame = false;
			
			this.ctx.clearRect(0, 0, this.bmp.width, this.bmp.height);
			this.ctx.fillStyle = "rgb(0,0,0)";
			this.ctx.fillRect (0, 0, this.bmp.width, this.bmp.height);
			
			CanvasCycle.globalBrightness = 1.0;
			CanvasCycle.loadImage( name );
		}
		else {
			TweenManager.removeAll({ category: 'scenefade' });
			TweenManager.tween({
				target: { value: this.globalBrightness, newSceneName: name },
				duration: Math.floor( this.settings.targetFPS / 2 ),
				mode: 'EaseInOut',
				algo: 'Quadratic',
				props: { value: 0.0 },
				onTweenUpdate: function(tween) {
					CanvasCycle.globalBrightness = tween.target.value;
				},
				onTweenComplete: function(tween) {
					CanvasCycle.loadImage( tween.target.newSceneName );
				},
				category: 'scenefade'
			});
		}
	},

	loadImage: function(name) {
		// load image JSON from the server
		var loading = $('d_loading');
		loading.style.left = '' + Math.floor( ((this.contentSize.width * this.contentSize.scale) / 2) - 16 ) + 'px';
		loading.style.top = '' + Math.floor( ((this.contentSize.height * this.contentSize.scale) / 2) - 16 ) + 'px';
		loading.show();
		
		var url = 'image.php?file='+name+'&callback=CanvasCycle.processImage';
		var scr = document.createElement('SCRIPT');
		scr.type = 'text/javascript';
		scr.src = url;
		document.getElementsByTagName('HEAD')[0].appendChild(scr);
	},

	processImage: function(img) {
		// initialize, receive image data from server
		$('d_loading').hide();
		
		this.bmp = new Bitmap(img);
		this.bmp.optimize();
	
		// $('d_debug').innerHTML = img.filename;
		
		var canvas = $('mycanvas');
		if (!canvas.getContext) return; // no canvas support
	
		if (!this.ctx) this.ctx = canvas.getContext('2d');
		this.ctx.clearRect(0, 0, this.bmp.width, this.bmp.height);
		this.ctx.fillStyle = "rgb(0,0,0)";
		this.ctx.fillRect (0, 0, this.bmp.width, this.bmp.height);
	
		if (!this.imageData) {
			if (this.ctx.createImageData) {
				this.imageData = this.ctx.createImageData( this.bmp.width, this.bmp.height );
			}
			else if (this.ctx.getImageData) {
				this.imageData = this.ctx.getImageData( 0, 0, this.bmp.width, this.bmp.height );
			}
			else return; // no canvas data support
		}
		
		if (ua.mobile) {
			// no transition on mobile devices
			this.globalBrightness = 1.0;
		}
		else {
			this.globalBrightness = 0.0;
			TweenManager.removeAll({ category: 'scenefade' });
			TweenManager.tween({
				target: { value: 0 },
				duration: Math.floor( this.settings.targetFPS / 2 ),
				mode: 'EaseInOut',
				algo: 'Quadratic',
				props: { value: 1.0 },
				onTweenUpdate: function(tween) {
					CanvasCycle.globalBrightness = tween.target.value;
				},
				category: 'scenefade'
			});
		}
	
		if (!this.inGame) {
			this.inGame = true;
			this.animate();
		}
		
		this.startSceneAudio();
	},

	animate: function() {
		// animate one frame. and schedule next
		if (this.inGame) {
			var colors = this.bmp.palette.colors;
	
			if (this.settings.showOptions) {
				for (var idx = 0, len = colors.length; idx < len; idx++) {
					var clr = colors[idx];
					var div = $('pal_'+idx);
					div.style.backgroundColor = 'rgb(' + clr.red + ',' + clr.green + ',' + clr.blue + ')';
				}
		
				if (this.clock % this.settings.targetFPS == 0) $('d_debug').innerHTML = 'FPS: ' + FrameCount.current;
			}
	
			this.bmp.palette.cycle( this.bmp.palette.baseColors, GetTickCount(), this.settings.speedAdjust, this.settings.blendShiftEnabled );
			if (this.highlightColor > -1) {
				this.bmp.palette.colors[ this.highlightColor ] = new Color(255, 255, 255);
			}
			if (this.globalBrightness < 1.0) {
				// bmp.palette.fadeToColor( pureBlack, 1.0 - globalBrightness, 1.0 );
				this.bmp.palette.burnOut( 1.0 - this.globalBrightness, 1.0 );
			}
			this.bmp.render( this.imageData, (this.lastBrightness == this.globalBrightness) && (this.highlightColor == this.lastHighlightColor) );
			this.lastBrightness = this.globalBrightness;
			this.lastHighlightColor = this.highlightColor;
	
			this.ctx.putImageData( this.imageData, 0, 0 );
	  
			TweenManager.logic( this.clock );
			this.clock++;
			FrameCount.count();
			//this.scaleAnimate();
			
			
			if(this.clock > 100 && this.clock < 110){
			  encoder.addFrame(this.ctx);
			  console.log('added frame');
			}
			
			
			if (this.inGame) setTimeout( function() { CanvasCycle.animate(); }, 1000 / this.settings.targetFPS );
		}
	},

	scaleAnimate: function() {
		// handle scaling image up or down
		if (this.settings.zoomFull) {
			// scale up to full size
			var totalNativeWidth = this.contentSize.width + this.contentSize.optionsWidth;
			var maxScaleX = (this.winSize.width - 30) / totalNativeWidth;
		
			var totalNativeHeight = this.contentSize.height;
			var maxScaleY = (this.winSize.height - 30) / totalNativeHeight;
		
			var maxScale = Math.min( maxScaleX, maxScaleY );
		
			if (this.contentSize.scale != maxScale) {
				this.contentSize.scale += ((maxScale - this.contentSize.scale) / 8);
				if (Math.abs(this.contentSize.scale - maxScale) < 0.001) this.contentSize.scale = maxScale; // close enough
			
				var sty = $('mycanvas').style; 
			
				if (ua.webkit) sty.webkitTransform = 'translate3d(0px, 0px, 0px) scale('+this.contentSize.scale+')';
				else if (ua.ff) sty.MozTransform = 'scale('+this.contentSize.scale+')';
				else if (ua.op) sty.OTransform = 'scale('+this.contentSize.scale+')';
				else sty.transform = 'scale('+this.contentSize.scale+')';
				
				sty.marginRight = '' + Math.floor( (this.contentSize.width * this.contentSize.scale) - this.contentSize.width ) + 'px';
				$('d_header').style.width = '' + Math.floor(this.contentSize.width * this.contentSize.scale) + 'px';
				this.repositionContainer();
			}
		}
		else {
			// scale back down to native
			if (this.contentSize.scale > 1.0) {
				this.contentSize.scale += ((1.0 - this.contentSize.scale) / 8);
				if (this.contentSize.scale < 1.001) this.contentSize.scale = 1.0; // close enough
			
				var sty = $('mycanvas').style; 
			
				if (ua.webkit) sty.webkitTransform = 'translate3d(0px, 0px, 0px) scale('+this.contentSize.scale+')';
				else if (ua.ff) sty.MozTransform = 'scale('+this.contentSize.scale+')';
				else if (ua.op) sty.OTransform = 'scale('+this.contentSize.scale+')';
				else sty.transform = 'scale('+this.contentSize.scale+')';
				
				sty.marginRight = '' + Math.floor( (this.contentSize.width * this.contentSize.scale) - this.contentSize.width ) + 'px';
				$('d_header').style.width = '' + Math.floor(this.contentSize.width * this.contentSize.scale) + 'px';
				this.repositionContainer();
			}
		}
	},
	
	repositionContainer: function() {
		// reposition container element based on inner window size
		var div = $('container');
		if (div) {
			this.winSize = getInnerWindowSize();
			div.style.left = '' + Math.floor((this.winSize.width / 2) - (((this.contentSize.width * this.contentSize.scale) + this.contentSize.optionsWidth) / 2)) + 'px';
			div.style.top = '' + Math.floor((this.winSize.height / 2) - ((this.contentSize.height * this.contentSize.scale) / 2)) + 'px';			
		}
	},

	handleResize: function() {
		// called when window resizes
		this.repositionContainer();
		if (this.settings.zoomFull) this.scaleAnimate();
	},
	
	saveSettings: function() {
		// save settings in cookie
		this.cookie.set( 'settings', this.settings );
		this.cookie.save();
	},
	
	startSceneAudio: function() {
		// start audio for current scene, if applicable
		var scene = scenes[ this.sceneIdx ];
		if (scene.sound && this.settings.sound && window.Audio) {
			if (this.audioTrack) {
				try { this.audioTrack.pause(); } catch(e) {;}
			}
			TweenManager.removeAll({ category: 'audio' });
			
			var ext = (ua.ff || ua.op) ? 'ogg' : 'mp3';
			var track = this.audioTrack = new Audio( 'audio/' + scene.sound + '.' + ext );
			track.volume = 0;
			track.loop = true;
			track.autobuffer = false;
			track.autoplay = true;
			
			track.addEventListener('canplaythrough', function() {
				track.play();
				TweenManager.tween({
					target: track,
					duration: Math.floor( CanvasCycle.settings.targetFPS * 2 ),
					mode: 'EaseOut',
					algo: 'Linear',
					props: { volume: scene.maxVolume || CanvasCycle.defaultMaxVolume },
					category: 'audio'
				});
			}, false);
			
			if (ua.iphone || ua.ipad) {
				// these may support audio, but just don't invoke events
				// try to force it
				setTimeout( function() { track.play(); track.volume = 1.0; }, 1000 );
			}
			
			if (ua.ff || ua.mobile) {
				// loop doesn't seem to work on FF or mobile devices, so let's force it
				track.addEventListener('ended', function() {
					track.currentTime = 0;
					track.play();
				}, false);
			}
			
			track.load();
		} // sound enabled and supported
	},
	
	stopSceneAudio: function() {
		// fade out and stop audio for current scene
		var scene = scenes[ this.sceneIdx ];
		if (scene.sound && this.settings.sound && window.Audio && this.audioTrack) {
			var track = this.audioTrack;
			
			if (ua.iphone || ua.ipad) {
				// no transition here, so just stop sound
				track.pause();
			}
			else {
				TweenManager.removeAll({ category: 'audio' });
				TweenManager.tween({
					target: track,
					duration: Math.floor( CanvasCycle.settings.targetFPS / 2 ),
					mode: 'EaseOut',
					algo: 'Linear',
					props: { volume: 0 },
					onTweenComplete: function(tween) {
						track.pause();
					},
					category: 'audio'
				});
			}
		}
	},

	toggleOptions: function() {
		var startValue, endValue;
		TweenManager.removeAll({ category: 'options' });
	
		if (!this.settings.showOptions) {
			startValue = 0;
			if (this.optTween) startValue = this.optTween.target.value;
			endValue = 1.0;
			$('d_options').style.display = '';
			$('d_options').style.opacity = startValue;
			$('btn_options_toggle').innerHTML = '&#x00AB; Hide Options';
		}
		else {
			startValue = 1.0;
			if (this.optTween) startValue = this.optTween.target.value;
			endValue = 0;
			$('btn_options_toggle').innerHTML = 'Show Options &#x00BB;';
		}
	
		this.optTween = TweenManager.tween({
			target: { value: startValue },
			duration: Math.floor( this.settings.targetFPS / 3 ),
			mode: 'EaseOut',
			algo: 'Quadratic',
			props: { value: endValue },
			onTweenUpdate: function(tween) {
				// $('d_options').style.left = '' + Math.floor(tween.target.value - 150) + 'px';
				$('d_options').style.opacity = tween.target.value;
				$('btn_options_toggle').style.left = '' + Math.floor(tween.target.value * 128) + 'px';
			
				CanvasCycle.contentSize.optionsWidth = Math.floor( tween.target.value * 150 );
				CanvasCycle.handleResize();
			},
			onTweenComplete: function(tween) {
				if (tween.target.value == 0) $('d_options').style.display = 'none';
				CanvasCycle.optTween = null;
			},
			category: 'options'
		});
	
		this.settings.showOptions = !this.settings.showOptions;
		this.saveSettings();
	},

	setZoom: function(enabled) {
		if (enabled != this.settings.zoomFull) {
			this.settings.zoomFull = enabled;
			this.saveSettings();
			$('btn_zoom_actual').setClass('selected', !enabled);
			$('btn_zoom_max').setClass('selected', enabled);
		}
	},

	setSound: function(enabled) {
		$('btn_sound_on').setClass('selected', enabled);
		$('btn_sound_off').setClass('selected', !enabled);
		this.settings.sound = enabled;
		
		if (this.sceneIdx > -1) {
			if (enabled) {
				// enable sound
				if (this.audioTrack) this.audioTrack.play();
				else this.startSceneAudio();
			}
			else {
				// disable sound
				if (this.audioTrack) this.audioTrack.pause();
			}
		}
		
		this.saveSettings();
	},

	setRate: function(rate) {
		/* $('btn_rate_30').setClass('selected', rate == 30);
		$('btn_rate_60').setClass('selected', rate == 60);
		$('btn_rate_90').setClass('selected', rate == 90); */
		this.settings.targetFPS = rate;
		this.saveSettings();
	},
	
	setSpeed: function(speed) {
		$('btn_speed_025').setClass('selected', speed == 0.25);
		$('btn_speed_05').setClass('selected', speed == 0.5);
		$('btn_speed_1').setClass('selected', speed == 1);
		$('btn_speed_2').setClass('selected', speed == 2);
		$('btn_speed_4').setClass('selected', speed == 4);
		this.settings.speedAdjust = speed;
		this.saveSettings();
	},

	setBlendShift: function(enabled) {
		$('btn_blendshift_on').setClass('selected', enabled);
		$('btn_blendshift_off').setClass('selected', !enabled);
		this.settings.blendShiftEnabled = enabled;
		this.saveSettings();
	}

};

var CC = CanvasCycle; // shortcut
