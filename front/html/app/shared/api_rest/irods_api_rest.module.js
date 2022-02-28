var irods_api_rest_module = angular.module('IrodsApiRestModule', [])

irods_api_rest_module.run(function($rootScope){
  $rootScope._ = _;
});

irods_api_rest_module.service('IrodsApiRestService',  function(init, $http) {

    this.call = function(mode, method, params) {

		this.conf =  init.apiRest[mode];
        this.url = this.conf.url + method;
        this.params =  params===undefined ? {} : params;

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

irods_api_rest_module.service('IrodsService', function(IrodsApiRestService, init, config, $http) {

	this.getRunningFolders = function(params) {

		this.params = (params !== undefined)?params:{}
        _.extend(this.params,init.sshApiRest);

    	this.method = config.irodsApiRest.methods.get_running_folders;
        return IrodsApiRestService.call('read', this.method, this.params);
    }

    this.putSamplesheet = function(params) {

		this.params = (params !== undefined)?params:{}
        _.extend(this.params,init.sshApiRest);
        _.extend(this.params,init.irodsApiRest);

    	this.method = config.irodsApiRest.methods.put_samplesheet;
        return IrodsApiRestService.call('write',this.method, this.params);
    }

    this.getSamplesheet = function(params) {

		this.params = (params !== undefined)?params:{}
        _.extend(this.params,init.sshApiRest);
        _.extend(this.params,init.irodsApiRest);

    	this.method = config.irodsApiRest.methods.get_samplesheet;
        return IrodsApiRestService.call('read',this.method, this.params);
    }

     this.rmSamplesheet = function(params) {

		this.params = (params !== undefined)?params:{}
        _.extend(this.params,init.sshApiRest);
        _.extend(this.params,init.irodsApiRest);

    	this.method = config.irodsApiRest.methods.rm_samplesheet;
        return IrodsApiRestService.call('read',this.method, this.params);
    }

    this.getRuns = function(params) {

		this.params = (params !== undefined)?params:{}
        _.extend(this.params,init.sshApiRest);
        _.extend(this.params,init.irodsApiRest);

    	this.method = config.irodsApiRest.methods.get_runs;
        return IrodsApiRestService.call('read', this.method, this.params);
    }

    this.checkRuns = function(params) {

		this.params = (params !== undefined)?params:{}
        _.extend(this.params,init.sshApiRest);

    	this.method = config.irodsApiRest.methods.check_runs;
        return IrodsApiRestService.call('read', this.method, this.params);
    }

    this.syncBatchbook = function(params) {

		this.params = (params !== undefined)?params:{}
        _.extend(this.params,init.sshApiRest);

    	this.method = config.irodsApiRest.methods.sync_batchbook;
        return IrodsApiRestService.call('read', this.method, this.params);
    }

});