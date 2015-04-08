/** @jsx React.DOM */

'use strict'

// TODO: Command history.

var _ = require('lodash');

module.exports = React.createClass({
	formatPlaceholderChar:'\u2665',
	componentDidMount: function(){
		// Those are not state that defines rendering so there's little point
		// using setState() for that.
		this.completionList = [];
		this.completionIdx = 0;
	},
	handleSend: function(){
		var node = this.refs.input.getDOMNode();
		var msg
		if (node.value !== ''){
			msg = node.value;
			msg = msg.replace( new RegExp( this.formatPlaceholderChar, 'g') , '\x03' );
			this.props.onSend(msg);
			node.value = '';
		}
	},
	handleKey: function(evt){
		if (evt.key === 'Enter') {
			this.handleSend();
		} else if (evt.key === 'Tab') {
			evt.preventDefault();
			var inputNode = this.refs.input.getDOMNode();
			var words = inputNode.value.split(' ');
			if (this.completionList.length === 0) {
				var lastWordRegex = new RegExp(words[words.length - 1].
					replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&"), 'i');
				this.completionList = _.filter(this.props.users, function(name){
					return lastWordRegex.test(name);
				});
				this.completionIdx = 0;
			}
			if (this.completionList.length !== 0) {
				words.pop();
				words.push(this.completionList[this.completionIdx % this.completionList.length]);
				inputNode.value = words.join(' ');
				this.completionIdx++;
			}
		} else if (evt.ctrlKey && evt.keyCode == 'K'.charCodeAt(0) ) {
			this.props.onSummonColorPicker();
		} else {
			this.completionList = [];
		}
	},
	addColorCode:function(color)
	{
		var node = this.refs.input.getDOMNode();
		node.value += this.formatPlaceholderChar + color;
	},
	focusme: function(){
		var inputNode = this.refs.input.getDOMNode();
		inputNode.focus();
	},
	render: function(){
		return (<div className="chatInput">
			<input type="text" ref="input" onKeyDown={this.handleKey} />
			<button onClick={this.handleSend}>Send</button>
		</div>);
	}
});
