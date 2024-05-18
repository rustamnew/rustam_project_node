export default (reqBody) => {
    // Дефолтные значения
    const validate = {
        vaild: true,
        errorMessages: [],
        errorFields: []
    }

    // Подтверждение пароля (при наличии)
    if (reqBody.password && reqBody.password_again) {
        if (reqBody.password !== reqBody.password_again ) {
            validate.vaild = false
            validate.errorMessages.push('Пароли не совпадают')
            validate.errorFields.push('password')
            validate.errorFields.push('password_again')
        }
    }

    // Минимальная длина поля
    const fields = Object.keys(reqBody)
    fields.forEach( (field) => {
        if (reqBody[field].length < 4) {
            validate.vaild = false
            validate.errorMessages.push('Слишком короткое значение')
            validate.errorFields.push(field)
        }
        
    })

    // Убрать повторы в массиве, новая структура "Set"
    validate.errorFields = Array.from(new Set(validate.errorFields)); 
    validate.errorMessages = Array.from(new Set(validate.errorMessages));

    // Возвращается объект validate
    return validate
}