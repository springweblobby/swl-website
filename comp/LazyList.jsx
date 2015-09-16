'use strict'

var _ = require('lodash');

module.exports = React.createClass({
	getInitialState: function(){
		return { offset: 0 };
	},
	handleScroll: function(evt){
		var node = this.getDOMNode();
		this.setState({ offset: Math.round(node.scrollTop / this.props.averageHeight) - 100 });
		//this.props.onScroll(evt);
	},
	render: function(){
		var sliceSize = 200;
		var length = this.props.length;
		var avgh = this.props.averageHeight;
		var off = Math.max(this.state.offset, 0);
		return <div
				className={'lazyList ' + this.props.className}
				onScroll={this.handleScroll}
				onClick={this.props.onClick}
			>
			<div style={{ height: Math.max(0, avgh * off) + 'px' }} />
			{this.props.renderSlice(off, off + sliceSize)}
			<div style={{ height: Math.max(0, avgh * (length - off - sliceSize)) + 'px' }} />
		</div>;
	}
});
