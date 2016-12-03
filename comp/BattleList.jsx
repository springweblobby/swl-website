/*
 * A list of multiplayer battles.
 */

'use strict'

require('style/BattleList.sass');
var _ = require('lodash');
var React = require('react');
var SPM = require('comp/StorePropMixins.js');
var Log = require('act/Log.js');
var Battle = require('act/Battle.js');
var GameInfo = require('act/GameInfo.js');
var Team = require('util/Team.js');
var ModalWindow = require('comp/ModalWindow.jsx');
var Settings = require('store/Settings.js');
var UserList = require('comp/UserList.jsx');
var SelectBox = require('comp/SelectBox.jsx');
var humanizedTimeDifference = require('util').humanizedTimeDifference;
var Sound = require('act/Sound.js');

module.exports = React.createClass({
	displayName: 'BattleList',
	mixins: [
		require('react-addons-linked-state-mixin'),
		SPM.connect('serverStore', '', ['battles', 'users', 'queues', 'activeQueues', 'queueCounts']),
		SPM.connect('gameInfoStore', '', ['maps']),
	],
	getInitialState: function(){
		return {
			selected: null,
			search: '',
			hidePassworded: false,
			sortBy: 'playerCount',
			reverse: true,
			showOther: false,
			passwordInput: null,
			passwordBattleId: 0,
			displayingMM: false,
			mmQueueSelection: [],
			displayingCreate: false,
			createPasswordInput: null,
			createTitleInput: Settings.name + "'s " +
				_.sample(['', '', 'cool', 'secret']) + ' ' +
				_.sample(['room', 'battle', 'game', 'clubhouse']),
			createTypeInput: 0,
		};
	},
	componentDidMount: function(){
		var sorted = this.sortBattles();
		this.setState({ selected: sorted.length > 0 && sorted[0].id || null });
	},
	handleSelect: function(id){
		this.setState({ selected: id });
	},
	handleJoin: function(id){
		if (this.state.battles[id].locked) {
			Log.warningBox("Can't join, battle is locked");
			return;
		}
		if (this.state.battles[id].passworded)
			this.setState({ passwordInput: '', passwordBattleId: id }, function(){
				this.refs.battlePassword.focus();
			});
		else
			Battle.joinMultiplayerBattle(id);
	},
	handlePasswordedJoin: function(){
		Battle.joinMultiplayerBattle(this.state.passwordBattleId, this.state.passwordInput);
		this.setState({ passwordInput: null });
	},
	handlePasswordKey: function(evt){
		if (evt.key === 'Enter')
			this.handlePasswordedJoin();
	},
	cancelPasswordedJoin: function(){
		this.setState({ passwordInput: null });
	},
	handleCloseCreate: function(){
		this.setState({ displayingCreate: false });
	},
	handleCreate: function(){
		this.setState({ displayingCreate: true });
	},
	handleCloseMM: function(){
		this.setState({ displayingMM: false });
	},
	handleMM: function(){
		this.setState({ displayingMM: true });
	},
	queueFilter: function(q){
		return !!this.state['mmQueueSelection' + q];
	},
	handleJoinMM: function(){
		this.handleCloseMM();
		var queueNames = this.state.queues.map(function(q){return q.Name}).filter(this.queueFilter);
		Battle.requestMatchmaking(queueNames);
	},
	handleSpawn: function(){
		this.handleCloseCreate();
		Battle.createMultiplayerBattle(this.state.createTypeInput, this.state.createTitleInput, this.state.createPasswordInput);
	},
	handleSort: function(sortBy){
		var reverse = this.state.sortBy === sortBy ? !this.state.reverse : false;
		this.setState({ sortBy: sortBy, reverse: reverse });
	},
	sortBattles: function(){
		var sortBy = this.state.sortBy;
		var searchRegExp = new RegExp(this.state.search, 'i');
		return _.values(this.state.battles).filter(function(battle){
			if ((this.state.showOther || Settings.selectedAll ||
				Settings.selectedEvo && battle.game.match(/^Evolution RTS/) ||
				Settings.selectedZk && battle.game.match(/^Zero-K/) ||
				Settings.selectedBa && battle.game.match(/^Balanced Annihilation/) ||
				Settings.selectedBa && battle.game.match(/^BA Chicken Defense/) ||
				Settings.selectedTa && battle.game.match(/^Tech Annihilation/) ||
				Settings.selectedXta && battle.game.match(/^XTA/) ||
				Settings.selectedNota && battle.game.match(/^NOTA/i) ||
				Settings.selectedJauria && battle.game.match(/^JauriaRTS/) ||
				Settings.selectedS44 && battle.game.match(/^Spring: 1944/) ||
				Settings.selectedIw && battle.game.match(/^Imperial Winter/) ||
				Settings.selectedPa && battle.game.match(/^Planet (Annihilation|Defense)/) ||
				Settings.selectedMf && battle.game.match(/^Metal Factions/)
				) &&
				// Matching an empty string returns a thruthy value for all strings
				// so the default of '' matches everything.
				_.some(_.pick(battle, ['title', 'game', 'map']), function(str){
					return !!str.match(searchRegExp);
				}) &&
				(!this.state.hidePassworded || !battle.passworded)
			) {
				return true;
			} else {
				return false;
			}
		}.bind(this)).map(function(battle){
			var ret = _.clone(battle);
			if (ret.playerCount == undefined)
				ret.playerCount = Team.toList(battle.teams).length - battle.spectatorCount;
			return ret;
		}).sort(function(a_, b_){
			var a = this.state.reverse ? b_[sortBy] : a_[sortBy];
			var b = this.state.reverse ? a_[sortBy] : b_[sortBy];
			if (a.localeCompare)
				return a.localeCompare(b, 'en', { numeric: true });
			else
				return a === b ? 0 : (a < b ? -1 : 1);
		}.bind(this));
	},
	renderMMQueue: function(q){
		return <tr><td>
				<input
					type="checkbox"
					ref={"check" + q.Name}
					className="queueSelector"
					key={q.Name}
					checkedLink={this.linkState('mmQueueSelection' + q.Name)}
				/> 
				{q.Name} 
			</td><td>
				{q.Description} 
			</td><td>
				{this.state.queueCounts[q.Name] || 0} in queue 
			</td></tr>
	},
	renderMMDialog: function(){
		var options = this.state.queues.map(this.renderMMQueue);
		return <ModalWindow title="Select Queues" onClose={this.handleCloseMM}>
		<div className="dialog">
			<table><tbody>{options}</tbody></table>
			<p> <button onClick={_.partial(this.handleJoinMM)}>
				{this.state.queues.map(function(q){return q.Name}).filter(this.queueFilter).length == 0 ? "Quit Matchmaking" : "Find Match"}
			</button></p>
		</div></ModalWindow>;
	},
	renderCreateDialog: function(){
		
		return <ModalWindow title="Create Battle" onClose={this.handleCloseCreate}>
		<div className="dialog">
			<table>
			<tbody>
			<tr>
				<td>Title </td>
				<td><input
					type="text"
					ref="battleTitle"
					valueLink={this.linkState('createTitleInput')}
				/></td>
			</tr>
			<tr>
				<td>Game type </td>
				<td><SelectBox valueLink={this.linkState('createTypeInput')}>
					<div key={5}>Cooperative</div>
					<div key={6}>Teams</div>
					<div key={4}>FFA</div>
					<div key={3}>1v1</div>
					<div key={0}>Custom</div>
				</SelectBox></td>
			</tr>
			<tr>
				<td>Password </td>
				<td><input
					type="password"
					ref="createPassword"
					valueLink={this.linkState('createPasswordInput')}
					onKeyDown={this.handlePasswordKey}
				/></td>
			</tr>
			</tbody>
			</table>
			<p> <button onClick={_.partial(this.handleSpawn)}>Host</button></p>
		</div></ModalWindow>;
	},
	render: function(){
		var now = new Date();
		var maps = this.state.maps;
		var loadThumbs = [];
		var selBattle = this.state.battles[this.state.selected];
		var selFounder = selBattle && this.state.users[selBattle.founder];
		var content = <div className="battleList">
			<div className="main">
			<div className="filterBox">
				<p>
					<label>Search: <input type="text" valueLink={this.linkState('search')} /></label>
					<label><input type="checkbox" checkedLink={this.linkState('hidePassworded')} /> Hide passworded battles</label>
					<label><input type="checkbox" checkedLink={this.linkState('showOther')} /> Show games not selected in settings</label>
					{this.props.serverStore.storeName === 'ZkLobbyServer' &&
						<label><button onClick={_.partial(this.handleCreate)}>Create Battle</button></label>}
					{this.props.serverStore.storeName === 'ZkLobbyServer' &&
						<label><button onClick={_.partial(this.handleMM)}>
							{(!this.state.activeQueues || this.state.activeQueues.length == 0) ? "Enter Matchmaking" : "Looking for match"}
						</button></label>}
				</p>
			</div>

			<div className="tableWrapper"><table>
			<thead><tr>
				<th></th>
				<th onClick={_.partial(this.handleSort, 'title')}>Title</th>
				<th onClick={_.partial(this.handleSort, 'map')}>Map</th>
				<th onClick={_.partial(this.handleSort, 'playerCount')}>Players</th>
				<th onClick={_.partial(this.handleSort, 'spectatorCount')}>Spectators</th>
				<th onClick={_.partial(this.handleSort, 'game')}>Game</th>
			</tr></thead>
			<tbody>
			{this.sortBattles().map(function(battle){
				var running = !!this.state.users[battle.founder] &&
					!!this.state.users[battle.founder].inGame;
				if (!maps[battle.map] || !maps[battle.map].thumbnail)
					loadThumbs.push(battle.map);
				return <tr
						onClick={_.partial(this.handleSelect, battle.id)}
						onDoubleClick={_.partial(this.handleJoin, battle.id)}
						className={this.state.selected === battle.id ? 'selected' : ''}
						key={battle.id}
					>
					<td className="thumbnail">
						<img src={maps[battle.map] && maps[battle.map].thumbnail || ''} />
					</td>
					<td className="title">
						{battle.title}
						{battle.passworded && <img src={require('img/key.png')} />}
						{running && <img src={require('img/battle.png')} />}
						{battle.locked && <img src={require('img/lock.png')} />}
					</td>
					<td>{battle.map}</td>
					<td className="num">{battle.playerCount}</td>
					<td className="num">{battle.spectatorCount}</td>
					<td>{battle.game.replace(/ ?-? [^ ]+$/, '')}</td>
				</tr>;
			}.bind(this))}
			</tbody>
			</table></div>
			</div>

			<div className="infoBox"><div className="flexWrapper">
				{selBattle && <img src={maps[selBattle.map] && maps[selBattle.map].thumbnail || ''}
					className="thumbnail flexItem" />}
				<div className="flexItem">
					{selFounder && selFounder.inGame &&
						<p><img src={require('img/battle.png')} /> This battle is running.</p>}
					{selBattle && selBattle.passworded &&
						<p><img src={require('img/key.png')} /> This battle is passworded.</p>}
					{selBattle && selBattle.locked &&
						<p><img src={require('img/lock.png')} /> This battle is locked.</p>}
					{selFounder && selFounder.inGame && selFounder.inGameSince && <p><strong>Running time: </strong>{humanizedTimeDifference(now, selFounder.inGameSince)}</p>}
					<p>Max players: <strong>{selBattle && selBattle.maxPlayers || 'n/a'}</strong></p>
					<p>Game version: <strong>{selBattle && selBattle.game || 'n/a'}</strong></p>
					<p>Engine version: <strong>{selBattle && selBattle.engine || 'n/a'}</strong></p>
					<p>Host: <strong>{selBattle && selBattle.founder || 'n/a'}</strong></p>
				</div>
				<UserList
					users={selBattle && Team.toList(selBattle.teams) || {}}
					battles={this.state.battles}
				/>
				<div className="flexItem">
					{selBattle && <button onClick={_.partial(this.handleJoin, selBattle.id)}>JOIN</button>}
				</div>
			</div></div>

			{this.state.passwordInput !== null && <ModalWindow
				title="Battle password"
				onClose={this.cancelPasswordedJoin}
			>
				<input
					type="text"
					ref="battlePassword"
					valueLink={this.linkState('passwordInput')}
					onKeyDown={this.handlePasswordKey}
				/>
				<button onClick={this.handlePasswordedJoin}>Join</button>
			</ModalWindow>}
			{this.state.displayingCreate && this.renderCreateDialog()}
			{this.state.displayingMM && this.renderMMDialog()}
		</div>;
		if (loadThumbs.length > 0)
			GameInfo.loadMapThumbnails(loadThumbs);
		return content;
	}
});
