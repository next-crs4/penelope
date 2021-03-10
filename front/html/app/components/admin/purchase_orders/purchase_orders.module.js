var purchase_orders_module = angular.module('PurchaseOrdersModule', []);

purchase_orders_module.run(function($rootScope){
  $rootScope._ = _;
});

purchase_orders_module.controller('PurchaseOrdersCtrl',
	function(BikaService, Utility, $state, $scope, $rootScope) {

		$scope.loading_search = Utility.loading({
            busyText: 'Wait while loading...',
            delayHide: 1500,
        });


        $scope.checked_list = [];
		$scope.review_state = 'draft';

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
			this.getPurchaseOrders($scope.review_state);
		}

		$scope.sort = function(keyname){
			$scope.sortKey = keyname;   //set the sortKey to the param passed
			$scope.reverse = !$scope.reverse; //if true make it false and vice versa
		}

		this.getClients =
		    function() {
		        this.params = {Subject: 'purchase_order'};
		        BikaService.getClients(this.params).success(function (data, status, header, config){
                    $scope.clients = data.result.objects;
                });
		}

		this.getPurchaseOrders =
            function(review_state) {
                $scope.loading_search.show();
            	$scope.review_state = review_state;
                $scope.purchase_orders = [];
                this.params = {	sort_on: 'Date', sort_order: 'descending',
                			page_nr: $scope.pagination.page_nr, page_size: $scope.pagination.page_size};

                if (review_state === 'all') {
					this.params['Subjects'] = 'draft|issued|completed';
				}
				else {
					this.params['Subject'] = review_state;
				}

                BikaService.getPurchaseOrders(this.params).success(function (data, status, header, config){

                	$scope.purchase_orders = data.result.objects;
                    $scope.pagination.total = data.result.total;
                    $scope.pagination.last = data.result.last;

                    $scope.transitions = transitions;
					$scope.loading_search.hide();
                });
		}

		this.getSuppliers =
			function() {
				this.params = {review_state: 'active'};
				BikaService.getSuppliers(this.params).success(function (data, status, header, config){
					$scope.suppliers = data.result.objects;
				});
		}

        this._getLabProducts =
			function() {
				this.params = {'Subject': 'active'};
				BikaService.getLabProducts(this.params).success(function (data, status, header, config){
					$scope._lab_products = data.result.objects;
				});
			}

        this.getPurchaseOrders($scope.review_state);
        this.getSuppliers();
        this._getLabProducts();
        this.getClients();

        this.format_date =
			function(date) {
				return Utility.format_date(date);
			};

		this.format_review_state =
			function(review_state) {
				return Utility.format_review_state(review_state);
			};

		this.get_supplier = function(id) {
            this.supplier = _.findWhere($scope.suppliers, {id: id});
            this.title = this.supplier !== undefined ? this.supplier.name : '';
            return this.title;
        }

        this.get_target =
			function(client_id) {
				this.client = _.findWhere($scope.clients, {id: client_id});
				if (this.client !== undefined) {
                	return this.client.title;
                }
				return '';
			}

        this.get_lab_products = function(str) {
            remarks = JSON.parse(str);
            var reagents = [];
            _.each(remarks, function(k,v){
                this.lab_product = _.findWhere($scope._lab_products, {id: v});
                if (this.lab_product !== undefined) {
                    this.lab_product['quantity'] = k;
                    reagents.push(this.lab_product)
                }
            });

            return reagents;
        }

	});

purchase_orders_module.controller('AddPurchaseOrderCtrl',
	function(BikaService, Utility, $state, $scope, $rootScope) {

		$scope.clients = [];
		$scope.contacts= [];
		$scope.checked_list = [];
		$scope.lab_products = [];

		$scope.loading_create = Utility.loading({
            busyText: 'Wait while creating...',
            delayHide: 1500,
        });

		$scope.sort = function(keyname){
			$scope.sortKey = keyname;   //set the sortKey to the param passed
			$scope.reverse = !$scope.reverse; //if true make it false and vice versa
		}

        $scope.purchaseorder_params = {
            title: null,
            description: null,
            client: null,
            contact: null,
            supplier: null,
            amount: null,
            lab_products: {},
        };

        // :: function :: getClients()
        this.getClients =
            function() {
                $scope.clients = [];
                this.params = {Subject: 'purchase_order'};
                BikaService.getClients(this.params).success(function (data, status, header, config){
                    $scope.clients = data.result.objects;
                });
            };

        // :: function :: getContacts()
        this.getContacts =
            function(purchaseorder_params) {
                $scope.contacts = [];
                this.params = purchaseorder_params.client != null ? {client_id: purchaseorder_params.client.id} : {}
                BikaService.getContacts(this.params).success(function (data, status, header, config){
                    $scope.contacts = data.result.objects;
                    if ($scope.contacts.length > 0 ) {
                        $scope.purchaseorder_params.contact = _.last($scope.contacts);
                    }
                });
            };


        // :: function :: getLabProducts)=
        this.getLabProducts =
			function() {
				this.params = {'Subject': 'active'};
				BikaService.getLabProducts(this.params).success(function (data, status, header, config){
					$scope.lab_products = data.result.objects;
				});
			}

        this.getManufacturers =
			function() {
				this.params = {review_state: 'active'};
				BikaService.getManufacturers(this.params).success(function (data, status, header, config){
					$scope.manufacturers = data.result.objects;
				});
		    }

		this.getSuppliers =
			function() {
				this.params = {review_state: 'active'};
				BikaService.getSuppliers(this.params).success(function (data, status, header, config){
					$scope.suppliers = data.result.objects;
				});
		    }

		this.getLabProducts();
		this.getManufacturers();
		this.getClients();
		this.getContacts($scope.purchaseorder_params);
		this.getSuppliers();

		this.submit =
        	function(purchaseorder_params) {
        		this.params = {
        			'ClientID': purchaseorder_params.client.id,
					'Contact':  purchaseorder_params.contact.id,
					'title':  purchaseorder_params.title,
					'description':  purchaseorder_params.description !== null ? purchaseorder_params.description : '',
					'OrderDate': '',
					'OrderNumber': '',
					'expirationDate': '',
					'contributors': purchaseorder_params.amount !== null ? purchaseorder_params.amount : '',
					'rights': '',
					'subject': 'draft',
					'location': purchaseorder_params.supplier.id,
					'Remarks': JSON.stringify(purchaseorder_params.lab_products),
        		}

				$scope.loading_create.show();

				BikaService.createPurchaseOrder(this.params).success(function (data, status, header, config){
					result = data.result;

                    if (result['success'] === 'True') {
                    	this.obj_id = result['obj_id'];
                    	Utility.alert({title:'Success', content: 'Your Cost Center has been successfully created with ID: '+this.obj_id, alertType:'success'});
                    	$scope.loading_create.hide();
						$state.go('purchase_orders',{},{reload: true});
                    }
                    else {
                        console.log(result['message']);
						$scope.loading_create.hide();
						Utility.alert({title:'Error while creating...', content: result['message'], alertType:'danger'});
						return;
        			}
        		});
		};

		this.get_manufacturer = function(id) {
            this.manufacturer = _.findWhere($scope.manufacturers, {id: id});
            this.title = this.manufacturer !== undefined ? this.manufacturer.title : '';
            return this.title;
        }

        $scope.$watch('purchaseorder_params.client',
            function (newValue, oldValue) {
                // Ignore initial setup.
                if ( newValue === oldValue) { return;}
                if ( newValue === null || newValue === undefined ) {
                	$scope.contacts = [];
                	return; }

                this.getContacts($scope.purchaseorder_params);
            }
        );

        this.format_date =
			function(date) {
				if (date == null) {return "";}
				return Utility.format_date(date);
			};

		this.format_review_state =
			function(review_state) {
				return Utility.format_review_state(review_state);
		};

		this.toggle =
			function(id) {
				var idx = $scope.checked_list.indexOf(id);
				if (idx > -1) {
					$scope.checked_list.splice(idx, 1);
					delete $scope.purchaseorder_params.lab_products[id];
				}
				else {
					$scope.checked_list.push(id);
				}
			}

		this.toggle_all = function() {
				if ($scope.checked_list.length < $scope.lab_products.length) {
					_.each($scope.lab_products,function(b) {
						$scope.checked_list.push(b.id);
					})
				}
				else {
					$scope.checked_list = [];
					$scope.purchaseorder_params.lab_products = {};
				}
		}


	});

purchase_orders_module.controller('PurchaseOrderDetailsCtrl',
	function(BikaService, Utility, $state, $stateParams, $scope, $rootScope) {

		$scope.state = {purchaseorder_id: $stateParams.purchaseorder_id};
		$scope.purchase_order = null;

		$scope.loading_search = Utility.loading({
            busyText: 'Wait while loading...',
            delayHide: 3000,
        });

        $scope.loading_update = Utility.loading({
            busyText: 'Wait while updating...',
            delayHide: 1500,
        });

        $scope.loading_change_review_state =
        	function(text) {
        		this.params = {
	        		busyText: text===undefined?'Wait...':'Wait while ' + text + '...',
            		delayHide: 700,
            		theme: 'warning',
        		}
        		return Utility.loading(this.params);
        	};


        $scope.purchaseorder_params = {
            order_number: null,
            cig_number: null,
            order_date: null,
            closing_date: null,
        };

        $scope.reagents_params = {
            expiration_date: {},
            storage_location: {},
            received_date: {},
        };

        $scope.edit_reagents_params = {
            expiration_date: null,
            storage_location: null,
            received_date: null,
        };

        $scope.checked_list = [];

        $scope.getReagents =
		    function() {
		        this.params = {};
		        BikaService.getLabProducts(this.params).success(function (data, status, header, config){
		            $scope.reagents = [];
		            if ($scope.purchase_order.rights !== '') {
		                $scope.reagents = _.where(data.result.objects, {'rights': $scope.purchase_order.id});
		            }
		            transitions = Array();
					_.each($scope.reagents,function(obj) {
					    $scope.reagents_params.expiration_date[obj.id] = null;
					    $scope.reagents_params.received_date[obj.id] = null;
					    $scope.reagents_params.storage_location[obj.id] = null;
						Utility.merge(transitions,obj.transitions,'id');
					});
                    $scope.transitions = transitions;
//                    console.log('reagents');
//					console.log($scope.reagents);
				});
		    }

        this.getPurchaseOrder =
            function(purchaseorder_id) {
                $scope.loading_search.show();
                this.params = {sort_on: 'Date', sort_order: 'descending', id: purchaseorder_id};
                BikaService.getPurchaseOrders(this.params).success(function (data, status, header, config){

                	$scope.purchase_order = data.result.objects[0];
                	$scope.loading_search.hide();
                	$scope.getReagents();


                });

        };

        this.getClients =
            function() {
                $scope.clients = [];
                this.params = {Subject: 'purchase_order'};
                BikaService.getClients(this.params).success(function (data, status, header, config){
                    $scope.clients = data.result.objects;
                });
        };

        this.getSuppliers =
			function() {
				this.params = {review_state: 'active'};
				BikaService.getSuppliers(this.params).success(function (data, status, header, config){
					$scope.suppliers = data.result.objects;
				});
		    }

		this._getLabProducts =
			function() {
				this.params = {'Subject': 'active'};
				BikaService.getLabProducts(this.params).success(function (data, status, header, config){
					$scope._lab_products = data.result.objects;
//					console.log('lab products');
//					console.log($scope._lab_products);

				});
			}



        this.format_date =
			function(date) {
				return Utility.format_date(date);
			};

		this.format_review_state =
			function(review_state) {
				return Utility.format_review_state(review_state);
			};


        this.get_target =
			function(client_id) {
				this.client = _.findWhere($scope.clients, {id: client_id});
				if (this.client !== undefined) {
                	return this.client.title;
                }
				return '';
			}

		this.get_supplier = function(id) {
            this.supplier = _.findWhere($scope.suppliers, {id: id});
            this.title = this.supplier !== undefined ? this.supplier.name : '';
            return this.title;
        }

        this.get_storage_location =
			function(id) {
				storage_location = _.findWhere($scope.storage_locations, {id: id});
				if (storage_location === undefined) {return "";}

				return storage_location.title;
			}

        this.get_lab_products = function(str) {
            remarks = JSON.parse(str);
            var reagents = [];
            _.each(remarks, function(k,v){
                this.lab_product = _.findWhere($scope._lab_products, {id: v});
                if (this.lab_product !== undefined) {
                    this.lab_product['quantity'] = k;
                    reagents.push(this.lab_product)
                }
            });

            return reagents;
        }

        this.get_labproduct_title = function(id) {
            this.lab_product = _.findWhere($scope._lab_products, {'id': id});
            return this.lab_product.title;
        }

        $scope.getStorageLocations =
			function() {
				this.params = {};
				BikaService.getStorageLocations(this.params).success(function (data, status, header, config){
					$scope.storage_locations = data.result.objects;
				});
			}

        this.check_expiration =
			function(date) {
				return Utility.difference_between_dates('today', date, 'd');
		};

		this.check_complete =
		    function() {
		        this.reagent = _.findWhere($scope.reagents, {'review_state': 'due'});
		        this.ret_value = this.reagent === undefined ? false : true;
		        return this.ret_value;
		}

		this.edit =
		    function(edit_params) {
		        this.params = {
        		    'obj_path': $scope.purchase_order.path,
					'title':  edit_params.title,
					'description':  edit_params.description,
        		    'OrderDate': Utility.format_date(edit_params.order_date),
					'OrderNumber': edit_params.order_number,
					'rights': edit_params.cig_number,
					'location': edit_params.supplier.id,
					'contributors': edit_params.amount,
					'expirationDate': Utility.format_date(edit_params.closing_date),
        		}
        		console.log(edit_params);
        		$scope.loading_update.show();
        		BikaService.updatePurchaseOrder(this.params).success(function (data, status, header, config){
					this.result = data.result;
					if (this.result['success'] === 'True') {
					    Utility.alert({title:'Success', content: 'Purchase Order '+$scope.purchase_order.title+' has been updated', alertType:'success'});
					    $scope.edit_params = {};
//					    $scope.purchase_order = null;
					    $state.go('purchase_order',{'id': $scope.purchase_order.id},{reload: true});
					}
					else {
						Utility.alert({title:'Error while updating...', content: result['message'], alertType:'danger'});
						return;
					}

				});
		    }

        this.complete =
            function(purchaseorder_params) {
        		this.params = {
        		    'obj_path': $scope.purchase_order.path,
					'expirationDate': Utility.format_date(purchaseorder_params.closing_date),
					'subject': 'completed',
        		}

        		$scope.loading_update.show();
        		BikaService.updatePurchaseOrder(this.params).success(function (data, status, header, config){
					this.result = data.result;
					if (this.result['success'] === 'True') {
					    Utility.alert({title:'Success', content: 'Purchase Order '+$scope.purchase_order.title+' has been updated', alertType:'success'});
					    $state.go('purchase_order',{'id': $scope.purchase_order.id},{reload: true});
					}
					else {
						Utility.alert({title:'Error while updating...', content: result['message'], alertType:'danger'});
						return;
					}

				});
        	}

        this.issue =
        	function(purchaseorder_params) {
        		this.params = {
        		    'obj_path': $scope.purchase_order.path,
					'OrderDate': Utility.format_date(purchaseorder_params.order_date),
					'OrderNumber':purchaseorder_params.order_number,
					'rights': purchaseorder_params.cig_number,
					'subject': 'issued',
        		}

        		$scope.loading_update.show();
        		BikaService.updatePurchaseOrder(this.params).success(function (data, status, header, config){
					this.result = data.result;
					if (this.result['success'] === 'True') {
					    Utility.alert({title:'Success', content: 'Purchase Order '+$scope.purchase_order.title+' has been updated', alertType:'success'});
						this.lab_products = JSON.parse($scope.purchase_order.remarks);
                        var counter = {};
                        _.each(remarks, function(k,v){
                            this.lab_product = _.findWhere($scope._lab_products, {id: v});
                            counter[v] = 0;
                            for (var i=0; i<k; i++) {

                                this.reagents_params = {
                                    title: this.lab_product.id,
                                    description: '',
                                    Volume: this.lab_product.volume!==null && this.lab_product.volume.length > 0 ? this.lab_product.volume : '',
                                    Price: this.lab_product.price!==null && this.lab_product.price.length > 0 ? this.lab_product.price : '',
                                    Unit: 1,

                                    subject: 'due',
                                    rights: $scope.purchase_order.id,
                                }

                                BikaService.createLabProduct(this.reagents_params).success(function (data, status, header, config){


                                    this.result = data.result;
                                    if (result['success'] === 'True') {
                                        Utility.alert({title:'Success', content: 'LabProduct '+ this.result['obj_id'] + ' has been successfully imported', alertType:'success', duration:3000});
                                        this.path = "/" + Utility.get_root_url() + "/" + 'bika_setup' + "/" + 'bika_labproducts' + '/' + this.result['obj_id'];
                                        this._params = {f: JSON.stringify([this.path])};
//                                        console.log(this._params)

						                BikaService.deactivateLabProduct(this._params).success(function (data, status, header, config){
						                    console.log('ok');
						                    counter[v]++;
						                    if (parseInt(counter[v]) === parseInt(k)) {

                                                $state.go('purchase_order',{'id': $scope.purchase_order.id},{reload: true});
                                            }

						                });
                                    }
                                    else {
                                        Utility.alert({title:'Error while importing...', content: this.result['message'], alertType:'danger'});
                                        return;
                                    }

                                });
                            }
                        });
					}
					else {
						Utility.alert({title:'Error while updating...', content: result['message'], alertType:'danger'});
						return;
					}

				});
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
			}

		this.toggle_all = function() {
				if ($scope.checked_list.length < $scope.reagents.length) {
					_.each($scope.reagents,function(b) {
						$scope.checked_list.push(b.id);
					})
				}
				else {
					$scope.checked_list = [];
				}
		}

        this.check_transitions =
			function(id_transition, transitions) {
				if (transitions === undefined) {
					var transitions = $scope.transitions;
				}

				if (id_transition === 'unload') {
					return Utility.check_transitions('deactivate', transitions)
				}
				if (id_transition === 'load') {
					return Utility.check_transitions('activate', transitions)
				}
				if (id_transition === 'due') {
					return Utility.check_transitions('activate', transitions)
				}
				return false;

		}

		this.change_review_state =
			function (action, reagent_id) {
				if (reagent_id === undefined) {
					var reagent_id = $scope.checked_list;
				} else {var reagent_id = [reagent_id];}

				if (action === 'unload') {
					 $scope.unloadReagent(reagent_id);
				}
				else if (action === 'load') {
					 $scope.loadReagent(reagent_id);
				}
		}



		$scope.loadReagent = function(reagent_id) {
		    if ($scope.checked_list.length === 0 && reagent_id === undefined) {
					Utility.alert({title:'Error', content: 'No Reagents selected', alertType:'warning', duration:3000});
					return;
			}
			$scope.loading_change_review_state('loading').show();
			this.params = {f: $scope._get_review_params(reagent_id)};
			BikaService.activateLabProduct(this.params).success(function (data, status, header, config){
                this.params = {input_values: $scope._get_input_values(reagent_id,'loaded', $scope.reagents_params)};

                BikaService.updateLabProducts(this.params).success(function (data, status, header, config){
//                    console.log(data);
//                    var products = _.indexBy($scope._lab_products, 'id');
                    var i = 0;
                    _.each(reagent_id, function(id) {

                        this.reagent = _.findWhere($scope.reagents, {'id': id});
                        this.labproduct_id = this.reagent.title;
                        objIndex = $scope._lab_products.findIndex((obj => obj.id === this.labproduct_id));
                        $scope._lab_products[objIndex].unit = parseInt($scope._lab_products[objIndex].unit) + 1;

                        this.lab_product = $scope._lab_products[objIndex];
                        this.params = {
							obj_path: this.lab_product.path,
                            Unit: this.lab_product.unit,
                        }
                        BikaService.updateLabProduct(this.params).success(function (data, status, header, config){

                            if ( data.result['success'] === 'True') {
                                i++;
                                //products[this.labproduct_id].unit++;
								Utility.alert({title:'Success', content: 'LabProduct '+ id + ' has been successfully loaded', alertType:'success', duration:3000});
							}
							else {
								Utility.alert({title:'Error while loading...', content: this.result['message'], alertType:'danger'});
								return;
							}

                            if (i === reagent_id.length) {
                             $state.go('purchase_order',{'id': $scope.state.purchaseorder_id},{reload: true});
                            }
                        });
                    });
                });
			});

			return;

		}

		$scope.unloadReagent = function(reagent_id) {
		    if ($scope.checked_list.length === 0 && reagent_id === undefined) {
					Utility.alert({title:'Error', content: 'No Reagents selected', alertType:'warning', duration:3000});
					return;
			}
			$scope.loading_change_review_state('unloading').show();
			this.params = {f: $scope._get_review_params(reagent_id)};
			BikaService.deactivateLabProduct(this.params).success(function (data, status, header, config){
                this.params = {input_values: $scope._get_input_values(reagent_id,'unloaded', $scope.reagents_params)};
//                console.log(this.params);
                BikaService.updateLabProducts(this.params).success(function (data, status, header, config){
//                    console.log(data);
//                    var products = _.indexBy($scope._lab_products, 'id');
                    var i = 0;
                    _.each(reagent_id, function(id) {

                        this.reagent = _.findWhere($scope.reagents, {'id': id});
                        this.labproduct_id = this.reagent.title;
                        objIndex = $scope._lab_products.findIndex((obj => obj.id === this.labproduct_id));
                        $scope._lab_products[objIndex].unit = parseInt($scope._lab_products[objIndex].unit) - 1;

                        this.lab_product = $scope._lab_products[objIndex];
                        this.params = {
							obj_path: this.lab_product.path,
                            Unit: this.lab_product.unit,
                        }
                        BikaService.updateLabProduct(this.params).success(function (data, status, header, config){

                            if ( data.result['success'] === 'True') {
                                i++;
//                                products[this.labproduct_id].unit--;
								Utility.alert({title:'Success', content: 'LabProduct '+ id + ' has been successfully unloaded', alertType:'success', duration:3000});
							}
							else {
								Utility.alert({title:'Error while loading...', content: this.result['message'], alertType:'danger'});
								return;
							}

                            if (i === reagent_id.length) {
                                $state.go('purchase_order',{'id': $scope.state.purchaseorder_id},{reload: true});
                            }
                        });
                    });
                });
			});

			return;

		}

		this.edit_reagents = function(edit_reagents_params, checked_list) {
			$scope.loading_change_review_state('editing').show();

			if (checked_list.length === 0) {
					Utility.alert({title:'Error', content: 'No LabProduct selected', alertType:'warning', duration:3000});
					return;
			}

			var input_values = {};
			_.each(checked_list, function(id) {
				this.reagent = _.findWhere($scope.reagents, {'id': id});
				this.data = {};
				if (edit_reagents_params.received_date !== undefined && edit_reagents_params.received_date !== null) {
					this.data['effectiveDate'] = Utility.format_date(edit_reagents_params.received_date);
				}
				if (edit_reagents_params.storage_location !== null && edit_reagents_params.storage_location.id !== undefined) {
					this.data['location'] = edit_reagents_params.storage_location.id;
				}
				if (edit_reagents_params.expiration_date !== undefined && edit_reagents_params.expiration_date !== null) {
					this.data['expirationDate'] = Utility.format_date(edit_reagents_params.expiration_date);
				}
				if (_.size(this.data) > 0 ) {
					input_values[this.reagent.path] = this.data;
				}

			});
			if (_.size(input_values) > 0 ) {
				this.params = {input_values: JSON.stringify(input_values)};
				BikaService.updateLabProducts(this.params).success(function (data, status, header, config){
					$scope.loading_change_review_state('editing').hide();
					$scope.checked_list = [];
			 		$state.go('purchase_order',{'id': $scope.state.purchaseorder_id},{reload: true});

				});
			}

		}



		$scope._get_input_values =
			function (reagent_id, review_state, reagents_params) {

				var input_values = {};
				_.each(reagent_id,function(id) {
					this.reagent = _.findWhere($scope.reagents, {'id': id});
					input_values[this.reagent.path] = {};
					input_values[this.reagent.path]['subject'] = review_state!==undefined?review_state:this.reagent.review_state;

					if (reagents_params.expiration_date[id] !== null && reagents_params.expiration_date[id] !== undefined ) {
					    input_values[this.reagent.path]['expirationDate'] = Utility.format_date(reagents_params.expiration_date[id]);
					}
					if (reagents_params.storage_location[id] !== null && reagents_params.storage_location[id] !== undefined ) {
					    input_values[this.reagent.path]['location'] = reagents_params.storage_location[id].id;
					}
					if (reagents_params.received_date[id]!== null && reagents_params.received_date[id] !== undefined ) {
					    input_values[this.reagent.path]['effectiveDate'] = Utility.format_date(reagents_params.received_date[id]);
					}
				});
				return JSON.stringify(input_values);
			}

		$scope._get_review_params =
			function(reagent_id) {
				var f = [];
				_.each(reagent_id,function(id) {
					this.reagent = _.findWhere($scope.reagents, {'id': id});
					f.push(this.reagent.path);
				});
				return JSON.stringify(f);
			}

        this.getClients();
        this.getSuppliers();
        this._getLabProducts();
        $scope.getStorageLocations();
	    this.getPurchaseOrder($scope.state.purchaseorder_id);

	    $scope.$watchGroup(['clients','suppliers'],function(newVals,oldVals){
           if ( _.isEqual(newVals, oldVals) ) { return;}
           if (newVals[0].length > 0 && newVals[1].length > 0 && $scope.purchase_order !== null) {
                $scope.edit_params = {
                        title: $scope.purchase_order.title,
                        description: $scope.purchase_order.description,
                        client: _.findWhere($scope.clients, {"id": $scope.purchase_order.client_id}),
                        supplier: _.findWhere($scope.suppliers, {"id": $scope.purchase_order.location}),
                        amount: $scope.purchase_order.contributors,
                        order_number: $scope.purchase_order.order_number,
                        cig_number:  $scope.purchase_order.rights,
                        order_date:  Utility.format_date($scope.purchase_order.order_date),
                        closing_date:  Utility.format_date($scope.purchase_order.expiration_date),
                        lab_products: JSON.parse($scope.purchase_order.remarks),
                        ready: true,
                };

           }
        });

});