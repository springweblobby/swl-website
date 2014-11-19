/** @jsx React.DOM
 *
 * Battle user list.
 */

'use strict'

var _ = require('lodash');
var UserItem = require('./UserItem.jsx');
var BotItem = require('./BotItem.jsx');

module.exports = React.createClass({
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
		return (<li className="listTeam" key={'t'+num}>
			<span className="listTeamName">{num == 0 ? 'Spectators' : 'Team ' + num}</span>
			<span className="listTeamButtons">
				<button onClick={_.partial(this.props.onChangeTeam, num)}>join</button>
				{num == 0 ? null : <button onClick={_.partial(this.props.onAddBot, num)}>add bot</button>}
			</span>
		</li>);
	},
	renderItem: function(user){
		// I'm having seconds thoughts about immutability in js being too much
		// hassle. Cloning belongs to the store, maybe I should have used
		// React.addons.update right from the start.
		user = _.clone(user);
		if (this.props.sides && ('side' in user))
			user.sideIcon = this.props.sides[user.side].icon;
		return (user.bot ? <BotItem user={user} key={user.name} onKick={this.props.onKick} /> :
			<UserItem user={user} key={user.name} />);
	},
	render: function(){
		// Sum of all elements of a collection.
		var sum = _.partialRight(_.reduce, function(a, b){ return a + b; }, 0);
		var userCount = sum(_.map(this.props.teams, _.size));
		// Ignores bots that are spectators.
		var botCount = sum(_.map(_.omit(this.props.teams, '0'),
			function(t){ return _.size(_.filter(t, { bot: true })); }));
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
				return [this.renderTeamHeader(num)].concat(_.map(team, function(user){
					return this.renderItem(user);
				}.bind(this)));
			}.bind(this))}

			{/* Spectators */}
			{this.renderTeamHeader(0)}
			{_.map(teams[0], function(user){
				return this.renderItem(user);
			}.bind(this))}

			</ul>
		</div>);
	}
});
