var app = angular.module("helpcue", ["firebase"]);


app.controller("MainCtrl", function($scope, $firebaseArray, $firebaseAuth, $firebaseObject, $q) {
  window.$scope = $scope;
  var ref = new Firebase("https://amber-heat-6142.firebaseio.com/");

  // create data namespace for misc data
  $scope.data = {};

  // create an array for rooms
  var roomsRef = ref.child("rooms");
  $scope.rooms = $firebaseArray(roomsRef);

  // create an array for messages
  var messagesRef = ref.child("messages");
  $scope.messages = $firebaseArray(messagesRef);

  // create array for users
  var usersRef = ref.child("users");
  $scope.users = $firebaseArray(usersRef);

  messagesRef.setPriority('name');

  $scope.data.currentRoom = $scope.rooms[0];

  $scope.messages.$loaded().then(function(){
    // wait until the data is loaded and then
    $scope.data.currentRoom = $scope.rooms[0];
  });

  /*
    Notifications
    Wait until previous messages are loaded and then watch for new ones!
  */
  $scope.messages.$loaded().then(function() {
    $scope.messages.$watch(function(res){
      // grab the messages and the user - this might need a promise? It's fast..
      var message = $scope.messages.$getRecord(res.key);
      var user = $scope.users.$getRecord(message.user);

      // is this an event we don't care about?
      if(res.event !== 'child_added') return;

      var notification = new Notification(user.github.displayName, {
        body: message.text,
        icon : user.github.cachedUserProfile.avatar_url
      }).onclick = function() {
        window.focus();
      }
    }); // end $watch
  }); // end $loaded.then()


  /*
   *  Add Messages
   */
  $scope.addQuestion = function() {
    // when we add add a question, we need to store a reference to which room it was asked in
    $scope.question.room = $scope.data.currentRoom.$id;
    $scope.question.timeAsked = (new Date()).getTime();
    $scope.question.user = $scope.data.user.uid;
    $scope.messages.$add($scope.question);
    delete $scope.question;
  };

  /*
   *  Add Room
   */
  $scope.addRoom = function() {
    $scope.rooms.$add($scope.newRoom);
    delete $scope.newRoom;
  };

  /*
   *  Authentication
   */
  $scope.toggleAuth = function() {
    var auth = $firebaseAuth(ref);
    var authData = ref.getAuth();
    if(authData) {
      ref.unauth();
      console.log("logged out");
    }
    else {
      auth.$authWithOAuthRedirect("github", { remember : true }); // this returns a promise in case we need it
    }
  }

  ref.onAuth(function(authData) {
    console.log("Saving oauth details");
    $scope.data.user = authData;
    if (authData) {
      ref.child("users").child(authData.uid).set(authData);
    }
  });

  /*
   *  Get Room by ID
   */
   $scope.roomName = function(roomId) {
    var room = $scope.rooms.$getRecord(roomId);
    return room.name;
   }

   /*
    *  Get Avatar
    */
    $scope.getAvatar = function(userId) {
      var user = $scope.users.$getRecord(userId);

      if(user.github) {
        return user.github.cachedUserProfile.avatar_url;
      }
      return "http://nicenicejpg.com/200/200"
    }

    /*
     *  Get User
     */
     $scope.getUser = function(userId, property) {
      var user = $scope.users.$getRecord(userId);
      if(!!property) {
        return user.github.cachedUserProfile[property];
      }
      return user;
     }


     /*
      *  Request Permissions
      */

    var requestNotification = function() {
      Notification.requestPermission(function(permission){
        console.log(permission);
      });
    }

    requestNotification(); // run it on page load


});

