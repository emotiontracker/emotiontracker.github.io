var socket;

self.onmessage = function(e){
	if(e.data.type == "req"){
		socket = new WebSocket("ws://52.1.248.212:9000");
		socket.binaryType = "arraybuffer";

		socket.onmessage = function(event){
			var data = event.data;
			if((typeof data == 'object')){
			    var data = new Int16Array(event.data);
			    var left = new Float32Array(data.length/2),
			    	right = new Float32Array(data.length/2);

			    for(var i = 0; i<data.length/2; i++){
			    	left[i] = data[i*2]/65535;
			    	right[i] = data[i*2 + 1]/65535;
			    }
			    self.postMessage({type:'audio', left: left, right: right});				
			}
			else{
				data = self.postMessage(JSON.parse(data));
			}
		}	

		// socket.onclose = function(event){
		// 	self.postMessage({type:'close'});	
		// }

		socket.onopen = function(event){
			socket.send(JSON.stringify({type:"init", url: e.data.url, dur: e.data.dur, _dur: e.data._dur}));
		}	
	}
	else{
		//if(socket.readyState === OPEN){
			socket.send(JSON.stringify(e.data));
		//}
	}
}

