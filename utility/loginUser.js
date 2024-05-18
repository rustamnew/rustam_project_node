import fs from 'fs'
import validateForm from './validateForm.js'

export default (req, res, pathReadFile) => {
    // Проверка формы на валидность
    const validate = validateForm(req.body)


    // Прервать если не валидная форма
    if (validate.vaild === false) {
        res.status(400)
        res.json(validate);
        return
    }


    // Чтение "базы" с пользователями
    const data = fs.readFileSync(pathReadFile, {
        encoding: 'utf8'
    })
    const users = JSON.parse(data)


    // Поиск пользователя 
    let user = users.find((user_found) => (user_found.username === req.body.username && user_found.password === req.body.password))


    // Прервать если не найден пользователь
    if (!user) {
        validate.errorMessages.push('Пользователь не найден')
        res.status(404)
        res.json(validate);
        return
    }


    // Возврат объекта с пользователем
    return user
}