app.controller("QuotaController", function ($scope, $http, Quota, $location, $timeout) {
    $scope.quota = Quota;

    //Calculate remaining time of the github API
    $scope.updateDate = function (time, callback) {
        var now = new Date();
        if (time * 1000 < now.getTime()) {
            $scope.quota.exceeded = false;
        }
        else {
            $scope.quota.exceeded = true;
            var diff = time - now.getTime() / 1000;
            $scope.hours = Math.floor(diff / (60 * 60)) % 24;
            $scope.minutes = Math.floor(diff / 60) % 60;
            $scope.seconds = Math.floor(diff) % 60;
            $timeout(function () {
                $scope.updateDate(time);
            }, 1000)
        }
    }

    //Event when a quota change, if it's zéro, show a popup with a timer.
    $scope.$watch(function () {
        return $scope.quota.searchQuota;
    },
            function (newVal, oldVal) {
                if (newVal <= 0) {
                    $scope.updateDate(Quota.searchTime);
                }
            })
    $scope.$watch(function () {
        return $scope.quota.normalQuota;
    },
            function (newVal, oldVal) {
                if (newVal <= 0) {
                    $scope.updateDate(Quota.normalTime);
                }
            })

    $scope.redirect_uri = encodeURIComponent($location.absUrl());

    if (code = $location.search().code) {
        $http.get("/login/" + code).success(function (data) {
            $location.search("code", null);
            $http.defaults.headers.common.Authorization = 'token ' + data.access_token;
            Quota.login = true;
        })
    }

    $scope.signin = function (access_token) {
        if (access_token) {
            $http.defaults.headers.common.Authorization = 'token ' + access_token;
            Quota.login = true;
        }
    }

})