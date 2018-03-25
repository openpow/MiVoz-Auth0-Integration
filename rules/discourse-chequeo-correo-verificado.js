function (user, context, callback) {
    if (!user.email_verified) {
        return callback(new UnauthorizedError('Por favor verifica tu dirección de correo para validar tu cuenta y poder entrar a MiVoz'));
    }
    return callback(null, user, context);
}