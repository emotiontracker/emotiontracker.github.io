(function(){

    var bubbleContainer = document.getElementById("trackerBubbles");

    var windowWidth = window.innerWidth;
    var windowHeight = window.innerHeight;
    var pixelRatio = window.devicePixelRatio || 1;

    var touches = {},
        touchLine;
    var paper = Raphael("tracker", windowWidth, windowHeight);
    var changeOrient = $("#changeOrient");
    var doubleTouchStart = new Event('doubletouchstart'),
        doubleTouchEnd = new Event('doubletouchend');


    var config = {
        name: '',
        experiment: '',
        experimentTime: '',
        email: localStorage["pltrckr-email"] || 'jugalm9@gmail.com',
        duration: localStorage["pltrckr-dur"] || 20, //(1000 * 2 * 60),          // 2 mins
        durationActual: '',
        touchMaxDist: 0,
        touchMinDist: 0,
        touchFeedback: true,
        calibFail: false,
        ratings: [],
        cancelTime: 5
    };

    var pages = {
        start: $("#startPage"),
        calibrate: $("#calibrationPage"),
        experiment: $("#experimentPage"),
        settings: $("#settingsPage")
    }

    function createLine(x1, y1, x2, y2){
        var line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("x1", x1);
        line.setAttribute("y1", y1);
        line.setAttribute("x2", x2);
        line.setAttribute("y2", y2);
        return line;
    }

    function getTouch(index){
        return touches[Object.keys(touches)[index]];
    }

    function getDist(x1, y1, x2, y2){
        return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
    }

    var $emailText = $("#email"),
        $durationText = $("#duration"),
        $nameText = $("#name"),
        $experimentText = $("#experiment");


    function start(){
    	
    	pages.settings.css("opacity", 0);

    	function showSettings(){
    		$emailText.val(config.email);
    		$durationText.val(config.duration);

            pages.start.animate({opacity:0}, 100, function(){
                pages.settings.show();
                pages.settings.velocity({opacity: 1}, 100);
            });
    	}

    	function hideSettings(){
			pages.settings.velocity({opacity: 0}, 100, "easeInQuart", function(){
				pages.settings.hide();
                pages.start.animate({opacity:1}, 100);
			});
    	}


        function setInvalid($el){
            $el.addClass("invalid");
        }

        function removeInvalid($el){
            if($el.hasClass("invalid")){
                $el.removeClass("invalid");
            }
        }

        $nameText.on("change", function(){
            removeInvalid($(this));
        });

        $experimentText.on("change", function(){
            removeInvalid($(this));
        });

        new MBP.fastButton(document.getElementById('btnSettings'), showSettings);
        new MBP.fastButton(document.getElementById('startSubmit'), function(){

            config.name = $nameText.val().trim(),
            config.experiment = $experimentText.val().trim();

            var invalidFlag = true;

            if(config.name === ''){
                setInvalid($nameText);
                invalidFlag = false;
            }

            if(config.experiment === ''){
                setInvalid($experimentText);
                invalidFlag = false;
            }

            if(!invalidFlag){
                return false;
            }

            pages.start.velocity({opacity: 0}, 300, function(){
                pages.start.hide();
                pages.calibrate.show();
                calibrate();
            });
        });


        new MBP.fastButton(document.getElementById('saveSubmit'), function(){
            config.email = $("#email").val().trim();
            config.duration = $("#duration").val().trim();

            localStorage["pltrckr-email"] = config.email;
            localStorage["pltrckr-duration"] = config.duration;

            hideSettings();
        });
        new MBP.fastButton(document.getElementById('cancelSubmit'), hideSettings);
    }

    function calibrate(){

        var trials = [{
            title: 'Indicate <span class="strong">Maximum</span> Pleasure',
            instr: 'Using two fingers, drag the circles as far apart as comfortably possible.',
            configVar: 'touchMaxDist'
        }, {
            title: 'Indicate <span class="strong">Minimum</span> Pleasure',
            instr: 'Using two fingers, drag the circles as close as comfortably possible.',
            configVar: 'touchMinDist'
        }];


        // var medianLine = paper.path("M0 " + windowHeight/2 + "L" + windowWidth + " " + windowHeight/2);
        // medianLine.attr("stroke", "#eee");
        // medianLine.attr("stroke-dasharray", "--");


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

        var bubbles, joinLine;
        var doubleDetect = false;
        var trialIndex = 0,
            trialCount = 1,
            trialFail = [],
            trial;

        function onTouchStart(e){
            e.preventDefault();
            var changed = e.changedTouches;

            for(var i = 0; i < changed.length ; i++){ 

                bubbles.forEach(function(b){
                    if(b.selected) return;

                    if(b.circle.isPointInside(changed[i].pageX, changed[i].pageY)){

                        b.x = changed[i].pageX;
                        b.y = changed[i].pageY;
                        b.update();
                        joinLine.attr("path", "M" + bubbles[0].x + " " + bubbles[0].y + "L" + bubbles[1].x + " " + bubbles[1].y);
                        b.toggleSelected();

                        b.selected = changed[i].identifier;
                    }
                });

            }

            if(bubbles[0].selected && bubbles[1].selected){
                doubleDetect = true;
                $(instrEl).velocity({opacity:0}, 200, function(){
                    instrEl.innerHTML = 'Release both fingers to set.';
                    $(instrEl).velocity({opacity:1}, 200);
                });
                
            }
        }

        function onTouchMove(e){
            e.preventDefault();
            var changed = e.changedTouches; 
            
            for(var i = 0; i < changed.length ; i++){ 

                bubbles.forEach(function(b){
                    if(b.selected === changed[i].identifier){
                        b.x = changed[i].pageX;
                        b.y = changed[i].pageY;
                        b.update();
                        joinLine.attr("path", "M" + bubbles[0].x + " " + bubbles[0].y + "L" + bubbles[1].x + " " + bubbles[1].y);
                    }
                });

            }            
        }

        function onTouchEnd(e){
            e.preventDefault();
            var changed = e.changedTouches; 
            
            for(var i = 0; i < changed.length ; i++){ 

                bubbles.forEach(function(b){
                    if(b.selected === changed[i].identifier){
                        b.toggleSelected();
                    }
                });

            }    

            if(doubleDetect && !bubbles[0].selected && !bubbles[1].selected){

                doubleDetect = false;
                window.removeEventListener("touchstart", onTouchStart);

                bubbles.forEach(function(b){
                    b.circle.animate({
                        "fill": "#888"
                    }, 200);   
                }); 

                var sampleX1 = bubbles[0].x,
                    sampleX2 = bubbles[1].x,
                    sampleY1 = bubbles[0].y,
                    sampleY2 = bubbles[1].y;

                var dist = getDist(sampleX1, sampleY1, sampleX2, sampleY2);
                if(trialCount == 2){
                    if( Math.abs(dist - config[trial.configVar]) > 100 ){
                        trialFail.push(trialIndex);
                        config.calibFail = true;
                    }
                    else{
                        config[trial.configVar] = Math.floor((config[trial.configVar] + dist)/2);
                    }
                }
                else{
                    config[trial.configVar] = dist;
                }

                if(trialIndex == 0){
                    if(trialCount == 3){
                        trialIndex = trialFail.splice(0,1)[0];
                    }
                    else{
                        trialIndex++;
                    }
                    
                }
                else{
                    if(trialCount == 1){
                        trialIndex = 0;
                    }
                    else{
                        trialIndex = trialFail.splice(0,1)[0];
                    }
                    trialCount++;
                }

                if(trialIndex !== undefined){
                    $(instrEl).velocity({opacity: 0}, 200, function(){
                        $(titleEl).velocity({opacity: 0}, 400, function(){
                            //console.log("starting trial pre");
                            startTrial(trialIndex);
                        });
                    });
                    
                }
                else{

                    window.removeEventListener("touchmove", onTouchMove);
                    window.removeEventListener("touchend", onTouchEnd);
                    window.removeEventListener("touchcancel", onTouchEnd);   

                    $(instrEl).velocity({opacity: 0}, 400, function(){
                        $(titleEl).velocity({opacity: 0}, { duration: 400, queue: false });
                        $("#tracker").velocity({opacity: 0}, { duration: 200, queue: false, complete: function(){
                            $("#calibComplete").show();

                            // new MBP.fastButton(document.getElementById('btnRetry'), function() {
                            //     $("#calibComplete").hide();
                            //     calibrate();
                            // });  

                            new MBP.fastButton(document.getElementById('btnExp'), function() {
                                pages.calibrate.velocity({opacity:0}, 300, function(){
                                    pages.experiment.show();
                                    experiment();                                    
                                });
                            });                   
                        }});
                    });
                }   

            }       
        }


        var titleEl = document.getElementById("calibTitle"),
            instrEl = document.getElementById("calibInstr");


        var startTrial = function(trialIndex){

            window.addEventListener("touchstart", onTouchStart);

            trial = trials[trialIndex];

            titleEl.innerHTML = trial.title;
            instrEl.innerHTML = trial.instr;

            //console.log("starting trial");

            $(titleEl).velocity({opacity: 1}, 400, function(){
                $(instrEl).velocity({opacity: 1}, 200);
            });
            
            bubbles.forEach(function(b){
                b.circle.animate({
                    "fill": "rgb(216, 0, 57)"
                }, 200);   
            }); 
        }

        var initialize = function(){
            $("#tracker").css('opacity', 1);
            paper.clear();
            
            bubbles = [new bubble(), new bubble()];
            bubbles[0].x = windowWidth/2 - 40;
            bubbles[1].x = windowWidth/2 + 40;  
            
            joinLine = paper.path("M" + bubbles[0].x + " " + bubbles[0].y + "L" + bubbles[1].x + " " + bubbles[1].y);
            joinLine.attr("stroke", "#c6003b");
            joinLine.attr("stroke-opacity", 0);   

            window.removeEventListener("touchmove", onTouchMove);
            window.removeEventListener("touchend", onTouchEnd);
            window.removeEventListener("touchcancel", onTouchEnd);  

            window.addEventListener("touchmove", onTouchMove);
            window.addEventListener("touchend", onTouchEnd);
            window.addEventListener("touchcancel", onTouchEnd);    

            titleEl.style.opacity = 0;
            instrEl.style.opacity = 0;   

            bubbles.forEach(function(b){
                b.circle = paper.circle(b.x, b.y, b.r);
                b.circle.attr("fill", "rgb(216, 0, 57)");
                b.circle.attr("fill-opacity", 0);
                b.circle.attr("stroke", "none");

                b.line = paper.path("");
                b.line.attr("stroke", "#000");
                b.line.attr("stroke-opacity", 0.1);
                b.update();

                b.circle.animate({
                    "fill-opacity": 0.2
                },500);

                joinLine.animate({
                    "stroke-opacity": 1
                }, 100, "linear", function(){
                    startTrial(0);
                });                
            });
        }
        
        var orient = false;
        window.onresize = function(){
            windowWidth = window.innerWidth;
            windowHeight = window.innerHeight;

            if (Math.abs(window.orientation) === 90) {
                pages.calibrate.hide();
                changeOrient.show();
            } else {
                changeOrient.hide();
                if(!orient){
                    paper.setSize(window.innerWidth, window.innerHeight);
                    initialize();
                    orient = true;
                }
                pages.calibrate.show(); 
                window.scrollTo( 0, 1 );
            }            
        }

        if (Math.abs(window.orientation) === 90) {
            paper.setSize(window.innerWidth, window.innerHeight);
            initialize();
            orient = true;      
        } else {
            changeOrient.show();
        }
    }


    function genData(){

        var subject = "[Pleasure Data] " + config.experiment + " - " + config.name;

        var dataObj = {
            userName: config.name,
            experimentName: config.experiment,
            experimentDate: config.experimentTime.toString(),
            experimentDur: config.duration,
            experimentDurActual: config.durationActual,
            maxDistInitial: config.touchMaxDist + " pixels",
            minDistInitial: config.touchMinDist + " pixels",
            failInitialCalib: config.calibFail,
            maxDistFinal: config.touchMaxDistFinal || 0,
            minDistFinal: config.touchMinDistFinal || 0,
            ratings: config.ratings.join(",")         
        }

        var content = tmpl("data_tmpl", dataObj);

        //console.log(content);

        var msg = {
                "key": "DIE-Gm5EhIT4k_u8R-VhhQ",
                "message": {
                    "html": content,
                    "subject": subject,
                    "from_email": "pleasure@tracker.edu",
                    "from_name": "Pleasure Tracker",
                    "to": [
                        {
                            "email": config.email,
                            "name": "Experimenter",
                            "type": "to"
                        }
                    ],
                    "important": true
                },
                "async": false
        }   

        return JSON.stringify(msg);    
    }

    function sendData(d, callback){
        var apiKey = "IYtnRrE7NAgZ9u94hsPcqg";
        $.post("https://mandrillapp.com/api/1.0/messages/send.json",
            d,
            callback
        );
    }

    function experiment(){

        var touches = [{x: 0, y: 0, id: false}, {x: 0, y: 0, id: false}];
        var doubleDetect = false, started = false, canceled = false;
        var cancelTimeout, endTimeout, sampleInterval = false;
        var samples = [];

        var ratingRange = config.touchMaxDist - config.touchMinDist,
            ratingStep = ratingRange / 10;

        function toRating(dist){
            if(dist < config.touchMinDist) {
                dist = config.touchMinDist;
            }
            else if(dist > config.touchMaxDist){
                dist = config.touchMaxDist;
            }

            return (dist - config.touchMinDist) / ratingStep;
        }

        function sampleRating(){
	    	var rating = toRating(getDist(touches[0].x, touches[0].y, touches[1].x, touches[1].y));
	    	if(!touches[0].id || !touches[1].id && rating !== samples[samples.length-1]){
	    		rating *= -1;
	    	}
	        samples.push(rating);        	
        }


        function stop(){
            
            if(canceled !== false){
                config.durationActual = canceled;
            }
            else{
                config.durationActual = new Date();
            }

            config.durationActual = Math.floor( (config.durationActual - config.experimentTime) / 1000 );

            clearTimeout(endTimeout);
            clearTimeout(cancelTimeout);
            clearInterval(sampleInterval);

	        window.removeEventListener("touchstart", onTouchStart);
	        window.removeEventListener("touchmove", onTouchMove);
	        window.removeEventListener("touchend", onTouchEnd);
	        window.removeEventListener("touchcancel", onTouchEnd);

	        sampleRating();
	        config.ratings = samples.slice(0, config.durationActual);

            sendData(genData(), function(r){
                $("#expTitle").html("Thank you for your time.");
            });
            
        }

        function onTouchStart(e){
            e.preventDefault();
            var changed = e.changedTouches;

            for(var i = 0; i < changed.length ; i++){ 

                for(var j = 0; j < touches.length; j++){
                    if(!touches[j].id){
                        touches[j].x = changed[i].pageX;
                        touches[j].y = changed[i].pageY;
                        touches[j].id = changed[i].identifier;    
                        break;                    
                    }
                }
            }      

            if(touches[0].id && touches[1].id){

                doubleDetect = true;
                $("#expTitle").html("");
                clearTimeout(cancelTimeout);
                canceled = false;

                if(!started){
                    sampleInterval = setInterval(sampleRating, 1000);
                    endTimeout = setTimeout(stop, (config.duration * 1000) );

                    started = true;
                    config.experimentTime = new Date();
                }
            }      
        }

        function onTouchMove(e){
            e.preventDefault();
            var changed = e.changedTouches; 
            
            for(var i = 0; i < changed.length ; i++){ 

                touches.forEach(function(t, j){
                    if(t.id === changed[i].identifier){
                        touches[j].x = changed[i].pageX;
                        touches[j].y = changed[i].pageY;
                    }
                });

            }            
        }

        function onTouchEnd(e){
            e.preventDefault();
            var changed = e.changedTouches; 
            
            for(var i = 0; i < changed.length ; i++){ 

                touches.forEach(function(t, j){
                    if(t.id === changed[i].identifier){
                        touches[j].id = false;
                    }
                });

            }         

            if(doubleDetect && !touches[0].id && !touches[1].id){
                doubleDetect = false;
                cancelTimeout = setTimeout(stop, config.cancelTime * 1000);
                canceled = new Date();
            }   
        }

        window.addEventListener("touchstart", onTouchStart);
        window.addEventListener("touchmove", onTouchMove);
        window.addEventListener("touchend", onTouchEnd);
        window.addEventListener("touchcancel", onTouchEnd);

    }

    start();

})();
