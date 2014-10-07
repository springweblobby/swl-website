/** @jsx React.DOM
 *
 * Main menu.
 */

'use strict'

module.exports = React.createClass({
	render: function(){
		return (<div className="homeScreen">
			<button>Multiplayer</button>
			<button>Custom Skirmish</button>
		</div>);
	}
});
