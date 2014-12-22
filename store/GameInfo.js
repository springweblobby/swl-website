// Route to the mock implementation if we're running in browser.
var mock = require('./GameInfoMock.js');
module.exports = require('./Applet.js') ? require('./GameInfoImpl.js') : mock;
