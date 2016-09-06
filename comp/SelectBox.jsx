/*
 * A select box. Usage:
 * <SelectBox value="bar">
 *     <div key="foo">Foo Option</div>
 *     <div key="bar">Bar Option</div>
 * </SelectBox>
 *
 * Note that the possible values are given by children's keys. You can use
 * valueLink with LinkedStateMixin with this like with the standard <select>.
 */

'use strict'

require('style/SelectBox.sass');
var _ = require('lodash');
var React = require('react');
var findDOMNode = require('react-dom').findDOMNode;

module.exports = React.createClass({
	displayName: 'SelectBox',
	getDefaultProps: function(){
		return {
			onChange: _.noop,
			value: null,
			valueLink: null,
		};
	},
	getInitialState: function(){
		return { open: false };
	},
	handleOpen: function(){
		if (!this.state.open)
			document.addEventListener('click', this.handleOutsideClick);
		else
			document.removeEventListener('click', this.handleOutsideClick);
		this.setState({ open: !this.state.open });
	},
	handleOutsideClick: function(evt){
		if (this.isMounted() && this.state.open && !findDOMNode(this).contains(evt.target))
			this.handleOpen();
	},
	handleSelect: function(key){
		if (this.props.valueLink)
			this.props.valueLink.requestChange(key);
		else
			this.props.onChange(key);
		this.setState({ open: false });
	},
	render: function(){
		var children = {};
		React.Children.forEach(this.props.children, function(elem){
			children[elem.key] = elem;
		});
		var currentValue;
		if (this.props.valueLink)
			currentValue = this.props.valueLink.value
		else
			currentValue = this.props.value;
		return <div className="selectBox">
			<div className="value" onClick={this.handleOpen}><span className="label">{children[currentValue]}</span><span className="triangleArrow">▼</span></div>
			{this.state.open && <div className="dropDown">
				{_.map(children, function(elem, key){
					return <div key={key} onClick={_.partial(this.handleSelect, key)}>{elem}</div>;
				}.bind(this))}
			</div>}
		</div>;
	}
});
