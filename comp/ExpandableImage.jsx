/*
 * An image that doesn't load until the user clicks on the icon, and can be hidden by another click
 */

'use strict'

var _ = require('lodash');
var React = require('react');

module.exports = React.createClass({
	displayName: 'ExpandableImage',
	
	loadImage:function(evt)
	{
		var src = this.props.src;
		var thisRef = this.refs.imageLoad;
		evt.preventDefault();
		this.refs.imageLoad.src = src;
		this.refs.imageLoad.style.display = thisRef.style.display == 'block' ? 'none' : 'block';
		
		thisRef.scrollIntoView();
	},

	render: function(){
		var src = this.props.src;
		return <span>
			<a target='_blank' href={src}>{src}</a>
			<a href="#" onClick={_.partial(this.loadImage).bind(this)} >
				<img src='img/webdown.png'  align='top' />
			</a>
			<img ref='imageLoad' style={{maxWidth: '400px', display:'none'}} />
		</span>;
	
	}
});
