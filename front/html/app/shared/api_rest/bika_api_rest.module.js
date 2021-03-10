var bika_api_rest_module = angular.module('BikaApiRestModule', [])

bika_api_rest_module.service('BikaApiRestService',  function(init, $http, $rootScope) {



    this.call = function(mode, method, params) {

        this.url = init.apiRest[mode].url + method;
        this.conf = init.bikaApiRest;
        this.params =  params===undefined ? {} : params;

        if ($rootScope.currentUser  !== undefined) {
            this.params.username = $rootScope.currentUser.username;
            this.params.password = $rootScope.currentUser.password;
        }

        for (var key in this.conf) {
            this.params[key] = this.conf[key];
        }

        this.req = {
			 method: 'POST',
			 url: this.url,
			 headers: {
			   'Content-Type': undefined,
			 },
			 data: this.params
		};

		return $http(this.req)
    }
});


bika_api_rest_module.service('BikaService', function(BikaApiRestService, config, $http) {

    this.login = function(params) {
        method = config.bikaApiRest.methods.login;
        return BikaApiRestService.call('read',method, params);
    }

	this.checkStatus = function() {
        method = config.bikaApiRest.methods.check_status;
        return BikaApiRestService.call('read', method);
    };

    this.getClients = function(params) {
        method = config.bikaApiRest.methods.get_clients;
        return BikaApiRestService.call('read', method, params);
    };

    this.getContacts = function(params) {
        method = config.bikaApiRest.methods.get_contacts;
        return BikaApiRestService.call('read', method, params);
    };

	this.getSamples = function(params) {
        method = config.bikaApiRest.methods.get_samples;
        return BikaApiRestService.call('read', method, params);
    };

    this.countSamples = function(params) {
        method = config.bikaApiRest.methods.count_samples;
        return BikaApiRestService.call('read', method, params);
    };

    this.getAnalysisServices = function() {
        method = config.bikaApiRest.methods.get_analysis_services;
        return BikaApiRestService.call('read', method);
    };

    this.getAnalysisProfiles = function() {
        method = config.bikaApiRest.methods.get_analysis_profiles;
        return BikaApiRestService.call('read', method);
    };

    this.getSampleTypes = function(params) {
        method = config.bikaApiRest.methods.get_sample_types;
        return BikaApiRestService.call('read', method, params);
    };

    this.getBatches = function(params) {
        method = config.bikaApiRest.methods.get_batches;
        return BikaApiRestService.call('read', method, params);
    };

    this.getWorksheets = function(params) {
        method = config.bikaApiRest.methods.get_worksheets;
        return BikaApiRestService.call('read', method, params);
    };

    this.getSupplyOrders = function(params) {
        method = config.bikaApiRest.methods.get_supply_orders;
        return BikaApiRestService.call('read', method, params);
    };

    this.getPurchaseOrders = function(params) {
        method = config.bikaApiRest.methods.get_purchase_orders;
        return BikaApiRestService.call('read', method, params);
    };

	this.getLabProducts = function(params) {
        method = config.bikaApiRest.methods.get_lab_products;
        return BikaApiRestService.call('read', method, params);
    };

    this.getStorageLocations = function(params) {
        method = config.bikaApiRest.methods.get_storage_locations;
        return BikaApiRestService.call('read', method, params);
    };

    this.getManufacturers = function(params) {
        method = config.bikaApiRest.methods.get_manufacturers;
        return BikaApiRestService.call('read', method, params);
    };

    this.getSuppliers = function(params) {
        method = config.bikaApiRest.methods.get_suppliers;
        return BikaApiRestService.call('read', method, params);
    };

    this.getUsers = function(params) {
        method = config.bikaApiRest.methods.get_users;
        return BikaApiRestService.call('read', method, params);
    };

    this.getManagerUsers = function(params) {
        method = config.bikaApiRest.methods.get_manager_users;
        return BikaApiRestService.call('read', method);
    };

    this.getAnalystUsers = function() {
        method = config.bikaApiRest.methods.get_analyst_users;
        return BikaApiRestService.call('read', method);
    };

    this.getClerkUsers = function() {
        method = config.bikaApiRest.methods.get_clerk_users;
        return BikaApiRestService.call('read', method);
    };

    this.getClientUsers = function() {
        method = config.bikaApiRest.methods.get_client_users;
        return BikaApiRestService.call();
    };

	this.getAnalysisRequests = function(params) {
        method = config.bikaApiRest.methods.get_analysis_requests;
        return BikaApiRestService.call('read', method, params);
    };

    this.countAnalysisRequests = function(params) {
        method = config.bikaApiRest.methods.count_analysis_requests;
        return BikaApiRestService.call('read', method, params);
    };

	this.createWorksheet = function(params) {
    	method = config.bikaApiRest.methods.create_worksheet;
        return BikaApiRestService.call('write', method, params);
    };

    this.createDelivery = function(params) {
    	method = config.bikaApiRest.methods.create_delivery;
        return BikaApiRestService.call('write', method, params);
    };

    this.updateWorksheet = function(params) {
    	method = config.bikaApiRest.methods.update_worksheet;
        return BikaApiRestService.call('write', method, params);
    };

    this.updateWorksheets = function(params) {
    	method = config.bikaApiRest.methods.update_worksheets;
        return BikaApiRestService.call('write', method, params);
    };

    this.updateDelivery = function(params) {
    	method = config.bikaApiRest.methods.update_delivery;
        return BikaApiRestService.call('write', method, params);
    };

    this.updateDeliveries = function(params) {
    	method = config.bikaApiRest.methods.update_deliveries;
        return BikaApiRestService.call('write', method, params);
    };

    this.updateBatch = function(params) {
    	method = config.bikaApiRest.methods.update_batch;
        return BikaApiRestService.call('write', method, params);
    };

   this.updateBatches = function(params) {
    	method = config.bikaApiRest.methods.update_batches;
        return BikaApiRestService.call('write', method, params);
    }

    this.updateAnalysisRequest = function(params) {
    	method = config.bikaApiRest.methods.update_analysis_request;
        return BikaApiRestService.call('write', method, params);
    }

	this.updateAnalysisRequests = function(params) {
    	method = config.bikaApiRest.methods.update_analysis_requests;
        return BikaApiRestService.call('write', method, params);
    }

    this.updateSupplyOrder = function(params) {
    	method = config.bikaApiRest.methods.update_supply_order;
        return BikaApiRestService.call('write', method, params);
    }

	this.updateSupplyOrders = function(params) {
    	method = config.bikaApiRest.methods.update_supply_orders;
        return BikaApiRestService.call('write', method, params);
    }

    this.updatePurchaseOrder = function(params) {
    	method = config.bikaApiRest.methods.update_purchase_order;
        return BikaApiRestService.call('write', method, params);
    }

	this.updatePurchaseOrders = function(params) {
    	method = config.bikaApiRest.methods.update_purchase_orders;
        return BikaApiRestService.call('write', method, params);
    }

    this.updateLabProduct = function(params) {
    	method = config.bikaApiRest.methods.update_lab_product;
        return BikaApiRestService.call('write', method, params);
    }

	this.updateLabProducts = function(params) {
    	method = config.bikaApiRest.methods.update_lab_products;
        return BikaApiRestService.call('write', method, params);
    }

    this.updateClient = function(params) {
    	method = config.bikaApiRest.methods.update_client;
        return BikaApiRestService.call('write', method, params);
    }

	this.updateClients = function(params) {
    	method = config.bikaApiRest.methods.update_clients;
        return BikaApiRestService.call('write', method, params);
    }

    this.createClient = function(params) {
    	method = config.bikaApiRest.methods.create_client;
        return BikaApiRestService.call('write', method, params);
    }

    this.createContact = function(params) {
    	method = config.bikaApiRest.methods.create_contact;
        return BikaApiRestService.call('write', method, params);
    }

    this.createBatch = function(params) {
    	method = config.bikaApiRest.methods.create_batch;
        return BikaApiRestService.call('write', method, params);
    }

	this.createAnalysisRequest = function(params) {
    	method = config.bikaApiRest.methods.create_analysis_request;
        return BikaApiRestService.call('write', method, params);
    }

	this.createSupplyOrder = function(params) {
    	method = config.bikaApiRest.methods.create_supply_order;
        return BikaApiRestService.call('write', method, params);
    }

    this.createPurchaseOrder = function(params) {
    	method = config.bikaApiRest.methods.create_purchase_order;
        return BikaApiRestService.call('write', method, params);
    }

    this.createLabProduct = function(params) {
    	method = config.bikaApiRest.methods.create_lab_product;
        return BikaApiRestService.call('write', method, params);
    }

    this.cancelBatch = function(params) {
    	method = config.bikaApiRest.methods.cancel_batch;
        return BikaApiRestService.call('read', method, params);
    }

    this.cancelWorksheet = function(params) {
    	method = config.bikaApiRest.methods.cancel_worksheet;
        return BikaApiRestService.call('read', method, params);
    }

    this.cancelAnalysisRequest = function(params) {
    	method = config.bikaApiRest.methods.cancel_analysis_request;
        return BikaApiRestService.call('read', method, params);
    }

    this.reinstateBatch = function(params) {
    	method = config.bikaApiRest.methods.reinstate_batch;
        return BikaApiRestService.call('read', method, params);
    }

	this.reinstateWorksheet = function(params) {
    	method = config.bikaApiRest.methods.reinstate_worksheet;
        return BikaApiRestService.call('read', method, params);
    }

    this.reinstateAnalysisRequest = function(params) {
    	method = config.bikaApiRest.methods.reinstate_analysis_request;
        return BikaApiRestService.call('read', method, params);
    }

    this.openBatch = function(params) {
    	method = config.bikaApiRest.methods.open_batch;
        return BikaApiRestService.call('read', method, params);
    }

    this.closeBatch = function(params) {
    	method = config.bikaApiRest.methods.close_batch;
        return BikaApiRestService.call('read', method, params);
    }

    this.openWorksheet = function(params) {
    	method = config.bikaApiRest.methods.open_worksheet;
        return BikaApiRestService.call('read', method, params);
    }

    this.closeWorksheet = function(params) {
    	method = config.bikaApiRest.methods.close_worksheet;
        return BikaApiRestService.call('read', method, params);
    }

    this.receiveSample = function(params) {
    	method = config.bikaApiRest.methods.receive_sample;
        return BikaApiRestService.call('write', method, params);
    }

    this.submit = function(params) {
    	method = config.bikaApiRest.methods.submit;
        return BikaApiRestService.call('write', method, params);
    }

    this.assign = function(params) {
    	method = config.bikaApiRest.methods.assign;
        return BikaApiRestService.call('write', method, params);
    }

    this.verify = function(params) {
    	method = config.bikaApiRest.methods.verify;
        return BikaApiRestService.call('write', method, params);
    }

    this.publish = function(params) {
    	method = config.bikaApiRest.methods.publish;
        return BikaApiRestService.call('write', method, params);
    }

	this.republish = function(params) {
    	method = config.bikaApiRest.methods.republish;
        return BikaApiRestService.call('write', method, params);
    }

	this.activateSupplyOrder = function(params) {
    	method = config.bikaApiRest.methods.activate_supply_order;
        return BikaApiRestService.call('read', method, params);
    }

    this.deactivateSupplyOrder = function(params) {
    	method = config.bikaApiRest.methods.deactivate_supply_order;
        return BikaApiRestService.call('read', method, params);
    }

    this.activateLabProduct = function(params) {
    	method = config.bikaApiRest.methods.activate_lab_product;
        return BikaApiRestService.call('read', method, params);
    }

    this.deactivateLabProduct = function(params) {
    	method = config.bikaApiRest.methods.deactivate_lab_product;
        return BikaApiRestService.call('read', method, params);
    }

    this.dispatchSupplyOrder = function(params) {
    	method = config.bikaApiRest.methods.dispatch_supply_order;
        return BikaApiRestService.call('read', method, params);
    }

    this.setAnalysisResult = function(params) {
    	method = config.bikaApiRest.methods.set_analysis_result;
        return BikaApiRestService.call('write', method, params);
    }

    this.setAnalysesResults = function(params) {
    	method = config.bikaApiRest.methods.set_analyses_results;
        return BikaApiRestService.call('write', method, params);
    }

    this.activateClient = function(params) {
    	method = config.bikaApiRest.methods.activate_client;
        return BikaApiRestService.call('read', method, params);
    }

    this.deactivateClient = function(params) {
    	method = config.bikaApiRest.methods.deactivate_client;
        return BikaApiRestService.call('read', method, params);
    }
});