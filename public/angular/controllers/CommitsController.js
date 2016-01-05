app.controller("CommitsController", function ($scope, $routeParams,
        Repos, $http, $location, Quota, $filter) {
    $scope.repos = Repos;

    $scope.commits = [];
    $scope.authors = [];
    $scope.loadingCommits = false;

    $scope.page = 1;
    $scope.loadCommits = function (page) {
        page = !page ? 1 : page;
        $scope.page = page;
        $scope.loadingCommits = page > 1;
        $scope.firstLoad = page == 1;
        $http.get(
                "/commits/" + $routeParams["org"] + "/"
                + $routeParams["repo"] + "/" + $scope.page).success(
                function (data, status, headers) {
                    Quota.setNormalQuota(headers);
                    if (page == 1) {
                        $scope.commits = data.commits;
                        $scope.authors = data.authors;
                        $scope.totalCommits = data.totalCommits;
                    }
                    else {
                        $scope.commits = angular.extend($scope.commits, data.commits);
                    }

                    if (data.totalCommits < 100) {
                        $scope.noMoreResults = true;
                    }
                    $scope.loadingCommits = false;
                    $scope.firstLoad = false;
                }).error(
                function (data, status, headers) {
                    if (status == 401) {
                        Quota.login = false;
                        $scope.loadCommits(page);
                    }
                    else if (status == 409) {
                        $scope.loadingCommits = false;
                        $scope.firstLoad = false;
                        $scope.error = "This repository is empty"
                    }
                    else {
                        Quota.setNormalQuota(headers);
                        Repos.searchText = $routeParams["repo"];
                        Repos.update();
                        $location.path('/');
                    }

                })
    }
    $scope.loadCommits();


    $scope.loadRepo = function () {
        $http.get(
                "/repo/" + $routeParams["org"] + "/"
                + $routeParams["repo"])
                .success(
                        function (data, status, headers) {
                            Quota.setNormalQuota(headers);
                            $scope.repo = data;
                        })
                .error(
                        function (data, status, headers) {
                            if (status == 401) {
                                Quota.login = false;
                                $scope.loadRepo();
                            }
                        })
    }
    $scope.loadRepo();

    //return a font size proportional with the total of commits
    $scope.calculateFontSize = function (author) {
        var min = 12;
        var max = 30;
        var porcent = 100 * author.total / $scope.totalCommits;
        return ((porcent * (max - min) / 100) + min) + 'px';
    }

    $scope.porcentByYear = function (year) {
        console.log("year");
        var nbCommits = $scope.commits.reduce(function (res, commit) {
            if ($filter('date')(commit.date, 'yyyy') == year)
                res = res + 1;
            return res;
        }, 0)
        return Math.floor(nbCommits / $scope.commits.length * 100);
    }
    $scope.porcentByMonth = function (month) {
        return Math.floor($scope.commits.reduce(function (res, commit) {
            if ($filter('date')(commit.date, 'MMMM') == month)
                res++;
            return res;
        }, 0) / $scope.commits.length * 100);
    }
})
