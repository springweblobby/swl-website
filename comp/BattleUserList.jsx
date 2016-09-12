/*
 * Battle user list.
 */

'use strict'

require('style/UserList.sass');
var _ = require('lodash');
var React = require('react');
var UserItem = require('comp/UserItem.jsx');
var BotItem = require('comp/BotItem.jsx');
var Team = require('util/Team.js');

module.exports = React.createClass({
	displayName: 'BattleUserList',
	getDefaultProps: function(){
		return {
			onChangeTeam: _.noop,
			onAddBot: _.noop,
			onKick: _.noop,
			showSides: false,
			teams: {},
		};
	},
	renderTeamHeader: function(num){
		return <li className="listTeam" key={'t'+num}>
			<span className="listTeamName">{num == 0 ? 'Spectators' : 'Team ' + num}</span>
			<span className="listTeamButtons">
				<button onClick={_.partial(this.props.onChangeTeam, num)}>join</button>
				{num == 0 ? null : <button onClick={_.partial(this.props.onAddBot, num)}>add bot</button>}
			</span>
		</li>;
	},
	renderItem: function(user){
		// I'm having seconds thoughts about immutability in js being too much
		// hassle. Cloning belongs to the store, maybe I should have used
		// React.addons.update right from the start.
		user = _.clone(user);
		if (this.props.sides && ('side' in user))
			user.sideIcon = this.props.sides[user.side].icon;
		return (user.botType ? <BotItem
				user={user}
				key={user.name}
				mine={user.botOwner === this.props.nick}
				onKick={this.props.onKick}
			/> : <UserItem
				user={user}
				key={user.name}
				battle={true}
			/>);
	},
	render: function(){
		var userCount = Team.toList(this.props.teams).length;
		// Ignores bots that are spectators.
		var botCount = _.filter(Team.toList(_.omit(this.props.teams, '0')),
			function(b){ return !!b.botType; }).length;
		// Always show Spectators, Team 1 and Team 2.
		var teams = _.defaults(this.props.teams, { 0: {}, 1: {}, 2: {} });
		return (<div className="userList">
			<div className="listHeader">
				{userCount - _.size(this.props.teams[0]) - botCount} players,
				{' ' + botCount} bots, {_.size(this.props.teams[0])} spectators
				<span className="listHeaderButtons">
					<button>balance</button>
					<button>spec afk</button>
					<button>add team</button>
				</span>
			</div>
			<ul>

			{/* Teams */}
			{_.map(_.omit(teams, '0'), function(team, num){
				return [this.renderTeamHeader(num)].concat(_.values(team).sort(function(a, b){
					return b.timeRank - a.timeRank;
				}).sort(function(a, b){
					return b.level - a.level;
				}).sort(function(a, b){
					return Math.floor(b.elo/200) - Math.floor(a.elo/200);
				}).map(function(user){
					return this.renderItem(user);
				}.bind(this)));
			}.bind(this))}

			{/* Spectators */}
			{this.renderTeamHeader(0)}
			{_.values(teams[0]).sort(function(a, b){
				return b.timeRank - a.timeRank;
			}).sort(function(a, b){
				return b.level - a.level;
			}).sort(function(a, b){
				return Math.floor(b.elo/200) - Math.floor(a.elo/200);
			}).map(function(user){
				return this.renderItem(user);
			}.bind(this))}

			</ul>
		</div>);
	}
});
