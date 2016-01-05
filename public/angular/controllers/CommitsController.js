app.controller("CommitsController", function ($scope, $routeParams,
        Repos, $http, $location, Quota) {
    $scope.repos = Repos;

    $scope.commits = {};
    $scope.authors = [];
    $scope.loadingCommits = false;
    $scope.totalCommits = 0;

    $scope.page = 1;


    $scope.concatCommits = function (data) {
        Object.keys(data.commits).forEach(function (year) {
            if ($scope.commits[year]) {
                Object.keys(data.commits[year]).forEach(function (month) {
                    console.log(year, $scope.commits[year][month])
                    if ($scope.commits[year][month])
                        $scope.commits[year][month] = $scope.commits[year][month].concat(data.commits[year][month])
                    else
                        $scope.commits[year][month] = data.commits[year][month]
                    console.log(year, $scope.commits[year][month])
                })
            }
            else {
                $scope.commits[year] = data.commits[year]
            }
        })
    }

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
                        $scope.authors = data.authors;
                    }
                    if (data.totalCommits < 100) {
                        $scope.noMoreResults = true;
                    }
                    $scope.concatCommits(data);
                    $scope.totalCommits += data.totalCommits;

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

    $scope.totalCommitsOfYear = function (year) {
        return Object.keys($scope.commits[year]).reduce(function (res, key) {
            //console.log($scope.commits[year])
            return res + $scope.commits[year][key].length;
        }, 0)
    }
    $scope.percentByYear = function (year) {
        return Math.floor($scope.totalCommitsOfYear(year) / $scope.totalCommits * 100);
    }
    $scope.percentByMonth = function (commits, total) {
        var total = total == null ? $scope.totalCommits : total;
        return Math.floor(commits.length / total * 100);
    }
    $scope.displayAll = false;
})

app.controller("DisplayController", function ($scope) {
    $scope.display = false;
    $scope.toggle = function () {
        $scope.display = !$scope.display;
    }
})
