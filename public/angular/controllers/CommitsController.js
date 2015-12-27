app.controller("CommitsController", function($scope, $routeParams,
		Repos, $http, $location) {
	$scope.repos = Repos;

	$scope.commits = [];
	$scope.authors = [];
	$scope.loadingAuthors = false;
	$scope.loadingCommits = false;

	// Get contributors with stats
	$scope.loadContributors = function() {
		$scope.loadingAuthors = true;
		$http.get(
				"https://api.github.com/repos/" + $routeParams["org"] + "/"
						+ $routeParams["repo"] + "/stats/contributors")
				.success(function(data, status) {
					if (status == 200) {
						$scope.authors = data;
						console.log("data", data);
						$scope.totalCommits = $scope.authors.map(function(a) {
							return a.total
						}).reduce(function(previous, current) {
							return previous + current
						}, 0)
						$scope.loadingAuthors = false;
					} else if (status == 202) {
						$scope.loadContributors();
					}
				})
	}
	$scope.loadContributors();
	// Get 100 latest commits
	
	$scope.page = 1;
	$scope.loadCommits = function(page = 1){
		$scope.page = page;
		$scope.loadingCommits = true;
		$http.get(
				"https://api.github.com/repos/" + $routeParams["org"] + "/"
						+ $routeParams["repo"] + "/commits?page="+$scope.page).success(
				function(data) {
					if(page == 1){
						$scope.commits = data;						
					}
					else{
						$scope.commits = $scope.commits.concat(data);
					}
					$scope.loadingCommits = false;
				}).error(
				function(data) {
					Repos.searchText = $routeParams["repo"];
					Repos.update();
					$location.path('/');
				})
	}
	$scope.loadCommits();

	$scope.calculateFontSize = function(author) {
		var min = 12;
		var max = 30;
		var porcent = 100 * author.total / $scope.totalCommits;
		return ((porcent * (max - min) / 100) + min) + 'px';
	}
})
