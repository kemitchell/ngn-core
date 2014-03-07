var assert = require('assert'),
    path = require('path');

/**
 * Make sure the NGN core is available.
 */
suite('Core Sanity Test:', function(){

  var dir = null,
      p = path.join(__dirname,'..','lib','core');

  setup(function(){
    dir = require('fs').readdirSync(p);
    assert.ok(NGN !== undefined,'NGN did not load.');
    assert.ok(UTIL !== undefined,'UTIL did not load.');
    UTIL.testing = true;
  });

  test('Core classes are in NGN.core', function(){
		console.log(__dirname);
		console.log(NGN);
    dir.forEach(function(file){
			assert.ok(NGN.core[path.basename(file,'.js')] !== undefined,'NGN.core.'+path.basename(file,'.js')+' not loaded.');
    });
  });

  test('Core classes construct properly', function(){
    dir.forEach(function(file){
      assert.ok(new NGN.core[path.basename(file,'.js')]() !== undefined,'NGN.core.'+path.basename(file,'.js')+' not loaded.');
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