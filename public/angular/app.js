var app = angular.module('GitHubStats',
		[ 'ngRoute', 'ngResource' ]);

app.config([ '$routeProvider','$locationProvider', function($routeProvider,$locationProvider) {
	$routeProvider.when('/', {
		templateUrl : '/angular/views/repos.html',
		controller : 'ReposController'
	}).when('/repos/:org/:repo', {
		templateUrl : '/angular/views/commits.html',
		controller : 'CommitsController'
	}).otherwise({
		templateUrl : '/angular/errors/404.html',
	})
	$locationProvider.html5Mode(true);
} ])

//GitHub limit rates.
app.factory('Quota', function(){
    return {
        searchQuota : null,
        searchTime : null,
        normalQuota : null,
        normalTime : null,
        setSearchQuota : function(headers){
            this.searchQuota = headers("x-ratelimit-remaining");
            this.searchTime =  headers("x-ratelimit-reset");
        },
        setNormalQuota : function(headers){
            this.normalQuota = headers("x-ratelimit-remaining");
            this.normalTime =  headers("x-ratelimit-reset");
        }
    }
})

//GitHub Repositories
app.factory('Repos', function($http, Quota) {
    return {
        loading : false,
        data : { items : []},
        searchText : "",
        page : 1,
        completion : [],
        last_update : new Date(),
        update : function(page){
            page = !page ? 1 : page;
            this.page = page;
            if(this.searchText.length){
                //Keep a reference of the main object
                var that = this;
                //Get the time of the request to be sure that older request doesn't overwrite new results
                var thisTime = new Date();
                this.last_update = thisTime;
                this.loading = true;
                $http.get('https://api.github.com/search/repositories?per_page=100&page='
                        +this.page+'&q='+this.searchText)
                .success(function(data,status,headers){
                    Quota.setSearchQuota(headers);
                        if(that.last_update == thisTime){
                            if(page == 1){
                                    that.data = data;
                                    //Remove duplicate for the completion helper
                                    that.completion = that.data.items.reduce(function(res, repo) {
                                        if (res.indexOf( repo.name ) < 0) res.push( repo.name );
                                        return res;
                                    }, []);
                            }else{
                                that.data.items = that.data.items.concat(data.items);
                            }
                        }
                        that.loading = false;
                }).error(function(data,status,headers){
                        that.loading = false;
                        Quota.setSearchQuota(headers)
                })			
            }
        }
};
}
)

app.controller("MainController",function($scope, Quota){
    $scope.quota = Quota;
})


