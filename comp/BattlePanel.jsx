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
				<p className="gameName">{this.props.game || '(no game selected)'}</p>
				<p className="engineName">{'spring ' + (this.props.engine || 'n/a')}</p>
				<button>Change map</button>
				<button>Change game</button>
				<button>Game options</button>
				<button onClick={this.props.onCloseBattle} className="closeBattle">×</button>
			</div>
		</div>);
	}
});
