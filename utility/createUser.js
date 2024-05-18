import createUniqueId from './createUniqueId.js'

export default (user, users) => {
    // Нахождение максимального ID (временное решение)
    let newId = Number(createUniqueId() + `${users.length}`)


    // Создание объекта пользователя
    const userObject = {
        id: newId,
        username: user.username,
        password: user.password,
    }

    
    // Возврат объекта с пользователем
    return userObject
}