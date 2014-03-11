var assert = require('assert'),
    path = require('path');

/**
 * Make sure the NGN core is available.
 */
suite('Core Sanity Test:', function(){

  var dir = null,
      p = path.join(__dirname,'..','lib','namespace');

  setup(function(){
    dir = require('fs').readdirSync(p);
    assert.ok(NGN !== undefined,'NGN did not load.');
    assert.ok(UTIL !== undefined,'UTIL did not load.');
    UTIL.testing = true;
  });

  test('Base NGN namespace extended', function(){
    dir.forEach(function(file){
			assert.ok(NGN[path.basename(file,'.js')] !== undefined,'NGN.'+path.basename(file,'.js')+' not loaded.');
    });
  });

  test('NGN extensions construct properly', function(){
    dir.forEach(function(file){
			if (path.basename(file,'.js') === 'LAN'){
				assert.ok(NGN[path.basename(file,'.js')].hasOwnProperty('connect'),path.basename(file,'.js')+' does not exist in NGN namespace.');
			} else if (['Log'].indexOf(path.basename(file,'.js')) >= 0){
				assert.ok(typeof NGN[path.basename(file,'.js')] === 'object','Not an object.');
			} else {
				console.log(path.basename(file,'.js'));
				assert.ok(new NGN[path.basename(file,'.js')]() !== undefined,'NGN.'+path.basename(file,'.js')+' not loaded.');
			}
    });
  });
});

/**
 * Make sure socket connection can be established for debugging output.
 */
suite('Local Area Network Communications',function(){
	var Primus = require('primus'),
			server = require('http').createServer(),
			primus = new Primus(server, {transformer: 'websockets'});
	
	test('NGN.LAN exists', function(){
		assert.ok(NGN.LAN !== undefined,'LAN decorator is not defined.');
	});
	
	test('Websocket connection established', function(done){
		primus.on('connection',function(client){
			assert.ok(client !== undefined,'Websocket client not constructed properly.');
			client.on('data',function(data){
				assert.ok(true,'Socket communication established.');
				done();
			});
		});
		// Listen on standard debugging port.
		server.listen(55555,NGN.LAN.connect);
	});
});