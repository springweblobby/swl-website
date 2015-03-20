/** @jsx React.DOM
 *
 * The UI represeting a battle room. Ideally this component should be able
 * to render singleplayer, multiplayer and hosted rooms with the differences
 * being abstracted away in the store.
 */

'use strict'

var _ = require('lodash');
var Reflux = require('reflux');

var BattleUserList = require('comp/BattleUserList.jsx');
var BattleMap = require('comp/BattleMap.jsx');
var BattlePanel = require('comp/BattlePanel.jsx');
var ModalWindow = require('comp/ModalWindow.jsx');
var SelectBox = require('comp/SelectBox.jsx');
var MapSelect = require('comp/MapSelect.jsx');
var ChatLog = require('comp/ChatLog.jsx');
var ChatInput = require('comp/ChatInput.jsx');
var sayBattle = require('act/Chat.js').sayBattle;
var Team = require('util/Team.js');
var DownloadTitles = require('store/Process.js').DownloadTitles;

module.exports = React.createClass({
	mixins: [
		React.addons.LinkedStateMixin,
		Reflux.connect(require('store/GameInfo.js'), 'gameInfo'),
		Reflux.connectFilter(require('store/Process.js'),
			_.partialRight(_.pick, ['springRunning', 'downloads'])),
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
			selectingMap: false,

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

	handleAddBox: function(box){
		this.props.battle.addBox(box);
	},
	handleRemoveBox: function(n){
		this.props.battle.removeBox(n);
	},
	handleClearBoxes: function(){
		this.props.battle.clearBoxes();
	},

	handleStart: function(){
		this.props.battle.startGame();
	},
	handleMapDialog: function(open){
		this.setState({ selectingMap: open });
	},
	handleSelectMap: function(map){
		this.setState({ selectingMap: false });
		this.props.battle.setMap(map);
	},
	handleSend: function(message){
		sayBattle(message);
	},
	handleChatClick: function(){
		this.refs.chatInput.focusme();
	},

	render: function(){
		// Don't render anything until we have battle data.
		if (!this.state.myName)
			return null;

		var downloads = this.state.downloads;
		var gameBots = {};
		var showSides = false;
		if (this.state.gameInfo.games[this.state.game]) {
			gameBots = this.state.gameInfo.games[this.state.game].bots || {};
			showSides = _.size(this.state.gameInfo.games[this.state.game].sides) > 1;
		}
		var myTeam = Team.getTeam(this.state.teams, this.state.myName);
		var mySide = isFinite(myTeam) ? this.state.teams[myTeam][this.state.myName].side : 0;

		return (<div className="battleRoom">

			<div className="leftSide">
				<BattleMap
					map={this.state.map}
					boxes={this.state.boxes}
					team={myTeam}
					download={downloads[DownloadTitles.map + this.state.map]}
					onChangeTeam={this.handleChangeTeam}
					onAddBox={this.handleAddBox}
					onRemoveBox={this.handleRemoveBox}
					onClearBoxes={this.handleClearBoxes}
				/>
			</div>

			<div className={'rightSide' + (this.state.chatLog ? ' withChat' : '')}>
				<BattlePanel
					game={this.state.game}
					engine={this.state.engine}
					side={mySide}
					sides={showSides && this.state.gameInfo.games[this.state.game].sides}
					hasEngine={this.state.hasEngine}
					hasGame={this.state.hasGame}
					hasMap={this.state.hasMap}
					spectating={myTeam === 0}
					springRunning={this.state.springRunning}
					inProgress={this.state.inProgress}
					multiplayer={this.props.battle.typeTag === require('store/MBattle.js').typeTag}
					gameDownload={downloads[DownloadTitles.game + this.state.game]}
					engineDownload={downloads[DownloadTitles.engine + this.state.engine]}
					onCloseBattle={this.props.onClose}
					onStartBattle={this.handleStart}
					onChangeSide={this.handleChangeSide}
					onChangeMap={_.partial(this.handleMapDialog, true)}
				/>
				<BattleUserList
					teams={this.state.teams}
					sides={showSides && this.state.gameInfo.games[this.state.game].sides}
					nick={this.state.myName}
					onChangeTeam={this.handleChangeTeam}
					onAddBot={this.handleAddBot}
					onKick={this.handleKick}
				/>
				{this.state.chatLog && <div className="battleChat">
					<ChatLog
						log={this.state.chatLog.messages}
						unread={0}
						nick={this.state.myName}
						onClick={this.handleChatClick}
					/>
					<ChatInput
						onSend={this.handleSend}
						ref="chatInput"
						users={_(this.state.teams).map(function(team){
							return _.filter(team, function(u){ return !u.botType; });
						}).flatten().pluck('name').value()}
					/>
				</div>}
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

			{this.state.selectingMap && <ModalWindow title="Select Map"
					onClose={_.partial(this.handleMapDialog, false)}>
				<MapSelect
					maps={this.state.gameInfo.maps}
					mapSearchResult={this.state.gameInfo.mapSearchResult}
					onSelectMap={this.handleSelectMap}
				/>
			</ModalWindow>}
		</div>);
	}
});
