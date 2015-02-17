/*
 * A slider control. Supports valueLink with LinkedStateMixin.
 */

'use strict'

var _ = require('lodash');

module.exports = React.createClass({
	getDefaultProps: function(){
		return {
			onChange: _.noop,
			minValue: 0,
			maxValue: 100,
			step: 1,
			value: null,
			valueLink: null,
		};
	},
	getInitialState: function(){
		return { draggingValue: null };
	},
	updateThumbPosition: _.throttle(function(xpos){
		var node = this.getDOMNode();
		var step = this.props.step;
		this.setState({ draggingValue: Math.round((
			(xpos - node.offsetLeft) / node.clientWidth *
			(this.props.maxValue - this.props.minValue) +
			this.props.minValue) * step) / step });
	}, 40),
	handleDragStart: function(evt){
		evt.preventDefault();
		this.updateThumbPosition(evt.clientX);
	},
	handleDragMove: function(evt){
		evt.preventDefault();
		if (this.state.draggingValue !== null)
			this.updateThumbPosition(evt.clientX);
	},
	handleDragEnd: function(){
		console.log('mouseLeave');
		if (this.state.draggingValue === null)
			return;
		console.log('dragEnd');
		if (this.props.valueLink)
			this.props.valueLink.requestChange(this.state.draggingValue);
		else
			this.props.onChange(this.state.draggingValue);
		this.setState({ draggingValue: null });
	},
	render: function(){
		var value;
		if (this.state.draggingValue !== null)
			value = this.state.draggingValue;
		else if (this.props.valueLink)
			value = this.props.valueLink.value;
		else
			value = this.props.value;
		return <div className="slider"
			onMouseDown={this.handleDragStart}
			onMouseMove={this.handleDragMove}
			onMouseUp={this.handleDragEnd}
			onMouseLeave={this.handleDragEnd}
		>
			<div
				className="thumb"
				style={{ left: ((value - this.props.minValue) /
					(this.props.maxValue - this.props.minValue) * 100) + '%' }}
			/>
			{value}
		</div>;
	}
});
