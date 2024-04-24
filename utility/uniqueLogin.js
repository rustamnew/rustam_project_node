import fs from 'fs'

export default (login, pathReadFile) => {
    const data = fs.readFileSync(pathReadFile, {
        encoding: 'utf8'
    })
    const users = JSON.parse(data)
    const found_user = users.find((user) => user.login === login)

    if (found_user) {
        return false
    } else {
        return true
    }
    
}