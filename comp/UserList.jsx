/** @jsx React.DOM */

'use strict'

var _ = require('lodash');
var UserItem = require('./UserItem.jsx');

module.exports = React.createClass({
	mixins: [React.addons.LinkedStateMixin],
	getInitialState: function(){
		return {
			filter: '',
			filtering: false,
		};
	},
	update: function(data){
		this.setState({ users: data.users });
	},
	showFilter: function(evt){
		this.setState({ filtering: true }, function(){
			this.refs.filterInput.getDOMNode().focus();
		});
	},
	hideFilter: function(evt){
		evt.preventDefault();
		this.setState({ filtering: false });
	},
	render: function(){
		var users = this.props.users;
		var userItems = _.keys(users).filter(function(x){
			return !this.state.filtering || !!(x.match(this.state.filter));
		}.bind(this)).sort().map(function(x){
			return <UserItem key={users[x].name} user={users[x]} />;
		});
		return (<div className="userList">
			<div className="listHeader">
				<span style={{ display: this.state.filtering ? 'none' : 'inline' }} onClick={this.showFilter}>
					{userItems.length} users <span className="listTip">(click to filter)</span>
				</span>
				<span style={{ display: this.state.filtering ? 'inline' : 'none' }}>
					<input className="listFilter" type="text" ref="filterInput" valueLink={this.linkState('filter')} />
					<a className="filterHide" herf="#" onClick={this.hideFilter}>×</a>
				</span>
			</div>
			<ul>{userItems}</ul>
		</div>);
	}
});
