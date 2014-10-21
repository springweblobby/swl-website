/** @jsx React.DOM
 *
 * Battle user list.
 */

'use strict'

var _ = require('lodash');
var UserItem = require('./UserItem.jsx');

module.exports = React.createClass({
	getDefaultProps: function(){
		return {
			onChangeTeam: _.noop,
			onAddBot: _.noop,
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
					return <UserItem user={user} key={user.name} />
				}.bind(this)));
			}.bind(this))}

			{/* Spectators */}
			{this.renderTeamHeader(0)}
			{_.map(teams[0], function(user){
				return <UserItem user={user} key={user.name} />
			}.bind(this))}

			</ul>
		</div>);
	}
});
