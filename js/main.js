(function(){

    function utf8_to_b64( str ) {
        return window.btoa(unescape(encodeURIComponent( str )));
    }

    var Page = View.extend({
        shown: true,
        limitOrient: true,
        el: '',

        init: function(start){
            this._super();
            _bindAll(this, 'show', 'hide');
           if(!start){
                // $(this.el).css('opacity', '0');
                // $(this.el).css('display', 'none');
                this.shown = false;                
            }
        },

        show: function(callback){
            callback = callback || function(){};
            if(!this.shown){
                this.shown = true;

                this.render();
                $(this.el).css('display', 'block');
                $(this.el).animate({opacity:1}, 300, _bind(function(){
                    this.post_render();
                    callback();
                }, this));              
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
        handleResize: function(){ }

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
            }
            this.doubleTouch = false;            
        },

        handleTouchStart: function(e){
            e.preventDefault();
            var changed = e.changedTouches,
                touches = this.touches;

            for(var i = 0; i < changed.length ; i++){ 
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

            for(var i = 0; i < changed.length ; i++){ 
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
            
            for(var i = 0; i < changed.length ; i++){ 
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
            contactLoss: new Howl({urls:['alerts/contact_loss.mp3'], volume: 0.3}),
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

    }

/*    setInterval(function(){
        notifier.play('contact');
    },50);*/

    var DEVICE_INFO = getDeviceInfo();
    DEVICE_INFO.pixToMm = _bind(DEVICE_INFO.pixToMm, DEVICE_INFO);

    var pixelRatio = window.devicePixelRatio || 1;
    var rater = { getRating: function(){} };

    var config = {
        name: '',
        experiment: '',
        experimentTime: '',
        absoluteTime: 0,
        email: localStorage["pltrckr-email"] || 'lauren.vale@nyu.edu',
        duration: localStorage["pltrckr-duration"] || 30,
        durationActual: 0,
        ratingInterval: localStorage["pltrckr-ratingInterval"] || 1000,
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
        touchFeedback: true,
        ratings: [],
        ratingsPx: [],
        practiceMinRatings: [],
        practiceMaxRatings: [],
        cancelTime: 5000,
        url: window.location.href,
        location: {
            long: null,
            lat: null,
            accuracy: null
        },
        screenWidth: window.screen.width,
        screenHeight: window.screen.height,
        DEVICE_INFO: DEVICE_INFO,

        setupSteps: localStorage["pltrckr-setupSteps"] || 2,
        preSteps: localStorage["pltrckr-preSteps"] || 2,
        postSteps: localStorage["pltrckr-postSteps"] || 1,
        feedback:{
            barbell: JSON.parse(localStorage["pltrckr-feedBarbell"] || "false"),
            range: JSON.parse(localStorage["pltrckr-feedRange"] || "false"),
            numeric: JSON.parse(localStorage["pltrckr-feedNumeric"] || "false"),
            auditory: JSON.parse(localStorage["pltrckr-feedAuditory"] || "false"),
            tactile: JSON.parse(localStorage["pltrckr-feedTactile"] || "false"),
            barVaries: JSON.parse(localStorage["pltrckr-feedBarVaries"] || "false"),
            isEnabled: function(){
                return (this.barbell || this.range || this.numeric || this.auditory || this.tactile);
            }
        },
        postInMedian: JSON.parse(localStorage["pltrckr-postInMedian"] || "false") ,
        feltPleasure: '',

        generateData: function(){

            this.medianMaxDist = (this.postInMedian) ? findMedian(this.setupMaxDist.concat(this.preMaxDist, this.postMaxDist)) : findMedian(this.setupMaxDist); 
            this.medianMinDist = (this.postInMedian) ? findMedian(this.setupMinDist.concat(this.preMinDist, this.postMinDist)) : findMedian(this.setupMinDist); 
            
            this.medianMaxRating = findMedian(this.practiceMaxRatings).toFixed(1); 
            this.medianMinRating = findMedian(this.practiceMinRatings).toFixed(1); 
            
            return tmpl("data_tmpl", this);       
        }
    };

    function updateRater(config){

        rater = (function(){

        var minDist = (config.postInMedian) ? findMedian(config.setupMinDist.concat(config.preMinDist, config.postMinDist)) : findMedian(config.setupMinDist),
            maxDist = (config.postInMedian) ? findMedian(config.setupMaxDist.concat(config.preMaxDist, config.postMaxDist)) : findMedian(config.setupMaxDist);

            var ratingRange = maxDist - minDist,
                ratingStep = ratingRange / 10;

            return {
                getRatingFromDist: function(distance){

                    if(distance < minDist) {
                        distance = minDist;
                    }
                    else if(distance > maxDist){
                        distance = maxDist;
                    }

                    return (distance - minDist) / ratingStep;                      
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
    }

    var getDistance = function(x1, y1, x2, y2){
        return Math.floor(Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2)));
    }

    var settingsPage = new (Page.extend({
        id: 'settingsPage',

        limitOrient: false,

        init: function(){
            this._super();
            _bindAll(this, 'handleSave', 'showStart', 'floatButtons', 'unFloatButtons');

            this.email = $(this.el.find('#email')).val(config.email);
            this.duration = $(this.el.find('#duration')).val(config.duration);

            this.setupSteps = $(this.el.find('#setupSteps')).val(config.setupSteps);
            this.preSteps = $(this.el.find('#preSteps')).val(config.preSteps);
            this.postSteps = $(this.el.find('#postSteps')).val(config.postSteps);
            this.ratingInterval = $(this.el.find('#ratingInterval')).val(config.ratingInterval/1000);

            this.feedBarbell = $(this.el).find('#feedBarbell').prop('checked', config.feedback.barbell);
            this.feedRange = $(this.el.find('#feedRange')).prop('checked', config.feedback.range);
            this.feedNumeric = $(this.el.find('#feedNumeric')).prop('checked', config.feedback.numeric);
            this.feedAuditory = $(this.el.find('#feedAuditory')).prop('checked', config.feedback.auditory);
            this.feedTactile = $(this.el.find('#feedTactile')).prop('checked', config.feedback.tactile);
            this.feedBarVaries = $(this.el.find('#feedBarVaries')).prop('checked', config.feedback.barVaries);

            this.postInMedian = $(this.el.find('#postInMedian')).prop('checked', config.postInMedian);

            this.buttons = this.el.find('.fixed-wrapper');

            new MBP.fastButton(this.el.find('#saveSubmit'), this.handleSave);
            new MBP.fastButton(this.el.find('#cancelSubmit'), this.showStart);

            $(this.setupSteps).on('change', function(){
                if(+$(this).val().trim() === 0){
                    $(this).val(1);
                }
            });

            $(this.el).on('focusin', this.unFloatButtons);
            $(this.el).on('focusout', this.floatButtons);
        },

        handleSave: function(){
            localStorage["pltrckr-email"] = config.email = $(this.email).val().trim();
            localStorage["pltrckr-duration"] = config.duration = $(this.duration).val().trim();

            localStorage["pltrckr-setupSteps"] = config.setupSteps = $(this.setupSteps).val().trim();
            localStorage["pltrckr-preSteps"] = config.preSteps = $(this.preSteps).val().trim();
            localStorage["pltrckr-postSteps"] = config.postSteps = $(this.postSteps).val().trim();
            localStorage["pltrckr-ratingInterval"] = config.ratingInterval = +($(this.ratingInterval).val().trim())*1000;

            localStorage["pltrckr-feedBarbell"] = config.feedback.barbell = $(this.feedBarbell).prop('checked');
            localStorage["pltrckr-feedRange"] = config.feedback.range = $(this.feedRange).prop('checked');
            localStorage["pltrckr-feedNumeric"] = config.feedback.numeric = $(this.feedNumeric).prop('checked');
            localStorage["pltrckr-feedAuditory"] = config.feedback.auditory = $(this.feedAuditory).prop('checked');
            localStorage["pltrckr-feedTactile"] = config.feedback.tactile = $(this.feedTactile).prop('checked');
            localStorage["pltrckr-feedBarVaries"] = config.feedback.barVaries = $(this.feedBarVaries).prop('checked');

            localStorage["pltrckr-postInMedian"] = config.postInMedian = $(this.postInMedian).prop('checked');

            this.showStart();
        },

        floatButtons: function(){
            this.buttons.style.position = 'fixed';
        },
        unFloatButtons: function(){
            this.buttons.style.position = 'relative';
        },

        render: function(){
            this.floatButtons();
        },
        pre_conceal: function(){
            this.unFloatButtons();
        },

        showStart: function(){
            $(this.el).focus();
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
            new MBP.fastButton(this.el.find('#startSubmit'), this.handleSubmit);
            new MBP.fastButton(this.settingsButton, this.showSettings);

            $(this.el).on('focusin', this.unFloatButtons);
            $(this.el).on('focusout', this.floatButtons);
        },

        setInvalidHighlight: function(el){
            var els = [this.name, this.experiment];
            var flag = false;
            for(var i = 0; i < els.length; i++){
                var el = els[i];
                if($(el).val().trim() === ''){
                    $(el).addClass('invalid');
                    flag = true;
                }
            }
            return flag;
        },

        removeInvalidHighlight: function(e){
            var el = e.target;
            $(el).removeClass('invalid');

        },

        handleSubmit: function(){
            if(this.setInvalidHighlight()){ return false; }       

            config.name = $(this.name).val().trim();
            config.experiment = $(this.experiment).val().trim(); 

            $(this.name).blur();
            $(this.experiment).blur();

            PageController.transition("calibration", function(){
                this.begin("setup");
            });
        },

        showSettings: function(){
            this.hide(settingsPage.show);
        },

        floatButtons: function(){
            this.settingsButton.style.position = 'fixed';
        },
        unFloatButtons: function(){
            this.settingsButton.style.position = 'absolute';
        },

        render: function(){
            $(this.name).val('');
            $(this.experiment).val('');

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

            rater = { getRating: function(){} };
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
            title: 'Indicate <span class="strong">maximum</span> pleasure',
            instr: 'Using two fingers, drag the circles as far apart as comfortably possible.',
            configVar: 'Max'
        }, {
            title: 'Indicate <span class="strong">minimum</span> pleasure',
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

        onTap: function(){
            var self = this;
            window.removeEventListener('touchstart', this.onTap);

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

                setTimeout(function(){
                    $(self.tapText).velocity({opacity: 1}, 300, function(){
                        window.addEventListener('touchstart', self.onTap);
                    });
                }, 50);                    
            });
        }, 

        begin: function(phase){
            var self = this;

            this.trialParams = {
                queue: self.generateQueue(config[phase + 'Steps']),
                cur: -1,
                step: 1,
                index: 1,
                maxSteps: config[phase + 'Steps'],
                phase: phase,
                verify: (phase == 'post') ? false : true,
            }

            this.titleTexts = {
                'setup':{
                    start:[
                        'Prepare to setup settings.'
                    ],
                    end:[],
                    onEnd: function(){
                        self.begin('pre');
                    }
                },
                'pre':{
                    start: [
                        'Next we\'ll practice making ratings. We encourage you to play!',
                        'As time passes, continually adjust the spread of your fingers to indicate how much pleasure you are getting from the object at each moment.'        
                    ],
                    end: [],
                    onEnd: function(){
                       PageController.transition("experiment", function(){
                            this.begin();
                        }); 
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

            if(config[phase + 'Steps'] == 0){
                return this.titleTexts[phase].onEnd();
            }

            if(config.feedback.auditory || config.feedback.tactile){
                this.titleTexts['pre'].start[1] += ' Adjust the volume of your device to suit your comfort level.';
            }

            if(phase == 'setup'){
                rater = (function(){
                    return{
                        getRating: function(){
                            return (self.trialParams.cur == 0) ? 10 : 0;
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
            <div>' + config.experimentTime.toString() + '</div>';
        return html;
    }

    var mailDataMandrill = function(callback){
        var msg = {
                "key": "DIE-Gm5EhIT4k_u8R-VhhQ",
                "message": {
                    "html": generateMailBody(),
                    "subject": '[Pleasure Data] ' + generateExperimentString(),
                    "from_email": "pleasure@tracker.edu",
                    "from_name": "Pleasure Tracker",
                    "to": [
                        {
                            "email": config.email,
                            "name": "Experimenter",
                            "type": "to"
                        }
                    ],
                    "attachments": [
                        {
                            "name": generateExperimentString() + '.csv',
                            "type": "text/csv",
                            "binary": false,
                            "content": utf8_to_b64(config.generateData())
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
            success: function(res){
                callback(res);
            },
            error: function(res) {
                callback(res);
            }
        });   
    }

    var generateMailLink = function(){
        var subject = '[Pleasure] ' + generateExperimentString(),
            body = config.generateData();
        
        body = body.replace(/\n/g, "%0D%0A");

        return ('mailto:' + config.email + '?subject=' + subject + '&body=' + body);    
    }


    var Feedbacks = View.extend({
        enabled: [],

        init: function(options){
            this._super(options);
        },

        enable: function(){
            this.enabled = [];
            if(config.feedback.numeric){
                this.enabled.push(new NumericFeedback({el:this.el.find('.numericFeedback')}));
            }
            if(config.feedback.range){
                this.enabled.push(new RangeFeedback({el:this.el.find('.rangeFeedback')}));
            }
            if(config.feedback.barbell && !this.disableBarbell){
                this.enabled.push(new BarbellFeedback({el:this.el.find('.barbellFeedback')}));
            }
            if(config.feedback.auditory){
                this.enabled.push(AuditoryFeedback);
            }
            if(config.feedback.tactile){
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
            var rating = (touches) ? rater.getRating(touches) : 0;
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

        },

        colorFromRating: function(rating){
            return ((config.feedback.barVaries) ? this.colors[Math.round(rating)] : '#736baf');
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

    var AuditoryFeedback = new (View.extend({
        init: function(){
            this.context = new webkitAudioContext();
            this.oscillator = this.context.createOscillator();
            this.oscillator.type = 0;
            this.gainNode = this.context.createGainNode();
        },

        getFrequencyFromRating: function(rating){
            rating += 1;
            return ( 440 * Math.pow(10, (0.1 * rating * (Math.log(4186.1/440) / Math.log(10) ) ) ) );
            //return Math.log(rating) * 1000;
            //return 27.5;
        },

        onStart: function(t, rating){
            this.oscillator.frequency.value = this.getFrequencyFromRating(rating);
            this.oscillator.connect(this.gainNode); 
            this.gainNode.connect(this.context.destination); 
            this.gainNode.gain.value = .01; 
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


    var experimentPage = DoubleTouchPage.extend({
        id: 'experimentPage',

        init: function(){
            this._super();
            _bindAll(this, 'begin', 'stop', 'sampleRating', 'onTap');
            
            this.titleText = this.el.find('#expTitle');
            this.tapText = this.el.find('#expTap');

            this.feedbacks = new Feedbacks({el:this.el.find('.feedbacks')});
            this.titleTexts = [
                'Soon, you will continuously rate your pleasure. You\'ll spread your fingers to indicate how much pleasure you are getting from the object at that moment.',
                'While your fingers are on the screen, keep rating pleasure, even after the object goes away, until I say, <b>"Done"</b>.',
                '<span class="strong">When you\'re ready, place two fingers to begin.</span>'
            ];

        },

        begin: function(){
            this.samples = [];
            this.samplesPx = [];
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

        onTap: function(){
            var self = this;

            $(this.tapText).velocity({opacity:0}, 100);
            $(this.titleText).velocity({opacity:0}, 100, function(){
                $(self.titleText).hide();
                self.titleIndex++;
                self.showTitle();
            });
        },

        showTitle: function(){

            window.removeEventListener('touchstart', this.onTap);

            var self = this;

            this.titleText.innerHTML = this.titleTexts[this.titleIndex];
            $(this.titleText).show();
            $(this.titleText).velocity({opacity:1}, 150, function(){
                if(self.titleIndex == self.titleTexts.length - 1){                    
                    // End case
                    self.feedbacks.enable();

                    window.addEventListener('touchstart', self.handleTouchStart);
                    window.addEventListener('touchmove', self.handleTouchMove);
                    window.addEventListener('touchend', self.handleTouchEnd);
                    window.addEventListener('touchcancel', self.handleTouchEnd);             
                }
                else{
                    setTimeout(function(){
                        $(self.tapText).velocity({opacity: 1}, 300, function(){
                            window.addEventListener('touchstart', self.onTap);
                        });
                    }, 50);                    
                }
            });
        },


        sampleRating: function(){
            var touches = this.touches,
                rating = rater.getRating(touches).toFixed(1),
                dist = getDistance(touches[0].x, touches[0].y, touches[1].x, touches[1].y);
            
            if(!touches[0].id || !touches[1].id && rating !== this.samples[this.samples.length-1]){
                rating = (+rating) + 100;
                dist += 100;
            }
            this.samples.push(rating);  
            this.samplesPx.push(dist);
        },

        stop: function(){
            this.timers.clearAll();
            window.removeEventListener('touchstart', this.handleTouchStart);
            window.removeEventListener('touchmove', this.handleTouchMove);
            window.removeEventListener('touchend', this.handleTouchEnd);
            window.removeEventListener('touchcancel', this.handleTouchEnd); 

            if(this.status.canceled !== false){
                config.durationActual = this.status.canceled;
            }
            else{
                config.durationActual = new Date();
            }
            this.feedbacks.disableAll();
            config.durationActual = Math.floor( (config.durationActual - config.experimentTime) / 1000 );

            this.sampleRating();
            config.ratings = this.samples.slice(0, config.durationActual);
            config.ratingsPx = this.samplesPx.slice(0, config.durationActual);

            if(this.status.canceled !== false){
                this.postStop();
            }
            else{
                notifier.play("done");
                this.titleText.innerHTML = '<span class="strong" style="font-size:1.8em">Done</span>';
                var self = this;
                $(this.titleText).fadeIn(200).delay(1500).fadeOut(200, function(){
                    self.postStop();
                }); 
            }

        },

        postStop: function(){
            // this.titleText.innerHTML = 'Prepare to calibrate again.';
            // $(this.titleText).fadeIn(200);
            // setTimeout(function(){
            PageController.transition("calibration", function(){
                this.begin("post");
            });
            // },3000);  
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
            clearTimeout(this.timers.cancel);
            this.status.canceled = false;
            this.feedbacks.onStart(this.touches);

            if(!this.status.started){
                this.status.started = true;
                $(this.titleText).hide();
                this.timers.sample = setInterval(this.sampleRating, config.ratingInterval);
                this.timers.end = setTimeout(this.stop, (config.duration * 1000) );

                config.experimentTime = new Date();
                config.absoluteTime = config.experimentTime.getTime();
            }
        },

        handleDoubleTouchEnd: function(){
            this.feedbacks.onEnd(this.touches);
            this.timers.cancel = setTimeout(this.stop, config.cancelTime);
            this.status.canceled = new Date();
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
             _bindAll(this, 'showFinal');

            this.survey = this.el.find("#completeSurvey");
            this.surveyTap = this.el.find("#completeSurveyTap");
            this.surveyRadio = $(this.el).find('input[name="pleasureSurvey"]');
            this.message = this.el.find("#completeMessage");
            this.buttons = this.el.find("#completeButtons");
            this.sendButton = this.buttons.find('#btnReSend');
            this.restartButton = this.buttons.find('#btnRestart');

            new MBP.fastButton(this.surveyTap, this.showFinal);
            new MBP.fastButton(this.restartButton, function(){
                PageController.transition('start');
            });

        },

        render: function(){
            this.surveyChange = false;
            this.survey.style.opacity = 1;
            this.survey.style.display = 'block';
            this.surveyTap.style.opacity = 0;
            this.surveyTap.style.display = 'none';

            $(this.message).html("Thank you.");

            this.buttons.style.opacity = 0;
            this.buttons.style.display = 'none';
        },

        post_render: function(){
            var self = this;

            this.surveyRadio.change(function(){
                if(!self.surveyChange){
                    self.surveyChange = true;

                    $(self.surveyTap).css({display: 'block'}).velocity({opacity:1}, 300);
                }
            });
        },

        showFinal: function(){
            var self = this;
            config.feltPleasure = $(self.el).find('input[name="pleasureSurvey"]:checked').val();
            $(self.el).find('input[name="pleasureSurvey"]:checked').prop('checked', false);

            $(self.survey).velocity({opacity:0}, 100, function(){
                $(this).css({display: 'none'});

                $(self.message).css({display: 'block'}).velocity({opacity:1}, 300, function(){

                    $(self.sendButton).attr("href", generateMailLink());
                    mailDataMandrill(function(res){
                        setTimeout(_bind(function(){

                            $(self.message).velocity({opacity:0}, 300, function(){
                                if( res[0] == undefined  || res[0].status === undefined || 
                                    res[0].status === "rejected" || 
                                    res[0].status === "invalid"){
                                    $(self.message).html('Unable to send data.');
                                }
                                else{
                                    $(self.message).html('Data sent successfully.');
                                }

                                $(self.message).velocity({opacity:1},300).delay(1000).velocity({opacity:0},300, function(){
                                    $(this).css({display: 'none'});
                                    $(self.buttons).css({display: 'block'}).velocity({opacity:1}, 300);
                                });
                            });

                        }, this), 1000);
                    });                                
                })
            });
        }

    });

    var PageController = new (Class.extend({

        pages: {
            "start" : new startPage(),
            "calibration": new calibrationPage(),
            "experiment": new experimentPage(),
            "complete": new completePage()
        },

        init: function(){
            this.curPage = this.pages["start"];
            this.orientPage = _el('changeOrient');

            window.onresize = _bind(this.handleResize, this);
        },

        transition: function(pageName, callback){
            var page = this.pages[pageName];
            callback = callback || function(){}

            if(page){
                this.curPage.hide(_bind(function(){
                    this.curPage = page;
                    this.handleResize();
                    page.show(_bind(callback, page));
                }, this));
            }
        },

        handleResize: function(){
            if(this.curPage.limitOrient){ 
                window.scrollTo( 0, 1 ); 
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

    PageController.init();

})();
