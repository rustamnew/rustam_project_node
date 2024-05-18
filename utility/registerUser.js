import createUser from './createUser.js'
import isUniqueLogin from './isUniqueLogin.js'
import validateForm from './validateForm.js'
import fs from 'fs'

export default (req, res, pathReadFile) => {
    // Проверка формы на валидность
    const validate = validateForm(req.body)


    // Чтение "базы"
    const data = fs.readFileSync(pathReadFile, {
        encoding: 'utf8'
    })
    if (!data) {
        return false
    }
    let users = JSON.parse(data)


    // Проверка на уникальность логина
    if (!isUniqueLogin(req.body.username, users)) {
        validate.errorMessages.push('Такой логин уже занят')
        res.status(400)
        res.json(validate);
        return
    }


    // Если не валидная форма
    if (validate.vaild === false) {
        res.status(400)
        res.json(validate);
        return
    }


    // Создание пользователя
    const user = createUser(req.body, users)


    // Добавление пользователя в "базу"
    users.push(user)


    // Сохранение "базы"
    users = JSON.stringify(users, null, 4)
    fs.writeFileSync(pathReadFile, users, {
        encoding: 'utf8',
        flag: 'w',
    })


    // Возврат объекта с пользователем
    return user
}