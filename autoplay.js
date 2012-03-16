javascript:(function(){
	var eppsWatched = 1,
		movieIDrgx = /movieid=\d*[&amp;|#]/,
		trackIDrgx = /trkid=\d*[&amp;|#]/,
		episoIDrgx = /episodeMovieId=\d*[&amp;|#]/,
		idregx = /\d+/,
		epps, movieId, trkId, eppId, sl, tmp;

	//grab netflix JS interface for player
	try {
		sl = netflix.Silverlight.MoviePlayer.getPlugin().getScriptInterface() || false;
	} catch (e) {
		sl = false;
	}		

	if(!sl) {
		alert('Please start the first episode you wish to watch.');
	} else {
		epps = prompt('How many episodes would you like to play?', '3'),
		//number of episodes the user wants to watch
		epps = parseInt(epps, 10);

		//extract the IDs from the url
		movieId = parseInt((idregx.exec(movieIDrgx.exec(window.location)) || [0])[0], 10);
		eppId 	= parseInt((idregx.exec(episoIDrgx.exec(window.location)) || [0])[0], 10);
		trkId 	= parseInt((idregx.exec(trackIDrgx.exec(window.location)) || [0])[0], 10);

		//add even to movie finished
		sl.OnMovieWatched = function() {
			var waiting = null; //make our timeer

			//check if we have finished watching
			if(eppsWatched < epps) {
				//move to the next episode
				if(trkId !== 0) {
					trkId++;
				}
				if(eppId !== 0) {
					eppId++;
				}
				if(movieId !== 0) {
					movieId++;
				}			

				if(!waiting) { //this event triggers about 2 minutes before the end of a show - and multiple times, my guess it is how they move their index to know they should start with the next epp next time
					waiting = setTimeout(function() {
						//tell netflix to play the next epp
						sl.PlayMovie({movieId: movieId, episodeMovieId: eppId, trackId: trkId});

						//increment our episode counter
						eppsWatched++;

						clearTimeout(waiting);
						waiting = null;
					},2*60*1000);
				}
			}
		}
	}
})();