app.controller("ReposController", function($scope, Repos,$http) {
	// $scope.repos = [{display : "Premier Repo"}, {display : "Deuxieme Repo"}]
	$scope.repos = Repos;
	
	
	
	console.log("repos Controller")
	
	
})