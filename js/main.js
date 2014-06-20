(function(){

    function utf8_to_b64( str ) {
        return window.btoa(unescape(encodeURIComponent( str )));
    }

    var Page = View.extend({
        shown: true,
        limitOrient: true,

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
        handleDoubleTouchMove: function(){}


    });

    var notifier = {
        
        currentPlaying: null,

        sounds: {
            contactLoss: new Howl({urls:['alerts/contact_loss.mp3'], volume: 0.9}),
            contact: new Howl({urls:['alerts/contact.mp3']}),
        },

        init: function(){
        },

        play: function(sound){
            this.sounds[sound].play();
        },

        pause: function(sound){
            this.sounds[sound].pause();
        }

    }

    function getDevice(){
        var ua = navigator.userAgent,
            devices = ['iPhone', 'iPad', 'iPod', 'Android', 'IEMobile'];

        for(var i=0; i<devices.length; i++){
            if(ua.match(devices[i])){
                return devices[i];
            }
        }
        return ua;
    }

    var windowWidth = window.innerWidth;
    var windowHeight = window.innerHeight;
    var pixelRatio = window.devicePixelRatio || 1;
    var rater = {};

    var config = {
        name: '',
        experiment: '',
        experimentTime: '',
        absoluteTime: '',
        email: localStorage["pltrckr-email"] || 'lauren.vale@nyu.edu',
        duration: localStorage["pltrckr-duration"] || 30,
        durationActual: '',
        sampleInterval: 1000,
        preMaxDist: [],
        preMinDist: [],
        postMaxDist: [],
        postMinDist: [],
        medianMaxDist: 0,
        medianMinDist: 0,
        touchFeedback: true,
        calibFail: false,
        ratings: [],
        cancelTime: 5,
        url: window.location.href,
        device: getDevice(),
        location: {
            long: null,
            lat: null,
            accuracy: null
        },

        preSteps: localStorage["pltrckr-preSteps"] || 2,
        postSteps: localStorage["pltrckr-postSteps"] || 1,
        feedback:{
            barbell: JSON.parse(localStorage["pltrckr-feedBarbell"] || "false"),
            range: JSON.parse(localStorage["pltrckr-feedRange"] || "false"),
            numeric: JSON.parse(localStorage["pltrckr-feedNumeric"] || "false"),
            auditory: JSON.parse(localStorage["pltrckr-feedAuditory"] || "false"),
            // tactile: JSON.parse(localStorage["pltrckr-feedTactile"] || "false")
        },
        postInMedian: JSON.parse(localStorage["pltrckr-postInMedian"] || "false") ,

        generateData: function(){

            this.medianMaxDist = (this.postInMedian) ? findMedian(this.preMaxDist.concat(this.postMaxDist)) : findMedian(this.preMaxDist); 
            this.medianMinDist = (this.postInMedian) ? findMedian(this.preMinDist.concat(this.postMinDist)) : findMedian(this.preMinDist); 
            
            return tmpl("data_tmpl", this);       
        }
    };

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
            this.preSteps = $(this.el.find('#preSteps')).val(config.preSteps);
            this.postSteps = $(this.el.find('#postSteps')).val(config.postSteps);

            this.feedBarbell = $(this.el).find('#feedBarbell').prop('checked', config.feedback.barbell);
            this.feedRange = $(this.el.find('#feedRange')).prop('checked', config.feedback.range);
            this.feedNumeric = $(this.el.find('#feedNumeric')).prop('checked', config.feedback.numeric);
            this.feedAuditory = $(this.el.find('#feedAuditory')).prop('checked', config.feedback.auditory);
            //this.feedTactile = $(this.el.find('#feedTactile')).prop('checked', config.feedback.tactile);

            this.postInMedian = $(this.el.find('#postInMedian')).prop('checked', config.postInMedian);

            this.buttons = this.el.find('.fixed-wrapper');

            new MBP.fastButton(this.el.find('#saveSubmit'), this.handleSave);
            new MBP.fastButton(this.el.find('#cancelSubmit'), this.showStart);

            $(this.el).on('focusin', this.unFloatButtons);
            $(this.el).on('focusout', this.floatButtons);
        },

        handleSave: function(){
            localStorage["pltrckr-email"] = config.email = $(this.email).val().trim();
            localStorage["pltrckr-duration"] = config.duration = $(this.duration).val().trim();

            localStorage["pltrckr-preSteps"] = config.preSteps = $(this.preSteps).val().trim();
            localStorage["pltrckr-postSteps"] = config.postSteps = $(this.postSteps).val().trim();

            localStorage["pltrckr-feedBarbell"] = config.feedback.barbell = $(this.feedBarbell).prop('checked');
            localStorage["pltrckr-feedRange"] = config.feedback.range = $(this.feedRange).prop('checked');
            localStorage["pltrckr-feedNumeric"] = config.feedback.numeric = $(this.feedNumeric).prop('checked');
            localStorage["pltrckr-feedAuditory"] = config.feedback.auditory = $(this.feedAuditory).prop('checked');
            //localStorage["pltrckr-feedTactile"] = config.feedback.tactile = $(this.feedTactile).prop('checked');

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
            _bindAll(this, 'handleSubmit', 'showSettings');

            this.name = this.el.find('#name');
            this.experiment = this.el.find('#experiment');

            this.name.on("change", this.removeInvalidHighlight);
            this.experiment.on("change", this.removeInvalidHighlight);

            new MBP.fastButton(this.el.find('#startSubmit'), this.handleSubmit);
            new MBP.fastButton(this.el.find('#btnSettings'), this.showSettings);
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
                this.begin("pre");
            });
        },

        showSettings: function(){
            this.hide(settingsPage.show);
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
                line: null,
                selected: false,
                update: function(){
                    this.circle.attr("cx", this.x);
                    this.circle.attr("cy", this.y);
                    this.line.attr("path", "M" + window.innerWidth/2 + " " + window.innerHeight/2 + "L" + this.x + " " + this.y);
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
            this.initialized = true;

            window.scrollTo( 0, 1 ); 
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

                b.line = self.paper.path('');
                b.line.attr('stroke', '#000');
                b.line.attr('stroke-opacity', 0.1);
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
                this.paper.setSize(window.innerWidth, window.innerHeight);
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
            title: 'Indicate <span class="strong">Maximum</span> pleasure',
            instr: 'Using two fingers, drag the circles as far apart as comfortably possible.',
            configVar: 'MaxDist'
        }, {
            title: 'Indicate <span class="strong">Minimum</span> pleasure',
            instr: 'Using two fingers, drag the circles as close as comfortably possible.',
            configVar: 'MinDist'
        }],

        init: function(){
            this._super();
            _bindAll(this, 'handlePreEnd', 'beginTrials');


            this.tracker = this.el.find('#calibTracker');
            this.titleText = this.el.find('#calibTitle');
            this.instrText = this.el.find('#calibInstr');
            this.completePage = this.el.find('#calibComplete');

            new MBP.fastButton(this.completePage.find('#btnExp'), this.handlePreEnd);
        },

        handleResize: function(){
            if(this.bubbles){
                this.bubbles.handleResize();
            }
        },

        handlePreEnd: function(){
            PageController.transition("experiment", function(){
                this.begin();
            }); 
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

        begin: function(phase){
            var self = this;

            this.trialParams = {
                queue: self.generateQueue(config[phase + 'Steps']),
                cur: -1,
                step: 1,
                index: 1,
                maxSteps: config[phase + 'Steps'],
                phase: phase,
                verify: (phase == 'pre') ? true : false,
            }

            this.titleText.style.opacity = 0;
            this.instrText.style.opacity = 0;

            this.bubbles = new BubbleView({el: this.tracker, drag: true});
            if(this.bubbles.initialized){
                this.beginTrials();
            }
            else{
                this.bubbles.on('initialized', this.beginTrials);
            }
        },

        beginTrials: function(){
            this.tracker.on('touchmove', this.handleTouchMove);
            this.tracker.on('touchend', this.handleTouchEnd);
            this.tracker.on('touchcancel', this.handleTouchEnd); 

            this.startTrial(0); 
        },

        end: function(){
            this.tracker.off('touchmove', this.handleTouchMove);
            this.tracker.off('touchend', this.handleTouchEnd);
            this.tracker.off('touchcancel', this.handleTouchEnd);  

            var self = this;
            $(this.instrText).velocity({opacity: 0}, 50, function(){
                $(self.titleText).velocity({opacity: 0}, { duration: 200, queue: false });
                $(self.tracker).velocity({opacity: 0}, { duration: 200, queue: false, 
                    complete: function(){
                        self.bubbles.paper.clear();
                        
                        if(self.trialParams.phase === 'pre'){
                            $(self.completePage).show();                               
                        }
                        else{
                            PageController.transition("complete");
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
            this.tracker.on('touchstart', this.handleTouchStart);

            $(this.titleText).velocity({opacity: 1}, 200);
            $(this.instrText).velocity({opacity: 1}, 200);
        },

        endTrial: function(){

            this.tracker.off('touchstart', this.handleTouchStart);
            this.bubbles.shapes.bubbles.forEach(function(b){
                b.circle.animate({
                    "fill": "#888"
                }, 200);   
            });

            var distance = this.bubbles.shapes.bubbles.distance(),
                tp = this.trialParams,
                trial = this.trials[tp.cur],
                phaseVar = tp.phase + trial.configVar;

            if(tp.step == tp.maxSteps && tp.verify){
                if( Math.abs(distance - config[phaseVar].slice(-1)[0]) > 100 ){
                    tp.queue.push(tp.cur);
                }             
            }
            config[phaseVar].push(distance);

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
            this.bubbles.onTouchStart(touch, this.touches);
        },

        onTouchMove: function(touch){
            this.bubbles.onTouchMove(touch, this.touches);
        },

        onTouchEnd: function(touch){
            this.bubbles.onTouchEnd(touch, this.touches);
            if(this.bubbles.doubleSelect && !this.bubbles.shapes.bubbles[0].selected && !this.bubbles.shapes.bubbles[1].selected){
                this.endTrial();
                this.bubbles.doubleSelect = false;
            }
        },

        handleDoubleTouchStart: function(){
            if(this.bubbles.shapes.bubbles.selected()){
                this.bubbles.doubleSelect = true;
                $(this.instrText).velocity({opacity:0}, 50, _bind(function(){
                    this.instrText.innerHTML = 'Release both fingers to set.';
                    $(this.instrText).velocity({opacity:1}, 100);
                }, this));                 
            }
        },

    });

    var generateExperimentString = function(){
        var time = config.experimentTime;
        var subjectParams = [config.name, config.experiment, time.getFullYear(), time.getMonth(), time.getDate(), time.getHours(), time.getMinutes()];
        return subjectParams.join('.');        
    }

    var generateMailBody = function(){
        var html = ' \
            <h2> Experiment Report </h2> \
            <table> \
                <tr> <td>Username:</td> <td>' + config.name + '</td> </tr> \
                <tr> <td>Experiment:</td> <td>' + config.experiment + '</td> </tr> \
                <tr> <td>Date and Time:</td> <td>' + config.experimentTime.toString() + '</td> </tr> \
            </table>';
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

        $.post("https://mandrillapp.com/api/1.0/messages/send.json",
            JSON.stringify(msg),
            callback
        );     
    }

    var generateMailLink = function(){
        var subject = '[Pleasure] ' + generateExperimentString(),
            body = config.generateData();
        
        body = body.replace(/\n/g, "%0D%0A");

        return ('mailto:' + config.email + '?subject=' + subject + '&body=' + body);    
    }


    var Feedbacks = View.extend({
        id: 'feedbacks',
        enabled: [],

        init: function(){
            this._super();
        },

        enable: function(){
            this.enabled = [];
            if(config.feedback.numeric){
                this.enabled.push(new NumericFeedback());
            }
            if(config.feedback.range){
                this.enabled.push(new RangeFeedback());
            }
            if(config.feedback.barbell){
                this.enabled.push(new BarbellFeedback());
            }
            if(config.feedback.auditory){
                this.enabled.push(new AuditoryFeedback());
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
            var rating = rater.getRating(touches);
            for(var i = 0; i<this.numEnabled; i++){
                this.enabled[i].onEnd(touches, rating);
            }
        }
    });


    var NumericFeedback = View.extend({
        id: 'numericFeedback',

        init: function(){
            this._super();
        },

        onStart: function(t, rating){
        },

        onMove: function(t, rating){
            this.el.innerHTML = Math.round(rating);
        },

        onEnd: function(t, rating){
            this.el.innerHTML = '';
        }
    });

    var RangeFeedback = View.extend({
        id: 'rangeFeedback',

        init: function(){
            this._super();
            this.colors = [
                '#e70000',
                '#e76700',
                '#f1bb00',
                '#add800',
                '#00c40e'  
            ];
        },

        colorFromRating: function(rating){
            return this.colors[Math.round(rating/2)];
        },

        onStart: function(t, rating){
        },

        onMove: function(t, rating){
            var height = windowHeight * (rating/10);
            $(this.el).css('height', height + 'px');
            $(this.el).css('backgroundColor', this.colorFromRating(rating));
        },

        onEnd: function(t, rating){
            $(this.el).css('height', 0);
        }
    });

    var BarbellFeedback = View.extend({
        id: 'barbellFeedback',

        init: function(){
            this._super();
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

    var AuditoryFeedback = View.extend({
        init: function(){
            this.context = new webkitAudioContext();
            this.oscillator = this.context.createOscillator();
            this.oscillator.type = 0;
            this.gainNode = this.context.createGainNode();
        },

        getFrequencyFromRating: function(rating){
            rating += 1;
            return Math.log(rating) * 1000;
        },

        onStart: function(t, rating){
            this.oscillator.frequency.value = this.getFrequencyFromRating(rating);
            this.oscillator.connect(this.gainNode); 
            this.gainNode.connect(this.context.destination); 
            this.gainNode.gain.value = .1; 
            this.oscillator.noteOn(0);
        },

        onMove: function(t, rating){
            this.oscillator.frequency.value = this.getFrequencyFromRating(rating);
        },

        onEnd: function(){
            this.oscillator.disconnect(); 
        }
    });


    var experimentPage = DoubleTouchPage.extend({
        id: 'experimentPage',

        init: function(){
            this._super();
            _bindAll(this, 'begin', 'stop', 'sampleRating');
            
            this.titleText = this.el.find('#expTitle');
            this.status = {
                doubleTouch: false,
                started: false,
                canceled: false
            };
            this.samples = [];
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
            this.feedbacks = new Feedbacks();

        },

        begin: function(){

            rater = (function(){
                var minDist = findMedian(config.preMinDist),
                    maxDist = findMedian(config.preMaxDist);

                var ratingRange = maxDist - minDist,
                    ratingStep = ratingRange / 10;

                return {
                    getRating: function(touches){
                        var distance = getDistance(touches[0].x, touches[0].y, touches[1].x, touches[1].y);
                        if(distance < minDist) {
                            distance = minDist;
                        }
                        else if(distance > maxDist){
                            distance = maxDist;
                        }

                        return (distance - minDist) / ratingStep;                 
                    }
                };
            })();

            this.feedbacks.enable();

            window.addEventListener('touchstart', this.handleTouchStart);
            window.addEventListener('touchmove', this.handleTouchMove);
            window.addEventListener('touchend', this.handleTouchEnd);
            window.addEventListener('touchcancel', this.handleTouchEnd);            
        },

        sampleRating: function(){
            var touches = this.touches,
                rating = rater.getRating(touches).toFixed(1);
            
            if(!touches[0].id || !touches[1].id && rating !== this.samples[this.samples.length-1]){
                rating *= -1;
            }
            this.samples.push(rating);  
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
                this.feedbacks.onEnd(this.touches);
            }
            config.durationActual = Math.floor( (config.durationActual - config.experimentTime) / 1000 );

            this.sampleRating();
            config.ratings = this.samples.slice(0, config.durationActual);


            this.titleText.innerHTML = 'The experiment concluded in <b>' + config.durationActual +'</b>s. Prepare to calibrate again.';
            setTimeout(function(){
                PageController.transition("calibration", function(){
                    this.begin("post");
                });
            },3000);
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
                this.titleText.innerHTML = '';
                this.timers.sample = setInterval(this.sampleRating, config.sampleInterval);
                this.timers.end = setTimeout(this.stop, (config.duration * 1000) );

                this.status.started = true;
                config.experimentTime = new Date();
                config.absoluteTime = config.experimentTime.getTime();
            }
        },

        handleDoubleTouchEnd: function(){
            this.feedbacks.onEnd(this.touches);
            this.timers.cancel = setTimeout(this.stop, config.cancelTime * 1000);
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

            this.message = this.el.find("#completeMessage");
            this.buttons = this.el.find("#completeButtons");
            this.sendButton = this.buttons.find("#btnReSend");
        },

        render: function(){
            $(this.message).html("Thank you.")
            $(this.sendButton).attr("href", generateMailLink());
            this.buttons.style.opacity = 0;
        },

        post_render: function(){
            var self = this;
            mailDataMandrill(function(res){
                setTimeout(_bind(function(){
                    $(self.message).velocity({opacity:0}, 300, function(){
                        if(res[0].status === "rejected" || res[0].status === "invalid"){
                            $(self.message).html('Unable to send data.');
                        }
                        else{
                            $(self.message).html('Data sent successfully.');
                        }

                        $(self.message).velocity({opacity:1}, 300);
                        $(self.buttons).velocity({opacity:1}, 300);
                    });
                }, this), 2000);
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
            windowWidth = window.innerWidth;
            windowHeight = window.innerHeight;

            if(this.curPage.limitOrient){ 
                if (window.innerWidth > window.innerHeight) { // Landscape
                    this.orientPage.hide();
                    this.curPage.el.show();
                }
                else{ // Portrait
                    this.curPage.el.hide();
                    this.orientPage.show();
                }                
            }

            this.curPage.handleResize();           
        }

    }))();

    PageController.init();

})();
