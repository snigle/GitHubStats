app.controller("SearchController", function($scope, Repos, $http, $location,Quota) {
	$scope.repos = Repos;	
	$scope.search = function (){
                $scope.repos.update();
		$location.path('/')
	}
        $scope.update = function(){
            if(Quota.login){
                $scope.repos.update();
            }
        }
})