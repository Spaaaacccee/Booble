function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

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

function placeholderObject() {
  this.name = "";
}

function topicObject(n) {
  var self = this;
  this.name = n;
  this.interestByRegion = (function() {
    return new Promise(function(res, rej) {
      apiCommand("interestByRegion", {topic: n}).then(function(e) {
        res(e.default.geoMapData)
      }) //resolves with array
    })
  })()
  this.relatedQueries = (function() {
    return new Promise(function(res, rej) {
      apiCommand("trending", {topic: n}).then(function(e) {
        res(e.default.rankedList)
      }) //resolves with array
    })
  })()
  this.ready = false;
  this.onReady = (function() {
    return new Promise(function(res, rej) {
      Promise.all([self.interestByRegion, self.relatedQueries]).then(function(e) {
        self.ready = true;
        res(self);
      });
    })
  })(); //promise object, returns self;
  this.alreadyDrawing = false;
}

globals = new(function() {
  var self = this;
  this.queueIndex = 0;
  this.onScreenTopic;
  this.queuedTopics = [new topicObject("Babushka")];
})()

function requestObject(operation, additionalData) {
  this.operation = operation;
  this.timeStamp = Date.now;
  this.data = additionalData;
}

function screenGroupObject(topicObj) {
  var self = this;
  this.topicObject = topicObj;
  this.topicName = topicObj.name;
  this.rightAnswer;
  this.wrongAnswer;
  this.hints = [];
  this.ready = false;
  this.onReady = (function() {
    return new Promise(function(res, rej) {
      self.topicObject.onReady.then(function(e) {
        self.ready = true;
        e.interestByRegion.then(function(geoMap) {
          self.rightAnswer = geoMap[0].geoName;
          self.wrongAnswer = geoMap[getRandomInt(1, geoMap.length - 1)].geoName;
        })
        res(self);
      })
    })
  })(); //promise object, returns self;
}

function drawSreenGroupObject(screenGroupObj) {
  return new Promise(function(res, rej) {

    if (screenGroupObj.alreadyDrawing) {
      rej(0)
    }

    screenGroupObj.alreadyDrawing = true;
    screenGroupObj.onReady.then(function(e) {
      var a = ["#b1", "#b2"]
      function onButtonPress(s) {
        ["#b1", "#b2"]
        $.each(a, function(i, obj) {
          $(obj).off();
        })
        setTimeout(function() {
          drawOne();
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
      $.each(a, function(i, obj) {
        $(obj).removeClass("correct incorrect");
      })
      if (getRandomInt(0, 1)) {
        a.reverse();
      }
      $(a[0]).text(e.rightAnswer).click(function() {
        onCorrect($(this))
      })
      $(a[1]).text(e.wrongAnswer).click(function() {
        onIncorrect($(this))
      })
      $("h1").removeClass("fadeInUp")
      $("h1").addClass("fadeOutUp")
      setTimeout(function() {
        $("h1").addClass("fadeInUp")
        $("#keyword").text(e.topicName);
        $("h1").removeClass("fadeOutUp")
      }, 200)
      res(0);
      alreadyDrawing = false;
    })
  })
}

function sendRequest(requestObject) {
  return new Promise(function(res, rej) {
    var xHR = new XMLHttpRequest();
    xHR.onreadystatechange = function() {
      if (this.readyState == 4 && this.status == 200) {
        res(JSON.parse(xHR.responseText))
      }
    }
    xHR.open("POST", "/fetch", true);
    xHR.setRequestHeader("Content-Type", "application/json");
    xHR.send(JSON.stringify(requestObject));
    console.log(requestObject);
  })
}

function apiCommand(operation, additionalData) {
  return new Promise(function(res, rej) {
    sendRequest(new requestObject(operation, additionalData)).then(res);
  })
}

function loadOne() {
  return new Promise(function(res, rej) {
    globals.queuedTopics[globals.queuedTopics.length - 1].onReady.then(function(e) {
      globals.queuedTopics[globals.queuedTopics.length - 1].relatedQueries.then(function(topicList) {
        var topicObj = new topicObject(topicList[0].rankedKeyword[getRandomInt(topicList[0].rankedKeyword.length - 1, 0)].topic.title);
        globals.queuedTopics[globals.queuedTopics.length] = topicObj;
        topicObj.onReady.then(res(0))
      })
    })
  })
}

function drawOne() {
  spinner.setNotReady();
  drawSreenGroupObject(new screenGroupObject(globals.queuedTopics[globals.queueIndex])).then(function(e) {
    globals.queueIndex++
    spinner.setReady()
  });
}

var loadCycle = new(function() {
  var self = this;
  this.started = false;
  this.start = function() {
    self.started = true;
    load();
  }
  this.stop = function() {
    self.started = false;
  }
  function load() {
    if (self.started) {
      loadOne().then(load)
    }
  }

})();

function initialise() {
  loadCycle.start();
  drawOne();
}

initialise();
