///////////////////////////////////

// JS Spring Lobby Interface

// By CarRepairer

// License: GPL 2

///////////////////////////////////


define(
	'lwidgets/GameBots',
	[
		"dojo/_base/declare",
		
		'dojo/topic',
		
		'dojo/_base/array',
		'dojo/dom-construct',
		'dojo/dom-style',
		'dojo/dom-attr',
		'dojo/_base/lang',
        
		'lwidgets/User',
		
		'dojo/text!./templates/gamebots.html?' + cacheString,
		'dijit/_WidgetBase',
		'dijit/_TemplatedMixin',
		'dijit/_WidgetsInTemplateMixin',
		
		"dijit/form/Button",
		"dijit/form/DropDownButton",
		"dijit/form/TextBox",
		"dijit/form/Select",
		"dijit/ColorPalette",
		"dijit/Dialog",
		
		//extra
		'dojox/html/entities',
		
		
	],
	function(declare,
		topic,
		array, domConstruct, domStyle, domAttr, lang,
		User,
		
		template,
		WidgetBase, Templated, WidgetsInTemplate,
		
		Button,
		DropDownButton,
		TextBox,
		Select,
		ColorPalette,
		Dialog
		){
	return declare([ WidgetBase, Templated, WidgetsInTemplate ], {

	templateString : template,
	
	appletHandler: null, 
	gameIndex: null,
	
	users: null,
	
	botInfo: {},
    
    lastAiType: '',
	local: false,
	
	//constructor: function(/* Object */args){
	postCreate: function(){
		var botCount, botInfoCount, botIndex, botInfoIndex, infoKey, infoType, info, curBotInfo, botName
		;
		
		//this.botInfo = {};
		this.botInfo = [];
		
		//declare.safeMixin(this, args);
		
		this.local = this.battleRoom.local; //after safeMixin
		
		this.botInfo = JSON.parse( localStorage.getItem('gamebots/' + this.battleRoom.game) );

		if( this.botInfo === null )
		{
			this.botInfo = [];

			botCount = this.battleRoom.getUnitsync().getSkirmishAICount();
			
			for( botIndex = 0; botIndex < botCount; botIndex++ )
			{
				botInfoCount = this.battleRoom.getUnitsync().getSkirmishAIInfoCount( botIndex );
				curBotInfo = {};
				botName = '';
				for( botInfoIndex = 0; botInfoIndex < botInfoCount; botInfoIndex++ )
				{
					infoKey = this.battleRoom.getUnitsync().getInfoKey( botInfoIndex );
					infoType = this.battleRoom.getUnitsync().getInfoType( botInfoIndex ); // "string", "integer", "float", "bool"
					if( infoType === 'string' )
					{
						info = this.battleRoom.getUnitsync().getInfoValueString( botInfoIndex );
						if(infoKey === 'shortName' )
						{
							botName = info;
						}
						curBotInfo[infoKey] = info;
					}
					else if( infoType === 'integer' )
					{
						info = this.battleRoom.getUnitsync().getInfoValueInteger( botInfoIndex );
						curBotInfo[infoKey] = info;
					}
					else if( infoType === 'float' )
					{
						info = this.battleRoom.getUnitsync().getInfoValueFloat( botInfoIndex );
						curBotInfo[infoKey] = info;
					}
					else if( infoType === 'bool' )
					{
						info = this.battleRoom.getUnitsync().getInfoValueBool( botInfoIndex );
						curBotInfo[infoKey] = info;
					}
				}
				if( botName !== '' )
				{
					//this.botInfo[botName] = curBotInfo;
					this.botInfo.push( curBotInfo );
				}
				
			localStorage.setItem('gamebots/' + this.battleRoom.game, JSON.stringify(this.botInfo));
			}
		}
		this.subscriptions = [];
		
	}, //constructor
	
	destroy: function()
	{
	},
	

	
	
	showDialog: function(team)
	{
		var options, teamOptions;
		var randomBotName;
		var randomBotNames;
		
		options = [];
		array.forEach(this.botInfo, function(curBotInfo){
			options.push( { label: curBotInfo.shortName, value: curBotInfo.shortName } );
		});
		this.aiSelect.set( 'options', options );
		if( this.lastAiType !== '' )
        {
        	this.aiSelect.set( 'value', options );
        }
		
		randomBotNames = [
			'Asimo',
			'Bender',
			'C-3PO',
			'Data',
			'Detriment',
			'Johnny5',
			'R2-D2',
			'R.O.B.',
			'Lore',
			'Marvin',
			'OptimusPrime'
		]
		randomBotName = randomBotNames[ Math.floor((Math.random() * randomBotNames.length )) ];
		
		this.botNameText.set( 'value', randomBotName );
		
		teamOptions = [];
		for(i=1; i<=16; i+=1)
		{
			teamOptions.push({ label: i, value: i+'' }) //dijit option values must be strings!
		}
		this.teamSelect.set( 'options', teamOptions )
        
		this.newBotDialog.show();

		
	}, //showDialog
	
	addButtonClick:function()
	{
		var smsg, botName, tempUser;
		botName = this.botNameText.get('value').trim();
		if( botName === '' )
		{
			alert2('Name your bot!');
			return;
		}
		if( this.users['<BOT>' + botName] )
		{
			alert2('There\'s already a bot named ' + botName + '!' );
			return;
		}
		this.lastAiType = this.aiSelect.get('value');
		
		tempUser = new User();
		tempUser.setStatusVals({
			allyNumber: parseInt( this.teamSelect.get('value') ) - 1,
			isSpectator: false,
			isReady: true,
			teamNumber: this.battleRoom.getEmptyTeam(botName),
			//'syncStatus':this.synced ? 'Synced' : 'Unsynced'
			syncStatus: 'Synced',
			
			name: botName,
			owner: this.battleRoom.nick, ai_dll: this.lastAiType, country: 'unknown'
		});
		
		
		tempUser.setTeamColor( this.colorChooser.get('value') );
		if( !this.local )
		{
			smsg = 'ADDBOT ' + botName + ' ' + tempUser.battleStatus + ' ' + tempUser.teamColor + ' ' + this.lastAiType;
			topic.publish( 'Lobby/rawmsg', {msg: smsg } );
		}
		else
		{
			tempUser.battleId = -1;
			this.battleRoom.users['<BOT>' + botName] = tempUser
			this.battleRoom.addPlayerByName( '<BOT>' + botName )
			tempUser.processBattleStatusAndColor();
			
		}
		this.newBotDialog.hide();
	},
	
	
	blank: null
}); }); //declare lwidgets.GameBots



