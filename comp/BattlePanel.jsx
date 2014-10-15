/** @jsx React.DOM
 *
 * A panel with a start button and other things.
 */

'use strict'

module.exports = React.createClass({
	render: function(){
		return (<div className="battlePanel">
			<button className="startButton"><span>Start game</span></button>
			<div className="panelRight">
				<button>Change map</button>
				<button>Game options</button>
			</div>
		</div>);
	}
});
