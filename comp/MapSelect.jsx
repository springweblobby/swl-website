/*
 * Map selection dialog.
 */

'use strict'

var _ = require('lodash');
var GameInfo = require('../act/GameInfo.js');

// This is based on the sroll size used by zk site.
// See https://github.com/ZeroK-RTS/Zero-K-Infrastructure/blob/master/Zero-K.info/AppCode/Global.cs#L41
var scrollSize = 40;

module.exports = React.createClass({
	getInitialState: function(){
		return {
			remoteSearch: false,
			filter: '',
			entriesShowing: scrollSize,
		};
	},
	handleSearchType: function(remote){
		this.setState({ remoteSearch: remote });
	},
	handleLocalListScroll: function(evt){
		var node = evt.target;
		if (node.scrollTop > node.scrollHeight - node.clientHeight * 1.5)
			this.setState({ entriesShowing: this.state.entriesShowing + scrollSize });
	},
	handleRemoteListScroll: function(evt){
		var node = evt.target;
		if (node.scrollTop > node.scrollHeight - node.clientHeight * 4.0)
			GameInfo.searchMapsMore();
	},
	handleFilter: function(evt){
		this.setState({ filter: evt.target.value, entriesShowing: scrollSize });
	},
	renderMapIcon: function(name, thumb){
		return (<div className="mapIcon" key={name} onClick={_.partial(this.props.onSelectMap, name)}>
			<div className="thumb"><img src={thumb} /></div>
			<div className="name">{name}</div>
		</div>);
	},
	render: function(){
		var cx = React.addons.classSet;
		return (<div className="mapSelect">
			<ul className="mapSearchType">
				<li className={cx({ 'selected': !this.state.remoteSearch })}
					onClick={_.partial(this.handleSearchType, false)}>My Maps</li>
				<li className={cx({ 'selected': this.state.remoteSearch })}
					onClick={_.partial(this.handleSearchType, true)}>All Maps</li>
			</ul>

			{this.state.remoteSearch ?
				<div className="mapSearchOptions">
					<div>Name: <input type="text" /></div>
					<div><button>Search</button></div>
				</div>
			:
				<div className="mapSearchOptions">
					<div>Filter: <input type="text" onChange={this.handleFilter} /></div>
				</div>
			}
			{this.state.remoteSearch ?
				<div className="mapList" onScroll={this.handleRemoteListScroll}>
					{_.map(this.props.mapSearchResult, function(map){
						return this.renderMapIcon(map.InternalName,
							'http://zero-k.info/Resources/' + map.ThumbnailName);
					}.bind(this))}
				</div>
			:
				<div className="mapList" onScroll={this.handleLocalListScroll}>
					{_.map(_.pick(this.props.maps, function(val, key){
						return key.match(new RegExp(this.state.filter, 'i'));
					}.bind(this)), function(val, key){
						return this.renderMapIcon(key, val.thumbnail);
					}.bind(this)).slice(0, this.state.entriesShowing)}
				</div>
			}
		</div>);
	}
});
