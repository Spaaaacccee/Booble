  function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
  var currentTopic = "Google";
  var nextTopicData;
  ready = new(function() {
    var _ready = true;
    var cache;
    this.setTrue = function() {
      _ready = true;
      if (cache != undefined) {
        cache();
        console.log("executing cache")
        cache = undefined;
      }
    };
    this.setFalse = function() {
      _ready = false
    };
    this.isReady = function() {
      return _ready
    };
    this.setCache = function(obj) {
      cache = obj;
    }
  })();

  var spinner = new(function() {
    var spin = $("#spinner");
    this.setNotReady = function() {
      spin.addClass("active");
    }
    this.setReady = function() {
      spin.removeClass("active")
    }
    this.isReady = function() {
      if (spin.hasClass("active")) {
        return false
      } else {
        return true
      }
    }
  })();

  function request(operation, data) {
    this.operation = operation;
    this.timeStamp = Date.now();
    this.data = data;
  }

  function init(callback) {
    recover()
    draw()
  };

  function next(callback) {
    if (ready.isReady()) {
      ready.setFalse();
      nextTopicData.then(function(e) {
        draw(e)
        if (getRandomInt(1, 4) == 4) {
          recover();
        } else {
          nextTopic(function() {
            ready.setTrue()
          })
        }
      })
    } else {
      console.log("not ready but will try again when ready")
      ready.setCache(function() {
        next(callback)
      });
    }
  }

  function draw(arr, callback) {
    spinner.setReady();

    function onButtonPress(s) {
      ["#b1", "#b2"]
      $.each(a, function(i, obj) {
        $(obj).off();
      })
      setTimeout(function() {
        next();
        spinner.setNotReady();
      }, 2000)
    }

    function onCorrect(s) {
      onButtonPress(s)
      s.addClass("correct");
    }

    function onIncorrect(s) {
      onButtonPress(s)
      s.addClass("incorrect");
    }
    try {
      var rand = getRandomInt(1, arr[0].default.geoMapData.length - 1)
      var a = ["#b1", "#b2"]
      $.each(a, function(i, obj) {
        $(obj).removeClass("correct incorrect");
      })
      if (getRandomInt(0, 1)) {
        a.reverse();
      }
      $(a[0]).text(arr[0].default.geoMapData[0].geoName).click(function() {
        onCorrect($(this))
      })
      $(a[1]).text(arr[0].default.geoMapData[rand].geoName).click(function() {
        onIncorrect($(this))
      })
      $("#keyword")[0].innerText = currentTopic;
    } catch (e) {
      recover()
      return;
    }
  }

  function xHR(data, callback) {
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
      if (this.readyState == 4 && this.status == 200) {
        callback(JSON.parse(xhttp.responseText))
      }
    };
    xhttp.open("POST", "/fetch", true);
    data = data == undefined ? "" : JSON.stringify(data);
    xhttp.setRequestHeader("Content-Type", "application/json");
    xhttp.send(data);
    console.log(data);
  }

  function fetchData(operation, data, callback) {
    xHR(new request(operation, data), function(e) {
      callback(e);
    });
  }

  function apiCommand(operation, topic, callback) {
    return new Promise(function(res, rej) {
      fetchData(operation, {
        topic: topic || currentTopic
      }, function(e) {
        if (callback) callback(e);
        return res(e)
      })
    })
  }

  function trendingTopics(topic, callback) {
    return apiCommand("trending", topic, callback)
  }

  function interestByRegion(topic, callback) {
    return apiCommand("interestByRegion", topic, callback)
  }

  function randomWord(callback) {
    return apiCommand("randomWord", {}, callback)
  }

  function nextTopic(callback) {
    nextTopicData = new Promise(function(res, rej) {
      try {
        trendingTopics(currentTopic, function(e) {
          var rL = e.default.rankedList[0].rankedKeyword;
          try {
            currentTopic = rL[getRandomInt(3, rL.length - 1)].query;
          } catch (e) {
            recover();
            rej(e);
          }
          fetchOnKeyword(currentTopic).then(function(e) {
            if (typeof callback != "undefined") callback();
            res(e);
          }, function(e) {
            recover();
            rej(e);
            return;
          })
        })
      } catch (e) {
        recover();
        return;
      }
    });
  }

  function recover(callback) {
    console.log("recover!")
    spinner.setNotReady()
    randomWord(function(e) {

      currentTopic = e.word;
      nextTopicData = fetchOnKeyword(currentTopic)
      nextTopicData.then(function(e){nextTopic();ready.setTrue();spinner.setReady()});

    })
  }

  function fetchOnKeyword(keyword, callback) {
    return new Promise(function(res, rej) {
      trendingTopics(currentTopic, function(e) {
        try {
          var rL = e.default.rankedList[0].rankedKeyword;
          var promises = [interestByRegion(currentTopic), interestByRegion(rL[1].query), interestByRegion(rL[2].query)];
          Promise.all(promises).then(function(e) {
            if (typeof callback !== "undefined") callback();
            return res(e)
          })
        } catch (e) {
          recover();
          rej(e);
        }
      })
    })
  }

  init()
