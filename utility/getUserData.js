import fs from 'fs'

//module.exports = 
export default (username, data_type, pathReadFile) => {

    // Чтение "базы" с пользователями
    const data = fs.readFileSync(pathReadFile, {
        encoding: 'utf8'
    })
    if (!data) {
        return false 
    }

    const users_data = JSON.parse(data)
    if (!users_data) {
        return false
    }


    // Поиск данных пользователя
    const found_userdata = users_data[username]
    if (!found_userdata) {
        return false
    } 
    if (!found_userdata[data_type]) {
        return false
    }


    // Возврат данных пользователя конкретного типа
    return found_userdata[data_type]
}