import fs from 'fs'

export default (reqBody, pathReadFile) => {
    let success = false

    const data = fs.readFileSync(pathReadFile, {
        encoding: 'utf8'
    })
    let users = JSON.parse(data)

    const found_user = users.find((user_found) => user_found.username === reqBody.username)


    if (found_user && reqBody.password === found_user.password) {
        return found_user
    } else {
        return success
    }
}