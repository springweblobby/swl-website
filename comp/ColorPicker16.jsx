'use strict'



var _ = require('lodash');

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
		/*
		var colorDivs = this.colors.map(function(colorRow){
			return colorRow.map(function(color){
				return(
					<div className="colorBlock" >-</div>
				)
			})
		})
		*/
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
		
		
		return (
			
			<div className="colorPickerBackground">
				<b>Select A Color</b>
				{colorDivs}
			</div>
		);
	}
});
