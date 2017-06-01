var app = angular.module('Mirror', ['ngConstellation']);
app.controller('MyController', ['$scope',  'constellationConsumer', function ($scope, constellation) {
    constellation.initializeClient("http://iberos.freeboxos.fr:80", "07acf484a0eb15fda2330d1bc73d9391ca2c4f1e", "MyConstellation");

    constellation.onConnectionStateChanged((change) => {
        if (change.newState === $.signalR.connectionState.connected) {
            console.log("Je suis connecté !");

            constellation.registerStateObjectLink("*", "ForecastIO", "Lille", "*", (so) => {
                $scope.$apply(() => {
                    $scope.weather = so.Value.currently.icon;
                    $scope.temperature = String(so.Value.currently.temperature).split(".")[0];

                    for (var i = 0; i < 12; i++) {
                        if (so.Value.hourly.data[i].icon != $scope.weather) {
                            $scope.predictionWeather = so.Value.hourly.data[i].icon;
                            $scope.predictionTime = i;
                            break;
                        }
                    }
                });
            });

            constellation.registerStateObjectLink("*", "MyDay", "Time", "*", (so) => {
                $scope.$apply(() => {
                    $scope.time = so.Value;
                });
            });

            constellation.registerStateObjectLink("*", "MyDay", "Date", "*", (so) => {
                $scope.$apply(() => {
                    $scope.date = so.Value;
                });
            });

            constellation.registerStateObjectLink("*", "DayInfo", "NameDay", "*", (so) => {
                $scope.$apply(() => {
                    $scope.nameDay = so.Value;
                });
            });

            constellation.registerStateObjectLink("*", "DayInfo", "SunInfo", "*", (so) => {
                $scope.$apply(() => {
                    $scope.sunrise = so.Value.Sunrise.substring(0, 5);
                    $scope.sunset = so.Value.Sunset.substring(0, 5);
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
    i = i+0.02;
    if(i<=1) {
      setTimeout(f,30);
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
    i = i-0.02;
    if(i>=0) {
      setTimeout(f,30);
    }
  };
  f();
}
