/** @jsx React.DOM */

'use strict'

module.exports = React.createClass({
	handleSend: function(){
		var node = this.refs.input.getDOMNode();
		if (node.value !== ''){
			this.props.onSend(node.value);
			node.value = '';
		}
	},
	handleKey: function(evt){
		if (evt.key === 'Enter')
			this.handleSend();
	},
	render: function(){
		return (<div className="chatInput">
				<input type="text" ref="input" onKeyDown={this.handleKey} />
				<button onClick={this.handleSend}>Send</button>
			</div>);
	}
});
