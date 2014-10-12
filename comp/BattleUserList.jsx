/** @jsx React.DOM
 *
 * Battle user list.
 */

'use strict'

var _ = require('lodash');
var UserItem = require('./UserItem.jsx');

module.exports = React.createClass({
	render: function(){
		var allUsers = _.flatten(_.map(this.props.teams, _.partialRight(_.map, _.identity)));
		return (<div className="userList">
			<div className="listHeader">
				{allUsers.length - _.size(this.props.teams[0])} players, {_.size(this.props.teams[0])} spectators
			</div>
		</div>);
	}
});
