/*
 * User list with filtering.
 */

'use strict'

var _ = require('lodash');
var UserItem = require('comp/UserItem.jsx');

module.exports = React.createClass({
	mixins: [React.addons.LinkedStateMixin],
	getInitialState: function(){
		return {
			filter: '',
			filtering: false,
		};
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
		var userItems = _.keys(users);
		if (this.state.filtering) {
			userItems = userItems.filter(function(x){
				return !!(x.match(this.state.filter));
			}.bind(this))
		}
		userItems = userItems.sort(function(a, b){
			return a.localeCompare(b);
		}).map(function(x){
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
