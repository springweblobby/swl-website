///////////////////////////////////

// JS Spring Lobby Interface

// By CarRepairer

// License: GPL 2

///////////////////////////////////


define(
	'lwidgets/GameBots',
	[
		"dojo/_base/declare",
		
		//"dojo",
		//"dijit",
		'dojo/topic',
		
		'dojo/_base/array',
		'dojo/dom-construct',
		'dojo/dom-style',
		'dojo/dom-attr',
		'dojo/_base/lang',
        
		'lwidgets/User',
		
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
		//dojo, dijit,
		topic,
		array, domConstruct, domStyle, domAttr, lang,
		User,
		
		Button,
		DropDownButton,
		TextBox,
		Select,
		ColorPalette,
		Dialog
		){
	return declare([ ], {

	'appletHandler': null, 
	'gameIndex': null,
	
	'users':null,
	
	'botInfo':{},
    
    'lastAiType':'',
	'local':false,
	
	'constructor':function(/* Object */args){
		var botCount, botInfoCount, botIndex, botInfoIndex, infoKey, infoType, info, curBotInfo, botName
		;
		
		//this.botInfo = {};
		this.botInfo = [];
		
		declare.safeMixin(this, args);
		
		this.local = this.battleRoom.local; //after safeMixin
		
		//var listItemKey = this.battleRoom.getUnitsync().getOptionListItemKey(i, j);
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
			
		}
		this.subscriptions = [];
		
	}, //constructor
	
	'destroy':function()
	{
	},
	

	
	
	'showDialog':function(team)
	{
		var dlg, mainDiv, curDiv, applyButton, aiSelect, options, botNameText, teamOptions, teamSelect;
		var randomBotName;
		var randomBotNames;
		
		mainDiv = domConstruct.create('div', {'style':{'minWidth':'200px' }} );
		options = [];
		array.forEach(this.botInfo, function(curBotInfo){
			options.push( { label: curBotInfo.shortName, value: curBotInfo.shortName } );
		});
		curDiv = domConstruct.create( 'div', {'innerHTML': 'AI '}, mainDiv);
		aiSelect = new Select({
			'style':{'width':'150px' },
			'options':options,
		}).placeAt(curDiv);
        if( this.lastAiType !== '' )
        {
            aiSelect.set('value', this.lastAiType);
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
		curDiv = domConstruct.create( 'div', {'innerHTML': 'Name '}, mainDiv);
		botNameText = new TextBox({
			'value':randomBotName
		}).placeAt(curDiv);
		
		domConstruct.create('span', {'innerHTML':'Team: '}, mainDiv)
        
		teamOptions = [];
		for(i=1; i<=16; i+=1)
		{
			teamOptions.push({ 'label':i, 'value':i+'' }) //dijit option values must be strings!
		}
		teamSelect = new Select({
			'value':(parseInt(team)+1)+'',
            'style':{'width':'50px'},
			'options':teamOptions
		}).placeAt(mainDiv);
        
        colorChooser = new ColorPalette({'value':'#000000'});
		colorChooserButton = new DropDownButton({
				'iconClass':'smallIcon colorsImage',
				'showLabel':false,
				'label':'Choose team color',
				'dropDown':colorChooser
		}).placeAt(mainDiv);
		
        domConstruct.create('br', {}, mainDiv );
        
		applyButton = new Button({
			'label':'Add',
			'onClick':lang.hitch(this, function(){
				var smsg, botName, tempUser;
				botName = botNameText.get('value').trim();
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
				this.lastAiType = aiSelect.get('value');
				
                tempUser = new User();
                tempUser.setStatusVals({
					'allyNumber':parseInt( teamSelect.get('value') ) - 1,
					'isSpectator':false,
					'isReady':true,
					'teamNumber':this.battleRoom.getEmptyTeam(botName),
					//'syncStatus':this.synced ? 'Synced' : 'Unsynced'
					'syncStatus':'Synced',
					
					'name':botName,
					'owner':this.battleRoom.nick, 'ai_dll':this.lastAiType, 'country':'unknown'
				});
                
                
                tempUser.setTeamColor( colorChooser.get('value') );
				if( !this.local )
				{
					smsg = 'ADDBOT ' + botName + ' ' + tempUser.battleStatus + ' ' + tempUser.teamColor + ' ' + this.lastAiType;
					topic.publish( 'Lobby/rawmsg', {'msg':smsg } );
				}
				else
				{
					
					tempUser.battleId = -1;
					this.battleRoom.users['<BOT>' + botName] = tempUser
					this.battleRoom.addPlayerByName( '<BOT>' + botName )
					tempUser.processBattleStatusAndColor();
					
				}
				dlg.hide();
			})
		}).placeAt(mainDiv);
		
		
		dlg = new Dialog({
			'title': 'Add An AI Bot',
			'content':mainDiv,
			//'onClose': lang.hitch(this, function(){
			/*
			'onHide': lang.hitch(this, function(){
				//dojo .destroy(dlg)
			})
			*/
		});
		dlg.startup();
		dlg.show();

		
	}, //showDialog
	
	
	
	'blank':null
}); }); //declare lwidgets.ModOptions



