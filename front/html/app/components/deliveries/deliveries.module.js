var deliveries_module = angular.module('DeliveriesModule',[]);

deliveries_module.run(function($rootScope){
  $rootScope._ = _;
});

deliveries_module.controller('DeliveriesCtrl',
	function(BikaService, Utility, config, ngCart, $scope, $rootScope) {

		$scope.loading_search = Utility.loading({
            busyText: 'Wait while searching deliveries...',
            delayHide: 1000,
        });

        $scope.loading_change_review_state =
        	function(text) {
        		this.params = {
	        		busyText: text===undefined?'Wait...':'Wait while ' + text + '...',
            		delayHide: 1000,
            		theme: 'warning',
        		}
        		return Utility.loading(this.params);
        	};

		$scope.checked_list = [];
		$scope.review_state = 'draft';

		$scope.pagination= {
			page_nr: 0,
			page_size: 10,
			total: 0,
			current: 1,
			last: 0,
		};

		this.changePage = function(newPageNumber, oldPageNumber) {
			if (newPageNumber !== undefined) {
				$scope.pagination.page_nr = newPageNumber-1;
				$scope.pagination.current = newPageNumber;
			}
			$scope.getDeliveries($scope.review_state);
		}

        // :: function :: getDeliveries()
        $scope.getDeliveries =
            function(review_state) {
            	$scope.loading_search.show();
            	$scope.review_state = review_state;
                $scope.deliveries = [];
                this.params = {
                    sort_on: 'Date', sort_order: 'descending', Subject: review_state,
                	page_nr: $scope.pagination.page_nr, page_size: $scope.pagination.page_size
                };

                BikaService.getWorksheets(this.params).success(function (data, status, header, config){
					$scope.deliveries = data.result.objects;
//                    console.log($scope.deliveries);
                    $scope.pagination.total = data.result.total;
                    $scope.pagination.last = data.result.last;

					transitions = Array();
					_.each($scope.deliveries,function(obj) {
						if (obj.transitions.length > 0) {
							Utility.merge(transitions,obj.transitions,'id');
						}
						else {
							Utility.merge(transitions,[{'id': obj.review_state}], 'id');
						}

					});
                    $scope.transitions = transitions;
					$scope.loading_search.hide();

                });
            };

        $scope.getDeliveries($scope.review_state);

        this.format_date =
			function(date) {
				return Utility.format_date(date);
			};

		this.format_review_state =
			function(review_state) {
				return Utility.format_review_state(review_state);
			};

		this.check_transitions =
			function(id_transition, transitions) {
				if (transitions === undefined) {
					var transitions = $scope.transitions;
				} else {
					transitions = [{'id': transitions}];
				}
				return Utility.check_transitions(id_transition, transitions);
		}

		this.toggle =
			function(id) {
				var idx = $scope.checked_list.indexOf(id);
				if (idx > -1) {
					$scope.checked_list.splice(idx, 1);
				}
				else {
					$scope.checked_list.push(id);
				}
				//console.log($scope.checked_list);
			}

		this.toggle_all = function() {
				if ($scope.checked_list.length < $scope.deliveries.length) {
					_.each($scope.deliveries,function(b) {
						$scope.checked_list.push(b.id);
					})
				}
				else {
					$scope.checked_list = [];
				}
		}


        $scope._get_input_values_review_state =
			function (delivery_id, review_state) {
				if (!Array.isArray(delivery_id)) {
					var input_values = {};
					input_values[$scope._get_delivery_path(delivery_id)] = {subject: review_state};
					return JSON.stringify(input_values);
				}
				else if (Array.isArray(delivery_id)) {
					var input_values = {};
					_.each(delivery_id, function(id) {
						input_values[$scope._get_delivery_path(id)] = {subject: review_state};
					});
					return JSON.stringify(input_values);
				}
			}

        $scope._get_delivery_path =
			function(delivery_id) {
				this.delivery = _.findWhere($scope.deliveries, {'id': delivery_id});
				return this.delivery.path;
			}

		this.change_review_state =
			function (review_state, delivery_id) {
				if (delivery_id === undefined) {
					var delivery_id = $scope.checked_list;
				}

				$scope.loading_change_review_state('updating delivery status').show();
				this.params = {input_values: $scope._get_input_values_review_state(delivery_id, review_state)};
				BikaService.updateDeliveries(this.params).success(function (data, status, header, config){
					$scope.loading_change_review_state('updating delivery status').hide();
					$scope.checked_list = [];
				 	$scope.getDeliveries($scope.review_state);
				});
			}

		this.decode_location = function(location, key) {
		    location = JSON.parse(location);
		    return location[key];
		}

		this.count_samples = function(remarks) {
		    remarks = JSON.parse(remarks);
		    return remarks.length;
		}
		$scope.params = {delivery_status: 'draft'};
});

deliveries_module.controller('DeliveryDetailsCtrl',
	function(BikaService, Utility, ngCart, $stateParams, $state, config, $scope, $rootScope) {

		$scope.delivery = [];
		$scope.state = {delivery_id: $stateParams.delivery_id};

		$scope.loading_delivery = Utility.loading({
            busyText: 'Wait while loading delivery data...',
            delayHide: 1000,
        });

        $scope.getDelivery =
            function(delivery_id) {
            	$scope.loading_delivery.show();
                this.params = {sort_on: 'Date', sort_order: 'descending', id: delivery_id};
                BikaService.getWorksheets(this.params).success(function (data, status, header, config){
                    $scope.delivery = data.result.objects[0];
                    $scope.delivery.details = JSON.parse($scope.delivery.location);
                    var samples = JSON.parse($scope.delivery.remarks);
                    var ids = [];
					_.each(samples, function(a){
						if (ids.indexOf(a.request_id) === -1) {ids.push(a.request_id);}
					});
					this.params = {'ids': ids.join('|')};
					BikaService.getAnalysisRequests(this.params).success(function (data, status, header, config){
						this.result = data.result.objects;
						$scope.delivery.samples = this.result;
					});
                });
        };

        $scope.getDelivery($scope.state.delivery_id);

		this.format_date =
			function(date) {
				return Utility.format_date(date);
			};

		this.format_review_state =
			function(review_state) {
				return Utility.format_review_state(review_state);
			};


});