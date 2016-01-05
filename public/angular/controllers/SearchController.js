app.controller("SearchController", function($scope, Repos, $http, $location,Quota) {
	$scope.repos = Repos;	
	$scope.search = function (){
                $scope.repos.update();
		$location.path('/');
                $location.search('q',$scope.repos.searchText)
	}
        $scope.update = function(){
            if(Quota.login){
                $scope.repos.update();
            }
        }
        if($location.search().q){
            $scope.repos.searchText = $location.search().q;
            $scope.search();
        }
})