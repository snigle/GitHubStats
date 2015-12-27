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
		templateUrl : '/angulars/errors/404.html',
	})
	$locationProvider.html5Mode(true);
} ])

//app.run(function($http) {
//  $http.defaults.headers.common.Authorization = 'token 6c2fac592f4098ca7211429aaf81a71275088b03';
//});
app.factory('Quota', function(){
    return {
        searchQuota : 10,
        searchTime : null,
        normalQuota : 60,
        normalTime : null,
        setSearchQuota : function(headers){
            this.searchQuota = headers("x-ratelimit-remaining");
            this.searchTime =  headers("x-ratelimit-reset");
            console.log("set search");
        },
        setNormalQuota : function(headers){
            this.normalQuota = headers("x-ratelimit-remaining");
            this.normalTime =  headers("x-ratelimit-reset");
        }
    }
})
app.factory('Repos', function($http, Quota) {
	return {
		loading : false,
		data : {},
		searchText : "",
		page : 1,
		completion : [],
		last_update : new Date(),
		update : function(page = 1){
			this.page = page;
			if(this.searchText.length){
				var that = this;
				var thisTime = new Date();
				this.last_update = thisTime;
				this.loading = true;
				$http.get('https://api.github.com/search/repositories?page='+this.page+'&q='+this.searchText)
				.success(function(data,status,headers){
                                    Quota.setSearchQuota(headers);
					if(that.last_update == thisTime){
						if(page == 1){
							that.data = data;
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
		},
		nextPage : function(){
			this.update(this.page+1);
		}
	};
	}
)



