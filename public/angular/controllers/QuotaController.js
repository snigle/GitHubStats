app.controller("QuotaController", function ($scope, $http, Quota, $location, $timeout) {
    $scope.quota = Quota;


    $scope.updateDate = function (time) {
        var now = new Date();
        if (time * 1000 < now.getTime()) {
            $scope.exceeded = false;
        }
        else {
            $scope.test = "toto";
            $scope.exceeded = true;
            var diff = time - now.getTime() / 1000;
            $scope.hours = Math.floor(diff / (60 * 60));
            $scope.minuts = Math.floor(diff / (60));
            $scope.seconds = Math.floor(diff);
            $timeout(function () {
                $scope.updateDate(time);
            }, 1000)
        }
    }

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


})