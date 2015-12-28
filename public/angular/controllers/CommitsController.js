app.controller("CommitsController", function ($scope, $routeParams,
        Repos, $http, $location, Quota) {
    $scope.repos = Repos;

    $scope.commits = [];
    $scope.authors = [];
    $scope.loadingCommits = false;

    $scope.page = 1;
    $scope.loadCommits = function (page) {
        page = !page ? 1 : page;
        $scope.page = page;
        $scope.loadingCommits = true;
        $http.get(
                "/commits/" + $routeParams["org"] + "/"
                + $routeParams["repo"] + "/" + $scope.page).success(
                function (data, status, headers) {
                    Quota.setNormalQuota(headers);
                    if (page == 1) {
                        $scope.commits = data.commits;
                        $scope.authors = data.authors;
                        $scope.totalCommits = $scope.commits.length;
                    }
                    else {
                        if (data.commits.length) {
                            $scope.commits = $scope.commits.concat(data.commits);
                        } else {
                            $scope.noMoreResults = true;
                        }
                    }
                    $scope.loadingCommits = false;
                }).error(
                function (data, status, headers) {
                    if(status == 401){
                        Quota.login = false;
                        $scope.loadCommits(page);              
                    }
                    else{
                        Quota.setNormalQuota(headers);
                        Repos.searchText = $routeParams["repo"];
                        Repos.update();
                        $location.path('/');
                    }
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
