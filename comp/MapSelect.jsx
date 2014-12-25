/*
 * Map selection dialog.
 */

'use strict'

var _ = require('lodash');

// This is based on the sroll size used by zk site.
// See https://github.com/ZeroK-RTS/Zero-K-Infrastructure/blob/master/Zero-K.info/AppCode/Global.cs#L41
var scrollSize = 40;

module.exports = React.createClass({
	mixins: [React.addons.LinkedStateMixin],
	getInitialState: function(){
		return {
			filter: '',
			entriesShowing: scrollSize,
		};
	},
	handleScroll: function(evt){
		var node = evt.target;
		if (node.scrollTop > node.scrollHeight - node.clientHeight * 1.5)
			this.setState({ entriesShowing: this.state.entriesShowing + scrollSize });
	},
	render: function(){
		return (<div className="mapSelect">
			<div>Filter: <input type="text" valueLink={this.linkState('filter')} /></div>
			<div className="mapList" onScroll={this.handleScroll}>
				{_.map(_.pick(this.props.maps, function(val, key){
					return key.match(new RegExp(this.state.filter, 'i'));
				}.bind(this)), function(val, key){
					return (<div className="mapIcon" key={key}
								onClick={_.partial(this.props.onSelectMap, key)}>
						<div className="thumb"><img src={val.thumbnail} /></div>
						<div className="name">{key}</div>
					</div>);
				}.bind(this)).slice(0, this.state.entriesShowing)}
			</div>
		</div>);
	}
});
