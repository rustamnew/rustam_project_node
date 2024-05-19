import fs from 'fs'
import createUniqueId from './createUniqueId.js'

export default (username, data_type, data_value, pathReadFile) => {
    // Чтение "базы" с пользователями
    const data = fs.readFileSync(pathReadFile, {
        encoding: 'utf8'
    })
    let users_data = JSON.parse(data)

    // Проход по массиву, ищем ID = -1 для того чтобы назначить новый уникальный ID 
    if ( Array.isArray(data_value) ) {
        data_value.forEach((item) => {
            if (item.id === -1) {
                item.id = Number(createUniqueId() + `${data_value.length}`)
            }
        })
    }
    
    // Если не существует, то создать объект для данных пользователя
    if (!users_data[username]) {
        users_data[username] = {}
    }

    // Если нет этого типа даты, создать массив
    if (!users_data[username][data_type]) {
        users_data[username][data_type] = []
    }

    // Запись изменений в "базу"
    users_data[username][data_type].push(data_value)
    fs.writeFileSync(pathReadFile, JSON.stringify(users_data, null, 4), {
        encoding: 'utf8',
        flag: 'w',
    })

    // Возвращение пользовательских данных конкретного типа
    return users_data[username][data_type]
}