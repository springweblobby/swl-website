/** @jsx React.DOM
 *
 * Main menu.
 */

'use strict'

var _ = require('lodash');
var Screens = require('./ScreenTypes.js');

module.exports = React.createClass({
	render: function(){
		return (<div className="homeScreen">
			<button>Multiplayer</button>
			<button>Custom Skirmish</button>
			<button onClick={_.partial(this.props.onSelect, Screens.SETTINGS)}>Settings</button>
		</div>);
	}
});
