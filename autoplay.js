(function(undefined){

	//Takes our countdown timer and converts it to mm:ss and displays to user
	function updateTime() {
		var seconds = (countdownTimer % 60) + '';
		if(seconds.length === 0)
			seconds = '00';
		else if(seconds.length === 1)
			seconds = '0' + seconds;

		timerNode.innerHTML = Math.floor(countdownTimer / 60) + ':' + seconds;
	}

	//Grabs the data for the episode matching the ID passed in
	function getCurrentEpisodeData(episodeId) {
		var episode, i = 0, j = 0;

		if(episodeData && episodeData.video && episodeData.video.seasons) {
			for(i=0; i<episodeData.video.seasons.length; i++) {
				for(j=0; j<episodeData.video.seasons[i].episodes.length; j++) {
					if(episodeData.video.seasons[i].episodes[j].id === episodeId) {
						episode = episodeData.video.seasons[i].episodes[j];
						break;
					}
				}
				if(episode)
					break;
			}
		}

		return episode;
	}

	//Grabs the data for the episode following the one with the ID passed in
	function getNextEpisodeData(episodeId) {
		var episode, i = 0, j = 0, found = false;

		if(episodeData && episodeData.video && episodeData.video.seasons) {
			for(i=0; i<episodeData.video.seasons.length; i++) {
				for(j=0; j<episodeData.video.seasons[i].episodes.length; j++) {
					if(episodeData.video.seasons[i].episodes[j].id === episodeId) {
						found = true;
					}
					else if(found) {
						episode = episodeData.video.seasons[i].episodes[j];
						break;
					}
				}
				if(episode)
					break;
			}
		}

		return episode;
	}

	//base64 decoder
	function decode64(input) {
		var keyStr = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=',
		output = '',
		chr1, chr2, chr3 = '',
		enc1, enc2, enc3, enc4 = '',
		i = 0,
		base64test = /[^A-Za-z0-9\+\/\=]/g;

		input = input.replace(base64test, '');

		do {
			enc1 = keyStr.indexOf(input.charAt(i++));
			enc2 = keyStr.indexOf(input.charAt(i++));
			enc3 = keyStr.indexOf(input.charAt(i++));
			enc4 = keyStr.indexOf(input.charAt(i++));

			chr1 = (enc1 << 2) | (enc2 >> 4);
			chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
			chr3 = ((enc3 & 3) << 6) | enc4;

			output = output + String.fromCharCode(chr1);

			if (enc3 != 64) {
				output = output + String.fromCharCode(chr2);
			}
			if (enc4 != 64) {
				output = output + String.fromCharCode(chr3);
			}

			chr1 = chr2 = chr3 = '';
			enc1 = enc2 = enc3 = enc4 = '';

		} while (i<input.length);

		return unescape(output);
	}

	if(window.NetflixAutoplayLoaded) {
		alert('Autoplay already loaded.');
		//return false;
	} else {
		window.NetflixAutoplayLoaded = true;
	}

	//resize the player so we can see the text we are about to insert under it
	document.getElementById('SLPlayer').style.height = (window.innerHeight - 35) + 'px';
	document.getElementById('SLPlayerWrapper').style.height = (window.innerHeight - 35) + 'px';
	document.getElementById('page-content').style.height = (window.innerHeight - 35) + 'px';

	//create the text and other shizzy we want
	var autoplayElement = document.body.appendChild(document.createElement('div'));
	autoplayElement.id = 'NetflixAutoplayContainer';
	autoplayElement.innerHTML = '<div id="NetflixAutoplay"></div> <div id="NetflixAutoplayTimerContainer">Time left until switch: <span id="NetflixAutoplayTimer">00:00</span> <span id="NetflixAutoPauser">||</span> <span id="NetflixAutoDelay" contentEditable="true">-</span></div>';
	var timerNode = document.getElementById('NetflixAutoplayTimer');
	var autoplayText = document.getElementById('NetflixAutoplay');
	var pauseButton = document.getElementById('NetflixAutoPauser');
	var delay = document.getElementById('NetflixAutoDelay');

	//the number of seconds to wait for the show to buffer on load
	var timerDelay = 10; 

	//Pull the current episode information and the full series data for us
	var episodeData = JSON.parse(decode64(netflix.Silverlight.MoviePlayer.getPlugin().settings.metadata));
	var currentEppId = (/,EpisodeMovieId=\d*/.exec(netflix.Silverlight.MoviePlayer.getPlugin().settings.initParams)[0]).split('=')[1];

	//gets data for current & next epps
	var currentEpp = getCurrentEpisodeData(currentEppId);
	var nextEpp = getNextEpisodeData(currentEpp.id);

	var paused = false; //bool to see if paused
	var done = false; //bool to see if finished autoplay
	var editingTime = false; //bool to check if user is editing time

	//Javascript to execute to change episode
	var ini = document.getElementsByTagName('script');
	ini = ini[ini.length-1].innerHTML;

	//Set the countdown till next episode + the pause we need for buffer
	function updateCountdown() {
		countdownTimer = parseInt(currentEpp.runtime, 10) + timerDelay;
	}	

	var countdownTimer = 0; //episode length timer
	updateCountdown(); //Sets the count down timer for current episode

	//Prompt user for number of episodes
	var numToWatch = 3;
	function getNumberOfEpisodesToWatch() {
		var newNum;
		do {
			newNum = prompt('How many episodes would you like to play?', numToWatch);
		} while (isNaN(newNum));

		numToWatch = parseInt(newNum, 10);

		//set the text
		if(numToWatch > 0) {
			autoplayText.innerHTML = 'Netflix autoplay on, Episodes left: ' + numToWatch;

			if(done) { //if we have already finished, restart
				done = false;
				switchEpps();
			}
		} else {
			autoplayText.innerHTML = 'Netflix autoplay off';
		}
	}

	//ask the user for the number of episodes they want
	getNumberOfEpisodesToWatch();

	//handler for pause button
	function pause() {
		if(pauseButton.innerHTML === '||') {
			paused = true;
			pauseButton.innerHTML = '>';
		} else {
			paused = false;
			pauseButton.innerHTML = '||';
		}
	}

	//handles editing the buffer delay
	function delayEdit(e) {
		if((!e.keyCode || e.keyCode === 13) && !isNaN(delay.innerHTML)) {
			timerDelay = parseInt(delay.innerHTML, 10);

			if (!e) var e = window.event;
			e.cancelBubble = true;
			if (e.stopPropagation) e.stopPropagation();
			return false;
		}
	}

	//handler for editing time left to play
	function editTime(e) {
		timerNode.contentEditable=true;
		editingTime = true;

		if (!e) var e = window.event;
		e.cancelBubble = true;
		if (e.stopPropagation) e.stopPropagation();
		return false;
	}

	//handles updating time left to play after user edit
	function endEdit(e) {
		if(timerNode.contentEditable.toString() === 'true' && (e.type === 'blur' || e.keyCode === 13)) {
			timerNode.contentEditable = false;
			editingTime = false;

			var time = timerNode.innerHTML;
			if(time.indexOf(':') >0) { //converts minutes:seconds into time
				time = time.split(':');
				countdownTimer = parseInt(time[0], 10)*60 + parseInt(time[1], 10);
			} else {					//converts just seconds into time
				if(!isNaN(time)) {
					countdownTimer = parseInt(time, 10);
				}
			}

			if (!e) var e = window.event;
			e.cancelBubble = true;
			if (e.stopPropagation) e.stopPropagation();
			return false;
		}
	}

	//Does everything to change to the next episode
	function switchEpps() {
		//setup the script for the next epp
		ini = ini.replace(/,EpisodeMovieId=\d*/,',EpisodeMovieId=' + nextEpp.id);

		//switch out data to the new epps
		currentEpp = nextEpp;
		nextEpp = getNextEpisodeData(currentEpp.id);

		//Switch to next epp & update text
		if(currentEpp) {
			autoplayText.innerHTML = 'Netflix autoplay on, Episodes left: ' + numToWatch;
			updateCountdown();
			eval(ini);
			nextEppTimer();
		} else {
			autoplayText.innerHTML = 'There does not seem to be a next episode.';
		}
	}

	//Main loop, updates our timer and stuff, switches to next epp when necessary, yadayda
	function nextEppTimer() {
		setTimeout(function() {
			if(isNaN(countdownTimer) || isNaN(numToWatch)) {
				autoplayText.innerHTML = 'NUMBERS DO NOT WORK THAT WAY!  GOOD NIGHT!';
				nextEppTimer();
				return;
			}

			if(countdownTimer <= 0) {
				if(numToWatch-- > 0) {
					switchEpps();
				} else {
					done = true;
					autoplayText.innerHTML = 'Netflix autoplay completed.';
					numToWatch = 0;
				}
			} else {
				if(!editingTime && !paused) {
					countdownTimer--;
					updateTime();
				}
				nextEppTimer();
			}
		}, 1000);
	}

	//attach the events we need
	autoplayText.addEventListener('click', getNumberOfEpisodesToWatch, false);
	pauseButton.addEventListener('click', pause, false);
	timerNode.addEventListener('click', editTime, false);
	timerNode.addEventListener('blur', endEdit, false);
	timerNode.addEventListener('keypress', endEdit, false);
	delay.addEventListener('blur', delayEdit, false);
	delay.addEventListener('keyup', delayEdit, false);

	//START EVERYTHING!
	nextEppTimer();
})();