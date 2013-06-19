///////////////////////////////////

// JS Spring Lobby Interface

// By CarRepairer

// License: GPL 2

///////////////////////////////////



define(
	'lwidgets/UserList',
	[
		"dojo/_base/declare",
		
		'dojo/_base/array',
		'dojo/dom-construct',
		'dojo/dom-style',
		'dojo/dom-attr',
		'dojo/_base/lang',
		'dojo/topic',
		
		'dojo/_base/event',
		
		'dijit/_WidgetBase',
		
		"dojo/store/Memory",
		"dojo/store/Observable",
		
		'dgrid/OnDemandGrid',
		'dgrid/Selection',
		'dgrid/extensions/ColumnResizer',
		
		'dijit/layout/ContentPane',
		
		'dijit/Tooltip',
		'dijit/TooltipDialog',
		'dijit/form/DropDownButton',
		
		
		'dojo/request',
		'dojo/request/script'
		
		//extras
		//'dojo/dom', //needed for widget.placeAt to work now
		
	],
	function(declare,
		array, domConstruct, domStyle, domAttr, lang, topic,
		event,
		WidgetBase,
		
		Memory, Observable,
		OnDemandGrid, Selection, ColumnResizer,
		
		ContentPane,
		Tooltip,
		TooltipDialog,
		DropDownButton,
		request,
		script
		){
	
	return declare( [ WidgetBase ], {
		
	store: null,
	startMeUp: true,
	
	name: 'unnamed',
	userCountSpan: null,
	
	gridParent: null,
	
	buildRendering: function()
	{
		
		var div1, layout;
		var ResizeGrid;
		
		if( !this.style )
		{
			this.style = {width: '100%', height: '100%' };
		}
		div1 = domConstruct.create('div', this.style );
		
		this.domNode = div1;
		
		this.userCountSpan = domConstruct.create('span', {} );
		
		layout = [
			{	field: 'country',
				//label: '<img src="img/globe.png" title="Location" />',
				resizable: true,
				renderHeaderCell: function (node)
				{
					return domConstruct.create('img', {src: 'img/globe.png', title: 'Location', width: 16} );
				},
				renderCell: lang.hitch(this, function (object, value, cell)
				{
					return this.getFlag(value);
				})
			},
			{	field: 'main',
				label: 'Users',
				renderHeaderCell: lang.hitch(this, function (node) {
					var headerCell = domConstruct.create('span', { innerHTML: 'Users ' } );
					domConstruct.place( this.userCountSpan, headerCell );
					return headerCell;
				} ),
				
				resizable: true,
				
				renderCell: lang.hitch(this, function (object, value, cell)
				{
					var div;
					var os;
					var battleIcon;
					var lobbyClient;
					
					div = domConstruct.create( 'div', { style: {padding: '0px' } } );
					
					lobbyClient = this.getLobbyClient(object.cpu);
					os = this.getOs(object.cpu)
					battleIcon = this.getBattleIcon(object)
					
					domConstruct.place( this.getUserIcon( object ), div );
					domConstruct.create( 'span', {innerHTML: object.name}, div )
					if( lobbyClient )
					{
						domConstruct.place( lobbyClient, div );
					}
					if( os )
					{
						domConstruct.place( this.getOs(object.cpu), div );
					}
					if( object.isAdmin )
					{
						domConstruct.create( 'img', {src: 'img/badge.png', align: 'right', title: 'Administrator', width: '16' }, div )
					}
					if( object.isAway )
					{
						domConstruct.create( 'img', {src: 'img/away.png', align: 'right', title: 'Away since ' + object.awaySince, width: '16' }, div )
					}
					if( battleIcon )
					{
						domConstruct.place( battleIcon, div );
					}
					if( object.clan )
					{
						domConstruct.create( 'img', {src: 'http://zero-k.info/img/clans/'+object.clan+'.png', align: 'right', title: 'Clan: ' + object.clan, width: '16' }, div )
					}
					/**/
					return div;
				})
			},
			/** /
			//this is an extra empty column, sometimes appropriate. without it, all columns get resized fit width
			{	field: '',
				label: '',
			}
			/**/
        ];
		
		domConstruct.create('style', {innerHTML: ''
			+ ' .dgrid { font-size:small } '
			+ ' .dgrid-cell-padding {  padding:0; } '
			+ '.field-country { width: 30px; text-align:center; vertical-align:middle; } '
			+ '.field-main { width: 180px; } '
			//+ '.field-main { width: ' + (parseInt( this.style.width ) - 30) + 'px; } '
		 }, div1 );
		//domConstruct.create('style', {'innerHTML':' .field-main { width: 150px; } ' }, this.domNode );
		
		this.setupStore();
		ResizeGrid = declare([OnDemandGrid, Selection, ColumnResizer]);
		this.gridParent = domConstruct.create('div', {style: { height: '100%', width: '100%', /*doesnt help*/minHeight: '50px' }}, div1);
		this.grid = new ResizeGrid({
			store: this.store,
            columns: layout,
			selectionMode: 'single'
		//}, domConstruct.create('div', {'style':{ 'height':'100%', 'width':'100%', /*doesnt help*/'minHeight':'50px' }}, div1) ); // no placeAt because not dijit
		}, this.gridParent ); // no placeAt because not dijit
		this.grid.set('sort', 'main');
		this.grid.on(".dgrid-row:dblclick", lang.hitch(this, 'queryPlayer') );
		this.subscribe('Lobby/battle/playerstatus', 'updateUserPlayerStatus' );
		this.subscribe('Lobby/updateUser', 'updateUser' );
		
	},
	
	setupStore: function()
	{
		this.store = Observable( new Memory({data: [], identifier: 'id'}) );
	},
	
	startup2: function()
	{
		if( this.startMeUp )
		{
			if( this.grid.domNode.clientHeight > 0 )
			{
				this.startMeUp = false;
				this.grid.startup();
			}
			
		}
	},
	
	
	resizeAlready: function()
	{
		this.startup2();
		this.grid.resize();
	},
	
	postCreate: function()
	{
		this.subscribe('Lobby/connecting', 'empty' );
		this.postCreate2();
	},
	
	postCreate2: function()
	{
	},
	
	getFlag: function(value)
	{
		var country;
		country = value in countryCodes ? countryCodes[value] : 'country not found' ;
		if(value === '??')
		{
			return domConstruct.create('img', {src: 'img/flags/unknown.png', title: 'Unknown Location', width: 16} )
		}
		return domConstruct.create('img', {src: 'img/flags/'+value.toLowerCase()+'.png', title: country, width: 16} )
	},
	
	getBattleIcon: function(user, noLink)
	{
		var joinLink;
		var img;
		
		joinLink = domConstruct.create('a', {
			href: '#',
			onclick: lang.hitch(this, function( battleId, e ){
				event.stop(e);
				topic.publish('Lobby/battles/joinbattle', battleId );
				return false;
			}, user.battleId )
		} );
	
		if( user.isInGame )
		{
			img = domConstruct.create( 'img', {
				src: "img/battle.png",
				align: "right",
				title: "In a game" + (!noLink ? '. Click to join.' : ''),
				width: '16',
				onmouseover: function()
				{
					var curDate = new Date();
					domAttr.set( this, 'width', 18 );
					domAttr.set( this, 'title', "In a game since " +
						(user.inGameSince ? user.inGameSince.toLocaleTimeString() + ' (' +
						Math.floor( (curDate - user.inGameSince) / 60000 ) + ' mins)' : '') +
						(!noLink ? '. Click to join.' : '') );
				},
				onmouseout: function() { domAttr.set( this, 'width', 16 ) },
			});
		}
		else if( user.isInBattle )
		{
			img = domConstruct.create( 'img', {
				src: "img/battlehalf.png",
				align: "right",
				title: "In a battle room. Click to join.",
				width: '16',
				onmouseover: function() { domAttr.set( this, 'width', 18 ) },
				onmouseout: function() { domAttr.set( this, 'width', 16 ) },
			});
		}
		else
		{
			return false;
		}
		if( noLink )
		{
			return img;
		}
		domConstruct.place( img, joinLink );
		return joinLink;
	},
	
	getLobbyClient: function(cpu)
	{
		var src, title
		src = '';
		if( array.indexOf( ['7777', '7778', '7779'], cpu ) !== -1 )
		{
			src = "img/blobby2icon-small.ico";
			title = "Spring Web Lobby";
		}
		else if( array.indexOf( ['6666', '6667', '6668'], cpu ) !== -1 )
		{
			src = "img/zk_logo_square.png";
			title = "Zero-K Lobby";
		}
		else if( array.indexOf( ['9997', '9998', '9999'], cpu ) !== -1 )
		{
			src = "img/notalobby.png";
			title = "NotaLobby";
		}
		else if( array.indexOf( ['8484'], cpu ) !== -1 )
		{
			src = "img/mlclient.ico";
			title = "mlclient";
		}
		if( src === '' )
		{
			return false;
		}
		return domConstruct.create( 'img', {src: src,  align: "right",  title: title, width: "16"} );
	},
	
	getOs: function(cpu)
	{
		var src, title
		src = '';
		if( array.indexOf( ['7777', '9998', '6667' ], cpu ) !== -1 )
		{
			src = "img/windows.png";
			title = "Microsoft Windows";
		}
		else if( array.indexOf( ['7778', '9999', '6668' ], cpu ) !== -1 )
		{
			src = "img/linux.png";
			title = "Linux";
		}
		else if( array.indexOf( ['7779', '9997' ], cpu ) !== -1 )
		{
			src = "img/mac.png";
			title = "MacOS";
		}
		if( src === '' )
		{
			return false;
		}
		return domConstruct.create( 'img', {src: src,  align: "right",  title: title, width: "16"} );
	},

	queryPlayer: function( e )
	{
		var row, name;
		row = this.grid.row(e);
		name = row.id;
		topic.publish('Lobby/chat/addprivchat', {name: name, msg: '' }  );
		topic.publish('Lobby/focuschat', {name: name, isRoom: false }  );
	},
	
	count: 0,
	addUser: function(user)
	{
		var icon, iconTitle;
		icon = 'smurf.png'; iconTitle = 'User';
		user.icon = icon;
		user.iconTitle = iconTitle
		user.main = user.name.toLowerCase();
		user.id = user.name;
		this.count += 1;
		this.setCount();
		this.store.put( user );
	},
	
	removeUser: function(user)
	{
		this.count -= 1;
		this.setCount();
		this.store.remove( user.name );
	},
	
	updateUser: function( user )
	{
		var name;
		name = user.name;
		
		if( user.local )
		{
			return;
		}
		if( typeof this.store.get(name) === 'undefined' )  //calling store.notify will add a user if it doesn't exist
		{
			return;
		}
		
		user.main = user.name.toLowerCase();
		this.store.notify( user, name )
	},
	
	updateUserPlayerStatus: function( data )
	{
		var name, user;
		var icon, iconTitle;
		name = data.name;
		user = data.user;
		
		if( user.local )
		{
			return;
		}
		if( typeof this.store.get(name) === 'undefined' )  //calling store.notify will add a user if it doesn't exist
		{
			return;
		}
		
		//user.main = this.setupDisplayName(user);
		user.main = user.name.toLowerCase();
		this.store.notify( user, name )
	},
	
	selectUser: function(name)
	{
		this.grid.clearSelection();
		this.grid.select( name );
		//this.grid.select( this.grid.row(name) ); //also works. leave here
		
		if( this.grid.row(name) ) //user has logged off
		{
			this.grid.row(name).element.scrollIntoView();
		}
	},
	
	getUserIcon: function( user )
	{
		var chatLink;
		var img;
		
		var icon, iconTitle, tooltipHtml;
		icon = 'smurf.png'; iconTitle = 'User. Click to open chat.';
		if( user.cpu === '6666' )	{ icon = 'robot.png';		iconTitle = 'Automated Battle Host. Click to open chat.';	}
		else if( user.isHost )			{ icon = 'napoleon.png';	iconTitle = 'Hosting a battle. Click to open chat.'; 	}
		else if( user.owner ) 			{ icon = 'robot.png';		iconTitle = 'Bot'; 										}
		else if( user.isInBattle )		{ icon = 'soldier.png';		iconTitle = 'In a battle room. Click to open chat.';	}
		user.icon = icon;
		user.iconTitle = iconTitle
		
		chatLink = domConstruct.create('a', {
			href: '#',
			onclick: lang.hitch(this, function( user, e ){
				event.stop(e);
				topic.publish('Lobby/chat/addprivchat', {name: user.name, msg: '' }  );
				topic.publish('Lobby/focuschat', {name: user.name, isRoom: false }  );
				return false;
			}, user )
		} );
		
		img = domConstruct.create('img', {
			src: 'img/'+user.icon,
			//title:user.iconTitle,
			width: '16',
			//align:"left",
			onmouseover: function() { domAttr.set( this, 'width', 18 ) },
			onmouseout: function() { domAttr.set( this, 'width', 16 ) },
		});
		domConstruct.place( img, chatLink );
		
		//tooltipHtml = user.iconTitle + '<br /><img src="http://zero-k.info/img/avatars/'+user.avatar+'.png" />'
		tooltipHtml = user.iconTitle
		var tt = new Tooltip({
			connectId: [img],
			position: ['below'],
			label: tooltipHtml
		});
		return chatLink;
	},
	
	refresh: function()
	{
	},
	
	empty: function()
	{
		var items;
		items = this.store.query({id: new RegExp('.*') });
		array.forEach(items, function(item){
			this.store.remove(item.id)
		}, this);
		this.count = 0;
		this.setCount();
		//this.store.setData([])
	},
	
	setCount: function()
	{
		domAttr.set( this.userCountSpan, 'innerHTML', '(' + this.count + ')' );
	},
	
	
	blank: null
}); });//declare lwidgets.PlayerList
