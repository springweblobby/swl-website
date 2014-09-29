/** @jsx React.DOM */
(function(){
    'use strict'

	module.exports = React.createClass({
		render: function(){
			var user = this.props.user;
			return <li><img src={'img/flags/' + user.country.toLowerCase() + '.png'} />{user.name}</li>
		}
	});

})()
