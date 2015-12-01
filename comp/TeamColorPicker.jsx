'use strict'

require('style/TeamColorPicker.sass');
var React = require('react');

var colors = [
	[228,26,28],
	[55,126,184],
	[77,175,74],
	[152,78,163],
	[255,127,0],
	[255,255,51],
	[166,86,40],
	[247,129,191],
	[153,153,153],
	[116, 15, 16],
];

function toCss(color){
	return 'rgb(' + color.map(String).join(',') + ')';
}

module.exports = React.createClass({
	displayName: 'TeamColorPicker',
	statics: {
		colors: colors,
		toCss: toCss,
	},
	render: function(){
		var onPick = this.props.onPick;
		return <div className="teamColorPicker">
			{_.range(Math.ceil(colors.length / 5)).map(function(i){
				return <div>{_.range(i*5, Math.min((i+1)*5, colors.length)).map(function(n){
					return <div
						className="colorBlock"
						style={{ backgroundColor: toCss(colors[n]) }}
						onClick={_.partial(onPick, colors[n])}
					/>;
				})}</div>;
			})}
		</div>;
	}
});
