var lab_products_module = angular.module('LabProductsModule', []);

lab_products_module.run(function($rootScope){
  $rootScope._ = _;
});

lab_products_module.controller('LabProductsCtrl',
	function(BikaService, Utility, $state, $scope, $rootScope) {

		$scope.loading_search = Utility.loading({
            busyText: 'Wait while loading...',
            delayHide: 1000,
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


		$scope.checked_list = [];
		$scope.review_state = 'active';

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
			$scope.getLabProducts($scope.review_state);
		}

		$scope.sort = function(keyname){
			$scope.sortKey = keyname;   //set the sortKey to the param passed
			$scope.reverse = !$scope.reverse; //if true make it false and vice versa
		}

		$scope.getManufacturers =
			function() {
				this.params = {review_state: 'active'};
				BikaService.getManufacturers(this.params).success(function (data, status, header, config){
					$scope.manufacturers = data.result.objects;
				});
		    }

		$scope.getLabProducts =
            function(review_state) {
				$scope.loading_search.show();
            	$scope.review_state = review_state;
                $scope.lab_products = [];
                this.params = {	sort_on: 'Date', sort_order: 'descending',
                				page_nr: $scope.pagination.page_nr, page_size: $scope.pagination.page_size};

                if (review_state === 'all') {
					this.params['Subjects'] = 'active|deactivate';
				}
				else {
					this.params['Subject'] = review_state;
				}

                BikaService.getLabProducts(this.params).success(function (data, status, header, config){

                	$scope.lab_products = data.result.objects;
                    $scope.pagination.total = data.result.total;
                    $scope.pagination.last = data.result.last;

                	transitions = Array();
					_.each($scope.lab_products,function(obj) {
						Utility.merge(transitions,obj.transitions,'id');
					});
                    $scope.transitions = transitions;
					$scope.loading_search.hide();
                });
		}

		$scope.init =
			function() {
			    $scope.getManufacturers();
				$scope.getLabProducts($scope.review_state);
			}

		$scope.init();

        this.get_manufacturer = function(id) {
            this.manufacturer = _.findWhere($scope.manufacturers, {id: id});
            this.title = this.manufacturer !== undefined ? this.manufacturer.title : '';
            return this.title;
        }

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
				if ($scope.checked_list.length < $scope.lab_products.length) {
					_.each($scope.lab_products,function(b) {
						$scope.checked_list.push(b.id);
					})
				}
				else {
					$scope.checked_list = [];
				}
		}

		this.change_review_state =
			function (action, lab_product_id) {
				if (lab_product_id === undefined) {
					var lab_product_id = $scope.checked_list;
				}
				else {var lab_product_id = [lab_product_id];}

				if (action === 'activate') {
					 $scope.activateLabProduct(lab_product_id);
				}
				else if (action === 'deactivate') {
					 $scope.deactivateLabProduct(lab_product_id);
				}

			}

		$scope.activateLabProduct =
			function(lab_product_id) {
				$scope.loading_change_review_state('activating').show();
				this.params = {f: $scope._get_review_params(lab_product_id)};
				BikaService.activateLabProduct(this.params).success(function (data, status, header, config){
					this.params = {input_values: $scope._get_input_values_review_state(lab_product_id,'active')};
					BikaService.updateLabProducts(this.params).success(function (data, status, header, config){
						$scope.loading_change_review_state('activating').hide();
						$scope.checked_list = [];
			 			$scope.getLabProducts($scope.review_state);
					});
				});
			}

		$scope.deactivateLabProduct =
			function(lab_product_id) {
				$scope.loading_change_review_state('deactivating').show();
				this.params = {f: $scope._get_review_params(lab_product_id)};
				BikaService.deactivateLabProduct(this.params).success(function (data, status, header, config){
					this.params = {input_values: $scope._get_input_values_review_state(lab_product_id,'deactivate')};
					BikaService.updateLabProducts(this.params).success(function (data, status, header, config){
						$scope.loading_change_review_state('deactivating').hide();
						$scope.checked_list = [];
			 			$scope.getLabProducts($scope.review_state);
					});

				});
			}

		$scope._get_input_values_review_state =
			function (lab_product_id, review_state) {
				//lab_product_id = lab_product_id.split('|');
				var input_values = {};
				_.each(lab_product_id,function(id) {
					lab_product = _.findWhere($scope.lab_products, {'id': id});
					input_values[lab_product.path] = {subject: review_state!==undefined?review_state:lab_product.review_state};
				});
				return JSON.stringify(input_values);
			}

		$scope._get_review_params =
			function(lab_product_id) {
				var f = [];
				_.each(lab_product_id,function(id) {
					this.lab_product = _.findWhere($scope.lab_products, {'id': id});
					f.push(this.lab_product.path);
				});
				return JSON.stringify(f);


			}

});

lab_products_module.controller('AddLabProductCtrl',
	function(BikaService, Utility, $state, $scope, $rootScope) {

		$scope.loading_search = Utility.loading({
            busyText: 'Wait while searching...',
            delayHide: 700,
        });

        $scope.loading_import = Utility.loading({
            busyText: 'Wait while importing...',
            delayHide: 3000,
        });

		$scope.labproducts_params = {
			title: null,
			description: null,
			barcode: null,
			volume: null,
			price: null,
		}
		$scope.lab_products = [];



        $scope.getManufacturers =
			function() {
				this.params = {review_state: 'active'};
				BikaService.getManufacturers(this.params).success(function (data, status, header, config){
					$scope.manufacturers = data.result.objects;
				});
		    }

		$scope.getManufacturers();


        this.submit =
        function(labproducts_params) {
        	this.params = {
        		title: labproducts_params.title,
        		description: labproducts_params.description!==null && labproducts_params.description.length > 0 ? labproducts_params.description.replace('=','') : '',
        		Volume: labproducts_params.volume!==null && labproducts_params.volume.length > 0 ? labproducts_params.volume : '',
        		Price: labproducts_params.price!==null && labproducts_params.price.length > 0 ? labproducts_params.price : '',
        		Unit: 0,
        		subject: 'active',
        		rights: labproducts_params.barcode,
        		location: labproducts_params.manufacturer.id,
        	}
//        	console.log(this.params); //return;
        	$scope.loading_import.show();
        	BikaService.createLabProduct(this.params).success(function (data, status, header, config){
        		$scope.loading_import.hide();
        		console.log(data.result);
        		result = data.result;
				if (result['success'] === 'True') {
					Utility.alert({title:'Success', content: 'LabProduct '+ result['obj_id'] + ' has been successfully imported', alertType:'success', duration:3000});
					$state.go('lab_products',{},{reload: true});
				}
				else {
					Utility.alert({title:'Error while importing...', content: result['message'], alertType:'danger'});
					return;
				}
        	});
        }
});

lab_products_module.controller('ImportLabProductsCtrl',
	function(BikaService, Utility, $state, $scope, $rootScope) {

        $scope.loading_import = Utility.loading({
            busyText: 'Wait while importing...',
            delayHide: 3000,
        });

        $scope.import_params = {
        	attachment: null,
        	inventory: null,
        	manufacturer: null,
        };

        $scope.get_inventory =
            function(data) {

                var inventory = [];
                data = Papa.parse(data);

                if (data.errors.length > 0) {
                    Utility.alert({title:'Malformed CSV!!!',
							content: data.errors[0].message,
							alertType:'danger'}
					);
					return null;
                }

                data = data.data;
                header = _.first(data);

                if (_.difference(header, ["ID", "Name", "Description", "Volume", "Price"]).length > 0) {
                     Utility.alert({title:'Wrong Header',
							content: "Header must be ID,Name,Description,Volume,Price",
							alertType:'danger'}
					);
					return null;
                }
                _.each(_.rest(data), function(entry) {
                    if (entry.length === 5) {
                        this.item = {
                            id: entry[0],
                            name: entry[1],
                            description: entry[2],
                            volume: entry[3],
                            price: entry[4],
                        }
                        inventory.push(this.item);
                    }

                });

                return inventory;

        };

        $scope.$watch('import_params.attachment',
            function (newValue, oldValue) {
                // Ignore initial setup.
                if ( newValue === oldValue) { return;}
                if ( newValue === null ) {
                	return;
                }

				var reader = new FileReader();
				reader.onload = function(event) {
					var data = event.target.result;
					$scope.import_params.inventory = $scope.get_inventory(data);
				};
				reader.readAsText($scope.import_params.attachment);
         });

        $scope.getManufacturers =
			function() {
				this.params = {review_state: 'active'};
				BikaService.getManufacturers(this.params).success(function (data, status, header, config){
					$scope.manufacturers = data.result.objects;
				});
		    }

		$scope.getManufacturers();

		this.import =
		    function(import_params) {
		        var outcome = {
					ids: [],
				}
		        _.each(import_params.inventory, function(row) {
		            this.params = {
                        title: row.name,
                        description: row.description.replace('=',''),
                        Volume: row.volume,
                        Price: Utility.format_price(row.price),
                        Unit: 0,
                        subject: 'active',
                        rights: row.id,
                        location: import_params.manufacturer.id,
                    }
//                	console.log(this.params); //return;

                    BikaService.createLabProduct(this.params).success(function (data, status, header, config){
                        result = data.result;
                        if (result['success'] === 'True') {
                            Utility.alert({title:'Success', content: 'LabProduct '+ result['obj_id'] + ' has been successfully imported', alertType:'success', duration:3000});
                            outcome.ids.push(result['obj_id']);
                            if (outcome.ids.length === import_params.inventory.length) {
                                $state.go('lab_products',{},{reload: true});
                            }
                        }
                        else {
                            Utility.alert({title:'Error while importing...', content: result['message'], alertType:'danger'});
                            return;
                        }
                    });
		        });
		};

});


lab_products_module.controller('LoadingLabProductCtrl',
	function(BikaService, Utility, $state, $scope, $rootScope) {

		$scope.loading_search = Utility.loading({
            busyText: 'Wait while searching...',
            delayHide: 700,
        });

        $scope.loading_import = Utility.loading({
            busyText: 'Wait while importing...',
            delayHide: 3000,
        });

		$scope.pagination= {
			page_nr: 0,
			page_size: 50,
			total: 0,
			current: 1,
			last: 0,
		};

		this.changePage = function(newPageNumber, oldPageNumber) {
			if (newPageNumber !== undefined) {
				$scope.pagination.page_nr = newPageNumber-1;
				$scope.pagination.current = newPageNumber;
			}
			$scope.getLabProducts($scope.review_state);
		}

		$scope.sort = function(keyname){
			$scope.sortKey = keyname;   //set the sortKey to the param passed
			$scope.reverse = !$scope.reverse; //if true make it false and vice versa
		}

		$scope.getStorageLocations =
			function() {
				this.params = {};
				BikaService.getStorageLocations(this.params).success(function (data, status, header, config){
					$scope.storage_locations = data.result.objects;
				});
			}

		$scope.getInventory =
			function() {
				this.params = {Subjects: 'active|loaded'};
				BikaService.getLabProducts(this.params).success(function (data, status, header, config){
					$scope.inventory = data.result.objects;
					$scope.pagination.total = data.result.total;
                    $scope.pagination.last = data.result.last;
				});
			}


		$scope.initLoad = function() {
			$scope.loading_params = {
				title: null,
				description: null,
				barcode: null,
				volume: null,
				price: null,
				expirationDate: Utility.format_date(),
			}
			$scope.getStorageLocations();
			$scope.getInventory();
			$scope.lab_products_toload = [];
			$scope.checked_list = [];
		}

		$scope.initLoad();

		$scope.$watch('loading_params.barcode',
            function (newValue, oldValue) {
                // Ignore initial setup.
                if ( newValue === oldValue) { return;}
                if ( newValue === null || newValue === undefined || newValue == "") {return; }

				this.params = {id: 'labproduct-'+newValue};
                this.result = _.findWhere($scope.inventory, this.params);

                if (this.result == undefined) {
                	Utility.alert({title:'Error', content: 'Barcode '+newValue+' doesn\'exist.', alertType:'danger'});
                	$scope.loading_params = {
						title: null,
						description: null,
						barcode: null,
						volume: null,
						price: null,
					}
                }
                else {

                	$scope.loading_params.title = this.result.title;
					$scope.loading_params.description = this.result.description;
					$scope.loading_params.volume = this.result.volume;
					$scope.loading_params.price = this.result.price;
                }

            }
        );

//        $scope.$watch('loading_params.rgt_barcode',
//            function (newValue, oldValue) {
//                // Ignore initial setup.
//                if ( newValue === oldValue) { return;}
//                if ( newValue === null || newValue === undefined || newValue == "") {return; }
//
//				this.params = {id: 'labproduct-'+newValue};
//				this.result = _.findWhere($scope.inventory, this.params)!== undefined ? _.findWhere($scope.inventory, this.params) : _.findWhere($scope.lab_products_toload, {rgt_barcode: newValue} );
//				if (this.result !== undefined) {
//					Utility.alert({title:'Error', content: 'Barcode '+newValue+' is already loaded.', alertType:'danger'});
//                	$scope.loading_params.lot_barcode = null;
//					$scope.loading_params.rgt_barcode = null;
//				}
//            }
//        );

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
				if ($scope.checked_list.length < $scope.lab_products_toload.length) {
					_.each($scope.lab_products_toload,function(b) {
						$scope.checked_list.push(b.rgt_barcode);
					})
				}
				else {
					$scope.checked_list = [];
				}
		}

		this.format_date =
			function(date) {
				if (date === null) {return "";}
				return Utility.format_date(date);
			};

		this.confirm =
			function(loading_params) {
//				if (loading_params.barcode === loading_params.lot_barcode ||
//					loading_params.barcode === loading_params.rgt_barcode ||
//					loading_params.rgt_barcode === loading_params.lot_barcode) {
//
//					Utility.alert({title:'Error', content: 'Barcode must be different each other', alertType:'warning', duration:3000});
//					return;
//				}
//
//				if (loading_params.barcode === null  || loading_params.barcode.length === 0 ||
//					loading_params.lot_barcode === null  || loading_params.lot_barcode.length === 0 ||
//					loading_params.rgt_barcode === null  || loading_params.rgt_barcode.length === 0) {
//
//					Utility.alert({title:'Error', content: 'Barcode must be valuate', alertType:'warning', duration:3000});
//					return;
//				}

				$scope.lab_products_toload.push(loading_params);
				$scope.loading_params = {
							title: null,
							description: null,
							barcode: null,
							volume: null,
							price: null,
							rgt_barcode: null,
							lot_barcode: null,
							order_number: null,
							storage_locations: null,
							expiration_date: null,
				}
			}

        this.load_products =
			function() {
				if ($scope.checked_list.length === 0) {
					Utility.alert({title:'Error', content: 'No LabProduct selected', alertType:'warning', duration:3000});
					return;
				}
				units = {};
				counter = 0;
				_.each($scope.lab_products_toload, function(lab_product) {
					if ($scope.checked_list.indexOf(lab_product.rgt_barcode) !== -1) {
						if (!_.has(units, lab_product.barcode)) {
							this.product = _.findWhere($scope.inventory,  {id: 'labproduct-'+lab_product.barcode});
							units[lab_product.barcode] = {obj_path: this.product.path, Unit: this.product.unit};
						}
						units[lab_product.barcode].Unit++;
						this.params = {
//							obj_id: 'labproduct-'+lab_product.rgt_barcode,
							title: 'labproduct-'+lab_product.barcode,
//							description: lab_product.lot_barcode,
							Volume: lab_product.volume!==null && lab_product.volume.length > 0 ? lab_product.volume : '',
							Price: lab_product.price!==null && lab_product.price.length > 0 ? lab_product.price : '',
							Unit: 1,
							location: lab_product.storage_locations !== null && lab_product.storage_locations.id.length > 0 ? lab_product.storage_locations.id : '',
							subject: 'loaded',
							rights: lab_product.order_number!==null && lab_product.order_number.length > 0 ? lab_product.order_number : '',

						}
						if (lab_product.expiration_date !== undefined && lab_product.expiration_date !== null) {
							this.params['expirationDate'] = lab_product.expiration_date;
						}

						$scope.loading_import.show();
						BikaService.createLabProduct(this.params).success(function (data, status, header, config){
							counter++;
							$scope.loading_import.hide();
							this.result = data.result;
							if (result['success'] === 'True') {
								Utility.alert({title:'Success', content: 'LabProduct '+ this.result['obj_id'] + ' has been successfully imported', alertType:'success', duration:3000});
							}
							else {
								Utility.alert({title:'Error while importing...', content: this.result['message'], alertType:'danger'});
								return;
							}
							if (counter === $scope.checked_list.length) {
								$scope.initLoad();
								$state.go('lab_products',{},{reload: true});
							}
						});
					}
				});

				for (var key in units) {
					this.params = units[key];

					BikaService.updateLabProduct(this.params).success(function (data, status, header, config){
						this.result = data.result;
					});

				}
			}
});

lab_products_module.controller('UnloadingLabProductCtrl',
	function(BikaService, Utility, $state, $scope, $rootScope) {

		$scope.loading_search = Utility.loading({
            busyText: 'Wait while searching...',
            delayHide: 700,
        });

        $scope.loading_import = Utility.loading({
            busyText: 'Wait while importing...',
            delayHide: 3000,
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


		$scope.pagination= {
			page_nr: 0,
			page_size: 50,
			total: 0,
			current: 1,
			last: 0,
		};

		this.changePage = function(newPageNumber, oldPageNumber) {
			if (newPageNumber !== undefined) {
				$scope.pagination.page_nr = newPageNumber-1;
				$scope.pagination.current = newPageNumber;
			}
			$scope.getLabProducts($scope.review_state);
		}

		$scope.sort = function(keyname){
			$scope.sortKey = keyname;   //set the sortKey to the param passed
			$scope.reverse = !$scope.reverse; //if true make it false and vice versa
		}

		$scope.getStorageLocations =
			function() {
				this.params = {};
				BikaService.getStorageLocations(this.params).success(function (data, status, header, config){
					$scope.storage_locations = data.result.objects;
				});
			}

		$scope.getInventory =
			function() {
				this.params = {Subjects: 'active|loaded'};
				BikaService.getLabProducts(this.params).success(function (data, status, header, config){
					$scope.inventory = data.result.objects;
				});
			}


		$scope.initUnload = function() {
			$scope.unloading_params = {
				title: null,
				description: null,
				barcode: null,
				volume: null,
				price: null,
			}
			$scope.getStorageLocations();
			$scope.getInventory();
			$scope.lab_products_tounload = [];
			$scope.checked_list = [];
		}

		$scope.initUnload();

		$scope.$watch('unloading_params.barcode',
            function (newValue, oldValue) {
                // Ignore initial setup.
                if ( newValue === oldValue) { return;}
                if ( newValue === null || newValue === undefined || newValue == "") {return; }

				this.params = {id: 'labproduct-'+newValue};
                this.result = _.findWhere($scope.inventory, this.params);

                if (this.result == undefined) {
                	Utility.alert({title:'Error', content: 'Barcode '+newValue+' doesn\'exist.', alertType:'danger'});
                	$scope.unloading_params = {
						title: null,
						description: null,
						barcode: null,
						volume: null,
						price: null,
					}
                }
                else {
                	$scope.unloading_params.title = this.result.title;
					$scope.unloading_params.description = this.result.description;
					$scope.unloading_params.volume = this.result.volume;
					$scope.unloading_params.price = this.result.price;
                }

            }
        );

        $scope.$watch('unloading_params.rgt_barcode',
            function (newValue, oldValue) {
                // Ignore initial setup.
                if ( newValue === oldValue) { return;}
                if ( newValue === null || newValue === undefined || newValue == "") {return; }

				this.params = {id: 'labproduct-'+newValue};
				this.result = _.findWhere($scope.inventory, this.params);
				if (this.result === undefined) {
					Utility.alert({title:'Error', content: 'Barcode '+newValue+' doesn\'exist.', alertType:'danger'});
                	$scope.unloading_params.lot_barcode = null;
					$scope.unloading_params.rgt_barcode = null;
				}
				else {
					$scope.unloading_params.storage_locations = _.findWhere($scope.storage_locations, {id: this.result.location});
					$scope.unloading_params.unit = this.result.unit;
					$scope.unloading_params.order_number = this.result.rights;
					$scope.unloading_params.lot_barcode = this.result.description.replace("labproduct-","");
				}
            }
        );

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
				if ($scope.checked_list.length < $scope.lab_products_tounload.length) {
					_.each($scope.lab_products_tounload,function(b) {
						$scope.checked_list.push(b.rgt_barcode);
					})
				}
				else {
					$scope.checked_list = [];
				}
		}


		this.confirm =
			function(unloading_params) {
				if (unloading_params.barcode === unloading_params.lot_barcode ||
					unloading_params.barcode === unloading_params.rgt_barcode ||
					unloading_params.rgt_barcode === unloading_params.lot_barcode) {

					Utility.alert({title:'Error', content: 'Barcode must be different each other', alertType:'warning', duration:3000});
					return;
				}

				if (unloading_params.barcode === null  || unloading_params.barcode.length === 0 ||
					unloading_params.lot_barcode === null  || unloading_params.lot_barcode.length === 0 ||
					unloading_params.rgt_barcode === null  || unloading_params.rgt_barcode.length === 0) {

					Utility.alert({title:'Error', content: 'Barcode must be valuate', alertType:'warning', duration:3000});
					return;
				}

				$scope.lab_products_tounload.push(unloading_params);
				$scope.unloading_params = {
							title: null,
							description: null,
							barcode: null,
							volume: null,
							price: null,
							rgt_barcode: null,
							lot_barcode: null,
							order_number: null,
							storage_locations: null,
				}
			}

        this.unload_products =
			function() {
				if ($scope.checked_list.length === 0) {
					Utility.alert({title:'Error', content: 'No LabProduct selected', alertType:'warning', duration:3000});
					return;
				}
				units = {};
				counter = 0;
				_.each($scope.lab_products_tounload, function(lab_product) {
					if ($scope.checked_list.indexOf(lab_product.rgt_barcode) !== -1) {
						if (!_.has(units, lab_product.barcode)) {
							this.product = _.findWhere($scope.inventory,  {id: 'labproduct-'+lab_product.barcode});
							units[lab_product.barcode] = {obj_path: this.product.path, Unit: this.product.unit};
						}
						units[lab_product.barcode].Unit--;
						this.product = _.findWhere($scope.inventory,  {id: 'labproduct-'+lab_product.rgt_barcode});
						this.params = {f: JSON.stringify([this.product.path])}
						$scope.loading_change_review_state('unloading').show();
						BikaService.deactivateLabProduct(this.params).success(function (data, status, header, config){
							this.product = _.findWhere($scope.inventory,  {id: 'labproduct-'+lab_product.rgt_barcode});
							this.params = {obj_path: this.product.path, subject: 'unloaded'};
							BikaService.updateLabProduct(this.params).success(function (data, status, header, config){
								$scope.loading_change_review_state('unloading').hide();
								$scope.checked_list = [];
								if (counter === $scope.checked_list.length) {
									$scope.initUnload();
									$state.go('lab_products',{},{reload: true});
								}
							});
						});

						$scope.loading_import.show();
					}
				});

				for (var key in units) {
					this.params = units[key];

					BikaService.updateLabProduct(this.params).success(function (data, status, header, config){
						this.result = data.result;
					});

				}
			}
});

lab_products_module.controller('LabProductDetailsCtrl',
	function(BikaService, Utility, $state, $stateParams, $scope, $rootScope) {

		$scope.state = {labproduct_id: $stateParams.labproduct_id};
		$scope.lab_product = null;

		$scope.loading_search = Utility.loading({
            busyText: 'Wait while loading...',
            delayHide: 1500,
        });

         $scope.loading_import = Utility.loading({
            busyText: 'Wait while importing...',
            delayHide: 3000,
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

         $scope.loading_update = Utility.loading({
            busyText: 'Wait while updating...',
            delayHide: 500,
        });


		$scope.review_state = "loaded";
		$scope.checked_list = [];
		$scope._checked_list = [];

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
			$scope.getLabProducts($scope.state.labproduct_id, $scope.review_state);
		}

		$scope.sort = function(keyname){
			$scope.sortKey = keyname;   //set the sortKey to the param passed
			$scope.reverse = !$scope.reverse; //if true make it false and vice versa
		}


		$scope.getStorageLocations =
			function() {
				this.params = {};
				BikaService.getStorageLocations(this.params).success(function (data, status, header, config){
					$scope.storage_locations = data.result.objects;
				});
			}

		$scope.getPurchaseOrders =
			function() {
				this.params = {};
				BikaService.getPurchaseOrders(this.params).success(function (data, status, header, config){
					$scope.purchase_orders = data.result.objects;
					$scope.cost_centers = [];
					_.each($scope.purchase_orders, function(obj) {
					    if (obj.review_state === 'pending' || obj.review_state === 'dispatched') {
					        if (obj.remarks.length > 4) {
					            obj.remarks = JSON.parse(obj.remarks);
					            console.log(obj);
					            $scope.cost_centers.push(obj);
					        }


					    }
					});
//					console.log($scope.cost_centers);
				});
			}

	    $scope.getManufacturers =
			function() {
				this.params = {review_state: 'active'};
				BikaService.getManufacturers(this.params).success(function (data, status, header, config){
					$scope.manufacturers = data.result.objects;
					$scope.getStorageLocations();
					$scope.getPurchaseOrders();

                    $scope.getLabProduct($scope.state.labproduct_id);
                    $scope.getLabProducts($scope.state.labproduct_id, $scope.review_state);
				});
		    }

		$scope.getLabProduct =
            function(id) {
                this.params = {id: id};
                BikaService.getLabProducts(this.params).success(function (data, status, header, config){
                	$scope.lab_product = data.result.objects[0];
                	$scope._loading_params.title = $scope.lab_product.title;
					$scope._loading_params.description =  $scope.lab_product.description;
					$scope._loading_params.volume =  $scope.lab_product.volume;
					$scope._loading_params.price =  $scope.lab_product.price;
					$scope._loading_params.barcode = $scope.lab_product.rights;
					$scope._loading_params.id = $scope.lab_product.id;
					$scope.labproducts_params = $scope._loading_params;
					$scope.labproducts_params.manufacturer = _.findWhere($scope.manufacturers, {id:$scope.lab_product.location});
//					console.log($scope.labproducts_params.manufacturer);
//					console.log($scope.labproducts_params);

                });
		}

		$scope.getLabProducts =
            function(title, review_state) {
            	$scope.review_state = review_state;
                $scope.lab_products = [];
                this.params = {	sort_on: 'Date', sort_order: 'descending', title: title,
                				page_nr: $scope.pagination.page_nr, page_size: $scope.pagination.page_size};

				 if (review_state === 'all') {
					this.params['Subjects'] = 'loaded|unloaded';
				}
				else {
					this.params['Subject'] = review_state;
				}

				$scope.loading_search.show();
                BikaService.getLabProducts(this.params).success(function (data, status, header, config){

                	$scope.lab_products = data.result.objects;
                    $scope.pagination.total = data.result.total;
                    $scope.pagination.last = data.result.last;

                	transitions = Array();
					_.each($scope.lab_products,function(obj) {
						Utility.merge(transitions,obj.transitions,'id');
					});
                    $scope.transitions = transitions;
					$scope.loading_search.hide();
                });
		}

		$scope.init =
			function() {
				$scope.loading_search.show();

				$scope.edit_params = {
					storage_location: null,
					order_number: null,
					expiration_date: null,
				}
				$scope.getManufacturers();

			}

		$scope._lab_products_toload = [];
		$scope._loading_params = {
					title: null,
					description: null,
					barcode: null,
					rgt_barcode: null,
					lot_barcode: null,
					order_number: null,
					storage_locations: null,
					expiration_date: Utility.format_date(),
				}

		$scope.init();

		this.get_manufacturer = function(id) {
            this.manufacturer = _.findWhere($scope.manufacturers, {id: id});
            this.title = this.manufacturer !== undefined ? this.manufacturer.title : '';
            return this.title;
        }

        this.get_consumption = function (id) {
            consumption = 0;
            _.each($scope.cost_centers,function(obj) {
                if (_.has(obj.remarks, id)) {
                    consumption += parseFloat(obj.remarks[id]);
                }
            });

            return consumption;
        }


		this.format_date =
			function(date) {
				if (date == null) {return "";}
				return Utility.format_date(date);
			};

		this.check_expiration =
			function(date) {
				return Utility.difference_between_dates('today', date, 'd');
			};

		this.format_review_state =
			function(review_state) {
				return Utility.format_review_state(review_state);
			};

		this.get_storage_location =
			function(id) {
				storage_location = _.findWhere($scope.storage_locations, {id: id});
				if (storage_location === undefined) {return "";}

				return storage_location.title;
			}

		this.get_order_number =
			function(id) {
				purchase_order = _.findWhere($scope.purchase_orders, {id: id});
				if (purchase_order === undefined) {return "";}

				return purchase_order.order_number;
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
				if ($scope.checked_list.length < $scope.lab_products.length) {
					_.each($scope.lab_products,function(b) {
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
			function (action, lab_product_id) {
				if (lab_product_id === undefined) {
					var lab_product_id = $scope.checked_list;
				} else {var lab_product_id = [lab_product_id];}

				if (action === 'unload') {
					 $scope.unloadLabProduct(lab_product_id);
				}
				else if (action === 'load') {
					 $scope.loadLabProduct(lab_product_id);
				}
			}

		$scope.unloadLabProduct =
			function(lab_product_id) {
				if ($scope.checked_list.length === 0 && lab_product_id === undefined) {
					Utility.alert({title:'Error', content: 'No LabProduct selected', alertType:'warning', duration:3000});
					return;
				}
				$scope.loading_change_review_state('unloading').show();
				this.params = {f: $scope._get_review_params(lab_product_id)};
				BikaService.deactivateLabProduct(this.params).success(function (data, status, header, config){
					this.params = {input_values: $scope._get_input_values_review_state(lab_product_id,'unloaded')};
					BikaService.updateLabProducts(this.params).success(function (data, status, header, config){
						this.params = {
							obj_path: $scope.lab_product.path,
							Unit:  parseInt($scope.lab_product.unit)-parseInt($scope.checked_list.length>0?$scope.checked_list.length:1)};
						BikaService.updateLabProduct(this.params).success(function (data, status, header, config){
							$scope.loading_change_review_state('unloading').hide();
							$scope.checked_list = [];
			 				$state.go('lab_product',{labproduct_id: $scope.state.labproduct_id},{reload: true});
			 			});
					});

				});
			}

		$scope.loadLabProduct =
			function(lab_product_id) {
				if ($scope.checked_list.length === 0 && lab_product_id === undefined) {
					Utility.alert({title:'Error', content: 'No LabProduct selected', alertType:'warning', duration:3000});
					return;
				}
				$scope.loading_change_review_state('loading').show();
				this.params = {f: $scope._get_review_params(lab_product_id)};
				BikaService.activateLabProduct(this.params).success(function (data, status, header, config){
					this.params = {input_values: $scope._get_input_values_review_state(lab_product_id,'loaded')};
					BikaService.updateLabProducts(this.params).success(function (data, status, header, config){
						this.params = {
							obj_path: $scope.lab_product.path,
							Unit: parseInt($scope.lab_product.unit)+parseInt($scope.checked_list.length>0?$scope.checked_list.length:1)};
						BikaService.updateLabProduct(this.params).success(function (data, status, header, config){
							$scope.loading_change_review_state('loading').hide();
							$scope.checked_list = [];
			 				$state.go('lab_product',{labproduct_id: $scope.state.labproduct_id},{reload: true});
						});

					});

				});
			}

		$scope._get_input_values_review_state =
			function (lab_product_id, review_state) {
				//lab_product_id = lab_product_id.split('|');
				var input_values = {};
				_.each(lab_product_id,function(id) {
					this.lab_product = _.findWhere($scope.lab_products, {'id': id});
					input_values[this.lab_product.path] = {subject: review_state!==undefined?review_state:this.lab_product.review_state};
				});
				return JSON.stringify(input_values);
			}

		$scope._get_review_params =
			function(lab_product_id) {
				var f = [];
				_.each(lab_product_id,function(id) {
					this.lab_product = _.findWhere($scope.lab_products, {'id': id});
					f.push(this.lab_product.path);
				});
				return JSON.stringify(f);


			}



		this.edit = function(edit_params, checked_list) {
			$scope.loading_change_review_state('editing').show();

			if (checked_list.length === 0) {
					Utility.alert({title:'Error', content: 'No LabProduct selected', alertType:'warning', duration:3000});
					return;
			}

			var input_values = {};
			_.each(checked_list, function(id) {
				this.lab_product = _.findWhere($scope.lab_products, {'id': id});
				this.data = {};
				if (edit_params.order_number !== null && edit_params.order_number.length > 0) {
					this.data['rights'] = edit_params.order_number;
				}
				if (edit_params.storage_location !== null && edit_params.storage_location.id !== undefined) {
					this.data['location'] = edit_params.storage_location.id;
				}
				if (edit_params.expiration_date !== undefined && edit_params.expiration_date !== null) {
					this.data['expirationDate'] = Utility.format_date(edit_params.expiration_date);
				}
				if (_.size(this.data) > 0 ) {
					input_values[this.lab_product.path] = this.data;
				}

			});
			if (_.size(input_values) > 0 ) {
				this.params = {input_values: JSON.stringify(input_values)};
				BikaService.updateLabProducts(this.params).success(function (data, status, header, config){
					$scope.loading_change_review_state('editing').hide();
					$scope.checked_list = [];
			 		//$state.go('lab_product',{labproduct_id: $scope.state.labproduct_id},{reload: true});
			 		$scope.init();
				});
			}

		}

	this.edit_lab_product =
        function(labproducts_params) {
        	this.params = {
        	    obj_path: $scope.lab_product.path,
        		title: labproducts_params.title,
        		description: labproducts_params.description!==null && labproducts_params.description.length > 0 ? labproducts_params.description.replace('=','') : '',
        		Volume: labproducts_params.volume!==null && labproducts_params.volume.length > 0 ? labproducts_params.volume : '',
        		Price: labproducts_params.price!==null && labproducts_params.price.length > 0 ? labproducts_params.price : '',
        		rights: labproducts_params.barcode,
        		location: labproducts_params.manufacturer.id,
        	}

        	$scope.loading_update.show();
        	BikaService.updateLabProduct(this.params).success(function (data, status, header, config){
        		$scope.loading_update.hide();
        		result = data.result;
				if (result['success'] === 'True') {
					Utility.alert({title:'Success', content: 'LabProduct '+ $scope.lab_product.title + ' has been edited', alertType:'success', duration:3000});
					$state.go('lab_product',{labproduct_id: $scope.lab_product.id},{reload: true});

				}
				else {
					Utility.alert({title:'Error while editing...', content: result['message'], alertType:'danger'});
					return;
				}
        	});
        }

	this._toggle =
			function(id) {
				var idx = $scope._checked_list.indexOf(id);
				if (idx > -1) {
					$scope._checked_list.splice(idx, 1);
				}
				else {
					$scope._checked_list.push(id);
				}
			}

	this._toggle_all =
		function() {
			if ($scope._checked_list.length < $scope._lab_products_toload.length) {
				_.each($scope._lab_products_toload,function(b) {
					$scope._checked_list.push(b);
				})
			}
			else {
				$scope._checked_list = [];
			}
	}



	this._confirm =
		function(_loading_params) {
			console.log($scope._loading_params);
//			if (_loading_params.barcode === _loading_params.lot_barcode ||
//				_loading_params.barcode === _loading_params.rgt_barcode ||
//				_loading_params.rgt_barcode === _loading_params.lot_barcode) {
//
//				Utility.alert({title:'Error', content: 'Barcode must be different each other', alertType:'warning', duration:3000});
//				return;
//			}
//
//			if (_loading_params.barcode === null  || _loading_params.barcode.length === 0 ||
//				_loading_params.lot_barcode === null  || _loading_params.lot_barcode.length === 0 ||
//				_loading_params.rgt_barcode === null  || _loading_params.rgt_barcode.length === 0) {
//
//				Utility.alert({title:'Error', content: 'Barcode must be valuate', alertType:'warning', duration:3000});
//				return;
//			}


			$scope._lab_products_toload.push(JSON.parse(JSON.stringify(_loading_params)));
			$scope._loading_params.rgt_barcode = null;
			$scope._loading_params.lot_barcode = null;
			$scope._loading_params.order_number = null;
			$scope._loading_params.storage_locations = null;
			$scope._loading_params.expiration_date = Utility.format_date();
			return;

		}

        this._load_products =
			function() {
				if ($scope._checked_list.length === 0) {
					Utility.alert({title:'Error', content: 'No LabProduct selected', alertType:'warning', duration:3000});
					return;
				}
				units = {};
				counter = 0
//				console.log($scope._checked_list); return;
				_.each($scope._lab_products_toload, function(lab_product) {

					if ($scope._checked_list.indexOf(lab_product) !== -1) {
						if (!_.has(units, lab_product.barcode)) {
							this.product = $scope.lab_product;
							units[lab_product.barcode] = {obj_path: this.product.path, Unit: this.product.unit};
						}
						units[lab_product.barcode].Unit++;
						this.params = {
//							obj_id: 'labproduct-'+lab_product.rgt_barcode,
							title: lab_product.id,
							description: '',
							Volume: lab_product.volume!==null && lab_product.volume.length > 0 ? lab_product.volume : '',
							Price: lab_product.price!==null && lab_product.price.length > 0 ? lab_product.price : '',
							Unit: 1,
							location: lab_product.storage_locations !== undefined && lab_product.storage_locations !== null && lab_product.storage_locations.id.length > 0 ? lab_product.storage_locations.id : '',
							subject: 'loaded',
							rights: lab_product.order_number!==undefined && lab_product.order_number!==null && lab_product.order_number.length > 0 ? lab_product.order_number : '',

						}
						if (lab_product.expiration_date !== undefined && lab_product.expiration_date !== null) {
							this.params['expirationDate'] = lab_product.expiration_date;
						}

						$scope.loading_import.show();
						BikaService.createLabProduct(this.params).success(function (data, status, header, config){
							counter++;
							$scope.loading_import.hide();
							this.result = data.result;
							if (result['success'] === 'True') {
								Utility.alert({title:'Success', content: 'LabProduct '+ this.result['obj_id'] + ' has been successfully imported', alertType:'success', duration:3000});
							}
							else {
								Utility.alert({title:'Error while importing...', content: this.result['message'], alertType:'danger'});
								return;
							}
							if (counter === $scope._checked_list.length) {

								$state.go('lab_product',{'id': $scope.state.labproduct_id},{reload: true});
							}
						});
					}
				});

				for (var key in units) {
					this.params = units[key];

					BikaService.updateLabProduct(this.params).success(function (data, status, header, config){
						this.result = data.result;
					});

				}
			}

//		 $scope.$watch('_loading_params.rgt_barcode',
//            function (newValue, oldValue) {
//                // Ignore initial setup.
//                if ( newValue === oldValue) { return;}
//                if ( newValue === null || newValue === undefined || newValue == "") {return; }
//
//				this.params = {id: 'labproduct-'+newValue};
//				this.result = _.findWhere($scope.lab_products, this.params)!== undefined ? _.findWhere($scope.lab_products, this.params) : _.findWhere($scope._lab_products_toload, {rgt_barcode: newValue} );
//				if (this.result !== undefined) {
//					Utility.alert({title:'Error', content: 'Barcode '+newValue+' is already loaded.', alertType:'danger'});
//                	$scope._loading_params.lot_barcode = null;
//					$scope._loading_params.rgt_barcode = null;
//				}
//            }
//        );
});