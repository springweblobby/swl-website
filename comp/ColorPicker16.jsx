'use strict'

require('style/ColorPicker16.sass');
require('style/mIRC_colors.sass');
var _ = require('lodash');
var React = require('react');

module.exports = React.createClass({
	displayName: 'ColorPicker16',
	
	colors: [
				["white", "lime", "green", "blue"],
				["silver", "yellow", "fuchsia", "navy"],
				["gray", "red", "purple", "black"],
				["brown", "orange", "teal", "lightcyan"],
			],
	
	handleColorClick:function(color)
	{
		this.props.onColorClick(color);
	},
	render: function(){
		var i;
		var colorStyle;
		var colorDivs = [];
		for(i=0;i<16;i+=1)
		{
			if (i%4==0) {
				colorDivs.push(<div key={'break'+i} ></div>)
			}
			colorStyle = "colorBlock mircBg"+i;
			colorDivs.push(<div className={colorStyle} key={i} onClick={_.partial(this.handleColorClick, i)} />)
			
		}
		
		
		return <div className="colorPicker16">
			Select a color
			{colorDivs}
		</div>;
	}
});
