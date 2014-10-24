/** @jsx React.DOM
 *
 * A panel with a start button and other things.
 */

'use strict'

module.exports = React.createClass({
	render: function(){
		var canStart = this.props.hasEngine && this.props.hasGame && this.props.hasMap;

		return (<div className="battlePanel">
			<button className={'startButton ' + (canStart ? 'good' : 'bad')} disabled={!canStart}>
				<span>{canStart ? 'Start Game' : 'Can\'t start'}</span>
				{canStart ? null : <ul>
					{this.props.hasEngine ? null : <li>Don't have engine</li>}
					{this.props.hasGame ? null : <li>Don't have game</li>}
					{this.props.hasMap ? null : <li>Don't have map</li>}
				</ul>}
			</button>
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
