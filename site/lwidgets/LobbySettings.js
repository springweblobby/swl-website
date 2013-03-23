///////////////////////////////////

// JS Spring Lobby Interface

// By CarRepairer

// License: GPL 2

///////////////////////////////////



define(
	'lwidgets/LobbySettings',
	[
		"dojo/_base/declare",

		"dojo",
		"dijit",
				
		'dojo/_base/array',
		'dojo/dom-construct',
		'dojo/dom-style',
		'dojo/dom-attr',
		'dojo/_base/lang',
		'dojo/query',
		'dojo/topic',
		'dojo/on',
		

		'dijit/_WidgetBase',

		// *** extras ***

		'dijit/ColorPalette',
		'dijit/form/DropDownButton',
		'dojo/cookie',
		'dijit/Dialog'

	],
	function(declare, dojo, dijit,
		array, domConstruct, domStyle, domAttr, lang,
		query, topic, on,
		WidgetBase ){
	return declare([ WidgetBase ], {

	'settings':null,
	'settingsControls':null,
	'fadedColor':'',
	'fadedTopicColor':'',
	'settingsInput':null,


	'buildRendering':function()
	{
		var setting, saveButton, loadButton, loadFileInput, settingsJson, rightDiv;

		this.settings = {};
		this.settingsControls = {};


		/*
		 string makes an input
		 boolean makes a checkbox

		 Special words:

		 "Color" makes a color picker
		 "List" makes a text area
		 "Password" makes a password field
		*/
		this.settings = {

			'name':'',
			'password':'',

			'showJoinsAndLeaves':true,

			'autoJoinChannelsList':'main\nnewbies\nweblobby',

			//Midknight's
			'chatTextColor':'#f2f2f2',
			'chatActionColor':'#F92672',
			'chatJoinColor':'#a6e22e',
			'chatLeaveColor':'#66d9ef',
			'chatBackColor':'#272822',
			'topicBackColor':'#4c4b3d',
			'topicTextColor':'#e6db74',


			'chatNickColor':'#17afb8',
			'chatBorderColor':'',
			'chatBorderColor2':'',

			'monoSpaceFont':false,

		};

		this.domNode = domConstruct.create('div', {} );

		for( settingKey in this.settings )
		{
			setting = this.settings[settingKey];
			this.addSettingControl(settingKey, setting);
		}
		domConstruct.create('br', {}, this.domNode );

		rightDiv = domConstruct.create( 'div', { 'style':{ 'position':'absolute', 'top':'0px', 'left':'550px' } }, this.domNode );

		domConstruct.create('br', {}, rightDiv );

		saveButton = new dijit.form.Button({
			'label':'Save Config To File',
			'onClick':lang.hitch(this, function(){
				var settingsJson, uriContent;
				settingsJson = JSON.stringify(this.settings);
				uriContent = "data:text/plain;charset=US-ASCII," + encodeURIComponent( settingsJson );
				//uriContent = "data:application/x-spring-game," + encodeURIComponent( this.scriptObj.getScript() );
				window.open(uriContent, 'settings.swlconfig');
			})
		}).placeAt(rightDiv);

		domConstruct.create('br', {}, rightDiv );
		domConstruct.create('br', {}, rightDiv );

		loadFileInput = domConstruct.create('input', {'type':'file'} );
		loadButton = new dijit.form.Button({
			'label':'Load Config From File',
			'onClick':lang.hitch(this, function(){

				var f = loadFileInput.files[0]
				if(f)
				{
					var r = new FileReader();
					r.onload = lang.hitch(this, function(e) {
						this.applySettings(e.target.result)
						dojo.cookie("settings", e.target.result, 20);
						alert2("Your settings have been loaded.");
					})
					r.readAsText(f);
				}
				else
				{
					alert2("Failed to load file");
				}
			})
		}).placeAt(rightDiv);
		domConstruct.place( loadFileInput, rightDiv );
		this.subscribe('SetChatStyle', 'setChatStyle');

		domConstruct.create('br', {}, rightDiv );
		domConstruct.create('br', {}, rightDiv );
		
		var springSettingsButton = new dijit.form.Button({
			'label':'Edit Spring Settings',
			'onClick':lang.hitch(this, 'springSettingsDialog')
		}).placeAt(rightDiv);

		settingsJson = dojo.cookie("settings");
		
		if(settingsJson)
		{
			dojo.cookie("settings", settingsJson, 20);
			this.applySettings(settingsJson)
			dojo.cookie("settings", settingsJson, 20); //run a second time - this.applySettings triggers onchanges which ruin the cookie
		}

	},
	
	'springSettingsDialog':function()
	{
		var dlg;
		var dlgDiv;
		var engineVersions
		var engineOptions
		var editButton
		
		dlgDiv = domConstruct.create('div', {});
		engineVersions = this.appletHandler.getEngineVersions()
		if( engineVersions.length === 0 )
		{
			alert2('You do not have any version of the engine. You can log onto the multi player server and it will download an engine for you.')
			return;
		}
		engineOptions = [];
		array.forEach( engineVersions, function(engineVersion){
			engineOptions.push( { label: engineVersion, value: engineVersion} )
		});
		
		
		domConstruct.create('span',{'innerHTML':'Engine '}, dlgDiv )
		engineSelect = new dijit.form.Select({
			'style':{'width':'160px'},
			'options': engineOptions,
		}).placeAt(dlgDiv)
		
		dlg = new dijit.Dialog({
            'title': "Edit Spring Settings",
            'style': "width: 300px",
			'content':dlgDiv
        });
		
		domConstruct.create('br',{}, dlgDiv )
		
		editButton = new dijit.form.Button({
			'label':'Edit Settings',
			'onClick':lang.hitch(this, function(engineSelect){
				var version;
				version = engineSelect.get('value');
				this.appletHandler.startSpringSettings(version) 
				//dlg.hide();
			}, engineSelect)
		}).placeAt(dlgDiv);
		//on(input, 'keyup', lang.hitch(this, 'passwordDialogKeyUp', battleId, input, dlg ) )
		
		dlg.show();
	},

	'applySettings':function(settingsStr)
	{
		var settings, key, value;
		settings = eval( '(' + settingsStr + ')' );
		for( key in settings )
		{
			if( this.settings.hasOwnProperty(key) )
			{
				value = settings[key];
				this.setSetting(key, value);
			}
		}
		topic.publish('SetChatStyle');
	},

	'blendColors':function(col1, col2)
	{
		var r1, g1, b1,
			r2, g2, b2,
			r3, g3, b3
			;
		r1 = '0x' + col1.slice(1,3);
		g1 = '0x' + col1.slice(3,5);
		b1 = '0x' + col1.slice(5,7);

		r2 = '0x' + col2.slice(1,3);
		g2 = '0x' + col2.slice(3,5);
		b2 = '0x' + col2.slice(5,7);

		r1 = parseInt(r1, 16);
		g1 = parseInt(g1, 16);
		b1 = parseInt(b1, 16);

		r2 = parseInt(r2, 16);
		g2 = parseInt(g2, 16);
		b2 = parseInt(b2, 16);

		r3 = new Number( Math.round((r1 + r2) / 2 ));
		g3 = new Number( Math.round((g1 + g2) / 2 ));
		b3 = new Number( Math.round((b1 + b2) / 2 ));

		r3 = r3.toString(16);
		g3 = g3.toString(16);
		b3 = b3.toString(16);

		return '#' + r3 + g3 + b3;

	},

	'setChatStyle':function()
	{
		this.fadedColor = this.blendColors(this.settings.chatBackColor, this.settings.chatTextColor);
		this.fadedTopicColor = this.blendColors(this.settings.topicBackColor, this.settings.topicTextColor);

		query('.topicDiv').style('color', this.settings.topicTextColor);
		query('.topicDiv').style('background', this.settings.topicBackColor);
		query('.topicAuthor').style('color', this.fadedTopicColor);

		query('.messageDiv').style('color', this.settings.chatTextColor);
		query('.messageDiv').style('background', this.settings.chatBackColor);

		query('.textInput').style('color', this.settings.chatTextColor);
		query('.textInput').style('background', this.settings.chatBackColor);

		query('.playerListSelect').style('color', this.settings.chatTextColor);
		query('.playerListSelect').style('background', this.settings.chatBackColor);

		query('.chatNick').style('color', this.settings.chatNickColor);

		query('.battleInfoDiv').style('color', this.settings.chatBorderColor);
		query('.battleInfoDiv').style('background', this.settings.chatBorderColor);
		query('.inputDiv').style('background', this.settings.chatBorderColor);
		query('.chatAction').style('color', this.settings.chatActionColor);
		query('.mainContainer').style('background', this.settings.chatBorderColor2);

		query('.chatJoin').style('color', this.settings.chatJoinColor);
		query('.chatLeave').style('color', this.settings.chatLeaveColor);

		query('.chatMine').style('color', this.fadedColor);

		query('.topicDiv,.messageDiv').style('fontFamily', this.settings.monoSpaceFont ? 'monospace' : 'sans-serif' );

		/*
		query('.chatJoin').style('display', this.settings.showJoinsAndLeaves ? 'block' : 'none' );
		query('.chatLeave').style('display', this.settings.showJoinsAndLeaves ? 'block' : 'none'  );
		*/

	},

	'cleanupName':function(name)
	{
		var newName
		newName = name;
		newName = newName.replace(/([A-Z])/g, ' $1' )
		newName = newName[0].toUpperCase() + newName.slice(1) + ' ';
		return newName;
	},

	'saveSettingsToCookies':function()
	{
		var settingsJson;
		settingsJson = JSON.stringify(this.settings);
		dojo.cookie("settings", settingsJson, 20);
	},


	'addSettingControl':function(name, val)
	{
		var control, type, cleanName, controlDiv, nameDiv, rowDiv, colorDiv, ddButton;

		cleanName = this.cleanupName(name);
		rowDiv = domConstruct.create('div', {'style':{'height':'40px' /*, 'position':'absolute' */} }, this.domNode );
		nameDiv = domConstruct.create('div', {'innerHTML': cleanName, 'style':{'position':'absolute' } }, rowDiv );
		controlDiv = domConstruct.create('div', {'style':{'position':'absolute', 'left':'200px', /*'height':'100%', */'width':'200px'} }, rowDiv );
		var onChangeFunc = lang.hitch( this, function(e){
			var val, controlType;
			controlType = e.target.type;
			val = e.target.value;
			if( controlType === 'text' || controlType === 'password' || controlType === 'textarea' )
			{
				val = e.target.value;
			}
			else //( controlType === 'checkbox' )
			{
				val = e.target.checked;
			}

			this.settings[name] = val;
			this.saveSettingsToCookies();

			if( name.search('Font') !== -1 )
			{
				topic.publish('SetChatStyle');
			}
		});

		var onChangeFuncColor = lang.hitch( this, function(val){
			this.settings[name] = val;
			topic.publish('SetChatStyle');
			this.saveSettingsToCookies();
		});

		if( typeof(val) === 'object' )
		{
			/*
			control = new dijit.form.Select({
				'label':'something',
				'options':val
			}).placeAt( controlDiv );
			dojo.connect(control, 'onChange', lang.hitch( this, onChangeFunc ));
			*/
		}
		else if( typeof(val) === 'string' )
		{
			if( name.search('List') !== -1 )
			{
				control = domConstruct.create('textarea', {'innerHTML':val, 'rows':4}, controlDiv)
				//dojo.connect(control, 'onchange', onChangeFunc );
				on(control, 'change', onChangeFunc );

				domStyle.set( rowDiv, 'height', '100px')
			}
			else if( name.search('Color') !== -1 )
			{
				control = new dijit.ColorPalette( {} )
				ddButton = new dijit.form.DropDownButton({
					'label':'Choose Color...',
					'dropDown':control
				}).placeAt( controlDiv );
				
				dojo.connect(control, 'onChange', onChangeFuncColor );
				//control.own( on('Change', onChangeFuncColor ) );
				

				colorDiv = domConstruct.create('div', {'innerHTML':'&nbsp;&nbsp;&nbsp;', 'style':{'position':'absolute', 'width':'20px','right':'2px', 'top':'2px', 'outline':'solid black 1px' } }, controlDiv);

				this.subscribe('SetChatStyle', function(){ domStyle.set(colorDiv, 'background', this.settings[name] ); } );
			}
			else
			{
				type = 'text';
				if( name.search('password') !== -1 )
				{
					type = 'password';
				}
				control = domConstruct.create('input', {'type':type, 'value':val, 'size':'40'}, controlDiv );
				dojo.connect(control, 'onchange', onChangeFunc );
			}
		}
		else if( typeof(val) === 'boolean' )
		{
			control = domConstruct.create('input', {'type':'checkbox', 'checked':val}, controlDiv );
			dojo.connect(control, 'onchange', onChangeFunc );
		}
		this.settingsControls[name] = control;

	},
	'setSetting':function(name, val)
	{
		var control;
		control = this.settingsControls[name]
		if( typeof(val) === 'object' )
		{

		}
		else if( typeof(val) === 'string' )
		{
			if( name.search('List') !== -1 )
			{
				domAttr.set(control, 'value', val);
			}
			else if( name.search('Color') !== -1 )
			{
				control.set('value', val);
			}
			else
			{
				domAttr.set(control, 'value', val);
			}
		}
		else if( typeof(val) === 'boolean' )
		{
			domAttr.set(control, 'checked', val);
		}
		this.settings[name] = val;
		this.saveSettingsToCookies();
	},

	'blank':null
}); });//define
