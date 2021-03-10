var targets_module = angular.module('TargetsModule',[]);

targets_module.run(function($rootScope){
  $rootScope._ = _;
});

targets_module.controller('TargetsCtrl',
	function(BikaService, Utility, config, ngCart, $scope, $rootScope) {

		$scope.loading_search = Utility.loading({
            busyText: 'Wait while searching targets...',
            delayHide: 1000,
        });

        $scope.sort = function(keyname){
			$scope.sortKey = keyname;   //set the sortKey to the param passed
			$scope.reverse = !$scope.reverse; //if true make it false and vice versa
		}

        $scope.loading_change_review_state =
        	function(text) {
        		this.params = {
	        		busyText: text===undefined?'Wait...':'Wait while ' + text + '...',
            		delayHide: 1000,
            		theme: 'warning',
        		}
        		return Utility.loading(this.params);
        	};

        this.init =
            function() {
                $scope.loading_search.show();
                this.parama = {};
                BikaService.getPurchaseOrders(this.params).success(function (data, status, header, config){
                	$scope.purchase_orders = data.result.objects;
					$scope.loading_search.hide();
					$scope.loading_search.show();
                    $scope.targets = [];
                    this.params = {sort_on: 'id', sort_order: 'descending', Subject:'purchase_order'};

                    BikaService.getClients(this.params).success(function (data, status, header, config){
                        $scope.targets = data.result.objects;
                        transitions = Array();
                        _.each($scope.targets,function(obj) {
                            Utility.merge(transitions,obj.transitions,'id');
                        });
                        $scope.transitions = transitions;
                        $scope.loading_search.hide();
                    });
                });
		}


        this.init();

        this.format_date =
			function(date) {
				return Utility.format_date(date);
			};

		this.format_review_state =
			function(review_state) {
				return Utility.format_review_state(review_state);
			};

		this.get_purchase_orders =
		    function(id) {
		        this.purchase_orders = _.filter($scope.purchase_orders, {'client_id': id});
		        return this.purchase_orders.length;
		    };

		this.get_total_amount =
		     function(id) {
		        this.purchase_orders = _.filter($scope.purchase_orders, {'client_id': id});
		        amount = 0;
		        _.each(this.purchase_orders, function(obj){
		            if (obj.contributors !== '') {
		                amount+=parseInt(obj.contributors);
		            }

		        });
		        return amount
		    };
});

targets_module.controller('TargetDetailsCtrl',
	function(BikaService, Utility, $state, $stateParams, $scope, $rootScope) {
	    $scope.state = {target_id: $stateParams.target_id};
		$scope.target = null;
		$scope.purchase_orders = [];

		$scope.loading_target = Utility.loading({
            busyText: 'Wait while loading...',
            delayHide: 1500,
        });

        this.init =
            function(target_id) {
                $scope.loading_target.show();

                this.params = {review_state: 'active'};
                BikaService.getSuppliers(this.params).success(function (data, status, header, config){
                            $scope.suppliers = data.result.objects;
                });

                this.params = {'Subject': 'active'};
				BikaService.getLabProducts(this.params).success(function (data, status, header, config){
					$scope.lab_products = data.result.objects;
				});

                this.params = {client_id: target_id};
                BikaService.getPurchaseOrders(this.params).success(function (data, status, header, config){
                    $scope.purchase_orders = data.result.objects;
                    $scope.loading_target.hide();
                    $scope.loading_target.show();
                    this.params = {id: target_id};
                    console.log(target_id);
                    BikaService.getClients(this.params).success(function (data, status, header, config){
                        $scope.target = data.result.objects[0];
                        $scope.loading_target.hide();

                    });
                });
            };

        this.init($scope.state.target_id);

        this.format_date =
			function(date) {
				return Utility.format_date(date);
			};

		this.format_review_state =
			function(review_state) {
				return Utility.format_review_state(review_state);
			};

		this.get_purchase_orders =
		    function() {
		        return $scope.purchase_orders.length;
		    };

		this.get_total_amount =
		     function() {
		        amount = 0;
		        _.each($scope.purchase_orders, function(obj){
		            if (obj.contributors !== '') {
		                amount+=parseInt(obj.contributors);
		            }

		        });
		        return amount;
		    };

		this.get_supplier = function(id) {
            this.supplier = _.findWhere($scope.suppliers, {id: id});
            this.title = this.supplier !== undefined ? this.supplier.name : '';
            return this.title;
        }

        this.get_lab_products = function(str) {
            remarks = JSON.parse(str);
            var reagents = [];
            _.each(remarks, function(k,v){
                this.lab_product = _.findWhere($scope.lab_products, {id: v});
                if (this.lab_product !== undefined) {
                    this.lab_product['quantity'] = k;
                    reagents.push(this.lab_product)
                }
            });

            return reagents;
        }


});