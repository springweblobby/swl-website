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
		'dojo/Deferred',
        
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
		array, domConstruct, domStyle, domAttr, lang, Deferred,
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
	
	finishedDialog:false,
	loadedPromise: null,
	
	postCreate: function(){
		var botCount, botInfoCount, botIndex, botInfoIndex, infoKey, infoType, info, curBotInfo, botName, loadedDeferred;
		
		loadedDeferred = new Deferred();
		this.loadedPromise = loadedDeferred.promise;
		this.local = this.battleRoom.local;
		
		this.botInfo = JSON.parse( localStorage.getItem('gamebots/' + this.battleRoom.game) );
		this.botInfo = null;

		if( this.botInfo === null )
		{
			this.botInfo = [];

			this.getUnitsync().getSkirmishAICount().then(lang.hitch(this, function(botCount){

			var iterBotInfo = lang.hitch(this, function(botIdx, botInfoCount, botInfoIdx){
				if( botInfoIdx >= botInfoCount )
				{
					iterBots(botIdx + 1);
					return;
				}
				var key;
				var info = this.botInfo[this.botInfo.length - 1];
				var unitsync = this.getUnitsync();
				unitsync.getInfoKey(botInfoIdx).then(function(key_){
					key = key_;
					return unitsync.getInfoType(botInfoIdx);
				}).then(function(type){
					var put = function(val){
						info[key] = val;
						iterBotInfo(botIdx, botInfoCount, botInfoIdx + 1);
					};
					if( type === 'string' )
					{
						unitsync.getInfoValueString(botInfoIdx).then(put);
					}
					else if( infoType === 'integer' )
					{
						unitsync.getInfoValueInteger(botInfoIdx).then(put);
					}
					else if( infoType === 'float' )
					{
						unitsync.getInfoValueFloat(botInfoIdx).then(put);
					}
					else if( infoType === 'bool' )
					{
						unitsync.getInfoValueBool(botInfoIdx).then(put);
					}
				});	
			});
			var iterBots = lang.hitch(this, function(botIdx){
				if( botIdx >= botCount )
				{
					localStorage.setItem('gamebots/' + this.battleRoom.game, JSON.stringify(this.botInfo));
					loadedDeferred.resolve();
					return;
				}
				this.getUnitsync().getSkirmishAIInfoCount( botIdx ).then(lang.hitch(this, function(botInfoCount){
					this.botInfo.push({});
					iterBotInfo(botIdx, botInfoCount, 0);
				}));
			});
			iterBots(0);
			
			}));
		}
		else
		{
			loadedDeferred.resolve();
		}
		this.subscriptions = [];
		
	}, //constructor
	
	destroy: function()
	{
	},
	
	
	getUnitsync:function()
	{
		return this.battleRoom.getUnitsync();
	},

	showDialog: function(team)
	{
		var options, teamOptions;
		var randomBotName;
		var randomBotNames;
		
		if(!this.finishedDialog)
		{
			options = [];
			array.forEach(this.botInfo, lang.hitch(this, function(curBotInfo){
				if( this.battleRoom.game.match(/^Evolution/) )
				{
					if( curBotInfo.shortName.match(/(NullAI|Survival Spawner)/) )
					{
						options.push( { label: curBotInfo.shortName, value: curBotInfo.shortName } );
					}
				}
				else
				{
					options.push( { label: curBotInfo.shortName, value: curBotInfo.shortName } );
				}
			}));
			this.aiSelect.set( 'options', options );
			if( this.lastAiType !== '' )
			{
				this.aiSelect.set( 'value', options );
			}
			
			teamOptions = [];
			for(i=1; i<=16; i+=1)
			{
				teamOptions.push({ label: i+'', value: i+'' }) //dijit option values must be strings!
			}
			this.teamSelect.set( 'options', teamOptions );
			
			var factionName
			for( i=0; i<this.battleRoom.factions.length; i++ )
			{
				factionName = this.battleRoom.factions[i]
				this.factionSelect.addOption({ value: i+'',
					label: "<img src=" + this.battleRoom.factionIcons[factionName] + "> " + factionName })
			}
			
			
			this.finishedDialog = true;
		}
		this.teamSelect.set( 'value', ''+(parseInt( team )+1) );
		
		
		randomBotName = this.randomBotNames[ Math.floor((Math.random() * this.randomBotNames.length )) ];	
		this.botNameText.set( 'value', randomBotName );
		this.colorChooser.set( 'value', '#000000' );
		this.newBotDialog.show();

		
	}, //showDialog
	randomBotNames:[
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
		'OptimusPrime',
		'WALL-E',
		'Terminator',
		'V.I.K.I.',
		'RoboCop',
		'Startscream',
		'Megatron',
		'BigDog',
		'Skynet',
	],
	
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
			side: parseInt( this.factionSelect.get('value') ),
			
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



