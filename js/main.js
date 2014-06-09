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
        email: 'jugalm9@gmail.com',
        duration: (1000 * 20), //(1000 * 2 * 60),          // 2 mins
        touchMaxDist: 0,
        touchMinDist: 0,
        touchFeedback: true
    };

    var pages = {
        start: $("#startPage"),
        calibrate: $("#calibrationPage"),
        experiment: $("#experimentPage")
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

    function start(){
        $("#startSubmit").on("click", function(){
            config.name = $("#name").val().trim(),
            config.experiment = $("#experiment").val().trim();

            pages.start.velocity({opacity: 0}, 300, function(){
                pages.start.hide();
                pages.calibrate.show();
                calibrate();
            })
        });
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
                    $(instrEl).velocity({opacity: 0}, 400, function(){
                        $(titleEl).velocity({opacity: 0}, 400, function(){
                            startTrial(trialIndex);
                        });
                    });
                    
                }
                else{

                    window.removeEventListener("touchmove", onTouchMove);
                    window.removeEventListener("touchend", onTouchEnd);
                    window.removeEventListener("touchcancel", onTouchEnd);   

                    $(instrEl).velocity({opacity: 0}, 500, function(){
                        $(titleEl).velocity({opacity: 0}, { duration: 600, queue: false });
                        $("#tracker").velocity({opacity: 0}, { duration: 600, queue: false, complete: function(){
                            $("#calibComplete").show();
                            $("#btnRetry").on("click", function(){

                            }); 
                            $("#btnExp").on("click", function(){
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

            $(titleEl).velocity({opacity: 1}, 400, function(){
                $(instrEl).velocity({opacity: 1}, 400);
            });
            
            bubbles.forEach(function(b){
                b.circle.animate({
                    "fill": "rgb(216, 0, 57)"
                }, 200);   
            }); 
        }

        var initialize = function(){
            console.log("init");
            bubbles = [new bubble(), new bubble()];
            bubbles[0].x = windowWidth/2 - 40;
            bubbles[1].x = windowWidth/2 + 40;  
            
            joinLine = paper.path("M" + bubbles[0].x + " " + bubbles[0].y + "L" + bubbles[1].x + " " + bubbles[1].y);
            joinLine.attr("stroke", "#c6003b");
            joinLine.attr("stroke-opacity", 0);   

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
                },1000);

                joinLine.animate({
                    "stroke-opacity": 1
                }, 1000, "linear", function(){
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

    function experiment(){

        var touches = [{x: 0, y: 0, id: false}, {x: 0, y: 0, id: false}];
        var doubleDetect = false;
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
            clearTimeout(endTimeout);
            clearTimeout(cancelTimeout);
            clearInterval(sampleInterval);

	        window.removeEventListener("touchstart", onTouchStart);
	        window.removeEventListener("touchmove", onTouchMove);
	        window.removeEventListener("touchend", onTouchEnd);
	        window.removeEventListener("touchcancel", onTouchEnd);

	        sampleRating();
	        console.log(samples, samples.length);

            $("#expTitle").html("Thank you for your time.");
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

                if(!sampleInterval){
                    sampleInterval = setInterval(sampleRating, 1000);                    
                }

                endTimeout = setTimeout(stop, config.duration);
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
                cancelTimeout = setTimeout(stop, 5000);
            }   
        }

        window.addEventListener("touchstart", onTouchStart);
        window.addEventListener("touchmove", onTouchMove);
        window.addEventListener("touchend", onTouchEnd);
        window.addEventListener("touchcancel", onTouchEnd);

    }

    start();

})();
