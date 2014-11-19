/*
 * A panel with a start button and other things.
 */

'use strict'

var SelectBox = require('./SelectBox.jsx');

module.exports = React.createClass({
	render: function(){
		// The intended behavior is:
		//  - If unsynced, display "can't start".
		//  - If spring is running, display "game running".
		//  - If the game started without us being unspecced, display "watch game".
		//  - If the game is not running, display "watch game" is spec, otherwise "start game".
		var buttonClass, buttonLabel, buttonDesc = null;
		var synced = this.props.hasEngine && this.props.hasGame && this.props.hasMap;
		if (!synced) {
			buttonClass = 'unsynced';
			buttonLabel = 'Can\'t start yet';
			buttonDesc = (<ul>
				{this.props.hasEngine ? null : <li>Don't have engine</li>}
				{this.props.hasGame ? null : <li>Don't have game</li>}
				{this.props.hasMap ? null : <li>Don't have map</li>}
			</ul>);
		} else if (this.props.springRunning) {
			buttonClass = 'running';
			buttonLabel = 'Game running';
		} else if (this.props.spectating) {
			buttonClass = 'spectate';
			buttonLabel = 'Watch Game';
		} else {
			buttonClass = 'play';
			buttonLabel = 'Start Game';
		}

		return (<div className="battlePanel">
			<button
				className={'startButton ' + buttonClass}
				disabled={!synced || this.props.springRunning}
				onClick={this.props.onStartBattle}
			>
				<span>{buttonLabel}</span>
				{buttonDesc}
			</button>
			<div className="panelRight">
				<p className="gameName">{this.props.game || '(no game selected)'}</p>
				<p className="engineName">{'spring ' + (this.props.engine || 'n/a')}</p>
				{this.props.sides && <div>Faction: <SelectBox onChange={this.props.onChangeSide} value={this.props.side}>
					{this.props.sides.map(function(val, key){
						return <div key={key}><img src={val.icon} /> {val.name}</div>;
					})}
				</SelectBox></div>}
				<button onClick={this.props.onCloseBattle} className="closeBattle">×</button>
			</div>
		</div>);
	}
});
