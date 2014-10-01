window.URL = window.URL || window.webkitURL;

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

function is_touch_device() {
    return (('ontouchstart' in window) ||
        (navigator.MaxTouchPoints > 0) ||
        (navigator.msMaxTouchPoints > 0));
}


if(!is_touch_device()){
    if(navigator.platform.toUpperCase().indexOf('MAC')>=0){
        $("#macDownload").css({display:'block'});
    }
    $("#welcomePage").css({display:'block'}).velocity({opacity:1}, 600);
}
else{
    $("#startPage").css({display:'block', opacity:1});

(function(){

    var AUDIOCTX = Howler.ctx || window.AudioContext ||window.webkitAudioContext;
    var VERSION = '1.1.2';

    if(!localStorage["VERSION"] || localStorage["VERSION"] !== VERSION) {
        localStorage.clear();
        localStorage["VERSION"] = VERSION;
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
                return this[0].id && this[1].id;
            };
            this.doubleTouch = false;
        },

        handleTouchStart: function(e){
            e.preventDefault();
            var changed = e.changedTouches,
                touches = this.touches;

            for(var i = 0; i < changed.length ; i++) {
                for(var j = 0; j < 2; j++){
                    if(!touches[j].id){
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
        name: '',
        experiment: '',
        experimentTime: '',
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
        medianMaxRating: 0,
        medianMinRating: 0,
        ratings: [],
        ratingsPx: [],
        valid: [],
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
        
        optionsMode: "download",
        options:{},
        serverOptions: {},

        totalDuration: (+localStorage["c_duration"] || 30) + (+localStorage["c_postStimulusDuration"] || 120),
        knockout: '',
        songUri: 'whitenoise',
        songName: '',
        songArtist: '',
        songAlbum: '',
        songDuration: '',

        generateDataObject: function(){
            var data = {
                experiment: this.experiment,
                name: this.name,
                email: this.options.email,
                url: this.url,
                appCreateDate: getDateString(this.experimentTime),
                timeZero: (this.absoluteTime / 1000).toFixed(2),
                ratings: this.ratings,
                spread: this.ratingsPx,
                valid: this.valid,
                feltPleasure: this.feltPleasure,
                device: {
                    name: DEVICE_INFO.type,
                    model: DEVICE_INFO.model,
                    os: this.os,
                    browser: this.browser
                },
                screenWidth: this.screenWidth,
                screenHeight: this.screenHeight,
                windowWidth: this.windowWidth,
                windowHeight: this.windowHeight,
                location: this.location,
                ratingInterval: this.options.ratingInterval,
                minRating: this.options.minRating,
                duration: this.options.duration,
                postDuration: this.options.postStimulusDuration,
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
                feedback: this.options.feedback,
                practiceInRef: this.options.postInMedian,
                knockout: this.knockout,
                musicSelected: this.options.musicSelect,
                songUri: this.songUri,
                songName: this.songName,
                songArtist: this.songArtist,
                songAlbum: this.songAlbum,
                songDuration: this.songDuration,
                moodDuration: this.options.moodDuration,
                noiseDuration: this.options.durationWhiteNoise
            };

            return data;
        },

        initOptions: function(){
            this.options = {
                email: localStorage["c_email"] || 'lauren.vale@nyu.edu',
                duration: +(localStorage["c_duration"] || 30),
                ratingInterval: +(localStorage["c_ratingInterval"] || 1),
                minRating: +(localStorage["c_minRating"] || 1),
                setupSteps: +(localStorage["c_setupSteps"] || 2),
                preSteps: +(localStorage["c_preSteps"] || 2),
                postSteps: +(localStorage["c_postSteps"] || 1),
                feedback:{
                    barbell: JSON.parse(localStorage["c_feedBarbell"] || "false"),
                    range: JSON.parse(localStorage["c_feedRange"] || "false"),
                    numeric: JSON.parse(localStorage["c_feedNumeric"] || "false"),
                    auditory: JSON.parse(localStorage["c_feedAuditory"] || "false"),
                    tactile: JSON.parse(localStorage["c_feedTactile"] || "false"),
                    barVaries: JSON.parse(localStorage["c_feedBarVaries"] || "false")
                },

                postInMedian: JSON.parse(localStorage["c_postInMedian"] || "false"),
                musicSelect: JSON.parse(localStorage["c_musicSelect"] || "true"),
                nameSelect: JSON.parse(localStorage["c_nameSelect"] || "false"),
                moodSelect: JSON.parse(localStorage["c_moodSelect"] || "false"),
                postStimulusDuration: +(localStorage["c_postStimulusDuration"] || 120),
                durationWhiteNoise: +(localStorage["c_durationWhiteNoise"] || 120),
                moodDuration: +(localStorage["c_moodDuration"] || 180),
                storeData: JSON.parse(localStorage["c_storeData"] || "true")
            };
        },

        generateOptionsJSON: function(){
            return JSON.stringify(this.options);
        },

        generateData: function(){

            this.medianMaxDist = (this.postInMedian) ? findMedian(this.setupMaxDist.concat(this.preMaxDist, this.postMaxDist)) : findMedian(this.setupMaxDist);
            this.medianMinDist = (this.postInMedian) ? findMedian(this.setupMinDist.concat(this.preMinDist, this.postMinDist)) : findMedian(this.setupMinDist);
            
            this.medianMaxRating = findMedian(this.practiceMaxRatings).toFixed(1);
            this.medianMinRating = findMedian(this.practiceMinRatings).toFixed(1);
            
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
    config.initOptions();

    function updateRater(config){

        rater = (function(){

        var minDist = (config.options.postInMedian) ? findMedian(config.setupMinDist.concat(config.preMinDist, config.postMinDist)) : findMedian(config.setupMinDist),
            maxDist = (config.options.postInMedian) ? findMedian(config.setupMaxDist.concat(config.preMaxDist, config.postMaxDist)) : findMedian(config.setupMaxDist);

            var ratingRange = maxDist - minDist,
                ratingStep = ratingRange / (10 - config.options.minRating);

            return {
                getRatingFromDist: function(distance){

                    if(distance < minDist) {
                        distance = minDist;
                    }
                    else if(distance > maxDist){
                        distance = maxDist;
                    }

                    return ((distance - minDist) / ratingStep) + config.options.minRating;                      
                },

                getRating: function(touches){
                    var distance = getDistance(touches[0].x, touches[0].y, touches[1].x, touches[1].y);
                    return this.getRatingFromDist(distance);                
                },
            };
        })();
    }

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(saveLocation);
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

    var getDistance = function(x1, y1, x2, y2){
        return Math.floor(Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2)));
    }

    var settingsPage = new (Page.extend({
        id: 'settingsPage',

        limitOrient: false,

        init: function(){
            this._super();
            _bindAll(this, 'handleSave', 'showStart', 'floatButtons', 'unFloatButtons', 'showAudioWarn', 'toggleOptionMode', 'generateOptions', 'loadOptions', 'disableAll', 'enableAll', 'downloadOptions', 'uploadOptions');

            if(!AUDIOCTX){
                localStorage["c_feedAuditory"] = config.options.feedback.auditory = false;
                localStorage["c_musicSelect"] = config.options.musicSelect = false;

                $(this.el.find('#feedAuditory')).on('click', this.showAudioWarn);
                $(this.el.find('#musicSelect')).on('click', this.showAudioWarn);                
            }

            this.email = $(this.el.find('#email')).val(config.options.email);
            this.duration = $(this.el.find('#duration')).val(config.options.duration);
            this.postStimulusDuration = $(this.el.find('#postStimulusDuration')).val(config.options.postStimulusDuration);

            this.setupSteps = $(this.el.find('#setupSteps')).val(config.options.setupSteps);
            this.preSteps = $(this.el.find('#preSteps')).val(config.options.preSteps);
            this.postSteps = $(this.el.find('#postSteps')).val(config.options.postSteps);
            this.ratingInterval = $(this.el.find('#ratingInterval')).val(config.options.ratingInterval);
            this.minRating = $(this.el.find('#minRating')).val(config.options.minRating);

            this.feedBarbell = $(this.el).find('#feedBarbell').prop('checked', config.options.feedback.barbell);
            this.feedRange = $(this.el.find('#feedRange')).prop('checked', config.options.feedback.range);
            this.feedNumeric = $(this.el.find('#feedNumeric')).prop('checked', config.options.feedback.numeric);
            this.feedAuditory = $(this.el.find('#feedAuditory')).prop('checked', config.options.feedback.auditory);
            this.feedTactile = $(this.el.find('#feedTactile')).prop('checked', config.options.feedback.tactile);
            this.feedBarVaries = $(this.el.find('#feedBarVaries')).prop('checked', config.options.feedback.barVaries);

            this.postInMedian = $(this.el.find('#postInMedian')).prop('checked', config.options.postInMedian);
            this.musicSelect = $(this.el.find('#musicSelect')).prop('checked', config.options.musicSelect);
            this.nameSelect = $(this.el.find('#nameSelect')).prop('checked', config.options.nameSelect);
            this.moodSelect = $(this.el.find('#moodSelect')).prop('checked', config.options.moodSelect);
            this.durationWhiteNoise = $(this.el.find('#durationWhiteNoise')).val(config.options.durationWhiteNoise);
            this.moodDuration = $(this.el.find('#moodDuration')).val(config.options.moodDuration);
            this.storeData = $(this.el.find('#storeData')).prop('checked', config.options.storeData);

            this.exp = this.el.find('#optExp');
            this.expSel = this.el.find('#optExpSel');
            $(this.expSel).on('change', this.downloadOptions);
            this.downloadExperiments();
            this.disableAll();

            this.header = this.el.find('#settingsHeader');
            this.moodWarn = this.el.find("#moodWarn");
            this.modeUpload = $("#modeUploadPage");

            this.saveButton = this.el.find('#saveSubmit');
            new MBP.fastButton(this.saveButton, this.handleSave);
            new MBP.fastButton(this.el.find('#cancelSubmit'), this.showStart);

            $(this.setupSteps).on('change', function(){
                if(+$(this).val().trim() === 0){
                    $(this).val(1);
                }
            });

            var self = this;
            this.optionsMode = this.el.find("#optionsMode");
            $(this.optionsMode).on("touchstart", this.toggleOptionMode);

            this.uploadSubmit = document.body.find('#uploadSubmit');
            this.uploadExp = document.body.find("#uploadExperiment");
            this.uploadKey = document.body.find("#uploadKey");

            new MBP.fastButton(document.body.find("#uploadClose"), function(e){
                e.preventDefault();
                self.modeUpload.css({display:'none', opacity: 0});
                $(self.el).css({display:'block'}).velocity({opacity: 1}, 300);
                $(self.uploadSubmit).val('Upload').prop('disabled', false).removeClass('btn-success btn-error');
            });

            new MBP.fastButton(this.el.find('#modeUploadBtn'), function(){
                $(self.el).css({display:'none', opacity: 0});
                if(config.optionsMode == "download"){
                    $(self.uploadExp).val($(self.expSel).val());
                }
                else{
                    $(self.uploadExp).val($(self.exp).val());
                }
                $(self.uploadKey).val('');
                self.modeUpload.css({display:'table'}).velocity({opacity:1}, 300, function(){
                    window.scrollTo(0, 1);
                });
            });

            var resetUploadButton = function(){
                $(self.uploadSubmit).val('Upload').prop('disabled', false).removeClass('btn-success btn-error');
            }
            $(this.uploadExp).on('change', resetUploadButton);
            $(this.uploadKey).on('change', resetUploadButton);
            new MBP.fastButton(this.uploadSubmit, this.uploadOptions);
            
            $("#audioOk").on('touchstart', function(e){
                e.preventDefault();
                $('#audioWarn').velocity({opacity:0}, 200, function(){
                    $(this).css({display:'none'});
                    $(document).off('touchmove', self.onDialogScroll);
                });
            }); 

            $(this.moodSelect).on('click', function(e){
                if($(this).prop('checked') == false){
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
            $(window).on('resize', this.handleResize);

            $(this.moodDuration).on('change', function(){
                var moodDur = $(this).val().trim();
                moodDur = (!isNaN(moodDur)) ? (+moodDur) : 180;
                $(this).val(moodDur);
            });

            $(this.el).on('focus', 'input[type="text"]', this.unFloatButtons);
            $(this.el).on('focusout', 'input[type="text"]', this.floatButtons);
        },

        disableAll: function(){
            console.log("disabling");
            $(this.el).find('input').prop('disabled', true);
        },

        enableAll: function(){
            console.log("enabling");
            $(this.el).find('input').prop('disabled', false);
        },

        uploadOptions: function(e){
            e.preventDefault();
            if($(this.uploadSubmit).prop('disabled')) return false;
            var exp = $(this.uploadExp).val().trim(),
                key = $(this.uploadKey).val().trim();

            if(exp == '' || key == '') return false;

            $(this.uploadSubmit).val('Uploading...').prop('disabled', true);

            var self = this;
            $.ajax({
                url:'http://ec2-54-210-113-201.compute-1.amazonaws.com/upload',
                type: 'POST',
                data: JSON.stringify({e: exp, k: key, o: self.generateOptions()}),
                contentType: 'application/json; charset=utf-8',
                dataType: 'json',
                timeout: 8000,
                success: function(msg) {
                    if(msg && msg.error){
                       $(self.uploadSubmit).val(msg.error).addClass('btn-error'); 
                    }
                    else{
                       $(self.uploadSubmit).val('Upload successful').addClass('btn-success'); 
                    }
                    
                },
                error: function(jqXHR, textStatus, errorThrown){
                    $(self.uploadSubmit).val('Error contacting server').addClass('btn-error'); 
                }
            });
        },

        toggleOptionMode: function(e){
            e.preventDefault();

            if(e.target.tagName != "BUTTON") return false;

            var optionTarget = e.target,
                optionName = config.optionsMode = $(optionTarget).data("name");

            $(this.optionsMode).find("button").removeClass("btn-selected");
            $(optionTarget).addClass("btn-selected");

            if(optionName == "download"){
                $(this.exp).css({display:"none"});
                $(this.expSel).css({display:"block"});
                var expVal = $(this.exp).val().trim();
                if(expVal != '' && $(this.expSel).find('option[value="'+ expVal + '"]').length > 0){
                    $(this.expSel).val(expVal);
                }
                else{
                    this.disableAll();
                    $(this.expSel).val('').children().first().prop('selected', true);
                }
                $(this.saveButton).css({display:"none"});
                this.loadOptions(config.serverOptions);
            }
            else{
                $(this.expSel).css({display:"none"});
                $(this.exp).css({display:"block"});  
                $(this.saveButton).css({display:"block"});
                this.enableAll();
                this.loadOptions();              
            }
        },

        downloadExperiments: function(){
            var self = this;
            $.ajax({
                url: 'http://ec2-54-210-113-201.compute-1.amazonaws.com/exps',
                type: 'GET',
                dataType: 'json',
                timeout: 5000,
                success: function(exps) {
                    //$(self.expSel).html('<option selected disabled style="display:none">Choose an experiment</option>');
                    for(var i=0; i<exps.length; i++){
                        $(self.expSel).append('<option value="' + exps[i] + '">' + exps[i] +'</option>');
                    }
                }
            });
        },

        downloadOptions: function(){
            var self = this;
            this.disableAll();
            $.ajax({
                url:'http://ec2-54-210-113-201.compute-1.amazonaws.com/download?e='+$(this.expSel).val(),
                type: 'GET',
                dataType: 'json',
                timeout: 8000,
                success: function(msg) {
                    if(msg && msg.options){
                        config.serverOptions = msg.options;
                        self.loadOptions(config.serverOptions);
                    }
                },
                complete: function(){
                    self.enableAll();
                }
            });
        },

        showAudioWarn: function(e){
            if($(e.target).prop('checked') == false){
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

            if(config.optionsMode == "private" || $(this.expSel).val() == ""){
                localStorage["c_email"] = config.options.email = $(this.email).val().trim();
                localStorage["c_duration"] = config.options.duration = +$(this.duration).val().trim();
                localStorage["c_postStimulusDuration"] = config.options.postStimulusDuration = +$(this.postStimulusDuration).val().trim();
                config.totalDuration = (+config.options.duration) + (+config.options.postStimulusDuration);

                localStorage["c_setupSteps"] = config.options.setupSteps = +($(this.setupSteps).val().trim());
                localStorage["c_preSteps"] = config.options.preSteps = +($(this.preSteps).val().trim());
                localStorage["c_postSteps"] = config.options.postSteps = +($(this.postSteps).val().trim());
                localStorage["c_ratingInterval"] = config.options.ratingInterval = +($(this.ratingInterval).val().trim());
                localStorage["c_minRating"] = config.options.minRating = +($(this.minRating).val().trim());

                localStorage["c_feedBarbell"] = config.options.feedback.barbell = $(this.feedBarbell).prop('checked');
                localStorage["c_feedRange"] = config.options.feedback.range = $(this.feedRange).prop('checked');
                localStorage["c_feedNumeric"] = config.options.feedback.numeric = $(this.feedNumeric).prop('checked');
                localStorage["c_feedAuditory"] = config.options.feedback.auditory = $(this.feedAuditory).prop('checked');
                localStorage["c_feedTactile"] = config.options.feedback.tactile = $(this.feedTactile).prop('checked');
                localStorage["c_feedBarVaries"] = config.options.feedback.barVaries = $(this.feedBarVaries).prop('checked');

                localStorage["c_postInMedian"] = config.options.postInMedian = $(this.postInMedian).prop('checked');
                localStorage["c_musicSelect"] = config.options.musicSelect = $(this.musicSelect).prop('checked');
                localStorage["c_nameSelect"] = config.options.nameSelect = $(this.nameSelect).prop('checked');
                localStorage["c_moodSelect"] = config.options.moodSelect = $(this.moodSelect).prop('checked');
                localStorage["c_durationWhiteNoise"] = config.options.durationWhiteNoise = +$(this.durationWhiteNoise).val().trim();
                localStorage["c_moodDuration"] = config.options.moodDuration = +$(this.moodDuration).val().trim();
                localStorage["c_storeData"] = config.options.storeData = $(this.storeData).prop('checked');
            }


            this.showStart(e);
        },

        generateOptions: function(){
            var options = {
                email: $(this.email).val().trim(),
                duration: +$(this.duration).val().trim(),
                ratingInterval: +($(this.ratingInterval).val().trim()),
                minRating: +($(this.minRating).val().trim()),
                setupSteps: +($(this.setupSteps).val().trim()),
                preSteps: +($(this.preSteps).val().trim()),
                postSteps: +($(this.postSteps).val().trim()),
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
                postStimulusDuration: +$(this.postStimulusDuration).val().trim(),
                durationWhiteNoise: +$(this.durationWhiteNoise).val().trim(),
                moodDuration: +$(this.moodDuration).val().trim(),
                storeData: $(this.storeData).prop('checked')     
            };

            return options;
        },

        loadOptions: function(options){
            if(!options || $.isEmptyObject(options)){
                options = config.options;
            }

            $(this.email).val(options.email);
            $(this.duration).val(options.duration);
            $(this.postStimulusDuration).val(options.postStimulusDuration);

            $(this.setupSteps).val(options.setupSteps);
            $(this.preSteps).val(options.preSteps);
            $(this.postSteps).val(options.postSteps);
            $(this.ratingInterval).val(options.ratingInterval);
            $(this.minRating).val(options.minRating);

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
            $(this.durationWhiteNoise).val(options.durationWhiteNoise);
            $(this.moodDuration).val(options.moodDuration);
            $(this.storeData).prop('checked', options.storeData);
        },

        handleResize: function(){
            $(this.moodWarn).css({width: window.innerWidth + 'px', height: window.innerHeight + 'px'});
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
            if(config.optionsMode != "download"){
                this.loadOptions();
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
            _bindAll(this, 'handleSubmit', 'showSettings', 'floatButtons', 'unFloatButtons');

            this.name = this.el.find('#name');
            this.experiment = this.el.find('#experiment');

            this.name.on("change", this.removeInvalidHighlight);
            this.experiment.on("change", this.removeInvalidHighlight);

            this.settingsButton = this.el.find('#btnSettings');
            this.submitButton = this.el.find('#startSubmit');
            new MBP.fastButton(this.submitButton, this.handleSubmit);
            new MBP.fastButton(this.settingsButton, this.showSettings);

            $(this.el).on('focus', 'input[type="text"]', this.unFloatButtons);
            $(this.el).on('focusout', 'input[type="text"]', this.floatButtons);
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

            var flag = false;
            if(config.name === ''){
                $(this.name).addClass('invalid');
                flag = true;
            }

            if(config.experiment === ''){
                $(this.experiment).addClass('invalid');
                flag = true;
            }

            $(this.name).blur();
            $(this.experiment).blur();

            if(flag === false){
                if(config.optionsMode == "download"){
                    $(this.submitButton).prop("disabled", true).val("Configuring...");

                    $.ajax({
                        url:'http://ec2-54-210-113-201.compute-1.amazonaws.com/download?e='+config.experiment,
                        type: 'GET',
                        dataType: 'json',
                        timeout: 8000,
                        success: function(msg) {
                            if(msg && msg.options){
                                config.options = msg.options;
                            }
                        },
                        complete: function(){
                            PageController.transition("knockout");
                        }
                    });
                }
                else{
                    PageController.transition("knockout");
                }
                
            }

        },

        showSettings: function(e){
            e.preventDefault();
            $(this.name).blur();
            $(this.experiment).blur();
            this.hide(settingsPage.show);
        },

        floatButtons: function(){
            this.settingsButton.style.position = 'fixed';
        },
        unFloatButtons: function(){
            this.settingsButton.style.position = 'absolute';
        },

        render: function(){
            if(config.optionsMode == 'download' && $(settingsPage.expSel).val() != ""){
                $(this.experiment).val($(settingsPage.expSel).val());
                $(this.experiment).prop('disabled', true);
            }
            else{
                $(this.experiment).val($(settingsPage.exp).val());
                $(this.experiment).prop('disabled', false);
            }

            $(this.submitButton).prop("disabled", false).val("Continue");
            config.initOptions();
            config.setupMaxDist = [];
            config.setupMinDist = [];
            config.preMaxDist = [];
            config.preMinDist = [];
            config.postMaxDist = [];
            config.postMinDist = []; 
            config.practiceMinRatings = [];
            config.practiceMaxRatings = [];
            config.ratings = [];
            config.ratingsPx = [];
            config.valid = [];
            config.feltPleasure = '';
            config.totalDuration = (+config.options.duration) + (+config.options.postStimulusDuration);

            config.songName = '';
            config.songArtist = '';
            config.songAlbum = '';
            config.songDuration = '';
            config.knockout = '';
            rater = { getRating: function(){} };
        }

    });

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
            _bindAll(this, "beginName", "showNameError", "handleAddRecording", "handleRecordPlay", "handleRecordRemove", "clearRecordings", "playRecordings", "stopRecordings", "end", "onTap", "showTitle");

            this.selector = this.el.find("#knockSelector");
            this.nameContainer = this.el.find("#knockNameContainer");

            this.nameBtn = this.el.find("#knockNameBtn");
            this.moodBtn = this.el.find("#knockMoodBtn");
            this.skipBtn = this.el.find("#knockSkipBtn");

            this.nameAddBtn = this.el.find("#knockNameAddBtn");
            this.nameFileEl = this.el.find("#knockFileEl");
            this.nameEndBtn = this.el.find("#knockNameEndBtn");
            this.recordings = this.el.find("#knockRecordings");
            this.nameForm = this.el.find("#knockNameForm");
            this.nameMessages = this.el.find("#knockNameMessages");
            this.recs = [];
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
            this.skipBtn.on('touchstart', this.end);

            this.nameFileEl.addEventListener("change", this.handleAddRecording);
            this.nameAddBtn.on('touchstart', function(){ self.nameFileEl.value = null; self.nameFileEl.click(); });
            new MBP.fastButton(this.nameEndBtn, this.end);
        },

        render: function(){
            this.recs = [];
            $(this.selector).find(".btn").each(function(i,e){
                $(e).css({display:'none', 'border-radius': 0});
            });
            var btns = ["#knockSkipBtn"];

            if(config.options.nameSelect === true){btns.push("#knockNameBtn")}
            if(config.options.moodSelect === true){btns.push("#knockMoodBtn")}

            if(btns.length == 1){
                return this.end();
            }

            btns.forEach(function(b){
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
            document.removeEventListener('touchstart', this.onTap);

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
                        document.addEventListener('touchstart', self.onTap);
                    });
                //}, 50);                    
            });
        },

        end: function(){
            this.recs = shuffle(this.recs);
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


        playRecordings: function(i){
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

        stopRecordings: function(){
            for(var i = 0; i<this.recs.length; i++){
                var rec = this.recs[i];
                rec.off('end');
                rec.stop();
            }
        }

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
            document.removeEventListener('touchstart', this.abort);
            PageController.transition("experiment", function(){
                this.begin();
            });           
        },

        onTap: function(e){
            e.preventDefault();
            document.removeEventListener('touchstart', this.onTap);

            var self = this;
            $(this.tap).velocity({opacity:0}, 100);
            $(this.titlesText).velocity({opacity:0}, 100, function(){
                self.titleIndex++;
                
                if(self.titleIndex == self.titles.length ){ 
                    self.timer.style.display = 'block';
                    drawTimer(self.timer, config.options.moodDuration);
                    self.timeout = setTimeout(self.onEnd, config.options.moodDuration * 1000);   // 3 minutes
                    document.addEventListener('touchstart', self.abort);
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
                        document.addEventListener('touchstart', self.onTap);
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
                    if(this.playQueue.length >= 4 && this.buffcb){
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
            // $(this.select).css({opacity:0, 'display':'none'});
            this.loader.style.display = 'none';
            //this.songList.innerHTML = '';
        },

        selectSong: function(e){
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

            //$(this.select).velocity({opacity:0}, 100, function(){$(this).css('display', 'none')});
            
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

            config.totalDuration = config.options.duration + (+config.options.postStimulusDuration);
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
            return {
                x: 0,
                y: 0,
                r: 40,
                circle: null,
                //line: null,
                selected: false,
                update: function(){
                    this.circle.attr("cx", this.x);
                    this.circle.attr("cy", this.y);
                    //this.line.attr("path", "M" + window.innerWidth/2 + " " + window.innerHeight/2 + "L" + this.x + " " + this.y);
                },

                toggleSelected: function(){
                    if(this.selected){
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
                    }
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
                return (this[0].selected && this[1].selected);
            } 
            shapes.bubbles.distance = function(){
                return getDistance(this[0].x, this[0].y, this[1].x, this[1].y);
            } 

            shapes.joinLine = this.paper.path('');
            shapes.joinLine.attr('stroke', '#c6003b');
            shapes.joinLine.attr('stroke-opacity', 0);
            shapes.joinLine.bubbles = shapes.bubbles;
            shapes.joinLine.updatePos = function(){
                this.attr("path", "M" + this.bubbles[0].x + " " + this.bubbles[0].y + "L" + this.bubbles[1].x + " " + this.bubbles[1].y);
            }
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

        onTouchStart: function(touch){
            var b;
            for(var i = 0; i < 2; i++){
                b = this.shapes.bubbles[i];
                if(!b.selected){
                    if(this.drag && !b.circle.isPointInside(touch.x, touch.y)){
                        continue;
                    }
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
            instr: 'Using two fingers, drag the circles as far apart as comfortably possible.',
            configVar: 'Max'
        }, {
            title: 'Indicate <span class="strong">minimum</span> pleasure.',
            instr: 'Using two fingers, drag the circles as close as comfortably possible.',
            configVar: 'Min'
        }],

        init: function(){
            this._super();
            _bindAll(this, 'beginTrials', 'onTap');


            this.tracker = this.el.find('#calibTracker');
            this.titleText = this.el.find('#calibTitle');
            this.instrText = this.el.find('#calibInstr');
            this.titlesText = this.el.find('#calibTitles');
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
            document.removeEventListener('touchstart', this.onTap);

            $(this.tapText).velocity({opacity:0}, 100);
            $(this.titlesText).velocity({opacity:0}, 100, function(){
                $(self.titlesText).hide();
                self.titleIndex++;
                
                if(self.titleIndex == self.titleTexts[self.trialParams.phase][self.titlePhase].length ){                    
                    if(self.titlePhase == 'start'){
                        self.beginPre();
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

            this.titlesText.innerHTML = this.titleTexts[this.trialParams.phase][this.titlePhase][this.titleIndex];
            $(this.titlesText).show();
            $(this.titlesText).velocity({opacity:1}, 150, function(){

                //setTimeout(function(){
                    $(self.tapText).velocity({opacity: 1}, 300, function(){
                        document.addEventListener('touchstart', self.onTap);
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
                        'Please show me how you rate pleasure.'
                    ],
                    end:[],
                    onEnd: function(){
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
                        PageController.transition("complete");
                    }
                }
            };

            if(config.options[phase + 'Steps'] == 0){
                return this.titleTexts[phase].onEnd();
            }

            if(config.options.feedback.auditory || config.options.feedback.tactile){
                this.titleTexts['pre'].start[1] += ' Adjust the volume of your device to be comfortable.';
            }

            if(phase == 'setup'){
                rater = (function(){
                    return{
                        getRating: function(){
                            return (self.trialParams.cur == 0) ? 10 : config.options.minRating;
                        }
                    };
                })();
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
            this.bubbles = new BubbleView({el: this.tracker, drag: true});

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
                        
                        updateRater(config);

                        if(self.titleTexts[self.trialParams.phase].end.length > 0){
                            self.titlePhase = 'end';
                            self.titleIndex = 0;
                            self.showTitle();
                        }
                        else{
                            document.removeEventListener('touchstart', this.onTap);
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
        },

        endTrial: function(){

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

            if(tp.queue.length == 0){
                this.end();
            }
            else{
                var self = this;
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
            if(this.bubbles.doubleSelect && !this.bubbles.shapes.bubbles[0].selected && !this.bubbles.shapes.bubbles[1].selected){
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
        var subjectParams = [config.experiment, config.name, time.getFullYear(), time.getMonth() + 1, time.getDate(), time.getHours(), time.getMinutes()];
        return subjectParams.join('.');        
    }

    var generateMailBody = function(){
        var html = ' \
            <h2> Results </h2> \
            <table> \
                <tr> <td>Experiment:</td> <td>' + config.experiment + '</td> </tr> \
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
                    "subject": '[Pleasure Data] ' + generateExperimentString(),
                    "from_email": "pleasure@tracker.edu",
                    "from_name": "Pleasure Tracker",
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
        var subject = '[Pleasure] ' + generateExperimentString(),
            body = data;
        
        body = body.replace(/\n/g, "%0D%0A");
        body = body.replace(/&/g, "%26");
        
        return ('mailto:' + config.options.email + '?subject=' + subject + '&body=' + body);    
    }

    var AuditoryFeedback = new (View.extend({
        init: function(){
            if(AUDIOCTX == null) return;
            this.gainNode = AUDIOCTX.createGain();
            this.gainNode.connect(AUDIOCTX.destination); 
            this.gainNode.gain.value = .01; 
        },

        getFrequencyFromRating: function(rating){
            rating += 1;
            return ( 440 * Math.pow(10, (0.1 * rating * (Math.log(4186.1/440) / Math.log(10) ) ) ) );
            //return Math.log(rating) * 1000;
            //return 27.5;
        },

        onStart: function(t, rating){
            if(AUDIOCTX == null) return;
            this.oscillator = AUDIOCTX.createOscillator();
            this.oscillator.frequency.value = this.getFrequencyFromRating(rating);
            this.oscillator.type = 0;
            this.oscillator.connect(this.gainNode); 
            this.oscillator.noteOn(0);
        },

        onMove: function(t, rating){
            this.oscillator.frequency.value = this.getFrequencyFromRating(rating);
        },

        onEnd: function(){
            this.oscillator.disconnect();
        }
    }))();

    var TactileFeedback = new (View.extend({
        init: function(){
            _bindAll(this, 'start', 'stop', 'play');
            this.frequency = 800;
            this.timeout = null;
            this.audio = null;
        },

        getFrequencyFromRating: function(rating){
            return 800 - (rating * 40);
        },

        start: function(){
            this.play();
        },

        stop: function(){
            clearTimeout(this.timeout);
            notifier.stop('click');
        },

        play: function(){
            notifier.play('click');
            this.timeout = setTimeout(this.play, this.frequency);
        },

        onStart: function(t, rating){
            this.stop();
            this.frequency = this.getFrequencyFromRating(rating);
            this.start();
        },

        onMove:function(t, rating){
            this.frequency = this.getFrequencyFromRating(rating);
        },

        onEnd: function(t, rating){
            this.stop();
        }
    }))();


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
            if(config.options.feedback.barbell && !this.disableBarbell){
                this.enabled.push(new BarbellFeedback({el:this.el.find('.barbellFeedback')}));
            }
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
            this.bubbles.el.style.opacity = 0;
        }
    });

    var experimentPage = DoubleTouchPage.extend({
        id: 'experimentPage',

        init: function(){
            this._super();
            _bindAll(this, 'begin', 'stop', 'sampleRating', 'onTap', 'close', 'abort', 'showReadyTitle');
            
            this.titleText = this.el.find('#expTitle');
            this.tapText = this.el.find('#expTap');

            this.feedbacks = new Feedbacks({el:this.el.find('.feedbacks')});
            this.titleTexts = [
                'Soon, you will continuously rate your pleasure. You\'ll spread your fingers to indicate how much pleasure you are getting from the object at that moment.',
                'While your fingers are on the screen, keep rating pleasure, even after the object goes away, until I say, <b>"Done"</b>.',
                ''
                //'<span class="strong">When you\'re ready, place two fingers to begin.</span>'
            ];

        },

        render: function(){
            this._super();
            this.titleText.style.opacity = 0;
        },

        begin: function(){
            this.samples = [];
            this.samplesPx = [];
            this.valid = [];
            this.timers = {
                end: null,
                cancel: null,
                sample: null,
                clearAll: function(){
                    clearTimeout(this.end);
                    clearTimeout(this.cancel);
                    clearTimeout(this.sample);
                }
            };
            this.status = {
                doubleTouch: false,
                started: false,
                canceled: false
            }; 
            this.titleIndex = 0;
            this.showTitle();         
        },

        abort: function(e){
            e.preventDefault();
            if(e.touches.length == 5){
                this.status.canceled = true;
                this.close();
                config.experiment += ',ABORTED!';
                var finalData = config.generateData();
                mailDataMandrill(finalData, function(){
                    PageController.transition("start");
                });                
            }
        },

        onTap: function(e){
            e.preventDefault();
            document.removeEventListener('touchstart', this.onTap);
            var self = this;

            $(this.tapText).velocity({opacity:0}, 100);
            $(this.titleText).velocity({opacity:0}, 100, function(){
                $(self.titleText).hide();
                self.titleIndex++;
                self.showTitle();
            });
        },

        showReadyTitle: function(){
            this.titleText.innerHTML = '<span class="strong">When you\'re ready, place two fingers to begin.</span>';
            this.feedbacks.enable();

            document.addEventListener('touchstart', this.handleTouchStart);
            document.addEventListener('touchmove', this.handleTouchMove);
            document.addEventListener('touchend', this.handleTouchEnd);
            document.addEventListener('touchcancel', this.handleTouchEnd);   
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
                            document.addEventListener('touchstart', self.onTap);
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
            
            if(!touches[0].id || !touches[1].id && rating !== this.samples[this.samples.length-1]){
                rating = (+rating);
                this.valid.push(0);
            }
            else{
                this.valid.push(1);
            }

            this.samples.push(rating);  
            this.samplesPx.push(dist);
        },

        close: function(){
            PageController.pages.music.stop();
            this.timers.clearAll();
            document.removeEventListener('touchstart', this.abort);
            document.removeEventListener('touchstart', this.handleTouchStart);
            document.removeEventListener('touchmove', this.handleTouchMove);
            document.removeEventListener('touchend', this.handleTouchEnd);
            document.removeEventListener('touchcancel', this.handleTouchEnd); 

            if(this.status.canceled == true){
                config.durationActual = Math.floor( ((new Date()) - config.experimentTime) / 1000 );
            }
            else{
                config.durationActual = config.totalDuration;
            }
            PageController.pages.knockout.stopRecordings();
            this.feedbacks.disableAll();

            this.sampleRating();
            var numSamples = Math.floor(config.durationActual/config.options.ratingInterval);
            config.ratings = this.samples.slice(0, numSamples);
            config.ratingsPx = this.samplesPx.slice(0, numSamples);
            config.valid = this.valid.slice(0, numSamples);
        },

        stop: function(){

            this.close();

            notifier.play("done");
            this.titleText.innerHTML = '<span class="strong" style="font-size:1.8em;font-weight:normal">Done</span>';
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
        },

        onTouchEnd: function(touch){
            notifier.play("contactLoss");
        },

        handleDoubleTouchStart: function(){
            //clearTimeout(this.timers.cancel);
            //this.status.canceled = false;
            this.feedbacks.onStart(this.touches);

            if(!this.status.started){
                this.status.started = true;
                $(this.titleText).hide();
                this.timers.sample = setTimeout(this.sampleRating, config.options.ratingInterval * 1000);
                this.timers.end = setTimeout(this.stop, (config.totalDuration * 1000) );

                config.experimentTime = new Date();
                config.absoluteTime = config.experimentTime.getTime();


                if(config.options.musicSelect){
                    PageController.pages.music.playMusic(config.songUri, config.options.duration);
                }

                if(config.knockout == 'name'){
                    PageController.pages.knockout.playRecordings(0);
                    
                    setTimeout(PageController.pages.knockout.stopRecordings, config.options.duration * 1000);
                }
                document.addEventListener('touchstart', this.abort);
            }
        },

        handleDoubleTouchEnd: function(){
            this.feedbacks.onEnd(this.touches);
            //this.timers.cancel = setTimeout(this.stop, config.cancelTime);
            //this.status.canceled = new Date();
        },

        handleDoubleTouchMove: function(){
            this.feedbacks.onMove(this.touches);
        }

    });

    var completePage = Page.extend({
        id: 'completePage',
        limitOrient: false,

        init: function(){
            this._super();
             _bindAll(this, 'showFinal', 'onSelect');

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

            $(this.el).on('touchstart', '.survey-btn', this.onSelect);
            new MBP.fastButton(this.surveyTap, this.showFinal);
            new MBP.fastButton(this.restartButton, function(e){
                e.preventDefault();
                $(PageController.pages.start.name).val('');
                $(PageController.pages.start.experiment).val('');
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
            //this.loader.style.opacity = 0;
            //this.loader.style.display = 'none';

            //$(this.message).html("Thank you.");

            this.buttons.style.display = 'none';
        },

        onSelect: function(e){
            e.preventDefault();
            if(this.selected){
                $(this.selected).removeClass('selected');
            }
            else{
                $(this.surveyTap).css({display: 'block'}).velocity({opacity:1}, 300);
            }
            $(e.target).addClass('selected');
            this.selected = e.target;
        },

        showFinal: function(){
            var self = this;
            config.feltPleasure = $(this.selected).val();

            transEl(self.survey, self.messages, 400, function(){
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

            this.curPage.handleResize();           
        }

    }))();

    //PageController.init();

})();
}