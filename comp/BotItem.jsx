/*
 * An item in the UserList. It shows as much data as you give it, the only
 * required data field is user.name
 */

'use strict'

var _ = require('lodash');

module.exports = React.createClass({
	render: function(){
		var user = this.props.user;

		return <li className="userItem">
			<span className="userFrontPics">
				<img src='img/robot.png' />
				{user.sideIcon && <img src={user.sideIcon} />}
			</span>
			{user.name} ({user.botType}) <span className="listTip">({user.botOwner})</span>
			{this.props.mine && <span className="listItemButtons">
				<button onClick={_.partial(this.props.onKick, user.name)}>remove</button>
			</span>}
		</li>;
	}
});
