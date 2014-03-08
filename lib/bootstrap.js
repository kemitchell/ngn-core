global.NGN = {};
global.UTIL = {};

module.exports = function(ngn,util){
  var root = {},
      p = require('path'),
      path = p.join(__dirname,'core');

  NGN = ngn;
  UTIL = util;

	// Return all the first level classes in the directory.
  require('fs').readdirSync(path).forEach(function(file){
		root[p.basename(file,'.js')] = require(p.join(path,file));
  });

  return root;
};

/*
 * Override the console
 */
/*
if (process.argv[process.argv.length-1].toString().trim().toLowerCase() !== 'test'){
	
	// Add log level support
	Object.defineProperties(console,{
		current_level: {
			enumerable: false,
			writable: true,
			configurable: false,
			value: null
		},
		level: {
			enumerable: true,
			writable: false,
			configurable: false,
			value: function(lvl){
				this.current_level = lvl || null;
			}
		},
	});

	// Overridable methods
	var methods = ['log','info','error','warn','time','timeEnd','trace','assert','dir'],
			debugconsole = {},
			_console = {};

	methods.forEach(function(method){

		// Handle Debugging
		debugconsole[method] = function(){

			// If a broadcast server is available, do the broadcast
			if (NGN.consoledebugger !== undefined){
				var args = Array.prototype.slice.call(arguments),
						lvl = 'none';

				// If a level is defined, capture it
				if (typeof args[0] === 'object'){
					if (args[0].hasOwnProperty('_level_')){
						lvl = args.shift()._level_;
					}
				}

				// Emit the arguments, method, and server timestamp via websocket, if a debugger exists
				NGN.consoledebugger.emit('console',{
					level: lvl,
					type: method,
					content: args
				});
			}
		};

		// Create super scope
		_console[method] = console[method];

		// Create override
		console[method] = function(){
			process.stdout.write(method+' called');
			// If a log level is set, use it
			if (console.current_level !== null){
				arguments = Array.prototype.slice.call(arguments);
				arguments.unshift({_level_:console.current_level});
				console.current_level = null;
			}

			// Try to use the debugger
			debugconsole[method].apply(this,arguments);

			// If a custom syslog is available, use it
			if (NGN.syslog !== undefined){
				if (NGN.syslog[method] !== undefined){
					NGN.syslog[method].apply(NGN.syslog,arguments);
				}
			}
			_console[method].apply(console,arguments);
		};

	});
	
}*/