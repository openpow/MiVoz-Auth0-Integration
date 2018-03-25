function(user, context, callback){
    user.app_metadata = user.app_metadata || {};
    user.app_metadata.credencial_verificada = false;

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