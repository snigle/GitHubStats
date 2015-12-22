if (window.console) {
	console.log("Welcome to your Play application's JavaScript!");
}

var app = angular.module('GitHubStats',
		[ 'ngRoute', 'ngMaterial', 'ngResource' ]);

app.config([ '$routeProvider','$locationProvider', function($routeProvider,$locationProvider) {
	$routeProvider.when('/', {
		templateUrl : '/assets/angular/views/repos.html',
		controller : 'ReposController'
	}).when('/repo/:repo', {
		templateUrl : '/assets/angular/views/commits.html',
		controller : 'CommitsController'
	})
	$locationProvider.html5Mode(true);
} ])

app.factory('Repos', function($resource) {
	var res = $resource('http://localhost:9000/api/repos?s=:search', {}, {
		search : {
			method : 'GET',
			params : {
				search : 'search'
			},
			isArray : true
		}
	})
	res.bu = {};
	return res;
})

app.factory('Commits', function($resource) {
	var res = $resource('http://localhost:9000/api/repo/:repo/commits', {}, {
		get : {
			method : 'GET',
			params : {
				repo : 'repo'
			},
			isArray : true
		}
	})
	res.bu = {};
	return res;
})