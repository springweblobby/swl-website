/*
 * Main menu.
 */

'use strict'

require('style/Home.sass');
var _ = require('lodash');
var React = require('react');
var SPM = require('comp/StorePropMixins.js');
var ModalWindow = require('comp/ModalWindow.jsx');
var BattleList = require('comp/BattleList.jsx');
var Battle = require('act/Battle.js');
var Settings = require('store/Settings.js');
var Applet = require('store/Applet.js');
var Log = require('act/Log.js');
var Process = require('act/Process.js');

var Server = require('act/LobbyServer.js');
var ConState = require('store/LobbyServerCommon.js').ConnectionState;

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
		if (show && this.props.serverStore.getInitialState().connection !== ConState.CONNECTED) {
			Server.connect();
		}
		this.setState({ showingBattles: show });
	},
	handleSkirmish: function(engine, game, tag, bot){
		var gameInfo = this.state.gameInfo;
		// Use the latest version of the game installed.
		// This works by virtue of unitsync filling versions in order.
		var modname = _(gameInfo.games).keys().filter(function(name){
			return !!name.match('^' + game);
		}).last();
		if (!modname) {
			Log.infoBox('Downloading updates...');
			Process.downloadGame(tag);
			if (!_.contains(gameInfo.engines, engine))
				Process.downloadEngine(engine);
			this.props.onToggleDownloads();
			return;
		}
		Battle.openLocalBattle('Skirmish vs ' + bot, function(){
			this.setEngine(engine);
			this.setGame(modname);
			this.setMap(_.sample(_.keys(gameInfo.maps)) || '');
			this.addBot({
				team: 2,
				name: 'Enemy',
				type: bot,
			});
		});
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
	handleOpenUrl: function(url){
		var link = document.createElement('a');
		link.href = url;
		link.click();
	},
	renderDifficultyDialog: function(engine, game, tag, bots){
		return (<ModalWindow onClose={this.handleCancelDifficulty} title="Choose difficulty">
			{bots.map(function(bot){
				return (<button key={bot.name}
					onClick={_.partial(this.handleSkirmish, engine, game, tag, bot.name)}>
					{bot.difficulty}
				</button>)
			}.bind(this))}
		</ModalWindow>);
	},
	renderEvo: function(){
		return <div className="gamePanel evoPanel">
			<h1>Evolution RTS</h1>
			<button onClick={_.partial(this.handleOpenUrl, 'http://www.evolutionrts.info/video-tutorials/')}>Tutorial</button>
			<button onClick={_.partial(this.handleOpenUrl, 'https://github.com/EvolutionRTS/Evolution-RTS/wiki')}>Wiki</button>
			<button onClick={_.partial(this.handleSkirmish, '96.0', 'Evolution RTS - v', 'evo:stable', 'Shard')}>Skirmish vs Shard</button>
			<button onClick={_.partial(this.handleDifficulty, 'evo')}>Skirmish vs Survival Spawner</button>

			{this.state.choosingDifficulty === 'evo' &&
				this.renderDifficultyDialog('96.0', 'Evolution RTS - v', 'evo:stable',
					['Very Easy', 'Easy', 'Normal', 'Hard', 'Very Hard'].map(function(val){
						return { name: 'Survival Spawner: ' + val, difficulty: val };
					}))
			}
		</div>;
	},
	renderZk: function(){
		return <div className="gamePanel zkPanel">
			<h1>Zero-K</h1>
			<button onClick={_.partial(this.handleSkirmish, '100.0', 'Zero-K v', 'zk:stable', 'CAI')}>Skirmish vs CAI</button>
			<button onClick={_.partial(this.handleDifficulty, 'zk')}>Skirmish vs Chicken</button>

			{this.state.choosingDifficulty === 'zk' &&
				this.renderDifficultyDialog('100.0', 'Zero-K v', 'zk:stable',
					['Very Easy', 'Easy', 'Normal', 'Hard', 'Suicidal'].map(function(val){
						return { name: 'Chicken: ' + val, difficulty: val };
					}))
			}
		</div>;
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
					<button onClick={_.partial(this.props.onSelect, 'settings')}>Settings</button>
					<button onClick={_.partial(this.props.onSelect, 'help')}>Help</button>
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
