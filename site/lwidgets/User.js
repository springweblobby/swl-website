///////////////////////////////////

// JS Spring Lobby Interface

// By CarRepairer

///////////////////////////////////

/*
Todo:
server player list
chime
offline single player
*/


define(
	'lwidgets/User',
	[
		"dojo/_base/declare",
		
		"dojo",
		"dijit",
	],
	function(declare,dojo, dijit ){
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
	'side':null,
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
	
	'constructor':function(/* Object */args){
		dojo.safeMixin(this, args);
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
	
	
	//set the status number
	'setStatus':function(status)
	{
		var old;
		
		this.status = status;
		
		old = this.isInGame;
		this.isInGame = (status & 1) > 0;
		//if (this.isInGame && !old) this.inGameSince = date.toLocaleTimeString();
		//if (!this.isInGame) this.inGameSince = '';
		this.setInGameSince(old)
		
		old = this.isAway;
		this.isAway = (status & 2) > 0;
		this.setAwaySince(old)
		
		this.isAdmin = (status & 32) > 0;
		this.isBot = (status & 64) > 0;
		this.rank = (status & 28) >> 2;
		
		if( this.isHost && this.isInGame )
		{
			dojo.publish('Lobby/battle/checkStart');
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
	
	
	//set the battle status number and color number
	'setBattleStatus':function(status, color)
	{
		var syncStatuses, hr, hg, hb;
		
		this.battleStatus = status;
		
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
		
		this.r = color & 255;
		this.g = (color >> 8) & 255;
		this.b = (color >> 16) & 255;
		
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
		
		dojo.publish('Lobby/battle/playerstatus', [{'name':this.name, user:this }] );
	},
	
	'sendStatus':function()
	{
		smsg = "MYSTATUS " + this.status;
		dojo.publish( 'Lobby/rawmsg', [{'msg':smsg }] );
	},
	
	//pass values in using an object
	'setStatusVals':function(vals)
	{
		var old, old2;
		old = this.isAway;
		old2 = this.isInGame;
		dojo.safeMixin(this, vals);
		this.setAwaySince(old)
		this.setInGameSince(old2)
		this.updateStatusNumbers();
		dojo.publish('Lobby/battle/playerstatus', [{'name':this.name, user:this }] );
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
	
	'getTeamColorHex':function()
	{
		//convert this.r, this.g and this.b to hex string
		
	},
	
	'blank':null
}); }); //declare User	
