/** @jsx React.DOM
 *
 * Displays message boxes from the Log store.
 */

'use strict'

var Reflux = require('reflux');
var Log = require('../act/Log.js');
var LogStore = require('../store/Log.js');
var ModalWindow = require('./ModalWindow.jsx');

module.exports = React.createClass({
	mixins: [Reflux.listenTo(LogStore, 'setState', 'setState')],
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
