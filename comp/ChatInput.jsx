/** @jsx React.DOM */

'use strict'

module.exports = React.createClass({
	handleSend: function(){
		var value = this.refs.input.getDOMNode().value;
		if (value !== '')
			this.props.onSend(value);
	},
	handleKey: function(){
	},
	render: function(){
		return (<div className="chatInput">
				<input type="text" ref="input" onKeyDown={this.handleKey} />
				<button onClick={this.handleSend}>Send</button>
			</div>);
	}
});
