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

/**
 * @method send
 * Send a message to the LAN (supports JSON).
 * This aliases the `primus.write()` method.
 */
/*client.prototype.send = function(){
	this.write.apply(this,arguments);
};*/

Object.defineProperty(module,'exports',{
	enumerable: true,
	get: function(){
		return initialized ? client : {
			connect: function(){
				client = new Socket('ws://127.0.0.1:55555');
				client.on('open',function(){
					client.write({test:"data"});
				});
			}
		}
	}
});