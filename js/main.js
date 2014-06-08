(function(){

    var bubbleContainer = document.getElementById("trackerBubbles"),
        lineContainer = document.getElementById("trackerLine");

    var windowWidth = window.innerWidth;
    var windowHeight = window.innerHeight;
    var pixelRatio = window.devicePixelRatio || 1;

    var touches = {},
        touchLine,
    var paper = Raphael("tracker", windowWidth, windowHeight);
    var doubleTouchStart = new Event('doubletouchstart'),
        doubleTouchEnd = new Event('doubletouchend');


    var config = {
        touchMaxDist: 0,
        touchMinDist: 0,
        touchFeedback: true
    };

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

    function calibrate(){

        var trials = [{
            title: 'Indicate Maximum Pleasure',
            instr: 'Using two fingers, drag the circles as far apart as comfortably possible.',
            configVar: 'touchMaxDist'
        }, {
            title: 'Indicate Minimum Pleasure',
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
                        this.circle.attr("fill-opacity", "0.2");
                        this.circle.attr("r", "40");     
                        this.selected = false;                      
                    }
                    else{
                        this.circle.attr("fill-opacity", "0.6");
                        this.circle.attr("r", "50");                       
                    }
                }
            };
        }

        var bubbles = [new bubble(), new bubble()];
        bubbles[0].x = windowWidth/2 - 30;
        bubbles[1].x = windowWidth/2 + 30;

        bubbles.forEach(function(b){
            b.circle = paper.circle(b.x, b.y, b.r);
            b.circle.attr("fill", "rgb(216, 0, 57)");
            b.circle.attr("fill-opacity", "0.2");
            b.circle.attr("stroke", "none");

            b.line = paper.path("");
            b.line.attr("stroke", "#000");
            b.line.attr("stroke-opacity", "0.1");
            b.update();
        });

        var joinLine = paper.path("M" + bubbles[0].x + " " + bubbles[0].y + "L" + bubbles[1].x + " " + bubbles[1].y);
        joinLine.attr("stroke", "#c6003b");

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
                instrEl.innerHTML = 'Release both fingers to set.';
            }
        }

        function onTouchMove(e){
            e.preventDefault();
            var changed = e.changedTouches; 
            
            for(var i = 0; i < changed.length ; i++){ 

                bubbles.forEach(function(b){
                    if(b.selected && b.selected == changed[i].identifier){
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

                console.log("double end");
                doubleDetect = false;
                window.removeEventListener("touchstart", onTouchStart);

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
                    instrEl.innerHTML = '';
                    setTimeout(function(){
                        startTrial(trialIndex);
                    }, 1000);
                    
                }
                else{
                    document.getElementById("tracker").innerHTML = "";
                    titleEl.innerHTML = 'Calibration Complete';
                    instrEl.innerHTML = '';
                }   

            }       
        }


        window.addEventListener("touchmove", onTouchMove);
        window.addEventListener("touchend", onTouchEnd);
        window.addEventListener("touchcancel", onTouchEnd);


        var titleEl = document.getElementById("calibTitle"),
            instrEl = document.getElementById("calibInstr");

        var startTrial = function(trialIndex){

            window.addEventListener("touchstart", onTouchStart);

            trial = trials[trialIndex];

            console.log(trialIndex);

            titleEl.innerHTML = trial.title;
            instrEl.innerHTML = trial.instr;
        }

        startTrial(0);
    }

    function handleTouchStart(e){

        e.preventDefault();

        var changed = e.changedTouches;

        for(var i = 0; i < 2 && i < changed.length ; i++){ // Track no more than two fingers

            if(Object.keys(touches).length > 1) return;

            var id = changed[i].identifier;
            touches[id] = changed[i];

            if(config.touchFeedback){
                var el = document.createElement("div");
                el.className = "bubble";
                touches[id].el = bubbleContainer.appendChild(el);
                
                touches[id].el.style.left = touches[id].pageX - 25 + "px";
                touches[id].el.style.top = touches[id].pageY - 25 + "px";               
            }


            if(Object.keys(touches).length == 2){

                if(config.touchFeedback){
                    var line = createLine(  getTouch(0).pageX, getTouch(0).pageY,
                                            getTouch(1).pageX, getTouch(1).pageY );
                    line.setAttribute("stroke", "#bbb");

                    touchLine = lineContainer.appendChild(line);
                }
                window.dispatchEvent(doubleTouchStart);
            }
        }
    }

    function handleTouchMove(e){
        e.preventDefault();
        var changed = e.changedTouches;

        for(var i = 0; i < changed.length; i++){
            var id = changed[i].identifier;
            if(config.touchFeedback){
                touches[id].el.style.left = changed[i].pageX - 25 + "px";
                touches[id].el.style.top = changed[i].pageY - 25 + "px";
            }
        }

        if(config.touchFeedback){
            touchLine.setAttribute("x1", getTouch(0).pageX);
            touchLine.setAttribute("y1", getTouch(0).pageY);
            touchLine.setAttribute("x2", getTouch(1).pageX);
            touchLine.setAttribute("y2", getTouch(1).pageY);
        }
    }

    function handleTouchEnd(e){
        e.preventDefault();
        var changed = e.changedTouches;

        if(Object.keys(touches).length == 2){
            lineContainer.removeChild(touchLine);
            window.dispatchEvent(doubleTouchEnd);
        }

        for(var i = 0; i < changed.length; i++){
            var id = changed[i].identifier;
            bubbleContainer.removeChild(touches[id].el);
            delete touches[id];
        }
    }


    function handleResize(){
        if(window.outerWidth > window.outerHeight){
            // Landscape Mode
        }
        else{
            // Potrait Mode
        }

        paper.setSize(windowWidth, windowHeight);
    }

    // window.addEventListener("touchstart", handleTouchStart);
    // window.addEventListener("touchmove", handleTouchMove);
    // window.addEventListener("touchend", handleTouchEnd);
    // window.addEventListener("touchcancel", handleTouchEnd);
    // window.addEventListener("resize", handleResize);

    calibrate();
})();
