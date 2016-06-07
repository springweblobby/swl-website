'use strict'

require('style/Fontcolor.sass');
require('style/mIRC_colors.sass');
var _ = require('lodash');
var React = require('react');


var ColorPicker = require('comp/ColorPicker16.jsx');

module.exports = React.createClass({
	displayName: 'FontColor',
	
	formatPlaceholderChar:'\u2665',
	
	curFg:'',
	curBg:'',
	
	getInitialState: function(){
		return { curBg: '' };
		return { curFg: '' };
	},
	handleColorChoose:function(evt)
	{
		this.props.onColorChoose(this.formatPlaceholderChar + this.curFg + (this.curBg !== '' ? ',' : '' ) + this.curBg);
		this.curFg = ''
		this.curBg = ''
		this.setExample()
		evt.preventDefault();
	},
	
	setExample:function()
	{
		this.setState({ curClass:"mircBg"+this.curBg + ' mircFg' + this.curFg})
	},
	
	handleColorClickFg:function(color)
	{
		this.curFg = color
		this.setExample()
	},
	handleColorClickBg:function(color)
	{
		this.curBg = color
		this.setExample()
	},
	
	render: function(){
		return <div className="fontColor">
			<div className="padded"><b>Font Color</b></div>
			<div className="column">Background
				<ColorPicker
					onColorClick={this.handleColorClickBg}
				/>
			</div>
			<div className="column">Foreground
				<ColorPicker
					onColorClick={this.handleColorClickFg}
				/>
				
			</div>
			<div className="padded">
				<span
					ref="testFont"
					className={this.state.curClass}		
				>Preview</span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
				<a href="#" onClick={_.partial(this.handleColorChoose)}>Apply</a>
			</div>
		</div>;
	}
});
