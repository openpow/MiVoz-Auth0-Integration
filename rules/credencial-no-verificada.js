function(user, context, callback){
    user.app_metadata = user.app_metadata || {};
    user.app_metadata.credencial_verificada = false;
    user.user_metadata = user.user_metadata || {};
    user.user_metadata.credencial_verificada = null;

    // clean up user_metadata
    auth0.users.updateUserMetadata(user.user_id, user.user_metadata);

    // persist the app_metadata update
    auth0.users.updateAppMetadata(user.user_id, user.app_metadata)
        .then(function(){
            callback(null, user, context);
        })
        .catch(function(err){
            console.log(user);
            callback(err);
        });
}