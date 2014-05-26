/*global NGN*/
/*global LoggingMethodError*/
/*global DuplicateLoggingMethodError*/
/**
 * @class NGN.Log
 * This singleton is responsible for configuring custom system logs. NGN provides additional
 * logging features by default, including native system logs and remote/streamed logging.
 * NGN.Log provides a way to extend or disable these features by adding your own logic to the
 * different logging methods outlined below.
 *
 * For more information about the special logging features NGN provides out of the box, or
 * for more detail about customizing the logging system, please see the [Custom Logging](!#/guides/customlogs) guide.
 * @singleton
 */
var Log = NGN.Class.extend({

  constructor: function () {

    // Standard logging methods
    var methods = ['log', 'info', 'error', 'warn', 'time', 'timeEnd', 'trace', 'assert', 'dir', 'debug', 'io'];

    // Create custom errors for the logging
    global.LoggingMethodError = NGN.createException({
      name: 'Logging Method Error',
      type: 'LogMethodError',
      message: 'The logging method does not exist or could not be found.',
      custom: {
        cause: 'An NGN.Log attribute was defined that was not a function.',
        help: 'This can usually be fixed by making sure the value assigned to an NGN.Log.___ is a function. Acceptable methods include: ' + methods.join()
      }
    });

    global.DuplicateLoggingMethodError = NGN.createException({
      name: 'Duplicate Logging Method Error',
      type: 'LogMethodError',
      message: 'An attempt to redefine an existing logging method failed.',
      custom: {
        cause: 'An attempt to define/redefine a custom method on NGN.Log conflicts with an existing method.',
        help: 'This is usually the result of trying to redefine a custom method or overriding an existing native method (' + methods.join() + ').'
      }
    });

    // Initialize standard logging methods
    // This generates a private property (_<method_name>) and an accessor method (<method_name>()).
    methods.forEach(function (method) {
      Object.defineProperty(this, '_' + method, {
        enumerable: false,
        writable: true,
        configurable: false,
        value: null
      });
      Object.defineProperty(this, method, {
        enumerable: true,
        get: function () {
          return this['_' + method];
        },
        set: function (val) {
          if (typeof val !== 'function') {
            throw new LoggingMethodError(method + ' does not exist or could not be found.');
          }
          this['_' + method] = val;
        }
      });
    });

    // Add configuration options
    Object.defineProperties(this, {
      /**
       * @property {Boolean} LanEnabled
       * Indicates LAN logging is on.
       * @private
       */
      LanEnabled: {
        enumerable: false,
        get: function () {
          if (typeof this.stream === 'string') {
            // Handle String
            return ['none', ''].indexOf(this.stream.trim().toLowerCase()) < 0;
          } else if (NGN.typeOf(this.stream) === 'array') {
            // Handle Array
            return this.stream.length > 0;
          } else if (typeof this.stream === 'boolean') {
            // Handle Boolean
            return this.stream;
          }
          // Default
          return true;
        }
      },
      /**
       * @property {String|Array|Boolean} [stream=all]
       * When set to `all` or a specific logging level or array of logging levels, NGN will automatically stream
       * the appropriate level of log records to the NGN.LAN connection if it is connected & enabled.
       * This is commonly used to view logs from NGN Mechanic or a developer tool. This can be disabled
       * by setting the value to `none`, `''`, `false`, or an empty array (`[]`).
       */
      stream: {
        enumerable: true,
        writable: true,
        configurable: false,
        value: 'all'
      },
      _level: {
        enumerable: false,
        writable: true,
        configurable: false,
        value: 'all'
      },
      /**
       * @property {String|Array|Boolean} [stream=all]
       * Only process logs at the level specified in this property. Use `all`, a specific logging level, or array of logging levels.
       * All levels can be disabled by setting the value to `none`, `''`, `false`, or an empty array (`[]`).
       */
      level: {
        enumerable: true,
        get: function () {
          return this._level;
        },
        set: function (val) {
          this.level_cache.hasOwnProperty(val) && delete this.level_cache[val];
          this._level = val;
        }
      },
      level_cache: {
        enumerable: false,
        writable: true,
        configurable: false,
        value: {}
      },
      /**
       * @method shouldProcess
       * Indicates whether the specified log type should be processed or not.
       * @param {String} level
       * The level to be checked for processing.
       * @return {Boolean}
       */
      shouldProcess: {
        enumerable: false,
        writable: false,
        configurable: false,
        value: function (level) {
          if (typeof level !== 'string') {
            throw new Error('NGN.Log#shouldProcess() requires a string attribute.');
          }
          level = (level.trim().length === 0 ? 'none' : level).trim().toLowerCase();
          if (!this.level_cache.hasOwnProperty(level)) {
            if (this.level === 'all') {
              this.level_cache[level] = true;
            } else if (typeof this.level === 'string') {
              // Handle String
              if (['none', ''].indexOf(level) >= 0) {
                this.level_cache[level] = false;
              }
              this.level_cache[level] = (this.level.trim().toLowerCase() === level);
            } else if (NGN.typeOf(this.level) === 'array') {
              // Handle Array
              this.level_cache[level] = this.level.filter(function (el) {
                return el.trim().toLowerCase() === level.trim().toLowerCase();
              }).length >= 1;
            } else if (typeof this.level === 'boolean') {
              // Handle Boolean
              this.level_cache[level] = this.level;
            }
            // Default
            this.level_cache[level] = true;
          }
          return this.level_cache[level];
        }
      },
      /**
       * @property {Boolean} [useColor=true]
       * Setting this to `false` will disable the default color output for
       * `console.log`, `console.warn`, `console.error`, and `console.debug`.
       */
      useColor: {
        enumerable: true,
        writable: true,
        configurable: false,
        value: true
      },
      /**
       * @method addCustomLoggingMethod
       * Create a custom logging method. For example:
       *
       *     NGN.Log.addCustomLoggingMethod('critical',function(){
       *       // Run the console.log after setting the level
       *       console.level('critical').log.apply(this,arguments);
       *     });
       *
       * Doing this will decorate the `console` object with a new method called `console.critical`, which can
       * be used in code like:
       *
       * `console.critical('My critical message.');`
       * @param {String} methodName
       * The name of the new method. This cannot conflict with an existing method (an error will be thrown if it does).
       * @param {Function} callback
       * The function to run when this method is called.
       */
      addCustomLoggingMethod: {
        enumerable: true,
        writable: false,
        configurable: false,
        value: function (name, callback) {
          if (this.hasOwnProperty(name)) {
            throw new DuplicateLoggingMethodError('The method \"' + name + '\" cannot be redefined. This method already exists.');
          }
          console[name] = callback;
        }
      }
    });

    /*
     * Override the console.
     * Ignore if running a test suite.
     */
    if (process.argv[process.argv.length - 1].toString().trim().toLowerCase() !== 'test' && process.argv[1].indexOf('mocha') < 0) {

      // Add log level support
      Object.defineProperties(console, {
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
          value: function (lvl) {
            this.current_level = lvl || null;
          }
        },
      });

      // Overridable methods
      var _console = {}, debugconsole = {};

      methods.forEach(function (method) {

        // Handle Debugging
        debugconsole[method] = function () {

          // If a broadcast server is available, do the broadcast
          if (NGN.LAN.connected) {
            var args = Array.prototype.slice.call(arguments),
              lvl = null;

            // If a level is defined, capture it
            if (typeof args[0] === 'object') {
              if (args[0].hasOwnProperty('_level_')) {
                lvl = args.shift()._level_;
              }
            }

            // Send the arguments, method, and server timestamp via websocket, if a debugger exists
            var ctype = typeof args;
            switch (typeof args) {
            case 'object':
              try {
                var x = JSON.stringify(args);
                ctype = 'JSON';
              } catch (e) {
                args = require('util').inspect(args, {
                  depth: 3,
                  colors: true
                });
              }
              break;
            case 'function':
              args = args.toString();
              break;
            }
            NGN.LAN.send({
              event: 'console',
              level: lvl,
              type: method,
              content: args,
              contenttype: ctype,
              timestamp: new Date().getTime(),
              script: process.mainModule.filename,
              file: require('path').basename(process.mainModule.filename),
              name: process.title
            });
          }
        };

        // Create super scope
        _console[method] = console[console.hasOwnProperty(method) ? method : 'log'];

        // Create override
        console[method] = function () {

          // If a log level is set, use it
          var curr_level = '';
          if (console.current_level !== null) {
            arguments = Array.prototype.slice.call(arguments);
            curr_level = console.current_level;
            arguments.unshift({
              _level_: console.current_level
            });
            console.current_level = null;
          }

          // Skip output if the log is not configured to output this level.
          if (!NGN.Log.shouldProcess(curr_level || '')) {
            return;
          }

          // If a custom syslog method is available, use it
          if (NGN.Log.hasOwnProperty(method)) {
            if (NGN.Log[method] !== null) {
              var cont = NGN.Log[method].apply(NGN.Log, arguments);
              // If the method returns false, end processing.
              if (!cont) {
                return;
              }
            }
          }

          // Try to use the debugger
          NGN.Log.LanEnabled && debugconsole[method].apply(this, arguments);

          // Provide default color coding
          if (NGN.Log.useColor) {
            for (var arg in arguments) {
              if (['error', 'warn', 'debug', 'info'].indexOf(method) >= 0) {
                var supported = false;
                switch (typeof arguments[arg]) {
                case 'boolean':
                case 'number':
                case 'date':
                  arguments[arg] = arguments[arg].toString();
                case 'string':
                  supported = true;
                  break;
                }
                if (supported) {
                  switch (method) {
                  case 'error':
                    arguments[arg] = arguments[arg].red.bold;
                    break;
                  case 'warn':
                    arguments[arg] = arguments[arg].yellow.bold;
                    break;
                  case 'info':
                    arguments[arg] = arguments[arg].cyan.bold;
                    break;
                  case 'debug':
                    arguments[arg] = arguments[arg].magenta.bold;
                    break;
                  }
                }
              }
            }
          }

          if (['io'].indexOf(method.toLowerCase()) < 0) {
            _console[method].apply(console, arguments);
          } else if (method === 'io') {
            process.stdout.write('Flow: '.blue + arguments[0].blue.bold + '\n');
            if (arguments[1]) {
              process.stdout.write(arguments[1].toString().blue.bold + '\n');
            }
          }
        };
      });
    }
  }
});

module.exports = Log;
