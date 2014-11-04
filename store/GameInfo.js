// Route to the mock implementation if we're running in browser.
module.exports = require('./Applet.js') ? require('./GameInfoImpl.js') : require('./GameInfoMock.js');
