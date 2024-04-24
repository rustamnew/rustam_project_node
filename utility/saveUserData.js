import fs from 'fs'
import createUniqueId from './createUniqueId.js'

export default (username, data_type, data_value, pathReadFile) => {
    const data = fs.readFileSync(pathReadFile, {
        encoding: 'utf8'
    })
    let users_data = JSON.parse(data)

    // Проход по массиву, ищем ID = -1 для того чтобы назначить новый уникальный ID 
    if ( Array.isArray(data_value) ) {
        data_value.forEach((item) => {
            if (item.id === -1) {
                item.id = createUniqueId()
            }
        })
    }
    
    if (!users_data[username]) {
        users_data[username] = {}
    }
    if (!users_data[username][data_type]) {
        users_data[username][data_type] = {}
    }

    users_data[username][data_type] = data_value

    fs.writeFileSync(pathReadFile, JSON.stringify(users_data, null, 4), {
        encoding: 'utf8',
        flag: 'w',
    })

    return users_data[username][data_type]
}