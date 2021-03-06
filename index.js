var app = angular.module('Mirror', ['ngConstellation']);
var sizeU = 7.5 / 60; // 1h = 7.5% for a calendar of 12 h
var topU = 8.33 / 60; // 1h difference between events = 8.33%

// Controller AngularJS of the mirror appliacation
app.controller('MyController', ['$scope',  'constellationConsumer', ($scope, constellation) => {
    constellation.initializeClient('http://iberos.freeboxos.fr:80', '07acf484a0eb15fda2330d1bc73d9391ca2c4f1e', 'MyConstellation');

    $scope.predictionWeather = null;

    // Connect to the constellation
    constellation.onConnectionStateChanged((change) => {
        if (change.newState === $.signalR.connectionState.connected) {
            console.log('Je suis connecté !');

            // Get the meteorological events of the day from the ForecastIO package
            constellation.registerStateObjectLink('*', 'ForecastIO', 'Lille', '*', (so) => {
                $scope.$apply(() => {
                    $scope.weather = so.Value.currently.icon;
                    $scope.temperature = String(so.Value.currently.temperature).split('.')[0];

                    for (var i = 0; i < 12; i++) {
                        if (so.Value.hourly.data[i].icon != $scope.weather) {
                            $scope.predictionWeather = so.Value.hourly.data[i].icon;
                            $scope.predictionTime = i;
                            break;
                        }
                    }
                });
            });

            // Get informations of the day from the DayInfo package
            constellation.registerStateObjectLink('*', 'DayInfo', 'Time', '*', (so) => {
                $scope.$apply(() => {
                    $scope.time = so.Value;
                });
            });

            constellation.registerStateObjectLink('*', 'DayInfo', 'Date', '*', (so) => {
                $scope.$apply(() => {
                    $scope.date = so.Value;
                });
            });

            constellation.registerStateObjectLink('*', 'DayInfo', 'NameDay', '*', (so) => {
                $scope.$apply(() => {
                    $scope.nameDay = so.Value;
                });
            });

            constellation.registerStateObjectLink('*', 'DayInfo', 'SunInfo', '*', (so) => {
                $scope.$apply(() => {
                    $scope.sunrise = so.Value.Sunrise.substring(0, 5);
                    $scope.sunset = so.Value.Sunset.substring(0, 5);
                });
            });

            // Get the step counter of the person in front of the mirror
            $scope.subscribeSteps = (user) => {
                constellation.registerStateObjectLink('*', 'SfitDataManager', 'TodaySteps' + user, '*', (so) => {
                    if (so.Name.split('TodaySteps')[1] == $scope.username) {
                        $scope.$apply(() => {
                            var tmp = JSON.parse(so.Value);
                            $scope.step = tmp.step;
                            $scope.goal = tmp.goal;
                            $scope.percent = $scope.step / $scope.goal;

                            // Make the circle complete automatically or transform into a star if the goal is reached
                            if($scope.percent < 1){
                              if($scope.bar !== undefined){
                                $scope.bar.destroy();
                              }
                              if($scope.bar === undefined){
                                $scope.bar = {};
                              }
                              $scope.bar = new ProgressBar.Circle(container, {
                                strokeWidth: 6,
                                duration: -1,
                                color: '#FFFFFF',
                                trailColor: '#eee',
                                trailWidth: 1,
                                svgStyle: null
                              });
                              $scope.bar.animate($scope.percent);
                              document.getElementById('container').style.visibility = 'visible';
                              document.getElementById('goal').style.visibility = 'hidden';
                              document.getElementById('reached').style.visibility = 'hidden';
                            } else {
                              document.getElementById('container').style.visibility = 'hidden';
                              document.getElementById('goal').style.visibility = 'visible';
                              document.getElementById('reached').style.visibility = 'visible';
                            }
                        });
                    }
                });
            }

            // Get the events of the next 12 hours from the Google Calendar of the person in front of the mirror
            $scope.subscribeCalendar = (user) => {
                constellation.registerStateObjectLink('*', '*', 'TodayEvents' + user, '*', (so) => {
                    if (so.Name.split('TodayEvents')[1] === $scope.username) {
                        $scope.$apply(() => {
                            document.getElementById('calendar').innerHTML = '';
                                if (so.Value) {
                                    so.Value.forEach((event) => {
                                        document.getElementById('calendar').style.borderTop = '2px dashed silver';
                                        let tmp = JSON.parse(event);
                                        let startDate = new Date(tmp.start.dateTime.split('+')[0]);
                                        let endDate = new Date(tmp.end.dateTime.split('+')[0]);
                                        let actualTime = new Date();
                                        let dif = Math.round((startDate.getTime()-actualTime.getTime())/60000);
                                        let difEnd = Math.round((endDate.getTime()-actualTime.getTime())/60000);
                                        let fromTop = dif * topU;
                                        let last = (endDate.getTime()-startDate.getTime())/60000;
                                        let size = last * sizeU;
                                        if(difEnd >= 0) {
                                            document.getElementById('calendar').innerHTML += '<div class="event" id="event'+tmp.id+'"><span class="textevent"><span class="content">'+tmp.summary+'</span><br /><span class="horaires">'+startDate.toLocaleTimeString().substring(0, 5)+' - '+endDate.toLocaleTimeString().substring(0, 5)+' / '+tmp.location+'</span></span></div>';
                                            document.getElementById('event'+tmp.id).style.height = size+'%';
                                            document.getElementById('event'+tmp.id).style.top = fromTop+'%';
                                            if (dif <= 0) {
                                                document.getElementById('event'+tmp.id).style.opacity = 0.65;
                                            }
                                        }
                                    });
                              }
                              else {
                                  document.getElementById('calendar').style.border = 'none';
                                  document.getElementById('calendar').innerHTML += '<div class="noEvent" id="noEvent"><span>Rien de prévu,<br /> profitez bien !</span></div>';
                              }
                        });
                    }
                    else {
                        document.getElementById('calendar').innerHTML = '';
                    }
                });
            }

            // Say Hello to the person who is recognized by the mirror
            constellation.registerStateObjectLink('*', 'ConstellationSocketConnector', 'DetectedUser', '*', (so) => {
                $scope.$apply(() => {
                    $scope.username = so.Value;

                    if (so.Value !== '' && $scope.code === false) {
                        $scope.hello = 'Bonjour ' + so.Value.split('_')[0];
                        sayHello();

                        $scope.subscribeSteps($scope.username);
                        $scope.subscribeCalendar($scope.username);
                    }
                });
            });

            // Show passcode when someone is trying to sign up for a new S-Fit account
            constellation.registerStateObjectLink('*', 'SfitDataManager', 'MirorPasscode', '*', (so) => {
                $scope.$apply(() => {
                    if (so.Value !== '') {
                        $scope.hello = so.Value;
                        appear('bonjou', () => {
                            $scope.code = true;
                        });
                    }
                    else {
                        disappear('bonjou');
                        $scope.code = false;
                    }
                });
            });
        }
    });

    constellation.connect();
}]);

function appear(idDiv, callback) {
  var div = document.getElementById(idDiv).style;
  var i = 0;
  var f = function() {
    div.opacity = i;
    i = i + 0.02;
    if(i <= 1) {
      setTimeout(f, 30);
    }
    else {
      callback();
    }
  };
  f();
}

function disappear(idDiv) {
  var div = document.getElementById(idDiv).style;
  var i = 1;
  var f = function() {
    div.opacity = i;
    i = i - 0.02;
    if(i >= 0) {
      setTimeout(f, 30);
    }
  };
  f();
  div.opacity = 0;
}

// When someone is recognized, say Hello with appearance and disappearance
function sayHello() {
    appear('bonjou', () => {
      disappear('bonjou');
    });
}
