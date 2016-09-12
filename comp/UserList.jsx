/*
 * User list with filtering.
 */

'use strict'

require('style/UserList.sass');
var _ = require('lodash');
var React = require('react');
var UserItem = require('comp/UserItem.jsx');
var Settings = require('store/Settings.js');

module.exports = React.createClass({
	displayName: 'UserList',
	mixins: [require('react-addons-linked-state-mixin')],
	getInitialState: function(){
		return {
			filter: '',
			filtering: false,
		};
	},
	showFilter: function(evt){
		this.setState({ filtering: true }, function(){
			this.refs.filterInput.focus();
		});
	},
	hideFilter: function(evt){
		evt.preventDefault();
		this.setState({ filtering: false });
	},
	render: function(){
		var users = this.props.users;
		var userItems = _.keys(users);
		if (this.state.filtering) {
			userItems = userItems.filter(function(x){
				return !!(x.match(this.state.filter));
			}.bind(this))
		}
		userItems = userItems.sort(function(a, b){
			return a.localeCompare(b);
		});
		if (Settings.sortColors) {
			userItems = userItems.sort(function(a, b){
				return users[b].timeRank - users[a].timeRank;
			}).sort(function(a, b){
				return users[b].level - users[a].level;
			}).sort(function(a, b){
				return Math.floor(users[b].elo/200) - Math.floor(users[a].elo/200);
			});
		}
		userItems = userItems.map(function(x){
			return <UserItem key={users[x].name} user={users[x]} battles={this.props.battles} />;
		}.bind(this));
		return <div className="userList">
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
		</div>;
	}
});
