/*
 * Main menu.
 */

'use strict'

require('style/Home.sass');
var _ = require('lodash');
var SPM = require('comp/StorePropMixins.js');
var Screens = require('comp/ScreenTypes.js');
var ModalWindow = require('comp/ModalWindow.jsx');
var BattleList = require('comp/BattleList.jsx');
var Battle = require('act/Battle.js');
var Settings = require('store/Settings.js');
var Applet = require('store/Applet.js');

module.exports = React.createClass({
	displayName: 'Home',
	mixins: [SPM.connect('gameInfoStore', 'gameInfo')],
	getInitialState: function(){
		return {
			showingBattles: false,
			choosingDifficulty: null,
		};
	},
	handleShowBattles: function(show){
		this.setState({ showingBattles: show });
	},
	handleSkirmish: function(engine, game, bot){
		var gameInfo = this.state.gameInfo;
		Battle.openLocalBattle('Skirmish vs ' + bot, function(){
			this.setEngine(engine);
			this.setGame(game);
			this.setMap(_.sample(_.keys(gameInfo.maps)) || '');
			this.addBot(2, 'Enemy', bot);
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
		Battle.openLocalBattle('Skirmish: Custom', _.noop);
	},
	renderDifficultyDialog: function(engine, game, bots){
		return (<ModalWindow onClose={this.handleCancelDifficulty} title="Choose difficulty">
			{bots.map(function(bot){
				return (<button key={bot.name}
					onClick={_.partial(this.handleSkirmish, engine, game, bot.name)}>
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
		return <div className="homeScreen">
			<div className="homeScreenTop">
				<button
					className="multiplayerButton"
					onClick={_.partial(this.handleShowBattles, true)}
				>
					Multiplayer
				</button>
				<span className="homeMiscButtons">
					<button onClick={this.handleCustomSkirmish}>Custom Skirmish</button>
					<button onClick={_.partial(this.props.onSelect, Screens.SETTINGS)}>Settings</button>
					<button onClick={_.partial(this.props.onSelect, Screens.HELP)}>Help</button>
				</span>
			</div>
			{/* We need the container div for columns to work properly. */}
			<div className="homeScreenMiddle"><div className="gamePanels">
				{Settings.selectedEvo ? this.renderEvo() : null}
				{Settings.selectedZk ? this.renderZk() : null}
			</div></div>
			{!Applet && <div className="browserDemoWarning">
				This is a browser demonstration. While you can connect to the server and chat
				and join battles, you won’t be able to actually play unless
				you <a href="http://weblobby.springrts.com">download the real deal</a>.
			</div>}
			{this.state.showingBattles && <ModalWindow
				onClose={_.partial(this.handleShowBattles, false)}
				title="Multiplayer battles"
			>
				<BattleList
					gameInfoStore={this.props.gameInfoStore}
					serverStore={this.props.serverStore}
				/>
			</ModalWindow>}
		</div>;
	}
});
