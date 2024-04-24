import fs from 'fs'

//module.exports = 
export default (username, pathReadFile) => {

    const data = fs.readFileSync(pathReadFile, {
        encoding: 'utf8'
    })
    let users = JSON.parse(data)

    const found_user = users.find((user_found) => user_found.username === username)

    if (!found_user) {
        return false
    } else {
        return found_user
    }

}