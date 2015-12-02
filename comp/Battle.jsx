/*
 * The UI represeting a battle room. Ideally this component should be able
 * to render singleplayer, multiplayer and hosted rooms with the differences
 * being abstracted away in the store.
 */

'use strict'

require('style/Battle.sass');
var _ = require('lodash');
var React = require('react');
var SPM = require('comp/StorePropMixins.js');

var BattleUserList = require('comp/BattleUserList.jsx');
var BattleMap = require('comp/BattleMap.jsx');
var BattlePanel = require('comp/BattlePanel.jsx');
var ModalWindow = require('comp/ModalWindow.jsx');
var SelectBox = require('comp/SelectBox.jsx');
var ProgressBar = require('comp/ProgressBar.jsx');
var TeamColorPicker = require('comp/TeamColorPicker.jsx');
var MapSelect = require('comp/MapSelect.jsx');
var GameSelect = require('comp/GameSelect.jsx');
var ChatLog = require('comp/ChatLog.jsx');
var ChatInput = require('comp/ChatInput.jsx');
var Options = require('comp/Options.jsx');
var Battle = require('act/Battle.js');
var sayBattle = require('act/Chat.js').sayBattle;
var Team = require('util/Team.js');

module.exports = React.createClass({
	displayName: 'Battle',
	mixins: [
		require('react-addons-linked-state-mixin'),
		SPM.connect('gameInfoStore', 'gameInfo'),
		SPM.connect('processStore', '', ['springRunning', 'downloads']),
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
			focusInput: true,

			// Bot selection dialog.
			addingBot: null,
			botType: '',
			botName: '',
			botSide: '0',
			botColor: [0, 0, 0],
		};
	},
	updateBattle: function(data){
		this.setState(data, function(){
			if (this.state.focusInput && this.refs.chatInput) {
				this.refs.chatInput.focusme();
				this.setState({ focusInput: false });
			}
		}.bind(this));
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
	handleChangeColor: function(color){
		this.props.battle.setOwnColor(color);
	},
	handleKick: function(name){
		this.props.battle.kickUser(name);
	},

	handleAddBot: function(n){
		var botType = this.state.botType;
		if (!botType && this.state.gameInfo.games[this.state.game])
			botType = _.keys(this.state.gameInfo.games[this.state.game].bots)[0] || '';
		this.setState({
			addingBot: n,
			botName: this.getRandomBotName(),
			botType: botType,
			botColor: _.sample(TeamColorPicker.colors),
		});
	},
	handleAddBotOK: function(){
		if (!this.state.botName || !this.state.botType)
			return;
		this.props.battle.addBot({
			team: this.state.addingBot,
			name: this.state.botName,
			type: this.state.botType,
			side: parseInt(this.state.botSide),
			color: this.state.botColor
		});
		this.setState({ addingBot: null });
	},
	handleCancelBot: function(){
		this.setState({ addingBot: null });
	},
	toggleBotColorPicker: function(){
		this.setState({ showingBotColorPicker: !this.state.showingBotColorPicker });
	},
	handlePickBotColor: function(color){
		this.setState({ botColor: color, showingBotColorPicker: false });
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
	handleVote: _.throttle(function(yes){
		sayBattle(yes ? '!y' : '!n');
	}, 1000),
	handleMapDialog: function(open){
		this.setState({ selectingMap: open });
	},
	handleSelectMap: function(map){
		this.setState({ selectingMap: false });
		this.props.battle.setMap(map);
	},
	handleGameDialog: function(open){
		this.setState({ selectingGame: open });
	},
	handleSelectGameEngine: function(game, engine){
		this.setState({ selectingGame:  false });
		this.props.battle.setGame(game);
		this.props.battle.setEngine(engine);
	},
	handleSend: function(message, me){
		sayBattle(message, me);
	},
	handleChatClick: function(){
		this.refs.chatInput.focusme();
	},
	handleModOptionsDialog: function(open){
		this.setState({ changingModOptions: open });
	},
	handleChangeModOption: function(key, value){
		this.props.battle.setOption(key, value);
	},
	handleJoinUserBattle: function(user){
		var id = _.findKey(this.props.serverStore.getInitialState().battles, { founder: user });
		if (id !== undefined)
			Battle.joinMultiplayerBattle(id);
	},

	render: function(){
		// Don't render anything until we have battle data.
		if (!this.state.myName)
			return null;

		var downloads = this.state.downloads;
		var vote = this.state.vote;
		var gameBots = {};
		var showSides = false;
		var modoptions = {};
		if (this.state.gameInfo.games[this.state.game]) {
			gameBots = this.state.gameInfo.games[this.state.game].bots || {};
			showSides = _.size(this.state.gameInfo.games[this.state.game].sides) > 1;
			modoptions = this.state.gameInfo.games[this.state.game].options;
		}

		var myTeam = Team.getTeam(this.state.teams, this.state.myName);
		var mySide = isFinite(myTeam) ? this.state.teams[myTeam][this.state.myName].side : 0;

		// Display a team for each startbox even if the team is empty.
		var teams = _.extend(_.reduce(this.state.boxes, function(acc, b, key){
			acc[parseInt(key) + 1] = {};
			return acc;
		}, {}), this.state.teams);

		// Don't show colors for games that ignore them.
		var myColor = null;
		if (isFinite(myTeam) && this.state.teams[myTeam][this.state.myName].color &&
				!this.state.game.match(/^Evolution RTS/) &&
				!this.state.game.match(/^Zero-K/)) {
			myColor = this.state.teams[myTeam][this.state.myName].color;
		} else {
			teams = _.mapValues(teams, function(xs){
				return _.mapValues(xs, _.partial(_.omit, _, 'color'));
			});
		}

		return <div className="battleRoom">

			<div className="leftSide">
				<BattleMap
					map={this.state.map}
					boxes={this.state.boxes}
					team={myTeam}
					download={_.find(downloads, { name: this.state.map, type: 'map' })}
					onChangeTeam={this.handleChangeTeam}
					onAddBox={this.handleAddBox}
					onRemoveBox={this.handleRemoveBox}
					onClearBoxes={this.handleClearBoxes}
					gameInfoStore={this.props.gameInfoStore}
				/>
			</div>

			<div className={'rightSide' + (this.state.chatLog ? ' withChat' : '')}>
				<BattlePanel
					game={this.state.game}
					engine={this.state.engine}
					side={mySide}
					color={myColor}
					sides={showSides && this.state.gameInfo.games[this.state.game].sides}
					hasEngine={this.state.hasEngine}
					hasGame={this.state.hasGame}
					hasMap={this.state.hasMap}
					spectating={myTeam === 0}
					springRunning={this.state.springRunning}
					inProgress={this.state.inProgress}
					multiplayer={this.props.battle.typeTag === require('store/MBattle.js').typeTag}
					gameDownload={_.find(downloads, { name: this.state.game, type: 'game' })}
					engineDownload={_.find(downloads, { name: this.state.engine, type: 'engine' })}
					onCloseBattle={this.props.onClose}
					onStartBattle={this.handleStart}
					onChangeSide={this.handleChangeSide}
					onChangeColor={this.handleChangeColor}
					onSelectMap={_.partial(this.handleMapDialog, true)}
					onSelectGame={_.partial(this.handleGameDialog, true)}
					onOptions={_.partial(this.handleModOptionsDialog, true)}
				/>
				<BattleUserList
					teams={teams}
					sides={showSides && this.state.gameInfo.games[this.state.game].sides}
					nick={this.state.myName}
					onChangeTeam={this.handleChangeTeam}
					onAddBot={this.handleAddBot}
					onKick={this.handleKick}
				/>

				{vote ? <div className="votingBar show">
					{vote.message}
					<div>
						<button onClick={_.partial(this.handleVote, true)}>Yes</button>
						<ProgressBar value={vote.yVotes / vote.yVotesTotal} />
					</div><div>
						<button onClick={_.partial(this.handleVote, false)}>No</button>
						<ProgressBar value={vote.nVotes / vote.nVotesTotal} />
					</div>
				</div> : <div className="votingBar" />}

				{this.state.chatLog && <div className="battleChat">
					<ChatLog
						log={this.state.chatLog.messages}
						unread={0}
						nick={this.state.myName}
						onClick={this.handleChatClick}
						onJoinUserBattle={this.handleJoinUserBattle}
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
				{myColor && <div>
					Color: <div
						className="botColor"
						onClick={this.toggleBotColorPicker}
						style={{ backgroundColor: TeamColorPicker.toCss(this.state.botColor) }}
					/>
					{this.state.showingBotColorPicker &&
						<TeamColorPicker onPick={this.handlePickBotColor} />}
				</div>}
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

			{this.state.selectingGame && <ModalWindow
				title="Select Game"
				onClose={_.partial(this.handleGameDialog, false)}
			>
				<GameSelect
					games={this.state.gameInfo.games}
					engines={this.state.gameInfo.engines}
					currentGame={this.state.game}
					currentEngine={this.state.engine}
					onSelectGameEngine={this.handleSelectGameEngine}
				/>
			</ModalWindow>}

			{this.state.selectingMap && <ModalWindow
				title="Select Map"
				onClose={_.partial(this.handleMapDialog, false)}
			>
				<MapSelect
					maps={this.state.gameInfo.maps}
					mapSearchResult={this.state.gameInfo.mapSearchResult}
					onSelectMap={this.handleSelectMap}
				/>
			</ModalWindow>}

			{this.state.changingModOptions && <div className="modoptions"><ModalWindow
				title="Game options"
				onClose={_.partial(this.handleModOptionsDialog, false)}
			>
				<Options
					values={this.state.options}
					settings={modoptions}
					onChangeSetting={this.handleChangeModOption}
				/>
			</ModalWindow></div>}
		</div>;
	}
});
