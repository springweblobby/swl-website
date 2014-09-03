///////////////////////////////////

// JS Spring Lobby Interface

// By CarRepairer

// License: GPL 2

///////////////////////////////////



define(
	'lwidgets/LobbySettings',
	[
		"dojo/_base/declare",
		'dojo/_base/array',
		'dojo/dom-construct',
		'dojo/dom-style',
		'dojo/dom-attr',
		'dojo/_base/lang',
		'dojo/request/xhr',
		'dojo/query',
		'dojo/topic',
		'dojo/on',
		'dojo/cookie',
		'dojo/io-query',

		'dijit/_WidgetBase',
		'dijit/layout/AccordionContainer',
		'dijit/layout/ContentPane',

		'dijit/form/Button',
		'dijit/form/Select',
		'dijit/form/DropDownButton',
		'dijit/form/CheckBox',
		'dijit/form/TextBox',
		'dijit/form/Textarea',
		'dijit/ColorPalette',
		'dijit/Dialog',
		
		'lwidgets/SpringSettings'
		
		// *** extras ***

	],
	function(declare,
		//dojo, dijit,
		array, domConstruct, domStyle, domAttr, lang, xhr,
		query, topic, on, cookie, ioQuery,
		WidgetBase,
		
		AccordionContainer, ContentPane,
		
		Button, Select, DropDownButton, CheckBox, TextBox, Textarea,
		
		ColorPalette,
		Dialog,
		SpringSettings
		){
	return declare([ WidgetBase ], {

	settings: null,
	defaultSettings: {},
	settingsControls: null,
	fadedColor: '',
	fadedTopicColor: '',
	settingsInput: null,
	appletHandler: null,

	springSettingsEditButton: null,

	addCssRules: function()
	{
		global = addCSSRule('.messageDiv');
		global = addCSSRule('.topicDiv');
		global = addCSSRule('.topicAuthor');
		global = addCSSRule('.chatAlert');
		global = addCSSRule('.chatNick');
		global = addCSSRule('.chatAction');
		global = addCSSRule('.chatJoin');
		global = addCSSRule('.chatLeave');
		global = addCSSRule('.chatMine');
		for( var settingKey in this.settings )
		{
			if( settingKey.search('Color') !== -1  )
			{
				addCSSRule('.' + settingKey);
			}
		}
	},

	buildRendering: function()
	{
		var setting, saveButton, loadButton, loadFileInput, settingsJson, rightDiv, leftDiv ;
		var global;
		
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
		
			filters: {},

			name: '',
			password: '',
			autoConnect: false,
	
			lightSkin: false,
			snow: false,
			showJoinsAndLeaves: false,
			privateMessageSound: true,
			nickHiliteSound: true,
			roomJoinSound: true,
			joinSoundWhenRoomSmallerThan: '3',

			minimapsInBattleList: true,

			resolutionWidth: '',
			resolutionHeight: '',
			springSafeMode: false,
			
			autoJoinChannelsList: 'main\nnewbies\nweblobby',
			joinLanguageChannel: true,
			friendsList: '',
			ignoreList: '',
			chatLogSize: '500',
			autoSpecIfUnsynced: true,
			shareControl: false,

			mainTextColor: '#f2f2f2',
			mainBackColor: '#272822',
			
			headerTextColor: '#e6db74',
			headerBackColor: '#4c4b3d',
			
			alertColor: '#FF0000',
			linkColor: '#17afb8',
			
			chatActionColor: '#F92672',
			chatJoinColor: '#a6e22e',
			chatLeaveColor: '#66d9ef',
			
			containerTextColor: '',
			containerBackColor: '',

			SelectedTabTextColor: '',
			selectedTabBackColor: '',

			buttonTextColor: '',
			buttonBackColor: '',
			buttonHiliteColor: '',

			monospaceChatFont: false,
			
			springServer: 'lobby.springrts.com',
			springPrefix: '',
			
			//chatInputScript:'',
			//chatEventScript:'',
			eventScript:'',
		

		};
		
		this.categories = {
			Spring:[
				'resolutionWidth',
				'resolutionHeight',
				'springSafeMode',
				
			],
			Server:[
				'name',
				'password',
				'springServer',
				'autoConnect'
				
			],
			Chat:[
				
				'showJoinsAndLeaves',
				'autoJoinChannelsList',
				'friendsList',
				'ignoreList',
				'chatLogSize',
				'monospaceChatFont',
				'joinLanguageChannel',
				
			],
			Battles:[
				'minimapsInBattleList',
				'autoSpecIfUnsynced',
				'shareControl',
				
			],
			Sounds:[
				'privateMessageSound',
				'nickHiliteSound',
				'roomJoinSound',
				'joinSoundWhenRoomSmallerThan',
			],
			Colors:[
				
				'mainTextColor',
				'mainBackColor',
				
				'headerTextColor',
				'headerBackColor',
				
				'alertColor',
				'linkColor',
				
				'chatActionColor',
				'chatJoinColor',
				'chatLeaveColor',
				
				'containerTextColor',
				'containerBackColor',
	
				'SelectedTabTextColor',
				'selectedTabBackColor',
	
				'buttonTextColor',
				'buttonBackColor',
				'buttonHiliteColor',
			],
			Other:[
				
			],
			
			
		}

		this.addCssRules();
		
		var urlVars
		var settingsFromUrl
		var urlMatch
		urlMatch = window.location.href.match(/\?(.*)/)
		if( urlMatch && urlMatch.length > 1 )
		{
			urlVars = ioQuery.queryToObject(urlMatch[1]);
			settingsFromUrl = JSON.parse(urlVars.settings)
			// Evo steam release hotfix.
			delete settingsFromUrl.showJoinsAndLeaves;
			delete settingsFromUrl.chatLogSize;
			lang.mixin( this.settings, settingsFromUrl )
		}
		
		this.domNode = domConstruct.create('div', {} );
		
		leftDiv = domConstruct.create( 'div', { style: { position: 'absolute', top: '0px', left: '0px', padding:'10px', width:'550px', height:'100%'  } }, this.domNode );
		rightDiv = domConstruct.create( 'div', { style: { position: 'absolute', top: '0px', left: '580px', padding:'10px'  } }, this.domNode );
		
		domConstruct.create('h2', {innerHTML:'Web Lobby Settings'}, leftDiv );
		
		this.settingsAccordion = new AccordionContainer( {class: 'lobbySettings' } ).placeAt( leftDiv );
		this.settingsAccordion.startup();
		
		this.subscribe('ResizeNeeded', function(){
			setTimeout( function(thisObj){
				thisObj.resizeAlready();
			}, 400, this );
		} );
		
		this.panes = {}
		for(category in this.categories)
		{
			this.panes[category] = new ContentPane({
				title: category,
				//content: ""
			});
			
			this.settingsAccordion.addChild( this.panes[category] );
		}
		
		
		
		for( settingKey in this.settings )
		{
			setting = this.settings[settingKey];
			this.defaultSettings[settingKey] = setting;
			
			var pane = this.getPane(settingKey);
			
			this.addSettingControl(settingKey, setting, pane);
			
			if( settingKey.search('Color') !== -1  )
			{
				global = addCSSRule('.' + settingKey);
			}

		}
		
		//domConstruct.create('br', {}, this.domNode );

		
		domConstruct.create('h2', {innerHTML:'Engine Settings'}, rightDiv );

		//domConstruct.create('br', {}, rightDiv );

		/*
		saveButton = new Button({
			label: 'Save Config To File',
			onClick: lang.hitch(this, function(){
				var settingsJson, uriContent;
				settingsJson = JSON.stringify(this.settings);
				uriContent = "data:text/plain;charset=US-ASCII," + encodeURIComponent( settingsJson );
				//uriContent = "data:application/x-spring-game," + encodeURIComponent( this.scriptObj.getScript() );
				window.open(uriContent, 'settings.swlconfig');
			})
		}).placeAt(rightDiv);

		domConstruct.create('br', {}, rightDiv );
		domConstruct.create('br', {}, rightDiv );

		loadFileInput = domConstruct.create('input', {type: 'file'} );
		loadButton = new Button({
			label: 'Load Config From File',
			onClick: lang.hitch(this, function(){

				var f = loadFileInput.files[0]
				if(f)
				{
					var r = new FileReader();
					r.onload = lang.hitch(this, function(e) {
						this.applySettings(e.target.result)
						localStorage.setItem("settings", e.target.result);
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
		
		domConstruct.create('br', {}, rightDiv );
		domConstruct.create('br', {}, rightDiv );
		
		*/
		
		this.subscribe('SetChatStyle', 'setChatStyle');
		this.subscribe('Lobby/unitsyncRefreshed', 'unitsyncRefreshed' );

		
		var springSettingsButton = new Button({
			label: '<div style="width: 180px; padding-top:15px; padding-bottom:15px; ">Edit Spring Settings...</div>',
			onClick: lang.hitch(this, 'springSettingsDialog')
		}).placeAt(rightDiv);
		
		
		var button 
		domConstruct.create('h2', {innerHTML:'Tools'}, rightDiv );
		
		button = new Button({
			label: '<div style="width: 200px; ">Pastebin infolog.txt</div>',
			onClick: lang.hitch(this, function(){
				var log = this.appletHandler.applet.readFileLess( this.appletHandler.springHome + '/infolog.txt', 800 );
				if( log === '' )
				{
					alert("File not found or empty");
					return;
				}
				this.pastebin('Weblobby executable version: ' + domAttr.get(this.lobby.apiVersionSpan, 'innerHTML') +
					'\nspringHome: ' + this.appletHandler.springHome + '\ninfolog.txt:\n\n\n' + log);
			})
		}).placeAt(rightDiv);
		domConstruct.create('br',{}, rightDiv )
		button = new Button({
			label: '<div style="width: 200px; ">Pastebin weblobby.log</div>',
			onClick: lang.hitch(this, function(){
				var log = this.appletHandler.applet.readFileLess( this.appletHandler.springHome + '/weblobby/weblobby.log', 800 );
				if( log === '' )
				{
					alert("File not found or empty");
					return;
				}
				this.pastebin('Weblobby executable version: ' + domAttr.get(this.lobby.apiVersionSpan, 'innerHTML') +
					'\nspringHome: ' + this.appletHandler.springHome + '\nweblobby.log:\n\n\n' + log);
			})
		}).placeAt(rightDiv);
		domConstruct.create('br',{}, rightDiv )
		domConstruct.create('br',{}, rightDiv )

		button = new Button({
			label: '<div style="width: 200px; ">Join channels in auto-join list</div>',
			onClick: lang.hitch( this.lobby, 'joinAutoJoinChannels')
		}).placeAt(rightDiv);
		domConstruct.create('br',{}, rightDiv )
		button = new Button({
			label: '<div style="width: 200px; ">Test notification sound</div>',
			onClick: function(){ playSound('./sound/alert.mp3'); }
		}).placeAt(rightDiv);
		domConstruct.create('br',{}, rightDiv )
		button = new Button({
			label: '<div style="width: 200px; ">Test battleroom join sound</div>',
			onClick: function(){ playSound('./sound/4_tone_ding.mp3'); }
		}).placeAt(rightDiv);
		
		
		settingsJson = localStorage.getItem("settings");
		
		if(settingsJson)
		{
			this.applySettings(settingsJson);
			// this.applySettings triggers onchanges which ruin the cookie
			localStorage.setItem("settings", settingsJson);
		}
		
		this.setChatStyle();

		
		try // getApiVersion() is not defined on very old executables!
		{
			if( this.appletHandler.applet.getApiVersion() >= 100 )
			{
				var rowDiv = domConstruct.create('div', { class: 'settingRow' }, this.panes.Spring.domNode );
				domConstruct.create('div', { innerHTML: 'Current Spring Home', class: 'settingCell' }, rowDiv );
				domConstruct.create('div', { innerHTML: this.appletHandler.applet.getSpringHome(),
					class: 'settingCell valueLabel' }, rowDiv );
				rowDiv = domConstruct.create('div', { class: 'settingRow' }, this.panes.Spring.domNode );
				var nameDiv = domConstruct.create('div', {innerHTML: 'Spring Home', class: 'settingCell'  }, rowDiv );
				var controlDiv = domConstruct.create('div', { class: 'settingCell' }, rowDiv);
				var textBox = new TextBox({value: this.appletHandler.applet.readSpringHomeSetting(),
					size: '40', type: 'text' }).placeAt( controlDiv );
				textBox.on('change', lang.hitch(this, function(val){
					this.appletHandler.applet.writeSpringHomeSetting(val);
				}));
			}
		}
		catch(e) {}
	}, //buildRendering
	
	resizeAlready:function()
	{
		this.settingsAccordion.resize();
	},
	
	getPane:function(settingKey)
	{
		var categorySettings;
		for(category in this.categories)
		{
			categorySettings = this.categories[category];
			if( array.some( categorySettings, function(item){
				return item === settingKey;
			} ) )
			{
				return this.panes[category];
			}
		}
		return this.panes['Other'];
	},
	
	springSettingsDialog: function()
	{
		var dlg;
		var dlgDiv;
		var engineVersions
		var engineOptions
		
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
		engineOptions.reverse();
		
		domConstruct.create('span',{innerHTML: 'Engine '}, dlgDiv )
		engineSelect = new Select({
			style: {width: '160px'},
			options: engineOptions,
			onChange: lang.hitch(this, function(val){
				this.springSettingsEditButton.set('engineVersion', val);
				if( this.appletHandler.getUnitsync(val) === null )
				{
					this.springSettingsEditButton.set('disabled', true);
					this.springSettingsEditButton.set('label', 'Edit Settings (loading...)')		
				}
				else
				{
					this.springSettingsEditButton.set('disabled', false)
					this.springSettingsEditButton.set('label', 'Edit Settings')
				}
			})
		}).placeAt(dlgDiv)
		dropDownDontStealFocus(engineSelect);
		
		dlg = new Dialog({
            title: "Edit Spring Settings",
            style: "width: 300px",
			content: dlgDiv
        });
		
		domConstruct.create('br',{}, dlgDiv )
		
		this.springSettingsEditButton = new Button({
			label: 'Edit Settings (loading...)',
			engineVersion: engineOptions[0].value,
			disabled: true,
			onClick: lang.hitch(this, function(engineSelect){
				var version, springSettings;
				version = engineSelect.get('value');
				//this.appletHandler.startSpringSettings(version) 
				springSettings = new SpringSettings({
					appletHandler: this.appletHandler,
					version: version
				});
				this.springSettingsEditButton.set('disabled', true);
				springSettings.showDialog().then(lang.hitch(this, function(){
					this.springSettingsEditButton.set('disabled', false);
				}));
				//dlg.hide();
			}, engineSelect)
		}).placeAt(dlgDiv);
		//on(input, 'keyup', lang.hitch(this, 'passwordDialogKeyUp', battleId, input, dlg ) )
		
		engineSelect.onChange( engineSelect.get('value' ) )
		
		dlg.show();
	},
	
	unitsyncRefreshed: function(version)
	{
		if( this.springSettingsEditButton === null )
		{
			return;
		}
		if( this.springSettingsEditButton.engineVersion === version )
		{
			this.springSettingsEditButton.set('disabled', false)
			this.springSettingsEditButton.set('label', 'Edit Settings')
		}
	},

	applySettings: function(settingsStr)
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

	blendColors: function(col1, col2)
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
	
	makeRgba: function(hexColor, alpha)
	{
		var r1, g1, b1,
			r2, g2, b2,
			r3, g3, b3
			;
		r1 = '0x' + hexColor.slice(1,3);
		g1 = '0x' + hexColor.slice(3,5);
		b1 = '0x' + hexColor.slice(5,7);
		
		r1 = parseInt(r1, 16);
		g1 = parseInt(g1, 16);
		b1 = parseInt(b1, 16);
		
		return 'rgba( ' + r1 + ', '+ g1 +', '+ b1 +', '+alpha+' )'

	},

	setChatStyle: function()
	{
		// The High Fashion Comitee hereby bans the use of bright yellow background color.
		if( this.settings.mainBackColor === '#fefff1' && (this.settings.mainTextColor === '#000000' ||
			this.settings.mainTextColor === '#f2f2f2') )
		{
			this.settings.mainBackColor = '#272822';
			this.settings.mainTextColor = '#f2f2f2';
		}

		this.fadedColor = this.blendColors(this.settings.mainBackColor, this.settings.mainTextColor);
		this.fadedTopicColor = this.blendColors(this.settings.headerBackColor, this.settings.headerTextColor);
		
		//new way
		var global
		
		global = getCSSRule('.messageDiv');
		global.style.color=this.settings.mainTextColor;
		global.style.background=this.settings.mainBackColor;
		global.style['fontFamily']= this.settings.monospaceChatFont ? 'monospace' : 'sans-serif';
		
		global = getCSSRule('.dgrid-selected');
		global.style.color=this.settings.mainBackColor;
		global.style.background=this.settings.mainTextColor;
		
		global = getCSSRule('.dgrid');
		global.style.color=this.settings.mainTextColor;
		global.style.background=this.settings.mainBackColor;
		
		global = getCSSRule('.dgrid-header, .dgrid-header-row, .dgrid-footer');
		global.style.color=this.settings.headerTextColor;
		global.style.background=this.settings.headerBackColor;
		
		global = getCSSRule('.claro .dijitDialogTitleBar');
		global.style.color=this.settings.headerTextColor;
		global.style.backgroundColor=this.settings.headerBackColor;
		global.style.backgroundImage="linear-gradient(rgba(255, 255, 255, 0.7) 0%, rgba(255, 255, 255, 0) 100%)"
		
		global = getCSSRule('.claro .dijitSplitContainer-dijitContentPane, .claro .dijitBorderContainer-dijitContentPane');
		global.style.color=null
		global.style.background=null
		
		
		global = getCSSRule('.topicDiv');
		global.style.color=this.settings.headerTextColor;
		global.style.background=this.settings.headerBackColor;
		global.style['fontFamily']= this.settings.monospaceChatFont ? 'monospace' : 'sans-serif';
		
		global = getCSSRule('.topicAuthor');
		global.style.color=this.fadedTopicColor;
		
		global = getCSSRule('.chatAlert');
		global.style.color=this.settings.alertColor;
		
		global = getCSSRule('.chatNick');
		global.style.color=this.settings.linkColor;
		
		global = getCSSRule('.chatAction');
		global.style.color=this.settings.chatActionColor;
		
		global = getCSSRule('.chatJoin');
		global.style.color=this.settings.chatJoinColor;
		
		global = getCSSRule('.chatLeave');
		global.style.color=this.settings.chatLeaveColor;
		
		global = getCSSRule('.chatMine');
		global.style.color=this.fadedColor;
		
		global = getCSSRule('.dgrid-cell');
		global.style.borderColor = this.fadedColor;
		
		
		if( this.settings.SelectedTabTextColor !== '' || this.settings.selectedTabBackColor !== ''  )
		{
			global = getCSSRule('.claro .dijitTabChecked');
			global.style.color=this.settings.SelectedTabTextColor;
			global.style.background=this.settings.selectedTabBackColor;
		}
		
		
		global = getCSSRule('.claro .dijitTabContainerTop-tabs .dijitTabChecked');
		global.style.background = '';
		global = getCSSRule('.claro .dijitTabContainerLeft-tabs .dijitTabChecked');
		global.style.background = '';
		
		if( this.settings.containerTextColor !== '' || this.settings.containerBackColor !== ''  )
		{
			global = getCSSRule('.claro .dijitTab');
			global.style.color=this.settings.containerTextColor;
			global.style.background=this.settings.containerBackColor;
			
			global = getCSSRule('.claro .dijitTabContainerTop-dijitContentPane, .claro .dijitTabContainerLeft-dijitContentPane, .claro .dijitTabContainerBottom-dijitContentPane, .claro .dijitTabContainerRight-dijitContentPane, .claro .dijitAccordionContainer-dijitContentPane');
			global.style.color=this.settings.containerTextColor;
			global.style.background=this.settings.containerBackColor;
			
			global = getCSSRule('.claro .dijitBorderContainer');
			global.style.color=this.settings.containerTextColor;
			global.style.background=this.settings.containerBackColor;
			
			//dropdowns
			global = getCSSRule('.claro .dijitSelect, .claro .dijitSelect .dijitButtonContents, .claro .dijitTextBox, .claro .dijitTextBox .dijitButtonNode');
			global.style.color=this.settings.containerTextColor;
			global.style.background=this.settings.containerBackColor;
			
			//fix dijit textarea
			global = getCSSRule('.claro .dijitSelect, .claro .dijitTextBox');
			global.style.color='#000000';
			
			//dialog boxes
			global = getCSSRule('.claro .dijitDialogPaneContent');
			global.style.color=this.settings.containerTextColor;
			global.style.background=this.settings.containerBackColor;
			
		}
		if( this.settings.buttonTextColor !== ''
			&& this.settings.buttonBackColor !== ''
			&& this.settings.buttonHiliteColor !== ''
			)
		{
			//buttons
			global = getCSSRule('.claro .dijitButton .dijitButtonNode, .claro .dijitDropDownButton .dijitButtonNode, .claro .dijitComboButton .dijitButtonNode, .claro .dijitToggleButton .dijitButtonNode');
			global.style.color=this.settings.buttonTextColor;
			global.style.backgroundColor = this.settings.buttonBackColor
			
			global = getCSSRule('.claro .dijitButtonHover .dijitButtonNode, .claro .dijitDropDownButtonHover .dijitButtonNode, .claro .dijitComboButton .dijitButtonNodeHover, .claro .dijitComboButton .dijitDownArrowButtonHover, .claro .dijitToggleButtonHover .dijitButtonNode');
			global.style.color=this.settings.buttonTextColor;
			global.style.backgroundColor = this.settings.buttonHiliteColor
			
		}
		
		var settingKey
		for( settingKey in this.settings )
		{
			if( settingKey.search('Color') !== -1  )
			{
				global = getCSSRule('.' + settingKey);
				global.style.background=this.settings[settingKey];
			}
		}
		
	},

	cleanupName: function(name)
	{
		var newName
		newName = name;
		newName = newName.replace(/([A-Z])/g, ' $1' )
		newName = newName[0].toUpperCase() + newName.slice(1) + ' ';
		return newName;
	},

	saveSettingsToCookies: function()
	{
		var settingsJson;
		settingsJson = JSON.stringify(this.settings);
		localStorage.setItem("settings", settingsJson);
	},


	addSettingControl: function(name, val, pane)
	{
		var control, type, cleanName, controlDiv, nameDiv, rowDiv, colorDiv, ddButton;
		var onChangeFunc, onChangeFuncColor;
		var label
		var clearButton;
		var tempDiv;
		
		if( typeof(val) === 'object' )
		{
			return;
		}

		cleanName = this.cleanupName(name);
		rowDiv = domConstruct.create('div', { class: 'settingRow' }, pane.domNode );
		
		nameDiv = domConstruct.create('div', {innerHTML: cleanName, class: 'settingCell' }, rowDiv );
		
		controlDiv = domConstruct.create('div', {class: 'settingCell' }, rowDiv );
		
		onChangeFunc = lang.hitch( this, function(val){
			this.settings[name] = val;
			this.saveSettingsToCookies();

			if( name.search('Font') !== -1 || name.search('Color') !== -1 )
			{
				topic.publish('SetChatStyle');
			}
			else if( name === 'lightSkin' )
			{
				var cssUrl = this.settings.lightSkin ? "css/themes/claro/claro.css" : "css/themes/carbon/carbon.css";
				domConstruct.destroy("theme_css");
				var newCss = domConstruct.create('link', {
					id: "theme_css",
					href: cssUrl,
					rel: 'stylesheet',
					type: 'text/css',
					onload: lang.hitch(this, function(){
						this.addCssRules();
						topic.publish('SetChatStyle');
					})
				}, query("head")[0], 'first');
			}
			else if (name === 'snow')
			{
				if (this.settings.snow)
				{
					snowStorm.showresume()
				}
				else
				{
					snowStorm.stopfreeze()	
				}
				
			}
			// TODO: This is to force change the server address for everyone (issue #16). It should be removed later.
			else if( name === 'springServer' && this.settings.springServer === 'springrts.com' )
			{
				this.setSetting('springServer', 'lobby.springrts.com');
			}
		});

		if( typeof(val) === 'string' )
		{
			if( name.search('List') !== -1 || name.search('Script') !== -1 )
			{
				control = new Textarea({value: val, rows: 4}).placeAt(controlDiv);
			}
			else if( name.search('Color') !== -1 )
			{
				control = new ColorPalette( {} )
				
				tempDiv = domConstruct.create('div', {style: {
					position: 'relative',
					width: '250px'
				} }, controlDiv );
				
				ddButton = new DropDownButton({
					label: 'Choose Color...',
					dropDown: control
				}).placeAt( tempDiv );
				dropDownDontStealFocus(ddButton);
				
				clearButton = new Button({
					label: 'Reset',
					onClick: lang.hitch(this, function(){
						control.set( 'value', this.defaultSettings[name] );
					})
				}).placeAt( tempDiv );
				
				var colorBackDiv = domConstruct.create('div', {innerHTML: 'X',
					style: {
						position: 'absolute',
						width: '20px',right: '5px', top: '5px', outline: 'solid black 1px',
						color: 'black',
						background: 'white',
						textAlign: 'center'
					}
				}, tempDiv);
				
				colorDiv = domConstruct.create('div', {
					//'innerHTML':'&nbsp;&nbsp;&nbsp;',
					'class': name,
					style: {
						position: 'absolute',
						top: '0px',
						width: '100%',height: '100%',
					}
				}, colorBackDiv);
			}
			else
			{
				type = 'text';
				if( name.search('password') !== -1 )
				{
					type = 'password';
				}
				control = new TextBox({
					value: val,
					size: '40',
					type: type,
					intermediateChanges: true
				}).placeAt( controlDiv );
			}
		}
		else if( typeof(val) === 'boolean' )
		{
			control = new CheckBox({ checked: val }).placeAt( controlDiv );
			control.set( 'checked', val )			
		}
		
		control.on('change', onChangeFunc );
		
		this.settingsControls[name] = control;
	},
	
	setSetting: function(name, val)
	{
		var control;
		
		if( typeof(val) === 'object' )
		{
		}
		else if( typeof(val) === 'string' )
		{
			control = this.settingsControls[name]
			control.set('value', val);
		}
		else if( typeof(val) === 'boolean' )
		{
			control = this.settingsControls[name]
			control.set('checked', val);
		}
		this.settings[name] = val;
		this.saveSettingsToCookies();
	},

	isInList:function( field, listName )
	{
		var list = this.settings[listName].split('\n');
		return array.indexOf(list, field) !== -1;
	},
	setListSetting: function( field, value, listName )
	{
		var list;
		if(value)
		{
			this.setSetting( listName, this.settings[listName] + ('\n' + field) );
		}
		else
		{
			list = this.settings[listName].split('\n');
			list = array.filter( list, lang.hitch(this, function(curField){ return curField !== field } ) )
			this.setSetting( listName, list.join('\n') );
		}
	},

	pastebin: function( data )
	{
		if( this.pastebining ) // a defense mechanism against users clicking too much
			return;
		this.pastebining = true;
		var this_ = this;
		xhr.post('/paste.suphp', {
			hanldeAs: 'text',
			data: {
				text: data,
				'private': 1,
				name: this.lobby.settings.settings.name,
				expire: 60 * 24 * 30 // 1 month
			}
		}).then(function(data){
			alert('Copy and paste this link:\n<a href="' + data + '">' + data + '</a>' );
			this_.pastebining = false;
		}, function(errMsg){
			alert('Could not pastebin:\n' + errMsg);
			this_.pastebining = false;
		});
	},
	
}); });//define
