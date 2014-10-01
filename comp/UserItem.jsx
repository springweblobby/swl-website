/** @jsx React.DOM */

'use strict'

module.exports = React.createClass({
	render: function(){
		var user = this.props.user;
		return <li className="userItem"><img src={'img/flags/' + user.country.toLowerCase() + '.png'} /> {user.name}</li>
	}
});
