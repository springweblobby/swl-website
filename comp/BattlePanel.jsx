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
				<p className="gameName">{this.props.game}</p>
				<p className="engineName">spring {this.props.engine}</p>
				<button>Change map</button>
				<button>Change game</button>
				<button>Game options</button>
			</div>
		</div>);
	}
});
