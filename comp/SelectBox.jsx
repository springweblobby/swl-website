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

var _ = require('lodash');

module.exports = React.createClass({
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
		this.setState({ open: !this.state.open });
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
		var currentValue = (this.props.valueLink && this.props.valueLink.value) || this.props.value;
		return (<div className="selectBox">
			<div className="value" onClick={this.handleOpen}>{children[currentValue]}</div>
			{this.state.open && <div className="dropDown">
				{_.map(children, function(elem, key){
					return <div key={key} onClick={_.partial(this.handleSelect, key)}>{elem}</div>;
				}.bind(this))}
			</div>}
		</div>);
	}
});
