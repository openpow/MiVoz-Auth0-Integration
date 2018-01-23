const express = require('express');
const jwt = require('express-jwt');
const wt = require('webtask-tools');
const bodyParser = require('body-parser');
const app = express();
const ManagementClient = require('auth0').ManagementClient;
const jsonwebtoken = require('jsonwebtoken');

module.exports = wt.fromExpress((req, res) => {
  // setting up Auth0 Management API client (docs http://auth0.github.io/node-auth0/module-management.ManagementClient.html)
  const managementClient = new ManagementClient({
    domain: req.webtaskContext.secrets.AUTH0_DOMAIN,
    clientId: req.webtaskContext.secrets.NON_INTERACTIVE_CLIENT_ID,
    clientSecret: req.webtaskContext.secrets.NON_INTERACTIVE_CLIENT_SECRET
  });
  
  // to be able to parse any kind of request's bodies content
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({
    extended: true
  })); 
  
  // all routes will check the JWT
  app.use(jwt({
      getToken: function(data) {
        // grab the access token from the query string sent by Auth0 rule instead of default authorization bearer header
        return data.query.token;
      },
      secret: req.webtaskContext.secrets.CLIENT_SECRET,
      audience: req.webtaskContext.secrets.CLIENT_ID,
      issuer: `https://${req.webtaskContext.secrets.AUTH0_DOMAIN}/`
  }));
  
  var checkNickname = function(nickname, i) {
    i = (i !== undefined) ? i+1 : 1;
    var deferred = Promise.defer();
    managementClient.getUsers({ 
      q: `user_metadata.nickname.raw:"${nickname}"` 
    }).then(users => {
      if(users.length) {
        checkNickname(nickname + "" + i, i).then(newNickName => deferred.resolve(newNickname));
      } else {
        deferred.resolve(nickname);
      }
    });
    return deferred.promise;
  };
  
  // exposing an endpoint to add the custom field full_name to user_metadata from a form using method POST
  app.post('/add-full-name', (req, res) => {
    checkNickname(req.body.full_name.replace(" ", "")).then(newNickname => {
      managementClient.users.updateUserMetadata(
      { id: req.user.sub }, 
      { full_name: req.body.full_name, nickname: newNickname },
      (err, user) => {
        if (err) return res.status(500).send(JSON.stringify(err));
        
        // creating a new jwt needed by the Auth0 rule to validate the change
        jsonwebtoken.sign({
          fullNameAdded: true,
          sub: req.user.sub
        }, req.webtaskContext.secrets.CLIENT_SECRET, {
          expiresInMinutes: 5,
          audience: req.webtaskContext.secrets.CLIENT_ID,
          issuer: `https://${req.webtaskContext.secrets.AUTH0_DOMAIN}/`
        }, 
        (token) => {
          res.redirect(`https://${req.webtaskContext.secrets.AUTH0_DOMAIN}/continue?token=${token}&state=${req.body.state}`);  
        });
      });
    });
  });
  
  return app(req, res);
});
