///////////////////////////////////

// JS Spring Lobby Interface

// By CarRepairer

// License: GPL 2

///////////////////////////////////

define(
	'lwidgets/BattleManager',
	[
		"dojo/_base/declare",
		
		"dojo",
		"dijit",
		"dojox",
		
		//"lwidgets",
		'dijit/_WidgetBase',
		
		//'dojox/grid',
		
		'lwidgets/LobbySettings',
		'lwidgets/BattleFilter',
		
		
		// *** extras ***
		
		'dojo/text', //for dojo.cache
		
		
		'dijit/Dialog',
		
		'dijit/layout/BorderContainer',
		'dijit/layout/TabContainer',
		'dijit/layout/ContentPane',
		
		'dijit/form/TextBox',
		'dijit/form/Select',
		'dijit/form/Button',
		
		'dojox/grid/DataGrid',
		
		'dijit/_Templated',
		//'dijit._TemplatedMixin',	
		
		//'dojo/data',
		'dojo/data/ItemFileWriteStore'
		
		
	],
	function(declare,
			
			dojo, dijit, dojox,
			
			WidgetBase,
			
			LobbySettings,
			BattleFilter
			
	){


return declare( [ WidgetBase ], {
	'grid':null,
	'startMeUp':true,
	//'store':null, //mixed in
	
	'filters':null,
	'scriptPassword':'a',
	
	'bc':null,
	
	'buildRendering':function()
	{
		var div1, filterDiv, filterTitleDiv, layout, newFilterButton;
		//this.store = {};
		this.filters = [];
		
		var mainDiv = dojo.create('div', {  'style':{'width':'100%', 'height':'100%' }
								  });
		this.domNode = mainDiv;
		//div1 = dojo.create('div', {  'style':{}});
		this.bc = new dijit.layout.BorderContainer({
			'design':"sidebar",
			'gutters':true,
			'liveSplitters':true,
			'style': {'height': '100%', 'width': '100%;' }
		}).placeAt(mainDiv);
		
		
		var tempPane1 = new dijit.layout.ContentPane({ 'splitter':true, 'region':'center',
			'style':{'width':'100%', 'height':'100%', 'fontSize':'small','letterSpacing':'-1px'}
		});
		var tempPane2 = new dijit.layout.ContentPane({ 'splitter':true, 'region':'trailing', 'minSize':50, 'maxSize':600, 'style':{'width':'150px'} } );
		this.bc.addChild(tempPane1)
		this.bc.addChild(tempPane2)
		/*
		dojo.create('span', { 'innerHTML':'Doubleclick on a battle to join it.' }, div1);
		dojo.create('br', {}, div1);
		dojo.create('br', {}, div1);
		*/
		//div1 = dojo.create('div', {  'style':{'width':'100%', 'height':'100%' }});
		
		// set the layout structure:
        layout = [
			{	field: 'status',
				name: '<img src="img/info.png" title="Room type and status">',
				width: '60px',
				formatter: function(valueStr)
				{
					var value;
					value = eval( '(' + valueStr + ')' );
					return (value.type === '1' 	? '<img src="img/control_play_blue.png" title="This is a replay">' : '<img src="img/battle.png"  title="This is a battle">')
						+ (value.passworded 	? '<img src="img/key.png" width="16"  title="A password is required to join">' : '')
						+ (value.locked 		? '<img src="img/lock.png" width="16" title="This battle is locked and cannot be joined">' : '')
						+ (value.progress 		? '<img src="img/progress.png" width="16" title="This battle is in progress">' : '')
						+ (value.rank > 0 		? '<span style="font-size:small">['+value.rank+']</span>' : '' )
						;
					
				}
			},
			{	field: 'title',
				name: '<img src="img/battle.png" /> Battle Name',
				width: '200px'
			},
			{	field: 'game',
				name: '<img src="img/game.png" /> Game',
				width: '200px'
			},
			{	field: 'map',
				name: '<img src="img/map.png" /> Map',
				width: '200px'
			},
			{	field: 'country',
				name: '<img src="img/globe.png" title="Host Location" />',
				width: '50px',
				formatter: function(value)
				{
					if(value === '??')
					{
						return '<img src="img/flags/unknown.png" title="Unknown Location" width="16" />';
					}
					return '<img src="img/flags/'+value.toLowerCase()+'.png" title="'+value+'" width="16" />';
				}
			},
			{	field: 'host',
				name: '<img src="img/napoleon.png" /> Host',
				width: '100px'
			},
			{	field: 'players',
				name: '<img src="img/soldier.png" title="Active Players">',
				width: '50px'
			},
			{	field: 'max_players',
				name: '<img src="img/grayuser.png" title="Maximum Spots">',
				//formatter: function(value) { return '<img src="img/soldier.png'; },
				width: '50px'
			},
			{	field: 'spectators',
				name: '<img src="img/search.png" title="Spectators" width="18" >',
				width: '50px'
				//innerHTML:''
			},
        ];
		
		this.grid = new dojox.grid.DataGrid({
			'query': {
                'title': '*'
            },
			
			'sortInfo':-7, //number of players column, decreasing
			
			'queryOptions':{'ignoreCase': true},
            'store': this.store,
            'clientSort': true,
            //'rowSelector': '20px',
            'rowSelector': '5px',
            'structure': layout,
			'autoHeight':false,
			//'autoWidth':true,
			'autoWidth':false,
			'height':'100%',
			'onRowDblClick':dojo.hitch(this, 'joinRowBattle')
			//,'style':{ /*'position':'absolute',*/ 'width':'100%', 'height':'100%'}
			
		//} ).placeAt(div1);
		} );
		tempPane1.set('content', this.grid)
		
		this.grid.beginUpdate();  //doesn't seem to work.
		
		filterDiv = dojo.create('div', {'style':{'width':'100%'}});
		tempPane2.set('content', filterDiv)
		
		filterTitleDiv = dojo.create('div', {
			'style':{
				'backgroundColor':'white',
				'border':'1px solid black',
				'fontWeight':'bold',
				'position':'relative',
				'height':'35px'
			},
			'innerHTML':'Filters'
		}, filterDiv );
		
		newFilterButton = new dijit.form.Button({
			'label':'Add a Filter',
			'showLabel':false,
			'iconClass':'smallIcon plusImage',
			'style':{
				'position':'absolute',
				'right':'0px',
				'top':'0px'
			},
			'onClick':dojo.hitch(this, function(){
				var filter1 = new BattleFilter( {} ).placeAt(filterDiv);
				this.filters.push( filter1 );
				filter1.killFilter = dojo.hitch(this, function(){
					this.filters.remove(filter1)
					filter1.destroyRecursive(false);
					delete filter1
					this.updateFilters();
				});
			} )
		}).placeAt(filterTitleDiv);
		
		dojo.subscribe('Lobby/battles/updatebattle', this, 'updateBattle' );
		dojo.subscribe('Lobby/battles/addplayer', this, function(data){ data.add=true; this.setPlayer(data) });
		dojo.subscribe('Lobby/battles/remplayer', this, function(data){ data.add=false; this.setPlayer(data) });
		
		dojo.subscribe('Lobby/battles/updatefilters', this, 'updateFilters');
		
		//dumb hax
		dojo.subscribe('ResizeNeeded', this, function(){
			setTimeout( function(thisObj){
				thisObj.resizeAlready();
				
				
				//thisObj.updateFilters(); //test
				
			}, 400, this );
		} );
		
	},
	
	'delayedUpdateFilters':function()
	{
		setTimeout( function(thisObj){ thisObj.updateFilters(); }, 400, this );
	},
	'updateFilters':function()
	{
		var queryObj, addedQuery, queryVal, queryStr,
			queryObj2,queryValList, tempElement
		;
		queryStr = '';
		queryObj2 = {};
		queryObj = {};
		newFilters = [];
		addedQuery = false;
		
		
		dojo.forEach(this.filters, function(filter){
			var fieldName, comparator, value;
			fieldName = filter.fieldName.value;
			comparator = filter.comparator.value;
			filterValue = filter.filterValue.displayedValue;
			
			filterValue = filterValue.trim();
			
			if( filterValue !== '' )
			{
				filterValue = filterValue.replace(/\./, '\\.')
				filterValue = filterValue.replace(/\-/, '\\-')
				
				if( comparator === '=' )
				{
					filterValue = '^' + filterValue + '$'
					filterValue = '(?=' + filterValue + ')'
				}
				else if( comparator === '*=' )
				{
					filterValue = '.*' + filterValue + '.*'
					filterValue = '(?=' + filterValue + ')'
				}
				
				/*
				else if( comparator === '!=' )
				{
					filterValue = '[^(^' + filterValue + '$)]'
					filterValue = '(?!' + filterValue + ')'
				}
				else if( comparator === '!*=' )
				{
					//filterValue = '^((?!'+filterValue+').)*$'
					filterValue = '(?!.*'+filterValue+'.*)'
				}
				*/
				
				if( !queryObj[ fieldName ] )
				{
					queryObj[ fieldName ] = [];
				}
				
				
				queryObj[ fieldName ].push( filterValue );
				
				addedQuery = true;
			}
			
			
		}, this );
		
		for(fieldname in queryObj)
		{
			queryValList =  queryObj[fieldname];
			queryStr = this.getQueryVal(queryValList)
			queryObj2[fieldname] = new RegExp(queryStr, 'i');
		}
		
		if(!addedQuery)
		{
			queryObj2 = {'title':'*'};
		}
		this.grid.setQuery(queryObj2);
	},
	
	'getQueryVal':function(queryValList)
	{
		var queryStr, queryChunks;
		queryStr = '';
		dojo.forEach(queryValList, function(queryVal){
			//queryStr += '(?=' + queryVal + ')'
			queryStr += queryVal;
		});	
		return queryStr;
	},
	
	'joinRowBattle':function(e)
	{
		var row, battleId, smsg, tempUser;
		
		row = this.grid.getItem(e.rowIndex);
		
		battleId = row.battle_id;
		password = '';
		if( row.passworded[0] === true )
		{
			this.passwordDialog( battleId );
			return;
		}
		this.joinBattle(battleId, '');
	},
	
	'joinBattle':function( battleId, battlePassword )
	{
		var smsg;
		smsg = 'LEAVEBATTLE'
		dojo.publish( 'Lobby/rawmsg', [{'msg':smsg }] );
		smsg = "JOINBATTLE " + battleId + ' ' + battlePassword + ' ' + this.scriptPassword;
		dojo.publish( 'Lobby/rawmsg', [{'msg':smsg }] );
	},
	
	'passwordDialogKeyUp':function(battleId, input, dlg, e)
	{
		var password;
		
		password = dojo.attr( input, 'value' )
		if( e.keyCode === 13 )
		{
			this.joinBattle( battleId, password );
			dlg.hide();
		}
	},
	
	'passwordDialog':function( battleId )
	{
		var dlg, input, contentDiv;
		contentDiv = dojo.create( 'div', {} );
		dojo.create( 'span', {'innerHTML':'Password '}, contentDiv );
		input = dojo.create( 'input', {'type':'text'}, contentDiv );
		
		dlg = new dijit.Dialog({
            'title': "Enter Battle Password",
            'style': "width: 300px",
			'content':contentDiv
        });
		
		dojo.connect(input, 'onkeyup', dojo.hitch(this, 'passwordDialogKeyUp', battleId, input, dlg ) )
		
		dlg.show();
	},
	
	'addBattle':function(data)
	{
		data.status = this.statusFromData(data);
		data.playerlist = { };
		data.members = 1;
		data.players = 1;
		data.spectators = 0;
		data.playerlist[data.host] = true;
		this.store.newItem(data);
		this.delayedUpdateFilters();
	},
	
	'statusFromData':function(data)
	{
		var statusObj;
		statusObj = {
			'type':data.type,
			'passworded':data.passworded,
			'locked':data.locked,
			'rank':data.rank,
			'progress':data.progress
		};
		return JSON.stringify( statusObj )
	},
	'statusFromItem':function(item)
	{
		var statusObj;
		statusObj = {
			'type':item.type[0],
			'passworded':item.passworded[0],
			'locked':item.locked[0],
			'rank':item.rank[0],
			'progress':item.progress[0]
		};
		return JSON.stringify( statusObj )
	},
	
	'updateBattle':function(data)
	{
		this.store.fetchItemByIdentity({
			'identity':data.battle_id,
			'scope':this,
			'onItem':function(item)
			{
				var members;
				
				for(attr in data){
					if(attr != 'battle_id' )
					{	
						this.store.setValue(item, attr, data[attr]);
					}
				}
				this.store.setValue(item, 'status', this.statusFromItem(item) );
				
				members = parseInt( this.store.getValue(item, 'members') );
				this.store.setValue(item, 'players', members - parseInt( data.spectators) );
				this.delayedUpdateFilters();
			}
		});
	},
	
	'setPlayer':function(data)
	{
		this.store.fetchItemByIdentity({
			'identity':data.battle_id,
			'scope':this,
			'onItem':function(item)
			{
				var members, playerlist, spectators ;
				members = parseInt( this.store.getValue(item, 'members') );
				playerlist = this.store.getValue(item, 'playerlist');
				spectators = parseInt( this.store.getValue(item, 'spectators') );
				if( data.add )
				{
					members += 1;
					playerlist[data.name] = true;
				}
				else
				{
					members -= 1;
					delete playerlist[data.name];
				}
				this.store.setValue(item, 'members', members);
				this.store.setValue(item, 'playerlist', playerlist);
				this.store.setValue(item, 'players', members - spectators );
			}
		});
	},
	
	
	'startup2':function()
	{
		if( this.startMeUp )
		{
			this.startMeUp = false;
			//this.startup();
			this.bc.startup();
			this.grid.startup();
			
			this.resizeAlready();
			this.delayedUpdateFilters();
		}
	},
	'resizeAlready':function()
	{
		this.bc.resize();
	},
	'blank':null
}); }); //declare lwidgets.BattleManager
