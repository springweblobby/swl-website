/** @jsx React.DOM
 *
 * Battle user list.
 */

'use strict'

var _ = require('lodash');
var UserItem = require('./UserItem.jsx');

module.exports = React.createClass({
	handleTeamClick: function(n){
		this.props.onChangeTeam(n);
	},
	renderTeamHeader: function(num){
		return (<li className="listTeam" key={'t'+num}>
			<span className="listTeamName">{num == 0 ? 'Spectators' : 'Team ' + num}</span>
			<span className="listTeamButtons">
				<button onClick={_.partial(this.handleTeamClick, num)}>join</button>
				<button>add bot</button>
			</span>
		</li>);
	},
	render: function(){
		var userCount = _.reduce(_.map(this.props.teams, _.size), function(a, b){ return a + b }, 0);
		// Always show Spectators, Team 1 and Team 2.
		var teams = _.defaults(this.props.teams, { 0: {}, 1: {}, 2: {} });
		return (<div className="userList">
			<div className="listHeader">
				{userCount - _.size(this.props.teams[0])} players, {_.size(this.props.teams[0])} spectators
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
