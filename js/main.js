(function(){

    var bubbleContainer = document.getElementById("trackerBubbles"),
        lineContainer = document.getElementById("trackerLine");

    var windowWidth = window.innerWidth;
    var windowHeight = window.innerHeight;
    var pixelRatio = window.devicePixelRatio || 1;

    var touches = {},
        touchLine;
    var doubleTouchStart = new Event('doubletouchstart'),
        doubleTouchEnd = new Event('doubletouchend');


    var config = {
        touchMaxDist: 0,
        touchMinDist: 0,
        touchFeedback: true
    };

    function getTouch(index){
        return touches[Object.keys(touches)[index]];
    }

    function getDist(x1, y1, x2, y2){
        return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
    }

    function calibrate(){

        var trials = [{
            msg: '<span class="strong">Indicate Maximum Pleasure</span> <div class="light">Place any two fingers as far apart as comfortably possible.</div>',
            configVar: 'touchMaxDist'
        }, {
            msg: '<span class="strong">Indicate Minimum Pleasure</span> <div class="light">Place any two fingers as close as comfortably possible.</div>',
            configVar: 'touchMinDist'
        }];

        var trialIndex = 0,
            trialCount = 1,
            trialFail = [];

        var messageEl = document.getElementById("messages");

        function startTrial(trialIndex){

            var trial = trials[trialIndex];

            messageEl.innerHTML = trial.msg;

            function onDoubleTouchEnd(){

                // var sampleX1 = 0, sampleY1 = 0,
                //  sampleX2 = 0, sampleY2 = 0,
                //  numSamples = 0;

                // var sampleInterval = setInterval(function(){
                //  sampleX1 += getTouch(0).pageX;
                //  sampleX2 += getTouch(1).pageX;

                //  sampleY1 += getTouch(0).pageY;
                //  sampleY2 += getTouch(1).pageY;

                // }, 500);

                // clearInterval(sampleInterval);

                // var avgX1 = sampleX1 / numSamples,
                //  avgX2 = sampleX2 / numSamples,
                //  avgY1 = sampleY1 / numSamples,
                //  avgY2 = sampleY2 / numSamples;

                window.removeEventListener('doubletouchend', onDoubleTouchEnd);

                var sampleX1 = getTouch(0).pageX,
                    sampleX2 = getTouch(1).pageX,
                    sampleY1 = getTouch(0).pageY,
                    sampleY2 = getTouch(1).pageY;

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
                        trialIndex = trialFail.pop();
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
                        trialIndex = trialFail.pop();
                    }
                    trialCount++;
                }

                if(trialIndex !== undefined){
                    messageEl.innerHTML = dist;
                    setTimeout(function(){
                        startTrial(trialIndex);
                    }, 2000);
                    
                }
                else{
                    messageEl.innerHTML = 'Calibration Complete';
                    config.touchFeedback = false;
                }                
            }

            function onDoubleTouchStart(){
                window.removeEventListener('doubletouchstart', onDoubleTouchStart);
                window.addEventListener('doubletouchend', onDoubleTouchEnd);                
            }

            window.addEventListener("doubletouchstart", onDoubleTouchStart);
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
                    var line = document.createElementNS("http://www.w3.org/2000/svg", "line");
                    line.setAttribute("x1", getTouch(0).pageX);
                    line.setAttribute("y1", getTouch(0).pageY);
                    line.setAttribute("x2", getTouch(1).pageX);
                    line.setAttribute("y2", getTouch(1).pageY);
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

        if(config.touchFeedback && Object.keys(touches).length == 2){
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

        lineContainer.setAttribute("width", window.innerWidth);
        lineContainer.setAttribute("height", window.innerHeight);
    }

    window.addEventListener("touchstart", handleTouchStart);
    window.addEventListener("touchmove", handleTouchMove);
    window.addEventListener("touchend", handleTouchEnd);
    window.addEventListener("touchcancel", handleTouchEnd);
    window.addEventListener("resize", handleResize);

    calibrate();
})();
