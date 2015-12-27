app.controller("SearchController", function($scope, Repos, $http, $location) {
	$scope.repos = Repos;	
	$scope.search = function (){
		$location.path('/')
	}
})