app.controller("CommitsController", function ($scope, $routeParams,
        Repos, $http, $location, Quota) {
    $scope.repos = Repos;

    $scope.commits = [];
    $scope.authors = [];
    $scope.loadingAuthors = false;
    $scope.loadingCommits = false;

    // Get contributors with stats
    $scope.loadContributors = function () {
        $scope.loadingAuthors = true;
        $http.get(
                "https://api.github.com/repos/" + $routeParams["org"] + "/"
                + $routeParams["repo"] + "/stats/contributors")
                .success(function (data, status, headers) {
                    Quota.setNormalQuota(headers);
                    if (status == 200) {
                        $scope.authors = data;
                        //Sum of commits
                        $scope.totalCommits = $scope.authors.map(function (a) {
                            return a.total
                        }).reduce(function (previous, current) {
                            return previous + current
                        }, 0)
                        $scope.loadingAuthors = false;
                    } 
                    else if (status == 202) //If github api cache isn't ready, we try again
                    {
                        $scope.loadContributors();
                    }
                })
    }
    $scope.loadContributors();
    
    $scope.page = 1;
    $scope.loadCommits = function(page){
        page = !page? 1 : page;
        $scope.page = page;
        $scope.loadingCommits = true;
        $http.get(
                "/commits/" + $routeParams["org"] + "/"
                + $routeParams["repo"] + "/"+ $scope.page).success(
                function (data, status,headers) {
                    Quota.setNormalQuota(headers);
                    if (page == 1) {
                        $scope.commits = data;
                    }
                    else {
                        $scope.commits = $scope.commits.concat(data);
                    }
                    $scope.loadingCommits = false;
                }).error(
                function (data,status,headers) {
                    Quota.setNormalQuota(headers);
                    Repos.searchText = $routeParams["repo"];
                    Repos.update();
                    $location.path('/');
                })
    }
    $scope.loadCommits();

    //return a font size proportional with the total of commits
    $scope.calculateFontSize = function (author) {
        var min = 12;
        var max = 30;
        var porcent = 100 * author.total / $scope.totalCommits;
        return ((porcent * (max - min) / 100) + min) + 'px';
    }
})
