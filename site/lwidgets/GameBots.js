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
        
		'lwidgets/User',
		
		//extra
		'dojox/html/entities',
		
		"dijit/form/TextBox",
		"dijit/form/Select",
		"dijit/form/ToggleButton",
		"dijit/ColorPalette",
		
	],
	function(declare, dojo, dijit, topic, User ){
	return declare([ ], {

	'appletHandler': null, 
	'gameIndex': null,
	
	'users':null,
	
	'botInfo':{},
    
    'lastAiType':'',
	
	'constructor':function(/* Object */args){
		var botCount, botInfoCount, botIndex, botInfoIndex, infoKey, infoType, info, curBotInfo, botName
		;
		
		//this.botInfo = {};
		this.botInfo = [];
		
		dojo.safeMixin(this, args);
		//var listItemKey = this.appletHandler.getUnitsync().getOptionListItemKey(i, j);
		botCount = this.appletHandler.getUnitsync().getSkirmishAICount();
		
		for( botIndex = 0; botIndex < botCount; botIndex++ )
		{
			botInfoCount = this.appletHandler.getUnitsync().getSkirmishAIInfoCount( botIndex );
			curBotInfo = {};
			botName = '';
			for( botInfoIndex = 0; botInfoIndex < botInfoCount; botInfoIndex++ )
			{
				infoKey = this.appletHandler.getUnitsync().getInfoKey( botInfoIndex );
				infoType = this.appletHandler.getUnitsync().getInfoType( botInfoIndex ); // "string", "integer", "float", "bool"
				if( infoType === 'string' )
				{
					info = this.appletHandler.getUnitsync().getInfoValueString( botInfoIndex );
					if(infoKey === 'shortName' )
					{
						botName = info;
					}
					curBotInfo[infoKey] = info;
				}
				else if( infoType === 'integer' )
				{
					info = this.appletHandler.getUnitsync().getInfoValueInteger( botInfoIndex );
					curBotInfo[infoKey] = info;
				}
				else if( infoType === 'float' )
				{
					info = this.appletHandler.getUnitsync().getInfoValueFloat( botInfoIndex );
					curBotInfo[infoKey] = info;
				}
				else if( infoType === 'bool' )
				{
					info = this.appletHandler.getUnitsync().getInfoValueBool( botInfoIndex );
					curBotInfo[infoKey] = info;
				}
			}
			if( botName !== '' )
			{
				//this.botInfo[botName] = curBotInfo;
				this.botInfo.push( curBotInfo );
			}
			
		}
		//console.log(this.botInfo)
		
		
		this.subscriptions = [];
		/*
		handle = dojo.subscribe('Lobby/battle/removeBot', this, 'removeBot' );
		this.subscriptions.push(handle);
		*/
		
	}, //constructor
	
	'destroy':function()
	{
		/*
		dojo.forEach(this.subscriptions, function(subscription){
			subscription.remove(); //not working!
		});
		*/
	},
	

	
	
	'showDialog':function(team)
	{
		var dlg, mainDiv, curDiv, applyButton, aiSelect, options, botNameText, teamOptions, teamSelect;
		
		mainDiv = dojo.create('div', {'style':{'minWidth':'200px' }} );
		options = [];
		dojo.forEach(this.botInfo, function(curBotInfo){
			options.push( { label: curBotInfo.shortName, value: curBotInfo.shortName } );
		});
		curDiv = dojo.create( 'div', {'innerHTML': 'AI '}, mainDiv);
		aiSelect = new dijit.form.Select({
			'style':{'width':'150px' },
			'options':options,
		}).placeAt(curDiv);
        if( this.lastAiType !== '' )
        {
            aiSelect.set('value', this.lastAiType);
        }
		
		curDiv = dojo.create( 'div', {'innerHTML': 'Name '}, mainDiv);
		botNameText = new dijit.form.TextBox({
			
		}).placeAt(curDiv);
		
		dojo.create('span', {'innerHTML':'Team: '}, mainDiv)
        
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
		
        dojo.create('br', {}, mainDiv );
        
		applyButton = new dijit.form.Button({
			'label':'Add',
			'onClick':dojo.hitch(this, function(){
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
                tempUser = new User();
                tempUser.setStatusVals({
					'allyNumber':parseInt( teamSelect.get('value') ) - 1,
					'isSpectator':false,
					'isReady':true,
					'teamNumber':this.battleRoom.getEmptyTeam(botName),
					//'syncStatus':this.synced ? 'Synced' : 'Unsynced'
					'syncStatus':'Synced'
				});
                
                this.lastAiType = aiSelect.get('value')
                
                tempUser.setTeamColor( colorChooser.get('value') );
				smsg = 'ADDBOT ' + botName + ' ' + tempUser.battleStatus + ' ' + tempUser.teamColor + ' ' + this.lastAiType;
				dojo.publish( 'Lobby/rawmsg', [{'msg':smsg }] );
				dlg.hide();
			})
		}).placeAt(mainDiv);
		
		
		dlg = new dijit.Dialog({
			'title': 'Add An AI Bot',
			'content':mainDiv,
			//'onClose': dojo.hitch(this, function(){
			'onHide': dojo.hitch(this, function(){
				dojo.destroy(dlg)
			})
		});
		dlg.startup();
		dlg.show();
		
		/*
		var ubs = new UserBattleStatus();
		ubs.SyncStatus = SyncStatuses.Synced;
		ubs.TeamColor = slot.Color;
		ubs.AllyNumber = slot.AllyID;
		ubs.TeamNumber = slot.TeamID;
		ubs.IsReady = true;
		ubs.IsSpectator = false;
		ubs.Name = slot.AiShortName;
		tas.AddBot(slot.TeamName, ubs, slot.Color, slot.AiShortName);
		*/
	}, //showDialog
	
	
	
	'blank':null
}); }); //declare lwidgets.ModOptions



