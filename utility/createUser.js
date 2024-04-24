export default (user, userList) => {
    // Нахождение максимального ID (временное решение)
    let newId = 1
    userList.forEach(item => {
        if (item.id > newId) {
            newId = item.id + 2
        }
    });

    // Создание и возвращение объекта пользователя
    const userObject = {
        id: newId,
        username: user.username,
        password: user.password,
    }

    return userObject
}