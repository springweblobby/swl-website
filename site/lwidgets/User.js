///////////////////////////////////

// JS Spring Lobby Interface

// By CarRepairer

// License: GPL 2

///////////////////////////////////

define(
	'lwidgets/User',
	[
		"dojo/_base/declare",
		
		"dojo",
		'dojo/topic',
	],
	function(declare,dojo, topic ){
	return declare("User", null, {
	
	'name':'',
	
	'country':'',
	'cpu':'',
	
	'status':null,
	'battleStatus':null,
	
	//lobby status
	'isInGame':null,
	'inGameSince':'',
	'isAway':null,
	'awaySince':'',
	'isAdmin':null,
	'isBot':null,
	'rank':null,
		
	//battle status
	'isReady':null,
	'teamNumber':null,
	'allyNumber':null,
	'isSpectator':null,
	'syncStatus':null,
	'side':0,
	'teamColor':'0',
	'r':null,
	'g':null,
	'b':null,
	
	//bot stuff
	'owner':'',
	'ai_dll':'',
	
	
	//extra
	'isHost':false,
	'isInBattle':false,
	
	'battleId':0,
	'scriptPassword':'',
	'skill':'',
	'elo':'',
	
	'constructor':function(/* Object */args){
		declare.safeMixin(this, args);
	},
	
	'toTestString':function()
	{
		return this.name + ' || t:' + this.teamNumber + '; a:' + this.allyNumber;
	},
	'toString':function()
	{
		if(this.owner !== '')
		{
			return this.name + ' (' + this.ai_dll + ') (' + this.owner + ') ';
		}
		return this.name;
	},
	
	'displayName':function()
	{
		if(this.owner !== '')
		{
			return this.name + ' (' + this.ai_dll + ') (' + this.owner + ') ';
		}
		return this.name;
	},
	
	
	
	//set the status number
	'setStatus':function(status)
	{
		var isAdmin;
		var isBot;
		var rank;
		var isInGame;
		var isAway;
		
		isAdmin = (status & 32) > 0;
		isBot = (status & 64) > 0;
		rank = (status & 28) >> 2;
		
		isInGame = (status & 1) > 0;
		isAway = (status & 2) > 0;
		
		this.setStatusVals({
			'status':status,
			
			'isAdmin':isAdmin,
			'isBot':isBot,
			'rank':rank,
			'isInGame':isInGame,
			'isAway':isAway
		})
	},
	
	//pass values in using an object
	'setStatusVals':function(vals)
	{
		var old, old2;
		old = this.isAway;
		old2 = this.isInGame;
		declare.safeMixin(this, vals);
		this.setAwaySince(old)
		this.setInGameSince(old2)
		this.updateStatusNumbers();
		topic.publish('Lobby/battle/playerstatus', {'name':this.name, user:this } );
		if( this.isHost && this.isInGame && this.battleId !== 0 )
		{
			topic.publish('Lobby/battle/checkStart', {'battleId':this.battleId } );
		}
	},
	
	'setAwaySince':function( old )
	{
		var date;
		date = new Date();
		
		if (this.isAway && !old) this.awaySince = date.toLocaleTimeString();
		if (!this.isAway) this.awaySince = '';
	},
	'setInGameSince':function( old )
	{
		var date;
		date = new Date();
		
		if (this.isInGame && !old) this.inGameSince = date.toLocaleTimeString();
		if (!this.isInGame) this.inGameSince = '';
	},
	
	'processBattleStatus':function()
	{
		var syncStatuses, status;
		
		status = this.battleStatus;
		
		syncStatuses = [
			'Unknown',
			'Synced',
			'Unsynced'
		];
		
		this.isReady = (status & 2) > 0;
		this.teamNumber = (status >> 2) & 15;
		this.allyNumber = (status >> 6) & 15;
		this.isSpectator = (status & 1024) == 0;
		this.syncStatus = syncStatuses[ (status >> 22) & 3 ] ;
		this.side = (status >> 24) & 15;
	},
	
	//set the battle status number and color number
	'setBattleStatus':function(status, color)
	{
		this.battleStatus = status;
		this.teamColor = color;
		this.processBattleStatusAndColor();
	},
	
	'processBattleStatusAndColor':function()
	{
		this.processTeamColor();
		this.processBattleStatus();
		topic.publish('Lobby/battle/playerstatus', {'name':this.name, user:this } );
	},
	
	
	'sendStatus':function()
	{
		var smsg = "MYSTATUS " + this.status;
		topic.publish( 'Lobby/rawmsg', {'msg':smsg } );
	},
	
	'sendBattleStatus':function(bot)
	{
		var smsg, sendString;
		sendString = bot ? ('UPDATEBOT ' + this.name.replace('<BOT>', '') ) : 'MYBATTLESTATUS'
		var smsg = sendString + ' ' + this.battleStatus + ' ' + this.teamColor;
		topic.publish( 'Lobby/rawmsg', {'msg':smsg } );
	},
	
	
	//returns the status number
	'updateStatusNumbers':function()
	{
		var status, battleStatus, syncStatusIndices;
		
		syncStatusIndices = {
			'Unknown':'0',
			'Synced':'1',
			'Unsynced':'2'
		};
		
		battleStatus = 0;
		if (this.isReady) battleStatus |= 2;
		battleStatus += (this.teamNumber & 15) << 2;
		battleStatus += (this.allyNumber & 15) << 6;
		if (!this.isSpectator) battleStatus |= 1024;
		battleStatus += ( parseInt( syncStatusIndices[this.syncStatus] ) & 3) << 22;
		battleStatus += (this.side & 15) << 24;
		this.battleStatus = battleStatus;
		
		
		//status = this.status;
		status = 0;
		status |= this.isInGame ? 1 : 0;
		status |= this.isAway ? 2 : 0;
		this.status = status;
		
	},
	
	'setTeamColor':function(val)
	{
		var r,g,b, color;
		
		r = val.substr(1,2);
		g = val.substr(3,2);
		b = val.substr(5,2);
		r = parseInt(r, 16);
		g = parseInt(g, 16);
		b = parseInt(b, 16);
		
		var color = b;
		color = color << 8;
		color += g;
		color = color << 8;
		color += r;
		
		this.teamColor = color;
	},
	'processTeamColor':function()
	{
		var hr, hg, hb;
		
		this.r = this.teamColor & 255;
		this.g = (this.teamColor >> 8) & 255;
		this.b = (this.teamColor >> 16) & 255;
		
		this.hexColor = 'FFFFFF';
		if( this.r !== null )
		{
			hr = this.r.toString(16);
			hg = this.g.toString(16);
			hb = this.b.toString(16);
			if( hr.length < 2 ) hr = '0' + hr;
			if( hg.length < 2 ) hg = '0' + hg;
			if( hb.length < 2 ) hb = '0' + hb;
			this.hexColor = hr+hg+hb;
		}
		
		
	},
	
	'getTeamColorHex':function()
	{
		//convert this.r, this.g and this.b to hex string
		
	},
	
	'blank':null
}); }); //declare User	
