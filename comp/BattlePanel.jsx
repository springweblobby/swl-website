/*
 * A panel with a start button and other things.
 */

'use strict'

var SelectBox = require('comp/SelectBox.jsx');
var ProgressBar = require('comp/ProgressBar.jsx');

module.exports = React.createClass({
	render: function(){
		var gameDownload = this.props.gameDownload;
		var engineDownload = this.props.engineDownload;
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
			buttonDesc = <ul>
				{!this.props.hasEngine && <li>Don't have engine</li>}
				{!this.props.hasGame && <li>Don't have game</li>}
				{!this.props.hasMap && <li>Don't have map</li>}
			</ul>;
		} else if (this.props.springRunning) {
			buttonClass = 'running';
			buttonLabel = 'Game running';
		} else if (this.props.spectating) {
			buttonClass = 'spectate';
			buttonLabel = 'Watch Game';
			if (this.props.multiplayer && !this.props.inProgress) {
				buttonDesc = <div>Wait for the battle to start.</div>;
			}
		} else {
			buttonClass = 'play';
			buttonLabel = 'Start Game';
			if (this.props.inProgress)
				buttonDesc = <div>Battle in progress.</div>;
		}

		return (<div className="battlePanel">
			<button
				className={'startButton ' + buttonClass}
				disabled={!synced || this.props.springRunning ||
					this.props.spectating && this.props.multiplayer && !this.props.inProgress}
				onClick={this.props.onStartBattle}
			>
				<span>{buttonLabel}</span>
				{buttonDesc}
			</button>
			<div className="panelRight">
				<div className="gameName">
					<span>{this.props.game || '(no game selected)'}</span>
					{gameDownload && <ProgressBar
						indeterminate={gameDownload.total === 0}
						value={gameDownload.downloaded / gameDownload.total}
					/>}
				</div>
				<div className="engineName">
					<span>{'spring ' + (this.props.engine || 'n/a')}</span>
					{engineDownload && <ProgressBar
						indeterminate={engineDownload.total === 0}
						value={engineDownload.downloaded / engineDownload.total}
					/>}
				</div>
				{this.props.sides && <div>Faction: <SelectBox onChange={this.props.onChangeSide} value={this.props.side}>
					{this.props.sides.map(function(val, key){
						return <div key={key}><img src={val.icon} /> {val.name}</div>;
					})}
				</SelectBox></div>}
				<button onClick={this.props.onChangeMap}>Change map</button>
				<button onClick={this.props.onCloseBattle} className="closeBattle">×</button>
			</div>
		</div>);
	}
});
