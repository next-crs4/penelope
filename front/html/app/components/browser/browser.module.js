var browser_module = angular.module('BrowserModule',[]);

browser_module.run(function($rootScope){
  $rootScope._ = _;
});

browser_module.controller('BrowserCtrl',
	function(BikaService, Utility, config, ngCart, $scope, $rootScope) {
        var viz;

        $scope.draw = function() {
            var config = {
                container_id: "viz",
                server_url: "bolt://bioinfo27.crs4.it:7687",
                server_user: "neo4j",
                server_password: "neo4jpw",
                labels: {
                    "Project": {}
                },
                relationships: {
                    "INTERACTS": {
                        "thickness": "weight",
                        "caption": false
                    }
                },
                initial_cypher: "MATCH (n:Project) RETURN *"
            };

            viz = new NeoVis.default(config);
            viz.render();
        }

        $scope.draw();
    }
);