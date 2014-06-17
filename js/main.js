(function(){

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
            if(!this.shown){
                this.shown = true;
                $(this.el).css('display', 'block');
                $(this.el).animate({opacity:1}, 300, callback);              
            }

        },

        hide: function(callback){
            if(this.shown){
                this.shown = false;
                $(this.el).animate({opacity:0}, 100, _bind(function(){
                    this.onHide();
                    callback();
                    $(this.el).css('display', 'none');
                }, this));                
            }
        },

        onHide: function(){ },
        handleResize: function(){ }

    });

/*    var notifier = {
        
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


*/

    var windowWidth = window.innerWidth;
    var windowHeight = window.innerHeight;
    var pixelRatio = window.devicePixelRatio || 1;

    var config = {
        name: '',
        experiment: '',
        experimentTime: '',
        email: localStorage["pltrckr-email"] || 'your@email.com',
        duration: localStorage["pltrckr-dur"] || 20, //(1000 * 2 * 60),          // 2 mins
        durationActual: '',
        sampleInterval: 1000,
        touchMaxDistInitial: 0,
        touchMinDistInitial: 0,
        touchMaxDistFinal: 0,
        touchMinDistFinal: 0,
        touchFeedback: true,
        calibFail: false,
        ratings: [],
        cancelTime: 5
    };

    var getDistance = function(x1, y1, x2, y2){
        return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
    }

    var settingsPage = new (Page.extend({
        id: 'settingsPage',

        limitOrient: false,

        init: function(){
            this._super();
            _bindAll(this, 'handleSave', 'showStart');

            new MBP.fastButton(this.el.find('#saveSubmit'), this.handleSave);
            new MBP.fastButton(this.el.find('#cancelSubmit'), this.showStart);
        },

        handleSave: function(){
            localStorage["pltrckr-email"] = config.email = $(this.el).find('#email').val().trim();
            localStorage["pltrckr-duration"] = config.duration = $(this.el).find('#duration').val().trim();

            this.showStart();
        },

        showStart: function(){
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

            PageController.transition("calibration", function(){
                this.begin("Initial");
            });
        },

        showSettings: function(){
            this.hide(settingsPage.show);
        }

    });


    var bubble = function(){
        return {
            x: 0,
            y: windowHeight/2,
            r: 40,
            circle: null,
            line: null,
            selected: false,
            update: function(){
                this.circle.attr("cx", this.x);
                this.circle.attr("cy", this.y);
                this.line.attr("path", "M" + windowWidth/2 + " " + windowHeight/2 + "L" + this.x + " " + this.y);
            },

            toggleSelected: function(){
                console.log("toggling", this.selected);
                if(this.selected){
                    this.circle.animate({
                        "fill-opacity": 0.2,
                        "r": 40
                    }, 300, "bounce");  
                    this.selected = false;                      
                }
                else{
                    this.circle.animate({
                        "fill-opacity": 0.6,
                        "r": 60
                    }, 300, "bounce");                     
                }
            }
        };
    }


    var calibrationPage = Page.extend({

        id: 'calibrationPage',

        trials: [{
            title: 'Indicate <span class="strong">Maximum</span> Pleasure',
            instr: 'Using two fingers, drag the circles as far apart as comfortably possible.',
            configVar: 'touchMaxDist'
        }, {
            title: 'Indicate <span class="strong">Minimum</span> Pleasure',
            instr: 'Using two fingers, drag the circles as close as comfortably possible.',
            configVar: 'touchMinDist'
        }],

        init: function(){
            this._super();
            _bindAll(this, 'handleTouchStart', 'handleTouchMove', 'handleTouchEnd');

            this.tracker = this.el.find('#calibTracker');
            this.titleText = this.el.find('#calibTitle');
            this.instrText = this.el.find('#calibInstr');
            this.completePage = this.el.find('#calibComplete');

            this.paper = Raphael(this.tracker, window.innerWidth, window.innerHeight);
            this.begun = false;
        },


        initPaper: function(callback){

            if (window.innerWidth < window.innerHeight) {
                this.orient = false;
                return;
            }
            else{
                this.orient = true;
            }

            this.tracker.style.opacity = 1;
            var shapes = this.paper.shapes = {};

            shapes.bubbles = [new bubble(), new bubble()];
            shapes.bubbles[0].x = windowWidth/2 - 40;
            shapes.bubbles[1].x = windowWidth/2 + 40;
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

            this.titleText.style.opacity = 0;
            this.instrText.style.opacity = 0;

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

            if(this.begun){
                this.startTrial(0);
            }
        },

        handleResize: function(){
            this.paper.setSize(window.innerWidth, window.innerHeight);
            if (Math.abs(window.orientation) !== 90) {
                if(!this.orient){
                    this.initPaper();
                    this.orient = true;
                    window.scrollTo( 0, 1 );                    
                }
            }
        },

        begin: function(phase){

            this.trialParams = {
                queue: (phase == 'Initial') ? [1,0,1] : [1],
                cur: -1,
                step: 1,
                index: 1,
                maxSteps: (phase == 'Initial') ? 2 : 1,
                phase: phase,
                verify: (phase == 'Initial') ? true : false,
            }

            this.begun = true;
            this.initPaper();

            this.tracker.on('touchmove', this.handleTouchMove);
            this.tracker.on('touchend', this.handleTouchEnd);
            this.tracker.on('touchcancel', this.handleTouchEnd);  
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
                        self.paper.clear();
                        self.paper = null;  
                        
                        $(self.completePage).show();

                        new MBP.fastButton(self.completePage.find('#btnExp'), function() {
                            PageController.transition("experiment");                                 
                        });                      
                    }
                });
            });
        },

        onHide: function(){
            $(this.completePage).hide();
        },

        startTrial: function(trialIndex){
            
            var trial = this.trials[trialIndex];

            this.trialParams.cur = trialIndex;

            this.titleText.innerHTML = trial.title;
            this.instrText.innerHTML = trial.instr;

            this.paper.shapes.bubbles.forEach(function(b){
                b.circle.animate({
                    "fill": "rgb(216, 0, 57)"
                }, 200);   
            }); 
            this.tracker.on('touchstart', this.handleTouchStart);

            $(this.titleText).velocity({opacity: 1}, 300, _bind(function(){
                $(this.instrText).velocity({opacity: 1}, 200);
            }, this));
        },

        endTrial: function(){
            var bubbles = this.paper.shapes.bubbles;

            this.tracker.off('touchstart', this.handleTouchStart);
            bubbles.forEach(function(b){
                b.circle.animate({
                    "fill": "#888"
                }, 200);   
            });

            var distance = bubbles.distance(),
                tp = this.trialParams,
                trial = this.trials[tp.cur];

            if(tp.step == tp.maxSteps && tp.verify){
                if( Math.abs(distance - config[trial.configVar + tp.phase]) > 100 ){
                    tp.queue.push(tp.cur);
                    config.calibFail = true;
                }
                else{
                    config[trial.configVar + tp.phase] = Math.floor((config[trial.configVar + tp.phase] + distance) / 2);
                }                
            }
            else{
                config[trial.configVar + tp.phase] = distance;
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


        handleTouchStart: function(e){
            e.preventDefault();
            var changed = e.changedTouches,
                shapes = this.paper.shapes;

            for(var i = 0; i < changed.length ; i++){ 
                for(var j = 0; j < 2 /*shapes.bubbles.length*/; j++){
                    var b = shapes.bubbles[j];
                    if(!b.selected && b.circle.isPointInside(changed[i].pageX, changed[i].pageY)){
                        b.x = changed[i].pageX;
                        b.y = changed[i].pageY;
                        b.update();
                        b.toggleSelected();
                        b.selected = changed[i].identifier;
                        shapes.joinLine.updatePos();
                        break;
                    }                    
                }
            }

            if(shapes.bubbles.selected()){
                this.detectedDoubleTouch = true;
                $(this.instrText).velocity({opacity:0}, 50, _bind(function(){
                    this.instrText.innerHTML = 'Release both fingers to set.';
                    $(this.instrText).velocity({opacity:1}, 100);
                }, this));
            }

        },

        handleTouchMove: function(e){
            e.preventDefault();
            var changed = e.changedTouches,
                shapes = this.paper.shapes;
            
            for(var i = 0; i < changed.length ; i++){ 

                for(var j = 0; j < 2 /*shapes.bubbles.length*/; j++){
                    var b = shapes.bubbles[j];
                    if(b.selected === changed[i].identifier){
                        b.x = changed[i].pageX;
                        b.y = changed[i].pageY;
                        b.update();
                        shapes.joinLine.updatePos();
                        break;
                    }
                }

            }  
        },

        handleTouchEnd: function(e){
            e.preventDefault();
            var changed = e.changedTouches,
                shapes = this.paper.shapes;
            
            for(var i = 0; i < changed.length ; i++){ 

                for(var j = 0; j < 2 /*shapes.bubbles.length*/; j++){
                    var b = shapes.bubbles[j];
                    if(b.selected === changed[i].identifier){
                        b.toggleSelected();
                        break;
                    }
                }
            } 

            if(this.detectedDoubleTouch && !shapes.bubbles[0].selected && !shapes.bubbles[1].selected) {
                this.detectedDoubleTouch = false;
                this.endTrial();
            }
        }

    });

    var PageController = new (Class.extend({

        pages: {
            "start" : new startPage(),
            "calibration": new calibrationPage(),
            "experiment": null
        },

        init: function(){
            this.curPage = this.pages["start"];
            this.orientPage = _el('changeOrient');

            window.onresize = _bind(this.handleResize, this);
        },

        transition: function(pageName, callback){
            var page = this.pages[pageName];

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
