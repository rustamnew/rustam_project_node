export default (formData) => {
    const validate = {
        vaild: true,
        errorMessages: [],
        errorFields: []
    }

    if (formData.password && formData.password_again) {
        if (formData.password !== formData.password_again ) {
            validate.vaild = false
            validate.errorMessages.push('Пароли не совпадают')
            validate.errorFields.push('password')
            validate.errorFields.push('password_again')
        }
    }

    const fields = Object.keys(formData)

    fields.forEach( (field) => {
        if (formData[field].length < 4) {
            validate.vaild = false
            validate.errorMessages.push('Слишком короткое значение')
            validate.errorFields.push(field)
        }
        
    })


    validate.errorFields = Array.from(new Set(validate.errorFields)); //Убрать повторы в массиве, новая структура "Set"
    validate.errorMessages = Array.from(new Set(validate.errorMessages));

    return validate
}