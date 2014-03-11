/**
 * @class NGN.LAN
 * This represents the Local Area Network connection.
 * @extends primus
 * @singleton
 * @private
 */
var Primus = require('primus'),
		Socket = Primus.createSocket({ transformer: 'websockets', parser:'JSON' }),
		client,
		initialized = false;

Object.defineProperty(module,'exports',{
	enumerable: true,
	get: function(){
		return initialized ? client : {
			connect: function(){
				client = new Socket('ws://127.0.0.1:55555');
				
				client.prototype = Object.prototype;
				client.prototype.connected = true;
				
				// When the connection opens, register with the "remote" server.
				client.on('open',function(){
					client.connected = true;
					this.send({test:"data"});
				});
				
				client.on('disconnect',function(){
					client.connected = false;
				});
				client.on('end',function(){
					client.connected = false;
				});
				client.on('close',function(){
					client.connected = false;
				});
				
				/**
				 * @method send
				 * Send a message to the LAN (supports JSON and primitive objects).
				 * This aliases the `primus.write()` method.
				 */
				client.prototype.send = function(){
					client.write.apply(this,arguments);
				};

			},
			connected: false
		}
	}
});