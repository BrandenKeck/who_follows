$(function(){
	var root = firebase.database().ref();
	//root.remove();
	root.on("child_added", snap => {
		var addMe = snap.val();
		buildOutput(addMe.TimeStamp, addMe.Message);
		updateFollowing(addMe.Follows);
	});
});

function updateFollowing(whoFollows){
	$("#currentlyFollowing").empty();
	$("#currentlyFollowing").append(
		"<div class='col-xs-5 col-sm-5 alignRight'><img class='profile' src='"+whoFollows[whoFollows.length-1].profile_image_url+"'/></div><div class='col-xs-7 col-sm-7 alignLeft'><p class='pTextSmall'><b>Name: </b>"+whoFollows[whoFollows.length-1].name+"</p><p class='pTextSmall'><b>Handle:</b> <i>@"+whoFollows[whoFollows.length-1].screen_name+"</i></p></div>"
	);
	
	$("#previouslyFollowing").empty();
	$("#previouslyFollowing").append(
		"<div class='col-xs-5 col-sm-5 alignRight'><img class='profile' src='"+whoFollows[whoFollows.length-2].profile_image_url+"'/></div><div class='col-xs-7 col-sm-7 alignLeft'><p class='pTextSmall'><b>Name: </b>"+whoFollows[whoFollows.length-2].name+"</p><p class='pTextSmall'><b>Handle:</b> <i>@"+whoFollows[whoFollows.length-2].screen_name+"</i></p></div>"
	);
}

function buildOutput(timestamp, userMessage){
	var timeOpener = '<p class="timestamp">'
	var messOpener = '<p class="message">'
	var userOpener = '<p class="userText">'
	var closer = '</p>'
	var newline = '<br />'
	
	userMessage = messOpener + userMessage + closer;
	var frontInsert = userMessage.split("@/");
	userMessage = "";
	console.log("1 " + userMessage);
	for(var i=0; i<(frontInsert.length-1); i++){
		userMessage += frontInsert[i] + closer + userOpener;
	}
	userMessage += frontInsert[frontInsert.length - 1];
	console.log("2 " + userMessage);
	var backInsert = userMessage.split("/@");
	userMessage = "";
	for(var i=0; i<(backInsert.length-1); i++){
		userMessage += backInsert[i] + closer + messOpener;
	}
	userMessage += backInsert[backInsert.length - 1];
	
	console.log("3 " + userMessage);
	
	$('#liveFeed').append(timeOpener + timestamp + closer + " " + userMessage + newline);
	$("#liveFeed").scrollTop($("#liveFeed")[0].scrollHeight);
}