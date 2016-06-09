'use strict'

// TODO: Command history.

require('style/ChatInput.sass');
var _ = require('lodash');
var React = require('react');
var sendRaw = require('act/LobbyServer.js').sendRaw;

module.exports = React.createClass({
	displayName: 'ChatInput',
	formatPlaceholderChar:'\u2665',
	componentDidMount: function(){
		// Those are not state that defines rendering so there's little point
		// using setState() for that.
		this.completionList = [];
		this.completionIdx = 0;
	},
	handleSend: function(){
		var node = this.refs.input;
		var msg = node.value.replace( new RegExp( this.formatPlaceholderChar, 'g') , '\x03' );
		var match;
		if (node.value !== ''){
			if ( (match = msg.match(/^\/me (.*)/)) )
				this.props.onSend(match[1], true);
			else if ( (match = msg.match(/^\/raw (.*)/)) )
				sendRaw(match[1]);
			else
				this.props.onSend(msg, false);
			node.value = '';
		}
	},
	handleKey: function(evt){
		if (evt.key === 'Enter') {
			this.handleSend();
		} else if (evt.key === 'Tab') {
			evt.preventDefault();
			var inputNode = this.refs.input;
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
	addColorCode:function(str)
	{
		var node = this.refs.input;
		
		var cursorPos, cursorEnd, curText, curTextLeft, curTextRight, curTextSelected
		
		cursorPos = node.selectionStart;
		cursorEnd = node.selectionEnd;
		
		curText = node.value;
		curTextLeft = curText.substring(0,cursorPos);
		curTextRight = curText.substring(cursorEnd);
		curTextSelected = curText.substring(cursorPos, cursorEnd );
		
		var colorCode = str
		var colorCodeEnd = this.formatPlaceholderChar;
		
		if (cursorPos != cursorEnd)
		{
			node.value = curTextLeft + colorCode + curTextSelected + colorCodeEnd + curTextRight;
			
			node.selectionStart = curTextLeft.length + colorCode.length;
			node.selectionEnd = curTextLeft.length + colorCode.length + curTextSelected.length;
		}
		else
		{
			node.value = curTextLeft + colorCode + curTextRight;
			
			node.selectionStart = curTextLeft.length + colorCode.length;
			node.selectionEnd = curTextLeft.length + colorCode.length;
		}
	},
	focusme: function(){
		var inputNode = this.refs.input;
		inputNode.focus();
	},
	render: function(){
		return (<div className="chatInput">
			<input type="text" ref="input" onKeyDown={this.handleKey} />
			<button onClick={this.handleSend}>Send</button>
		</div>);
	}
});
