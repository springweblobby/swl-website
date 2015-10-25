/*
 * A slider control. Supports valueLink with LinkedStateMixin.
 */

'use strict'

require('style/Slider.sass');
var _ = require('lodash');
var React = require('react');
var findDOMNode = require('react-dom').findDOMNode;

module.exports = React.createClass({
	displayName: 'Slider',
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
		return { dragging: false };
	},
	updateThumbPosition: _.throttle(function(xpos){
		var node = findDOMNode(this);
		var step = this.props.step;
		var value = Math.round(((xpos - node.getBoundingClientRect().left) /
			node.clientWidth * (this.props.maxValue - this.props.minValue) +
			this.props.minValue) * step) / step;
		if (value > this.props.maxValue)
			value = this.props.maxValue;
		if (value < this.props.minValue)
			value = this.props.minValue;
		if (this.props.valueLink)
			this.props.valueLink.requestChange(value);
		else
			this.props.onChange(value);
	}, 50),
	handleDragStart: function(evt){
		evt.preventDefault();
		document.addEventListener('mousemove', this.handleDragMove);
		document.addEventListener('mouseup', this.handleDragEnd);
		this.setState({ dragging: true });
		this.updateThumbPosition(evt.clientX);
	},
	handleDragMove: function(evt){
		evt.preventDefault();
		if (this.state.dragging)
			this.updateThumbPosition(evt.clientX);
	},
	handleDragEnd: function(){
		document.removeEventListener('mousemove', this.handleDragMove);
		document.removeEventListener('mouseup', this.handleDragEnd);
		this.setState({ dragging: false });
	},
	render: function(){
		var value;
		if (this.props.valueLink)
			value = this.props.valueLink.value;
		else
			value = this.props.value;
		return <div className="slider" onMouseDown={this.handleDragStart}>
			<div className="thumbWrapper">
				<div
					className="thumb"
					style={{ left: ((value - this.props.minValue) /
						(this.props.maxValue - this.props.minValue) * 100) + '%' }}
				/>
			</div>
		</div>;
	}
});
