var runs_module = angular.module('RunsModule',[]);

runs_module.run(function($rootScope){
  $rootScope._ = _;
});

runs_module.controller('RunsCtrl',
	function(BikaService, IrodsService, Utility, config, $scope, $rootScope, $http) {

		$scope.loading_search = Utility.loading({
            busyText: 'Wait while searching ngs runs...',
            delayHide: 1500,
        });

        $scope.checked_list = [];

		$scope.pagination= {
			page_nr: 0,
			page_size: 25,
			total: 0,
			current: 1,
			last: 0,
		};

		this.changePage = function(newPageNumber, oldPageNumber) {
			if (newPageNumber !== undefined) {
				$scope.pagination.page_nr = newPageNumber-1;
				$scope.pagination.current = newPageNumber;
			}
			$scope.getRuns();
		}

		$scope.runs = [];
		$scope.attachment = {content: null, run: null};

		// :: function :: getRuns()
        $scope.getRuns =
            function() {
            	$scope.loading_search.show();
                $scope.runs = [];
                this.params = {sort_on: 'runs', sort_order: 'descending',
                	page_nr: $scope.pagination.page_nr, page_size: $scope.pagination.page_size};
				IrodsService.getRuns(this.params).success(function (data, status, header, config){
                    $scope.runs = data.result.objects;
                    $scope.pagination.total = data.result.total;
                    $scope.pagination.last = data.result.last;
					$scope.loading_search.hide();

                });
            };

        $scope.getRuns();

		$scope.sort = function(keyname){
			$scope.sortKey = keyname;   //set the sortKey to the param passed
			$scope.reverse = !$scope.reverse; //if true make it false and vice versa
		}

		this.getMetadata = function(imeta, key) {
			this.value = "X";
			this.metadata = _.findWhere(imeta, {'name': key});
			if (this.metadata !== undefined) {
				this.value = this.metadata.value !== 'None' ?  this.metadata.value : "X"
			}
			return this.value;

		}

		this.show_samplesheet = function(run, path) {
			$scope.attachment = {content: null, run: null};
			this.params = {run: run, path: path}
			IrodsService.getSamplesheet(this.params).success(function (data, status, header, config){
                   $scope.attachment.content = data.result.objects;
                   $scope.attachment.run = run;
                });
		}

		this.get_filename = function() {
			return $scope.attachment.run + ".csv"
		}

		this.hide = true;
});

runs_module.controller('CheckCtrl',
	function(BikaService, IrodsService, Utility, config, $scope, $rootScope, $http) {

		$scope.loading_search = Utility.loading({
            busyText: 'Wait while checking ngs runs...',
            delayHide: 1500,
        });

		$scope.checks = [];

		// :: function :: checkRuns()
        $scope.checkRuns =
            function() {
            	$scope.loading_search.show();
                $scope.runs = [];
                this.params = {sort_on: 'runs', sort_order: 'descending'};
				IrodsService.checkRuns(this.params).success(function (data, status, header, config){
                    $scope.checks = data.result.objects;
					$scope.loading_search.hide();
                });
            };

        $scope.checkRuns();

		$scope.sort = function(keyname){
			$scope.sortKey = keyname;   //set the sortKey to the param passed
			$scope.reverse = !$scope.reverse; //if true make it false and vice versa
		}

});

runs_module.controller('RunDetailsCtrl',
	function(BikaService, IrodsService, Utility, config, $scope, $rootScope, $stateParams) {

		$scope.state = {rd_label: $stateParams.rd_label};

		$scope.loading_search = Utility.loading({
            busyText: 'Wait while loading...',
            delayHide: 1500,
        });

        $scope.run = null;
        $scope.samples = []
		$scope.attachment = {content: null, run: null};

		// :: function :: getRuns()
        $scope.getRun =
            function(rd_label) {
            	$scope.loading_search.show();
                $scope.run = null;
                this.params = {rd_label: rd_label};
				IrodsService.getRuns(this.params).success(function (data, status, header, config){
                    $scope.run = data.result.objects.pop();
                    $scope.attachment = {content: null, run: null};
					this.params = {run: $scope.run.run, path: $scope.run.path}
					IrodsService.getSamplesheet(this.params).success(function (data, status, header, config){
						   $scope.attachment.content = data.result.objects;
						   $scope.attachment.run = $scope.run.run;
					       $scope.getSamples($scope.attachment.content);
					       $scope.loading_search.hide();
					});

                });
            };

        $scope.getRun($scope.state.rd_label);
        $scope.getSamples = function(samplesheet) {
        	var start_sample_list = false;
        	var sample_list = [];
        	var samples = {};
        	_.each(samplesheet, function(row) {

        		if (start_sample_list) {
        			sample = row[isampleid];
        			lane = row[ilanes];
	 				if ( _.has(samples, sample) === false) {
	 					samples[sample] = [];
	 				}
	 				samples[sample].push(lane);
        		}
        		if (_.indexOf(row,'Sample_ID') !== -1){
						start_sample_list = true;
						isampleid = _.indexOf(row,'Sample_ID');
						ilanes = _.indexOf(row,'Lane');
				}
        	});

			this.params = {ids: _.keys(samples).join('|')}
			BikaService.getAnalysisRequests(this.params).success(function (data, status, header, config){
                    $scope.analysis_requests = data.result.objects;
            		_.each(data.result.objects, function(ar) {
            			ar['lanes'] = samples[ar['id']];
            			sample_list.push(ar);
            		});
            		$scope.samples = sample_list;

            });
        }


        this.getMetadata = function(imeta, key) {
			this.value = "X";
			this.metadata = _.findWhere(imeta, {'name': key});
			if (this.metadata !== undefined) {
				this.value = this.metadata.value !== 'None' ?  this.metadata.value : "X"
			}
			return this.value;

		}



		this.get_filename = function() {
			return $scope.attachment.run + ".csv"
		}

		this.hide = true;
});