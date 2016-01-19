'use strict'

require('style/LobbySettings.sass');
var _ = require('lodash');
var React = require('react');
var Reflux = require('reflux');
var Settings = require('store/Settings.js');
var Options = require('comp/Options.jsx');
var SPM = require('comp/StorePropMixins.js');
var ModalWindow = require('comp/ModalWindow.jsx');
var setSetting = require('act/Settings.js').set;
var setSpringSetting = require('act/GameInfo.js').setSpringSetting;

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
			changedEngineSettings: {},
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
		this.setState(function(previousState, currentProps) {
			var changed = previousState.changedEngineSettings;
			changed[key] = value;
			return {changedEngineSettings: changed};
		});
	},
	handleSpringSettingsSave:function(){
		_.each(this.state.changedEngineSettings,function(v,k){
			setSpringSetting(k,v);
		});
		this.setState({
			showingEngineSettings: false,
			changedEngineSettings:{},
		});
	},
	render: function(){
		var keyVal = _.object(_.keys(this.state.springSettings),_.pluck(this.state.springSettings,'val'));
		_.extend(keyVal,this.state.changedEngineSettings);

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
				<div className="springSettings">
					<div className = "springSettingsList">
						<Options
							values={keyVal}
							settings={{'Engine':this.state.springSettings}}
							onChangeSetting={this.handleSpringSettingChange}
						/>
					</div>
					<button className='engineSettingsButton' onClick={this.handleSpringSettingsSave}>
						Save Settings
					</button>
				</div>
			</ModalWindow>}
		</div>;
	}
});



