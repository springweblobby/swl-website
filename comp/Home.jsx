/** @jsx React.DOM
 *
 * Main menu.
 */

'use strict'

var _ = require('lodash');
var Reflux = require('reflux');
var Screens = require('./ScreenTypes.js');
var ModalWindow = require('./ModalWindow.jsx');
var Battle = require('../act/Battle.js');
var Settings = require('../store/Settings.js');
var GameInfo = require('../store/GameInfo.js');

module.exports = React.createClass({
	mixins: [Reflux.connect(GameInfo, 'gameInfo')],
	getInitialState: function(){
		return {
			gameInfo: { maps: {} },
			choosingDifficulty: null,
		};
	},
	handleSkirmish: function(engine, game, bot){
		var gameInfo = this.state.gameInfo;
		Battle.openSinglePlayerBattle('Skirmish vs ' + bot, function(){
			this.setEngine(engine);
			this.setGame(game);
			//this.setMap(_.sample(_.keys(gameInfo.maps)) || '');
			this.setMap('OnyxCauldron1.6');
			this.addBot(bot, 'Enemy', 2);
		});
		this.setState({ addingEvoSpawner: false });
	},
	handleDifficulty: function(game){
		this.setState({ choosingDifficulty: game });
	},
	handleCancelDifficulty: function(){
		this.setState({ choosingDifficulty: null });
	},
	handleCustomSkirmish: function(){
		Battle.openSinglePlayerBattle('Custom Skirmish', _.noop);
	},
	renderDifficultyDialog: function(engine, game, bots){
		return (<ModalWindow onClose={this.handleCancelDifficulty} title="Choose difficulty">
			{bots.map(function(bot){
				return (<button key={bot.name}
					onClick={_.partial(this.handleSkirmish, '96.0', 'Evolution RTS - v8.04', bot.name)}>
					{bot.difficulty}
				</button>)
			}.bind(this))}
		</ModalWindow>);
	},
	renderEvo: function(){
		return (<div className="gamePanel evoPanel">
			<h1>Evolution RTS</h1>
			<button>Tutorial</button>
			<button onClick={_.partial(this.handleSkirmish, '96.0', 'Evolution RTS - v8.04', 'Shard')}>Skirmish vs Shard</button>
			<button onClick={_.partial(this.handleDifficulty, 'evo')}>Skirmish vs Survival Spawner</button>

			{this.state.choosingDifficulty === 'evo' ?
				this.renderDifficultyDialog('96.0', 'Evolution RTS - v8.04',
					['Very Easy', 'Easy', 'Normal', 'Hard', 'Very Hard'].map(function(val){
						return { name: 'Survival Spawner: ' + val, difficulty: val };
					}))
			: null }
		</div>);
	},
	renderZk: function(){
		return (<div className="gamePanel zkPanel">
			<h1>Zero-K</h1>
			<button>Tutorial</button>
			<button>Missions</button>
			<button onClick={_.partial(this.handleSkirmish, '91.0', 'Zero-K v1.2.9.9', 'CAI')}>Skirmish vs CAI</button>
			<button onClick={_.partial(this.handleDifficulty, 'zk')}>Skirmish vs Chicken</button>

			{this.state.choosingDifficulty === 'zk' ?
				this.renderDifficultyDialog('91.0', 'Zero-K v1.2.9.9',
					['Very Easy', 'Easy', 'Normal', 'Hard', 'Suicidal'].map(function(val){
						return { name: 'Chicken: ' + val, difficulty: val };
					}))
			: null }
		</div>);
	},
	render: function(){
		return (<div className="homeScreen">
			<div className="homeScreenTop">
				<button className="multiplayerButton">Multiplayer</button>
				<div className="homeMiscButtons">
					<button onClick={this.handleCustomSkirmish}>Custom Skirmish</button>
					<button onClick={_.partial(this.props.onSelect, Screens.SETTINGS)}>Settings</button>
					<button>Status</button>
					<button>Help</button>
				</div>
			</div>
			{/* We need the container div for columns to work properly. */}
			<div className="homeScreenMiddle"><div className="gamePanels">
				{Settings.selectedEvo ? this.renderEvo() : null}
				{Settings.selectedZk ? this.renderZk() : null}
			</div></div>
		</div>);
	}
});
