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
		
		//extra
		'dojox/html/entities',
		
		"dijit/form/TextBox",
		"dijit/form/Select",
		"dijit/form/ToggleButton",
		
	],
	function(declare, dojo, dijit, topic ){
	return declare([ ], {

	'appletHandler': null, 
	'gameIndex': null,
	
	'users':null,
	
	'botInfo':{},
	
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
	

	
	
	'showDialog':function()
	{
		var dlg, mainDiv, applyButton, aiSelect, options, botNameText;
		
		mainDiv = dojo.create('div', {'style':{'minWidth':'250px' }} );
		options = [];
		dojo.forEach(this.botInfo, function(curBotInfo){
			options.push( { label: curBotInfo.shortName, value: curBotInfo.shortName } );
		});
		
		aiSelect = new dijit.form.Select({
			'style':{'width':'150px' },
			'options':options,
			'onChange':dojo.hitch(this, function(){
			
			})
		}).placeAt(mainDiv);
		
		botNameText = new dijit.form.TextBox({
			
		}).placeAt(mainDiv);
		
		applyButton = new dijit.form.Button({
			'label':'Add',
			'onClick':dojo.hitch(this, function(){
				var smsg, botName;
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
				smsg = 'ADDBOT ' + botName + ' ' + 0 + ' ' + 0 + ' ' + aiSelect.get('value');
				dojo.publish( 'Lobby/rawmsg', [{'msg':smsg }] );
				dlg.hide();
			})
		}).placeAt(mainDiv);
		
		dlg = new dijit.Dialog({
			'title': 'Add AI Bots',
			'content':mainDiv,
			//'onClose': dojo.hitch(this, function(){
			'onHide': dojo.hitch(this, function(){
				
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



