/**
 * @class NGN.LAN
 * This represents the Local Area Network connection.
 * @extends primus
 * @singleton
 * @private
 */
var Primus = require('primus'),
    Socket = Primus.createSocket({ transformer: 'engine.io', parser:'JSON', manual: true }),
    client = null,
    http = require('http');

var out = {};

Object.defineProperty(out,'client',{
  enumerable: true,
  get: function(){
    return client !== null ? client : {
      /**
       * @method connect
       * Establish a connection to a websocket server runninng on the local server.
       * @param {Number} [port=55555]
       * The port of the websocket server to connect to.
       * @param {Function} callback
       * The callback is fired when the connection is established.
       */
      connect: function(port,callback){

        if (typeof port === 'function'){
          callback = port;
          port = null;
        }

        client = new Socket('ws://127.0.0.1:'+(port||55555).toString());

        client.prototype = Object.prototype;
        this.connected = false;
        var me = this;

        // When the connection opens, register with the "remote" server.
        client.on('open',function(){
          me.connected = true;
          callback && callback();
        }).on('disconnect',function(){
          me.connected = false;
        }).on('end',function(){
          me.connected = false;
        }).on('close',function(){
          me.connected = false;
        }).on('data',function(data){
          if (data.hasOwnProperty('a')){
            switch(data.a.toLowerCase()){
              case 'welcome':
                var file = require('path').basename(process.mainModule.filename);
                client.write({
                  a: 'processinfo',
                  name: '('+process.title+') '+file.substr(0,file.length-3),
                  os: require('os').platform(),
                  file: process.mainModule.filename
                });
            }
          }
        }).on('error',function(e){
          console.log('error',e.message);
        });

        /**
         * @method send
         * Send a message to the LAN (supports JSON and primitive objects).
         * This aliases the `primus.write()` method.
         */
        client.prototype.send = function(a){
//          client.write.apply(client,arguments);
          client.write(a);
        };

        client.open();

        initialized = true;

      },
      connected: {}
    }
  }
});

module.exports = out.client;
