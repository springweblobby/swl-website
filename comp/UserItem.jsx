/** @jsx React.DOM
 *
 * An item in the UserList. It shows as much data as you give it, the only
 * required data field is user.name
 */

'use strict'

var _ = require('lodash');
var ModalWindow = require('./ModalWindow.jsx');
var Chat = require('../act/Chat.js');

module.exports = React.createClass({
	getInitialState: function(){
		return { displayingInfo: false };
	},
	handleClick: function(){
		this.setState({ displayingInfo: true });
	},
	handleClose: function(){
		this.setState({ displayingInfo: false });
	},
	timeDifference: function(t1, t0){
		var diff = Math.floor((t1 - t0) / 60000);
		return (Math.floor(diff / 60) > 0 ? Math.floor(diff / 60) + ' hours ' : '') + (diff % 60) + ' minutes';
	},
	renderInfoBox: function(){
		var user = this.props.user;
		var now = new Date();
		return (<ModalWindow title="User info" onClose={this.handleClose}>
		<div className="userInfoBox">
			<h1>{user.name}</h1>
			{user.away && user.awaySince ?
				<p><img src="img/away.png" />Away for {this.timeDifference(now, user.awaySince)}</p>
			: null}
			{user.inGame && user.inGameSince ?
				<p><img src="img/battlehalf.png" />In game for {this.timeDifference(now, user.inGameSince)}</p>
			: null}
			<p>
				<button onClick={_.partial(Chat.openPrivate, user.name)}>Open private conversation</button>
				<button>Join user's battle</button>
			</p>
		</div></ModalWindow>);
	},
	render: function(){
		var user = {
			cpu: 0,
		};
		_.extend(user, this.props.user);
		var frontPics = [];
		var backPics = [];

		// Country
		if (user.country)
			frontPics.push(<img src={'img/flags/' + user.country.toLowerCase() + '.png'} key="country" />);

		// Is a bot?
		if ('bot' in user)
			frontPics.push(<img src={user.bot ? 'img/robot.png' : 'img/soldier.png'} key="bot" />);

		// Away
		if (user['away'])
			backPics.push(<img src="img/away.png" key="away" />);

		// Lobby
		if ( _.indexOf( ['7777', '7778', '7779'], user.cpu ) !== -1 )
			backPics.push(<img src = "img/blobby2icon-small.png" title = "Spring Web Lobby" key="lobby" />);
		else if ( _.indexOf( ['6666', '6667', '6668'], user.cpu ) !== -1 )
			backPics.push(<img src = "img/zk_logo_square.png" title = "Zero-K Lobby" key="lobby" />);
		else if ( _.indexOf( ['9997', '9998', '9999'], user.cpu ) !== -1 )
			backPics.push(<img src = "img/notalobby.png" title = "NotaLobby" key="lobby" />);
		else if ( _.indexOf( ['8484'], user.cpu ) !== -1 )
			backPics.push(<img src = "img/mlclient.ico" title = "mlclient" key="lobby" />);
		else if ( _.indexOf( ['4607052', '4607063', '4607053'], user.cpu ) !== -1 )
			backPics.push(<img src = "img/flobby.png" title = "flobby" key="lobby" />);

		// OS
		if ( _.indexOf([ '7777', '9998', '6667', '4607063' ], user.cpu) !== -1 )
			backPics.push(<img src="img/windows.png" title = "Microsoft Windows" key="os" />);
		else if ( _.indexOf([ '7778', '9999', '6668', '4607052' ], user.cpu) !== -1 )
			backPics.push(<img src="img/linux.png" title = "Linux" key="os" />);
		else if ( _.indexOf([ '7779', '9997', '4607053' ], user.cpu) !== -1 )
			backPics.push(<img src="img/mac.png" title = "MacOS" key="os" />);

		return (<li className="userItem">
			<span className="userFrontPics">{frontPics}</span>
			<span className="userName" onClick={this.handleClick}>{user.name}</span>
			<span className="userBackPics">{backPics}</span>
			{this.state.displayingInfo ? this.renderInfoBox() : null}
		</li>);
	}
});
