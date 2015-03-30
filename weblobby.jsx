'use strict'

// We require Applet before anything that uses localStorage, otherwise init()
// won't set localStorage database path properly.
require('./store/Applet.js');
require('./store/Nightwatch.js');
require('./store/Sound.js');

var _ = require('lodash');
var AppScreens = require('./comp/AppScreens.jsx');

// Back when swl API was a Java applet this function was introduced to avoid
// deadlocks on OpenJDK. It's kept to avoid breaking changes.
window.__java_js_wrapper = _.defer;

var App = React.createClass({
	render: function(){
		return <AppScreens />;
	}
});


window.echo = function()
{
   console.log.apply(console, arguments ); //chrome has issue with direct assigning of this function
}

React.render(<App />, document.getElementById('main'));
