///////////////////////////////////

// JS Spring Lobby Interface

// By CarRepairer

// License: GPL 2

///////////////////////////////////

define(
	'lwidgets/Chat',
	[
		"dojo/_base/declare",
		
		'dojo/query',
		'dojo/_base/array',
		'dojo/dom-construct',
		'dojo/dom-style',
		'dojo/dom-attr',
		'dojo/dom-geometry',
		'dojo/dom-class',
		'dojo/_base/lang',
		'dojo/topic',
		'dojo/_base/event',
		'dojo/on',
		
		'dijit/_WidgetBase',
		'dijit/_TemplatedMixin',
		'dijit/_WidgetsInTemplateMixin',
		
		'dijit/TooltipDialog',
		'dijit/ColorPalette',
		'dijit/form/Button',
		'dijit/form/DropDownButton',
		
		
		'lwidgets/ChatFormatForm',
		//extras
		
		'dojox/html/entities',
		//,'dojox/av/FLAudio'
		
		
	],
	function(declare,
		query,
		array, domConstruct, domStyle, domAttr, domGeom, domClass, lang, topic, event, on,
		WidgetBase, Templated, WidgetsInTemplate,
		TooltipDialog, ColorPalette, Button, DropDownButton,
		
		ChatFormatForm
		){
	return declare([ WidgetBase, Templated, WidgetsInTemplate ], {
	
	
	subscriptions: null,
	
	mainContainer: null,
	messageNode: '',
	name: '',
	nick: '',
	
	chatQueue: null,
	prevCommands: null,
	curPrevCommandIndex: 0,
	
	startMeUp: true,
	
	users: null,	//mixed in
	settings: null,
	
	nickCompleteIndex: 0,
	nickCompleteWord: '',
	nickCompleteNicks: null,
	allowNotifySound: true,
	
	lastNickSourceShown: '',
	
	
	postCreate : function()
	{
		this.prevCommands = [];
		this.subscriptions = [];
		this.chatQueue = [];

		//setTimeout( function(thisObj){ topic.publish('SetChatStyle') }, 1000, this );
		
		this.addSubscription( this.subscribe('SetNick', 'setNick' ) );
		this.addSubscription( this.subscribe('Lobby/setAllowNotifySound', 'setAllowNotifySound' ) );
		this.addSubscription( this.subscribe('Chat/scrollChats', 'scrollToBottom' ) );
		
		//dumb hax
		/**/
		this.addSubscription( this.subscribe('ResizeNeeded', function(){
			setTimeout( function(thisObj){
				thisObj.resizeAlready();
			}, 1, this );
		} ) );
		/**/
		//this.addSubscription( this.subscribe('ResizeNeeded', 'resizeAlready' ) );
		
		this.addSubscription( this.subscribe('Lobby/chime', function(data){
			this.addLine( data.chimeMsg, 'chatAlert' );
		} ) );
		
		this.messageNode.on('mouseup', lang.hitch(this, 'messageNodeMouseUp'))
		
		this.postCreate2();

	},
	
	showLog: function()
	{
		domConstruct.create('hr', {}, this.messageNode.domNode, 'first' )
		domConstruct.create('div', { innerHTML: this.log.replace(/\n/g, '<br />') }, this.messageNode.domNode, 'first' )
	},
	
	setAllowNotifySound: function( val )
	{
		this.allowNotifySound = val;
	},
	
	destroyMe: function()
	{
		if( this.playerListNode )
		{
			//fixme: restore this. add userlist destroyme, remove subscriptions from userlist on destroy
			
			//echo('destroy playerlist error')
			//this.playerListNode.destroyRecursive();	
		}
		
		if( this.subscriptions )
		{
			array.forEach(this.subscriptions, function(subscription){
				subscription.remove()
			});
		}
		//echo('destroy chat error')
		//this.destroyRecursive();
		
	},
	
	setNick: function(data)
	{
		this.nick = data.nick;
	},
	
	addSubscription: function( handle )
	{
		this.subscriptions.push( handle );
	},
	
	postCreate2: function()
	{
	},
	
	getSelectedText: function()
	{
		var html = "";
		if (typeof window.getSelection != "undefined") {
			var sel = window.getSelection();
			if (sel.rangeCount) {
				var container = document.createElement("div");
				for (var i = 0, len = sel.rangeCount; i < len; ++i) {
					container.appendChild(sel.getRangeAt(i).cloneContents());
				}
				html = container.innerHTML;
			}
		} else if (typeof document.selection != "undefined") {
			if (document.selection.type == "Text") {
				html = document.selection.createRange().htmlText;
			}
		}
		return html;
	},
	messageNodeMouseUp: function(e)
	{
		if( this.getSelectedText() !== '' )
		{
			return;
		}
		this.focusTextNode();
	},
	
	focusTextNode: function(e)
	{
		this.textInputNode.focus();
	},
	
	keydown: function(e)
	{
		var cursorPos, curText, words, curWord, curTextLeft, curTextRight, joinedNicks
		if(e.keyCode === 9) //tab
		{
			event.stop(e);
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
	
	keyup: function(e)
	{
		var prevCommand;
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
		if(e.keyCode === 13)
		{
			this.sendMessageInInput();
		}
		
	},
	sendButtonClick: function()
	{
		this.sendMessageInInput();
	},
	/*
	growIcon:function(e)
	{
		domAttr.set( e.target, 'width', 18 )
	},
	shrinkIcon:function(e)
	{
		domAttr.set( e.target, 'width', 16 )
	},
	*/
	
	sendMessageInInput: function()
	{
		this.curPrevCommandIndex = -1;
		msg = this.textInputNode.value;
	
		this.prevCommands.remove(msg);
		this.prevCommands.unshift(msg);
		if( this.prevCommands.length > 20 )
		{
			this.prevCommands.pop();
		}
		
		this.sendMessage(msg);
		this.textInputNode.value = '';
	},

	ircCommands:
	{
		'/help': function(args)
		{
			var content = domConstruct.create('div', {innerHTML: '<h3>Supported IRC-style commands:</h3><table border=0>' +
				'<tr><td>/help</td><td>show this message</td></tr>' +
				'<tr><td>/me &lt;MESSAGE&gt;</td><td>show detachment by talking about yourself in the 3rd person</td></tr>' +
				'<tr><td>/join &lt;CHANNEL&gt;</td><td>join a channel</td></tr>' +
				'<tr><td>/leave</td><td>leave the current channel</td></tr>' +
				'<tr><td>/msg &lt;NICK&gt; &lt;MESSAGE&gt;</td><td>send a private message to the user</td></tr>' +
				'<tr><td>/away</td><td>force afk status</td></tr>' +
				'<tr><td>/back</td><td>set non-afk status after the long trip to the kitchen</td></tr>' +
				'<tr><td>/raw &lt;MESSAGE&gt;</td><td>send a raw message to the server</td></tr></table>' });
			var closeBtn = new dijit.form.Button( {label: 'Close', style:
				{ display: 'block', width: '8em', margin: 'auto' } } ).placeAt(content);
			var dlg = new dijit.Dialog({
				title: "Help",
				style: { maxWidth: '50em' },
				content: content
			});
			closeBtn.on('click', function() { dlg.hide(); } );
			dlg.show();
		},
		'/me': function(args)
		{
			var smsg = this.saystring + 'EX ' + this.name + ' ' + args.join(' ');
			topic.publish( 'Lobby/notidle', {} );
			topic.publish( 'Lobby/rawmsg', {msg: smsg } );
		},
		'/join': function(args)
		{
			if( !args[0] )
			{
				lang.hitch(this, this.ircCommands['/help'])();
				return;
			}
			// TODO: make Lobby/chat/addroom send the JOIN command for better symmetry.
			// Lobby/chat/remroom sends LEAVE.
			topic.publish( 'Lobby/rawmsg', { msg: 'JOIN ' + args[0].replace(/^#/, '') } );
		},
		'/leave': function(args)
		{
			topic.publish( 'Lobby/chat/remroom', { name: this.name } );
		},
		'/msg': function(args)
		{
			if( !args[0] || !args[1] )
			{
				lang.hitch(this, this.ircCommands['/help'])();
				return;
			}
			topic.publish( 'Lobby/chat/addprivchat', {name: args[0] } );
			topic.publish( 'Lobby/chat/privmsg/' + args[0], { msg: args.slice(1).join(' ') } );
		},
		'/away': function(args)
		{
			this.users[ this.nick ].setStatusVals( {isAway : true } );
			this.users[ this.nick ].sendStatus();
		},
		'/back': function(args)
		{
			topic.publish( 'Lobby/notidle', {} );
		},
		'/raw': function(args)
		{
			if( !args[0] )
			{
				lang.hitch(this, this.ircCommands['/help'])();
				return;
			}
			topic.publish( 'Lobby/rawmsg', { msg: args.join(' ') } );
		}
	},
	
	sendMessage: function(msg)
	{
		var msg_arr;
		
		msg_arr = msg.split(' ');
		
		if( msg_arr[0][0] == '/' )
		{
			if( this.ircCommands[msg_arr[0]] )
			{
				lang.hitch(this, this.ircCommands[msg_arr[0]])( msg_arr.slice(1) );
			}
			else
			{
				lang.hitch(this, this.ircCommands['/help'])( msg_arr.slice(1) );
			}
		}
		else
		{
			this.say( msg );
		}
		
	},
	
	say: function(msg)
	{
		var smsg;
		
		//msg = msg.replace( new RegExp( this.formatPlaceholderChar + this.formatPlaceholderChar , 'g') , '\x0F' );
		msg = msg.replace( new RegExp( this.formatPlaceholderChar, 'g') , '\x03' );
		smsg = this.saystring + ' ' + (this.name == '' ? '' : this.name + ' ') + msg;
		topic.publish( 'Lobby/notidle', {} );
		topic.publish( 'Lobby/rawmsg', {msg: smsg } );
	},
	
	safeSayTimeout:null,
	safeSay:function(str)
	{
		if( this.safeSayTimeout !== null )
		{
			return;
		}
		this.safeSayTimeout = setTimeout( function(thisObj){ thisObj.safeSayTimeout = null; }, 6000, this );
		this.say(str);
	},

	
	scrollToBottom: function()
	{
		var node = this.messageNode.domNode;
		node.scrollTop = node.scrollHeight - node.clientHeight;
	},

	flushChatQueue: function()
	{
		var i;
		if( domGeom.position(this.messageNode.domNode).w === 0 )
		{
			return;
		}
		while( (i = this.chatQueue.shift()) !== undefined )
		{
			this.addLineNode( i.line, i.lineClass, i.timeStamp, i.source );
		}
	},
	
	
	writeLog: function( type, logFile, line )
	{
		topic.publish( 'Lobby/writeLog', type, logFile, line )
	},
	
	//mircToHtml() by PennyBreed @ irc.nuphrax.com
	//----------------------------------------------
	mircToHtml: function(text) {
		var cbf, cbg;
		//control codes
		var rex = /\003([0-9]{1,2})[,]?([0-9]{1,2})?([^\003\017]+)/,matches,colors;
		if (rex.test(text)) {
			while (cp = rex.exec(text)) {
				
				cbf = cp[1];
				if (cbf.charAt(0) === '0' && cbf.charAt(1) !== '' )
				{
					cbf = cbf.charAt(1);
				}
				
				
				if (cp[2]) {
					cbg = cp[2];
					if (cbg.charAt(0) === '0' && cbg.charAt(1) !== '' )
					{
						cbg = cbg.charAt(1);
					}
					
				}
				
				var text = text.replace(cp[0],'<span class="fg'+cbf+' bg'+cbg+'">'+cp[3]+'</span>');
			}
		}
		//bold,italics,underline (more could be added.)
		var bui = [
			[/\002([^\002]+)(\002|\017)?/, ["<b>","</b>"]],
			[/\037([^\037]+)(\037|\017)?/, ["<u>","</u>"]],
			[/\035([^\035]+)(\035|\017)?/, ["<i>","</i>"]]
		];
		for (var i=0;i < bui.length;i++) {
			var bc = bui[i][0];
			var style = bui[i][1];
			if (bc.test(text)) {
				while (bmatch = bc.exec(text)) {
					var text = text.replace(bmatch[0], style[0]+bmatch[1]+style[1]);
				}
			}
		}
		return text;
	},
		
	addLine: function(line, lineClass, timeStamp, source )
	{
		var date, timeStamp2;

		date = new Date();
		if( timeStamp && timeStamp !== 'Offline' )
		{
			date = new Date( Date.parse(timeStamp) - (new Date()).getTimezoneOffset()*60000 );
		}
		timeStamp2 = '[' + date.toLocaleTimeString().replace(/ [A-Z][A-Z][A-Z].*$/, '') + ']';
		
		if( source !== null && typeof source !== 'undefined' )
		{
			this.writeLog( this.chatType, this.name, timeStamp2 + ' '+ source +': ' + dojox.html.entities.decode(line) );
		}

		if( source !== this.nick && this.nick !== '' && line.toLowerCase().search( this.convertedNick() ) !== -1 &&
			this.settings.settings.nickHiliteSound && this.allowNotifySound )
		{
			playSound('./sound/alert.mp3')
		}
		
		if( timeStamp )
		{
			timeStamp2 = '<i>' + timeStamp2 + '</i>';
		}

		// If this chat is hidden, don't add the message node yet.
		if( domGeom.position(this.messageNode.domNode).w === 0 )
		{
			this.chatQueue.push({
				line: line,
				lineClass: lineClass,
				timeStamp: timeStamp2,
				source: source
			});
		}
		else
		{
			this.addLineNode(line, lineClass, timeStamp2, source);
		}
	},

	addLineNode: function(line, lineClass, timeStamp, source )
	{
		var toPlace, newNode;
		var sourceStyle;
		var sourceClass;
		var sourceOut;
		var lineSourceDiv, lineMessageDiv, timeStampDiv, selectLink
		var sourceLink, sourceLinkStyle;

		toPlace = this.messageNode.domNode;
		
		if( source === null || typeof source === 'undefined' )
		{
			source = ''
		}
		if( lineClass === null || typeof lineClass === 'undefined' )
		{
			lineClass = ''
		}
		
		sourceOut = '***' + source;
		sourceStyle = '';
		sourceLinkStyle = '';
		sourceClass = '';
		
		if( lineClass === 'chatJoin' );
		else if( lineClass === 'chatLeave' );
		else if( lineClass === 'chatMine' )
		{
			sourceOut = source;
			sourceStyle = {
				//borderRight: '1px solid ' + this.settings.settings.mainTextColor
			};
			if( typeof this.playerListNode !== 'undefined' )
			{
				sourceLink = true;
				sourceLinkStyle = {
					textDecoration: 'none',
				}
			}
			sourceClass = 'chatNick';
		}
		else if( lineClass === 'chatAction' )
		{
			
			sourceOut = '*';
			line = source + ' ' + line;
			sourceClass = lineClass;
		}
		else if( lineClass === 'chatAlert' )
		{
			sourceClass = lineClass;
		}
		else
		{
			if( typeof this.playerListNode !== 'undefined' )
			{
				sourceLink = true;
				sourceLinkStyle = {
					textDecoration: 'none',
				}
			}
			
			sourceOut = source
			sourceStyle = {
				//borderRight: '1px solid ' + this.settings.settings.mainTextColor
			};
			sourceClass = 'chatNick';
		}
		
		if( sourceStyle === '' )
		{
			sourceClass = lineClass;
		}
		
		sourceOut = dojox.html.entities.encode(sourceOut) + '&nbsp;';
		
		if( source !== this.nick && this.nick !== '' && line.toLowerCase().search( this.convertedNick() ) !== -1 )
		{
			lineClass = 'chatAlert';
		}
		
		line = makeLinks(line, this.settings.settings.linkColor);
		
		newNode = domConstruct.create('div', {
			class: 'chatMessage'
		}, toPlace )
		
		timeStampDiv= domConstruct.create('div', {
			innerHTML: timeStamp + '&nbsp;',
			class: 'messageTimeStamp'
		}, newNode );
		
		lineSourceDiv = domConstruct.create('div', {
			innerHTML: '&nbsp;',
			class: 'messageSource'
		}, newNode );
		
		
		if(
			lineClass === 'chatAction'				//show source if action
			|| source === ''						//show source if any alert
			|| source !== this.lastNickSourceShown	//show source if speaker is different from previous speaker
		)
		{
			if( sourceLink )
			{
				selectLink = domConstruct.create('a', {
					innerHTML: sourceOut,
					style: sourceLinkStyle,
					class: sourceClass,
					href: '#',
					onclick: lang.hitch(this, function(e){
						event.stop(e);
						this.playerListNode.selectUser(source)
					})
				}, lineSourceDiv, 'only' );
			}
			else
			{
				domAttr.set(lineSourceDiv, {
					innerHTML: sourceOut,
					class: 'messageSource ' + sourceClass
				})
			}
			
			if( lineClass !== 'chatAction' && source !== '' )
			{
				this.lastNickSourceShown = source;
			}
			
			if( source === '' )
			{
				this.lastNickSourceShown = '';
			}
		}
		
		line = this.mircToHtml(line);

		lineMessageDiv = domConstruct.create('div', {
			innerHTML: line,
			class : 'messageText ' + lineClass,
			style: {
				maxWidth: (domGeom.position(newNode).w - domGeom.position(timeStampDiv).w -
					domGeom.position(lineSourceDiv).w - 10) + 'px'
			}
		}, newNode );
		if( lineClass === 'chatMine' || lineClass === '' )
		{
			domStyle.set(lineMessageDiv, { 
				borderLeft: '1px solid ' + this.settings.settings.mainTextColor
			});
		}
		
		//add icon to load image
		query('a', lineMessageDiv).forEach(lang.hitch(this, 'decorateLink'));
		
		//fixme: hidden join/leaves will cause confusing removal of chat lines
		while( toPlace.children.length > parseInt(this.settings.settings.chatLogSize) )
		{
			domConstruct.destroy( toPlace.firstChild );
		}

		var node = this.messageNode.domNode;
		if( node.scrollTop > node.scrollHeight - node.clientHeight * 1.2 )
		{
			this.scrollToBottom();
		}
	},
	
	playerMessage: function( data )
	{
		var pname, msg, lineClass, nameStyle, nameClass, timeStamp;
		var source;
		
		if(data.channel !== this.name && data.userWindow !== this.name && data.battle === undefined )
		{
			return;
		}
		
		msg = data.msg;
		msg = dojox.html.entities.encode(msg);
		pname = data.name;
		
		source = pname;
		
		lineClass = '';
		
		if(data.ex)
		{
			lineClass = 'chatAction';
		}
		else if(pname == this.nick)
		{
			lineClass = 'chatMine';
		}
		
		timeStamp = data.time ? data.time : false;
		
		this.addLine( msg, lineClass, timeStamp, source );
	},

	decorateLink: function( linkNode )
	{
		var href
		var showLink, showLinkImg;
		var youtubeMatch
		var youtubeMatch2
		var youtubeId
		
		href = linkNode.href
		if( href.search('\.(bmp|gif|ico|jpg|jpeg|png)$') !== -1 )
		{
			showLink = domConstruct.create( 'a', {
				href: '#',
				onclick: lang.hitch(this, function(e){
					var newImg
					event.stop(e)
					newImg = domConstruct.create('img', {
						align: 'top',
						src: href,
						onload: lang.hitch(this, function(){
							this.scrollToBottom();
						})
					})
					domConstruct.place( newImg, linkNode, 'only' );
					domConstruct.destroy(showLink);
				})
			} );
			
			showLinkImg = domConstruct.create( 'img', {
				src: 'img/webdown.png',
				align: 'top',
				onload: lang.hitch(this, function(){
					this.scrollToBottom();
				})
			}, showLink);
			
			domConstruct.place( showLink, linkNode, 'after' );
			
		} //linkNode.href.search
		else if( href.search('^spring://') !== -1 )
		{
			var joinBattleMatch, player;
			joinBattleMatch = href.match( /@join_player:(.*)/);
			playerName = joinBattleMatch[1];
			
			
			var user = this.users[ playerName ]
			on(linkNode, 'click',lang.hitch(this, function( battleId, e ){
				event.stop(e);
				topic.publish('Lobby/battles/joinbattle', battleId );
				return false;
			}, user.battleId ));
			
		}
		else
		{
			youtubeMatch = href.match( /^http:\/\/www\.youtube\.com\/watch\?v=(.*)$/);
			youtubeMatch2 = href.match( /^http:\/\/youtu\.be\/(.*)$/);
			
			youtubeId = '';
			if( youtubeMatch && youtubeMatch.length > 1 )
			{
				youtubeId = youtubeMatch[1];
			}
			if( youtubeMatch2 && youtubeMatch2.length > 1 )
			{
				youtubeId = youtubeMatch2[1];
			}
			
			if( youtubeId !== '' )
			{
				showLink = domConstruct.create( 'a', {
					href: '#',
					onclick: lang.hitch(this, function(e){
						var newImg
						var youtubeVid
						event.stop(e)
						
						youtubeVid = domConstruct.create('iframe',{
							width: "560",
							height: "315",
							src: "http://www.youtube.com/embed/" + youtubeId,
							frameborder: "0",
							allowfullscreen: 'allowfullscreen',
							
							//does below work?
							onload: lang.hitch(this, function(){
								this.scrollToBottom();
							})
						})
						domConstruct.place( youtubeVid, linkNode, 'after' );
						
						domConstruct.place( youtubeVid, linkNode, 'only' );
						domConstruct.destroy(showLink);
					})
				} );
				
				showLinkImg = domConstruct.create( 'img', {
					src: 'img/youtube.png',
					align: 'top',
					onload: lang.hitch(this, function(){
						this.scrollToBottom();
					})
				}, showLink);
				
				domConstruct.place( showLink, linkNode, 'after' );
			
			
				
			}
		}
	},
	
	//because .search treats [] as though it's a character class for a regular expression, even if the parameter is a plain string!?
	convertedNick: function()
	{
		return this.nick.toLowerCase().replace( /\[/, '\\[' ).replace( /\]/, '\\]' )
	},
	
	//stupid hax
	resizeAlready: function()
	{
		this.mainContainer.resize();
		this.resizeAlready2();
	},
	resizeAlready2: function()
	{
	},
	
	startup2: function()
	{
		//sucky hax
		if( this.startMeUp )
		{
			this.startMeUp = false;
			this.mainContainer.startup();
		}
	},
	
	formatPlaceholderChar:'\u2665',
	
	selectColor:function(formatType, fColor, bColor)
	{	
		if( bColor !== '' )
		{
			bColor = ',' + bColor
		}
		
		var cursorPos, cursorEnd, curText, curTextLeft, curTextRight
		
		cursorPos = this.textInputNode.selectionStart;
		cursorEnd = this.textInputNode.selectionEnd;
		
		curText = this.textInputNode.value;
		curTextLeft = curText.substring(0,cursorPos);
		curTextRight = curText.substring(cursorEnd);
		curTextSelected = curText.substring(cursorPos, cursorEnd );
		
		var colorCode = this.formatPlaceholderChar + fColor + bColor
		var colorCodeEnd = this.formatPlaceholderChar;
		
		if (cursorPos != cursorEnd)
		{
			this.textInputNode.value = curTextLeft + colorCode + curTextSelected + colorCodeEnd + curTextRight;
			
			this.textInputNode.selectionStart = curTextLeft.length + colorCode.length;
			this.textInputNode.selectionEnd = curTextLeft.length + colorCode.length + curTextSelected.length;
		}
		else
		{
			this.textInputNode.value = curTextLeft + colorCode + curTextRight;
			
			this.textInputNode.selectionStart = curTextLeft.length + colorCode.length;
			this.textInputNode.selectionEnd = curTextLeft.length + colorCode.length;
		}
		
		
		
	},
	
	blank: null
}); }); //declare lwidgets.Chatroom
