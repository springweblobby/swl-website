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

var GameInfo = require('../store/GameInfo.js');

module.exports = React.createClass({
	mixins: [Reflux.connect(GameInfo, 'gameInfo')],
	// We need custom initialization because the store is passed in a prop.
	componentDidMount: function(){
		this.subscription = this.listenTo(this.props.battle, this.updateBattle, this.updateBattle);
	},
	componentWillReceiveProps: function(props){
		if (props.battle !== this.props.battle){
			this.subscription.stop();
			this.subscription = this.listenTo(this.props.battle, this.updateBattle, this.updateBattle);
		}
	},
	componentWillUnmount: function(){
		this.subscription.stop();;
	},
	getInitialState: function(){
		return {
			teams: {},
			map: '',
			game: '',
			engine: '',
			boxes: {},
			gameInfo: { games: {} },

			addingBot: null,
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
		// Add suffixes while such a name already exists.
		while (_(this.state.teams).map(_.keys).flatten().contains(name))
			name += ' ' + _.sample(['O\'', 'Mc', 'De']) + _.sample(names);
		return name;
	},
	handleChangeTeam: function(n){
		this.props.battle.setOwnTeam(n);
	},
	handleAddBot: function(n){
		this.setState({ addingBot: n }, function(){
			this.refs.botName.getDOMNode().value = this.getRandomBotName();
		});
	},
	handleAddBotOK: function(){
		this.props.battle.addBot(this.refs.botSelect.getDOMNode().value,
			this.refs.botName.getDOMNode().value, this.state.addingBot);
		this.setState({ addingBot: null });
	},
	handleCancelBot: function(){
		this.setState({ addingBot: null });
	},
	render: function(){
		var gameBots = {};
		if (this.state.gameInfo.games[this.state.game])
			gameBots = this.state.gameInfo.games[this.state.game].bots || {};

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
				<BattlePanel game={this.state.game} engine={this.state.engine} />
				<BattleUserList
					teams={this.state.teams}
					onChangeTeam={this.handleChangeTeam}
					onAddBot={this.handleAddBot}
				/>
			</div>

			{this.state.addingBot ?
				<ModalWindow onClose={this.handleCancelBot}
					title={'Adding bot to team ' + this.state.addingBot}>
					<div>Name: <input type="text" ref="botName" /></div>
					<div>
						Type: <select ref="botSelect">
							{_.map(gameBots, function(bot, name){
								return <option key={name}>{name}</option>;
							}.bind(this))}
						</select>
					</div>
					<div><button onClick={this.handleAddBotOK}>Add bot</button></div>
				</ModalWindow>
			: null}
		</div>);
	}
});
