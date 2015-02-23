// Route to the mock implementation if we're running in browser.
var mock = require('store/GameInfoMock.js');
module.exports = require('store/Applet.js') ? require('./GameInfoImpl.js') : mock;
