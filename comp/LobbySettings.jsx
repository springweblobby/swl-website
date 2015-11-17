'use strict'

var _ = require('lodash');
var React = require('react');
var Reflux = require('reflux');
var Settings = require('store/Settings.js');
var Options = require('comp/Options.jsx');
var SPM = require('comp/StorePropMixins.js');
var ModalWindow = require('comp/ModalWindow.jsx');
var setSetting = require('act/Settings.js').set;

module.exports = React.createClass({
	displayName: 'LobbySettings',
	mixins: [
		Reflux.listenTo(Settings, 'updateSetting'),
		SPM.connect('gameInfoStore', '', ['springSettings']),
	],
	getInitialState: function(){
		var settings = {};
		_(Settings.settings).map(_.keys).flatten().forEach(function(key){
			settings[key] = Settings[key];
		}).run();
		return {
			showingEngineSettings: false,
			settings: settings,
		};
	},
	updateSetting: function(key){
		var settings = _.clone(this.state.settings);
		settings[key] = Settings[key];
		this.setState({ settings: settings });
	},
	handleChange: function(key, value){
		// We use the trigger() method directly to make sure the action is not
		// run async (which would cause the caret to jump to the end).
		setSetting.trigger(key, value);
	},
	handleShowSpringSettings:function(show){
		this.setState({ showingEngineSettings: show });
	},
	handleSpringSettingChange:function(key, value){
		console.log("SpringSetting: set "+key+" to "+ value);
		this.gameInfo.setSpringSetting(key, value);
	},
	render: function(){
		return <div className="lobbySettings">
			<Options
				values={this.state.settings}
				settings={Settings.settings}
				onChangeSetting={this.handleChange}
			/>
			<div className="engineSettingsRow">
				<button 
					className='engineSettingsButton'
					onClick={_.partial(this.handleShowSpringSettings, true)}
					>Edit Engine Settings</button>
			</div>
			{this.state.showingEngineSettings && 
			<ModalWindow
				onClose={_.partial(this.handleShowSpringSettings, false)}
				title="Spring Engine Settings"
			>
				<div className = "springSettingsList">
					<Options
						values={{'Engine':this.state.springSettings}}
						settings={{'Engine':this.state.springSettings}}
						onChangeSetting={this.handleSpringSettingChange}
					/>
				</div>
			</ModalWindow>}
		</div>;
	}
});



