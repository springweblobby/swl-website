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
		'dojo/query',
		'dojo/topic',
		'dojo/on',
		'dojo/cookie',
		'dojo/io-query',

		'dijit/_WidgetBase',

		'dijit/form/Button',
		'dijit/form/Select',
		'dijit/form/DropDownButton',
		'dijit/form/CheckBox',
		'dijit/form/TextBox',
		'dijit/form/Textarea',
		'dijit/ColorPalette',
		'dijit/Dialog'
		
		// *** extras ***

	],
	function(declare,
		//dojo, dijit,
		array, domConstruct, domStyle, domAttr, lang,
		query, topic, on, cookie, ioQuery,
		WidgetBase,
		
		Button, Select, DropDownButton, CheckBox, TextBox, Textarea,
		
		ColorPalette,
		Dialog
		){
	return declare([ WidgetBase ], {

	'settings':null,
	'settingsControls':null,
	'fadedColor':'',
	'fadedTopicColor':'',
	'settingsInput':null,


	'buildRendering':function()
	{
		var setting, saveButton, loadButton, loadFileInput, settingsJson, rightDiv;
		var global;
		
		this.settings = {};
		this.settingsControls = {};

		global = addCSSRule('.messageDiv');
		global = addCSSRule('.topicDiv');
		global = addCSSRule('.topicAuthor');
		global = addCSSRule('.chatAlert');
		global = addCSSRule('.chatNick');
		global = addCSSRule('.chatAction');
		global = addCSSRule('.chatJoin');
		global = addCSSRule('.chatLeave');
		global = addCSSRule('.chatMine');
		//global = addCSSRule('.dijitBorderContainer-child');
		global = addCSSRule('.dijitContentPane');
		global = addCSSRule('.dijitTabContainer');
		
		
		/*
			string makes an input
			boolean makes a checkbox
	
			Special words:
	
			"Color" makes a color picker
			"List" makes a text area
			"Password" makes a password field
		*/
		this.settings = {
		
			'filters':{},

			'name':'',
			'password':'',

			'springSafeMode':false,
			'springPrefix':'',
			
			'showJoinsAndLeaves':true,
			'privateMessageSound':true,
			'nickHiliteSound':true,

			'autoJoinChannelsList':'main\nnewbies\nweblobby',
			'ignoreList':'',

			'mainTextColor':'#f2f2f2',
			'mainBackColor':'#272822',
			
			'headerTextColor':'#e6db74',
			'headerBackColor':'#4c4b3d',
			
			'alertColor':'#FF0000',
			'linkColor':'#17afb8',
			
			'chatActionColor':'#F92672',
			'chatJoinColor':'#a6e22e',
			'chatLeaveColor':'#66d9ef',
			
			/*
			'chatBorderColor':'',
			'chatBorderColor2':'',
			'chatBorderColor3':'',
			'chatBorderColor4':'',
			'splitterColor':'',
			'splitterHoverColor':'',
			*/
			
			'containerTextColor':'',
			'containerBackColor':'',

			'SelectedTabTextColor':'',
			'selectedTabBackColor':'',

			'buttonTextColor':'',
			'buttonBackColor':'',
			'buttonBackColor2':'',
			'buttonHiliteColor':'',

			'monospaceChatFont':false,

		};
		
		var urlVars
		var settingsFromUrl
		var urlMatch
		urlMatch = window.location.href.match(/\?(.*)/)
		if( urlMatch && urlMatch.length > 1 )
		{
			urlVars = ioQuery.queryToObject(urlMatch[1]);
			settingsFromUrl = urlVars.settings
			settingsFromUrl = eval( '(' + settingsFromUrl + ')' );
			//echo( settingsFromUrl )
			lang.mixin( this.settings, settingsFromUrl )
		}
		
		this.domNode = domConstruct.create('div', {} );

		for( settingKey in this.settings )
		{
			setting = this.settings[settingKey];
			this.addSettingControl(settingKey, setting);
			
			if( settingKey.search('Color') !== -1  )
			{
				global = addCSSRule('.' + settingKey);
			}

		}
		domConstruct.create('br', {}, this.domNode );

		rightDiv = domConstruct.create( 'div', { 'style':{ 'position':'absolute', 'top':'0px', 'left':'550px' } }, this.domNode );

		domConstruct.create('br', {}, rightDiv );

		saveButton = new Button({
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
		loadButton = new Button({
			'label':'Load Config From File',
			'onClick':lang.hitch(this, function(){

				var f = loadFileInput.files[0]
				if(f)
				{
					var r = new FileReader();
					r.onload = lang.hitch(this, function(e) {
						this.applySettings(e.target.result)
						cookie("settings", e.target.result, {expires:20 } );
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
		
		var springSettingsButton = new Button({
			'label':'Edit Spring Settings',
			'onClick':lang.hitch(this, 'springSettingsDialog')
		}).placeAt(rightDiv);

		settingsJson = cookie("settings");
		
		if(settingsJson)
		{
			cookie("settings", settingsJson, {expires:20 } );
			this.applySettings(settingsJson);
			// run a second time - this.applySettings triggers onchanges which ruin the cookie
			cookie("settings", settingsJson, {expires:20 } );
		}
		
		this.setChatStyle();

	}, //buildRendering
	
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
		engineSelect = new Select({
			'style':{'width':'160px'},
			'options': engineOptions,
		}).placeAt(dlgDiv)
		
		dlg = new Dialog({
            'title': "Edit Spring Settings",
            'style': "width: 300px",
			'content':dlgDiv
        });
		
		domConstruct.create('br',{}, dlgDiv )
		
		editButton = new Button({
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
	
	makeRgba:function(hexColor, alpha)
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

	'setChatStyle':function()
	{
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
		
		//global = getCSSRule('.dgrid-header');
		global = getCSSRule('.dgrid-header, .dgrid-header-row, .dgrid-footer');
		global.style.color=this.settings.headerTextColor;
		global.style.background=this.settings.headerBackColor;
		
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
		
		
		if( this.settings.SelectedTabTextColor !== '' || this.settings.selectedTabBackColor !== ''  )
		{
			global = getCSSRule('.claro .dijitTabChecked');
			global.style.color=this.settings.SelectedTabTextColor;
			global.style.background=this.settings.selectedTabBackColor;
		}
		
		
		/**/
		global = getCSSRule('.claro .dijitTabContainerTop-tabs .dijitTabChecked');
		global.style.background = '';
		global = getCSSRule('.claro .dijitTabContainerLeft-tabs .dijitTabChecked');
		global.style.background = '';
		/**/
		
		/**/
		if( this.settings.containerTextColor !== '' || this.settings.containerBackColor !== ''  )
		{
			global = getCSSRule('.claro .dijitTab');
			global.style.color=this.settings.containerTextColor;
			global.style.background=this.settings.containerBackColor;
			
			// .claro .dijitTabContainerTop-dijitContentPane, .claro .dijitTabContainerLeft-dijitContentPane, .claro .dijitTabContainerBottom-dijitContentPane, .claro .dijitTabContainerRight-dijitContentPane, .claro .dijitAccordionContainer-dijitContentPane
			global = getCSSRule('.claro .dijitTabContainerTop-dijitContentPane, .claro .dijitTabContainerLeft-dijitContentPane, .claro .dijitTabContainerBottom-dijitContentPane, .claro .dijitTabContainerRight-dijitContentPane, .claro .dijitAccordionContainer-dijitContentPane');
			global.style.color=this.settings.containerTextColor;
			global.style.background=this.settings.containerBackColor;
			/**/
			
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
			
		}
		if( this.settings.buttonTextColor !== ''
			&& this.settings.buttonBackColor !== ''
			&& this.settings.buttonBackColor2 !== ''
			&& this.settings.buttonHiliteColor !== ''
			)
		{
			//buttons
			global = getCSSRule('.claro .dijitButton .dijitButtonNode, .claro .dijitDropDownButton .dijitButtonNode, .claro .dijitComboButton .dijitButtonNode, .claro .dijitToggleButton .dijitButtonNode');
			global.style.color=this.settings.buttonTextColor;
			global.style.backgroundImage = 'linear-gradient('+this.settings.buttonBackColor+' 0px, '+this.settings.buttonBackColor2+' 100%)'

			global = getCSSRule('.claro .dijitButtonHover .dijitButtonNode, .claro .dijitDropDownButtonHover .dijitButtonNode, .claro .dijitComboButton .dijitButtonNodeHover, .claro .dijitComboButton .dijitDownArrowButtonHover, .claro .dijitToggleButtonHover .dijitButtonNode');
			global.style.backgroundColor = this.settings.buttonHiliteColor
			global.style.backgroundImage = 'linear-gradient('
				+ this.makeRgba( this.settings.buttonBackColor, 0.5 ) +' 0px, '
				+ this.makeRgba( this.settings.buttonBackColor2, 0.5 ) +' 100%)'
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
		
		
		
		//name
		
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
		cookie("settings", settingsJson, {expires:20 } );
	},


	'addSettingControl':function(name, val)
	{
		var control, type, cleanName, controlDiv, nameDiv, rowDiv, colorDiv, ddButton;
		var onChangeFunc, onChangeFuncColor;
		var label
		var clearButton
		if( typeof(val) === 'object' )
		{
			return;
		}

		cleanName = this.cleanupName(name);
		if( typeof(val) === 'boolean' )
		{
			label = domConstruct.create('label', {}, this.domNode );
			rowDiv = domConstruct.create('div', {'style':{'height':'40px' /*, 'position':'absolute' */} }, label );
		}
		else
		{
			rowDiv = domConstruct.create('div', {'style':{'height':'40px' /*, 'position':'absolute' */} }, this.domNode );
		}
		nameDiv = domConstruct.create('div', {'innerHTML': cleanName, 'style':{'position':'absolute' } }, rowDiv );
		
		controlDiv = domConstruct.create('div', {'style':{'position':'absolute', 'left':'200px', /*'height':'100%', */'width':'250px'} }, rowDiv );
		
		onChangeFunc = lang.hitch( this, function(val){
			this.settings[name] = val;
			this.saveSettingsToCookies();

			if( name.search('Font') !== -1 || name.search('Color') !== -1 )
			{
				topic.publish('SetChatStyle');
			}
		});

		if( typeof(val) === 'string' )
		{
			if( name.search('List') !== -1 )
			{
				control = new Textarea({'value':val, 'rows':4}).placeAt(controlDiv);
				domStyle.set( rowDiv, 'height', '100px')
			}
			else if( name.search('Color') !== -1 )
			{
				control = new ColorPalette( {} )
				
				ddButton = new DropDownButton({
					'label':'Choose Color...',
					'dropDown':control
				}).placeAt( controlDiv );
				
				clearButton = new Button({
					'label':'Reset',
					onClick:function()
					{
						control.set('value','')
					}
				}).placeAt( controlDiv );
				
				var colorBackDiv = domConstruct.create('div', {'innerHTML':'X',
					'style':{
						'position':'absolute', 'width':'20px','right':'2px', 'top':'2px', 'outline':'solid black 1px',
						color:'black',
						background:'white',
						textAlign:'center'
					}
				}, controlDiv);
				
				colorDiv = domConstruct.create('div', {
					//'innerHTML':'&nbsp;&nbsp;&nbsp;',
					'class':name,
					'style':{
						'position':'absolute', top:'0px', 'width':'100%','height':'100%',
						
					}
				}, colorBackDiv);

				//this.subscribe('SetChatStyle', function(){ domStyle.set(colorDiv, 'background', this.settings[name] ); } );
			}
			else
			{
				type = 'text';
				if( name.search('password') !== -1 )
				{
					type = 'password';
				}
				control = new TextBox({'value':val, 'size':'40', 'type':type}).placeAt( controlDiv );
			}
		}
		else if( typeof(val) === 'boolean' )
		{
			control = new CheckBox({ 'checked':val }).placeAt( controlDiv );
			control.set( 'checked', val )			
		}
		
		control.on('change', onChangeFunc );
		
		this.settingsControls[name] = control;
	},
	
	'setSetting':function(name, val)
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

	'blank':null
}); });//define
