///////////////////////////////////

// JS Spring Lobby Interface

// By CarRepairer

///////////////////////////////////

define(
	'lwidgets/Chat',
	[
		"dojo/_base/declare",
		
		"dojo",
		"dijit",
		"dojox",
		
		'dijit/_WidgetBase',
		'dijit/_TemplatedMixin',
		'dijit/_WidgetsInTemplateMixin',
		//extras
		
		'dojox/html/entities',
		'dijit/layout/BorderContainer',
		'dijit/layout/ContentPane'
		
		
	],
	function(declare, dojo, dijit, dojox, WidgetBase, Templated, WidgetsInTemplate ){
	return declare([ WidgetBase, Templated, WidgetsInTemplate ], {
	
	
	'subscriptions':null,
	
	'mainContainer':null,
	'messageNode':'',
	'name':'',
	'nick':'',
	
	'prevCommands':null,
	'curPrevCommandIndex':0,
	
	'startMeUp':true,
	
	'maxLines':100,
	
	'users':null,	//mixed in
	'settings':null,
	
	'nickCompleteIndex':0,
	'nickCompleteWord':'',
	'nickCompleteNicks':null,
	
	'postCreate' : function()
	{
		this.prevCommands = [];
		
		/*
		this.mainContainer = new dijit.layout.BorderContainer({
			design:"sidebar",
			gutters:true,
			liveSplitters:true
			//,'style': {'height': '100%', 'width': '100%;' }
			
		}, this.mainContainerNode);
		
		this.messageNode = new dijit.layout.ContentPane({
			'splitter':true, 'region':'center' /* doesn't seem to work for middle div 'minSize':100 * /
		}, this.messageDivNode );
		this.inputNode = new dijit.layout.ContentPane({ 'splitter':false, 'region':'bottom' }, this.inputDivNode );
		*/
			
		this.postCreate2();
		setTimeout( function(thisObj){ dojo.publish('SetColors') }, 1000, this );
		
		dojo.subscribe('SetNick', this, function(data){ this.nick = data.nick } );
		
		//dumb hax
		dojo.subscribe('ResizeNeeded', this, function(){
			setTimeout( function(thisObj){
				thisObj.resizeAlready();
			}, 400, this );
		} );
		
	},
	
	'destroyMe':function()
	{
		if( this.playerListNode )
		{
			echo('destroy playerlist error')
			//this.playerListNode.destroyRecursive();	
		}
		
		if( this.subscriptions )
		{
			dojo.forEach(this.subscriptions, function(subscription){ dojo.unsubscribe( subscription ) });
		}
		echo('destroy chat error')
		//this.destroyRecursive();
		
	},
	
	'postCreate2':function()
	{
	},
	
	'keydown':function(e)
	{
		var cursorPos, curText, words, curWord, curTextLeft, curTextRight, joinedNicks
		if(e.keyCode === 9) //tab
		{
			dojo.stopEvent(e);
			cursorPos = this.textInputNode.selectionStart;
			
			curText = this.textInputNode.value;
			curTextLeft = curText.substring(0,cursorPos);
			curTextRight = curText.substring(cursorPos);
			words = curTextLeft.split(' ');
			curWord = words.pop();
			
			if( curWord === '' )
			{
				return;
			}
			
			if( this.nickCompleteWord === '' )
			{
				this.nickCompleteWord = curWord;
				joinedNicks = '';
				for(user in this.players)
				{
					joinedNicks += ' ' + user;
				}
				this.nickCompleteNicks = joinedNicks.match(new RegExp('[^ ]*'+ this.nickCompleteWord.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&") +'[^ ]*', 'gi') );
			}
			
			if( this.nickCompleteNicks !== null )
			{
			
				curWord = this.nickCompleteNicks[this.nickCompleteIndex];
				words.push(curWord);
				curTextLeft = words.join(' ');
				this.textInputNode.value = curTextLeft + curTextRight;
				this.textInputNode.selectionStart = curTextLeft.length;
				this.textInputNode.selectionEnd = curTextLeft.length;
				
				this.nickCompleteIndex+=1;
				this.nickCompleteIndex %= this.nickCompleteNicks.length;
			}
		}
		else
		{
			this.nickCompleteNicks = null;
			this.nickCompleteIndex = 0;
			this.nickCompleteWord = '';
		}
	},
	
	'keyup':function(e)
	{
		var msg, smsg, msg_arr, rest, thisName, prevCommand;
		echo(e)
		//up = 38, down = 40
		if(e.keyCode === 38)
		{
			this.curPrevCommandIndex += 1;
		}
		if(e.keyCode === 40)
		{
			this.curPrevCommandIndex -= 1;
		}
		if(e.keyCode === 38 || e.keyCode === 40)
		{
			this.curPrevCommandIndex = Math.min(this.curPrevCommandIndex, this.prevCommands.length-1)
			this.curPrevCommandIndex = Math.max(this.curPrevCommandIndex, 0)
			prevCommand = this.prevCommands[ this.curPrevCommandIndex ]
			if( typeof prevCommand !== 'undefined' )
			{
				this.textInputNode.value = this.prevCommands[ this.curPrevCommandIndex ];
			}
			return;	
		}
		
		//enter
		if(e.keyCode !== 13) return;
		
		this.curPrevCommandIndex = -1;
		
		msg = this.textInputNode.value;
		
		this.prevCommands.remove(msg);
		this.prevCommands.unshift(msg);
		if( this.prevCommands.length > 20 )
		{
			this.prevCommands.pop();
		}
		
		msg_arr = msg.split(' ');
		cmd = msg_arr[0];
		
		thisName = '';
		if( this.name !== '' )
		{
			thisName = this.name + ' ';
		}
		
		if( cmd == '/me' )
		{
			rest = msg_arr.slice(1).join(' ')
			smsg = this.saystring + 'EX ' + thisName + rest;
		}
		else
		{
			smsg = this.saystring + ' ' + thisName + msg;
		}
		dojo.publish( 'Lobby/notidle', [{}] );
		dojo.publish( 'Lobby/rawmsg', [{'msg':smsg }] );
		this.textInputNode.value = '';
	},
	
	
	'scrollToBottom':function()
	{
		this.messageNode.domNode.scrollTop = 9999;
	},
	
	'addLine':function(line, style, className)
	{
		var toPlace, newNode, date, timestamp, line_ts, line_clean, urlExp;
		date = new Date();
		timestamp = '[' + date.toLocaleTimeString() + ']';
		toPlace = this.messageNode.domNode;
		
		urlExp = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
		line = line.replace(urlExp,"<a href='$1' target='_blank'>$1</a>"); 
		urlExp = /(\bwww\.[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
		line = line.replace(urlExp,"<a href='http://$1' target='_blank'>$1</a>"); 
		
		line_ts = timestamp + ' ' + line;
		newNode = dojo.create('div', {
			'innerHTML':line_ts,
			'style':style ? style : {},
			'class':className ? className : ''
		}, toPlace )
		
		//fixme: hidden join/leaves will cause confusing removal of chat lines
		while( toPlace.children.length > this.maxLines )
		{
			dojo.destroy( toPlace.firstChild );
		}
		this.scrollToBottom(newNode);
	},
	
	'playerMessage':function( data )
	{
		var pname, msg, line, lineStyle, lineClass, nameStyle, nameClass;
		
		if(data.channel !== this.name && data.userWindow !== this.name && data.battle === undefined )
		{
			return;
		}
		
		msg = data.msg;
		msg = dojox.html.entities.encode(msg);
		pname = data.name;
		
		if(data.ex)
		{
			line = '* ' + pname + ' ' + msg
		}
		else
		{
			line =	'<span style="color:' + this.settings.settings.chatNickColor + '" class="chatNick">'
					+ dojox.html.entities.encode('<')
					+ pname
					+ dojox.html.entities.encode('> ')
					+ '</span>'
					+ msg
		}
		
		lineStyle = {};
		lineClass = '';
		if(data.ex)
		{
			lineStyle = {'color':this.settings.settings.chatActionColor};
			lineClass = 'chatAction';
		}
		else if(pname == this.nick)
		{
			lineStyle = {'color':this.settings.fadedColor };
			lineClass = 'chatMine';
		}
		this.addLine( line, lineStyle, lineClass );
	},
	
	//stupid hax
	'resizeAlready':function()
	{
		this.mainContainer.resize();
		this.resizeAlready2();
	},
	'resizeAlready2':function()
	{
	},
	
	'startup2':function()
	{
		echo('chat startup2');
		//sucky hax
		setTimeout( function(thisObj){ thisObj.resizeAlready(); }, 400, this );
		if( this.startMeUp )
		{
			this.startMeUp = false;
			this.mainContainer.startup();
			//this.startup();
			
		}
	},

	'blank':null
}); }); //declare lwidgets.Chatroom
