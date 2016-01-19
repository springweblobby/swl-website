'use strict'

require('style/Options.sass');
var _ = require('lodash');
var React = require('react');
var Reflux = require('reflux');
var Slider = require('comp/Slider.jsx');
var SelectBox = require('comp/SelectBox.jsx');

module.exports = React.createClass({
	displayName: 'Options',
	getInitialState: function(){
		return {
			selected: _.keys(this.props.settings)[0],
			defaultValues: {},
		};
	},
	componentWillMount: function(props){
		var defaults = {};
		_.forIn(this.props.settings, function(vals){
			_.extend(defaults, _.mapValues(vals, 'val'));
		}.bind(this));
		this.setState({ defaultValues: defaults });
	},
	handleSelect: function(category){
		this.setState({ selected: category });
	},
	handleChange: function(setting, key, evt){
		// We use the trigger() method directly to make sure the action is not
		// run async (which would cause the caret to jump to the end).
		if (setting.type === 'text' || setting.type === 'password' || setting.type === 'list')
			this.props.onChangeSetting(key, evt.target.value);
		else if (setting.type === 'bool')
			this.props.onChangeSetting(key, evt.target.checked);
		else if (setting.type === 'select' || setting.type === 'float' && !evt.target)
			this.props.onChangeSetting(key, evt);
		else if (setting.type === 'int' && evt.target.value.match(/^-?[0-9]+$/))
			this.props.onChangeSetting(key, parseInt(evt.target.value));
		else if (setting.type === 'unsigned' && evt.target.value.match(/^[0-9]+$/))
			this.props.onChangeSetting(key, parseInt(evt.target.value));
		else if (setting.type === 'float' && evt.target.value.match(/^-?[0-9]+([.,][0-9]+)?$/))
			this.props.onChangeSetting(key, parseFloat(evt.target.value));
		else if (setting.type === 'float' && evt.target.value[evt.target.value.length - 1] === '.')
			this.props.onChangeSetting(key, parseFloat(evt.target.value + '0'));
		else if ((setting.type === 'int' || setting.type === 'float') && evt.target.value === '')
			this.props.onChangeSetting(key, null);
	},
	renderControl: function(s, key){
		var val;
		if (key in this.props.values)
			val = this.props.values[key];
		else
			val = this.state.defaultValues[key];

		switch (s.type){

		case 'text':
			return <input type="text" value={val} onChange={_.partial(this.handleChange, s, key)} />;
		case 'int':
		case 'unsigned':
			return <input type="text" value={val === null ? '' : val.toFixed(0)} onChange={_.partial(this.handleChange, s, key)} />;
		case 'float':
			if ('min' in s && 'max' in s && 'step' in s)
				return <Slider onChange={_.partial(this.handleChange, s, key)} value={val} minValue={s.min} maxValue={s.max} step={s.step} />
			else
				return <input type="text" value={val === null ? '' : val.toFixed(2)} onChange={_.partial(this.handleChange, s, key)} />;
		case 'password':
			return <input type="password" value={val} onChange={_.partial(this.handleChange, s, key)} />;
		case 'bool':
			if (typeof val === 'string') // blame the lobby protocol
				val = val === '1';
			return <input type="checkbox" checked={val} onChange={_.partial(this.handleChange, s, key)} />;
		case 'list':
			return <textarea onChange={_.partial(this.handleChange, s, key)} value={val} />
		case 'select':
			return <SelectBox onChange={_.partial(this.handleChange, s, key)} value={val}>
				{_.map(s.options, function(opt, key){
					return <div key={key}>{opt.name}</div>;
				})}
			</SelectBox>;
		}
	},
	renderSetting: function(s, key){
		return <label className="settingControl" key={key}>
			<div>{s.name}</div>
			<div>{this.renderControl(s, key)}</div>
			{s.desc && <div className="settingDescription">{s.desc}</div>}
		</label>;
	},
	render: function(){
		return <div className="settingList">
			{_.keys(this.props.settings).map(function(category){
				return <div
					className={'settingCategory' + (category === this.state.selected ? ' selected' : '')}
					key={category}>
						<h1 onClick={_.partial(this.handleSelect, category)}>{category}</h1>
						<div>{_.map(this.props.settings[category], this.renderSetting)}</div>
				</div>;
			}.bind(this))}
		</div>;
	}
});
