/** @jsx React.DOM */

'use strict'

// TODO: Move state out of this and use it for modoptions too.

var _ = require('lodash');
var Reflux = require('reflux');
var Settings = require('../store/Settings.js');
var setSetting = require('../act/Settings.js').set;

module.exports = React.createClass({
	mixins: [Reflux.listenTo(Settings, 'updateSetting')],
	getInitialState: function(){
		var settings = {};
		_(Settings.settings).map(_.keys).flatten().forEach(function(key){
			settings[key] = Settings[key];
		});
		return {
			settings: settings,
			selected: _.keys(Settings.settings)[0],
		};
	},
	updateSetting: function(key){
		var settings = _.clone(this.state.settings);
		settings[key] = Settings[key];
		this.setState({ settings: settings });
	},
	handleSelect: function(category){
		this.setState({ selected: category });
	},
	handleChange: function(setting, key, evt){
		// We use the trigger() method directly to make sure the action is not
		// run async (which would cause the caret to jump to the end).
		if (setting.type === 'bool')
			setSetting.trigger(key, evt.target.checked);
		else
			setSetting.trigger(key, evt.target.value);
	},
	renderControl: function(s, key){
		switch (s.type){

		case 'text':
			return <input type="text" value={this.state.settings[key]} onChange={_.partial(this.handleChange, s, key)} />;
		case 'password':
			return <input type="password" value={this.state.settings[key]} onChange={_.partial(this.handleChange, s, key)} />;
		case 'bool':
			return <input type="checkbox" checked={this.state.settings[key]} onChange={_.partial(this.handleChange, s, key)} />;
		}
	},
	renderSetting: function(s, key){
		return (<div className="settingControl" key={key}>
			<div>{s.name}</div>
			<div>{this.renderControl(s, key)}</div>
		</div>);
	},
	render: function(){
		return (<div className="settingList">
			{_.keys(Settings.settings).map(function(category){
				return (
				<div
					className={'settingCategory' + (category === this.state.selected ? ' selected' : '')}
					key={category}>
						<h1 onClick={_.partial(this.handleSelect, category)}>{category}</h1>
						<div>{_.map(Settings.settings[category], this.renderSetting)}</div>
				</div>);
			}.bind(this))}
		</div>);
	}
});
