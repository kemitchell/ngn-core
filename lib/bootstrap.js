/*global NGN*/
/*global UTIL*/
global.NGN = {};
global.UTIL = {};

module.exports = function(ngn,util){
  var root = {},
      p = require('path'),
      path = p.join(__dirname,'namespace');

  NGN = ngn;
  UTIL = util;

  // Return all the first level classes in the directory.
  require('fs').readdirSync(path).forEach(function(file){
    root[p.basename(file,'.js')] = require(p.join(path,file));
  });

  return root;
};
