///////////////////////////////////

// JS Spring Lobby Interface

// By CarRepairer

// License: GPL 2

///////////////////////////////////


define(
	'lwidgets/GameBots',
	[
		"dojo/_base/declare",
		
		"dojo",
		"dijit",
		'dojo/topic',
		
		'dojo/_base/array',
		'dojo/dom-construct',
		'dojo/dom-style',
		'dojo/dom-attr',
		'dojo/_base/lang',
        
		'lwidgets/User',
		
		//extra
		'dojox/html/entities',
		
		"dijit/form/TextBox",
		"dijit/form/Select",
		"dijit/form/ToggleButton",
		"dijit/ColorPalette",
		
	],
	function(declare, dojo, dijit, topic,
		array, domConstruct, domStyle, domAttr, lang,
		User ){
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
		
		dojo.safeMixin(this, args);
		
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
		
		mainDiv = domConstruct.create('div', {'style':{'minWidth':'200px' }} );
		options = [];
		array.forEach(this.botInfo, function(curBotInfo){
			options.push( { label: curBotInfo.shortName, value: curBotInfo.shortName } );
		});
		curDiv = domConstruct.create( 'div', {'innerHTML': 'AI '}, mainDiv);
		aiSelect = new dijit.form.Select({
			'style':{'width':'150px' },
			'options':options,
		}).placeAt(curDiv);
        if( this.lastAiType !== '' )
        {
            aiSelect.set('value', this.lastAiType);
        }
		
		curDiv = domConstruct.create( 'div', {'innerHTML': 'Name '}, mainDiv);
		botNameText = new dijit.form.TextBox({
			
		}).placeAt(curDiv);
		
		domConstruct.create('span', {'innerHTML':'Team: '}, mainDiv)
        
		teamOptions = [];
		for(i=1; i<=16; i+=1)
		{
			teamOptions.push({ 'label':i, 'value':i+'' }) //dijit option values must be strings!
		}
		teamSelect = new dijit.form.Select({
			'value':(parseInt(team)+1)+'',
            'style':{'width':'50px'},
			'options':teamOptions
		}).placeAt(mainDiv);
        
        colorChooser = new dijit.ColorPalette({});
		colorChooserButton = new dijit.form.DropDownButton({
				'iconClass':'smallIcon colorsImage',
				'showLabel':false,
				'label':'Choose team color',
				'dropDown':colorChooser
		}).placeAt(mainDiv);
		
        domConstruct.create('br', {}, mainDiv );
        
		applyButton = new dijit.form.Button({
			'label':'Add',
			'onClick':lang.hitch(this, function(){
				var smsg, botName, tempUser;
				botName = botNameText.get('value').trim();
				if( botName === '' )
				{
					alert('Name your bot!');
					return;
				}
				if( this.users['<BOT>' + botName] )
				{
					alert('There\'s already a bot named ' + botName + '!' );
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
					this.battleRoom.addPlayer2( '<BOT>' + botName )
					tempUser.processBattleStatusAndColor();
					
				}
				dlg.hide();
			})
		}).placeAt(mainDiv);
		
		
		dlg = new dijit.Dialog({
			'title': 'Add An AI Bot',
			'content':mainDiv,
			//'onClose': lang.hitch(this, function(){
			'onHide': lang.hitch(this, function(){
				//dojo.destroy(dlg)
			})
		});
		dlg.startup();
		dlg.show();

		
	}, //showDialog
	
	
	
	'blank':null
}); }); //declare lwidgets.ModOptions



