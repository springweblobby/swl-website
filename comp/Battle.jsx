/** @jsx React.DOM
 *
 * The UI represeting a battle room. Ideally this component should be able
 * to render singleplayer, multiplayer and hosted rooms with the differences
 * being abstracted away in the store.
 */

'use strict'

var _ = require('lodash');
var Reflux = require('reflux');

var BattleUserList = require('./BattleUserList.jsx');
var BattleMap = require('./BattleMap.jsx');
var BattlePanel = require('./BattlePanel.jsx');
var ModalWindow = require('./ModalWindow.jsx');
var SelectBox = require('./SelectBox.jsx');

module.exports = React.createClass({
	mixins: [
		React.addons.LinkedStateMixin,
		Reflux.connect(require('../store/GameInfo.js'), 'gameInfo'),
		Reflux.listenTo(require('../store/Process.js'), 'updateProcess'),
	],
	// We need custom initialization because the store is passed in a prop.
	componentDidMount: function(){
		this.listenTo(this.props.battle, this.updateBattle, this.updateBattle);
	},
	componentWillReceiveProps: function(props){
		if (props.battle !== this.props.battle){
			this.stopListeningTo(this.props.battle);
			this.listenTo(props.battle, this.updateBattle, this.updateBattle);
		}
	},
	getInitialState: function(){
		return {
			gameInfo: { games: {} },

			// Bot selection dialog.
			addingBot: null,
			botType: '',
			botName: '',
			botSide: '0',
		};
	},
	updateBattle: function(data){
		this.setState(data);
	},
	updateProcess: function(data){
		this.setState({ springRunning: data.springRunning });
	},
	getRandomBotName: function(){
		var names = [
			'Asimo',
			'Bender',
			'C-3PO',
			'Data',
			'Detriment',
			'Johnny5',
			'R2-D2',
			'R.O.B.',
			'Lore',
			'Marvin',
			'OptimusPrime',
			'WALL-E',
			'Terminator',
			'V.I.K.I.',
			'RoboCop',
			'Startscream',
			'Megatron',
			'BigDog',
			'Skynet',
		];
		var name = _.sample(names);
		// Add suffixes while such name already exists.
		while (_(this.state.teams).map(_.keys).flatten().contains(name))
			name += ' ' + _.sample(['O\'', 'Mc', 'De']) + _.sample(names);
		return name;
	},
	handleChangeTeam: function(n){
		this.props.battle.setOwnTeam(n);
	},
	handleChangeSide: function(n){
		this.props.battle.setOwnSide(n);
	},
	handleKick: function(name){
		this.props.battle.kickUser(name);
	},

	handleAddBot: function(n){
		var botType;
		if (this.state.gameInfo.games[this.state.game])
			botType = _.keys(this.state.gameInfo.games[this.state.game].bots)[0] || '';
		this.setState({ addingBot: n, botName: this.getRandomBotName(), botType: botType });
	},
	handleAddBotOK: function(){
		this.props.battle.addBot(this.state.addingBot, this.state.botName, this.state.botType, parseInt(this.state.botSide));
		this.setState({ addingBot: null });
	},
	handleCancelBot: function(){
		this.setState({ addingBot: null });
	},

	handleStart: function(){
		this.props.battle.startGame();
	},

	render: function(){
		// Don't render anything until we have battle data.
		if (!this.state.myName)
			return null;

		var gameBots = {};
		var showSides = false;
		if (this.state.gameInfo.games[this.state.game]) {
			gameBots = this.state.gameInfo.games[this.state.game].bots || {};
			showSides = _.size(this.state.gameInfo.games[this.state.game].sides) > 1;
		}
		var myTeam = parseInt(_.findKey(this.state.teams, function(t){ return this.state.myName in t; }, this));

		return (<div className="battleRoom">

			<div className="leftSide">
				<div className="mapTitle">
					<h1>{this.state.map || '(no map selected)'}</h1>
					<span className="mapTitleButtons">
						<button>edit starting boxes</button>
					</span>
				</div>
				<BattleMap map={this.state.map} boxes={this.state.boxes} />
			</div>

			<div className="rightSide">
				<BattlePanel
					game={this.state.game}
					engine={this.state.engine}
					side={this.state.teams[myTeam][this.state.myName].side}
					sides={showSides && this.state.gameInfo.games[this.state.game].sides}
					hasEngine={this.state.hasEngine}
					hasGame={this.state.hasGame}
					hasMap={this.state.hasMap}
					spectating={myTeam === 0}
					springRunning={this.state.springRunning}
					onCloseBattle={this.props.onClose}
					onStartBattle={this.handleStart}
					onChangeSide={this.handleChangeSide}
				/>
				<BattleUserList
					teams={this.state.teams}
					sides={showSides && this.state.gameInfo.games[this.state.game].sides}
					onChangeTeam={this.handleChangeTeam}
					onAddBot={this.handleAddBot}
					onKick={this.handleKick}
				/>
			</div>

			{this.state.addingBot && <ModalWindow onClose={this.handleCancelBot}
					title={'Adding bot to team ' + this.state.addingBot}>
			<div className="botDialog">
				<div>Name: <input type="text" valueLink={this.linkState('botName')} /></div>
				<div>
					Type: <SelectBox valueLink={this.linkState('botType')}>
						{_.map(gameBots, function(bot, name){
							return <div key={name}>{name}</div>;
						}.bind(this))}
					</SelectBox>
				</div>
				{showSides && <div>
					Faction: <SelectBox valueLink={this.linkState('botSide')}>
						{this.state.gameInfo.games[this.state.game].sides.map(function(val, key){
							return <div key={key}><img src={val.icon} /> {val.name}</div>;
						})}
					</SelectBox>
				</div>}
				{gameBots[this.state.botType] && gameBots[this.state.botType].description &&
					<div>{gameBots[this.state.botType].description}</div>}
				<div>
					<button onClick={this.handleAddBotOK}>Add bot</button>
					<button onClick={this.handleCancelBot}>Cancel</button>
				</div>
			</div></ModalWindow>}
		</div>);
	}
});
