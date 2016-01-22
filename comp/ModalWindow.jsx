'use strict'

require('style/ModalWindow.sass');
var _ = require('lodash');
var React = require('react');

module.exports = React.createClass({
	displayName: 'ModalWindow',
	getDefaultProps: function(){
		return {
			title: 'Dialog',
			contentClassName: '',
			onClose: _.noop
		};
	},
	handleKey: function(evt){
		if (evt.key === 'Escape') {
			evt.stopPropagation();
			this.props.onClose();
		}
	},
	render: function(){
		return (<div className="modalOverlay">
			<div className="modalWindow" onKeyDown={this.handleKey}>
				<div className="modalTitle">{this.props.title}</div>
				<div className="modalCloseButton" onClick={this.props.onClose}>×</div>
				<div className={'modalContent ' + this.props.contentClassName}>
					{this.props.children}
				</div>
			</div>
		</div>);
	}
});
