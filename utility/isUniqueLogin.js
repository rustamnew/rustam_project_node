export default (username, users_list) => {
    // Поиск совпадения по логину
    const found_user = users_list.find((user) => user.username === username)

    if (found_user) {
        return false
    } else {
        return true
    }
}