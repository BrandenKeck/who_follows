$(function(){
	var root = firebase.database().ref();
	//root.remove();
	root.on("child_added", snap => {
		var addMe = snap.val();
		updateFollowing(addMe.Follows, addMe.Deaths);
	});
});

function updateFollowing(f, d){
	$("#previouslyFollowed").empty();
	for(var i=(f.length-1); i>=(f.length-10); i--){
		if(f[i] != undefined){
			$("#previouslyFollowed").append("<div class='row padBottom'><div class='col-xs-5 alignRight'><img class='profile' src='"+f[i].profile_image_url+"'/></div><div class='col-xs-7 alignLeft'><p class='pTextSmall'><b>Name: </b>"+f[i].name+"</p><p class='pTextSmall'><b>Handle:</b> <i>@"+f[i].screen_name+"</i></p></div></div>");
		}
	}
	
	$("#recentlyCaught").empty();
	for(var i=(d.length-1); i>=(d.length-10); i--){
		if(d[i] != undefined){
			$("#recentlyCaught").append("<div class='row padBottom'><div class='col-xs-5 alignRight'><a href='#' class='bwWrapper'><img class='profile' src='"+d[i].profile_image_url+"'/></a></div><div class='col-xs-7 alignLeft'><p class='pTextSmall'><b>Name: </b>"+d[i].name+"</p><p class='pTextSmall'><b>Handle:</b> <i>@"+d[i].screen_name+"</i></p></div></div>");
		}
	}
	
	resetBW();
}

function resetBW(){
	$('.bwWrapper').BlackAndWhite({
        hoverEffect : true, // default true
        // set the path to BnWWorker.js for a superfast implementation
        webworkerPath : false,
        // to invert the hover effect
        invertHoverEffect: false,
        // this option works only on the modern browsers ( on IE lower than 9 it remains always 1)
        intensity:1,
        speed: { //this property could also be just speed: value for both fadeIn and fadeOut
            fadeIn: 600, // 200ms for fadeIn animations
            fadeOut: 800 // 800ms for fadeOut animations
        },
        onImageReady:function(img) {
            // this callback gets executed anytime an image is converted
        }
    });
}