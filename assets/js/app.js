(function($) {
    $.prototype.slowScroll = function() {
        if (this.length == 0) return;

        var slowScroll = function($root) {
            var target = $root.attr('href');

            $root.unbind('click').bind('click', function() {
                $('html, body').animate({
                    scrollTop: $(target).offset().top
                }, 1600);
            });
        };

        for (var i = 0; i < this.length; i++) {
            new slowScroll($(this[i]));
        }
    };

    $.prototype.tabulation = function() {
        if (this.length == 0) return;

        var tabulation = function($root) {
            var $tabs = $root.find('[tabulation-tab]');
            var $panes = $root.find('[tabulation-pane]');

            $tabs.unbind('click').bind('click', function(e) {
                e.preventDefault() && e.stopPropagation();

                $panes.removeClass('active');
                $tabs.removeClass('active');

                $root.find('[tabulation-pane="' + $(this).attr('tabulation-tab') + '"]')
                    .addClass('active');

                $(this).addClass('active');
            });

            $tabs[0].click();
        };

        for (var i = 0; i < this.length; i++) {
            new tabulation($(this[i]));
        }
    };

    $('[slow-scroll]').slowScroll();
    $(".nano").nanoScroller();

    moment.locale('nl');
})(jQuery);
var shopkeeperApp = angular.module('shopkeeperApp', ['ui.router']);

shopkeeperApp.config(['ApiRequestProvider', function(ApiRequestProvider) {
    ApiRequestProvider.setHost(env_data.apiUrl);
}]);

shopkeeperApp.config(['$stateProvider', '$locationProvider', function($stateProvider, $locationProvider) {
    if (env_data.html5Mode.enable)
        $locationProvider.html5Mode(true);

    $stateProvider
        .state({
            url: '/',
            name: 'welcome',
            component: 'landingComponent',
            data: {
                title: "Home"
            }
        })
        .state({
            url: '/sign-out',
            name: 'sign-out',
            controller: ['$scope', '$state', 'AuthService', function($scope, $state, AuthService) {
                AuthService.signOut();
                $state.go('welcome');

                $scope.$emit('auth:sign-out');
            }]
        });

    // Profile
    $stateProvider
        .state({
            url: '/profile/edit',
            name: 'profile-edit',
            component: 'panelProfileEditComponent',
            data: {
                title: "Edit Profile"
            }
        })

    // Offices crud
    $stateProvider
        .state({
            url: '/panel/offices',
            name: 'panel-offices',
            component: 'panelOfficesComponent',
            data: {
                title: "Offices"
            }
        })
        .state({
            url: '/panel/offices/create',
            name: 'panel-offices-create',
            component: 'panelOfficesCreateComponent',
            data: {
                title: "Add office"
            }
        })
        .state({
            url: '/panel/offices/:id/edit',
            name: 'panel-offices-edit',
            component: 'panelOfficesEditComponent',
            data: {
                title: "Edit office"
            },
            params: {
                id: null
            }
        });

    // Transactions crud
    $stateProvider
        .state({
            url: '/panel/transactions',
            name: 'panel-transactions',
            component: 'panelTransactionsComponent',
            data: {
                title: "Transactions"
            }
        });
}]);

if (!env_data.html5Mode.enable)
    if (!document.location.hash)
        document.location.hash = '#!/';
shopkeeperApp.controller('BaseController', [
    '$rootScope',
    '$scope',
    '$state',
    'AuthService',
    'CategoryService',
    'FormBuilderService',
    'CredentialsService',
    'TransactionService',
    'ShopKeeperService',
    'OfficeService',
    function(
        $rootScope,
        $scope,
        $state,
        AuthService,
        CategoryService,
        FormBuilderService,
        CredentialsService,
        TransactionService,
        ShopKeeperService,
        OfficeService
    ) {
        $rootScope.$state = $state; 
        $rootScope.html5Mode = env_data.html5Mode; 
        
        $scope.$on('auth:sign-in', function() {
            $rootScope.credentials = CredentialsService.get();
            $scope.initializePanel();
        });

        $scope.$on('auth:sign-up', function() {
            $rootScope.credentials = CredentialsService.get();
        });

        $scope.$on('auth:sign-out', function() {
            $rootScope.credentials = false;
        });

        $scope.$on('auth:unauthenticated', function() {
            $state.go('sign-out');
        });

        $scope.$on('user:sync', function() {
            syncUserData();
        });

        $scope.$on('offices:sync', function() {
            syncOfficesData();
        });

        var syncUserData = function() {
            AuthService.getUser().then(function(response) {
                $rootScope.user = response.data || {};

                ShopKeeperService.getShopKeeperCategories($rootScope.user.shop_keeper.id).then(function(response) {
                    $rootScope.shopkeeper_categories = response.data || {};
                });
            });
        }

        var syncOfficesData = function() {
            OfficeService.countOffices().then(function(response) {
                $rootScope.count_offices = response.data.count || 0;
            });
        }

        $rootScope.credentials = CredentialsService.get();

        $scope.initializePanel = function() {

            TransactionService.countTransactions().then(function(response) {
                $rootScope.count_transactions = response.data.count || 0;
            });

            syncUserData();
            syncOfficesData();
        };

        if ($rootScope.credentials)
            $scope.initializePanel();
    }
]);
shopkeeperApp.component('landingComponent', {
    templateUrl: './tpl/pages/landing.html',
    controller: [
        '$rootScope',
        '$state',
        '$scope',
        'CredentialsService',
        function(
            $rootScope,
            $state,
            $scope,
            CredentialsService
        ) {
            var ctrl = this;
        }
    ]
});
shopkeeperApp.component('panelOfficesComponent', {
    templateUrl: './tpl/pages/panel/offices.html',
    controller: [
        '$rootScope',
        '$state',
        '$scope',
        '$timeout',
        'OfficeService',
        function(
            $rootScope,
            $state,
            $scope,
            $timeout,
            OfficeService
        ) {
            var ctrl = this;
            
            ctrl.$onInit = function() {
                OfficeService.getOffices().then(function(response) {
                    ctrl.offices = response.data;
                }, console.log);
            };
        }
    ]
});
shopkeeperApp.component('panelOfficesCreateComponent', {
    templateUrl: './tpl/pages/panel/offices-edit.html',
    controller: [
        '$q',
        '$rootScope',
        '$state',
        '$stateParams',
        '$scope',
        'AuthService',
        'CategoryService',
        'OfficeService',
        'FormBuilderService',
        'CredentialsService',
        function(
            $q,
            $rootScope,
            $state,
            $stateParams,
            $scope,
            AuthService,
            CategoryService,
            OfficeService,
            FormBuilderService,
            CredentialsService
        ) {
            var ctrl = this;

            ctrl.form = {};
            ctrl.form.office = FormBuilderService.build();

            var unwatcher = $rootScope.$watch('user', function(user) {
                if (!user)
                    return;

                init();
                unwatcher();
            });

            var init = function() {
                var office = {};

                var photoForupload = false;

                ctrl.office = office;
                ctrl.schedule_options = {};

                for (var i = 0; i < 24; i++) {
                    var hour = (i <= 9 ? '0' : '') + i;

                    ctrl.schedule_options[hour + ':00'] = hour + ':00';
                    ctrl.schedule_options[hour + ':30'] = hour + ':30';
                }

                ctrl.office.schedules = [{
                    start_time: '09:00',
                    end_time: '17:00',
                }, {
                    start_time: '09:00',
                    end_time: '17:00',
                }, {
                    start_time: '09:00',
                    end_time: '17:00',
                }, {
                    start_time: '09:00',
                    end_time: '17:00',
                }, {
                    start_time: '09:00',
                    end_time: '17:00',
                }];

                // fill profile form values
                ctrl.form.office.fillValues(office, ["email", "phone", "address", 'schedules']);

                // submit form to api
                ctrl.submitForm = function(e, form) {
                    e && e.preventDefault() && e.stopPropagation();

                    if (form.is_locked)
                        return;

                    form.lock();

                    OfficeService.create(form.values).then(function(response) {
                        var office = response.data;

                        if (photoForupload) {
                            OfficeService.updatePhoto(
                                office.id,
                                photoForupload
                            ).then(function(response) {
                                form.reset().unlock();

                                $scope.$emit('offices:sync');
                                $state.go('panel-offices');
                            }, form.unlock);
                        } else {
                            form.reset().unlock();

                            $scope.$emit('offices:sync');
                            $state.go('panel-offices');
                        }
                    }, function(response) {
                        form.fillErrors(response.data).unlock();
                    });
                };

                ctrl.selectPhoto = function(e) {
                    e && e.preventDefault() && e.stopPropagation();

                    var input = $('<input type="file" />');

                    input.click();

                    input.unbind('change').bind('change', function(e) {
                        photoForupload = e.target.files[0];
                    });
                }
            };
        }
    ]
});
shopkeeperApp.component('panelOfficesEditComponent', {
    templateUrl: './tpl/pages/panel/offices-edit.html',
    controller: [
        '$q',
        '$rootScope',
        '$state',
        '$stateParams',
        '$scope',
        'AuthService',
        'CategoryService',
        'OfficeService',
        'FormBuilderService',
        'CredentialsService',
        function(
            $q,
            $rootScope,
            $state,
            $stateParams,
            $scope,
            AuthService,
            CategoryService,
            OfficeService,
            FormBuilderService,
            CredentialsService
        ) {
            var ctrl = this;
            var input;

            ctrl.form = {};
            ctrl.form.office = FormBuilderService.build();

            var unwatcher = $rootScope.$watch('user', function(user) {
                if (!user)
                    return;

                init();
                unwatcher();
            });

            var init = function() {
                var promises = [];

                var map = {
                    office: 0,
                };

                promises[map.office] = $q(function(resolve, reject) {
                    OfficeService.getOffice($stateParams.id).then(function(response) {
                        resolve(response.data);
                    });
                });

                $q.all(promises).then(function(promises) {
                    var office = promises[map.office];

                    ctrl.office = office;
                    ctrl.schedule_options = {};

                    for (var i = 0; i < 24; i++) {
                        var hour = (i <= 9 ? '0' : '') + i;

                        ctrl.schedule_options[hour + ':00'] = hour + ':00';
                        ctrl.schedule_options[hour + ':30'] = hour + ':30';
                    }

                    // fill profile form values
                    ctrl.form.office.fillValues(office, ["email", "phone", "address", 'schedules']);

                    // submit form to api
                    ctrl.submitForm = function(e, form) {
                        e && e.preventDefault() && e.stopPropagation();

                        if (form.is_locked)
                            return;

                        form.lock();

                        OfficeService.update(office.id, form.values).then(function() {
                            form.reset().unlock();

                            $scope.$emit('user:sync');
                            $state.go('panel-offices');
                        }, function(response) {
                            form.fillErrors(response.data).unlock();
                        });
                    };

                    ctrl.selectPhoto = function(e) {
                        e && e.preventDefault() && e.stopPropagation();

                        input = document.createElement('input');
                        input.setAttribute("type", "file");

                        input.addEventListener('change', function(e) {
                            OfficeService.updatePhoto(
                                office.id,
                                e.target.files[0]
                            ).then(function(response) {
                                OfficeService.getOffice($stateParams.id).then(function(response) {
                                    ctrl.office = response.data;
                                });
                            });
                        });

                        input.click();
                    }
                });
            };
        }
    ]
});
shopkeeperApp.component('panelProfileEditComponent', {
    templateUrl: './tpl/pages/panel/profile-edit.html',
    controller: [
        '$q',
        '$rootScope',
        '$state',
        '$scope',
        'AuthService',
        'CategoryService',
        'ShopKeeperService',
        'FormBuilderService',
        'CredentialsService',
        function(
            $q,
            $rootScope,
            $state,
            $scope,
            AuthService,
            CategoryService,
            ShopKeeperService,
            FormBuilderService,
            CredentialsService
        ) {
            var ctrl = this;
            var input;

            ctrl.form = {};
            ctrl.form.profile = FormBuilderService.build();

            var unwatcher = $rootScope.$watch('user', function(user) {
                if (!user)
                    return;

                init();
                unwatcher();
            });

            var init = function() {
                var promises = [];

                var map = {
                    profile: 0,
                    categories: 1,
                    profile_categories: 2,
                };

                promises[map.profile] = $q(function(resolve, reject) {
                    AuthService.getUser().then(function(response) {
                        resolve(response.data);
                    });
                });

                promises[map.profile_categories] = $q(function(resolve, reject) {
                    ShopKeeperService.getShopKeeperCategories($rootScope.user.shop_keeper.id).then(function(response) {
                        resolve(response.data);
                    });
                });

                promises[map.categories] = $q(function(resolve, reject) {
                    CategoryService.getCategories().then(function(response) {
                        resolve(response.data);
                    }, console.log);
                });

                $q.all(promises).then(function(promises) {
                    resolvePromises(promises, map);
                });
            };

            var resolvePromises = function(promises, map) {
                var profile = promises[map.profile];
                var categories = promises[map.categories];
                var profile_categories = promises[map.profile_categories];

                // prepare lsit all available categories
                ctrl.all_categories = {};

                for (var prop = categories.length - 1; prop >= 0; prop--) {
                    ctrl.all_categories[categories[prop].id] = categories[prop];
                }

                // placeholder
                ctrl.all_categories[0] = {
                    name: "Please select category"
                };

                // fill profile form values
                ctrl.form.profile.fillValues(
                    profile.shop_keeper, [
                        "name", "phone", "kvk_number", "btw_number", "iban_name"
                    ]);

                ctrl.form.profile.fillValues(
                    profile, [
                        "email"
                    ]);

                ctrl.form.profile.values.categories = profile_categories.map(function(category) {
                    return category.id;
                });

                // add new category to shopkeepeer
                ctrl.selectCategory = function(_void) {
                    var category_id = _void.category.id;

                    if (!category_id)
                        return;

                    if (ctrl.form.profile.values.categories.indexOf(category_id) == -1) {
                        ctrl.form.profile.values.categories.push(category_id);
                    }

                    _void.category = ctrl.all_categories[0];
                }

                // delete category from shopkeeper
                ctrl.deleteCategory = function(e, category_id) {
                    e && e.preventDefault() && e.stopPropagation();

                    ctrl.form.profile.values.categories.splice(
                        ctrl.form.profile.values.categories.indexOf(parseInt(category_id)), 1);
                }

                // submit form to api
                ctrl.submitForm = function(e, form) {
                    e && e.preventDefault() && e.stopPropagation();

                    if (form.is_locked)
                        return;

                    form.lock();

                    ShopKeeperService.update(
                        profile.shop_keeper.id,
                        form.values
                    ).then(function(response) {
                        form.reset().unlock();

                        $scope.$emit('user:sync');
                        $state.go('panel-offices');
                    }, function(response) {
                        form.fillErrors(response.data).unlock();
                    });
                };

                ctrl.selectPhoto = function(e) {
                    e && e.preventDefault() && e.stopPropagation();

                    input = document.createElement('input');
                    input.setAttribute("type", "file");

                    input.addEventListener('change', function(e) {
                        ShopKeeperService.updatePhoto(
                            profile.shop_keeper.id,
                            e.target.files[0]
                        ).then(function(response) {
                            $scope.$emit('user:sync');
                        }, console.log);
                    });

                    input.click();
                }
            };
        }
    ]
});
shopkeeperApp.component('panelTransactionsComponent', {
    templateUrl: './tpl/pages/panel/transactions.html',
    controller: [
        '$rootScope',
        '$state',
        '$scope',
        '$timeout',
        'TransactionService',
        function(
            $rootScope,
            $state,
            $scope,
            $timeout,
            TransactionService
        ) {
            var ctrl = this;
            
            ctrl.$onInit = function() {
                TransactionService.getTransactions().then(function(response) {
                    ctrl.transactions = response.data;
                }, console.log);
            };
        }
    ]
});
shopkeeperApp.directive('authByQrCode', [
    '$state',
    '$timeout',
    'AuthService',
    'CredentialsService',
    function(
        $state,
        $timeout,
        AuthService,
        CredentialsService
    ) {
        return {
            restrict: 'A',
            templateUrl: './tpl/directives/auth-by-qr-code.html',
            replace: true,
            transclude: true,
            link: function($scope, iElm, iAttrs, controller) {
                var destroyed = false;

                $scope.timeout = false;

                var checkToken = function(token, success, error) {
                    AuthService.checkTokenState(token).then(function(response) {
                        if (!destroyed) {
                            if (response.data.authorized) {
                                success(response);
                            } else {
                                error(response);
                            }
                        }
                    }, function(response) {
                        if (!destroyed)
                            error(response);
                    });
                };

                $scope.showQrCode = function(e) {
                    e && e.stopPropagation() & e.preventDefault();

                    AuthService.generateToken().then(function(response) {
                        $scope.token = response.data.token;
                        var count = 0;

                        var qr_code = document.createElement("div");

                        var qrcode = new QRCode(qr_code, {
                            text: $scope.token,
                            width: 300,
                            height: 300,
                            colorDark: "#000000",
                            colorLight: "#ffffff",
                            correctLevel: QRCode.CorrectLevel.H
                        });

                        $(qr_code).find('img').bind('load', function() {
                            $scope.timeout = $timeout(function() {
                                $scope.qr_code = $(qr_code).find('img').attr('src');
                            }, 100);
                        });

                        var successHandler = function(response) {
                            response.data.token;

                            CredentialsService.set(response.data);
                            $state.go('panel-offices');

                            $scope.$emit('auth:sign-in');
                        };

                        var errorHandler = function() {
                            $scope.timeout = $timeout(function() {
                                checkToken($scope.token, successHandler, errorHandler);
                            }, 2500);
                        };

                        checkToken($scope.token, successHandler, errorHandler);
                    });
                }

                $scope.$on("$destroy", function() {
                    $timeout.cancel($scope.timeout);
                    destroyed = true;
                });

                $('[tabulation]').tabulation();
            }
        };
    }
]);
shopkeeperApp.directive('contactForm', [
    'ContactFormService',
    'FormBuilderService',
    function(
        ContactFormService,
        FormBuilderService
    ) {
        return {
            restrict: 'A',
            templateUrl: './tpl/directives/contact-form.html',
            replace: true,
            transclude: true,
            scope: true,
            link: function($scope, iElm, iAttrs, controller) {
                $scope.subjects = [{
                    key: 'other',
                    name: 'Other'
                }, {
                    key: 'tehnical_issuse',
                    name: 'Tehnical issuse'
                }];

                $scope.forms = {};
                $scope.forms.contact_form = FormBuilderService.build();
                $scope.forms.contact_form.values.subject = $scope.subjects[0];

                $scope.submitContactForm = function(e, form) {
                    e && (e.preventDefault() & e.stopPropagation());

                    if (form.submited)
                        return;

                    var values = JSON.parse(JSON.stringify(form.values));

                    values.subject = values.subject.key;

                    form.submited = true;

                    ContactFormService.submitForm(values).then(function(response) {
                        form.submited = false;
                        form.success = true;
                        form.reset();
                    }, function(response) {
                        form.errors = response.data;
                        form.submited = false;
                    });
                };
            }
        };
    }
]);
shopkeeperApp.provider('ApiRequest', function() {
    return new(function() {
        var host = false;

        this.setHost = function(_host) {
            while (_host[_host.length - 1] == '/')
                _host = _host.slice(0, _host.length - 1);

            host = _host;
        };

        this.$get = [
            '$q',
            '$http',
            '$state',
            '$rootScope',
            'DeviceIdService',
            'CredentialsService',
            function(
                $q,
                $http,
                $state,
                $rootScope,
                DeviceIdService,
                CredentialsService
            ) {
                var resolveUrl = function(input) {
                    var parser = document.createElement('a');

                    parser.href = input;

                    var pathname = parser.pathname.split('/');

                    if (pathname[0] !== '')
                        pathname.unshift('');

                    return parser.protocol + '//' + parser.host + pathname.join('/');
                }

                var makeHeaders = function() {
                    var credentails = CredentialsService.get();

                    return {
                        'Accept': 'application/json',
                        'Authorization': 'Bearer ' + (credentails ? credentails.access_token : ''),
                        'Device-Id': DeviceIdService.getDeviceId().id,
                    };
                };

                var get = function(endpoint, data, headers) {
                    return ajax('GET', endpoint, data, headers);
                };

                var post = function(endpoint, data, headers) {
                    return ajax('POST', endpoint, data, headers);
                };

                var ajax = function(method, endpoint, data, headers, debug) {
                    var params = {};

                    params.data = data || {};
                    params.headers = Object.assign(makeHeaders(), headers || {});

                    params.url = resolveUrl(host + endpoint);
                    params.method = method;

                    return $q(function(done, reject) {
                        $http(params).then(function(response) {
                            done(response);
                        }, function(response) {
                            if (!debug && (response.status == 401)) {
                                if ((response.data.error == 'device-pending') ||
                                    (response.data.error == 'device-unknown'))
                                    return $rootScope.$broadcast(
                                        'device:unauthorized',
                                        response.data);

                                if ((response.data.error == 'shopkeeper-pending'))
                                    return $rootScope.$broadcast(
                                        'shopkeeper:pending', response.data);

                                if ((response.data.error == 'shopkeeper-declined'))
                                    return $rootScope.$broadcast(
                                        'shopkeeper:declined', response.data);

                                if ((response.data.error == 'Unauthenticated.')) {
                                    return $rootScope.$broadcast(
                                        'auth:unauthenticated', response.data);
                                }
                            }

                            reject(response);
                        });
                    });
                };

                return {
                    get: get,
                    post: post,
                    ajax: ajax,
                }
            }
        ];
    });
});
shopkeeperApp.service('AuthService', [
    'ApiRequest',
    'CredentialsService',
    function(
        ApiRequest,
        CredentialsService
    ) {
        return new(function() {
            apiRequest = ApiRequest;

            this.signIn = function(values) {
                return ApiRequest.post('/shop-keepers/devices', values);
            };

            this.generateToken = function() {
                return ApiRequest.get('/shop-keepers/devices/token');
            };

            this.checkTokenState = function(token) {
                return ApiRequest.get('/shop-keepers/devices/token/' + token + '/state');
            };

            this.signOut = function(values) {
                CredentialsService.set(null);
            };

            this.getUser = function(credentails) {
                return ApiRequest.get('/user');
            };
        });
    }
]);
shopkeeperApp.service('CategoryService', [
    '$http',
    '$q',
    'ApiRequest',
    function(
        $http,
        $q,
        ApiRequest
    ) {
        return {
            getCategories: function() {
                return ApiRequest.get('/categories');
            }
        };
    }
]);
shopkeeperApp.service('ContactFormService', [
    '$http',
    '$q',
    'ApiRequest',
    function(
        $http,
        $q,
        ApiRequest
    ) {
        return new(function() {
            this.submitForm = function(values) {
                return ApiRequest.post('/../client/contact-form', values);
            };
        });
    }
]);
shopkeeperApp.service('CredentialsService', [function() {
    return new(function() {
        this.set = function(credentails) {
            return localStorage.setItem(env_data.credentials_key, JSON.stringify(credentails));
        };

        this.get = function() {
            return JSON.parse(localStorage.getItem(env_data.credentials_key));
        };
    });
}]);
shopkeeperApp.service('DeviceIdService', ['$http', '$q', function($http, $q) {
    return new(function() {
        this.getOptions = function(credentails, code) {
            return [{
                id: "474f654c51b6e87214a185fe503ccb6084024a73",
                name: 'Device #1'
            }, {
                id: "570fb66aac5281b4474c869f2bc7853cb0051023",
                name: 'Device #2'
            }, {
                id: "92d9af5ec7465dbfbc049bfc189d376e08ed98f2",
                name: 'Device #3'
            }, {
                id: "cc8d266b8088ffb8f176bc7823cdccfa44bb19df",
                name: 'Device #4'
            }, {
                id: "a318d5ab7a81709cf0b4e38f30aae2fcbe641d23",
                name: 'Device #5'
            }];
        };

        this.setDeviceId = function(device_id) {
            return window.localStorage.setItem('device_id', JSON.stringify(device_id));
        };

        this.getDeviceId = function() {
            if (!window.localStorage.getItem('device_id'))
                this.setDeviceId(this.getOptions()[0]);

            return JSON.parse(window.localStorage.getItem('device_id'));
        };
    });
}]);
shopkeeperApp.service('FormBuilderService', ['$http', function($http) {
    return new(function() {
        this.build = function() {
            return {
                values: {},
                errors: {},
                is_locked: false,
                fillValues: function(source, fields) {
                    for (var prop in fields) {
                        this.values[fields[prop]] = source[fields[prop]];
                    }

                    return this;
                },
                fillErrors: function(errors) {
                    this.errors = errors || [];

                    return this;
                },
                resetValues: function() {
                    this.values = {};

                    return this;
                },
                resetErrors: function() {
                    this.errors = {};

                    return this;
                },
                reset: function() {
                    return this.resetValues().resetErrors();
                },
                unlock: function() {
                    this.is_locked = false;

                    return this;
                },
                lock: function() {
                    this.is_locked = true;

                    return this;
                }
            };
        };
    });
}]);
shopkeeperApp.service('OfficeService', [
    '$http',
    'ApiRequest',
    function(
        $http,
        ApiRequest
    ) {
        return new(function() {
            this.getOffices = function() {
                return ApiRequest.get('/offices');
            };

            this.getOffice = function(id) {
                return ApiRequest.get('/offices/' + id);
            };

            this.countOffices = function() {
                return ApiRequest.get('/offices/count');
            };

            this.updateOffice = function(id, values) {
                return ApiRequest.post('/offices/' + id, values);
            };

            this.create = function(values) {
                return ApiRequest.post('/offices', values);
            };

            this.update = function(id, values) {
                values._method = "PUT";

                return ApiRequest.post('/offices/' + id, values);
            };

            this.updatePhoto = function(id, image) {
                var formData = new FormData();

                formData.append('image', image);
                formData.append('_method', 'PUT');

                return ApiRequest.post('/offices/' + id + '/image', formData, {
                    'Content-Type': undefined
                });
            };
        });
    }
]);
shopkeeperApp.service('ShopKeeperService', [
    '$http',
    '$q',
    'ApiRequest',
    function(
        $http,
        $q,
        ApiRequest
    ) {
        return {
            getShopKeeper: function() {
                return ApiRequest.get('/categories');
            },
            getShopKeeperCategories: function(id) {
                return ApiRequest.get('/shop-keepers/' + id + '/categories');
            },
            update: function(id, values) {
                values._method = "PUT";

                return ApiRequest.post('/shop-keepers/' + id, values);
            },
            updatePhoto: function(id, image) {
                var formData = new FormData();

                formData.append('image', image);
                formData.append('_method', 'PUT');

                return ApiRequest.post('/shop-keepers/' + id + '/image', formData, {
                    'Content-Type': undefined
                });
            }
        };
    }
]);
shopkeeperApp.service('TransactionService', [
    '$http',
    'ApiRequest',
    function(
        $http,
        ApiRequest
    ) {
        return new(function() {
            this.getTransactions = function() {
                return ApiRequest.get('/transactions');
            };

            this.countTransactions = function() {
                return ApiRequest.get('/transactions/count');
            };
        });
    }
]);
shopkeeperApp.service('VoucherService', [
    '$http',
    'DeviceIdService',
    'ApiRequest',
    function(
        $http,
        DeviceIdService,
        ApiRequest
    ) {
        return new(function() {
            this.checkCode = function(code) {
                return ApiRequest.get('/vouchers/' + code);
            };

            this.makeTransaction = function(code, values) {
                var values = JSON.parse(JSON.stringify(values));

                values._method = 'PUT';
                
                return ApiRequest.post('/vouchers/' + code, values);
            };
        });
    }
]);
shopkeeperApp.filter('pretty_json', function() {
    return function(_in) {
        return JSON.stringify(_in, null, '    ');
    }
});

shopkeeperApp.filter('pretty_date', function() {
    return function(_in, format) {
        return moment(_in).format(format || 'LLL');
    }
});

shopkeeperApp.filter('number_format', function() {
    return function(number, decimals, decPoint, thousandsSep) {
        number = (number + '').replace(/[^0-9+\-Ee.]/g, '')
        var n = !isFinite(+number) ? 0 : +number
        var prec = !isFinite(+decimals) ? 0 : Math.abs(decimals)
        var sep = (typeof thousandsSep === 'undefined') ? ',' : thousandsSep
        var dec = (typeof decPoint === 'undefined') ? '.' : decPoint
        var s = ''
        var toFixedFix = function(n, prec) {
                var k = Math.pow(10, prec)
                return '' + (Math.round(n * k) / k)
                    .toFixed(prec)
            }
            // @todo: for IE parseFloat(0.55).toFixed(0) = 0;
        s = (prec ? toFixedFix(n, prec) : '' + Math.round(n)).split('.')
        if (s[0].length > 3) {
            s[0] = s[0].replace(/\B(?=(?:\d{3})+(?!\d))/g, sep)
        }
        if ((s[1] || '').length < prec) {
            s[1] = s[1] || ''
            s[1] += new Array(prec - s[1].length + 1).join('0')
        }
        
        return s.join(dec)
    }
});

shopkeeperApp.filter('to_fixed', function() {
    return function(_in, size) {
        return parseFloat(_in).toFixed(size);
    }
});

shopkeeperApp.filter('uc_first', function() {
    return function(_in) {
        return _in[0].toUpperCase() + _in.slice(1);
    }
});

shopkeeperApp.filter('not_in', function() {
    return function(_in, _not_in) {
        var out = {};

        for (var prop in _in) {
            if (_not_in.indexOf(parseInt(prop)) == -1) {
                out[prop] = _in[prop];
            }
        }

        return out;
    }
});