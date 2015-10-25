/*
 * Displays message boxes from the Log store.
 */

'use strict'

require('style/LogMessages.sass');
var React = require('react');
var Reflux = require('reflux');
var Log = require('act/Log.js');
var ModalWindow = require('comp/ModalWindow.jsx');

module.exports = React.createClass({
	displayName: 'LogMessages',
	mixins: [Reflux.connect(require('store/Log.js'))],
	getInitialState: function(){
		return { messageBox: null };
	},
	handleClose: function(){
		Log.popMessageBox();
	},
	render: function(){
		var box = this.state.messageBox;
		if (!box) return null;
		return (<ModalWindow title={box.title} onClose={this.handleClose}>
			<div className="logMessageBox">{box.msg}</div>
			<button onClick={this.handleClose}>OK</button>
		</ModalWindow>);
	}
});
