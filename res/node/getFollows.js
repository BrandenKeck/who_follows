var Twit=require('twit');
var config=require('./config');
var T = new Twit(config);

//Database requires write authentication which is provided in a secure external file
var admin=require('firebase-admin');
admin.initializeApp({
  credential: admin.credential.cert("./adminKey.json"),
  databaseURL: "https://twitter-application-a3516.firebaseio.com"
});
var db = admin.database();

//Variables that pollute the global namespace
var paul = [];
var annie = 0;
var previouslyKilled = [];
var moveDistribution = [.125, .125, .125, .25, .25, .125];
var moveTotals = [0, 0, 0, 0, 0, 0]
var score = 0;
var loopBreak = 0;
var isKillable = true;
var isPassable = true;
var pauseEvents = false;

//Each time the data base is appended, this function checks if it is necessary to remove obsolete data
db.ref().on('value', function(snapshot){
	var r, l, k;
	prunePaul();
	prunePreviouslyKilled();
	
	r = snapshot.val();
	l = Object.keys(r).length;
	if(l>50){
		k = Object.keys(r)[0];
		db.ref().child(k).remove();
	}
});

//Initial users are specified, and all functions are set to begin firing.
db.ref().once('value', function(snapshot){
	var retrival, ell, kee;

    retrival = snapshot.val();
	ell = Object.keys(retrival).length;
	kee = Object.keys(retrival)[ell-1];
	paul = retrival[kee].Follows
	previouslyKilled = retrival[kee].Deaths

	setTimeout(function(){decideNextMove();}, 5000);
	T.get('friends/ids', {screen_name: paul[paul.length-1].screen_name, count: 100}, itFollows);
});

//This nested function handles the automated download of data from Twitter
//A lot of issues arise from data gathering errors... these are currently looped.  If errors persist this may change.
function itFollows(err, data){
	if(data.ids == undefined){
		console.log("PASS FAILED");
		pauseEvents = false;
		resetProbabilities();
	}
	else if(data.ids.length < 15){
		randomDeath();
	}
	else{
		var jay = Math.round(Math.random()*(data.ids.length - 2));
		var pickWhoFollowsNext = data.ids[jay];
		T.get('users/lookup' , {user_id: pickWhoFollowsNext}, resetMe);
		function resetMe(e, d){
			if(d[0] == undefined && paul.length>2){
				setTimeout(function(){T.get('friends/ids' , {screen_name: paul[paul.length-1].screen_name, count: 100}, itFollows);}, 10000);
			}
			else if(d[0] == undefined && paul.length==2){
				T.get('friends/ids', {screen_name: 'saifauto_' , count: 100}, itFollows);
			}
			else{
				resetProbabilities();
				var tempImgURL = d[0].profile_image_url
				tempImgURL = tempImgURL.split("_normal")
				d[0].profile_image_url = tempImgURL[0] + tempImgURL[1]
				passCurse(d[0].name, d[0].screen_name, d[0].profile_image_url, d[0].url);
			}
		}
	}
}

//function that passes the monster onto the next user
function passCurse(d_name, d_screen_name, d_profile_img, d_url){
	if(isPassable){
		paul.push({name: d_name, screen_name: d_screen_name, profile_image_url: d_profile_img, url: d_url});
		var greg = generateTimestamp();
		var yara = "@/" + paul[paul.length-2].name + "/@ has passed the curse onto @/" + paul[paul.length-1].name + "/@. @/" + paul[paul.length-1].name + "/@ is now being followed."
		console.log(greg + " " + yara);
		db.ref().push({
			TimeStamp: greg,
			Message: yara,
			Follows: paul,
			Deaths: previouslyKilled
		});
		pauseEvents = false;
		isPassable = false;
		setTimeout(function(){isPassable=true;}, 90000);
	}
	else{
		console.log("PASS ERROR");
		setTimeout(function(){passCurse(d_name, d_screen_name, d_profile_img, d_url)}, 20000);
	}
}

//The following functions dicate random events
//options are death, chase, cornered, monster changing appearance, injury, and random action
//choices are based on probability.  the more often a choice occurs the less likely it becomes
function randomDeath(){
	if(paul.length>1){
		var greg = generateTimestamp();
		var yara = "The monster caught @/" + paul[paul.length-1].name + "/@ and has started following @/" + paul[paul.length-2].name + "/@ again.";
		console.log(greg + " " + yara);
		previouslyKilled.push(paul[paul.length-1]);
		paul.pop();
		resetProbabilities();
		db.ref().push({
			TimeStamp: greg,
			Message: yara,
			Follows: paul,
			Deaths: previouslyKilled
		});
	}
	pauseEvents = false;
}

//Move #1 in the probability distribution.  Results in a bias towards passing the curse
function randomChase(){
	var locations = ["through the park",
		"through an abandoned building",
		"toward the traintracks",
		"over the 2nd street bridge",
		"into a local restaurant",
		"through a suburban wood",
		"past the local police station",
		"toward the playground at their old elementary school",
		"into the university library",
		"through an abandoned hardware store",
		"past the home of their childhood crush",
		"through the graveyard a mile from their house",
		"through a crowded shopping mall",
		"across their neighbors front lawn",
		"through a bus station",
		"away from a party at their friend's house",
		"through a water treatment plant",
		"across an empty field",
		"into a local pub",
		"past a nightclub in the center of town",
		"through the gas station where they work",
		"out of the back door of their grandparents' house",
		"away from the local bus station",
		"around a local reservoir",
		"across the roof of campus deli",
		"up the stairs in the library stairwell",
		"around a large sculpture in the middle of their city",
		"down an alleyway behind the city hall building",
		"through a small creek, getting their clothes wet",
		"away from a concert they were attending",
		"down a fire escape at their appartment building"];
	
	var greg = generateTimestamp();
	var yara = "The monster is chasing @/" + paul[paul.length-1].name + "/@ " + locations[Math.round(Math.random()*(locations.length-1))];
	console.log(greg + " " + yara);
	db.ref().push({
		TimeStamp: greg,
		Message: yara,
		Follows: paul,
		Deaths: previouslyKilled
	});
	pauseEvents = false;
}

//Next two functions comprise move #2 in the probability distribution.  Successful escape results in a bias towards passing the curse.
function randomCorner(){
	var corners = ["in the lockerroom of their old highschool",
		"in the basement of their parent's house",
		"at the beach house where their family goes for holiday",
		"in a room at a cheap motel",
		"in the lobby of a bank",
		"inside the toolshed in their backyard",
		"at their next door neighbors house",
		"at an abandoned home in the town next their hometown",
		"at a community pool",
		"in a funeral home",
		"in the sewers under their city",
		"in a crowded bar",
		"at the back of their favorite restaurant",
		"in their own kitchen",
		"inside a car at the junk yard",
		"at the firehall across the street from their house",
		"in an empty parking garage",
		"inside an RV",
		"in a hallway that leads to the bathrooms in a college bar",
		"in the back of a 7-11",
		"in the crawl space beneath their house",
		"inside the back of a U-Haul van",
		"in the middle of a movie theater",
		"in the center of a frozen pond",
		"at the local Cosco store",
		"on the roof of a four-story building",
		"in their old tree house",
		"at night at an empty beach",
		"in a tree in their back yard",
		"at a drive-in movie theater",
		"behind the Dari Delight, in a dead-end alleyway",
		"on the latter of a build-board on the side of the highway",
		"at the edge of a cliff in the forest behind their house"];
	var loc = corners[Math.round(Math.random()*(corners.length-1))];
	
	var greg = generateTimestamp();
	var yara = "The monster has cornered @/" + paul[paul.length-1].name + "/@ " + loc;
	console.log(greg + " " + yara);
	db.ref().push({
		TimeStamp: greg,
		Message: yara,
		Follows: paul,
		Deaths: previouslyKilled
	});
	isKillable = false;
	isPassable = false;
	setTimeout(function(){randomEscape(loc);}, 5000);
}

function randomEscape(loc){
		var esc = Math.random();
		if(esc<.2){
			if(paul.length>1){
				var greg = generateTimestamp();
				var yara = "@/"+ paul[paul.length-1].name + "/@ was caught " + loc + ".  The monster is now following @/" + paul[paul.length-2].name + "/@ again.";
				console.log(greg + " " + yara);
				previouslyKilled.push(paul[paul.length-1]);
				paul.pop();
				resetProbabilities();
				db.ref().push({
					TimeStamp: greg,
					Message: yara,
					Follows: paul,
					Deaths: previouslyKilled
				});
			}else{
				var greg = generateTimestamp();
				var yara = "@/" + paul[paul.length-1].name + "/@ managed to escape!";
				console.log(greg + " " + yara);
				db.ref().push({
					TimeStamp: greg,
					Message: yara,
					Follows: paul,
					Deaths: previouslyKilled
				});
			}
		}else{
			var greg = generateTimestamp();
			var yara = "@/" + paul[paul.length-1].name + "/@ managed to escape!";
			console.log(greg + " " + yara);
			db.ref().push({
				TimeStamp: greg,
				Message: yara,
				Follows: paul,
				Deaths: previouslyKilled
			});
		}
		isKillable = true;
		isPassable = true;
		pauseEvents = false;
}

//Move #3 in the probability distribution.  Results in a bias toward being caught by the monster
function randomMorph(){
	var whichMorph = Math.random();
	if(whichMorph<.5){
		var morphs1 = ["mother",
			"father",
			"best friend from highschool",
			"favorite college professor",
			"first childhood crush",
			"friend from summer camp",
			"second cousin",
			"aunt",
			"uncle",
			"hair stylist",
			"preschool teacher",
			"family physician",
			"favorite singer",
			"gradeschool soccer coach",
			"math tutor",
			"boss",
			"friend's little brother",
			"worst enemy from highschool",
			"old pediatrician",
			"father's best friend",
			"first love",
			"best friend's sister",
			"highschool bully",
			"graduate school mentor",
			"favorite author"];
			
		var greg = generateTimestamp();
		var yara = "The monster has changed appearance.  It has taken the form of @/" + paul[paul.length-1].name + "'s/@ " + morphs1[Math.round(Math.random()*(morphs1.length-1))];
		console.log(greg + " " + yara);
		db.ref().push({
			TimeStamp: greg,
			Message: yara,
			Follows: paul,
			Deaths: previouslyKilled
		});
	}else{
		var morphs2 = ["distant family members",
			"childhood friends",
			"college roomates",
			"middle school guidance counselors",
			"classmates",
			"neighborhood watchmen",
			"close family friends",
			"school librarians",
			"coworkers",
			"fellow interns",
			"highschool teachers",
			"neighbor's little kids",
			"cousin's friends from school",
			"friends from the beach where their family vacations",
			"mother's book club friends",
			"teammates from their middle school football team",
			"team members for a school project",
			"lab partners",
			"friends from summer camp",
			"least favorite people",
			"friends they met playing an online game",
			"next door neighbors",
			"favorite recording artists",
			"friends from the gym",
			"idiot siblings",
			"friends they met at a book store"];
			
		var greg = generateTimestamp();
		var yara = "The monster has disguised itself as one of @/" + paul[paul.length-1].name + "'s/@ " + morphs2[Math.round(Math.random()*(morphs2.length-1))]
		console.log(greg + " " + yara);
		db.ref().push({
			TimeStamp: greg,
			Message: yara,
			Follows: paul,
			Deaths: previouslyKilled
		});
	}
	pauseEvents = false;
}

//Move #4 in the distribution.  Results in a bias towards passing the curse
function randomPlayerAction(){
	var actions1 = ["picked up a shovel to use for protection",
		"is searching the house for a gun",
		"just left class and noticed somebody following them ominously",
		"is breathing heavily",
		"is gathering food for a long trip",
		"just replaced the bandage on their leg",
		"is eating a quick meal before they start running again",
		"accidently tore the map of the city",
		"is beginning to act hysterical",
		"decided to leave their friends for their own protection",
		"found a rusty axe in the woods by their town",
		"is trying to set a trap for the monster",
		"stole their father's car so they could leave town",
		"took 100 dollars from their mother's purse to pay for supplies",
		"tried to break into their neighbor's shed to get a weapon",
		"turned their phone off to try to save the battery",
		"is asking a local man for directions",
		"tried listening to the radio to calm down",
		"tried to fall asleep, but was too frightened",
		"is hurrying to break a rusty padlock off of an old door",
		"filled two plastic canisters with gasoline",
		"stopped for coffee after staying awake for 24 hours",
		"just crossed the state border",
		"tried buying a plane ticket, but their credit card was declined",
		"found some string and paper clips in a desk drawer.  They took them for future use",
		"began recording the unfolding events in a notebook",
		"has turned on every light in their home",
		"is sitting in their car, loadly playing music",
		"tried dialing their parents, but the phone lines were dead"];

	var greg = generateTimestamp();
	var yara = "@/" + paul[paul.length-1].name + "/@ " + actions1[Math.round(Math.random()*(actions1.length-1))];
	console.log(greg + " " + yara);
	db.ref().push({
		TimeStamp: greg,
		Message: yara,
		Follows: paul,
		Deaths: previouslyKilled
	});
	pauseEvents = false;
}

//Move #5.  Results in a bias toward being caught
function randomMonsterAction(){
	var actions2 = [["broke through a wooden door to get to @/", "/@"],
		["grabbed @/","'s/@ leg, tripping them.  They barely got away."],
		["broke into @/","'s/@ house through the front window"],
		["was incapacitated for a moment after @/","/@ shot them with a hunting rifle"],
		["is approaching @/","/@ from behind"],
		["threw @/","'s/@ best friend across the room after they got in the way"],
		["has changed its appearance to be absolutely grotesque, frightening @/","/@"],
		["crawled through a small opening into the basement of @/","'s/@ house"],
		["slipped into the room behind one of @/","/@'s friends"],
		["became visibly angry after being hit by debris thrown by @/","/@"],
		["is no longer in sight which has made @/","/@ extremely paranoid"],
		["is beating violently on @/","'s/@ front door"],
		["is navigating a crowd of people unnoticed, pursueing @/","/@"],
		["nearly caught @/","/@ after they fell into a small ditch"],
		["is still following @/","/@ from very far away"],
		["is trying to position itself between @/","/@ and the only exit from the room"],
		["has been sighted, @/","/@ is panicing!"],
		["is gaining on @/","/@ slowly but surely"],
		["has entered the same building as @/","/@ without alerting anyone to its presence"],
		["is throwing debris at @/","/@, trying to injure them"]];

	maFactor = Math.round(Math.random()*(actions2.length-1));
	var greg = generateTimestamp();
	var yara = "The monster " + actions2[maFactor][0] + paul[paul.length-1].name + actions2[maFactor][1];
	console.log(greg + " " + yara);
	db.ref().push({
		TimeStamp: greg,
		Message: yara,
		Follows: paul,
		Deaths: previouslyKilled
	});
	pauseEvents = false;
}

//Move #6. Results in a bias toward being caught
function randomInjury(){
	var injuries = ["sprained their ankle jumping over a fence",
		"damaged their wrist as they fell running away",
		"badly wounded their midriff climbing out of a broken glass window",
		"broke their nose after falling off of a ledge",
		"stubbed their toe on a piece of furnature",
		"broke their ribs after jumping out of a window",
		"cut their forehead.  Blood is running into their eyes making it difficult to see",
		"wrecked their car, becoming completely disoriented",
		"stepped on a nail, badly wounding their foot",
		"slipped and dislocated their shoulder",
		"strained their back while moving a large piece of debris",
		"stuck their head after falling off of a ladder.  They may have a concussion",
		"severely injured the fingers on their right hand",
		"badly burned their arm try to ward off the monster with fire",
		"fell while running and got the wind knocked out of them",
		"was briefly knocked unconscious from explosives they rigged",
		"injured their elbow throwing large bolders at the monster",
		"badly injured thier knee after falling",
		"was temporarily blinded while trying to light a road flare",
		"was deafened by the sound of a gun shot and completely disoriented",
		"badly cut their torso while trying to set up a trap",
		"cut their neck after being thrown by the monster into a large mirror",
		"was struck on the head by a piece of debris and became disoriented"];

	var greg = generateTimestamp();
	var yara = "@/" + paul[paul.length-1].name + "/@ " + injuries[Math.round(Math.random()*(injuries.length-1))];
	console.log(greg + " " + yara);
	db.ref().push({
		TimeStamp: greg,
		Message: yara,
		Follows: paul,
		Deaths: previouslyKilled
	});
	isKillable = false;
	isPassable = false;
	setTimeout(function(){caughtThroughInjury();}, 7000);
}

//The result of move #6... possibility that the target will not survive
function caughtThroughInjury(){
	var injr = Math.random();
	if(injr<.25){
		if(paul.length>1){
			var greg = generateTimestamp();
			var yara = "Due to their injury, @/"+ paul[paul.length-1].name + "/@ was too slow.  The monster caught them and is now following @/" + paul[paul.length-2].name + "/@ again.";
			console.log(greg + " " + yara);
			previouslyKilled.push(paul[paul.length-1]);
			paul.pop();
			resetProbabilities();
			db.ref().push({
				TimeStamp: greg,
				Message: yara,
				Follows: paul,
				Deaths: previouslyKilled
			});
		}else{
			var greg = generateTimestamp();
			var yara = "@/" + paul[paul.length-1].name + "/@ is struggling to go on!";
			console.log(greg + " " + yara);
			db.ref().push({
				TimeStamp: greg,
				Message: yara,
				Follows: paul,
				Deaths: previouslyKilled
			});
		}
	}else{
		var greg = generateTimestamp();
		var yara = "@/" + paul[paul.length-1].name + "/@ is struggling to go on!";
		console.log(greg + " " + yara);
		db.ref().push({
			TimeStamp: greg,
			Message: yara,
			Follows: paul,
			Deaths: previouslyKilled
		});
	}
	isKillable = true;
	isPassable = true;
	pauseEvents = false;
}

//the probability of what happens next changes based on recent actions.
//then the selected action may or may not occur based on its own probability
//Potential Moves are As Follows: 1. Chase 2. Corner 3. Morph 4. Player Action 5. Monster Action 6. Injury
//The remaining probability will be for death & passing on the curse
function decideNextMove(){
	pauseEvents = true;
	loopBreak = 0;
	
	var md = moveDistribution;
	var sums = []
	var dist = Math.random();
	
	sums = [md[0], 
		md[0]+md[1],
		md[0]+md[1]+md[2],
		md[0]+md[1]+md[2]+md[3],
		md[0]+md[1]+md[2]+md[3]+md[4],
		md[0]+md[1]+md[2]+md[3]+md[4]+md[5]];
	console.log("Deciding move...");
	 if(dist < sums[0]){
		 randomChase();
		 score+=1;
		 moveTotals[0]+=1;}
	 else if(sums[0] <= dist && dist < sums[1]){
		 randomCorner();
		 score+=2;
		 moveTotals[1]+=1;}
	 else if(sums[1] <= dist && dist < sums[2]){
		 randomMorph();
		 score-=1;
		 moveTotals[2]+=1;}
	 else if(sums[2] <= dist && dist < sums[3]){
		 randomPlayerAction();
		 score+=2;
		 moveTotals[3]+=1;}
	 else if(sums[3] <= dist && dist < sums[4]){
		 randomMonsterAction();
		 score-=1;
		 moveTotals[4]+=1;}
	 else if(sums[4] <= dist && dist < sums[5]){
		 randomInjury();
		 score-=2;
		 moveTotals[5]+=1;}
	else{
		if(isPassable && isKillable){passOrDie();}
	}
	
	recalcProbabilities();
	var getTimeout = Math.round(Math.random()*30000)+5000;
	
	setTimeout(function(){
		if(!pauseEvents){decideNextMove();}
		else{waitForPause();}
	}, getTimeout);
}

//Necessary to the chonology of some events
function waitForPause(){
	console.log("Waiting...");
	loopBreak+=1;
	setTimeout(function(){
		if(!pauseEvents || loopBreak>=5){decideNextMove();}
		else{waitForPause();}
	}, 10000);
}

//Each move severly lessens the probability that it will happen again before the curse is passed
function recalcProbabilities(){
	for(i=0;i<moveDistribution.length;i++){
		moveDistribution[i] = moveDistribution[i]/(1+moveTotals[i]);
	}
}

//Self explanitory function:
function resetProbabilities(){
	moveDistribution = [.125, .125, .125, .25, .25, .125];
	moveTotals = [0, 0, 0, 0, 0, 0]
}

//If the 'target' hasn't yet been caught after the required 60s waiting period this is called
//Function is heavily biased towards passing the curse
function passOrDie(){
	var passProb = (16+score)/20;
	var choose = Math.random();
	if(choose > passProb){
		randomDeath();
	}else{
		console.log("PASS");
		T.get('friends/ids' , {screen_name: paul[paul.length-1].screen_name, count: 100}, itFollows);
	}
}

//Two pruning functions to help limit the size of arrays
//called every time the database is appended
function prunePaul(){
	i = paul.length;
	while(i>12){
		paul.splice(0, 1);
		i = paul.length;
	}
}

function prunePreviouslyKilled(){
	i = previouslyKilled.length;
	while(i>12){
		previouslyKilled.splice(0, 1);
		i = previouslyKilled.length;
	}
}

//timestamps are created based on current time and data
function generateTimestamp(){
	var timestamp = "";
	var d = new Date();
	var timestamp = "[" + (parseInt(d.getMonth())+1) + "/" + d.getDate() + "/" + d.getFullYear() + " " + padVal(d.getHours()) + ":" + padVal(d.getMinutes()) + ":" + padVal(d.getSeconds()) + "]";
	return timestamp;
}
function padVal(n) {return (n < 10 ? '0' : '') + n}