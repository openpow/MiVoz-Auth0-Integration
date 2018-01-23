function(user, context, callback) {
    var Promise = require('bluebird');
    var ManagementClient = require('auth0@2.6.0').ManagementClient;

    var management = new ManagementClient({
        token: auth0.accessToken,
        domain: auth0.domain
    });

    function verifyToken(clientId, clientSecret, issuer, token, cb) {
        jwt.verify(
            token,
            clientSecret, {
                audience: clientId,
                issuer: issuer
            },
            cb
        );
    }
    function createToken(clientId, clientSecret, issuer, user) {
        var options = {
            expiresInMinutes: 5,
            audience: clientId,
            issuer: issuer
        };
        return jwt.sign(user, clientSecret, options);
    }
    function postVerify(err, decoded) {
        if (err) {
            return callback(new UnauthorizedError("Hubo un error al actualizar el nombre completo"));
        } else if (decoded.sub !== user.user_id) {
            return callback(new UnauthorizedError("Hubo un error al identificar al usuario"));
        } else if (!decoded.fullNameAdded) {
            return callback(new UnauthorizedError("Hubo un error al confirmar el ingreso de un nombre completo"));
        } else {
            return callback(null, user, context);
        }
    }
    function comprobarNombreCompleto(user) {
        return user.user_metadata.full_name === undefined;
    }
    function checkNickname(nickname, i) {
        i = (i !== undefined) ? i+1 : 1;
        var resolve, reject;
        var promise = new Promise(function() {
            resolve = arguments[0];
            reject = arguments[1];
        });
        management.getUsers({
            q: 'user_metadata.nickname.raw:"' + nickname + '"'
        }).then(function(users) {
            if(users.length) {
                checkNickname(nickname + "" + i, i).then(function(newNickname){
                    resolve(newNickname);
                });
            } else {
                resolve(nickname);
            }
        });
        return promise;
    }
    if(context.clientID === configuration.CLIENT_ID) {
        if (context.protocol !== "redirect-callback") {
            if (comprobarNombreCompleto(user)) {
                var token = createToken(
                    configuration.CLIENT_ID,
                    configuration.CLIENT_SECRET,
                    configuration.ISSUER, {
                        sub: user.user_id,
                        email: user.email,
                        avatar: user.picture
                    }
                );
                context.redirect = {
                    url: "https://partidodigital.org.uy/plataforma/tareas/nombre-completo?token=" + token
                };
            } else {
                if(user.user_metadata.nickname === undefined) {
                    checkNickname(user.user_metadata.full_name.replace(" ", ""))
                        .then(function(newNickname){
                            user.user_metadata.nickname = newNickname;
                            auth0.users.updateUserMetadata(user.user_id, user.user_metadata);
                        });
                }
            }
        } else {
            verifyToken(
                configuration.CLIENT_ID,
                configuration.CLIENT_SECRET,
                configuration.ISSUER,
                context.request.query.token,
                postVerify
            );
        }
    }
    return callback(null, user, context);
}