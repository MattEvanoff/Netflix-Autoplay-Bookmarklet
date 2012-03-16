javascript:(function(netflix, undefined) {
	var seasonId = 0,
	episodeId = 0,
	numWatched = 0,
	numToWatch = 3,
	epIdRegex = /,EpisodeMovieId=\d*,/,
	idregx = /\d+/,
	done = false,
	sl,
	init,
	currrentEpisodeId,
	currentMovieId,
	seasons,
	showData,
	waitTimer,
	node;	

	if(!netflix || !netflix.Silverlight || !netflix.Silverlight.MoviePlayer || !netflix.Silverlight.MoviePlayer.getPlugin() || !netflix.Silverlight.MoviePlayer.getPlugin().settings.initParams) {
		alert('You do not appear to have a show playing, please start a show first');
		return;
	}

	//grab the things we need
	sl = netflix.Silverlight.MoviePlayer.getPlugin().getScriptInterface();
	init = netflix.Silverlight.MoviePlayer.getPlugin().settings.initParams;
	currrentEpisodeId = parseInt(idregx.exec(epIdRegex.exec(init)), 10);
	currentMovieId = parseInt(netflix.Silverlight.MoviePlayer.getPlugin().settings.movieId, 10);

	//Check if the user has already loded teh bookmarklet
	var autoplayElement = document.getElementById('NetflixAutoplay');
	if(autoplayElement) {
		alert('You have already loaded the autoplay bookmarklet, click the text at the botton to change number of episodes.');
		return;
	}

	//grab the metadata and decode it
	try {
		showData = JSON.parse(decode64(netflix.Silverlight.MoviePlayer.getPlugin().settings.metadata));
	} catch(e) {
		alert('Error processing data =(');
		return;
	}

	if(showData.Movie) {
		alert('This appears to be a movie not a TV show.  This bookmarklet only works on TV show.');
		return;
	}

	//set our pointest to match the episode we are currently on
	seasons = showData.Show.Seasons;
	for(seasonId = 0; seasonId < seasons.length; seasonId++) {
		for(episodeId = 0; episodeId < seasons[seasonId].Episodes.length; episodeId++) {
			if(seasons[seasonId].Episodes[episodeId].MovieId === currentMovieId || seasons[seasonId].Episodes[episodeId].MovieId === currrentEpisodeId) {
				done = true;
				break;
			}
		}
		if(done) {
			break;
		}
	}

	//check if we were able to find the episode the user is  on
	if(seasonId === seasons.length) {
		alert('Error: Already of final episode, or episode data could not be found.');
		return;
	}	

	//Prompt user for number of episodes
	function getNumberOfEpisodesToWatch() {
		var newNum;
		do {
			newNum = prompt('How many episodes would you like to play?', (numToWatch - numWatched));
		} while (isNaN(newNum));

		numWatched = 0;
		numToWatch = parseInt(newNum, 10);

		//set the text
		if(numToWatch > 0) {
			autoplayElement.innerHTML = 'Netflix autoplay on, Episodes left: ' + numToWatch;
		} else {
			autoplayElement.innerHTML = 'Netflix autoplay off';
		}
	}	

	//create the text that shows how many episodes left & insert it
	node = document.createElement('span');
	autoplayElement = document.body.appendChild(node);
	autoplayElement.id = 'NetflixAutoplay';
	autoplayElement.innerHTML = 'Netflix autoplay on, Episodes left: ' + numToWatch;

	//attach a click handler so people can change number of episodes
	autoplayElement.addEventListener('click', getNumberOfEpisodesToWatch, false);

	//prompt the user for number of episodes for the first time
	getNumberOfEpisodesToWatch();

	//handle when the episode ends
	sl.OnMovieWatched = function() {
		if(numWatched < numToWatch && !waitTimer) {			//Check if done autoplaying
			waitTimer = setTimeout(function() {				//Set our timer so we do not end early
				var epp, numLeft;

				//move episode/season counters properly
				if(seasons[seasonId].Episodes[episodeId+1]) {
					episodeId++;
				} else {
					episodeId = 0;
					seasonId++;
				}	

				//if there is a next episode, grab it
				if(seasons[seasonId] && seasons[seasonId].Episodes[episodeId]) {
					epp = seasons[seasonId].Episodes[episodeId];
				}

				//if there is a next episode, play it and update the text
				if (epp) {
					sl.PlayMovie({movieId: epp.MovieId, episodeMovieId: 0, trackId: 0});
					numWatched++;
					numLeft = numToWatch - numWatched;
					if(numLeft > 0) {
						autoplayElement.innerHTML = 'Netflix autoplay on, Episodes left: ' + numLeft;
					} else {
						autoplayElement.innerHTML = 'Netflix autoplay completed.';
					}
				}

				//cleanup
				clearTimeout(waitTimer);
				waitTimer = null;
			}, 2*60*1000);
		}
	};

	//This is just a bse64 decoder
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
})(window.netflix);