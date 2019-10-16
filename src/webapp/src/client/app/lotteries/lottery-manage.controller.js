(function() {
    'use strict';

    angular.module('simoonaApp.Lotteries')
        .constant('lotteryStatus', {
            Drafted: 1,
            Started: 2,
            Aborted: 3,
            Ended: 4
        })
        .constant('lotteryImageSettings', {
            height: 165,
            width: 291,
        })
        .controller('lotteryManageController', lotteryManageController);

    lotteryManageController.$inject = ['$scope', '$state', 'lotteryRepository', '$rootScope',
    'notifySrv', '$q', 'localeSrv', 'errorHandler', 'lotteryStatus', 'lottery', 'pictureRepository', 'dataHandler', 'lotteryImageSettings', '$timeout'
    ];

    function lotteryManageController(
        $scope, $state, lotteryRepository, $rootScope, notifySrv, $q, localeSrv, errorHandler,
        lotteryStatus, lottery, pictureRepository, dataHandler, lotteryImageSettings, $timeout) {
        
        var vm = this;
        vm.openDatePicker = openDatePicker;
        vm.startLottery = startLottery;
        vm.createLottery = createLottery;
        vm.updateLottery = updateLottery;
        vm.revokeLottery = revokeLottery;
        vm.finishLottery = finishLottery;

        vm.lotteryImageSize = {
            w: lotteryImageSettings.width,
            h: lotteryImageSettings.height
        };

        vm.datePicker = {
            isOpen: false
        };
        
        vm.states = {
            isCreate: $state.includes('Root.WithOrg.Admin.Lotteries.Create'),
            isEdit: $state.includes('Root.WithOrg.Admin.Lotteries.Edit')
        };

        setTitleScope(vm.states);

        function setTitleScope(states) {
            if (states.isEdit) {
                vm.lottery = lottery;
                vm.lottery.endDate = moment.utc(vm.lottery.endDate).local().startOf('minute').toDate();
                vm.isStarted = vm.lottery.status === lotteryStatus.Started;
                $rootScope.pageTitle = 'lotteries.editLottery';
            } else if (states.isCreate) {
                $rootScope.pageTitle = 'lotteries.createLottery';
            }
        }

        function openDatePicker($event, datePicker) {
            $event.preventDefault();
            $event.stopPropagation();

            vm.datePicker.isOpen = true;
            $timeout(function() {
                $event.target.focus();
            }, 100);
        }

        function startLottery() {
            saveimage()
                .then(result => {
                    vm.lottery.status = lotteryStatus.Started;
                    vm.lottery.images = [result.data];
                    lotteryRepository.create(vm.lottery)
                    .then(function() {
                        notifySrv.success(localeSrv.formatTranslation('lotteries.hasStarted', { one: 'lotteries.entityNameSingular', two: vm.lottery.title }));
                        $state.go('^.List');
                    })
                })

        }

        function createLottery() {
            saveimage()
                .then(result => {
                    vm.lottery.status = lotteryStatus.Drafted;
                    vm.lottery.images = [result.data];
                    lotteryRepository.create(vm.lottery)
                        .then(updateSucess('lotteries.hasStarted'))
                });


        }

        function saveimage() {
            var lotteryImageBlob = dataHandler.dataURItoBlob(vm.lotteryCroppedImage, vm.lotteryImage.type);
            lotteryImageBlob.lastModifiedDate = new Date();
            lotteryImageBlob.name = vm.lotteryImage.name;
            
            return $q(function(resolve, reject) {
                pictureRepository.upload([lotteryImageBlob]).then(function(result) {
                    resolve(result);
                });
            })

        }

        function updateLottery() {
            if (vm.isDrafted) {
                if (vm.lotteryCroppedImage) {
                    saveimage()
                        .then(result => {
                            vm.lottery.images = [result.data];
                            lotteryRepository.updateDrafted(vm.lottery)
                            .then(updateSucess('lotteries.haveBeenSaved'))
                        })
                } else {
                    lotteryRepository.updateDrafted(vm.lottery)
                    .then(updateSucess('lotteries.haveBeenSaved'))
                }
            } else if (vm.isStarted) {
                lotteryRepository.updateStarted({ description: vm.lottery.description, id: vm.lottery.id })
                    .then(updateSucess('lotteries.hasBeenSaved'))
            }
        }

        function revokeLottery(id) {
            lotteryRepository.revokeLottery(id).then(function() {
                notifySrv.success('lotteries.successDelete');
                $state.go('Root.WithOrg.Admin.Lotteries.List');
            }, errorHandler.handleErrorMessage);
        }

        function finishLottery() {
            lotteryRepository.finishLottery(vm.lottery.id)
                .then(function() {
                    notifySrv.success(localeSrv.formatTranslation('lotteries.successFinish', { one: 'lotteries.entityNameSingular', two: vm.lottery.title }));
                    $state.go('Root.WithOrg.Admin.Lotteries.List');
                }, errorHandler.handleErrorMessage);
        }

        function updateSucess(translation) {
            notifySrv.success(localeSrv.formatTranslation(translation, { one: 'lotteries.entityNameSingular', two: vm.lottery.title }));
            $state.go('^.List');
        }
    };
})();
