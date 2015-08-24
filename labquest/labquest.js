window.URL = window.URL || window.webkitURL;

function decimalPlaces(number) {
  return ((+number).toFixed(20)).replace(/^-?\d*\.?|0+$/g, '').length;
}

function drawTimer(el, dur) {

    var loader = el.find('#loader'),
        border = el.find('#border'),
        alpha = 0,
        pi = Math.PI,
        t = ( dur * 1000 ) / 360;

    (function draw() {
      alpha++;
      alpha %= 360;
      var r = ( alpha * pi / 180 ),
        x = Math.sin( r ) * 50,
        y = Math.cos( r ) * - 50,
        mid = ( alpha > 180 ) ? 1 : 0,
        anim = 'M 0 0 v -50 A 50 50 1 ' +
            mid + ' 1 ' +
            x  + ' ' +
            y  + ' z';
     
      loader.setAttribute( 'd', anim );
      border.setAttribute( 'd', anim );
      
      if(alpha !== 0){
        setTimeout(draw, t); // Redraw
      }
      
    })();
}

function setStatus(containerEl, msg, type, duration) {
    if(!containerEl) return;

    msg = msg || '';
    type = type || 'info';
    duration = duration || 1000;

    $('<div class="status status-' + type + '">' + msg + '</div>').appendTo(containerEl);
    var $n = $(containerEl).children().last();
    var nHeight = $n.outerHeight();
    $n.css('bottom',-nHeight).addClass('anim').css('bottom',0);
    setTimeout(function(){
        $n.css('bottom',-nHeight);
        setTimeout(function(){
            $n.remove();
        }, 1000);
    }, duration);
}

function isEmail(email) { 
    var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
}

function isTouchDevice() {
    return (('ontouchstart' in window) ||
        (navigator.MaxTouchPoints > 0) ||
        (navigator.msMaxTouchPoints > 0));
}

function localStorageTest(){
    var test = 'test';
    try {
        localStorage.setItem(test, test);
        localStorage.removeItem(test);
        return true;
    } catch(e) {
        return false;
    }
}

$(function(){

if(!isTouchDevice()) {

    if(navigator.platform.toUpperCase().indexOf('MAC')>=0){
        $("#macDownload").css({display:'block'});
    }
    $("#welcomePage").css({display:'block'}).velocity({opacity:1}, 600);
}
else {

    $("#startPage").css({display:'block', opacity:1});

(function(){

    var AUDIOCTX = Howler.ctx || window.AudioContext ||window.webkitAudioContext;
    var VERSION = '1.2.4', STORELOCAL = localStorageTest();

    if(!localStorage["VERSION"] || localStorage["VERSION"] !== VERSION) {
        localStorage.clear();
        if(STORELOCAL) {
            localStorage["VERSION"] = VERSION;
        }
    }

    function utf8_to_b64( str ) {
        return window.btoa(unescape(encodeURIComponent( str )));
    }

    function shuffle(o){
        for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
        return o;
    }

    var Page = View.extend({
        shown: true,
        limitOrient: true,
        el: '',

        init: function(start) {
            this._super();
            _bindAll(this, 'show', 'hide');
            if(!start) {
                this.shown = false;
            }
        },

        show: function(callback){
            callback = callback || function(){};
            if(!this.shown){
                this.shown = true;

                if(!this.render()){
                    $(this.el).css('display', 'block');
                    $(this.el).animate({opacity:1}, 300, _bind(function() {
                        this.post_render();
                        callback();
                    }, this));
                }
            
            }

        },

        hide: function(callback){
            if(this.shown){
                this.shown = false;

                this.pre_conceal();
                $(this.el).animate({opacity:0}, 100, _bind(function(){
                    this.conceal();
                    callback();
                    $(this.el).css('display', 'none');
                }, this));
            }
        },

        conceal: function(){},
        pre_conceal: function(){},
        handleResize: function(){}

    });

    var DoubleTouchPage = Page.extend({

        init: function(options){
            this._super(options);
            _bindAll(this, 'handleTouchStart', 'handleTouchMove', 'handleTouchEnd', 'handleDoubleTouchStart', 'handleDoubleTouchEnd');

            this.resetDoubleTouch();
        },

        resetDoubleTouch: function(){
            this.touches = [{x: 0, y: 0, id: false}, {x: 0, y: 0, id: false}];
            this.touches.isDouble = function(){
                return (this[0].id !== false && this[1].id !== false);
            };
            this.doubleTouch = false;
        },

        handleTouchStart: function(e){
            e.preventDefault();
            var changed = e.changedTouches,
                touches = this.touches;

            for(var i = 0; i < changed.length ; i++) {
                for(var j = 0; j < 2; j++){
                    if(touches[j].id === false){
                        touches[j].x = changed[i].pageX;
                        touches[j].y = changed[i].pageY;
                        touches[j].id = changed[i].identifier;
                        this.onTouchStart(touches[j]);
                        break;
                    }
                }
            }

            if(touches.isDouble()){
                this.doubleTouch = true;
                this.handleDoubleTouchStart();
            }
        },

        handleTouchMove: function(e){
            e.preventDefault();
            var changed = e.changedTouches,
                touches = this.touches;

            for(var i = 0; i < changed.length ; i++) {
                for(var j = 0; j < 2; j++){
                    if(touches[j].id === changed[i].identifier){
                        touches[j].x = changed[i].pageX;
                        touches[j].y = changed[i].pageY;
                        this.onTouchMove(touches[j]);
                        break;
                    }
                }
            }

            if(this.touches.isDouble()){
                this.handleDoubleTouchMove();
            }
        },

        handleTouchEnd: function(e){
            e.preventDefault();
            var changed = e.changedTouches,
                touches = this.touches;

            for(var i = 0; i < changed.length ; i++) {
                for(var j = 0; j < 2; j++){
                    if(touches[j].id === changed[i].identifier){
                        this.onTouchEnd(touches[j]);
                        touches[j].id = false;
                        break;
                    }
                }
            }

            if(this.doubleTouch && !touches.isDouble()){
                this.handleDoubleTouchEnd();
                this.doubleTouch = false;
            }
        },
        onTouchStart: function(){},
        onTouchMove: function(){},
        onTouchEnd: function(){},
        handleDoubleTouchStart: function(){},
        handleDoubleTouchEnd: function(){},
        handleDoubleTouchMove: function(){},
        handleResize: function(){
            this.el.style.width = window.innerWidth + 'px';
            this.el.style.height = window.innerHeight + 'px';
        },
        render: function(){
            this.el.className = 'doubleTouch';
            this.resetDoubleTouch();
        }
    });

    var notifier = {
        
        currentPlaying: null,

        sounds: {
            contactLoss: new Howl({urls:['alerts/contact_loss.mp3'], volume: 0.2}),
            contact: new Howl({urls:['alerts/contact.mp3'], volume: 0.5}),
            done: new Howl({urls:['alerts/done.mp3']}),
            click: new Howl({urls:['alerts/click.mp3'], volume: 0.9})
        },

        init: function(){
        },

        play: function(sound){
            return this.sounds[sound].play();
        },

        pause: function(sound){
            this.sounds[sound].pause();
        },

        stop: function(sound){
            this.sounds[sound].stop();
        }

    };

    var DEVICE_INFO = getDeviceInfo();
    var ua_parser = new UAParser();

    var rater = { getRating: function(){} };
    var config = {
        appCreateDate: 'Sunday May 31 2015',
        appVersion: VERSION,
        name: '',
        experiment: '',
        experimentTime: '',
        experimenterId: localStorage["experimenterId"],
        experimentId: localStorage["experimentId"],
        absoluteTime: 0,
        durationActual: 0,
        setupMaxDist: [],
        setupMinDist: [],
        preMaxDist: [],
        preMinDist: [],
        postMaxDist: [],
        postMinDist: [],
        medianMaxDist: 0,
        medianMinDist: 0,
        refMin: 0,
        refMax: 0,
        refMinRating: '',
        refMaxRating: '',
        refValid: false,
        refExperiment: '',
        refObserver: '',
        medianMaxRating: 0,
        medianMinRating: 0,
        ratings: [],
        ratingsPx: [],
        valid: [],
        times: [],
        practiceMinRatings: [],
        practiceMaxRatings: [],
        cancelTime: 5000,
        url: window.location.href,
        location: {
            long: null,
            lat: null,
            accuracy: null,
            near: ''
        },
        screenWidth: window.screen.width,
        screenHeight: window.screen.height,
        windowWidth: window.innerWidth,
        windowHeight: window.innerHeight,
        deviceInfo: DEVICE_INFO,
        os: ua_parser.getOS().name + ' ' + ua_parser.getOS().version,
        browser: ua_parser.getBrowser().name + ' ' + ua_parser.getBrowser().major,
        localStore: STORELOCAL,
        
        optionsMode: "server",
        options:{},
        serverOptions: {},

        totalDuration: 0,
        knockout: '',
        songUri: 'whitenoise',
        songName: '',
        songArtist: '',
        songAlbum: '',
        songDuration: '',
        feltPleasure: '',
        aborted: false,

        generateDataObject: function(){
            var data = {
                experiment: this.experiment,
                aborted: this.aborted,
                name: this.name,
                optionsMode: this.optionsMode,
                url: this.url,
                appCreateDate: this.appCreateDate,
                appVersion: this.appVersion,
                timeZero: this.experimentTime,
                time: this.times,
                ratings: this.ratings,
                spread: this.ratingsPx,
                valid: this.valid,
                feltPleasure: this.feltPleasure,
                device: {
                    name: DEVICE_INFO.type,
                    model: DEVICE_INFO.model,
                    os: this.os,
                    browser: this.browser,
                    localStore: this.localStore
                },
                screenWidth: this.screenWidth,
                screenHeight: this.screenHeight,
                windowWidth: this.windowWidth,
                windowHeight: this.windowHeight,
                location: this.location,
                actualDuration: this.durationActual,
                setupMinDist: this.setupMinDist,
                setupMaxDist: this.setupMaxDist,
                refMinDist: this.medianMinDist,
                refMaxDist: this.medianMaxDist,
                preMinDist: this.preMinDist,
                preMaxDist: this.preMaxDist,
                postMinDist: this.postMinDist,
                postMaxDist: this.postMaxDist,
                medianMinRating: this.medianMinRating,
                medianMaxRating: this.medianMaxRating,
                knockout: this.knockout,
                songUri: this.songUri,
                songName: this.songName,
                songArtist: this.songArtist,
                songAlbum: this.songAlbum,
                songDuration: this.songDuration,
                options: this.options,
                settings_id: config.experimentId
            };

            return data;
        },

        initOptions: function(){
            this.options = {
                email: 'lauren.vale@nyu.edu',
                duration: 30,
                ratingInterval: 1,
                minRating: 1,
                setupSteps: 2,
                preSteps: 2,
                postSteps: 1,
                skipRepeat: false,
                repeatInterval: 30,
                labquestURL: 'http://10.0.0.1',
                input: {
                    highCriterion: 200,
                    lowCriterion: 200,
                    stdCriterion: 10,
                    setInterval: 3,
                },
                feedback:{
                    barbell: false,
                    range: false,
                    numeric: false,
                    auditory: false,
                    tactile: false,
                    barVaries: false
                },
                postInMedian: false,
                musicSelect: true,
                nameSelect: false,
                moodSelect: false,
                crySelect: false,
                knockOff: false,
                knockOnset: 0,
                knockDuration: 30,
                moodDuration: 180,
                postStimulusDuration: 120,
                durationWhiteNoise: 120,
                fingers: 0,
                storeData: false
            };

            if(localStorage["options"]){
                try {
                    this.options = JSON.parse(localStorage["options"]);
                } catch(e){}
            }
        },

        generateOptionsJSON: function(){
            return JSON.stringify(this.options);
        },

        generateData: function(){

            this.medianMaxDist = (this.refValid) ? this.refMax : (this.postInMedian) ? findMedian(this.setupMaxDist.concat(this.preMaxDist, this.postMaxDist)) : findMedian(this.setupMaxDist);
            this.medianMinDist = (this.refValid) ? this.refMin : (this.postInMedian) ? findMedian(this.setupMinDist.concat(this.preMinDist, this.postMinDist)) : findMedian(this.setupMinDist);
            
            this.refMax = this.medianMaxDist;
            this.refMin = this.medianMinDist;
            this.refValid = (new Date()).getTime() + this.options.repeatInterval*1000;
            this.refExperiment = this.experiment;
            this.refObserver = this.name;

            this.medianMaxRating = (this.refValid) ? this.refMaxRating : findMedian(this.practiceMaxRatings).toFixed(1);
            this.medianMinRating = (this.refValid) ? this.refMinRating : findMedian(this.practiceMinRatings).toFixed(1);
            this.refMaxRating = this.medianMaxRating;
            this.refMinRating = this.medianMinRating;
            
            var distNames = ['setup', 'pre', 'post'];
            for(var i = 0; i<distNames.length; i++){
                var dist = distNames[i];
                this[dist+'MinMax'] = [];
                var len = Math.max(this[dist+'MaxDist'].length, this[dist+'MinDist'].length);
                for(var j = 0; j<this[dist+'MaxDist'].length; j++){
                    this[dist+'MinMax'].push(this[dist+'MinDist'][j] || '');
                    this[dist+'MinMax'].push(this[dist+'MaxDist'][j] || '');
                }
            }

            if(config.knockout === '') {
                config.knockout = 'None';
            }
            else if(config.knockout == 'mood') {
                config.knockout = 'Sad mood';
            }
            else if(config.knockout == 'name') {
                config.knockout = 'Name';
            }

            return tmpl("data_tmpl", this);
        }
    };

    function updateRater(config){

        rater = (function(){

            var minDist = (config.refValid) ? config.refMin : (config.options.postInMedian) ? findMedian(config.setupMinDist.concat(config.preMinDist, config.postMinDist)) : findMedian(config.setupMinDist),
                maxDist = (config.refValid) ? config.refMax : (config.options.postInMedian) ? findMedian(config.setupMaxDist.concat(config.preMaxDist, config.postMaxDist)) : findMedian(config.setupMaxDist);

            var ratingRange = maxDist - minDist;

            return {
                getRatingFromDist: function(distance){
                    var r = ((distance - minDist) / ratingRange) * (10 - config.options.minRating) + config.options.minRating;
                    return Math.min(10, Math.max(config.options.minRating, r));
                },

                getRating: function(touches){
                    var distance = getDistance(touches[0].x, touches[0].y, touches[1].x, touches[1].y);
                    return this.getRatingFromDist(distance);
                },
            };
        })();
    }

    function saveLocation(location) {
        config.location.lat = location.coords.latitude;
        config.location.long = location.coords.longitude;
        config.location.accuracy = location.coords.accuracy;

        $.get('https://maps.googleapis.com/maps/api/geocode/json?latlng=' + config.location.lat + ',' + config.location.long + '&key=AIzaSyB_fvbdKS675ZptvH62faLD5IuG7sbrEb0', function(data) {
            var addr = data.results[0];
            config.location.near = addr.formatted_address;
        });
    }
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(saveLocation);
    }

    var getDistance = function(x1, y1, x2, y2){
        return Math.floor(Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2)));
    };

    function SelectCollection(title, url, map) {
        var list = [],
            els = [];

        map = map || {v : 'v', t: 't'};

        return {
            get: function(){
                return list;
            },

            isEmpty: function(){
                return list.length == 0;
            },

            addEl: function(el){
                els.push(el);
            },

            fetch: function(params, select, callback){
                params = params || [];

                $.each(els, function(i, e){
                    $(e).prop('disabled', true);
                    $(e).html('<option selected disabled style="display:none">Getting ' + title + '...</option>');
                });

                var self = this;
                $.ajax({
                    url: url + (params.length ? '?' + params.join('&') : ''),
                    type: 'GET',
                    dataType: 'json',
                    timeout: 5000,
                    success: function(data) {
                        list = data;

                        $.each(els, function(i, e){
                            $(e).html('<option selected disabled style="display:none">Choose an ' + title + '</option>');
                            if(!list.length) {
                                $(e).html('<option selected disabled style="display:none" value="">No ' + title + 's found</option>');
                                return;
                            }
                            $.each(list, function(j, d) {
                                if(typeof d == 'string') {
                                    $(e).append('<option value="' + d + '">' + d +'</option>');
                                }
                                else {
                                    $(e).append('<option value="' + d[map.v] + '">' + d[map.t] +'</option>');    
                                }
                                
                            });;
                        });
                        if(data.length > 0) {
                            select = select || (typeof list[0] === 'string' ? list[0] : list[0][map.v]);
                            self.select( select );
                            $.each(els, function(i, e){
                                $(e).prop('disabled', false);
                            });
                        }
                    },
                    complete: function(jqXHR) {
                        if(callback) {
                            callback($.parseJSON(jqXHR.responseText));
                        }
                    }
                });
            },

            select: function(value) {
                $.each(els, function(i, e){
                    $(e).val( value );
                });
            }
        }
    }

    var experimentCollection = new SelectCollection('experiment', 'http://54.172.59.119/exps', {v: '_id', t: 'exp'});
    var experimenterCollection = new SelectCollection('experimenter', 'http://54.172.59.119/users', {v: '_id', t: 'name'});

    var settingsPage = new (Page.extend({
        id: 'settingsPage',

        limitOrient: false,

        init: function(){
            this._super();
            _bindAll(this, 
                'handleSave', 
                'showStart', 
                'floatButtons', 
                'unFloatButtons', 
                'showAudioWarn', 
                'toggleOptionMode', 
                'toggleOptionFingers', 
                'generateOptions', 
                'loadOptions', 
                'disableAll', 
                'enableAll', 
                'uploadOptions',
                'showRegisterPage',
                'hideRegisterPage',
                'handleRegister',
                'resetUploadButton'
            );

            config.initOptions();

            if(!AUDIOCTX){
                config.options.feedback.auditory = false;
                config.options.musicSelect = false;
                $(this.el.find('#feedAuditory, #musicSelect')).on('click', this.showAudioWarn);
            }

            this.email = $(this.el.find('#email'));
            this.duration = $(this.el.find('#duration'));
            this.postStimulusDuration = $(this.el.find('#postStimulusDuration'));

            this.setupSteps = $(this.el.find('#setupSteps'));
            this.preSteps = $(this.el.find('#preSteps'));
            this.postSteps = $(this.el.find('#postSteps'));
            this.skipRepeat = $(this.el.find('#skipRepeat'));
            this.repeatInterval = $(this.el.find('#repeatInterval'));
            this.ratingInterval = $(this.el.find('#ratingInterval'));
            this.minRating = $(this.el.find('#minRating'));

            this.labquestURL = $(this.el).find('#labquestURL');
            this.inputHighCriterion = $(this.el).find('#inputHighCriterion');
            this.inputLowCriterion = $(this.el).find('#inputLowCriterion');
            this.inputStdCriterion = $(this.el).find('#inputStdCriterion');
            this.inputSetInterval = $(this.el).find('#inputSetInterval');

            this.feedBarbell = $(this.el).find('#feedBarbell');
            this.feedRange = $(this.el.find('#feedRange'));
            this.feedNumeric = $(this.el.find('#feedNumeric'));
            this.feedAuditory = $(this.el.find('#feedAuditory'));
            this.feedTactile = $(this.el.find('#feedTactile'));
            this.feedBarVaries = $(this.el.find('#feedBarVaries'));

            this.postInMedian = $(this.el.find('#postInMedian'));
            this.musicSelect = $(this.el.find('#musicSelect'));
            this.nameSelect = $(this.el.find('#nameSelect'));
            this.moodSelect = $(this.el.find('#moodSelect'));
            this.crySelect = $(this.el.find('#crySelect'));
            this.knockOff = $(this.el.find('#knockOff'));
            this.moodDuration = $(this.el.find('#moodDuration'));
            this.knockOnset = $(this.el.find('#knockOnset'));
            this.knockDuration = $(this.el.find('#knockDuration'));

            this.durationWhiteNoise = $(this.el.find('#durationWhiteNoise'));
            this.optionsMode = this.el.find("#optionsMode");
            this.optionsFingers = $(this.el.find('#optionsFingers'));
            this.storeData = $(this.el.find('#storeData'));
            this.loadOptions();

            this.exp = this.el.find('#optExp');
            this.expSel = this.el.find('#optExpSel');
            this.expter = $(this.el.find('#optExpterSel'));

            $(this.expSel).prop('disabled', true);
            $(this.expter).prop('disabled', true);

            experimentCollection.addEl(this.expSel);
            experimenterCollection.addEl(this.expter);

            this.oldRatingInterval = 0;

            var self = this;
            $(this.ratingInterval).change(function(){
                if(!$.isNumeric(+$(this).val())){
                    $(this).val(self.oldRatingInterval);
                }
            }).focus(function(){
                self.oldRatingInterval = +$(this).val();
            });

            $(this.expter).on({
                'change': function() {
                    localStorage['experimenterId'] = config.experimenterId = $(this).val();
                    experimentCollection.fetch(['id='+$(this).val()], null, function(exps){
                        self.disableAll();
                        downloadOptions(exps.length > 0 ? exps[0]._id : null);
                    });    
                },
                'touchstart': function(e) {
                    e.preventDefault();
                    var that = this;
                    if(experimenterCollection.isEmpty()) {
                        experimenterCollection.fetch([], null, function(){
                            var event = document.createEvent('MouseEvents');
                            event.initMouseEvent('mousedown', true, true, window);
                            $(that)[0].dispatchEvent(event);
                        });                        
                    }
                    else {
                        var event = document.createEvent('MouseEvents');
                        event.initMouseEvent('mousedown', true, true, window);
                        $(that)[0].dispatchEvent(event);
                    }
                }
            });

            $(this.expSel).on({
                'change': function() {
                    self.disableAll();
                    localStorage['experimentId'] = config.experimentId = $(this).val();
                    downloadOptions($(this).val());
                },
                'touchstart': function(e) {
                    e.preventDefault();
                    var that = this;
                    if(experimentCollection.isEmpty()) {
                        experimentCollection.fetch(['id='+config.experimenterId], null, function(){
                            var event = document.createEvent('MouseEvents');
                            event.initMouseEvent('mousedown', true, true, window);
                            $(that)[0].dispatchEvent(event);
                        });
                    }
                    else {
                        var event = document.createEvent('MouseEvents');
                        event.initMouseEvent('mousedown', true, true, window);
                        $(that)[0].dispatchEvent(event);
                    }
                }
            });

            this.header = this.el.find('#settingsHeader');
            this.moodWarn = this.el.find("#moodWarn");
            this.modeUpload = $("#modeUploadPage");
            this.modeRegister = $("#modeRegisterPage");
            this.registerStatus = this.modeRegister.find('.status-container');
            this.storeWarn = this.el.find('#storeWarn');

            this.saveButton = this.el.find('#saveSubmit');
            this.registerButton = this.el.find('#registerButton');
            this.registerSubmit = document.body.find('#registerSubmit');
            this.registerHeader = document.body.find('#registerHeader');

            new MBP.fastButton(this.saveButton, this.handleSave);
            new MBP.fastButton(this.registerSubmit, this.handleRegister);
            new MBP.fastButton(this.el.find('#cancelSubmit'), this.showStart);
            new MBP.fastButton(this.registerButton, this.showRegisterPage);
            new MBP.fastButton(document.body.find("#registerClose"), this.hideRegisterPage);

            $(this.setupSteps).on('change', function(){
                if(+$(this).val().trim() === 0){
                    $(this).val(1);
                }
            });

            $(this.optionsMode).on('touchstart', '.btn', this.toggleOptionMode);
            $(this.optionsFingers).on('touchstart', '.btn', this.toggleOptionFingers);

            this.uploadSubmit = document.body.find('#uploadSubmit');
            this.uploadExp = this.modeUpload.find("#uploadExperiment");
            this.uploadEmail = this.modeUpload.find("#uploadEmail");
            this.uploadPassword = this.modeUpload.find("#uploadPassword");

            new MBP.fastButton(document.body.find("#uploadClose"), function(e){
                e.preventDefault();
                self.modeUpload.css({display:'none', opacity: 0});
                $(self.el).css({display:'block'}).velocity({opacity: 1}, 300);
                $(self.uploadSubmit).val('Upload').prop('disabled', false).removeClass('btn-success btn-error');
            });

            new MBP.fastButton(this.el.find('#modeUploadBtn'), function(){
                $(self.el).css({display:'none', opacity: 0});
                if(config.optionsMode == "server"){
                    $(self.uploadExp).val($(self.expSel).children('option:selected').text());
                }
                else{
                    $(self.uploadExp).val($(self.exp).val());
                }
                $(self.uploadEmail).val('');
                $(self.uploadPassword).val('');
                self.modeUpload.css({display:'table'}).velocity({opacity:1}, 300, function(){
                    window.scrollTo(0, 1);
                });
            });


            this.modeUpload.find('input').on('change', this.resetUploadButton);
/*            $(this.uploadExp).on('change', this.resetUploadButton);
            $(this.uploadEmail).on('change', this.resetUploadButton);
            $(this.uploadPassword).on('change', this.resetUploadButton);*/
            new MBP.fastButton(this.uploadSubmit, this.uploadOptions);
            
            $("#audioOk").on('touchstart', function(e){
                e.preventDefault();
                $('#audioWarn').velocity({opacity:0}, 200, function(){
                    $(this).css({display:'none'});
                    $(document).off('touchmove', self.onDialogScroll);
                });
            });

            $(this.moodSelect).on('click', function(e){
                if($(this).prop('checked') === false) {
                    return true;
                }
                e.preventDefault();
                $(document).on("touchmove", self.onDialogScroll);
                $(self.moodWarn).css({display:'table', width: window.innerWidth + 'px', height: window.innerHeight + 'px'}).velocity({opacity:1}, 100);
            });

            $("#moodYes").on('touchstart', function(e){
                e.preventDefault();
                $(self.moodWarn).velocity({opacity:0}, 200, function(){
                    $(self.moodWarn).css({display:'none'});
                    $(document).off('touchmove', self.onDialogScroll);
                });
                $(self.moodSelect).prop('checked', true);
            });

            $("#moodNo").on('touchstart', function(e){
                e.preventDefault();
                $(self.moodWarn).velocity({opacity:0}, 200, function(){
                    $(self.moodWarn).css({display:'none'});
                    $(document).off('touchmove', self.onDialogScroll);
                });
                $(self.moodSelect).prop('checked', false);
            });

            $(this.storeData).on('click', function(e){
                if($(this).prop('checked') === false) {
                    return true;
                }
                e.preventDefault();
                $(document).on("touchmove", self.onDialogScroll);
                $(self.storeWarn).css({display:'table', width: window.innerWidth + 'px', height: window.innerHeight + 'px'}).velocity({opacity:1}, 100);
            });

            $("#storeOk").on('touchstart', function(e){
                e.preventDefault();
                $(self.storeWarn).velocity({opacity:0}, 200, function(){
                    $(self.storeWarn).css({display:'none'});
                    $(document).off('touchmove', self.onDialogScroll);
                });
                $(self.storeData).prop('checked', true);
            });

            $(window).on('resize', this.handleResize);

            $(this.moodDuration).on('change', function(){
                var moodDur = $(this).val().trim();
                moodDur = (!isNaN(moodDur)) ? (+moodDur) : 180;
                $(this).val(moodDur);
            });

            $(this.el).on('focus', 'input[type="text"]', this.unFloatButtons);
            $(this.el).on('focusout', 'input[type="text"]', this.floatButtons);

            this.modeRegister.on('focus', '.inpt', function(){
                self.registerHeader.style.position = 'absolute';
            });

            this.modeRegister.on('focusout', '.inpt', function(){
                self.registerHeader.style.position = 'fixed';
            });
        },

        resetUploadButton: function(){
                $(this.uploadSubmit).text('Upload').prop('disabled', false).removeClass('btn-success btn-error');
        },

        disableAll: function() {
            $(this.el).find('input').prop('disabled', true);
        },

        enableAll: function() {
            $(this.el).find('input').prop('disabled', false);
        },

        handleRegister: function() {
            var el = this.modeRegister;

            var fields = {
                name: el.find('#registerName'),
                email: el.find('#registerEmail'),
                password: el.find('#registerPassword'),
                city: el.find('#registerCity'),
                university: el.find('#registerUniversity')
            };

            var vals = {};
            for(f in fields) {
                vals[f] = fields[f].val().trim();
                if(vals[f] == '') {
                    var cap = f.charAt(0).toUpperCase() + f.slice(1);
                    fields[f].addClass('invalid');
                    fields[f].on('focus', function(){
                        $(this).removeClass('invalid');
                    });
                    setStatus(this.registerStatus, cap + ' is required.', 'error', 2500);
                    return;   
                }
            }

            if(vals.password.length < 4) {
                return setStatus(this.registerStatus, 'Password must be atleast 4 characters long.', 'error', 2500);
            }

            if(!isEmail(vals.email)) {
                return setStatus(this.registerStatus, 'Email address is invalid.', 'error', 2500);
            }

            $(this.registerSubmit).val('Registering...').prop('disabled', true);
            var self = this;
            $.ajax({
                url:'http://54.172.59.119/register',
                type: 'POST',
                data: JSON.stringify(vals),
                contentType: 'application/json; charset=utf-8',
                dataType: 'json',
                timeout: 8000,
                success: function(msg) {
                    if(msg){
                        if(msg.error){
                            setStatus(self.registerStatus, msg.error, 'error', 2500);
                        }
                        else if(msg.success){
                            setStatus(self.registerStatus, 'Successfully registered. You will receive an email once your request has been approved.', 'info', 3500);    
                            for(f in fields) {
                                fields[f].val('');
                            }
                        }
                    }
                    
                },
                error: function(jqXHR, textStatus, errorThrown){
                    setStatus(self.registerStatus, 'Error contacting server', 'error', 2500);
                },
                complete: function(){
                    setTimeout(function(){
                        $(self.registerSubmit).prop('disabled', false).val('Register');
                    }, 1000);
                }
            });
        },

        showRegisterPage: function(){
            $(this.el).css({display:'none'}).velocity({opacity: 0}, 300);
            this.modeRegister.css({display:'block', opacity: 1});
        },

        hideRegisterPage: function(){
            this.modeRegister.css({display:'none', opacity: 0});
            $(this.el).css({display:'block'}).velocity({opacity: 1}, 300);
        },

        uploadOptions: function(e){
            e.preventDefault();
            if($(this.uploadSubmit).prop('disabled')) return false;
            var exp = $(this.uploadExp).val().trim(),
                email = $(this.uploadEmail).val().trim(),
                password = $(this.uploadPassword).val().trim();

            if(exp === '' || password === '') return false;

            $(this.uploadSubmit).text('Uploading...').prop('disabled', true);

            var self = this;
            var updatedOptions = self.generateOptions();
            $.ajax({
                url:'http://54.172.59.119/upload',
                type: 'POST',
                data: JSON.stringify({e: exp, email: email, password: password, o: updatedOptions}),
                contentType: 'application/json; charset=utf-8',
                dataType: 'json',
                timeout: 8000,
                success: function(msg) {
                    if(msg && msg.error){
                        $(self.uploadSubmit).text(msg.error).addClass('btn-error');
                    }
                    else{
                        $(self.uploadSubmit).text('Upload successful').addClass('btn-success');
                        if(msg.user_id === config.experimenterId) {
                            experimentCollection.fetch(['id='+msg.user_id], msg.id);
                            self.disableAll();
                            downloadOptions(msg.id);
                        }
                    }
                    
                },
                error: function(jqXHR, textStatus, errorThrown){
                    $(self.uploadSubmit).text('Error contacting server').addClass('btn-error');
                },
                complete: function(){
                    setTimeout(function(){
                        self.resetUploadButton();
                    }, 2500);
                }
            });
        },

        toggleOptionFingers: function(e) {
            e.preventDefault();
            if(!e.target) return false;

            var optionTarget = e.target;
            $(this.optionsFingers).find(".btn-selected").removeClass("btn-selected");
            $(optionTarget).addClass("btn-selected");
        },

        toggleOptionMode: function(e){
            e.preventDefault();
            if(!e.target) return false;

            var optionTarget = e.target,
                optionName = config.optionsMode = $(optionTarget).data("name");

            $(this.optionsMode).find("button").removeClass("btn-selected");
            $(optionTarget).addClass("btn-selected");

            if(optionName == "server"){
                $(this.exp).css({display:"none"});
                $(this.expSel).css({display:"block"});
                var expVal = $(this.exp).val().trim();
                if(expVal !== '' && $(this.expSel).find('option[value="'+ expVal + '"]').length > 0) {
                    $(this.expSel).val(expVal);
                }

                $(this.saveButton).css({display:"none"});
                $(this.registerButton).css({display:"block"});
                this.expter.parent().css({display:"block"});
                this.storeData.parent().parent().css({display:"block"});
                this.loadOptions(config.serverOptions);
            }
            else{
                $(this.expSel).css({display:"none"});
                $(this.registerButton).css({display:"none"});
                this.expter.parent().css({display:"none"});
                this.storeData.parent().parent().css({display:"none"});

                $(this.exp).css({display:"block"});
                $(this.saveButton).css({display:"block"});

                this.loadOptions();
            }
        },

        showAudioWarn: function(e){
            if($(e.target).prop('checked') === false){
                return true;
            }
            e.preventDefault();
            $(document).on("touchmove", self.onDialogScroll);
            $('#audioWarn').css({display:'table', width: window.innerWidth + 'px', height: window.innerHeight + 'px'}).velocity({opacity:1}, 100);

        },

        onDialogScroll: function(){
            return false;
        },

        handleSave: function(e){
            e.preventDefault();

            if(config.optionsMode == "here" || $(this.expSel).val() === "") {
                config.options = this.generateOptions();
                if(STORELOCAL){
                    localStorage["options"] = JSON.stringify(config.options);
                }
            }
            this.showStart(e);
        },

        generateOptions: function() {
            var options = {
                email: $(this.email).val().trim(),
                duration: +$(this.duration).val().trim(),
                ratingInterval: +$(this.ratingInterval).val().trim(),
                minRating: +$(this.minRating).val().trim(),
                setupSteps: +$(this.setupSteps).val().trim(),
                preSteps: +$(this.preSteps).val().trim(),
                postSteps: +$(this.postSteps).val().trim(),
                skipRepeat: $(this.skipRepeat).prop('checked'),
                repeatInterval: +$(this.repeatInterval).val(),
                labquestURL: $(this.labquestURL).val().trim(),
                input: {
                    highCriterion: +$(this.inputHighCriterion).val().trim(),
                    lowCriterion: +$(this.inputLowCriterion).val().trim(),
                    stdCriterion: +$(this.inputStdCriterion).val().trim(),
                    setInterval: +$(this.inputSetInterval).val().trim()
                },
                feedback:{
                    barbell: $(this.feedBarbell).prop('checked'),
                    range: $(this.feedRange).prop('checked'),
                    numeric: $(this.feedNumeric).prop('checked'),
                    auditory: $(this.feedAuditory).prop('checked'),
                    tactile: $(this.feedTactile).prop('checked'),
                    barVaries: $(this.feedBarVaries).prop('checked')
                },
                postInMedian: $(this.postInMedian).prop('checked'),
                musicSelect: $(this.musicSelect).prop('checked'),
                nameSelect: $(this.nameSelect).prop('checked'),
                moodSelect: $(this.moodSelect).prop('checked'),
                crySelect: $(this.crySelect).prop('checked'),
                knockOff: $(this.knockOff).prop('checked'),
                knockOnset: +$(this.knockOnset).val(),
                knockDuration: +$(this.knockDuration).val(),
                moodDuration: +$(this.moodDuration).val(),
                postStimulusDuration: +$(this.postStimulusDuration).val(),
                durationWhiteNoise: +$(this.durationWhiteNoise).val(),
                fingers:  +$(this.optionsFingers).find(".btn-selected").first().data('value'),
                storeData: $(this.storeData).prop('checked')
            };
            return options;
        },

        loadOptions: function(options) {
            if(!options || $.isEmptyObject(options)) {
                options = config.options;
            }

            $(this.email).val(options.email);
            $(this.duration).val(options.duration);
            $(this.postStimulusDuration).val(options.postStimulusDuration);

            $(this.setupSteps).val(options.setupSteps);
            $(this.preSteps).val(options.preSteps);
            $(this.postSteps).val(options.postSteps);
            $(this.skipRepeat).prop('checked', options.skipRepeat);
            $(this.repeatInterval).val(options.repeatInterval);
            $(this.ratingInterval).val(options.ratingInterval);
            $(this.minRating).val(options.minRating);

            $(this.labquestURL).val(options.labquestURL);
            $(this.inputHighCriterion).val(options.input.highCriterion);
            $(this.inputLowCriterion).val(options.input.lowCriterion);
            $(this.inputStdCriterion).val(options.input.stdCriterion);
            $(this.inputSetInterval).val(options.input.setInterval);

            $(this.feedBarbell).prop('checked', options.feedback.barbell);
            $(this.feedRange).prop('checked', options.feedback.range);
            $(this.feedNumeric).prop('checked', options.feedback.numeric);
            $(this.feedAuditory).prop('checked', options.feedback.auditory);
            $(this.feedTactile).prop('checked', options.feedback.tactile);
            $(this.feedBarVaries).prop('checked', options.feedback.barVaries);

            $(this.postInMedian).prop('checked', options.postInMedian);
            $(this.musicSelect).prop('checked', options.musicSelect);
            $(this.nameSelect).prop('checked', options.nameSelect);
            $(this.moodSelect).prop('checked', options.moodSelect);
            $(this.crySelect).prop('checked', options.crySelect);
            $(this.knockOff).prop('checked', options.knockOff);
            $(this.knockOnset).val(options.knockOnset);
            $(this.knockDuration).val(options.knockDuration);
            $(this.moodDuration).val(options.moodDuration);
            $(this.durationWhiteNoise).val(options.durationWhiteNoise);
            $(this.storeData).prop('checked', options.storeData);

            $(this.optionsFingers).find("button").removeClass("btn-selected");
            $(this.optionsFingers).find('[data-value='+options.fingers+']').addClass('btn-selected');

            this.enableAll();
        },

        handleResize: function(){
            $(this.moodWarn).css({width: window.innerWidth + 'px', height: window.innerHeight + 'px'});
            $(this.storeWarn).css({width: window.innerWidth + 'px', height: window.innerHeight + 'px'});
            $("#audioWarn").css({width: window.innerWidth + 'px', height: window.innerHeight + 'px'});
        },

        floatButtons: function(){
            this.header.style.position = 'fixed';
        },
        unFloatButtons: function(e){
            this.header.style.position = 'absolute';
            this.focused = e.target;
        },

        render: function(){
            if(config.optionsMode == "server") {
                $(this.expter).val($(PageController.pages.start.experimenterSel).val());
                $(this.expSel).val($(PageController.pages.start.experimentSel).val());
            }
            else {
                this.loadOptions();
                $(this.exp).val($(PageController.pages.start.experiment).val());
            }
            this.floatButtons();
        },
        pre_conceal: function(){
            $(this.el).hide();
        },

        showStart: function(e){
            e.preventDefault();
            $(this.focused).blur();
            this.hide(PageController.pages["start"].show);
        }

    }))();

    var startPage = Page.extend({

        id: 'startPage',
        limitOrient: false,

        init: function(){
            this._super(true);
            _bindAll(this, 'handleSubmit', 'showSettings', 'showInfo', 'hideInfo', 'showHelp', 'hideHelp'  ,'floatButtons', 'unFloatButtons');

            this.name = this.el.find('#name');
            this.experiment = this.el.find('#experiment');
            this.experimentSel = this.el.find('#experimentSel');
            this.experimenterSel = this.el.find('#experimenterSel');
            this.settingsButton = this.el.find('#btnSettings');
            this.submitButton = this.el.find('#startSubmit');
            this.helpButton = this.el.find('#btnInfo');
            this.creditsButton = document.body.find('#showCreditsBtn');
            this.helpPage = $('#helpPage');
            this.helpClose = $('#helpClose');
            this.infoPage = $('#infoPage');
            this.infoClose = $('#infoClose');
            this.helpShown = false;

            var that = this;
            $(this.experimenterSel).prop('disabled', true);
            $(this.experimentSel).prop('disabled', true);

            experimentCollection.addEl(this.experimentSel);
            experimenterCollection.addEl(this.experimenterSel);

            if(!config.experimenterId) {
                experimenterCollection.fetch([], null, function(exptr){
                    localStorage['experimenterId'] = config.experimenterId = exptr[0]._id;
                    experimentCollection.fetch(['id='+exptr[0]._id], null, function(exps){
                        downloadOptions(exps.length > 0 ? exps[0]._id : null);
                    });  
                });
            }
            else {
                experimenterCollection.fetch([], config.experimenterId);
                experimentCollection.fetch(['id='+config.experimenterId], config.experimentId, function(exps){
                    downloadOptions(config.experimentId || (exps.length > 0 ? exps[0]._id : null) );
                });
            }

            $(this.experimenterSel).on({
                'change': function() {
                    localStorage['experimenterId'] = config.experimenterId = $(this).val();
                    experimentCollection.fetch(['id='+$(this).val()]);
                },
                'touchstart': function(e) {
                    e.preventDefault();
                    var self = this;
                    if(experimenterCollection.isEmpty()) {
                        experimenterCollection.fetch([], null, function(){
                            var event = document.createEvent('MouseEvents');
                            event.initMouseEvent('mousedown', true, true, window);
                            $(self)[0].dispatchEvent(event);
                        });                       
                    }
                    else {
                        var event = document.createEvent('MouseEvents');
                        event.initMouseEvent('mousedown', true, true, window);
                        $(self)[0].dispatchEvent(event);                    
                    }
                }
            });

            $(this.experimentSel).on({
                'change': function() {
                    localStorage['experimentId'] = config.experimentId = $(this).val();
                    downloadOptions($(this).val());
                },
                'touchstart': function(e) {
                    e.preventDefault();
                    var self = this;
                    if(experimentCollection.isEmpty()) {
                        experimentCollection.fetch(['id='+config.experimenterId], null, function(){
                            var event = document.createEvent('MouseEvents');
                            event.initMouseEvent('mousedown', true, true, window);
                            $(self)[0].dispatchEvent(event);
                        });                       
                    }
                    else {
                        var event = document.createEvent('MouseEvents');
                        event.initMouseEvent('mousedown', true, true, window);
                        $(self)[0].dispatchEvent(event);                        
                    }
                }
            });

            this.name.on("change", this.removeInvalidHighlight);
            this.experiment.on("change", this.removeInvalidHighlight);

            new MBP.fastButton(this.submitButton, this.handleSubmit);
            new MBP.fastButton(this.settingsButton, this.showSettings);
            new MBP.fastButton(this.helpButton, this.showHelp);
            new MBP.fastButton(this.creditsButton, this.showInfo);
            
            $(this.infoClose).on('touchstart', this.hideInfo);
            $(this.helpClose).on('touchstart', this.hideHelp);
            $(this.el).on('focus', 'input[type="text"]', this.unFloatButtons);
            $(this.el).on('focusout', 'input[type="text"]', this.floatButtons);
        },

        showHelp: function(e){
            e.preventDefault();
            var self = this;
            $(this.el).velocity({opacity:0}, 100, function(){
                $(this).css({display:'none'});
                self.helpShown = true;
                $(self.helpPage).css({display: 'block'});
                $(self.helpPage).velocity({opacity: 1}, 200);
            });
        },

        hideHelp: function(e){
            var self = this;
            self.helpShown = false;
            $(this.helpPage).velocity({opacity:0}, 100, function(){
                $(this).css({display:'none'});
                $(self.el).css({display: 'block'});
                $(self.el).velocity({opacity: 1}, 200);
            });
        },

        showInfo: function(e){
            if(!this.helpShown) return false;
            e.preventDefault();
            var self = this;
            $(this.helpPage).velocity({opacity:0}, 100, function(){
                $(this).css({display:'none'});
                $(self.infoPage).css({display: 'block'});
                $(self.infoPage).velocity({opacity: 1}, 200);
            });
        },

        hideInfo: function(e){
            var self = this;
            $(this.infoPage).velocity({opacity:0}, 100, function(){
                $(this).css({display:'none'});
                $(self.helpPage).css({display: 'block'});
                $(self.helpPage).velocity({opacity: 1}, 200);
            });
        },

        removeInvalidHighlight: function(e){
            var el = e.target;
            if($(el).val().trim() !== '' ){
                $(el).removeClass('invalid');
            }
            else{
                $(el).val('');
            }
        },

        handleSubmit: function(e){      
            e.preventDefault();

            config.name = $(this.name).val().trim();
            config.experiment = $(this.experiment).val().trim(); 
            if( config.optionsMode == "server" ) {
                config.experiment = $(this.experimentSel).find('option:selected').html();
            }

            var flag = false;
            if(config.name === ''){
                $(this.name).addClass('invalid');
                flag = true;
            }

            if(!config.experiment || config.experiment === ''){
                $(this.experiment).addClass('invalid');
                flag = true;
            }

            $(this.name).blur();
            $(this.experiment).blur();
            $(this.experimentSel).blur();

            if(flag === false){
                if(config.optionsMode == "server") {
                    config.options = config.serverOptions;
                    $(settingsPage.expSel).val($(this.experimentSel).val());
                }
                else {
                    $(settingsPage.exp).val(config.experiment);
                }
                config.totalDuration = config.options.duration + config.options.postStimulusDuration;
                PageController.transition("knockout");
            }

        },

        showSettings: function(e){
            e.preventDefault();
            $(this.name).blur();
            $(this.experiment).blur();
            $(this.experimentSel).blur();
            this.hide(settingsPage.show);
        },

        floatButtons: function(){
            this.settingsButton.style.position = 'fixed';
        },
        unFloatButtons: function(){
            this.settingsButton.style.position = 'absolute';
        },

        render: function(){
            if(config.optionsMode == "server"){
                $(this.experiment).css({display: 'none'});
                $(this.experimentSel).val($(settingsPage.expSel).val());
                $(this.experimentSel).css({display: 'block'});
                $(this.experimenterSel).val($(settingsPage.expter).val());
                $(this.experimenterSel).css({display: 'block'});
            }
            else{
                $(this.experimentSel).css({display: 'none'});
                $(this.experimenterSel).css({display: 'none'});
                $(this.experiment).val($(settingsPage.exp).val());
                $(this.experiment).css({display: 'block'});
            }

            $(this.submitButton).prop("disabled", false).val("Continue");
        },

        reset: function(){
            config.initOptions();
            config.setupMaxDist = [];
            config.setupMinDist = [];
            config.preMaxDist = [];
            config.preMinDist = [];
            config.postMaxDist = [];
            config.postMinDist = []; 
            config.practiceMinRatings = [];
            config.practiceMaxRatings = [];
            config.times = [];
            config.ratings = [];
            config.ratingsPx = [];
            config.valid = [];
            config.feltPleasure = '';
            config.songName = '';
            config.songArtist = '';
            config.songAlbum = '';
            config.songDuration = '';
            config.knockout = '';
            config.aborted = false,
            rater = { getRating: function(){} };
        }

    });


    function downloadOptions(id, error, complete){
        var self = this;
        if(!id || id === '') {
            settingsPage.loadOptions();    
        }
        else {
            $.ajax({
                url:'http://54.172.59.119/download?id=' + id,
                type: 'GET',
                dataType: 'json',
                timeout: 8000,
                success: function(msg) {
                    if(msg && msg.options){
                        config.serverOptions = msg.options;
                        for(opt in config.options){
                            if(!config.serverOptions.hasOwnProperty(opt)){
                                config.serverOptions[opt] = config.options[opt];
                            }
                        }
                        settingsPage.loadOptions(config.serverOptions);
                    }
                    else {
                        settingsPage.loadOptions();    
                    }
                },
                error: error || function(){},
                complete: complete
            });            
        }

    }

    function transEl(el1, el2, dur, cb){
        $(el1).velocity({opacity: 0}, (dur * 0.25), function(){
            el1.style.display = "none";
            el2.style.display = "";
            $(el2).velocity({opacity: 1}, (dur * 0.75), cb);
        });
    }

    var knockoutPage = Page.extend({
        id: 'knockoutPage',
        limitOrient: false,
        serverUrl: 'http://pleasure-back-env-pgjp3eennr.elasticbeanstalk.com',
        //serverUrl: 'http://10.0.0.24:8081',

        init: function(){
            this._super();
            _bindAll(this, "beginName", "showNameError", "handleAddRecording", "handleRecordPlay", "handleRecordRemove", "clearRecordings", "playRecordings", "stopRecordings", "playCries", "stopCries", "end", "onTap", "showTitle");

            this.selector = this.el.find("#knockSelector");
            this.nameContainer = this.el.find("#knockNameContainer");

            this.nameBtn = this.el.find("#knockNameBtn");
            this.moodBtn = this.el.find("#knockMoodBtn");
            this.cryBtn = this.el.find("#knockCryBtn");
            this.skipBtn = this.el.find("#knockSkipBtn");

            this.nameAddBtn = this.el.find("#knockNameAddBtn");
            this.nameFileEl = this.el.find("#knockFileEl");
            this.nameEndBtn = this.el.find("#knockNameEndBtn");
            this.recordings = this.el.find("#knockRecordings");
            this.nameForm = this.el.find("#knockNameForm");
            this.nameMessages = this.el.find("#knockNameMessages");
            this.recs = [];
            this.cries = [            
                new Howl({urls:['alerts/baby-crying-01.mp3']}),
                new Howl({urls:['alerts/baby-crying-02.mp3']}),
                new Howl({urls:['alerts/baby-crying-03.mp3']}),
                new Howl({urls:['alerts/baby-crying-04.mp3']}),
                new Howl({urls:['alerts/baby-crying-05.mp3']})
            ];
            this.nameAlert = null;
            this.titles = [
                'In the following screen, you will be prompted to select atleast 5 recordings of yourself speaking your name. Try and vary your tone in each recording (ex. happy, sad, angry, excited, funny).',
                'Tap the <span class="instr-green">Add</span> button to select an existing recording from your device, or simply record a new video.',
                'Wait for a second after hitting the record button. Then speak your name as clearly as possible into the microphone of your device.',
                'Once you select a recording, it will be converted and saved under your name for your own use in future trials.',
                'After your recording is processed, it will show up in a list, where you can play or delete each inidividual recording. Once you\'re happy with your selections, tap the <span class="instr-purple">Continue</span> button to proceed.'
                //'<span class="strong">When you\'re ready, place two fingers to begin.</span>'
            ];
            this.titleIndex = 0;
            this.titleCont = this.el.find("#knockNameTitlesCont");
            this.titlesText = this.el.find("#knockNameTitles");
            this.tap = this.el.find("#knockNameTap");

            var self = this;
            new MBP.fastButton(this.nameBtn, function(e){
                e.preventDefault();
                transEl(self.selector, self.nameContainer, 400, self.beginName);
                self.showTitle();
            });
            new MBP.fastButton(this.moodBtn, function(e){
                e.preventDefault();
                config.knockout = 'mood';
                self.end();  
            });
            new MBP.fastButton(this.cryBtn, function(e){
                e.preventDefault();
                config.knockout = 'cry';
                self.end();  
            });
            this.skipBtn.on('touchstart', this.end);

            this.nameFileEl.addEventListener("change", this.handleAddRecording);
            this.nameAddBtn.on('touchstart', function(){ self.nameFileEl.value = null; self.nameFileEl.click(); });
            new MBP.fastButton(this.nameEndBtn, this.end);
        },

        loadCries: function() {
            this.cries = shuffle(this.cries);
        },

        render: function(){
            this.recs = [];
            $(this.selector).find(".btn").each(function(i,e){
                $(e).css({display:'none', 'border-radius': 0});
            });
            var btns = ["#knockSkipBtn"];

            if(config.options.nameSelect === true){btns.push("#knockNameBtn")}
            if(config.options.moodSelect === true){btns.push("#knockMoodBtn")}
            if(config.options.crySelect === true){btns.push("#knockCryBtn")}

            if(btns.length == 1) {
                return this.end();
            }

            btns.forEach(function(b) {
                $(b).css({display:'inline-block', width: (100/btns.length) + '%'});
            })
            $(btns[0]).css({'border-radius': '3px 0 0 3px'});
            $(btns[btns.length - 1]).css({'border-radius': '0 3px 3px 0'});

            this.selector.style.display = "block";
            this.selector.style.opacity = 1;
            this.nameContainer.style.display = "none";
            this.nameContainer.style.opacity = 0;
            this.recordings.innerHTML = '<div class="page page-center" style="width:60px;height:64px"><div class="big-loader"></div></div>'
            this.nameMessages.innerHTML = '';
            $(this.titleCont).css({display:'block', opacity:1});
            this.titleIndex = 0;
        },

        onTap: function(e){
            e.preventDefault();
            var self = this;
            window.removeEventListener('touchstart', this.onTap);

            $(this.tap).velocity({opacity:0}, 100);
            $(this.titlesText).velocity({opacity:0}, 100, function(){
                self.titleIndex++;
                
                if(self.titleIndex == self.titles.length){ 
                    $(self.titleCont).velocity({opacity:0}, 200, function(){
                        $(self.titleCont).css({display:'none'});
                    });
                }
                else{
                    self.showTitle();
                }
            });
        },

        showTitle: function(){
            var self = this;
            this.titlesText.innerHTML = this.titles[this.titleIndex];
            $(this.titlesText).velocity({opacity:1}, 500, function(){
                //setTimeout(function(){
                    $(self.tap).velocity({opacity: 1}, 100, function(){
                        window.addEventListener('touchstart', self.onTap);
                    });
                //}, 50);                    
            });
        },

        end: function(){
            if(this.recs.length > 0) {
                this.recs = shuffle(this.recs);    
            }
            
            if(config.options.musicSelect){
                PageController.transition("stimulus");                    
            }
            else{
                PageController.transition("calibration", function(){
                    this.begin("setup");
                });                    
            }     
        },

        handleAddRecording: function(){
            if(this.nameAlert){
                $(this.nameAlert).remove();
                this.nameAlert = null;
            }
            $(this.nameAddBtn).prop("disabled", true);
            $(this.nameAddBtn).text("Processing");
            var formData = new FormData(this.nameForm);
            var self = this;
            $.ajax({
                url: this.serverUrl + '/convert?q=' + encodeURIComponent(config.name),  //Server script to process data
                type: 'POST',
                timeout:20000,
                success: function(e){
                    if(e.error){
                        self.showNameError('There was an error processing the recording.');
                    }
                    else{
                        self.createRecording(e.path);
                    }
                },
                error: function( jqXHR, textStatus, errorThrown){
                    self.showNameError('There was an error contacting the server.');
                },
                complete: function(){
                    $(self.nameAddBtn).text("Add");
                    $(self.nameAddBtn).prop("disabled", false);
                },
                data: formData,
                cache: false,
                contentType: false,
                processData: false
            }); 
        },

        showNameError: function(msg){
            var error = $('<div class="knock-msg msg-error">' + msg + '</div>');
            error.css('height', '0');
            $(this.nameMessages).append(error);
            setTimeout(function(){error.velocity({height: '42px'}, [80, 12]);},5);
            setTimeout(function(){
                error.velocity({height: 0}, 300, function(){
                    error.remove();
                });
            }, 3000);
        },

        createRecording: function(url){
            var howl = new Howl({urls:[(this.serverUrl + '/' + url)] });
            howl.__path = url;
            this.recs.push(howl);

            var rec = $('<div class="knock-rec row"><span class="rec-btn col"></span><span class="rec-remove-btn col-right"></span></div>');
            rec.css('height', '0');
            $(this.recordings).append(rec);
            setTimeout(function(){$(rec).velocity({height: '75px'}, [ 80, 8 ]);},5);
            (rec.find('.rec-btn')[0]).on('touchstart', this.handleRecordPlay);
            (rec.find('.rec-remove-btn')[0]).on('touchstart', this.handleRecordRemove);
        },

        beginName: function(){
            config.knockout = 'name';
            var self = this;
            $.ajax({
                url: this.serverUrl + '/converted?q=' + encodeURIComponent(config.name), 
                type: 'GET',
                success: function(recs){
                    self.recordings.innerHTML = '';
                    if(recs.length > 0){
                        for(var i = 0; i<recs.length; i++){
                            self.createRecording(recs[i]);
                        }

                        self.nameAlert = $('<div class="knock-msg msg-alert row"> \
                            <div class="col"><span style="font-weight:bold">' + recs.length + '</span> recording' + ((recs.length == 1) ? ' was' : 's were') + ' found for your name.</div> \
                            <div class="knock-msg-btn col-right">clear all</div> \
                            </div>');  
                        self.nameAlert.css('bottom', '-42px');
                        $(self.nameMessages).append(self.nameAlert);
                        setTimeout(function(){self.nameAlert.velocity({bottom: 0}, [80, 12]);},5);
                        (self.nameAlert.find('.knock-msg-btn')[0]).on('touchstart', _bind(self.clearRecordings, self, function(){
                            self.nameAlert.velocity({bottom: '-42px'}, [80, 12], function(){
                                $(self.nameAlert).remove();
                                self.nameAlert = null;                                
                            });
                        }));      
                    }
                },

                error: function(){
                    self.recordings.innerHTML = '';
                    self.showNameError('There was an error contacting the server.');
                },

            });
        },

        clearRecordings: function(cb){
            var self = this;
            $.post(this.serverUrl + '/remove?type=all&name=' + encodeURIComponent(config.name), function(){
                self.recordings.innerHTML = '';
                self.recs = [];
                cb();
            });
        },


        handleRecordPlay: function(e){
            var $el = $(e.target);
            var rec = this.recs[$el.parent().index()];

            if($el.hasClass('rec-pause')){
                $el.removeClass('rec-pause');
                rec.stop();
            }
            else{
                $el.addClass('rec-pause');
                rec.on('end', function(){
                    rec.off('end');
                    $el.removeClass('rec-pause');
                });
                rec.play();
            }
        },

        handleRecordRemove: function(e){
            e.preventDefault();
            if(this.nameAlert){
                $(this.nameAlert).remove();
                this.nameAlert = null;
            }
            var $rec = $(e.target).parent();
            var index = $rec.index();
            var self = this;
            $.post(this.serverUrl + '/remove?type=one&name=' + encodeURIComponent(this.recs[index].__path), function(){
                $rec.velocity({height: 0}, 200, function(){
                    $rec.remove();
                    self.recs.splice(index,1);
                });
            });
        },


        playRecordings: function(i) {
            if(this.recs.length == 0) return;
            if(i >= this.recs.length){
                this.recs = shuffle(this.recs);
                i = 0;
            }
            var self = this;
            var rec = this.recs[i];
            //rec.pos(0);
            rec.on('end', function(){
                rec.off('end');
                self.playRecordings(i+1);
            });
            rec.play();
        },

        stopRecordings: function() {
            for(var i = 0; i<this.recs.length; i++){
                var rec = this.recs[i];
                rec.off('end');
                rec.stop();
            }
        },

        playCries: function(i) {
            if(i >= this.cries.length){
                this.cries = shuffle(this.cries);
                i = 0;
            }
            var self = this;
            var cry = this.cries[i];
            cry.on('end', function(){
                cry.off('end');
                self.playCries(i+1);
            });
            cry.play();
        },

        stopCries: function() {
            for(var i = 0; i<this.cries.length; i++){
                var cry = this.cries[i];
                cry.off('end');
                cry.stop();
            }
        },

    });

    var moodPage = Page.extend({
        id: 'moodPage',

        init: function(){
            this._super();
            _bindAll(this, 'onTap', 'onEnd', 'abort', 'showTitle');

            this.titles = [
                'Make yourself comfortable, and focus your attention on the instructions you are about to see.',
                'Imagine a situation that you think would make you feel sad. It could be a hypothetical situation, or a real event in your past.',
                'Imagine the situation as vividly as you can. Picture the events happening to you.',
                'See all the details of the situation. See the people or the objects; hear the sounds; think the thoughts you would actually think in this situation.',
                'Feel the same sad feelings you would feel. Let yourself react as if you were actually there.',
                'Keep imagining the situation until i say <b>"Done"</b>'];
            this.titleIndex = 0;
            this.timer = this.el.find('.timer');
            this.tap = this.el.find('#moodTap');
            this.titlesText = this.el.find('#moodTitles');
            this.timeout = null;
                
        },

        render: function(){
            this.timer.style.display = 'none';
            this.titlesText.style.opacity = 0;
            this.tap.style.opacity = 0;
            this.titleIndex = 0;
            this.showTitle();
        },

        end: function(){
            window.removeEventListener('touchstart', this.abort);
            PageController.transition("experiment", function(){
                this.begin();
            });           
        },

        onTap: function(e){
            e.preventDefault();
            window.removeEventListener('touchstart', this.onTap);

            var self = this;
            $(this.tap).velocity({opacity:0}, 100);
            $(this.titlesText).velocity({opacity:0}, 100, function(){
                self.titleIndex++;
                
                if(self.titleIndex == self.titles.length ){ 
                    self.timer.style.display = 'block';
                    drawTimer(self.timer, config.options.moodDuration);
                    self.timeout = setTimeout(self.onEnd, config.options.moodDuration * 1000);   // 3 minutes
                    window.addEventListener('touchstart', self.abort);
                }
                else{
                    self.showTitle();
                }
            });
        },

        abort: function(e){
            e.preventDefault();
            if(e.touches.length == 3){
                clearTimeout(this.timeout);
                this.timer.style.display = 'none';
                this.end();
            }
        },

        onEnd: function(){
            this.timer.style.display = 'none';
            this.titlesText.innerHTML = '<span class="strong" style="font-size:2em;font-weight:normal">Done</span>';
            
            var self = this;
            notifier.play("done");
            $(self.titlesText).velocity({opacity:1}, 200, function(){
                setTimeout(function(){
                    self.end();
                }, 1000);
            });

        },

        showTitle: function(){
            var self = this;
            this.titlesText.innerHTML = this.titles[this.titleIndex];
            $(this.titlesText).velocity({opacity:1}, 150, function(){
                setTimeout(function(){
                    $(self.tap).velocity({opacity: 1}, 300, function(){
                        window.addEventListener('touchstart', self.onTap);
                    });
                }, 100);                    
            });
        }
    });

    var bufSource;

    var musicPlayer = Page.extend({
        id:'musicPage',
        limitOrient: false,

        init: function(){
            this._super();
            _bindAll(this, 'playWhiteNoise', 'stop', 'onMessage', 'playSong', 'stopSong', 'updateWaitTime', 'startBuffering');
            this.catcher = new Worker('js/audiocatcher.js');

            this.waitTime = this.el.find("#musicTime");
            this.timeTimeout = null;

            this.catcher.addEventListener('message', this.onMessage);
        },

        render: function(){
            this.buffcb = null;
            this.soundNode = null;
            this.playing = false;
            this.started = false;
            this.ended = false;
            this.playQueue = [];
            if(config.songUri == 'whitenoise'){
                if(config.knockout == 'mood'){
                    PageController.transition("mood");
                }
                else{
                    PageController.transition("experiment", function(){
                        this.begin();
                    });                     
                }
                return true;
            }
            this.catcher.postMessage({type:'req', url: config.songUri, dur: config.options.duration, _dur: config.options.duration + ((config.knockout == 'mood') ? config.options.moodDuration : 0) });
        },

        onMessage: function(e){
            var data = e.data;

            if(data.type == 'audio'){
                var buffer = AUDIOCTX.createBuffer(2, data.left.length, 44100);
                buffer.getChannelData(0).set(data.left, 0);
                buffer.getChannelData(1).set(data.right, 0);
                this.playQueue.push(buffer);
                if(!this.started){
                    if(this.playQueue.length >= Math.min(3, config.options.duration) && this.buffcb){
                        this.buffcb();
                        this.buffcb = null;
                    }
                }
                else if(!this.playing && !this.ended){
                    this.playSong();
                }        
            }
            else{
                if(data.type == "error"){
                }
                else if(data.type == "warn"){;
                }
                else if(data.type == "end"){
                    this.ended = true;
                    this.started = false;
                }
                else if(data.type == "status"){
                    if(data.msg == 'canplay' && PageController.curPageName === 'music'){
                        if(config.knockout == 'mood'){
                            PageController.transition("mood"); 
                        }
                        else{
                            PageController.transition("experiment", function(){
                                this.begin();
                            }); 
                        }
                    }
                    else if(data.msg == 'inqueue'){
                        clearTimeout(this.timeTimeout);
                        this.updateWaitTime(data.dur);
                        this.waitTime.style.display = "block";
                    }
                }
            }         
        },

        updateWaitTime: function(time){
            if(time == 0){
                this.catcher.postMessage({type:'status'});
            }
            var minutes = Math.floor(time / 60);
            var seconds = time - minutes * 60;
            this.waitTime.innerHTML = minutes + ':' + ("0" + seconds).slice(-2);
            this.timeTimeout = setTimeout(_bind(this.updateWaitTime, this, ((time <= 0) ? 0 : time-1 )),1000);          
        },

        playWhiteNoise: function(){

            var bufferSize = 2 * AUDIOCTX.sampleRate,
                noiseBuffer = AUDIOCTX.createBuffer(1, bufferSize, AUDIOCTX.sampleRate),
                output = noiseBuffer.getChannelData(0);
            for (var i = 0; i < bufferSize; i++) {
                output[i] = Math.random() * 2 - 1;
            }

            var whiteNoise = AUDIOCTX.createBufferSource();
            whiteNoise.buffer = noiseBuffer;
            whiteNoise.loop = true;
            whiteNoise.start(0);

            var gainNode = AUDIOCTX.createGain();
            gainNode.gain.value = 0.1;

            whiteNoise.connect(gainNode);
            gainNode.connect(AUDIOCTX.destination);

            this.playing = true;
            this.soundNode = whiteNoise;     
        },

        startBuffering: function(cb){
            this.buffcb = cb;
            this.catcher.postMessage({type:'play'});
        },

        playSong: function(trackURI){
            if(this.playQueue.length === 0 ) return;
            if(!this.started){
                this.started = true;
                this.ended = false;
            }
            var buf = this.playQueue.shift();
            bufSource = AUDIOCTX.createBufferSource();
            bufSource.buffer = buf;
            var self = this;
            bufSource.onended = function(){
                self.playing = false;
                self.playSong();  
            }
            bufSource.connect(AUDIOCTX.destination);
            bufSource.noteOn(0);
            this.playing = true;
        },

        playMusic: function(trackURI, duration){
            if(this.playing){
                this.stop();
            }    

            if(trackURI == "whitenoise"){
                this.playWhiteNoise();
            }
            else{
                this.playSong();
            }

            if(duration){
                var self = this;
                setTimeout(function(){
                    self.stop();
                }, duration * 1000);
            }

        },

        stopSong: function(){
            if(!this.ended){
                this.catcher.postMessage({type:'stop'});
            }   
            bufSource.disconnect();
            bufSource = null;
            this.playQueue = [];
            this.ended = true;
            this.started = false;
        },

        stop: function(){
            if(!this.playing) return;

            this.playing = false;

            if(this.soundNode){
                this.soundNode.disconnect();
                this.soundNode = null;
            }
            else{
                this.stopSong();
            }
        }
    });


    var stimulusPage = Page.extend({
        id: 'stimulusPage',
        limitOrient: false,

        init: function(){
            this._super();

            _bindAll(this, 'findSongs', 'submitSong', 'selectSong');

            this.songInput = this.el.find('#songInput');
            this.songList = this.el.find('#songList');
            this.searchBtn = this.el.find("#songSearchBtn");
            this.submit = this.el.find('#stimulusSubmit');
            this.loader = this.el.find('#songLoader');
            this.select = this.el.find("#stimulusSelect");
            this.finalText = this.el.find(".stimulus-final-text");
            this.instructions = '<div class="song-info">Type in the title of your favorite music above and hit the search button. Narrow down the results by adding the name of the artist/album.</div>';

            this.curSong = null;

            new MBP.fastButton(this.searchBtn, this.findSongs);
            var self = this;
            $(this.el).on('touchstart', '.song', this.selectSong);
            $(this.songInput).on('focus', function(){
                self.select.style.position = 'static';
            });
            $(this.songInput).on('blur', function(){
                self.select.style.position = 'fixed';
            });
            new MBP.fastButton(this.submit, this.submitSong);
        },

        render: function(){
            $(this.submit).prop('disabled', true);
            this.songList.innerHTML = this.instructions;
            if(this.curSong){
                $(this.curSong).removeClass('selected selected-warning');
                this.curSong = null;
            }
            this.loader.style.display = 'none';
        },

        selectSong: function(e){
            e.preventDefault();
            if(!e.currentTarget) return false;
            if(this.curSong){
                $(this.curSong).removeClass('selected selected-warning');
            }

            this.curSong = e.currentTarget;
            var curSongDuration = ($(this.curSong).data("uri") == "whitenoise") ? config.options.durationWhiteNoise : +(this.curSong.find('.song-duration').innerHTML);

            if( curSongDuration > config.options.duration ){
                $(this.finalText).addClass('stimulus-warning');
                $(this.curSong).addClass("selected-warning");
            }
            else{
                $(this.finalText).removeClass('stimulus-warning');
                $(this.curSong).addClass("selected");
            }
            $(this.submit).prop('disabled', false);
        },

        findSongs: function(e){
            e.preventDefault();

            var self = this;
            var query = $(this.songInput).val().trim();

            $(this.curSong).removeClass('selected selected-warning');
            this.curSong = null;
            $(this.submit).prop('disabled', true);

            if( query === '' ){
                self.songList.innerHTML = this.instructions;
                return false;
            } 

            this.searchBtn.style.display = "none";
            this.loader.style.display = "block";
            $.ajax({
                type: "GET",
                url: "https://api.spotify.com/v1/search?q=" + encodeURIComponent(query) + "&type=track&limit=5",
                success: function(res){
                    self.loader.style.display = "none";
                    self.searchBtn.style.display = "block";

                    var tracks = res.tracks.items;
                    if(tracks.length == 0){
                        self.songList.innerHTML = '<span class="song-info">No tracks found for <b>' + query + '</b>.</span>';
                    }
                    else{
                        self.songList.innerHTML = '';
                        for(var i = 0; i < tracks.length; i++){
                            $(self.songList).append('<div class="song" data-uri="' +  tracks[i].uri + '"> <div class="song-duration">' + Math.round(tracks[i].duration_ms/1000) + '</div><div class="song-title">' + tracks[i].name + '</div> <div class="song-meta"> <span class="song-artist">' + tracks[i].artists[0].name + '</span>  <span class="song-album">' + tracks[i].album.name + '</span></div></div>');
                        }                        
                    }
                },
                error: function(res) {
                    self.loader.style.display = "none";
                    self.searchBtn.style.display = "block";
                    self.songList.innerHTML = '<span class="song-info">There was an error finding songs.</span>';
                }
            }); 
        },

        submitSong: function(e){
            e.preventDefault();
            if(!this.curSong) return false;

            var uri = $(this.curSong).data("uri");
            if(uri === 'whitenoise'){
                config.songUri = 'whitenoise';
                config.songName = 'White Noise';
                config.songArtist = '';
                config.songAlbum = '';
                config.songDuration = +config.options.durationWhiteNoise;
            }
            else{
                config.songUri = uri;
                config.songName = this.curSong.find('.song-title').innerHTML;
                config.songArtist = this.curSong.find('.song-artist').innerHTML;
                config.songAlbum = this.curSong.find('.song-album').innerHTML;
                config.songDuration = +this.curSong.find('.song-duration').innerHTML;
            }
            PageController.transition("calibration", function(){
                this.begin("setup");
            });
        }

    });



    var getOrientation = function(){
        if(Math.abs(window.orientation) === 90 || window.innerWidth > window.innerHeight){
            return 'landscape';
        }
        return "portrait";
    }


    var BubbleView = View.extend({

        bubble: function(){
            this.x = 0;
            this.y = 0;
            this.r = 40;
            this.circle = null;
            this.selected = false;
            this.update = function(){
                this.circle.attr("cx", this.x);
                this.circle.attr("cy", this.y);
                //this.line.attr("path", "M" + window.innerWidth/2 + " " + window.innerHeight/2 + "L" + this.x + " " + this.y);
            };

            this.toggleSelected = function(){
                if(this.selected !== false){
                    this.circle.animate({
                        "fill-opacity": 0.2,
                        "r": 40
                    }, 100, "bounce");  
                    this.selected = false;                      
                }
                else{
                    this.circle.animate({
                        "fill-opacity": 0.6,
                        "r": 60
                    }, 80, "bounce");
                    this.selected = true;                   
                }
            };
        },

        init: function(options){
            this._super(options);
            this.paper = Raphael(this.el, window.innerWidth, window.innerHeight);
            this.initialized = false;
            this.register('initialized');
            if(getOrientation() == 'landscape'){
                this.initPaper();
            }
        },

        initPaper: function(callback){
            window.scrollTo( 0, 1 ); 
            this.paper.setSize(window.innerWidth, window.innerHeight);
            this.initialized = true;
            this.el.style.opacity = 1;

            var shapes = this.shapes = {};

            shapes.bubbles = [new this.bubble(), new this.bubble()];
            shapes.bubbles[0].x = window.innerWidth/2 - 40;
            shapes.bubbles[1].x = window.innerWidth/2 + 40;
            shapes.bubbles[0].y = shapes.bubbles[1].y = window.innerHeight/2;
            shapes.bubbles.selected = function(){
                return (this[0].selected !== false && this[1].selected !== false);
            }; 
            shapes.bubbles.distance = function(){
                return getDistance(this[0].x, this[0].y, this[1].x, this[1].y);
            }; 

            shapes.joinLine = this.paper.path('');
            shapes.joinLine.attr('stroke', '#c6003b');
            shapes.joinLine.attr('stroke-opacity', 0);
            shapes.joinLine.bubbles = shapes.bubbles;
            shapes.joinLine.updatePos = function(){
                this.attr("path", "M" + this.bubbles[0].x + " " + this.bubbles[0].y + "L" + this.bubbles[1].x + " " + this.bubbles[1].y);
            };
            shapes.joinLine.updatePos(); 

            var self = this;
            shapes.bubbles.forEach(function(b){
                b.circle = self.paper.circle(b.x, b.y, b.r);
                b.circle.attr('fill', 'rgb(216, 0, 57)');
                b.circle.attr('fill-opacity', 0);
                b.circle.attr('stroke', 'none');

                //b.line = self.paper.path('');
                //b.line.attr('stroke', '#000');
                //b.line.attr('stroke-opacity', 0.1);
                b.update();

                b.circle.animate({
                    'fill-opacity': 0.2
                },300);
            });

            shapes.joinLine.animate({
                'stroke-opacity': 1
            }, 200, 'linear', callback);

            this.trigger('initialized');
        },

        handleResize: function(){
            if(!this.initialized && getOrientation() == 'landscape'){
                this.initPaper();
            }
        },

        sortBubbles: function(touch) {
            this.shapes.bubbles.sort(function(a,b) {
                var da = getDistance(a.x, a.y, touch.x, touch.y);
                var db = getDistance(b.x, b.y, touch.x, touch.y);

                if(da < db) {
                    return -1;
                }
                else if(da > db) {
                    return 1;
                }
                return 0;
            });
        },

        onTouchStart: function(touch){
            var b;
            this.sortBubbles(touch);
            for(var i = 0; i < 2; i++){
                b = this.shapes.bubbles[i];
                if(b.selected === false){
/*                    if(this.drag && !b.circle.isPointInside(touch.x, touch.y)){
                        continue;
                    }*/
                    b.x = touch.x;
                    b.y = touch.y;
                    b.update();
                    b.toggleSelected();
                    b.selected = touch.id;
                    this.shapes.joinLine.updatePos();
                    break;
                }                    
            }
        },

        onTouchMove: function(touch){
            var b;
            this.sortBubbles(touch);
            for(var i = 0; i < 2 ; i++){
                b = this.shapes.bubbles[i];
                if(b.selected === touch.id){
                    b.x = touch.x;
                    b.y = touch.y;
                    b.update();
                    this.shapes.joinLine.updatePos();
                    break;
                }
            } 
        },

        onTouchEnd: function(touch){
            var b;
            this.sortBubbles(touch);
            for(var i = 0; i < 2 ; i++){
                b = this.shapes.bubbles[i];
                if(b.selected === touch.id){
                    b.toggleSelected();
                    break;
                }
            }
        }
    });


    var calibrationPage = DoubleTouchPage.extend({

        id: 'calibrationPage',

        trials: [{
            title: 'Indicate <span class="strong">maximum</span> pleasure.',
            instr: 'Using two fingers, drag the pink dots as far apart as comfortably possible.',
            configVar: 'Max'
        }, {
            title: 'Indicate <span class="strong">minimum</span> pleasure.',
            instr: 'Using two fingers, drag the pink dots to whatever spread is most natural, requiring least effort.',
            configVar: 'Min'
        }],

        init: function(){
            this._super();
            _bindAll(this, 'beginTrials', 'onTap');

            this.tracker = this.el.find('#calibTracker');
            this.titleText = this.el.find('#calibTitle');
            this.instrText = this.el.find('#calibInstr');
            this.titlesText = this.el.find('#calibTitles');
            this.titlesCont = this.el.find('#calibTitlesCont');
            this.tapText = this.el.find('#calibTap');

            this.feedbacks = new Feedbacks({el:this.el, disableBarbell:true});
        },

        handleResize: function(){
            this.el.style.width = window.innerWidth + 'px';
            this.el.style.height = window.innerHeight + 'px';

            if(this.bubbles){
                this.bubbles.handleResize();
            }
        },

        generateQueue: function(steps){
            var queue = [];
            for(var i = 0; i<2*steps; i++){
                if(i%2 == 0){
                    queue.push(1);
                } 
                else{
                    queue.push(0);
                } 
            }
            queue.pop();
            return queue;
        },

        onTap: function(e){
            e.preventDefault();
            var self = this;
            if(getOrientation() == 'portrait'){
                return false;
            }
            window.removeEventListener('touchstart', this.onTap);

            $(this.tapText).velocity({opacity:0}, 100);
            $(this.titlesText).velocity({opacity:0}, 100, function(){
                $(self.titlesText).hide();
                self.titleIndex++;
                
                if(self.titleIndex == self.titleTexts[self.trialParams.phase][self.titlePhase].length ){                    
                    if(self.titlePhase == 'start'){
                        self.beginPre();
                    }   
                    else if(self.titlePhase == 'mid'){
                        self.titleTexts[self.trialParams.phase].afterMid();
                    }
                    else if(self.titlePhase == 'end'){
                        self.titleTexts[self.trialParams.phase].onEnd();
                    }       
                }
                else{
                    self.showTitle();
                }
            });
        },

        showTitle: function(){
            var self = this;
            $(this.titlesCont).css({display: 'table'});

            this.titlesText.innerHTML = this.titleTexts[this.trialParams.phase][this.titlePhase][this.titleIndex];
            $(this.titlesText).show();
            $(this.titlesText).velocity({opacity:1}, 150, function(){

                //setTimeout(function(){
                    $(self.tapText).velocity({opacity: 1}, 300, function(){
                        window.addEventListener('touchstart', self.onTap);
                    });
                //}, 50);                    
            });
        }, 

        begin: function(phase){
            var self = this;

            this.trialParams = {
                queue: self.generateQueue(config.options[phase + 'Steps']),
                cur: -1,
                step: 1,
                index: 1,
                maxSteps: config.options[phase + 'Steps'],
                phase: phase,
                verify: (phase == 'post') ? false : true,
            }

            this.titleTexts = {
                'setup':{
                    start:[
                        '​This app lets you use your fingers to make pleasure ratings. You indicate how much pleasure you​\'re​ feel​ing​ by how much you spread your fingers. ' + ((config.options.fingers === 0) ? 'Please use your thumb and index fingers.' : 'Please use your first two fingers: index and middle finger.'),
                        'First, we must calibrate your fingers. When you see the pink dots on the next screen, place and hold your fingertips on the screen. The pink dots will follow your fingertips.',
                        '​You will <b>indicate maximum pleasure by spreading your fingers as far apart as you can comfortably maintain</b>. When you’ve achieved that, make your rating by lifting your fingers away from the screen.'
                    ],
                    mid: [
                        'Next, indicate <b>minimum</b> pleasure by <b>relaxing</b> your two fingers to whatever spread feels <b>most natural and requires least effort</b>. When you’ve achieved that, make your rating by lifting your fingers away from the screen.'
                    ],
                    end:[],
                    afterMid: function(){
                        self.startTrial(1);
                    },
                    onEnd: function(){
                        updateRater(config);
                        self.begin('pre');
                    }
                },
                'pre':{
                    start: [
                        'Next we\'ll practice making ratings. We encourage you to play during practice.',
                        'In the actual experiment, later, you\'ll be spreading your fingers to continually rate pleasure. You can play now, to get used to it. On the next screen, try spreading and closing your fingers. Once the setting is right, lift your fingers to proceed.'        
                    ],
                    end: [],
                    onEnd: function(){
                        updateRater(config);
                        if(config.options.musicSelect){
                            PageController.transition("music");                    
                        }
                        else{
                            if(config.knockout == 'mood'){
                                PageController.transition("mood"); 
                            }
                            else{
                                PageController.transition("experiment", function(){
                                    this.begin();
                                }); 
                            }                   
                        }
                    }
                },
                'post':{
                    start: [ 'Prepare for the final practice ratings.' ],
                    end: [],
                    onEnd: function(){
                        updateRater(config);
                        PageController.transition("complete");
                    }
                }
            };

            if(phase == 'setup'){
                config.refValid = config.options.skipRepeat 
                    && (new Date()).getTime() < config.refValid 
                    && config.refExperiment === config.experiment
                    && config.refObserver === config.name;
                rater = (function(){
                    return{
                        getRating: function(){
                            return (self.trialParams.cur == 0) ? 10 : config.options.minRating;
                        }
                    };
                })();
            }

            if(config.options[phase + 'Steps'] == 0 || config.refValid){
                return this.titleTexts[phase].onEnd();
            }

            if(config.options.feedback.auditory || config.options.feedback.tactile){
                this.titleTexts['pre'].start[1] += ' Adjust the volume of your device to be comfortable.';
            }

            this.titleText.style.opacity = 0;
            this.instrText.style.opacity = 0;
            this.tracker.innerHTML = '';

            if(this.titleTexts[phase].start.length > 0){
                this.titlePhase = 'start';
                this.titleIndex = 0;
                this.showTitle();
            }
            else{
                this.beginPre();
            }
        },

        beginPre: function(){
            this.bubbles = new BubbleView({el: this.tracker, drag: false});

            if(this.bubbles.initialized){
                this.beginTrials();
            }
            else{
                this.bubbles.on('initialized', this.beginTrials);
            }
        },

        beginTrials: function(){  

            if(this.trialParams.phase == 'setup'){
                config.windowWidth = window.innerWidth;
                config.windowHeight = window.innerHeight;
            }       

            this.feedbacks.enable();
            window.addEventListener('touchmove', this.handleTouchMove);
            window.addEventListener('touchend', this.handleTouchEnd);
            window.addEventListener('touchcancel', this.handleTouchEnd); 

            this.startTrial(0); 
        },

        end: function(){
            this.feedbacks.disableAll();
            window.removeEventListener('touchmove', this.handleTouchMove);
            window.removeEventListener('touchend', this.handleTouchEnd);
            window.removeEventListener('touchcancel', this.handleTouchEnd);  

            var self = this;
            $(this.instrText).velocity({opacity: 0}, 50, function(){
                $(self.titleText).velocity({opacity: 0}, { duration: 200, queue: false });
                $(self.tracker).velocity({opacity: 0}, { duration: 200, queue: false, 
                    complete: function(){
                        self.bubbles.paper.clear();

                        if(self.titleTexts[self.trialParams.phase].end.length > 0){
                            self.titlePhase = 'end';
                            self.titleIndex = 0;
                            self.showTitle();
                        }
                        else{
                            window.removeEventListener('touchstart', this.onTap);
                            self.titleTexts[self.trialParams.phase].onEnd();
                        }
                   
                    }
                });
            });
        },

        conceal: function(){
            $(this.completePage).hide();
        },

        startTrial: function(trialIndex){
            window.removeEventListener('touchstart', this.onTap);
            $(this.titlesCont).css({display: 'none'});

            var trial = this.trials[trialIndex];

            this.trialParams.cur = trialIndex;

            this.titleText.innerHTML = trial.title;
            this.instrText.innerHTML = trial.instr;

            this.bubbles.shapes.bubbles.forEach(function(b){
                b.circle.animate({
                    "fill": "rgb(216, 0, 57)"
                }, 200);   
            }); 
            window.addEventListener('touchstart', this.handleTouchStart);

            $(this.titleText).velocity({opacity: 1}, 200);
            $(this.instrText).velocity({opacity: 1}, 200);
            $(this.tracker).velocity({opacity: 1}, 200);
        },

        endTrial: function(){

            var self = this;

            window.removeEventListener('touchstart', this.handleTouchStart);
            this.bubbles.shapes.bubbles.forEach(function(b){
                b.circle.animate({
                    "fill": "#888"
                }, 200);   
            });

            var distance = this.bubbles.shapes.bubbles.distance(),
                tp = this.trialParams,
                trial = this.trials[tp.cur],
                phaseVar = tp.phase + trial.configVar + 'Dist';

            if(tp.step == tp.maxSteps && tp.maxSteps > 1 && tp.verify){
                if( Math.abs(distance - config[phaseVar].slice(-1)[0]) > 100 ){
                    tp.queue.push(tp.cur);
                }             
            }
            config[phaseVar].push(distance);
            if(tp.phase !== 'setup'){
                config['practice' + trial.configVar + 'Ratings'].push(rater.getRatingFromDist(distance));
            }

            if(tp.index % this.trials.length == 0){
                tp.step++;
            }
            tp.index++;

            if(tp.phase == 'setup' && tp.step == 1){
                $(this.instrText).velocity({opacity: 0}, 50, function(){
                    $(self.titleText).velocity({opacity: 0}, { duration: 200, queue: false });
                    $(self.tracker).velocity({opacity: 0}, { duration: 200, queue: false, complete: function(){
                        self.titlePhase = 'mid';
                        self.titleIndex = 0;
                        tp.queue.splice(0,1);
                        self.showTitle();
                    }});
                });
            }
            else if(tp.queue.length == 0){
                this.end();
            }
            else{
                $(self.instrText).velocity({opacity: 0}, 50, function(){
                    $(self.titleText).velocity({opacity: 0}, 100, function(){
                        self.startTrial(tp.queue.splice(0,1)[0]);
                    });
                });                
            }
        },

        onTouchStart: function(touch){
            notifier.play("contact");
            this.bubbles.onTouchStart(touch, this.touches);
        },

        onTouchMove: function(touch){
            this.bubbles.onTouchMove(touch, this.touches);
        },

        onTouchEnd: function(touch){
            notifier.play("contactLoss");
            this.bubbles.onTouchEnd(touch, this.touches);
            if(this.bubbles.doubleSelect && this.bubbles.shapes.bubbles[0].selected === false && this.bubbles.shapes.bubbles[1].selected === false){
                this.endTrial();
                this.bubbles.doubleSelect = false;
            }
        },

        handleDoubleTouchStart: function(){
            if(this.bubbles.shapes.bubbles.selected()){
                this.feedbacks.onStart(this.touches);
                this.bubbles.doubleSelect = true;
                $(this.instrText).velocity({opacity:0}, 50, _bind(function(){
                    this.instrText.innerHTML = 'Release both fingers to set.';
                    $(this.instrText).velocity({opacity:1}, 100);
                }, this));                 
            }
        },

        handleDoubleTouchMove: function(){
            if(this.bubbles.shapes.bubbles.selected()){
                this.feedbacks.onMove(this.touches);
            }
        },

        handleDoubleTouchEnd: function(){
            this.feedbacks.onEnd(this.touches);
        }

    });

    var generateExperimentString = function(){
        var time = config.experimentTime;
        var subjectParams = [config.experiment + ((config.aborted == true) ? ',ABORTED!' : ''), config.name, time.getFullYear(), time.getMonth() + 1, time.getDate(), time.getHours(), time.getMinutes(), time.getSeconds()];
        return subjectParams.join('.');        
    }

    var generateMailBody = function(){
        var html = ' \
            <h2> Results </h2> \
            <table> \
                <tr> <td>Experiment:</td> <td>' + config.experiment  + ((config.aborted == true) ? ',ABORTED!' : '') + '</td> </tr> \
                <tr> <td>Username:</td> <td>' + config.name + '</td> </tr> \
            </table> \
            <table><tr>' + getDateString(config.experimentTime) + '</tr></table>';
        return html;
    }

    var mailDataMandrill = function(data, callback){
        var msg = {
                "key": "DIE-Gm5EhIT4k_u8R-VhhQ",
                "message": {
                    "html": generateMailBody(),
                    "subject": '[Emotion Data] ' + generateExperimentString(),
                    "from_email": "emotion@tracker.edu",
                    "from_name": "Emotion Tracker",
                    "to": [
                        {
                            "email": config.options.email,
                            "name": "Experimenter",
                            "type": "to"
                        }
                    ],
                    "attachments": [
                        {
                            "name": generateExperimentString() + '.csv',
                            "type": "text/plain",
                            "binary": false,
                            "content": utf8_to_b64(data)
                        }
                    ],
                    "important": true
                },
                "async": false
        }   

        $.ajax({
            type: "POST",
            url: "https://mandrillapp.com/api/1.0/messages/send.json",
            data: JSON.stringify(msg),
            timeout: 10000,
            success: function(res){
                callback(res);
            },
            error: function(res) {
                callback(res);
            }
        });   
    }

    var generateMailLink = function(data){
        var subject = '[Emotion] ' + generateExperimentString(),
            body = data;
        
        body = body.replace(/\n/g, "%0D%0A");
        body = body.replace(/&/g, "%26");
        
        return ('mailto:' + config.options.email + '?subject=' + subject + '&body=' + body);    
    }

    var AuditoryFeedback = (function(){

        if(AUDIOCTX == null) return;
        var gainNode = AUDIOCTX.createGain();
        gainNode.connect(AUDIOCTX.destination); 
        gainNode.gain.value = .01; 
        var oscillator;

        return {
            getFrequencyFromRating: function(rating){
                rating += 1;
                return ( 440 * Math.pow(10, (0.1 * rating * (Math.log(4186.1/440) / Math.log(10) ) ) ) );
            },

            onStart: function(t, rating){
                if(AUDIOCTX == null) return;
                oscillator = AUDIOCTX.createOscillator();
                oscillator.frequency.value = this.getFrequencyFromRating(rating);
                oscillator.type = 0;
                oscillator.connect(gainNode); 
                oscillator.noteOn(0);
            },

            onMove: function(t, rating){
                oscillator.frequency.value = this.getFrequencyFromRating(rating);
            },

            onEnd: function(){
                oscillator.disconnect();
            }
        };

    })();

    var TactileFeedback = (function() {

        //_bindAll(this, 'start', 'stop', 'play');
        var frequency = 800,
            timeout = null;

        return {
            getFrequencyFromRating: function(rating){
                return 800 - (rating * 40);
            },

            start: function(){
                this.play();
            },

            stop: function(){
                clearTimeout(timeout);
                notifier.stop('click');
            },

            play: function(){
                notifier.play('click');
                var self = this;
                timeout = setTimeout(function(){self.play.call(self);}, frequency);
            },

            onStart: function(t, rating){
                this.stop();
                frequency = this.getFrequencyFromRating(rating);
                this.start();
            },

            onMove:function(t, rating){
                frequency = this.getFrequencyFromRating(rating);
            },

            onEnd: function(t, rating){
                this.stop();
            }            
        };

    })();


    var Feedbacks = View.extend({
        enabled: [],

        init: function(options){
            this._super(options);
        },

        enable: function(){
            this.enabled = [];
            if(config.options.feedback.numeric){
                this.enabled.push(new NumericFeedback({el:this.el.find('.numericFeedback')}));
            }
            if(config.options.feedback.range){
                this.enabled.push(new RangeFeedback({el:this.el.find('.rangeFeedback')}));
            }
/*            if(config.options.feedback.barbell && !this.disableBarbell){
                this.enabled.push(new BarbellFeedback({el:this.el.find('.barbellFeedback')}));
            }*/
            if(config.options.feedback.auditory){
                this.enabled.push(AuditoryFeedback);
            }
            if(config.options.feedback.tactile){
                this.enabled.push(TactileFeedback);
            }
            this.numEnabled = this.enabled.length;
        },

        onStart: function(touches){
            var rating = rater.getRating(touches);
            for(var i = 0; i<this.numEnabled; i++){
                this.enabled[i].onStart(touches, rating);
            }
        },

        onMove: function(touches){
            var rating = rater.getRating(touches);
            for(var i = 0; i<this.numEnabled; i++){
                this.enabled[i].onMove(touches, rating);
            }
        },

        onEnd: function(touches){
            var rating = (touches) ? rater.getRating(touches) : config.options.minRating;
            for(var i = 0; i<this.numEnabled; i++){
                this.enabled[i].onEnd(touches, rating);
            }
        },

        disableAll: function(){
            this.onEnd();
            this.enabled = [];
            this.numEnabled = 0;
        }
    });


    var NumericFeedback = View.extend({

        init: function(options){
            this._super(options);
            this.el.style.width = window.innerHeight*0.20 + 'px';
        },

        onStart: function(t, rating){
            this.el.innerHTML = Math.round(rating);
        },

        onMove: function(t, rating){
            this.el.innerHTML = Math.round(rating);
        },

        onEnd: function(t, rating){
            this.el.innerHTML = '';
        }
    });

    var RangeFeedback = View.extend({
        init: function(options){
            this._super(options);
            this.colors = [
                '#c0392b',
                '#e74c3c',
                '#d35400',
                '#e67e22',
                '#f39c12',
                '#f1c40f',
                '#2ecc71',
                '#27ae60',
                '#1abc9c',
                '#16a085',   
                '#16a085'   
            ];         
            this.el.style.opacity = 0;         
            this.el.style.width = window.innerHeight*0.20 + 'px';
        },

        colorFromRating: function(rating){
            return ((config.options.feedback.barVaries) ? this.colors[Math.round(rating)] : '#736baf');
        },

        onStart: function(t, rating){ 
            var top = window.innerHeight - (window.innerHeight * (rating/10));
            $(this.el).css('top', top + 'px');
            $(this.el).css('backgroundColor', this.colorFromRating(rating));   
            this.el.style.opacity = 0.7;         
        },

        onMove: function(t, rating){
            var top = window.innerHeight - (window.innerHeight * (rating/10));
            $(this.el).css('top', top + 'px');
            $(this.el).css('backgroundColor', this.colorFromRating(rating));
        },

        onEnd: function(t, rating){
            this.el.style.opacity = 0; 
        }
    });

    var BarbellFeedback = View.extend({

        init: function(options){
            this._super(options);
            this.el.innerHTML = '';
            this.bubbles = new BubbleView({el: this.el});
            this.bubbles.el.style.opacity = 0;
        },

        onStart: function(touches){
            this.bubbles.el.style.opacity = 1;
            this.bubbles.onTouchStart(touches[0]);
            this.bubbles.onTouchStart(touches[1]);
        },

        onMove: function(touches){
            this.bubbles.onTouchMove(touches[0]);
            this.bubbles.onTouchMove(touches[1]);
        },

        onEnd: function(touches){
            this.bubbles.shapes.bubbles[0].selected = this.bubbles.shapes.bubbles[1].selected = false;
            //this.bubbles.el.style.opacity = 0;
        }
    });

    var experimentPage = DoubleTouchPage.extend({
        id: 'experimentPage',

        init: function(){
            this._super();
            _bindAll(this, 'begin', 'stop', 'sampleRating', 'onTap', 'close', 'abort', 'showReadyTitle', 'handleContactLoss');
            
            this.titleText = this.el.find('#expTitle');
            this.tapText = this.el.find('#expTap');
            this.contactLoss = this.el.find('#expContactLoss');
            this.bubblesEl = this.el.find('.barbellFeedback');
            this.feedbacks = new Feedbacks({el:this.el.find('.feedbacks')});
            this.titleTexts = [
                'Soon, you will continuously rate your pleasure. You\'ll spread your fingers to indicate how much pleasure you are getting from the object at each moment. Try to continuously report what you feel from the whole experience so far.',
                'While your fingers are on the screen, keep rating pleasure, even after the object goes away, until I say, <b>"Done"</b>.',
                ''
                //'<span class="strong">When you\'re ready, place two fingers to begin.</span>'
            ];

        },

        render: function(){
            this._super();
            this.titleText.style.opacity = 0;
            $(this.contactLoss).css({display: 'none', opacity: 0});
        },

        begin: function(){
            this.times = [];
            this.samples = [];
            this.samplesPx = [];
            this.valid = [];
            this.timers = {
                end: null,
                contact: null,
                sample: null,
                clearAll: function(){
                    clearTimeout(this.end);
                    clearTimeout(this.contact);
                    clearTimeout(this.sample);
                }
            };
            this.status = {
                doubleTouch: false,
                started: false,
                canceled: false
            };
            if(config.options.feedback.barbell){
                this.bubblesEl.innerHTML = '';
                this.bubbles = new BubbleView({el: this.bubblesEl});
                this.bubblesEl.style.opacity = 0;
            }
            this.timeRes = decimalPlaces(config.ratingInterval);
            this.titleIndex = 0;
            this.showTitle();    
        },

        abort: function(e){
            e.preventDefault();
            if(e.touches.length == 5){
                this.status.canceled = true;
                this.close();
                config.aborted = true;
                var finalData = config.generateData();
                mailDataMandrill(finalData, function(){
                    PageController.pages.start.reset();
                    PageController.transition("start");
                });                
            }
        },

        onTap: function(e){
            e.preventDefault();
            if(getOrientation() == 'portrait'){
                return false;
            }
            window.removeEventListener('touchstart', this.onTap);
            var self = this;

            $(this.tapText).velocity({opacity:0}, 100);
            $(this.titleText).velocity({opacity:0}, 100, function(){
                $(self.titleText).hide();
                self.titleIndex++;
                self.showTitle();
            });
        },

        showReadyTitle: function(){
            if(config.options.musicSelect) {
                this.titleText.innerHTML = '<span class="strong">When you\'re ready, place two fingers to begin.</span>';
            }
            else {
                this.titleText.innerHTML = '<span style="font-size:1.5em; color:#6e65b0">Wait!</span><br/><span class="strong">When the experimenter tells you, please begin by pressing two fingers on the screen.</span>'
            }
            
            this.feedbacks.enable();

            window.addEventListener('touchstart', this.handleTouchStart);
            window.addEventListener('touchmove', this.handleTouchMove);
            window.addEventListener('touchend', this.handleTouchEnd);
            window.addEventListener('touchcancel', this.handleTouchEnd);   
        },

        showTitle: function(){
            var self = this;
            this.titleText.innerHTML = this.titleTexts[this.titleIndex];
            $(this.titleText).show();
            $(this.titleText).velocity({opacity:1}, 150, function(){
                if(self.titleIndex == self.titleTexts.length - 1){  
                    if(config.songUri !== '' && config.songUri !== 'whitenoise'){
                        self.titleText.innerHTML = '<span class="loader-small"></span><span class="light-emph">Buffering your music...</span>';
                        PageController.pages.music.startBuffering(self.showReadyTitle);
                    } 
                    else{
                        self.showReadyTitle();
                    }            
                }
                else{
                    //setTimeout(function(){
                        $(self.tapText).velocity({opacity: 1}, 300, function(){
                            window.addEventListener('touchstart', self.onTap);
                        });
                    //}, 50);                    
                }
            });
        },


        sampleRating: function(){
            this.timers.sample = setTimeout(this.sampleRating, config.options.ratingInterval * 1000);

            var touches = this.touches,
                rating = rater.getRating(touches).toFixed(1),
                dist = getDistance(touches[0].x, touches[0].y, touches[1].x, touches[1].y);
            
            if(touches[0].id === false && touches[1].id === false /* && rating !== this.samples[this.samples.length-1]*/){
            }
            else{
                //this.valid.push(1);
                this.times.push( (((new Date()) - config.experimentTime) / 1000).toFixed(this.timeRes) );
                this.samples.push(rating);  
                this.samplesPx.push(dist);
            }


        },

        close: function(){
            PageController.pages.music.stop();
            this.timers.clearAll();

            this.bubblesEl.style.opacity = 0;
            $(this.contactLoss).css({display: 'none', opacity: 0});

            window.removeEventListener('touchstart', this.abort);
            window.removeEventListener('touchstart', this.handleTouchStart);
            window.removeEventListener('touchmove', this.handleTouchMove);
            window.removeEventListener('touchend', this.handleTouchEnd);
            window.removeEventListener('touchcancel', this.handleTouchEnd); 

            this.sampleRating();
            if(config.knockout == 'name') {
                PageController.pages.knockout.stopRecordings();
            }
            else if(config.knockout == 'cry') {
                PageController.pages.knockout.stopCries();
            }
            this.feedbacks.disableAll();

            var numSamples = Math.floor(config.totalDuration/config.options.ratingInterval);
            config.times = this.times.slice(0, numSamples);
            config.ratings = this.samples.slice(0, numSamples);
            config.ratingsPx = this.samplesPx.slice(0, numSamples);
/*            if(this.status.canceled == true){
                config.durationActual = Math.floor( ((new Date()) - config.experimentTime) / 1000 );
            }
            else{*/
                config.durationActual = config.times[config.times.length - 1] - config.times[0];
            //}
            //config.valid = this.valid.slice(0, numSamples);
        },

        stop: function(){
            this.close();

            notifier.play("done");
            this.titleText.innerHTML = '<span class="strong" style="font-size:1.8em;font-weight:normal">Done</span>';
            $(this.titleText).show();
            var self = this;
            $(this.titleText).fadeIn(200).delay(1500).fadeOut(200, function(){
                self.postStop();
            }); 

        },

        postStop: function(){
            PageController.transition("calibration", function(){
                this.begin("post");
            }); 
        },

        conceal: function(){
            this.timers.clearAll();
        },

        onTouchStart: function(touch){
            notifier.play("contact");
            if(this.bubbles) this.bubbles.onTouchStart(touch, this.touches);
        },

        onTouchMove: function(touch){
            if(this.bubbles) this.bubbles.onTouchMove(touch, this.touches);
        },

        onTouchEnd: function(touch){
            notifier.play("contactLoss");
            if(this.bubbles) this.bubbles.onTouchEnd(touch, this.touches);
        },

        handleDoubleTouchStart: function(){
            clearTimeout(this.timers.contact);
            $(this.contactLoss).css({display: 'none', opacity: 0});
            //this.status.canceled = false;
            this.feedbacks.onStart(this.touches);

            if(!this.status.started){
                this.status.started = true;
                $(this.titleText).hide();
                this.bubblesEl.style.opacity = 1;
                //this.timers.sample = setTimeout(this.sampleRating, config.options.ratingInterval * 1000);
                this.timers.end = setTimeout(this.stop, (config.totalDuration * 1000) );

                config.experimentTime = new Date();
                config.absoluteTime = config.experimentTime.getTime();
                this.sampleRating();

                if(config.options.musicSelect){
                    PageController.pages.music.playMusic(config.songUri, config.options.duration);
                }

                var knockDuration = ( config.options.knockOff ? config.options.duration : config.totalDuration ) - config.options.knockOnset;
                    knockDuration = ( Math.min(config.options.knockDuration, knockDuration)  ) * 1000;

                if(config.knockout == 'name'){
                    setTimeout(function() {
                        PageController.pages.knockout.playRecordings(0);
                        setTimeout(PageController.pages.knockout.stopRecordings, knockDuration );
                    }, 
                    config.options.knockOnset * 1000);
                }
                else if(config.knockout == 'cry') {
                    PageController.pages.knockout.loadCries();
                    setTimeout(function() {
                        PageController.pages.knockout.playCries(0);
                        setTimeout(PageController.pages.knockout.stopCries, knockDuration );
                    }, 
                    config.options.knockOnset * 1000);
                }
                window.addEventListener('touchstart', this.abort);
            }
        },

        handleDoubleTouchEnd: function(){
            this.feedbacks.onEnd(this.touches);
            this.timers.contact = setTimeout(this.handleContactLoss, 2000);
        },

        handleDoubleTouchMove: function(){
            this.feedbacks.onMove(this.touches);
        },

        handleContactLoss: function() {
            $(this.contactLoss).css({display: 'block'}).velocity({opacity: 1}, 500);
        }

    });

    var completePage = Page.extend({
        id: 'completePage',
        limitOrient: false,

        init: function(){
            this._super();
             _bindAll(this, 'showFinal');

            this.survey = this.el.find("#completeSurvey");
            this.surveyTap = this.el.find("#completeSurveyTap");
            this.surveyRadio = $(this.el).find('input[name="pleasureSurvey"]');
            this.messages = this.el.find("#completeMessages");
            this.buttons = this.el.find("#completeButtons");
            this.sendButton = this.buttons.find('#btnReSend');
            this.restartButton = this.buttons.find('#btnRestart');
            this.loader = this.el.find(".loader-small");
            this.thank = this.el.find("#completeThank");
            this.status = this.el.find("#completeStatus");
            this.statusContainer = this.el.find("#completeStatusContainer");
            this.selected = false;

            $(this.el).on('touchstart', '.survey-btn', this.showFinal);
            new MBP.fastButton(this.restartButton, function(e){
                e.preventDefault();
                PageController.pages.start.reset();
                PageController.transition('start');
            });

        },

        render: function(){
            if(this.selected){
                $(this.selected).removeClass('selected');
            }
            this.selected = false;
            this.surveyChange = false;
            this.survey.style.opacity = 1;
            this.survey.style.display = 'block';
            this.surveyTap.style.opacity = 0;
            this.surveyTap.style.display = 'none';
            this.messages.style.display = 'none';
            this.messages.style.opacity = 0;
            this.thank.style.opacity = 0;
            this.status.innerHTML = 'Sending data...';
            this.status.className = '';
            this.statusContainer.className = '';
            this.sendButton.style.top = '-53px';
            this.restartButton.style.bottom = '-53px';

            this.buttons.style.display = 'none';
        },

/*        onSelect: function(e){
            e.preventDefault();
            if(this.selected){
                $(this.selected).removeClass('selected');
            }
            else{
                $(this.surveyTap).css({display: 'block'}).velocity({opacity:1}, 300);
            }
            $(e.target).addClass('selected');
            this.selected = e.target;
        },*/

        showFinal: function(e){
            e.preventDefault();
            this.selected = e.target;
            $(this.selected).addClass('selected');
            config.feltPleasure = $(this.selected).val();

            var self = this;
            transEl(self.survey, self.messages, 400, function(){

                if(config.optionsMode === 'server' && config.options.storeData){
                    $.ajax({
                        url:'http://54.172.59.119/store',
                        type: 'POST',
                        data: JSON.stringify(config.generateDataObject()),
                        contentType: 'application/json; charset=utf-8',
                        timeout: 10000
                    });                    
                }

                var finalData = config.generateData();
                $(self.sendButton).attr("href", generateMailLink(finalData));
                mailDataMandrill(finalData, function(res){

                    $(self.loader).css({display:'none'});

                    if( res[0] == undefined  
                        || res[0].status === undefined 
                        || res[0].status === "rejected" 
                        || res[0].status === "invalid"){
                        $(self.status).html('Unable to send data.');
                        $(self.status).addClass('error');
                        $(self.sendButton).html('Send data as e-mail');
                    }
                    else{
                        $(self.status).html('Data sent successfully.');
                        $(self.sendButton).html('Re-send data as e-mail');
                    };

                    setTimeout(function(){
                        $(self.buttons).css({display: 'block'});
                        $(self.sendButton).velocity({top:0}, {duration: 1000, easing: [80,14]});
                        $(self.restartButton).velocity({bottom:0}, {duration:1000, easing: [80,14]});

                        $(self.statusContainer).addClass('min');
                        $(self.thank).velocity({opacity:1}, 1000);

                    }, 800);

                });
            });
        }

    });

    var PageController = new (Class.extend({

        pages: {
            "start" : new startPage(),
            "calibration": new calibrationPage(),
            "knockout": new knockoutPage(),
            "mood": new moodPage(),
            "music": new musicPlayer(),
            "stimulus" : new stimulusPage(),
            "experiment": new experimentPage(),
            "complete": new completePage()
        },

        init: function(){
            this.curPage = this.pages["start"];
            this.curPageName = "start";
            this.orientPage = _el('changeOrient');

            window.onresize = _bind(this.handleResize, this);
        },

        transition: function(pageName, callback){
            var page = this.pages[pageName];
            callback = callback || function(){}
            
            if(page){
                this.curPage.hide(_bind(function(){
                    this.curPage = page;
                    this.curPageName = pageName;
                    this.handleResize();
                    page.show(_bind(callback, page));
                }, this));
            }
        },

        handleResize: function(){

            if(this.curPage.limitOrient){ 
                if (window.innerWidth > window.innerHeight) { // Landscape
                    this.orientPage.hide();
                    //this.curPage.el.show();
                }
                else{ // Portrait
                    //this.curPage.el.hide();
                    this.orientPage.show();
                }                
            }
            else {
            this.orientPage.hide(); 
            }

            this.curPage.handleResize();           
        }

    }))();

    //PageController.init();

})();
}
});