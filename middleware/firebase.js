var admin = require("firebase-admin");
var serviceAccount = require("../hexagonuser-fb849-firebase-adminsdk-dx65z-7fa9d33e10.json");
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    //databaseURL: "https://gatheringssports-99eef.firebaseio.com"
});

module.exports = {
    sendMessage: async function (
        TargetToken,
        sendTitle,
        sendBody,
        sendRouteName,
        sendRouteIdx,
        img_url
    ) {
        let message = {
            notification: {
                title: sendTitle,
                body: sendBody,
                image: img_url,
            },
            token: TargetToken,
            data: {
                routeName: sendRouteName.toString(),
                routeIdx: sendRouteIdx.toString(),
            },
        };
        await admin
            .messaging()
            .send(message)
            .then(function (response) {
                return true;
            })
            .catch(function (error) {
                return false;
            });
    },
    sendMultiMessage: async function (
        TargetArray,
        sendTitle,
        sendBody,
        sendRouteName,
        sendRouteIdx,
        img_url
    ) {
        let message = {
            notification: {
                title: sendTitle,
                body: sendBody,
                image: img_url,
            },
            //topic : 'sports',
            tokens: TargetArray,
            data: {
                routeName: sendRouteName.toString(),
                routeIdx: sendRouteIdx.toString(),
            },
        };
        await admin
            .messaging()
            .sendMulticast(message)
            .then(function (response) {
                return true;
            })
            .catch(function (error) {
                return false;
            });
    },
};

/*
admin.initializeApp({
  credential: admin.credential.cert({
    type: "service_account",
    project_id: "xy-dating",
    private_key_id: "628a45a5eaa93ad87c90af7df74ed94adccad04d",
    private_key:
      "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCaDyu4vedg/qQz\ns17qGe0WPNWtV2KRy2GY+MYQqmL5ke0MM2h5avARTEJNoU/e9eXcLjly8Owt9Lyg\n87lcVYt44B4BS++hgfJSHo2+U3qY5Q9VhqgWfxDcgVqbJHhRq4//cjpZXlImihW0\nXzKTvpIzotmpBIhWXAzpM2uoUdR+SSZN5gYwNPUxCRHBRrIFO9xwSGJXprBT21/0\nY/vDXhPYbU4J1EZqHYIzLEeYXusGXYFJoNTZ5VEOBSOSPr7NBxvHnFIDdc/bkOg8\nJAOOIoZ8QcMgTYSIKhZo7SKs+Bjk3XDLG8lGYJK4ud/eK5UVG+t4Deh5wUT4W7ir\ngPwHA9lNAgMBAAECggEAGaYS8mPzhKuAbPcdAz6jwUMJlB1rVLiWnCA24Ylshv5r\nh897QlOyej7G/yOvJ4Cq7zhm6iMAPzpyuR06rAu1977gX/jjgXEgBdn+YUSGsbPZ\nFLUhgPVQulVy30d4HKjChZXf7wcMCEyPBoOe6QgeUSh4snIFvNMAd0bPUqulBA0p\nicFQmcAHjArvKAok3aldvCzMntNz0zJR5i+209ef3ky00GuDY7sXAI8Ttqmjra9x\nnsWdn1p0nT8Q+aRV764C/sbkqSBjHJhsEzpaePYE47Y2tPu2bqIm0GD6/XAWd+hU\nb8k0WnoUqYqyPfL5PtnW5vL4xr8cMy+uf25cPsVupQKBgQDHcM0nwS9Ns4MS82yO\nyJ4YWg7JtMqzrt9Avv7WMZvSUNzud2QsW62EVXTyOEXFBhvJnwrM/e+rlPaXm4Bs\np7cvG9F8XQkmDdSljm/t82M7ndsXbvGpjqBMj2+pR18piLFwnsF01+Ef2tunQW/x\nui+xVU8I4alCkgwwls2qfNAEgwKBgQDFv7m4SDNCLWMyGAieg33A9B8Qm+mmeYde\ntbiOSw42COBIvW/lJIEmKNdmglhlP5pODmnpbdMQNggi4cK34QmRYhlafqF+0hY/\nQt5M8f4y93rottzXwJS2JuvhX4TOazFRj+m0zMKeZglNsJ/IkibRo3DR5goA5B6k\nm9MeLV5h7wKBgDP/rg2iabHpjtAfFXu4xLd2q4pdj8f/XQflhE3WS1kvahrmmACU\nuo3ZNg99KnuvFwmfZNKDlrx2r0Bh877gj3tB1oGFREBetMWheH9iyMmfY6MdcvaR\nUCwF7cgF6sLKd/D0A15ydqi2iDR4dDZjI9IpetzG8TmBGJqGhwLfXeD/AoGAV4lm\nmigD4NCcr6kp75l/inHGaqDKDnKPtSI2P28ELHFDb4/EP6goL482wt8CaFd+Y/1H\nbxi5rNxuP5q2ipVomd3WIVQbAzvWs0xTgbZB86fP1cJVAoDyk6upEUwqSwHyhAtz\nxiA6Kso6ZhTAtpXT70stfw0Y8ooI8o80JpCozisCgYEAimPRo3+d7Y9A0MEzmqGH\nlead73Iz9rwRuS/VNKaJ1iB+xWJexDHpiO2SpIYczmlw/UVaId+M1fhbqJNMXMw7\nqKhKLbysUbOqLmwC1pxURnqCXN9SEzIQDona9O4KbgnIKZpG68KoCAHQe1EdwLYT\n+dLiIWx4nsxThxsVmeuNIAQ=\n-----END PRIVATE KEY-----\n",
    client_email: "firebase-adminsdk-nnmcj@xy-dating.iam.gserviceaccount.com",
    client_id: "114532557258605121622",
    auth_uri: "https://accounts.google.com/o/oauth2/auth",
    token_uri: "https://oauth2.googleapis.com/token",
    auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
    client_x509_cert_url:
      "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-nnmcj%40xy-dating.iam.gserviceaccount.com",
  }),
  databaseURL: "https://xy-dating.firebaseio.com",
});
*/
/*

var serviceAccount = require("../gatheringssports-99eef-firebase-adminsdk-okym4-3ebe079a36.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://gatheringssports-99eef.firebaseio.com"
});


const sendMsg = async (message) => {
  if (!message) {
    var registrationToken =
      "cFZvkXK2QCSkQ6KpZHoM6X:APA91bGSJfuBUJ4QFPcaTytOsN0mHiFrq5vVrb7zBNH7SLm7oYViaJB5ighmJh7f07cyBZLl913rRnGgFnDg1lUxa7ejtxe5K7roHoL_yuKS-xMFraV2Mc_GIkcEswLSZ7FPV8aGFTXe";
    message = {
      notification: {
        body: message,
        title: "titletitletitletitletitletitle from noh",
      },
      token: registrationToken,
    };
  }

  var data = await admin.messaging().send(message);
  console.log(data);

  return data;
};

const sendMsgV2 = async (message) => {
  if (!message) {
    var registrationToken =
      "e91ee5RRnH8:APA91bGKbuOxRV9Hk1PnHaqTTCG3HVaPEjq6hbkiKaoDvWtPggqbeCoXuKy03RRl3Ga920fubYwn1OWkz5hExWcL61-mOx-aPaq_FOOi4BUC3w_M93QeXB4MaA2FzrHoIbCUEaI54opm";
    message = {
      notification: {
        body: "ttttttt222",
        title: "ttttttaaaaa222a",
      },
      token: registrationToken,
    };
  }

  var data = await admin.messaging().send(
    [
      "dZnuBpffnUGCvREcQzcz-h:APA91bEuAtWM175UDpUzhMcn331f4MTxEgf8r7nmnu8OblFh0O4uOp3C1YLnpbi2jn2nvg6bNPqpznQ7VxQadpC9208288OM8UM3r65SAAFSs6dYmVZ4NYdmmZNllvc2446RXVwprKy3",
      "efngs9pfQRSeeC1kCfHAej:APA91bHHkY_xIP17184-epa5luSLzlWwn1VD0TaKYfprhM83lnPlSdoEN8Y2vduOBXZocOTiGnvS478JgwBhp6JRe08fELyiRqdrVMsdthX7Aocey8Q0d0gL89F0uwaTsyqnGJsT0xSs",
    ], // device fcm tokens...
    {
      data: {
        owner: JSON.stringify("ttt"),
        user: JSON.stringify("test"),
        picture: JSON.stringify(
          "https://www.apple.com/ac/structured-data/images/knowledge_graph_logo.png?201812022340"
        ),
      },
    },
    {
      // Required for background/quit data-only messages on iOS
      contentAvailable: true,
      // Required for background/quit data-only messages on Android
      priority: "high",
    }
  );
  console.log(data);

  return data;
};

const subscribeSubject = async () => {
  var registrationTokens = [
    "e91ee5RRnH8:APA91bGKbuOxRV9Hk1PnHaqTTCG3HVaPEjq6hbkiKaoDvWtPggqbeCoXuKy03RRl3Ga920fubYwn1OWkz5hExWcL61-mOx-aPaq_FOOi4BUC3w_M93QeXB4MaA2FzrHoIbCUEaI54opm",
    "cXK4EmZQLLw:APA91bG7SCg1VU120JMgpxCILufSs-KfFuhZ3FBqn5SEFetsy6sQcwrDi24H2WRLK4JWkeIWQx3iSb8weGfHVjtkgLU1_7n8vQwziIX1Bq10E_e5Gx5vmaORNxcSZIBBzf11E--YZ8sY",
  ];

  // Subscribe the devices corresponding to the registration tokens to the
  // topic.

  var topic = "test_ppap";
  var data = await admin
    .messaging()
    .subscribeToTopic(registrationTokens, topic);

  console.log(data);

  return data;
};

const sendSubject = async () => {
  var topic = "test_ppap";

  // See documentation on defining a message payload.
  var message = {
    notification: {
      body: "test_ppap --ttttt",
      title: "tttt",
    },
    topic: topic,
  };

  // Send a message to devices subscribed to the provided topic.
  var data = await admin.messaging().send(message);
  console.log(data);

  return data;
};

var firebase = async function (req, res, next) {
  req.sendMsg = sendMsg;
  req.sendMsgV2 = sendMsgV2;
  req.subscribeSubject = subscribeSubject;
  req.sendSubject = sendSubject;
  req.firebaseAdmin = admin;
  next();
};

module.exports = firebase;

// https://firebase.google.com/docs/cloud-messaging/concept-options
*/
