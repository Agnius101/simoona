(function () {
    'use strict';

    angular
        .module('simoonaApp.Lotteries')
        .factory('lotteryFactory', lotteryFactory);

    lotteryFactory.$inject = [
        '$resource',
        '$http',
        'endPoint'
    ];

    function lotteryFactory($resource, $http, endPoint) {
        var url = endPoint + '/Lottery/';

        var service = {
            getAllLotteries: getAllLotteries
        };
        return service;

        /////

        function getAllLotteries() {
            return $resource(url + 'All').query().$promise;
        }
    }
})();
