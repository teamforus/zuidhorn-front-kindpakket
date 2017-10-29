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

                var wasActive = $(this).hasClass('active');

                $panes.removeClass('active');
                $tabs.removeClass('active');

                var activeIndex = $(this).attr('tabulation-tab');

                if (!wasActive) {
                    $root.find(
                        '[tabulation-pane="' + activeIndex + '"]').addClass('active');
                    $(this).addClass('active');
                }

            });

            $tabs[0].click();
        };

        for (var i = 0; i < this.length; i++) {
            new tabulation($(this[i]));
        }
    };
})(jQuery);
var kindpakketApp = angular.module('kindpakketApp', ['ui.router']);

kindpakketApp.config(['ApiRequestProvider', function(ApiRequestProvider) {
    ApiRequestProvider.setHost(env_data.apiUrl);
}]);

kindpakketApp.config(['$stateProvider', '$locationProvider', function($stateProvider, $locationProvider) {
    if (env_data.html5Mode.enable)
        $locationProvider.html5Mode(true);

    $stateProvider
        .state({
            url: '/',
            name: 'landing',
            component: 'landingComponent',
            data: {
                title: "Home"
            }
        });

    // Profile
    $stateProvider
        .state({
            url: '/account',
            name: 'account',
            component: 'accountViewComponent',
            data: {
                title: "Account"
            }
        });
}]);

if (!env_data.html5Mode.enable)
    if (!document.location.hash)
        document.location.hash = '#!/';
kindpakketApp.controller('BaseController', [
    '$scope',
    '$state',
    '$rootScope',
    'AuthService',
    'CategoryService',
    'FormBuilderService',
    'CredentialsService',
    function(
        $scope,
        $state,
        $rootScope,
        AuthService,
        CategoryService,
        FormBuilderService,
        CredentialsService
    ) {
        $rootScope.$state = $scope.$state = $state;

        $scope.locations = [];
        $scope.forms = {};
        $scope.forms.login = FormBuilderService.build();
        $scope.forms.voucher = FormBuilderService.build();

        $rootScope.credentials = CredentialsService.get();

        $rootScope.auth = {};

        $rootScope.auth.signOut = function(e) {
            e && e.stopPropagation() & e.preventDefault();

            AuthService.signOut();

            $rootScope.credentials = CredentialsService.get();
        };

        $rootScope.auth.signIn = function(e) {
            e && e.stopPropagation() & e.preventDefault();

            $scope.forms.login.reset();

            $('body').addClass('popup-open');
            $('.popups .popup').hide();
            $('.popups .popup-auth').show();
        };

        $rootScope.auth.signInSubmit = function(e, form) {
            e && e.stopPropagation() & e.preventDefault();

            if (form.submit)
                return;

            form.submit = true;

            AuthService.signIn(form.values).then(function(response) {
                CredentialsService.set(response.data);
                $rootScope.credentials = CredentialsService.get();
                $rootScope.targetVoucher = AuthService.getVoucher();
                $rootScope.auth.closeModals();
                form.submit = false;

                if ($rootScope.credentials) {
                    AuthService.getVoucher().then(function(response) {
                        $rootScope.targetVoucher = response.data;
                    });
                }
            }, function(response) {
                form.errors.email = ["Wrong E-mail or password!"];
                form.submit = false;
            });
        };

        $rootScope.auth.activateVoucher = function(e) {
            e && e.stopPropagation() & e.preventDefault();

            $scope.forms.voucher.reset();

            $('body').addClass('popup-open');
            $('.popup-voucher').show();
        };

        $rootScope.auth.activateVoucherSuccess = function(e) {
            e && e.stopPropagation() & e.preventDefault();

            $scope.forms.voucher.reset();

            $('body').addClass('popup-open');
            $('.popups .popup').hide();
            $('.popups .popup-voucher-success').show();
        };

        $rootScope.auth.activateVoucherSubmit = function(e, form) {
            e && e.stopPropagation() & e.preventDefault();

            if (form.submit)
                return;

            form.submit = true;

            AuthService.activateVoucher(
                form.values.code || 'empty',
                form.values
            ).then(function(response) {
                $rootScope.auth.activateVoucherSuccess();
                form.submit = false;
            }, function(response) {
                form.errors = response.data;
                form.submit = false;
            });
        };

        $rootScope.auth.closeModals = function(e) {
            e && e.stopPropagation() & e.preventDefault();

            $('body').removeClass('popup-open');
            $('.popup').hide();
        };

        var fetchVoucher = function() {
            AuthService.getVoucher().then(function(response) {
                $rootScope.targetVoucher = response.data;
            });
        }

        $scope.$on('voucher:fetch', fetchVoucher);
    }
]);
kindpakketApp.component('accountViewComponent', {
    templateUrl: './tpl/pages/account-view.html',
    controller: [
        '$rootScope',
        '$state',
        'AuthService',
        'CredentialsService',
        function(
            $rootScope,
            $state,
            AuthService,
            CredentialsService
        ) {
            var ctrl = this;

            if (!$rootScope.credentials)
                return $state.go('landing');

            ctrl.loadQrCode = function(e) {
                e && e.stopPropagation() & e.preventDefault();

                AuthService.getQrCode().then(function(response) {
                    ctrl.qrCode = response.data;
                });
            };

            ctrl.printQrCode = function(e) {
                e && e.stopPropagation() & e.preventDefault();

                var PrintElem = function PrintElem(html)
                {
                    var mywindow = window.open('', 'PRINT', 'directories=0,titlebar=0,toolbar=0,location=0,status=0,menubar=0,scrollbars=no,resizable=no,height=700,width=1200');

                    mywindow.document.write(
                        '<html><head></head><body>' + html + '</body></html>');

                    mywindow.document.close(); // necessary for IE >= 10
                    mywindow.focus(); // necessary for IE >= 10*/

                    mywindow.print();
                    mywindow.close();

                    return true;
                }

                if (ctrl.qrCode)
                    PrintElem('<img src="' + ctrl.qrCode + '" style="width: 50%; maring-left: 25%; display: block;">');
            };

            ctrl.emailQrCodeSentSuccess = function(e) {
                e && e.stopPropagation() & e.preventDefault();

                $('body').addClass('popup-open');
                $('.popups .popup').hide();
                $('.popups .popup-qr-code-email-success').show();
            };

            ctrl.sendQrCodeEmail = function(e) {
                e && e.stopPropagation() & e.preventDefault();

                if (ctrl.sendingQrCode)
                    return;

                ctrl.sendingQrCode = true;

                AuthService.sendQrCodeEmail().then(function(response) {
                    ctrl.emailQrCodeSentSuccess();
                    ctrl.sendingQrCode = false;
                }, function() {
                    ctrl.sendingQrCode = false;
                });
            };
        
            if ($rootScope.credentials) {
                AuthService.getTransactions().then(function(response) {
                    ctrl.transactions = response.data;
                });

                ctrl.loadQrCode();

                $rootScope.$broadcast('voucher:fetch');
            }
        }
    ]
});
kindpakketApp.component('landingComponent', {
    templateUrl: './tpl/pages/landing.html',
    controller: [
        '$rootScope',
        '$scope',
        '$state',
        'CategoryService',
        'CredentialsService',
        function(
            $rootScope,
            $scope,
            $state,
            CategoryService,
            CredentialsService
        ) {
            var ctrl = this;

            $('[tabulation]').tabulation();
            $('[slow-scroll]').slowScroll();
            $(".nano").nanoScroller();

            ctrl.categories = [];

            ctrl.selectAll = function(e) {
                e && e.stopPropagation() & e.preventDefault();

                ctrl.categories.forEach(function(el) {
                    el.selected = true;
                });
            };

            ctrl.deselectAll = function(e, category) {
                e && e.stopPropagation() & e.preventDefault();

                ctrl.categories.forEach(function(el) {
                    el.selected = false;
                });
            };

            ctrl.selectCategory = function(e, category) {
                e && e.stopPropagation() & e.preventDefault();

                category.selected = !category.selected;
            };

            ctrl.updateOfficesCategory = function(e) {
                e && e.stopPropagation() & e.preventDefault();

                var locations = {};

                var categories = ctrl.categories.filter(function(category) {
                    return category.selected;
                });
                
                if (categories.length == 0)
                    categories = ctrl.categories;

                categories.forEach(function(category) {
                    category.shopkeepers.forEach(function(shopkeeper) {
                        shopkeeper.offices.forEach(function(office) {
                            if (locations[office.id])
                                return;

                            locations[office.id] = JSON.parse(JSON.stringify(office));
                            locations[office.id].shopkeeper = JSON.parse(JSON.stringify(shopkeeper));
                            locations[office.id].category = JSON.parse(JSON.stringify(category));
                        });
                    });
                });

                ctrl.locations = Object.values(locations);

                ctrl.locations.forEach(function(location) {
                    location.selected = false;
                });

                if ($scope.updatePoints)
                    $scope.updatePoints(ctrl.locations);
            };

            ctrl.selectLocation = function(e, location) {
                e && e.stopPropagation() & e.preventDefault();

                var selected = location.selected;

                ctrl.locations.forEach(function(location) {
                    location.selected = false;
                });

                location.selected = !selected;

                if (location.selected) {
                    if ($scope.updatePoints)
                        $scope.updatePoints([location]);
                } else {
                    ctrl.updateOfficesCategory();
                }
            };

            CategoryService.getCategories().then(function(response) {
                ctrl.categories = response.data;
                ctrl.deselectAll();
                ctrl.updateOfficesCategory();
            }, console.log);

            if ($rootScope.credentials) {
                $rootScope.$broadcast('voucher:fetch');
            }
        }
    ]
});
kindpakketApp.directive('contactForm', [
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
                    name: 'Anders'
                }, {
                    key: 'budget',
                    name: 'Budget'
                }, {
                    key: 'recht_op_kindpakket',
                    name: 'Recht op Kindpakket'
                }, {
                    key: 'tehnical_issuse',
                    name: 'Technisch'
                }, {
                    key: 'logging_in',
                    name: 'Logging in'
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
kindpakketApp.directive('googleMap', [
    'GoogleMapService',
    function(
        GoogleMapService
    ) {
        return {
            restrict: 'A',
            templateUrl: './tpl/directives/google-map.html',
            replace: true,
            transclude: true,
            link: function($scope, iElm, iAttrs, controller) {
                $scope.style = [];
                // locations = [];
                $scope.markers = [];

                var initialize = function(obj, locations) {
                    locations = locations || [];

                    var office = locations.length ? locations[0] : false;
                    var $element = $(iElm).find('.map-canvas');
                    var contentString = $element.attr("data-string");
                    var map, marker, infowindow;
                    var image = $element.attr("data-marker");
                    var zoomLevel = parseInt($element.attr("data-zoom"), 8);
                    var styledMap = new google.maps.StyledMapType($scope.style, {
                        name: "Styled Map"
                    });

                    var mapOptions = {
                        zoom: zoomLevel,
                        disableDefaultUI: false,
                        center: office ? new google.maps.LatLng(office.lat, office.lon) : new google.maps.LatLng(-33.92, 151.25),
                        scrollwheel: true,
                        fullscreenControl: false,
                        mapTypeControlOptions: {
                            mapTypeIds: [google.maps.MapTypeId.ROADMAP, 'map_style']
                        }
                    }

                    map = new google.maps.Map(document.getElementById(obj), mapOptions);

                    map.mapTypes.set('map_style', styledMap);
                    map.setMapTypeId('map_style');

                    infowindow = new google.maps.InfoWindow();

                    locations.forEach(function(office) {
                        marker = new google.maps.Marker({
                            position: new google.maps.LatLng(office.lat, office.lon),
                            map: map,
                            icon: image
                        });

                        $scope.markers.push(marker);

                        google.maps.event.addListener(marker, 'click', (function(marker, office) {
                            var description = [
                                'Address: ' + office.address,
                                'Telephone: ' + office.shopkeeper.phone,
                                'Categories: ' + office.shopkeeper.categories,
                            ];

                            return function() {
                                infowindow.setContent(
                                    '<div class="map-card">\
                                    <img class="map-card-img" src="' + (office.preview || 'assets/img/no-image.jpg') + '" alt=""/>\
                                    <div class="map-card-title">' + office.shopkeeper.name + '</div>\
                                    <div class="map-card-description">' + description.join('<br />') + '</div>\
                                    <div class="map-card-actions">\
                                    <!--<a class="button button-success" href="#">Apply</a>-->\
                                    </div>\
                                    </div>');
                                infowindow.open(map, marker);
                            }
                        })(marker, office));
                    });
                }

                $scope.updatePoints = function(locations) {
                    initialize('map-canvas-contact', locations);
                };

                GoogleMapService.getStyle().then(function(style) {
                    $scope.style = style.style;
                    initialize('map-canvas-contact');
                });
            }
        };
    }
]);
kindpakketApp.provider('ApiRequest', function() {
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
                            if (CredentialsService.get() && response.status == 401) {
                                CredentialsService.set(null);
                                document.location.reload();
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
kindpakketApp.service('AuthService', [
    'ApiRequest',
    'CredentialsService',
    function(
        ApiRequest,
        CredentialsService
    ) {
        return new(function() {
            apiRequest = ApiRequest;

            this.signIn = function(values) {
                return ApiRequest.post('/../oauth/token', {
                    'grant_type': 'password',
                    'client_id': 2,
                    'client_secret': 'DKbwNT3Afz8bovp0BXvJX5jWudIRRW9VZPbzieVJ',
                    'username': values.email || '',
                    'password': values.password || '',
                    'scope': '*',
                });
            };

            this.activateVoucher = function(voucher, values) {
                return ApiRequest.post('/voucher/' + voucher + '/activate', values || {
                    here: 'here'
                });
            };

            this.signOut = function(values) {
                CredentialsService.set(null);
            };

            this.getUser = function() {
                return ApiRequest.get('/user');
            };

            this.getVoucher = function() {
                return ApiRequest.get('/user/voucher');
            };

            this.getQrCode = function() {
                return ApiRequest.get('/user/voucher/qr-code');
            };

            this.sendQrCodeEmail = function() {
                return ApiRequest.post('/user/voucher/email');
            };

            this.getTransactions = function() {
                return ApiRequest.get('/user/voucher/transactions');
            };
        });
    }
]);
kindpakketApp.service('CategoryService', ['$http', 'ApiRequest', function($http, ApiRequest) {
    var getCategories = function() {
        return ApiRequest.get('/categories');
    };

    return {
        getCategories: getCategories
    };
}]);
kindpakketApp.service('ContactFormService', [
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
                return ApiRequest.post('/contact-form', values);
            };
        });
    }
]);
kindpakketApp.service('CredentialsService', [function() {
    return new(function() {
        this.set = function(credentails) {
            return localStorage.setItem(env_data.credentials_key, JSON.stringify(credentails));
        };

        this.get = function() {
            return JSON.parse(localStorage.getItem(env_data.credentials_key));
        };
    });
}]);
kindpakketApp.service('DeviceIdService', ['$http', '$q', function($http, $q) {
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
kindpakketApp.service('FormBuilderService', ['$http', function($http) {
    return new(function() {
        this.build = function() {
            return {
                values: {},
                errors: {},
                resetValues: function() {
                    return this.values = {};
                },
                resetErrors: function() {
                    return this.errors = {};
                },
                reset: function() {
                    return this.resetValues() & this.resetErrors();
                },
            };
        };
    });
}]);
kindpakketApp.service('GoogleMapService', ['$http', '$q', function($http, $q) {
    var style = {
        'style': [{
            "featureType": "water",
            "elementType": "geometry",
            "stylers": [{
                "color": "#e9e9e9"
            }, {
                "lightness": 17
            }]
        }, {
            "featureType": "landscape",
            "elementType": "geometry",
            "stylers": [{
                "color": "#f5f5f5"
            }, {
                "lightness": 20
            }]
        }, {
            "featureType": "road.highway",
            "elementType": "geometry.fill",
            "stylers": [{
                "color": "#ffffff"
            }, {
                "lightness": 17
            }]
        }, {
            "featureType": "road.highway",
            "elementType": "geometry.stroke",
            "stylers": [{
                "color": "#ffffff"
            }, {
                "lightness": 29
            }, {
                "weight": 0.2
            }]
        }, {
            "featureType": "road.arterial",
            "elementType": "geometry",
            "stylers": [{
                "color": "#ffffff"
            }, {
                "lightness": 18
            }]
        }, {
            "featureType": "road.local",
            "elementType": "geometry",
            "stylers": [{
                "color": "#ffffff"
            }, {
                "lightness": 16
            }]
        }, {
            "featureType": "poi",
            "elementType": "geometry",
            "stylers": [{
                "color": "#f5f5f5"
            }, {
                "lightness": 21
            }]
        }, {
            "featureType": "poi.park",
            "elementType": "geometry",
            "stylers": [{
                "color": "#dedede"
            }, {
                "lightness": 21
            }]
        }, {
            "elementType": "labels.text.stroke",
            "stylers": [{
                "visibility": "on"
            }, {
                "color": "#ffffff"
            }, {
                "lightness": 16
            }]
        }, {
            "elementType": "labels.text.fill",
            "stylers": [{
                "saturation": 36
            }, {
                "color": "#333333"
            }, {
                "lightness": 40
            }]
        }, {
            "elementType": "labels.icon",
            "stylers": [{
                "visibility": "off"
            }]
        }, {
            "featureType": "transit",
            "elementType": "geometry",
            "stylers": [{
                "color": "#f2f2f2"
            }, {
                "lightness": 19
            }]
        }, {
            "featureType": "administrative",
            "elementType": "geometry.fill",
            "stylers": [{
                "color": "#fefefe"
            }, {
                "lightness": 20
            }]
        }, {
            "featureType": "administrative",
            "elementType": "geometry.stroke",
            "stylers": [{
                "color": "#fefefe"
            }, {
                "lightness": 17
            }, {
                "weight": 1.2
            }]
        }]
    };

    var getStyle = function() {
        return $q(function(resolve, reject) {
            resolve(style);
        });
    };

    return {
        getStyle: getStyle
    };
}]);
kindpakketApp.filter('pretty_json', function() {
    return function(_in) {
        return JSON.stringify(_in, null, '    ');
    }
});

kindpakketApp.filter('to_fixed', function() {
    return function(_in, size) {
        return parseFloat(_in).toFixed(size);
    }
});