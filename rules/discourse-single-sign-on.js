function (user, context, callback) {
    if(context.clientID === configuration.SSO_CLIENT_ID) {
        var discourse_sso = require('discourse-sso');
        var sso = new discourse_sso(context.clientMetadata.sso_secret);

        if(sso.validate(context.request.query.sso, context.request.query.sig)) {
            var nonce = sso.getNonce(context.request.query.sso);

            var userparams = {
                // Required, will throw exception otherwise
                "nonce": nonce,
                "external_id": user.user_id,
                "email": user.email,
                // Optional
                "username": user.user_metadata.nickname,
                "name": user.user_metadata.full_name,
                "require_activation": !user.email_verified,
                "suppress_welcome_message": true
            };

            var q = sso.buildLoginString(userparams);

            context.redirect = {
                url: "https://debate.partidodigital.org.uy/session/sso_login?" + q
            };
        }
    }

    callback(null, user, context);
}