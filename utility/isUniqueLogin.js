export default (login, users_list) => {
    // Поиск совпадения по логину
    const found_user = users_list.find((user) => user.login === login)

    if (found_user) {
        return false
    } else {
        return true
    }
}