// Route to the mock implementation if we're running in browser.
require('./GameInfoMock.js'); // prevents the minifier from removing it
module.exports = require('./Applet.js') ? require('./GameInfoImpl.js') : require('./GameInfoMock.js');
