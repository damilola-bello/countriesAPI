angular.module('countriesApp', []);
$(document).ready(function(){
	trayGlyphicon = document.getElementById('tray_glyph');
	
	//If viewed on a small device
	if(window.innerWidth < BREAK_POINT) {
		startArrowMove();
	}
	
	//Move progress bar onscroll
	window.onscroll = progressBarMotion;

	
	//Hide and show the clear button in the Main search input field
	$('#search').focus( function() {
		$('#clear').css('opacity', '1');
	});
	$('#search').blur( function() {
		$('#clear').css('opacity', '0');
	});
	
	/* Open and Close Filter Tray for smaller screens */
	
	$('#tray_icon').on('click', function(){
		toggleFilterTab();
	});
	$('#close_filter').on('click', function(){
		toggleFilterTab();
	});
	$('#filter_container').on('click', function(e) {
		var $target = $(e.target);
		if($('#close_filter').is(':visible') && $target.closest('#filter_box').length == 0) {
			toggleFilterTab();
		}
	});
	
	//Reset the filter fields
	$('#refresh_icon').on('click', function(){
		document.getElementById('language_ddl').value = 'all';
		document.getElementById('region_ddl').value = 'all';
		document.getElementById('population_ddl').value = 'more';
		document.getElementById('population_input').value = '';
		document.getElementById('timezone_ddl').value = '1';
		document.getElementById('timezone_more').checked = true;
		document.getElementById('timezone_chk').checked = true;
		$('#timezone_txt, #timezone_content').removeClass('blur');
	});
	//Blur the timezone when unchecked and vice versa
	$("#timezone_chk").change(function() {
		$('#timezone_txt, #timezone_content').toggleClass('blur');
	});
	
	
	/* Swipe event for sliding out the filter tab in mobile view */
	trayIcon = document.getElementById('tray_icon');
	trayIcon.addEventListener('touchstart', function(e){
		var touchobj = e.changedTouches[0];
		dist = 0;
		startX = touchobj.pageX;
		startY = touchobj.pageY;
		startTime = new Date().getTime(); // record time when finger first makes contact with surface
		e.preventDefault();
	}, false)

	trayIcon.addEventListener('touchmove', function(e){
		e.preventDefault(); // prevent scrolling
	}, false);

	trayIcon.addEventListener('touchend', function(e){
		var touchobj = e.changedTouches[0];
		dist = touchobj.pageX - startX; // get total dist traveled by finger while in contact with surface
		elapsedTime = new Date().getTime() - startTime; // get time elapsed
		// check that elapsed time is within specified, horizontal dist traveled >= MIN_DISTANCE, and vertical dist traveled <= 100
		var swiperightBol = (elapsedTime <= MAX_SWIPE_DURATION && dist >= MIN_DISTANCE && Math.abs(touchobj.pageY - startY) <= 100);
		if(swiperightBol) {
			toggleFilterTab();
		}
		
		e.preventDefault();
	});
	
});
const TRAY_WIDTH = 230;
var trayGlyphicon;
var arrowMove;
var startArrowMove = function(){
	if(!arrowMove){
		arrowMove = setInterval(function(){
			trayGlyphicon.classList.toggle('glyphOut');
		}, 400);
	}
};
var stopArrowMove = function(){
	clearInterval(arrowMove);
	arrowMove = null;
}
//Reset the CSS manipulations made while screen was less than 750px(The set breakpoint)
const BREAK_POINT = 750;
var lastWidth = BREAK_POINT;

$(window).resize(function(){ 
    var browserWidth = window.innerWidth;
    if(lastWidth < BREAK_POINT && browserWidth >= BREAK_POINT)
    {
        $('#filter_container, #filter_box').removeAttr('style');
		document.getElementById('filter_content_wrapper').style.height = 'auto';
		stopArrowMove();
    } else if (browserWidth <= BREAK_POINT) {
		/* If it is in mobile view and the filter tab is out and the height of the main content of the filter tab is less than 450 add scrollbars to make all of it visible */
		if(document.getElementById('filter_container').style.display == 'block' && document.getElementById('filter_box').clientHeight < 450) {
			document.getElementById('filter_content_wrapper').style.height = 'auto';
			adjustFilterHeight();
		} else if(document.getElementById('filter_container').style.display != 'block') {
			startArrowMove();
		}
		
	} else {
		document.getElementById('filter_content_wrapper').style.height = 'auto';
	}
    lastWidth = browserWidth;
});

//This function adds scrollbars to the y-axis of the filter tab when the screen becomes too small to fit it all in
var adjustFilterHeight = function () {
	var filterBoxHeight = document.getElementById('filter_box').clientHeight;
	var diff = filterBoxHeight - document.getElementById('filter_content_wrapper').clientHeight
	if(diff < 80) {
		var newHeight = filterBoxHeight - 100;
		newHeight = (newHeight < 200) ? 200 : newHeight;
		document.getElementById('filter_content_wrapper').style.height = `${newHeight}px`;
	} else {
		document.getElementById('filter_content_wrapper').style.height = 'auto';
	}
}

function progressBarMotion() {
	var winScroll = document.body.scrollTop || document.documentElement.scrollTop;
	var height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
	//If the content is too short to be scrollabe set the progress bar to 0% and return
	if(winScroll == 0 && height == 0) {
		document.getElementById("progress_bar").style.width = "0%";
		return;
	}
	
	var scrolled = (winScroll / height) * 100;
	document.getElementById("progress_bar").style.width = scrolled + "%";
}

function toggleFilterTab (){
	if($('#filter_box').css('margin-left') == `-${TRAY_WIDTH}px`) {
		//Slide out (Open)
		$('#filter_container').fadeIn();
		$('#filter_box').animate({"margin-left": `+=${TRAY_WIDTH}`});
		adjustFilterHeight();
		stopArrowMove();
		
	} else if($('#filter_box').css('margin-left') == "0px") {
		//Slide in (Close)
		$('#filter_box').animate({"margin-left": `-=${TRAY_WIDTH}`}, function(){
			$('#filter_container').fadeOut();
			document.getElementById('filter_content_wrapper').style.height = 'auto';
			startArrowMove();
		});
	}
}

//variable used to detect if the api search is ongoing, if it is, no other call will be made until it is complete
var searching = false;
const BASE_URL = 'https://restcountries.eu/rest/v2';

var mainCtrl = function($scope, $http) {
	$scope.apiSearchError = undefined;
	
	$scope.clrSearchField = function () {
		$scope.searchField = '';	
	};
	
	$scope.showAll = ShowAllResults($scope);
	
	//Function to handle Api search
	$scope.searchApi = SearchAPI($scope, $http);
	
	$scope.progressBar = function (){
		DelayProgressBar(500);
	};
};

function DelayProgressBar (time){
	//Wait for the country details to slide down or up before adjusting the progress bar. It takes about 0.4s(400ms) for it to slide down or up
	setTimeout(progressBarMotion, time);
}

var ShowAllResults = function($scope) {
	return function(){
		$scope.showMore = { 'display' : 'none'};
		$scope.responseContainer = { 'height' : 'auto'};
		
		DelayProgressBar(500);
	};
};

var SearchAPI = function($scope, $http) {
	return function () {
		//Return if a search is onging
		if(searching === true)
			return;
		
		//Show the loading icon while fetching data from the API
		$scope.loadingDisplay = { 'display' : 'flex'};
		
		//API call has began
		searching = true;
		
		//generate url based on the filters
		var region = $('#region_ddl').val(); 
		var lang = $('#language_ddl').val();
		var timezones = Number($('#timezone_ddl').val());
		var timezoneCompare;
		var populationCompare;
		var populationInput = 0;
		
		var regionFilter = (region == 'all') ? false : true;
		var langFilter = (lang == 'all') ? false : true;
		var populationFilter = false;
		var timezoneFilter = (document.getElementById('timezone_chk').checked) ? true : false;
		
		var str = $('#population_input').val();
		//Check if the population input is a number and an integer
		if(str.length > 0 && isNaN(str) == false && Number.isInteger(Number(str))) {
			populationFilter = true;
			populationInput = Number(str);
			switch($('#population_ddl').val()){
				case 'less' :
					populationCompare = 0;
					break;
				case 'more' :
					populationCompare = 1;
					break;
			}
		}
		
		//Set the value of timezoneCompare 0 for less than 1 for eqauls, 2 for greater than
		if(timezoneFilter == true) {
			switch(Number(document.querySelector('input[name="timezone_compare"]:checked').value)) {
				case 0 :
					timezoneCompare = 0;
					break;
				case 1 :
					timezoneCompare = 1;
					break;
				case 2 :
					timezoneCompare = 2;
			}
		}
		var result = '';
		$scope.url = '';
		
		if(langFilter == true) {
			//Search based on language
			$scope.url = `${BASE_URL}/lang/${lang}`;
			langFilter = false;
		} else if(regionFilter == true){
			//search based on the region
			$scope.url = `${BASE_URL}/region/${region}`;
			regionFilter = false;
		} else {
			$scope.url = `${BASE_URL}/all`;
		}
		
		//Send a get request
		$http.get($scope.url).then(function (response) {
			result = response.data;
			//If the user wants to filter by any criteria aside from language, jQuery's grep function would do that
			if(populationFilter == true || regionFilter == true || timezoneFilter == true) {
				result = jQuery.grep(response.data, function(element, index){
					var populationResult=true, regionResult=true, timezoneResult=true;
					if(regionFilter == true) {
						regionResult = element.region.toLowerCase() == region.toLowerCase();
					}
					if(populationFilter == true) {
						switch(populationCompare) {
							case 0 :
								populationResult = Number(element.population) < populationInput;
								break;
							case 1 :
								populationResult = Number(element.population) > populationInput;
								break;
						}
					}
					if(timezoneFilter == true) {
						switch(timezoneCompare) {
							case 0 :
								timezoneResult = Number(element.timezones.length) < timezones;
								break;
							case 1 :
								timezoneResult = Number(element.timezones.length) == timezones;
								break;
							case 2 :
								timezoneResult = Number(element.timezones.length) > timezones;
								break;
						}
					}

					return populationResult && regionResult && timezoneResult;
				});
			}
			
			$scope.dataList = result;
			//If the data returned has more than 10 Countries, show the first 10 else show all
			if(result.length > 10) {
				$scope.showMore = { 'display' : 'flex'};
				$scope.responseContainer = { 'height' : '400px'};
			} else {
				ShowAllResults($scope)();
			}
			finishCall($scope);
		}, function (response) {
			$scope.apiSearchError = "Couldn't fetch countries from the server\n Do try again.";
			finishCall($scope);
		});
	};
};

var finishCall = function ($scope){
	//Remove the loading icon once the api request is done
	$scope.loadingDisplay = { 'display' : 'none'};
	//Search is complete
	searching = false;
	//Adjust the progress bar
	DelayProgressBar(2000);
}

var commarize = function () {
	return function (num) {
		return Number(num).toLocaleString();
	}
};

var pluralize = function() {
	return function (num) {
		if(num == 0) 
			return "No Country found."
		else if(num == 1)
			return "1 country found.";
		else if(num == undefined)
			return 'No results yet.\n You can place a search using the Filters tab.';
		else
			return `${num} Countries found.`;
	}
}

var slide = function() {
    var NG_HIDE_CLASS = 'ng-hide';
    return {
        beforeAddClass: function(element, className, done) {
			//Hide
            if(className === NG_HIDE_CLASS) {
                jQuery(element).slideUp(done, function(){
					jQuery(element).prev('.profile-intro').find('.glyphicon').toggleClass('glyphicon-menu-up glyphicon-menu-down');
				}); 
            }
        },
        removeClass: function(element, className, done) {
			//Show
            if(className === NG_HIDE_CLASS) {
                jQuery(element).hide().slideDown(done, function (){
					jQuery(element).prev('.profile-intro').find('.glyphicon').toggleClass('glyphicon-menu-up glyphicon-menu-down');
				});
            }
        }
    }
};

const MIN_DISTANCE = 120; //required min distance traveled to be considered swipe
const MAX_SWIPE_DURATION = 400; // maximum time allowed to travel that distance
var trayIcon,
        startX,
        startY,
        dist,
        elapsedTime,
        startTime;

angular
	.module('countriesApp', ['ngAnimate'])
	.controller('mainCtrl', mainCtrl)
	.filter('commarize', commarize)
	.filter('pluralize', pluralize)
	.animation('.slide', slide);