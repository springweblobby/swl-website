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
	render: function(){
		var userCount = _.reduce(_.map(this.props.teams, _.size), function(a, b){ return a + b }, 0);
		return (<div className="userList">
			<div className="listHeader">
				{userCount - _.size(this.props.teams[0])} players, {_.size(this.props.teams[0])} spectators
			</div>
			<ul>
			{_.map(this.props.teams, function(team, num){
				return [<li className="listTeam" onClick={this.handleTeamClick} key={'t'+num}>Team {num}</li>].
					concat(_.map(team, function(user){
						return <UserItem user={user} />
				}.bind(this)));
			}.bind(this))}
			</ul>
		</div>);
	}
});
