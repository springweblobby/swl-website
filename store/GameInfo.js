// Route to the mock implementation if we're running in browser.

// Prevent the minifier from removing things.
var mock = require('./GameInfoMock.js');
var impl = require('./GameInfoImpl.js');
module.exports = require('./Applet.js') ? impl : mock;
