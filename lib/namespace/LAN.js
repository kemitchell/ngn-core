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

var out = {};

Object.defineProperty(out,'client',{
  enumerable: true,
  get: function(){
    return initialized ? client : {
      /**
       * @method connect
       * Establish a connection to a websocket server runninng on the local server.
       * @param {Number} [port=55555]
       * The port of the websocket server to connect to.
       */
      connect: function(port){
        client = new Socket('ws://127.0.0.1:'+(port||55555).toString());
console.log(client);
        client.prototype = Object.prototype;
        client.prototype.connected = true;

        // When the connection opens, register with the "remote" server.
        client.on('open',function(){
          process.stdout.write('opened connection');
          client.connected = true;
          this.write({test:"data"});
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

module.exports = out.client;
