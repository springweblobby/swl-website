/*
 * A list of multiplayer battles.
 */

'use strict'

var _ = require('lodash');
var Reflux = require('reflux');
var Battle = require('act/Battle.js');
var GameInfo = require('act/GameInfo.js');
var Team = require('util/Team.js');

module.exports = React.createClass({
	mixins: [Reflux.connectFilter(require('store/LobbyServer.js'),
				_.partialRight(_.pick, ['battles', 'users'])),
		Reflux.connectFilter(require('store/GameInfo.js'), _.partialRight(_.pick, 'maps')),
	],
	getInitialState: function(){
		return {
			sortBy: 'playerCount',
			reverse: true,
		};
	},
	handleJoin: function(id){
		Battle.joinMultiplayerBattle(id);
	},
	handleSort: function(sortBy){
		var reverse = this.state.sortBy === sortBy ? !this.state.reverse : false;
		this.setState({ sortBy: sortBy, reverse: reverse });
	},
	render: function(){
		var maps = this.state.maps;
		var sortBy = this.state.sortBy;
		return <div className="battleList">
			<table>
			<thead><tr>
				<th></th>
				<th onClick={_.partial(this.handleSort, 'title')}>Title</th>
				<th onClick={_.partial(this.handleSort, 'game')}>Game</th>
				<th onClick={_.partial(this.handleSort, 'map')}>Map</th>
				<th onClick={_.partial(this.handleSort, 'playerCount')}>Players</th>
				<th onClick={_.partial(this.handleSort, 'spectatorCount')}>Spectators</th>
				<th onClick={_.partial(this.handleSort, 'founder')}>Host</th>
			</tr></thead>
			<tbody>
			{_.values(this.state.battles).map(function(battle){
				var ret = _.clone(battle);
				ret.playerCount = Team.toList(battle.teams).length - battle.spectatorCount;
				return ret;
			}).sort(function(a_, b_){
				var a = this.state.reverse ? b_[sortBy] : a_[sortBy];
				var b = this.state.reverse ? a_[sortBy] : b_[sortBy];
				if (a.localeCompare)
					return a.localeCompare(b, 'en', { numeric: true });
				else
					return a === b ? 0 : (a < b ? -1 : 1);
			}.bind(this)).map(function(battle){
				if (!maps[battle.map])
					GameInfo.loadMap(battle.map);
				var running = !!this.state.users[battle.founder] &&
					!!this.state.users[battle.founder].inGame;
				return <tr onClick={_.partial(this.handleJoin, battle.id)}>
					<td className="thumbnail">
						<img src={maps[battle.map] && maps[battle.map].thumbnail || ''} />
					</td>
					<td>
						{battle.title}
						{running && <img src="img/blue_loader.gif" />}
					</td>
					<td>{battle.game}</td>
					<td>{battle.map}</td>
					<td>{battle.playerCount}</td>
					<td>{battle.spectatorCount}</td>
					<td>{battle.founder}</td>
				</tr>;
			}.bind(this))}
			</tbody>
			</table>
		</div>;
	}
});
