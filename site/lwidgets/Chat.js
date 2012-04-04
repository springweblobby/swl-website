///////////////////////////////////

// JS Spring Lobby Interface

// By CarRepairer

// License: GPL 2

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
		this.subscriptions = [];

		setTimeout( function(thisObj){ dojo.publish('SetChatStyle') }, 1000, this );
		
		this.addSubscription( dojo.subscribe('SetNick', this, function(data){ this.nick = data.nick } ) );
		
		//dumb hax
		/**/
		this.addSubscription( dojo.subscribe('ResizeNeeded', this, function(){
			setTimeout( function(thisObj){
				thisObj.resizeAlready();
			}, 1, this );
		} ) );
		/**/
		//this.addSubscription( dojo.subscribe('ResizeNeeded', this, 'resizeAlready' ) );
		
		this.addSubscription( dojo.subscribe('Lobby/chime', this, function(data){
			var lineStyle, lineClass
			lineStyle = {'color':this.settings.fadedColor };
			lineClass = 'chatMine';
			this.addLine( data.chimeMsg, lineStyle, lineClass );
		} ) );
		
		
		this.postCreate2();

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
	
	'addSubscription':function( handle )
	{
		this.subscriptions.push( handle );
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
		var toPlace, newNode, date, timestamp, line_ts, line_clean;
		date = new Date();
		timestamp = '[' + date.toLocaleTimeString() + ']';
		toPlace = this.messageNode.domNode;
		
		line = makeLinks(line, this.settings.settings.chatNickColor);
		
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
					+ dojox.html.entities.encode('<' + pname + '>')
					+ '</span> '
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
		//sucky hax
		if( this.startMeUp )
		{
			this.startMeUp = false;
			this.mainContainer.startup();
		}
	},

	'blank':null
}); }); //declare lwidgets.Chatroom
