function (user, context, callback) {
    if (!user.email_verified && context.clientID === '3yqAXfyeQCu5RcrgSQUsb0M4ojdvif4N') {
        return callback(new UnauthorizedError('Por favor verifica tu dirección de correo para validar tu cuenta y poder ingresar a la herramienta de Debate del Partido Digital'));
    }
    return callback(null, user, context);
}