from functools import wraps
from bottle import post, get, run, response, request
import json


# from bikaclient import BikaClient
from alta.bims import Bims

class BikaApiRestService(object):

    def __init__(self, logger):
        self.user_roles = ['Site Administrator', 'LabManager', 'Analyst', 'LabClerk', 'Client']
        self.logger = logger
        pass

    def _get_bika_instance(self, params):
        self.logger.info("{} asks to  log in {}".format(params.get('username'),
                                                        params.get('host') ) )
        bika = Bims(host=params.get('host'),
                    user=params.get('username'),
                    password=params.get('password'),
                    bims_label='bikalims').bims
        return bika.client

    def _success(self, body, return_code=200):
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Methods'] = 'POST, GET, OPTIONS, PUT'
        response.headers['Access-Control-Allow-Headers'] = 'Origin, X-Requested-With, Content-Type, Accept'
        response.content_type = 'application/json'
        response.status = return_code
        return json.dumps({'result': body}, encoding='latin1')

    def _get_params(self, request_data):
        for item in request_data:
            return eval(item)

    def wrap_default(f):
        @wraps(f)
        def wrapper(inst, *args, **kwargs):
            res = f(inst, *args, **kwargs)
            if not res or len(res) == 0:
                return None
            else:
                return inst._success(res)
        return wrapper

    def test_server(self):
        status = {'status':'Server running'}
        self.logger.debug("Server is running")
        return json.dumps({'result': status}, encoding='latin1')

    @wrap_default
    def login(self):
        def is_signed(params, bika):
            login_test = bika.get_clients(self._format_params(params))
            if 'objects' in login_test and len(login_test['objects']) > 0:
                return True
            return False

        self.logger.info("Logging")

        params = self._get_params(request.forms)
        bika = self._get_bika_instance(params)

        if is_signed(params, bika):

            user = params.get('username')

            if user in ['admin']:
                result = dict(
                    userid=user,
                    fullname=user,
                    role='Site Administrator',
                )
                self.logger.info(user + " is signed with role: Site Administrator")
                return dict(user=result,
                            is_signed='True',
                            success='True')

            for role in self.user_roles:
                params['roles']=role
                res = bika.get_users(self._format_params(params))
                if 'users' in res:
                    for r in res['users']:
                        if user in r['userid']:
                            result = dict(
                                userid=self.__str(r['userid']),
                                fullname=self.__str(r['fullname']),
                                role=role,
                                is_clerk='True' if role=='LabClerk' else self.__str(self._is_clerk(user=r['fullname'])),
                            )
                            self.logger.info(user + " is signed with role: " + role)
                            return dict(user=result,
                                        is_signed='True',
                                        success=self.__str(res['success']), error=self.__str(res['error']))

        self.logger.info(user + " is not signed")
        return dict(user=[],
                    is_signed='False',
                    success='False', error='True')

    @wrap_default
    def get_clients(self):
        self.logger.info("Getting Clients")
        params = self._get_params(request.forms)
        bika = self._get_bika_instance(params)
        contacts = bika.get_contacts()

        batches = bika.get_batches(dict()) if 'id' in params and params.get('id') else None
        supply_orders = bika.get_supply_orders() if 'id' in params and params.get('id') else None

        res = bika.get_clients(params)
        result = [dict(
                id=self.__str(r['id']),
                title=self.__str(r['Title']),
                name=self.__str(r['Name']),
                client_id=self.__str(r['ClientID']),
                description=self.__str(r['description']),
                path=self.__str(r['path']),
                phone=self.__str(r['Phone']),
                fax=self.__str(r['Fax']),
                email_address=self.__str(r['EmailAddress']),
                physical_address=dict(city=self.__str(r['PhysicalAddress']['city']),
                                      # district=self.__str(r['PhysicalAddress']['district']),
                                      zip=self.__str(r['PhysicalAddress']['zip']),
                                      country=self.__str(r['PhysicalAddress']['country']),
                                      # state=self.__str(r['PhysicalAddress']['state']),
                                      address=self.__str(r['PhysicalAddress']['address']),
                                      ),
                # postal_address=dict(city=self.__str(r['PostalAddress']['city']),
                #                     # district=self.__str(r['PostalAddress']['district']),
                #                     zip=self.__str(r['PostalAddress']['zip']),
                #                     country=self.__str(r['PostalAddress']['country']),
                #                     state=self.__str(r['PostalAddress']['state']),
                #                     address=self.__str(r['PostalAddress']['address']),
                #                     ),
                # billing_address=dict(city=self.__str(r['BillingAddress']['city']),
                #                      # district=self.__str(r['BillingAddress']['district']),
                #                      zip=self.__str(r['BillingAddress']['zip']),
                #                      country=self.__str(r['BillingAddress']['country']),
                #                      state=self.__str(r['BillingAddress']['state']),
                #                      address=self.__str(r['BillingAddress']['address']),
                #                      ),
                account_name=self.__str(r['AccountName']),
                account_type=self.__str(r['AccountType']),
                account_number=self.__str(r['AccountNumber']),
                bank_name=self.__str(r['BankName']),
                bank_branch=self.__str(r['BankBranch']),
                review_state='active' if 'deactivate' in [self.__str(t['id']) for t in r['transitions']] else 'deactivate',
                subject='' if len(r['subject']) == 0 else self.__str(r['subject'][0]),
                date=self.__str(r['Date']),
                creation_date=self.__str(r['creation_date']),
                modification_date=self.__str(r['modification_date']),
                contacts=self._get_client_contacts(client_id=self.__str(r['id']), contacts=contacts),
                creator=self.__str(r['Creator']),
                batches=self._get_client_batches(client_name=self.__str(r['Name']), batches=batches) if batches else [],
                cost_centers=self._get_client_supply_orders(client_id=self.__str(r['id']), supply_orders=supply_orders) if batches else [],
                transitions=[dict(id=self.__str(t['id']), title=self.__str(t['title'])) for t in r['transitions']],

        ) for r in res['objects']]
        self.logger.info("Clients: {} - success: {} - error: {} ".format(
            self.__str(res['total_objects']),
            self.__str(res['success']),
            self.__str(res['error']),
        ))
        return dict(objects=result, total=self.__str(res['total_objects']),
                    first=self.__str(res['first_object_nr']), last=self.__str(res['last_object_nr']),
                    success=self.__str(res['success']), error=self.__str(res['error']))

    @wrap_default
    def get_contacts(self):
        self.logger.info("Getting Contacts")
        params = self._get_params(request.forms)
        bika = self._get_bika_instance(params)
        res = bika.get_contacts(params)
        client_id = params.get('client_id', '')
        result = [dict(
                id=self.__str(r['id']),
                title=self.__str(r['Title']),
                email_address=self.__str(r['EmailAddress']),
                phone=self.__str(r['HomePhone']),
                path=self.__str(r['path'])) for r in res['objects'] if client_id in r['path']]

        self.logger.info("Contacts: {} - success: {} - error: {} ". format(
            self.__str(res['total_objects']),
            self.__str(res['success']),
            self.__str(res['error']),
        ))
        return dict(objects=result, total=self.__str(res['total_objects']),
                    first=self.__str(res['first_object_nr']), last=self.__str(res['last_object_nr']),
                    success=self.__str(res['success']), error=self.__str(res['error']))

    @wrap_default
    def get_samples(self):
        self.logger.info("Getting Samples")
        params = self._get_params(request.forms)
        bika = self._get_bika_instance(params)
        result = bika.get_samples(params)
        self.logger.info("Samples: {} - success: {} - error: {} ".format(
            self.__str(result['total_objects']),
            self.__str(result['success']),
            self.__str(result['error']),
        ))
        return result

    @wrap_default
    def get_analysis_requests(self):
        self.logger.info("Getting Analysis Requests")
        params = self._get_params(request.forms)
        bika = self._get_bika_instance(params)
        res = bika.get_analysis_requests(params)
        result = [dict(
                id=self.__str(r['id']),
                title=self.__str(r['Title']),
                sample_id=self.__str(r['SampleID']),
                sample_type=self.__str(r['SampleTypeTitle']),
                path=self.__str(r['path']),
                client_sample_id=self.__str(r['ClientSampleID']),
                client=self.__str(r['Client']),
                contact=self.__str(r['Contact']),
                cccontact=[self.__str(c) for c in r['CCContact']],
                batch_id=self.__str(r['title']),
                batch_title=self.__str(r['Batch']),
                date=self.__str(r['Date']),
                date_received=self.__str(r['DateReceived']),
                date_published=self.__str(r['DatePublished']),
                date_created=self.__str(r['creation_date']),
                review_state=self.__str(r['review_state']) if 'published' in self.__str(r['review_state']) else self.__str(r['subject'][0]),
                    #review_state=self.__str(r['subject'][0]) if 'publishself.__str(r['review_state']) else self.__str(r['review_state']),
                remarks=self.__str(r['Remarks']),
                rights=self.__str(r['rights']),
                results_interpretation=self.__str(r['ResultsInterpretation']),
                params=self._get_environmental_conditions(r['EnvironmentalConditions']),
                creator=self.__str(r['Creator']),
                analyses=self._get_analyses(r['Analyses']),
                runs=self._get_runs_ar(r['Sampler']),
                transitions=[dict(id=self.__str(t['id']), title=self.__str(t['title'])) for t in r['transitions']],
                ) for r in res['objects']]
        self.logger.info("Analysis Requests: {} - success: {} - error: {} ".format(
            self.__str(res['total_objects']),
            self.__str(res['success']),
            self.__str(res['error']),
        ))
        return dict(objects=result, total=self.__str(res['total_objects']),
                    first=self.__str(res['first_object_nr']), last=self.__str(res['last_object_nr']),
                    success=self.__str(res['success']), error=self.__str(res['error']))

    @wrap_default
    def get_arimports(self):
        self.logger.info("Getting AR Imports")
        params = self._get_params(request.forms)
        bika = self._get_bika_instance(params)
        result = bika.get_arimports(params)
        self.logger.info("AR Imports: {} - success: {} - error: {} ".format(
            self.__str(result['total_objects']),
            self.__str(result['success']),
            self.__str(result['error']),
        ))
        return result

    @wrap_default
    def get_batches(self):
        self.logger.info("Getting Batches")
        params = self._get_params(request.forms)
        bika = self._get_bika_instance(params)
        res = bika.get_batches(params)
        result = [dict(
                id=self.__str(r['id']),
                title=self.__str(r['Title']),
                description=self.__str(r['description']),
                path=self.__str(r['path']),
                client_batch_id=self.__str(r['ClientBatchID']),
                client=self.__str(r['Client']),
                date=self.__str(r['Date']),
                creation_date=self.__str(r['creation_date']),
                modification_date=self.__str(r['modification_date']),
                review_state=self.__str(r['review_state']),
                remarks=self.__str(r['Remarks']),
                uid=self.__str(r['UID']),
                creator=self.__str(r['Creator']),
                cost_center=self.__str(r['rights']),
                transitions=[dict(id=self.__str(t['id']), title=self.__str(t['title'])) for t in r['transitions']],
                )for r in res['objects']]
        self.logger.info("Batches: {} - success: {} - error: {} ".format(
            self.__str(res['total_objects']),
            self.__str(res['success']),
            self.__str(res['error']),
        ))
        return dict(objects=result, total=self.__str(res['total_objects']),
                    first=self.__str(res['first_object_nr']), last=self.__str(res['last_object_nr']),
                    success=self.__str(res['success']), error=self.__str(res['error']))

    @wrap_default
    def get_worksheets(self):
        self.logger.info("Getting Worksheets")
        params = self._get_params(request.forms)
        bika = self._get_bika_instance(params)
        res = bika.get_worksheets(params)
        result = [dict(
                id=self.__str(r['id']),
                title=self.__str(r['title']),
                description=self.__str(r['description']),
                path=self.__str(r['path']),
                analyst=self.__str(r['Analyst']),
                instrument=self.__str(r['Instrument']),
                location=self.__str(r['location']),
                creation_date=self.__str(r['creation_date']),
                modification_date=self.__str(r['modification_date']),
                date=self.__str(r['Date']),
                remarks=self.__str(r['Remarks']),
                review_state=self.__str(r['subject'][0]) if len(r['subject'])==1 else '',
                uid=self.__str(r['UID']),
                creator=self.__str(r['Creator']),
                transitions=[dict(id=self.__str(t['id']), title=self.__str(t['title'])) for t in r['transitions']],
        ) for r in res['objects']]
        self.logger.info("Worksheets: {} - success: {} - error: {} ".format(
            self.__str(res['total_objects']),
            self.__str(res['success']),
            self.__str(res['error']),
        ))
        return dict(objects=result, total=self.__str(res['total_objects']),
                    first=self.__str(res['first_object_nr']), last=self.__str(res['last_object_nr']),
                    success=self.__str(res['success']), error=self.__str(res['error']))

    @wrap_default
    def get_invoices(self):
        self.logger.info("Getting Invoices")
        params = self._get_params(request.forms)
        bika = self._get_bika_instance(params)
        result = bika.get_invoices(params)
        self.logger.info("Invoices: {} - success: {} - error: {} ".format(
            self.__str(result['total_objects']),
            self.__str(result['success']),
            self.__str(result['error']),
        ))
        return result

    @wrap_default
    def get_price_list(self):
        self.logger.info("Getting Price List")
        params = self._get_params(request.forms)
        bika = self._get_bika_instance(params)
        result = bika.get_price_list(params)
        self.logger.info("Price list: {} - success: {} - error: {} ".format(
            self.__str(result['total_objects']),
            self.__str(result['success']),
            self.__str(result['error']),
        ))
        return result

    @wrap_default
    def get_supply_orders(self):
        self.logger.info("Getting Clients")
        params = self._get_params(request.forms)
        bika = self._get_bika_instance(params)
        res = bika.get_supply_orders(params)
        result = [dict(
                id=self.__str(r['id']),
                title=self.__str(r['title']),
                description=self.__str(r['description']),
                path=self.__str(r['path']),
                creation_date=self.__str(r['creation_date']),
                modification_date=self.__str(r['modification_date']),
                expiration_date=self.__str(r['expirationDate']),
                dispatched_date=self.__str(r['DateDispatched']),
                order_date=self.__str(r['OrderDate']),

                date=self.__str(r['Date']),
                order_number=self.__str(r['OrderNumber']),
                location=self.__str(r['location']),
                rights=self.__str(r['rights']),
                remarks=self.__str(r['Remarks']),
                invoice=self.__str(r['Invoice']),
                client_id=self.__str(r['path']).split('/')[-2],
                review_state=self.__str(r['subject'][0]) if len(r['subject'])==1 else '',
                contributors=self.__str(r['contributors'][0]) if len(r['contributors'])==1 else '',
                uid=self.__str(r['UID']),
                creator=self.__str(r['Creator']),
                transitions=[dict(id=self.__str(t['id']), title=self.__str(t['title'])) for t in r['transitions']],
        ) for r in res['objects']]

        if params.get('client_id'):
            result = [r for r in result if r['client_id'] == params.get('client_id')]

        if params.get('order_date_from'):
            result = [r for r in result if r['order_date'] >= params.get('order_date_from').replace('-', '/')]

        if params.get('order_date_to'):
            result = [r for r in result if r['order_date'] <= params.get('order_date_to').replace('-', '/')]

        if params.get('expiration_date_from'):
            result = [r for r in result if r['expiration_date'] >= params.get('expiration_date_from').replace('-', '/')]

        if params.get('expiration_date_to'):
            result = [r for r in result if r['expiration_date'] <= params.get('expiration_date_to').replace('-', '/')]

        self.logger.info("Supply Orders: {} - success: {} - error: {} ".format(
            self.__str(res['total_objects']),
            self.__str(res['success']),
            self.__str(res['error']),
        ))
        return dict(objects=result, total=self.__str(res['total_objects']),
                    first=self.__str(res['first_object_nr']), last=self.__str(res['last_object_nr']),
                    success=self.__str(res['success']), error=self.__str(res['error']))

        return result

    @wrap_default
    def get_lab_products(self):
        self.logger.info("Getting Lab Products")
        params = self._get_params(request.forms)
        bika = self._get_bika_instance(params)
        res = bika.get_lab_products(params)
        result = [dict(
            id=self.__str(r['id']),
            title=self.__str(r['title']),
            description=self.__str(r['description']),
            path=self.__str(r['path']),
            creation_date=self.__str(r['creation_date']),
            modification_date=self.__str(r['modification_date']),
            expiration_date=self.__str(r['expirationDate']),
            effective_date=self.__str(r['effectiveDate']),
            date=self.__str(r['Date']),
            location=self.__str(r['location']),
            rights=self.__str(r['rights']),
            total_price=self.__str(r['TotalPrice']),
            price=self.__str(r['Price']),
            vat=self.__str(r['VAT']),
            vat_amount=self.__str(r['VATAmount']),
            unit=self.__str(r['Unit']),
            volume=self.__str(r['Volume']),
            review_state=self.__str(r['subject'][0]) if len(r['subject']) == 1 else '',
            uid=self.__str(r['UID']),
            creator=self.__str(r['Creator']),
            transitions=[dict(id=self.__str(t['id']), title=self.__str(t['title'])) for t in r['transitions']],
        ) for r in res['objects'] if 'bika_labproducts' not in self.__str(r['id'])]
        self.logger.info("Lab Products: {} - success: {} - error: {} ".format(
            self.__str(res['total_objects']),
            self.__str(res['success']),
            self.__str(res['error']),
        ))
        return dict(objects=result, total=self.__str(res['total_objects']),
                    first=self.__str(res['first_object_nr']), last=self.__str(res['last_object_nr']),
                    success=self.__str(res['success']), error=self.__str(res['error']))

        return result

    @wrap_default
    def get_storage_locations(self):
        self.logger.info("Getting Storage Locations")
        params = self._get_params(request.forms)
        bika = self._get_bika_instance(params)
        res = bika.get_storage_locations(params)
        result = [dict(
            id=self.__str(r['id']),
            title=self.__str(r['title']),
            description=self.__str(r['description']),
            path=self.__str(r['path']),
            creation_date=self.__str(r['creation_date']),
            modification_date=self.__str(r['modification_date']),
            date=self.__str(r['Date']),
            location=self.__str(r['location']),
            rights=self.__str(r['rights']),
            review_state=self.__str(r['subject'][0]) if len(r['subject']) == 1 else '',
            uid=self.__str(r['UID']),
            creator=self.__str(r['Creator']),
            transitions=[dict(id=self.__str(t['id']), title=self.__str(t['title'])) for t in r['transitions']],
        ) for r in res['objects'] if 'bika_storagelocations' not in self.__str(r['id'])]
        self.logger.info("Storage Locations: {} - success: {} - error: {} ".format(
            self.__str(res['total_objects']),
            self.__str(res['success']),
            self.__str(res['error']),
        ))
        return dict(objects=result, total=self.__str(res['total_objects']),
                    first=self.__str(res['first_object_nr']), last=self.__str(res['last_object_nr']),
                    success=self.__str(res['success']), error=self.__str(res['error']))

        return result

    @wrap_default
    def get_manufacturers(self):
        self.logger.info("Getting Manufacturers")
        params = self._get_params(request.forms)
        bika = self._get_bika_instance(params)
        res = bika.get_manufacturers(params)
        result = [dict(
            id=self.__str(r['id']),
            title=self.__str(r['title']),
            description=self.__str(r['description']),
            path=self.__str(r['path']),
            creation_date=self.__str(r['creation_date']),
            modification_date=self.__str(r['modification_date']),
            date=self.__str(r['Date']),
            location=self.__str(r['location']),
            rights=self.__str(r['rights']),
            review_state=self.__str(r['subject'][0]) if len(r['subject']) == 1 else '',
            uid=self.__str(r['UID']),
            creator=self.__str(r['Creator']),
            transitions=[dict(id=self.__str(t['id']), title=self.__str(t['title'])) for t in r['transitions']],
        ) for r in res['objects'] if 'bika_manufacturers' not in self.__str(r['id'])]
        self.logger.info("Manufactures: {} - success: {} - error: {} ".format(
            self.__str(res['total_objects']),
            self.__str(res['success']),
            self.__str(res['error']),
        ))
        return dict(objects=result, total=self.__str(res['total_objects']),
                    first=self.__str(res['first_object_nr']), last=self.__str(res['last_object_nr']),
                    success=self.__str(res['success']), error=self.__str(res['error']))

        return result

    @wrap_default
    def get_suppliers(self):
        self.logger.info("Getting Suppliers")
        params = self._get_params(request.forms)
        bika = self._get_bika_instance(params)
        res = bika.get_suppliers(params)
        result = [dict(
            id=self.__str(r['id']),
            title=self.__str(r['title']),
            name=self.__str(r['Name']),
            description=self.__str(r['description']),
            path=self.__str(r['path']),
            creation_date=self.__str(r['creation_date']),
            modification_date=self.__str(r['modification_date']),
            date=self.__str(r['Date']),
            location=self.__str(r['location']),
            rights=self.__str(r['rights']),
            review_state=self.__str(r['subject'][0]) if len(r['subject']) == 1 else '',
            uid=self.__str(r['UID']),
            creator=self.__str(r['Creator']),
            transitions=[dict(id=self.__str(t['id']), title=self.__str(t['title'])) for t in r['transitions']],
        ) for r in res['objects'] if 'bika_suppliers' not in self.__str(r['id'])]
        self.logger.info("Suppliers: {} - success: {} - error: {} ".format(
            self.__str(res['total_objects']),
            self.__str(res['success']),
            self.__str(res['error']),
        ))
        return dict(objects=result, total=self.__str(res['total_objects']),
                    first=self.__str(res['first_object_nr']), last=self.__str(res['last_object_nr']),
                    success=self.__str(res['success']), error=self.__str(res['error']))

        return result

    @wrap_default
    def get_artemplates(self):
        self.logger.info("Getting AR Templates")
        params = self._get_params(request.forms)
        bika = self._get_bika_instance(params)
        result = bika.get_artemplates(params)
        self.logger.info("AR Templates: {} - success: {} - error: {} ".format(
            self.__str(result['total_objects']),
            self.__str(result['success']),
            self.__str(result['error']),
        ))
        return result

    @wrap_default
    def get_analysis_profiles(self):
        self.logger.info("Getting Analysis Profiles")
        params = self._get_params(request.forms)
        bika = self._get_bika_instance(params)
        res = bika.get_analysis_profiles(params)
        result = [dict(
                id=self.__str(r['id']),
                title=self.__str(r['Title']),
                total_price=self.__str(r['TotalPrice']),
                path=self.__str(r['path']),
                services_data=self._get_service_data(r['AnalysisServicesSettings'])
                )for r in res['objects']]
        self.logger.info("Analysis Profiles: {} - success: {} - error: {} ".format(
            self.__str(res['total_objects']),
            self.__str(res['success']),
            self.__str(res['error']),
        ))
        return dict(objects=result, total=self.__str(res['total_objects']),
                    first=self.__str(res['first_object_nr']), last=self.__str(res['last_object_nr']),
                    success=self.__str(res['success']), error=self.__str(res['error']))

    @wrap_default
    def get_analysis_services(self):
        self.logger.info("Getting Analysis Services")
        params = self._get_params(request.forms)
        bika = self._get_bika_instance(params)
        res= bika.get_analysis_services(params)
        result = [dict(
                id=self.__str(r['id']),
                title=self.__str(r['Title']),
                keyword=self.__str(r['Keyword']),
                total_price=self.__str(r['TotalPrice']),
                price=self.__str(r['Price']),
                category=self.__str(r['CategoryTitle']),
                path=self.__str(r['path']),
                ) for r in res['objects']]
        self.logger.info("Analysis Services: {} - success: {} - error: {} ".format(
            self.__str(res['total_objects']),
            self.__str(res['success']),
            self.__str(res['error']),
        ))
        return dict(objects=result, total=self.__str(res['total_objects']),
                    first=self.__str(res['first_object_nr']), last=self.__str(res['last_object_nr']),
                    success=self.__str(res['success']), error=self.__str(res['error']))


    @wrap_default
    def get_sample_types(self):
        self.logger.info("Getting Sample Types")
        params = self._get_params(request.forms)
        bika = self._get_bika_instance(params)
        res = bika.get_sample_types(params)
        result = [dict(
                id=self.__str(r['id']),
                title=self.__str(r['Title']),
                container_type=self.__str(r['ContainerType']),
                prefix=self.__str(r['Prefix']),
                ) for r in res['objects']]
        self.logger.info("Sample Types: {} - success: {} - error: {} ".format(
            self.__str(res['total_objects']),
            self.__str(res['success']),
            self.__str(res['error']),
        ))
        return dict(objects=result, total=self.__str(res['total_objects']),
                    first=self.__str(res['first_object_nr']), last=self.__str(res['last_object_nr']),
                    success=self.__str(res['success']), error=self.__str(res['error']))

    @wrap_default
    def count_samples(self):
        self.logger.info("Counting Samples")
        params = self._get_params(request.forms)
        bika = self._get_bika_instance(params)
        res = bika.get_samples(params)
        result = self.__str(res['total_objects'])
        self.logger.info("Count samples: {} - success: {} - error: {} ".format(
            self.__str(res['total_objects']),
            self.__str(res['success']),
            self.__str(res['error']),
        ))
        return result

    @wrap_default
    def count_analysis_requests(self):
        self.logger.info("Counting Analysis Requests")
        params = self._get_params(request.forms)
        bika = self._get_bika_instance(params)
        res = bika.get_analysis_requests(params)
        result = self.__str(res['total_objects'])
        self.logger.info("Count analysis requests: {} - success: {} - error: {} ".format(
            self.__str(res['total_objects']),
            self.__str(res['success']),
            self.__str(res['error']),
        ))
        return result

    @wrap_default
    def create_client(self):
        self.logger.info("Creating Clients")
        params = self._get_params(request.forms)
        bika = self._get_bika_instance(params)
        res = bika.create_client(self._format_params(params))
        return self._outcome_creating(res, params)

    @wrap_default
    def create_contact(self):
        self.logger.info("Creating Contacts")
        params = self._get_params(request.forms)
        bika = self._get_bika_instance(params)
        res = bika.create_contact(self._format_params(params))
        return self._outcome_creating(res, params)

    @wrap_default
    def create_batch(self):
        self.logger.info("Creating Batchs")
        params = self._get_params(request.forms)
        bika = self._get_bika_instance(params)
        res = bika.create_batch(self._format_params(params))
        return self._outcome_creating(res, params)

    @wrap_default
    def create_analysis_request(self):
        self.logger.info("Creating Analysis Requests")
        params = self._get_params(request.forms)
        bika = self._get_bika_instance(params)
        res = bika.create_analysis_request(self._format_params(params))
        return self._outcome_creating(res, params)

    @wrap_default
    def create_worksheet(self):
        self.logger.info("Creating Worksheets")
        params = self._get_params(request.forms)
        bika = self._get_bika_instance(params)
        res = bika.create_worksheet(self._format_params(params))
        return self._outcome_creating(res, params)

    @wrap_default
    def create_supply_order(self):
        self.logger.info("Creating Supply Orders")
        params = self._get_params(request.forms)
        bika = self._get_bika_instance(params)
        res = bika.create_supply_order(self._format_params(params))
        return self._outcome_creating(res, params)

    @wrap_default
    def create_lab_product(self):
        self.logger.info("Creating Lab Products")
        params = self._get_params(request.forms)
        bika = self._get_bika_instance(params)
        res = bika.create_lab_product(self._format_params(params))
        return self._outcome_creating(res, params)

    @wrap_default
    def cancel_batch(self):
        self.logger.info("Deleting Batches")
        params = self._get_params(request.forms)
        bika = self._get_bika_instance(params)
        res = bika.cancel_batch(self._format_params(params))
        return self._outcome_action(res)

    @wrap_default
    def cancel_worksheet(self):
        self.logger.info("Deleting Worksheets")
        params = self._get_params(request.forms)
        bika = self._get_bika_instance(params)
        res = bika.cancel_worksheet(self._format_params(params))
        return self._outcome_action(res)

    @wrap_default
    def cancel_analysis_request(self):
        self.logger.info("Deleting Analysis Requests")
        params = self._get_params(request.forms)
        bika = self._get_bika_instance(params)
        res = bika.cancel_analysis_request(self._format_params(params))
        return self._outcome_action(res)

    @wrap_default
    def reinstate_batch(self):
        self.logger.info("Reinstating Batches")
        params = self._get_params(request.forms)
        bika = self._get_bika_instance(params)
        res = bika.reinstate_batch(self._format_params(params))
        return self._outcome_action(res)

    @wrap_default
    def reinstate_worksheet(self):
        self.logger.info("Reinstating Worksheets")
        params = self._get_params(request.forms)
        bika = self._get_bika_instance(params)
        res = bika.reinstate_worksheet(self._format_params(params))
        return self._outcome_action(res)

    @wrap_default
    def reinstate_analysis_request(self):
        self.logger.info("Reinstating Analysis Requests")
        params = self._get_params(request.forms)
        bika = self._get_bika_instance(params)
        res = bika.reinstate_analysis_request(self._format_params(params))
        return self._outcome_action(res)

    @wrap_default
    def open_batch(self):
        self.logger.info("Opening Batches")
        params = self._get_params(request.forms)
        bika = self._get_bika_instance(params)
        res = bika.open_batch(self._format_params(params))
        return self._outcome_action(res)

    @wrap_default
    def close_batch(self):
        self.logger.info("Closing Batches")
        params = self._get_params(request.forms)
        bika = self._get_bika_instance(params)
        res = bika.close_batch(self._format_params(params))
        return self._outcome_action(res)

    @wrap_default
    def open_worsheet(self):
        self.logger.info("Opening Worksheets")
        params = self._get_params(request.forms)
        bika = self._get_bika_instance(params)
        res = bika.open_worsheet(self._format_params(params))
        return self._outcome_action(res)

    @wrap_default
    def close_worsheet(self):
        self.logger.info("Closing Worksheets")
        params = self._get_params(request.forms)
        bika = self._get_bika_instance(params)
        res = bika.close_worsheet(self._format_params(params))
        return self._outcome_action(res)

    @wrap_default
    def receive_sample(self):
        self.logger.info("Receiving Samples")
        params = self._get_params(request.forms)
        bika = self._get_bika_instance(params)
        res = bika.receive_sample(self._format_params(params))
        return self._outcome_action(res)

    @wrap_default
    def submit(self):
        self.logger.info("Submitting")
        params = self._get_params(request.forms)
        bika = self._get_bika_instance(params)
        res = bika.submit(self._format_params(params))
        return self._outcome_action(res)

    @wrap_default
    def verify(self):
        self.logger.info("Verifying")
        params = self._get_params(request.forms)
        bika = self._get_bika_instance(params)
        res = bika.verify(self._format_params(params))
        return self._outcome_action(res)

    @wrap_default
    def publish(self):
        self.logger.info("Publishing")
        params = self._get_params(request.forms)
        bika = self._get_bika_instance(params)
        res = bika.publish(self._format_params(params))
        return self._outcome_action(res)

    @wrap_default
    def republish(self):
        self.logger.info("Republishing")
        params = self._get_params(request.forms)
        bika = self._get_bika_instance(params)
        res = bika.republish(self._format_params(params))
        return self._outcome_action(res)

    @wrap_default
    def activate_supply_order(self):
        self.logger.info("Activating Supply Orders")
        params = self._get_params(request.forms)
        bika = self._get_bika_instance(params)
        res = bika.activate_supply_order(self._format_params(params))
        return self._outcome_action(res)

    @wrap_default
    def deactivate_supply_order(self):
        self.logger.info("Deactivating Supply Orders")
        params = self._get_params(request.forms)
        bika = self._get_bika_instance(params)
        res = bika.deactivate_supply_order(self._format_params(params))
        return self._outcome_action(res)

    @wrap_default
    def dispatch_supply_order(self):
        self.logger.info("Dispatching Supply Orders")
        params = self._get_params(request.forms)
        bika = self._get_bika_instance(params)
        res = bika.dispatch_supply_order(self._format_params(params))
        return self._outcome_action(res)

    @wrap_default
    def activate_lab_product(self):
        self.logger.info("Activating Lab Products")
        params = self._get_params(request.forms)
        bika = self._get_bika_instance(params)
        res = bika.activate_lab_product(self._format_params(params))
        return self._outcome_action(res)

    @wrap_default
    def deactivate_lab_product(self):
        self.logger.info("Deactivating Lab Products")
        params = self._get_params(request.forms)
        bika = self._get_bika_instance(params)
        res = bika.deactivate_lab_product(self._format_params(params))
        return self._outcome_action(res)

    def activate_client(self):
        self.logger.info("Activating Clients")
        params = self._get_params(request.forms)
        bika = self._get_bika_instance(params)
        res = bika.activate_client(self._format_params(params))
        return self._outcome_action(res)

    @wrap_default
    def deactivate_client(self):
        self.logger.info("Deactivating Clients")
        params = self._get_params(request.forms)
        bika = self._get_bika_instance(params)
        res = bika.deactivate_client(self._format_params(params))
        return self._outcome_action(res)

    @wrap_default
    def set_analysis_result(self):
        self.logger.info("Setting Analysis Results")
        params = self._get_params(request.forms)
        bika = self._get_bika_instance(params)
        res = bika.update(self._format_params(params))
        return self._outcome_update(res)

    @wrap_default
    def set_analyses_results(self):
        self.logger.info("Setting Analysis Results")
        params = self._get_params(request.forms)
        bika = self._get_bika_instance(params)
        res = bika.update_many(self._format_params(params))
        return self._outcome_update(res)

    @wrap_default
    def get_users(self):
        self.logger.info("Getting Users")
        params = self._get_params(request.forms)
        bika = self._get_bika_instance(params)
        res = bika.get_users(self._format_params(params))
        result = [dict(
                userid=self.__str(r['userid']),
                fullname=self.__str(r['fullname']),
        ) for r in res['users']]
        self.logger.info("Users: {} - success: {} - error: {} ".format(
            self.__str(len(result)),
            self.__str(res['success']),
            self.__str(res['error']),
        ))
        return dict(objects=result,
                    success=self.__str(res['success']), error=self.__str(res['error']))

    @wrap_default
    def get_manager_users(self):
        self.logger.info("Getting Manager Users")
        params = self._get_params(request.forms)
        bika = self._get_bika_instance(params)
        res = bika.get_manager_users()
        result = [dict(
                userid=self.__str(r['userid']),
                fullname=self.__str(r['fullname']),
        ) for r in res['users']]
        self.logger.info("Manager Users: {} - success: {} - error: {} ".format(
            self.__str(len(result)),
            self.__str(res['success']),
            self.__str(res['error']),
        ))
        return dict(objects=result,
                    success=self.__str(res['success']), error=self.__str(res['error']))

    @wrap_default
    def get_analyst_users(self):
        self.logger.info("Getting Analyst Users")
        params = self._get_params(request.forms)
        bika = self._get_bika_instance(params)
        res = bika.get_analyst_users()
        result = [dict(
                userid=self.__str(r['userid']),
                fullname=self.__str(r['fullname']),
        ) for r in res['users']]
        self.logger.info("Analyst Users: {} - success: {} - error: {} ".format(
            self.__str(len(result)),
            self.__str(res['success']),
            self.__str(res['error']),
        ))
        return dict(objects=result,
                    success=self.__str(res['success']), error=self.__str(res['error']))

    @wrap_default
    def get_clerk_users(self):
        self.logger.info("Getting Clerk Users")
        params = self._get_params(request.forms)
        bika = self._get_bika_instance(params)
        res = bika.get_clerk_users()
        result = [dict(
                userid=self.__str(r['userid']),
                fullname=self.__str(r['fullname']),
        ) for r in res['users']]
        self.logger.info("Clerk Users: {} - success: {} - error: {} ".format(
            self.__str(len(result)),
            self.__str(res['success']),
            self.__str(res['error']),
        ))
        return dict(objects=result,
                    success=self.__str(res['success']), error=self.__str(res['error']))

    @wrap_default
    def get_client_users(self):
        self.logger.info("Getting Client Users")
        params = self._get_params(request.forms)
        bika = self._get_bika_instance(params)
        res = bika.get_client_users()
        result = [dict(
                userid=self.__str(r['userid']),
                fullname=self.__str(r['fullname']),
        ) for r in res['users']]
        self.logger.info("Client Users: {} - success: {} - error: {} ".format(
            self.__str(len(result)),
            self.__str(res['success']),
            self.__str(res['error']),
        ))
        return dict(objects=result,
                    success=self.__str(res['success']), error=self.__str(res['error']))


    @wrap_default
    def update_batch(self):
        self.logger.info("Updating Batch")
        params = self._get_params(request.forms)
        bika = self._get_bika_instance(params)
        res = bika.update(self._format_params(params))
        return self._outcome_update(res)

    @wrap_default
    def update_batches(self):
        self.logger.info("Updating Batches")
        params = self._get_params(request.forms)
        bika = self._get_bika_instance(params)
        res = bika.update_many(self._format_params(params))
        return self._outcome_update(res, params)

    @wrap_default
    def update_analysis_request(self):
        self.logger.info("Updating Analysis Request")
        params = self._get_params(request.forms)
        bika = self._get_bika_instance(params)
        res = bika.update(self._format_params(params))
        return self._outcome_update(res)

    @wrap_default
    def update_analysis_requests(self):
        self.logger.info("Updating Analysis Requests")
        params = self._get_params(request.forms)
        bika = self._get_bika_instance(params)
        res = bika.update_many(self._format_params(params))
        return self._outcome_update(res)

    @wrap_default
    def update_worksheet(self):
        self.logger.info("Updating Worksheet")
        params = self._get_params(request.forms)
        bika = self._get_bika_instance(params)
        res = bika.update(self._format_params(params))
        return self._outcome_update(res, params)

    @wrap_default
    def update_worksheets(self):
        self.logger.info("Updating Worksheets")
        params = self._get_params(request.forms)
        bika = self._get_bika_instance(params)
        res = bika.update_many(self._format_params(params))
        return self._outcome_update(res)

    @wrap_default
    def update_supply_order(self):
        self.logger.info("Updating Supply Order")
        params = self._get_params(request.forms)
        bika = self._get_bika_instance(params)
        res = bika.update(self._format_params(params))
        return self._outcome_update(res)

    @wrap_default
    def update_supply_orders(self):
        self.logger.info("Updating Supply Orders")
        params = self._get_params(request.forms)
        bika = self._get_bika_instance(params)
        res = bika.update_many(self._format_params(params))
        return self._outcome_update(res)

    @wrap_default
    def update_lab_product(self):
        self.logger.info("Updating Lab Product")
        params = self._get_params(request.forms)
        bika = self._get_bika_instance(params)
        res = bika.update(self._format_params(params))
        return self._outcome_update(res)

    @wrap_default
    def update_lab_products(self):
        self.logger.info("Updating Lab Products")
        params = self._get_params(request.forms)
        bika = self._get_bika_instance(params)
        res = bika.update_many(self._format_params(params))
        return self._outcome_update(res)

    @wrap_default
    def update_client(self):
        self.logger.info("Updating Client")
        params = self._get_params(request.forms)
        bika = self._get_bika_instance(params)
        res = bika.update(self._format_params(params))
        return self._outcome_update(res)

    @wrap_default
    def update_clients(self):
        self.logger.info("Updating Clients")
        params = self._get_params(request.forms)
        bika = self._get_bika_instance(params)
        res = bika.update_many(self._format_params(params))
        return self._outcome_update(res)

    @wrap_default
    def update_contact(self):
        self.logger.info("Updating Contact")
        params = self._get_params(request.forms)
        bika = self._get_bika_instance(params)
        res = bika.update(self._format_params(params))
        return self._outcome_update(res)

    @wrap_default
    def update_contacts(self):
        self.logger.info("Updating Contacts")
        params = self._get_params(request.forms)
        bika = self._get_bika_instance(params)
        res = bika.update_many(self._format_params(params))
        return self._outcome_update(res)

    def _is_clerk(self, user):
        params = self._get_params(request.forms)
        bika = self._get_bika_instance(params)
        res = bika.get_clerk_users()

        if 'users' in res:
            for r in res['users']:
                if user in r['fullname']:
                    return True

        return False

    def _get_client_contacts(self, client_id, contacts):

        return [dict(
            id=self.__str(r['id']),
            title=self.__str(r['Title']),
            first_name=self.__str(r['Firstname']),
            surname=self.__str(r['Surname']),
            email_address=self.__str(r['EmailAddress']),
            phone=self.__str(r['HomePhone']),
            path=self.__str(r['path'])
        ) for r in contacts['objects'] if client_id in r['path']]

    def _get_client_batches(self, client_name, batches):

        return [dict(
            id=self.__str(r['id']),
            title=self.__str(r['Title']),
            description=self.__str(r['description']),
            path=self.__str(r['path']),
            client_batch_id=self.__str(r['ClientBatchID']),
            client=self.__str(r['Client']),
            date=self.__str(r['Date']),
            creation_date=self.__str(r['creation_date']),
            modification_date=self.__str(r['modification_date']),
            subject=self.__str(r['subject'][0]) if len(r['subject']) == 1 else self.__str(r['review_state']),
            review_state=self.__str(r['review_state']),
            remarks=self.__str(r['Remarks']),
            uid=self.__str(r['UID']),
            creator=self.__str(r['Creator']),
            cost_center=self.__str(r['rights']),
            transitions=[dict(id=self.__str(t['id']), title=self.__str(t['title'])) for t in r['transitions']],
        ) for r in batches['objects'] if client_name == r['Client']]

    def _get_client_supply_orders(self, client_id, supply_orders):

        return [dict(
                id=self.__str(r['id']),
                title=self.__str(r['title']),
                description=self.__str(r['description']),
                path=self.__str(r['path']),
                creation_date=self.__str(r['creation_date']),
                modification_date=self.__str(r['modification_date']),
                expiration_date=self.__str(r['expirationDate']),
                dispatched_date=self.__str(r['DateDispatched']),
                order_date=self.__str(r['OrderDate']),
                date=self.__str(r['Date']),
                order_number=self.__str(r['OrderNumber']),
                location=self.__str(r['location']),
                rights=self.__str(r['rights']),
                remarks=self.__str(r['Remarks']),
                invoice=self.__str(r['Invoice']),
                client_id=self.__str(r['path']).split('/')[-2],
                review_state=self.__str(r['subject'][0]) if len(r['subject'])==1 else '',
                uid=self.__str(r['UID']),
                creator=self.__str(r['Creator']),
                transitions=[dict(id=self.__str(t['id']), title=self.__str(t['title'])) for t in r['transitions']],
        ) for r in supply_orders['objects'] if client_id in r['path']]

    def _get_analysis_requests(self, batch_id):
        params = self._get_params(request.forms)
        bika = self._get_bika_instance(params)
        this_params = dict(title= batch_id, include_fields='id')
        res = bika.get_analysis_requests(this_params)
        return [dict(
                id=self.__str(r['id']),
                path=self.__str(r['path']),
        ) for r in res['objects']]

    def _get_analyses(self, analyses):
        return [dict(
                id=self.__str(r['id']),
                title=self.__str(r['Title']),
                description=self.__str(r['description']),
                keyword=self.__str(r['Keyword']),
                category=self.__str(r['CategoryTitle']),
                result=self.__str(r['Result']),
                client=self.__str(r['ClientTitle']),
                due_date=self.__str(r['DueDate']),
                date_received=self.__str(r['DateReceived']),
                date_sampled=self.__str(r['DateSampled']),
                date_pubblished=self.__str(r['DateAnalysisPublished']),
                result_date=self.__str(r['ResultCaptureDate']),
                analyst=self.__str(r['Analyst']),
                request_id=self.__str(r['RequestID']),
                review_state=self.__str(r['review_state']),
                remarks=self.__str(r['Remarks']),
                uid=self.__str(r['UID']),
                transitions=[dict(id=self.__str(t['id']), title=self.__str(t['title'])) for t in r['transitions']],
        )for r in analyses]

    def _get_service_data(self, analysis_services_settings):
        for settings in analysis_services_settings:
            if 'service_data' in settings:
                services_data = [dict(
                    id=self.__str(s['id']),
                    title=self.__str(s['Title']),
                    price=self.__str(s['Price']),
                    path=self.__str(s['path']),
                ) for s in settings['service_data']]
                return services_data
        return []

    def _get_environmental_conditions(self, str_environmental_conditions):
        environmental_conditions = list()
        if '=' in str_environmental_conditions:
            for ec in str_environmental_conditions.split('|'):
                items = ec.split('=')
                if len(items) == 2:
                    environmental_conditions.append(dict(label=self.__str(items[0]), value=self.__str(items[1])))
        elif len(str_environmental_conditions.strip()) > 0:
            for evc in json.loads(str_environmental_conditions):
                for k,v in evc.iteritems():
                    environmental_conditions.append(dict(label=self.__str(k), value=self.__str(v)))

        return  environmental_conditions

    def _get_runs_ar(self, str_runs):
        runs = list()
        if isinstance(str_runs, list):
            return str_runs
        elif len(str_runs.strip()) > 0:
            return json.loads(str_runs)
        return runs

    def _format_params(self, params):
        mirror = dict(params)
        del mirror['host']
        del mirror['username']
        del mirror['password']
        return mirror

    def _outcome_creating(self, res, params):
        result = None
        if 'obj_id' in res:
            result = dict(success='True', obj_id=self.__str(res['obj_id']))
            self.logger.info("successfully created with ID: " + result.get('obj_id'))
        elif 'ar_id' in res and 'sample_id' in res:
            result = dict(success='True', ar_id=self.__str(res['ar_id']), sample_id=self.__str(res['sample_id']))
            self.logger.info("successfully created with IDs: " + result.get('ar_id') + " " + result.get('sample_id'))
        elif 'message' in res and 'The following request fields were not used: [\'obj_id\'].  Request aborted.' not in self.__str(res['message']):
            result = dict(success='False', message=self.__str(res['message']))
            self.logger.error("Error: " + result.get('message'))
        elif 'message' in res and 'The following request fields were not used: [\'obj_id\'].  Request aborted.' in self.__str(res['message']):
            result = dict(success='True', obj_id=self.__str(params['obj_id']))
            self.logger.info("successfully created with ID: " + result.get('obj_id'))

        return result if result else res

    def _outcome_action(self, res):
        if 'message' in res:
            result = dict(success='False', message=self.__str(res['message']))
            self.logger.error("Error: " + result.get('message'))
        else:
            result = dict(success='True')
            self.logger.error("successfully")

        return result if result else res

    def _outcome_update(self, res):
        if 'message' in res:
            result = dict(success='False', message=self.__str(res['message']))
            self.logger.error("Error: " + result.get('message'))
        else:
            result = dict(success='True', updates=[{self.__str(k): self.__str(v)}  for t in res['updates'] for k,v in t.iteritems()] if 'updates' in res else list())
            self.logger.error("successfully updated: ")

        return result if result else res
    
    def __str(self, txt):
        if isinstance(txt, (type(None),int,float)):
            txt = str(txt)
        return txt.encode('latin-1', 'ignore')