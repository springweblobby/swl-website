/*
 * Map selection dialog.
 */

'use strict'

var _ = require('lodash');

module.exports = React.createClass({
	getInitialState: function(){
		return { entriesShowing: 6 };
	},
	handleScroll: function(evt){
		var node = evt.target;
		if (node.scrollTop > node.scrollHeight - node.clientHeight * 1.5)
			this.setState({ entriesShowing: this.state.entriesShowing + 6 });
	},
	render: function(){
		return (<div className="mapSelect">
			<div className="mapList" onScroll={this.handleScroll}>
				{_.map(this.props.maps, function(val, key){
					return (<div className="mapIcon" key={key}
								onClick={_.partial(this.props.onSelectMap, key)}>
						<img src={val.thumbnail} />
						<div>{key}</div>
					</div>);
				}.bind(this)).slice(0, this.state.entriesShowing)}
			</div>
		</div>);
	}
});
